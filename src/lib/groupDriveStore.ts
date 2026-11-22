import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react';
import { realNowMs } from './appClock';
import { supabase } from './backend/client';
import { isNetworkError, OFFLINE } from './backend/outbox';
import { groupFromRow, memberFromRow, POLL_MS, expiryOf, type GroupInfo, type GroupMember } from './groupLive';
import { useStore } from './store';
import type { NavTarget } from './navPlan';
import type { LatLng } from './types';

/**
 * Group drive for the screens (src/lib/groupLive.ts has the rules). Kept in memory only: nothing about
 * a group is saved on the phone. Signed in it talks to the RPCs in
 * supabase/migrations/20261122180000_group_drive.sql; the demo makes a group on the phone (nothing is
 * sent anywhere) and the driving view fills it with made-up members.
 *
 * Until the migration is applied the functions don't exist: `available` turns false and every screen
 * hides the feature.
 */

export interface GroupState {
  /** null: not known yet; false: the server hasn't got group drives (hide everything). */
  available: boolean | null;
  group: GroupInfo | null;
  members: GroupMember[];
}

let state: GroupState = { available: null, group: null, members: [] };
const listeners = new Set<() => void>();
function set(next: Partial<GroupState>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}
function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

/** Sign-out or a new session: forget everything. */
export function resetGroupDrive() {
  set({ available: null, group: null, members: [] });
}

/** The function isn't there (migration not applied yet). */
export function isMissingFunction(e: unknown): boolean {
  const x = e as { code?: string; message?: string } | null;
  const m = `${x?.message ?? ''}`;
  return x?.code === 'PGRST202' || x?.code === '42883' || /could not find the function|does not exist/i.test(m);
}

type Result<T> = { data: T | null; error: { message: string; code?: string } | null };

async function rpc<T>(name: string, args: Record<string, unknown> = {}): Promise<T> {
  let res: Result<T>;
  try {
    res = (await supabase().rpc(name, args)) as unknown as Result<T>;
  } catch (e) {
    throw new Error(isNetworkError(e) ? OFFLINE : e instanceof Error ? e.message : String(e));
  }
  if (res.error) {
    if (isMissingFunction(res.error)) {
      set({ available: false });
      throw new Error('Group drives aren’t on yet.');
    }
    throw new Error(isNetworkError(res.error) ? OFFLINE : res.error.message);
  }
  if (state.available === null) set({ available: true });
  return res.data as T;
}

export interface GroupPreview extends GroupInfo {
  leaderHandle: string | null;
  joined: boolean;
}

function previewFrom(r: Record<string, unknown> | null): GroupPreview | null {
  const g = groupFromRow(r);
  if (!g || !r) return null;
  return { ...g, leaderHandle: typeof r.leader_handle === 'string' ? r.leader_handle : null, joined: r.joined === true };
}

let demoSeq = 0;
const DEMO_ME = 'demo-me';

export interface GroupDriveApi {
  available: boolean | null;
  group: GroupInfo | null;
  members: GroupMember[];
  /** Am I the one who started it (and so can end it for everyone). */
  leading: boolean;
  start(target: NavTarget | null, title: string): Promise<GroupInfo>;
  preview(code: string): Promise<GroupPreview>;
  join(code: string): Promise<GroupInfo>;
  leave(): Promise<void>;
  end(): Promise<void>;
  /** The group of a meet I'm going to (for "Join the group drive"), or null. */
  forEvent(eventId: string): Promise<(GroupInfo & { joined: boolean }) | null>;
  /** Read it now (the driving view calls this every 5 s). */
  refresh(): Promise<void>;
  /** My position (null: clear it). False when the group has gone. */
  post(at: LatLng | null, heading: number | null, speed: number | null): Promise<boolean>;
}

