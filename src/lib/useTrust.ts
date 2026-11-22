import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from './backend/client';
import { useNow } from './clock';
import { appNowMs } from './appClock';
import { useStore } from './store';
import {
  addRecords,
  canConfirmSeen,
  DEMO_HOST_RECORDS,
  DEMO_SEEN_OWNERS,
  hostRecordFromEvents,
  seenInPerson,
  SEEN_NEEDED,
  sharedMeets,
  trustSignal,
  witnessCount,
  type HostRecord,
  type Sighting,
  type TrustSignal,
} from './trust';
import type { Build, NightEvent } from './types';

/**
 * The trust features behind one set of hooks (level-up, profile area): the quiet alert, "Seen in
 * person" and the host's trust signal. In the demo they run on the phone (saved in AsyncStorage). Signed
 * in they call the functions in supabase/migrations/20261122170000_lvl_profile.sql; until that migration
 * is applied the probe below fails and every screen hides its part of this, never an error.
 */

const KEY = 'slipstream.trust.v1';

interface LocalTrust {
  sightings: Sighting[];
  /** Event ids you sent a quiet alert for. */
  alerts: string[];
  /** When each sighting was sent (ISO), for the daily limit. */
  sentAt: string[];
}

const EMPTY: LocalTrust = { sightings: [], alerts: [], sentAt: [] };

async function loadLocal(): Promise<LocalTrust> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? { ...EMPTY, ...(JSON.parse(raw) as Partial<LocalTrust>) } : EMPTY;
  } catch {
    return EMPTY;
  }
}

async function saveLocal(s: LocalTrust): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // Full or blocked: it lives for this session only.
  }
}

let probe: Promise<boolean> | null = null;

/** Is the migration live on the server? One cheap read-only call, remembered. */
function serverHasTrust(): Promise<boolean> {
  if (!probe) {
    probe = Promise.resolve(supabase().rpc('host_records', { p_hosts: [] }))
      .then((r) => !r.error)
      .catch(() => false);
    // A failed probe may be a bad connection: try again next time.
    probe.then((ok) => {
      if (!ok) probe = null;
    });
  }
  return probe;
}

function useLive(): boolean {
  const { backend } = useStore();
  const [live, setLive] = useState(backend === 'local');
  useEffect(() => {
    if (backend === 'local') return setLive(true);
    let alive = true;
    serverHasTrust().then((ok) => alive && setLive(ok));
    return () => {
      alive = false;
    };
  }, [backend]);
  return live;
}

function useLocal(): [LocalTrust, (fn: (s: LocalTrust) => LocalTrust) => Promise<void>] {
  const [state, setState] = useState<LocalTrust>(EMPTY);
  useEffect(() => {
    let alive = true;
    loadLocal().then((s) => alive && setState(s));
    return () => {
      alive = false;
    };
  }, []);
  const update = useCallback(async (fn: (s: LocalTrust) => LocalTrust) => {
    const next = fn(await loadLocal());
    setState(next);
    await saveLocal(next);
  }, []);
  return [state, update];
}

/** The server's sentence from a failed call, or a plain fallback. */
function sentence(e: unknown, fallback: string): Error {
  const m = e && typeof e === 'object' && 'message' in e ? String((e as { message: unknown }).message) : '';
  return new Error(m && m.length < 160 && !/function|schema|PGRST|permission/i.test(m) ? m : fallback);
}

// ---------------------------------------------------------------------------
// Host trust signal
// ---------------------------------------------------------------------------

