import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ME, seed, type SeedState } from '../data/seed';
import { castVote as applyVote, type AwardCategory } from './awards';
import { checkIn as applyCheckIn, moveOn as applyMoveOn } from './events';
import type { Build, ChatMessage, LatLng, NightEvent } from './types';

/**
 * Phase 1 keeps everything on the phone. Every read and write goes through this
 * store, so moving to Supabase later only replaces this file.
 */

const KEY = 'nightshift.v1';

export interface Settings {
  /** Demo builds skip the GPS distance check when checking in. */
  simulateGps: boolean;
  cruiseMode: boolean;
  hideHomeZone: boolean;
  pttStrangers: boolean;
}

const DEFAULT_SETTINGS: Settings = { simulateGps: true, cruiseMode: false, hideHomeZone: true, pttStrangers: false };

interface Persisted extends SeedState {
  settings: Settings;
  /** Notices for the current user, e.g. "the meet moved on". */
  notices: Notice[];
}

export interface Notice {
  id: string;
  eventId: string;
  text: string;
  at: string;
  read: boolean;
}

interface Store extends Persisted {
  ready: boolean;
  me: string;
  now: Date;
  saveBuild: (b: Build) => void;
  deleteBuild: (id: string) => void;
  saveEvent: (e: NightEvent) => void;
  setGoing: (eventId: string, going: boolean) => void;
  checkIn: (eventId: string, stopIndex: number) => void;
  moveOn: (eventId: string) => void;
  cancelEvent: (eventId: string) => void;
  sendChat: (eventId: string, text: string) => void;
  /** Throws with a readable reason if the vote isn't allowed. */
  vote: (eventId: string, category: AwardCategory, buildId: string) => void;
  setSettings: (patch: Partial<Settings>) => void;
  markNoticesRead: () => void;
  resetDemo: () => void;
}

const Ctx = createContext<Store | null>(null);

function fresh(): Persisted {
  return { ...seed(new Date()), settings: DEFAULT_SETTINGS, notices: [] };
}

export function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Persisted>(fresh);
  const [ready, setReady] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const loaded = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Persisted;
          setState({ ...fresh(), ...parsed, settings: { ...DEFAULT_SETTINGS, ...parsed.settings } });
        }
      } catch {
        // Unreadable storage: start from the demo scene.
      }
      loaded.current = true;
      setReady(true);
    })();
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    AsyncStorage.setItem(KEY, JSON.stringify(state)).catch(() => {});
  }, [state]);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  const updateEvent = useCallback((id: string, fn: (e: NightEvent) => NightEvent) => {
    setState((s) => ({ ...s, events: s.events.map((e) => (e.id === id ? fn(e) : e)) }));
  }, []);

  const store = useMemo<Store>(
    () => ({
      ...state,
      ready,
      me: ME,
      now,
      saveBuild: (b) =>
        setState((s) => ({
          ...s,
          builds: s.builds.some((x) => x.id === b.id) ? s.builds.map((x) => (x.id === b.id ? b : x)) : [...s.builds, b],
        })),
      deleteBuild: (id) => setState((s) => ({ ...s, builds: s.builds.filter((b) => b.id !== id) })),
      saveEvent: (e) =>
        setState((s) => ({
          ...s,
          events: s.events.some((x) => x.id === e.id) ? s.events.map((x) => (x.id === e.id ? e : x)) : [e, ...s.events],
        })),
      setGoing: (eventId, going) =>
        updateEvent(eventId, (e) => ({
          ...e,
          going: going ? Array.from(new Set([...e.going, ME])) : e.going.filter((u) => u !== ME),
        })),
      checkIn: (eventId, stopIndex) => updateEvent(eventId, (e) => applyCheckIn(e, stopIndex, ME)),
      moveOn: (eventId) =>
        setState((s) => {
          const nowDate = new Date();
          let notice: Notice | null = null;
          const events = s.events.map((e) => {
            if (e.id !== eventId) return e;
            const next = applyMoveOn(e, nowDate);
            const stop = next.stops[next.currentStop];
            notice = {
              id: newId('n'), eventId, at: nowDate.toISOString(), read: false,
              text: `${e.title} moved on to ${stop.name}. Everyone checked in at ${e.stops[e.currentStop].name} has been told.`,
            };
            return next;
          });
          return { ...s, events, notices: notice ? [notice, ...s.notices] : s.notices };
        }),
      cancelEvent: (eventId) => updateEvent(eventId, (e) => ({ ...e, cancelled: true })),
      sendChat: (eventId, text) => {
        const msg: ChatMessage = { id: newId('c'), eventId, userId: ME, text, at: new Date().toISOString() };
        setState((s) => ({ ...s, chat: [...s.chat, msg] }));
      },
      vote: (eventId, category, buildId) => {
        const event = state.events.find((e) => e.id === eventId);
        if (!event) throw new Error('Event not found.');
        const votes = applyVote(state.votes, event, state.builds, ME, category, buildId, new Date());
        setState((s) => ({ ...s, votes }));
      },
      setSettings: (patch) => setState((s) => ({ ...s, settings: { ...s.settings, ...patch } })),
      markNoticesRead: () => setState((s) => ({ ...s, notices: s.notices.map((n) => ({ ...n, read: true })) })),
      resetDemo: () => setState(fresh()),
    }),
    [state, ready, now, updateEvent],
  );

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore outside StoreProvider');
  return s;
}

export function useUser(id: string) {
  const { users } = useStore();
  return users.find((u) => u.id === id);
}

export type { LatLng };