export function useGroupDrive(): GroupDriveApi {
  const { backend, me } = useStore();
  const snap = useSyncExternalStore(subscribe, () => state, () => state);
  const demo = backend === 'local';

  const refresh = useCallback(async () => {
    if (demo) {
      if (state.available === null) set({ available: true });
      return;
    }
    try {
      const r = await rpc<Record<string, unknown>>('group_drive_read');
      if (!r || r.active !== true) {
        if (state.group) set({ group: null, members: [] });
        return;
      }
      const group = groupFromRow(r.group as Record<string, unknown>);
      const rows = Array.isArray(r.members) ? (r.members as Record<string, unknown>[]) : [];
      const members = rows.map(memberFromRow).filter((m): m is GroupMember => !!m);
      set({ group: group ? { ...group, memberCount: members.length + 1 } : null, members });
    } catch {
      // Offline or busy: keep what we have; the next poll tries again.
    }
  }, [demo]);

  const api = useMemo<Omit<GroupDriveApi, 'available' | 'group' | 'members' | 'leading' | 'refresh'>>(
    () => ({
      async start(target, title) {
        if (demo) {
          const now = realNowMs();
          const g: GroupInfo = {
            id: `demo-group-${demoSeq++}`,
            code: '0123456789abcdef',
            title,
            targetKind: target?.kind === 'event' || target?.kind === 'spot' ? target.kind : 'none',
            targetId: target && target.kind !== 'place' ? target.id : null,
            leaderId: DEMO_ME,
            startedAt: now,
            expiresAt: expiryOf(now),
            memberCount: 4,
            demo: true,
          };
          set({ available: true, group: g, members: [] });
          return g;
        }
        const r = await rpc<Record<string, unknown>>('group_drive_start', {
          p_target_kind: target && target.kind !== 'place' ? target.kind : 'none',
          p_target_id: target && target.kind !== 'place' ? target.id : null,
        });
        const g = groupFromRow(r);
        if (!g) throw new Error('Couldn’t start the group drive.');
        set({ group: g, members: [] });
        return g;
      },
      async preview(code) {
        if (demo) throw new Error('Joining a group drive needs a signed-in account.');
        const p = previewFrom(await rpc<Record<string, unknown>>('group_drive_preview', { p_code: code }));
        if (!p) throw new Error('That group drive has ended, or the link is wrong.');
        return p;
      },
      async join(code) {
        if (demo) throw new Error('Joining a group drive needs a signed-in account.');
        const g = groupFromRow(await rpc<Record<string, unknown>>('group_drive_join', { p_code: code }));
        if (!g) throw new Error('That group drive has ended, or the link is wrong.');
        set({ group: g, members: [] });
        return g;
      },
      async leave() {
        const was = state.group;
        set({ group: null, members: [] });
        if (demo || !was) return;
        await rpc('group_drive_leave').catch(() => undefined);
      },
      async end() {
        const was = state.group;
        set({ group: null, members: [] });
        if (demo || !was) return;
        await rpc('group_drive_end');
      },
      async forEvent(eventId) {
        if (demo) {
          const g = state.group;
          return g && g.targetKind === 'event' && g.targetId === eventId ? { ...g, joined: true } : null;
        }
        if (state.available === false) return null;
        try {
          const r = await rpc<Record<string, unknown> | null>('group_drive_for_event', { p_event_id: eventId });
          const g = groupFromRow(r);
          return g && r ? { ...g, joined: r.joined === true } : null;
        } catch {
          return null;
        }
      },
      async post(at, heading, speed) {
        if (demo) return true;
        try {
          const ok = await rpc<boolean>('group_drive_post_position', {
            p_lat: at ? at.lat : null,
            p_lng: at ? at.lng : null,
            p_heading: heading,
            p_speed: speed,
          });
          if (!ok && state.group) set({ group: null, members: [] });
          return ok !== false;
        } catch {
          return true;
        }
      },
    }),
    [demo],
  );

  const leading = !!snap.group && (snap.group.demo ? true : snap.group.leaderId === me);
  return { available: demo ? true : snap.available, group: snap.group, members: snap.members, leading, refresh, ...api };
}

/**
 * Reads the group once on mount (it also learns whether the server has group drives), and with `keep`
 * every 5 s while you are in one (the driving view).
 */
export function useGroupPoll(keep = true) {
  const { refresh, group } = useGroupDrive();
  useEffect(() => {
    void refresh();
  }, [refresh]);
  const inGroup = !!group && !group.demo;
  useEffect(() => {
    if (!keep || !inGroup) return;
    const t = setInterval(() => void refresh(), POLL_MS);
    return () => clearInterval(t);
  }, [keep, inGroup, refresh]);
}