/** The one trust signal for the host of a meet (null: say nothing). Crew meets say nothing: there is no single host. */
export function useHostTrust(event: Pick<NightEvent, 'hostIds' | 'crewId'>): TrustSignal | null {
  const { backend, events } = useStore();
  const now = useNow();
  const live = useLive();
  const host = event.crewId ? undefined : event.hostIds[0];
  const [remote, setRemote] = useState<HostRecord | null>(null);
  useEffect(() => {
    setRemote(null);
    if (backend === 'local' || !host || !live) return;
    let alive = true;
    Promise.resolve(supabase().rpc('host_records', { p_hosts: [host] }))
      .then((r) => {
        const row = (r.data as { meets_run: number; upheld: number }[] | null)?.[0];
        if (alive && row) setRemote({ meetsRun: row.meets_run, upheld: row.upheld });
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [backend, host, live]);
  return useMemo(() => {
    if (!host) return null;
    if (backend === 'supabase') return trustSignal(remote);
    const known = DEMO_HOST_RECORDS[host] ?? { meetsRun: 0, upheld: 0 };
    return trustSignal(addRecords(hostRecordFromEvents(events, host, now), known));
  }, [backend, host, remote, events, now]);
}

// ---------------------------------------------------------------------------
// Quiet alert
// ---------------------------------------------------------------------------

export function useQuietAlert(eventId: string): { live: boolean; sent: boolean; send: () => Promise<void> } {
  const { backend } = useStore();
  const live = useLive();
  const [local, update] = useLocal();
  const [sentNow, setSentNow] = useState(false);
  const send = useCallback(async () => {
    if (backend === 'local') {
      // The demo has no real host to tell: it keeps the alert on the phone so the screen can say it was sent.
      await update((s) => ({ ...s, alerts: s.alerts.includes(eventId) ? s.alerts : [...s.alerts, eventId] }));
    } else {
      const r = await Promise.resolve(supabase().rpc('quiet_alert', { p_event: eventId })).catch((e) => ({ error: e }));
      if (r.error) throw sentence(r.error, "Couldn't send that. If someone is in danger, call 999.");
    }
    setSentNow(true);
  }, [backend, eventId, update]);
  return { live, sent: sentNow || local.alerts.includes(eventId), send };
}

// ---------------------------------------------------------------------------
// Seen in person
// ---------------------------------------------------------------------------

export interface SeenState {
  live: boolean;
  /** Different people who've confirmed it. */
  count: number;
  /** Enough people: the mark shows. */
  seen: boolean;
  /** You already confirmed this vehicle. */
  mine: boolean;
  /** The latest meet you and the owner were both at, if you can still confirm. */
  meet: NightEvent | null;
  confirm: () => Promise<void>;
}

export function useSeen(build: Pick<Build, 'id' | 'ownerId'>): SeenState {
  const { backend, me, events } = useStore();
  const live = useLive();
  const [local, update] = useLocal();
  const [remote, setRemote] = useState<{ witnesses: number; mine: boolean } | null>(null);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    setRemote(null);
    if (backend === 'local' || !live) return;
    let alive = true;
    Promise.resolve(supabase().rpc('vehicle_seen', { p_build_ids: [build.id] }))
      .then((r) => {
        const row = (r.data as { witnesses: number; mine: boolean }[] | null)?.[0];
        if (alive) setRemote(row ? { witnesses: row.witnesses, mine: row.mine } : { witnesses: 0, mine: false });
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [backend, build.id, live, tick]);

  const demoBase = backend === 'local' && DEMO_SEEN_OWNERS.includes(build.ownerId) ? SEEN_NEEDED : 0;
  const mineLocal = local.sightings.some((s) => s.buildId === build.id && s.witnessId === me);
  const count = backend === 'local' ? demoBase + witnessCount(local.sightings, build.id) : (remote?.witnesses ?? 0);
  const mine = backend === 'local' ? mineLocal : !!remote?.mine;
  const meet = useMemo(() => {
    if (build.ownerId === me || mine) return null;
    const shared = sharedMeets(events, me, build.ownerId)
      .filter((e) => new Date(e.startsAt).getTime() <= appNowMs())
      .sort((a, b) => b.startsAt.localeCompare(a.startsAt));
    return shared[0] ?? null;
  }, [events, me, build.ownerId, mine]);

  const confirm = useCallback(async () => {
    if (!meet) throw new Error('Only people who were both at the same meet can confirm this.');
    if (backend === 'local') {
      const today = new Date(appNowMs()).toISOString().slice(0, 10);
      const sentToday = local.sentAt.filter((t) => t.startsWith(today)).length;
      const check = canConfirmSeen(meet, build.ownerId, me, build.id, local.sightings, sentToday);
      if (!check.ok) throw new Error(check.reason);
      await update((s) => ({
        ...s,
        sightings: [...s.sightings, { buildId: build.id, eventId: meet.id, witnessId: me }],
        sentAt: [...s.sentAt, new Date(appNowMs()).toISOString()].slice(-50),
      }));
    } else {
      const r = await Promise.resolve(supabase().rpc('confirm_vehicle_seen', { p_build: build.id, p_event: meet.id })).catch((e) => ({ error: e }));
      if (r.error) throw sentence(r.error, "Couldn't confirm that. Try again later.");
      setTick((t) => t + 1);
    }
  }, [backend, meet, build.ownerId, build.id, me, local, update]);

  return { live, count, seen: backend === 'local' ? seenInPerson([...local.sightings], build.id) || demoBase >= SEEN_NEEDED : count >= SEEN_NEEDED, mine, meet, confirm };
}
