import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { BAN_ZONES, ME, seed, type SeedState } from '../data/seed';
import { castVote as applyVote, type AwardCategory } from './awards';
import { areaGivesAway, eventArea } from './area';
import { inferAnchor, needsRefresh, refreshDemo } from './demoTime';
import { roleOf } from './eventView';
import { migratePhotoRef } from './photos';
import {
  answerRequest as applyAnswer,
  applyEventEdit,
  applyPlanChange,
  canEditEvent,
  dropOut,
  isPublicType,
  rsvp,
  checkIn as applyCheckIn,
  moveOn as applyMoveOn,
  planChangedMessage,
  type PlanChange,
} from './events';
import {
  createCrew as applyCreateCrew,
  joinCrew as applyJoinCrew,
  leaveCrew as applyLeaveCrew,
  setCrewHost as applySetCrewHost,
  withRoles,
} from './crews';
import { applyProfile, profileProblem, type ProfileDraft } from './profile';
import {
  approveDue,
  DEMO_APPROVAL_MS,
  driveMiles,
  judgeRun,
  makeSpot,
  rateSpot as applyRating,
  recordCompletion,
  type DriveRun,
  type SpotDraft,
  type Verdict,
} from './spots';
import { notifyNow, syncReminders } from './notify';
import { dueReminders, movedOnReminder, upcomingReminders, type ReminderKind } from './reminders';
import type { Build, ChatMessage, LatLng, NightEvent, Spot } from './types';

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
  /** Local reminders at the reveal and 30 min before the start. */
  reminders: boolean;
}

const DEFAULT_SETTINGS: Settings = { simulateGps: true, cruiseMode: false, hideHomeZone: true, pttStrangers: false, reminders: true };

interface Persisted extends SeedState {
  settings: Settings;
  /** Notices for the current user, e.g. "the meet moved on". */
  notices: Notice[];
  /** False until the person has set up their profile on first run. */
  onboarded: boolean;
  /** eventId -> stop ids this person has already seen the "unlocked" moment for. */
  unlockSeen: Record<string, string[]>;
  /** When the demo scene's times were last laid out (ISO). Used to keep the demo fresh. */
  seededAt?: string;
}

export interface Notice {
  id: string;
  eventId: string;
  text: string;
  at: string;
  read: boolean;
  kind?: ReminderKind | 'host';
  /** Reminder key, so a reminder only lands in the list once. */
  key?: string;
}

interface Store extends Persisted {
  ready: boolean;
  me: string;
  now: Date;
  saveBuild: (b: Build) => void;
  deleteBuild: (id: string) => void;
  saveEvent: (e: NightEvent) => void;
  /** Host edits an event before it starts. Throws with a readable reason if not allowed. */
  editEvent: (e: NightEvent) => void;
  /** Host changes a rolling meet's stops on the night. Throws if not allowed; returns any ban-zone warning. */
  changePlan: (eventId: string, change: PlanChange) => { warning?: string };
  /** Save the person's own profile. Throws with a readable reason if something is missing. */
  saveProfile: (draft: ProfileDraft) => void;
  /** Going, or for people the invite doesn't cover, a request a host must approve. False drops out or withdraws. */
  setGoing: (eventId: string, going: boolean) => void;
  /** Host approves or declines a request to go. */
  answerRequest: (eventId: string, userId: string, approve: boolean) => void;
  checkIn: (eventId: string, stopIndex: number) => void;
  moveOn: (eventId: string) => void;
  cancelEvent: (eventId: string) => void;
  sendChat: (eventId: string, text: string) => void;
  /** Throws with a readable reason if the vote isn't allowed. */
  vote: (eventId: string, category: AwardCategory, buildId: string) => void;
  setSettings: (patch: Partial<Settings>) => void;
  markNoticesRead: () => void;
  /** Remember that the "unlocked" moment has been shown for these stops. */
  markUnlockSeen: (eventId: string, stopIds: string[]) => void;
  resetDemo: () => void;
  /** Finish a drive. Checks the run (every checkpoint, in order, at a believable pace); records only pass or fail. */
  finishDrive: (spotId: string, run: DriveRun) => Verdict;
  /** Record a photo spot visit, with an optional plate-blurred photo. The distance check happens before this. */
  visitSpot: (spotId: string, photo?: string) => void;
  /** 1–5 stars. Throws if you haven't finished it or you suggested it. */
  rateSpot: (spotId: string, stars: number) => void;
  /** Suggest a drive or photo spot. It starts pending. Throws if the draft isn't ready. */
  suggestSpot: (draft: SpotDraft) => { id: string; warning?: string };
  joinCrew: (crewId: string) => void;
  leaveCrew: () => void;
  /** Start a crew and join it. Throws with a readable reason. Returns the new crew's id. */
  createCrew: (name: string, tag: string) => string;
  /** Crew owner makes a member a host, or takes it away. Throws with a readable reason. */
  setCrewHost: (crewId: string, userId: string, host: boolean) => void;
}

const Ctx = createContext<Store | null>(null);

function fresh(): Persisted {
  const now = new Date();
  return { ...seed(now), settings: DEFAULT_SETTINGS, notices: [], onboarded: false, unlockSeen: {}, seededAt: now.toISOString() };
}

/** Keep the demo scene's times current (see demoTime.ts). Events made on the phone are left alone. */
function freshen(state: Persisted, now: Date): Persisted {
  const anchor = state.seededAt ? new Date(state.seededAt) : inferAnchor(state.events);
  if (!anchor || isNaN(anchor.getTime())) return { ...state, seededAt: state.seededAt ?? now.toISOString() };
  if (!needsRefresh(state, anchor, now)) return { ...state, seededAt: anchor.toISOString() };
  return { ...state, ...refreshDemo(state, anchor, now), seededAt: now.toISOString() };
}

/** Data saved by an older version of the app: fill in anything that's new since. */
function migrate(parsed: Persisted): Persisted {
  const base = fresh();
  let next: Persisted = { ...base, ...parsed, settings: { ...DEFAULT_SETTINGS, ...parsed.settings } };
  if (!parsed.spots) {
    // Saved before drives, photo spots and more crews arrived: add the new sample crews.
    const known = new Set(next.crews.map((c) => c.id));
    const added = base.crews.filter((c) => !known.has(c.id));
    const sampleCrew = new Map(base.users.map((u) => [u.id, u.crewId]));
    next = {
      ...next,
      crews: [...next.crews, ...added],
      users: next.users.map((u) => {
        const c = sampleCrew.get(u.id);
        return u.id !== ME && c && added.some((a) => a.id === c) ? { ...u, crewId: c } : u;
      }),
    };
  }
  // Crew roles arrived later: sample crews get their seeded owner and hosts, crews made on the phone get their first member.
  const seededCrew = new Map(base.crews.map((c) => [c.id, c]));
  next = {
    ...next,
    crews: next.crews.map((c) => {
      if (c.ownerId && c.hostIds) return c;
      const sample = seededCrew.get(c.id);
      if (sample) {
        const hostIds = (sample.hostIds ?? []).filter((h) => c.memberIds.includes(h));
        return { ...c, ownerId: c.memberIds.includes(sample.ownerId ?? '') ? sample.ownerId : c.memberIds[0], hostIds };
      }
      return withRoles(c.memberIds.includes(ME) ? { ...c, ownerId: ME } : c);
    }),
  };
  // Rough areas saved before they were fuzzed could sit right on the place: work them out again.
  next = {
    ...next,
    events: next.events.map((e) => {
      if (isPublicType(e.type) || (e.areaRadiusMiles && !areaGivesAway(e))) return e;
      const placed = e.stops.flatMap((st) => (st.at ? [st.at] : []));
      return placed.length ? { ...e, ...eventArea(placed, e.id, false) } : e;
    }),
  };
  // Photos saved as full paths: keep only the file name when it's in our photos folder.
  next = {
    ...next,
    builds: next.builds.map((b) => ({ ...b, photos: b.photos.map(migratePhotoRef) })),
    spots: next.spots.map((x) => ({
      ...x,
      completions: x.completions.map((c) => (c.photo ? { ...c, photo: migratePhotoRef(c.photo) } : c)),
    })),
  };
  return next;
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
          // Freshen before migrating, so "is this still the untouched demo?" compares like with like.
          setState(migrate(freshen(parsed, new Date())));
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

  // Demo: suggestions are approved a few seconds after they're made.
  useEffect(() => {
    const pending = state.spots.filter((x) => x.status === 'pending');
    if (pending.length === 0) return;
    const due = Math.min(...pending.map((x) => new Date(x.createdAt).getTime() + DEMO_APPROVAL_MS));
    const t = setTimeout(() => setState((s) => ({ ...s, spots: approveDue(s.spots, new Date()) })), Math.max(0, due - Date.now()) + 50);
    return () => clearTimeout(t);
  }, [state.spots]);

  // Reminders: keep the phone's scheduled notifications in line with what you're going to.
  const { events: allEvents, crews: allCrews } = state;
  const remindersOn = state.settings.reminders;
  useEffect(() => {
    if (!ready) return;
    const wanted = remindersOn ? upcomingReminders(allEvents, ME, allCrews, new Date()) : [];
    const t = setTimeout(() => {
      syncReminders(wanted).catch(() => {});
    }, 400);
    return () => clearTimeout(t);
  }, [ready, allEvents, allCrews, remindersOn]);

  // ...and put reminders that have come due into the in-app list.
  useEffect(() => {
    if (!ready) return;
    setState((s) => {
      const seen = new Set(s.notices.map((n) => n.key).filter((k): k is string => !!k));
      const due = dueReminders(s.events, ME, s.crews, now, seen);
      if (due.length === 0) return s;
      const added: Notice[] = due.map((r) => ({
        id: newId('n'), eventId: r.eventId, at: r.at.toISOString(), read: false, kind: r.kind, key: r.key, text: `${r.title}. ${r.body}`,
      }));
      return { ...s, notices: [...added.reverse(), ...s.notices].slice(0, 100) };
    });
  }, [ready, now, allEvents]);

  const updateSpot = useCallback((id: string, fn: (x: Spot) => Spot) => {
    setState((s) => ({ ...s, spots: s.spots.map((x) => (x.id === id ? fn(x) : x)) }));
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
      editEvent: (edited) => {
        const event = state.events.find((e) => e.id === edited.id);
        if (!event) throw new Error('Event not found.');
        const nowDate = new Date();
        const ok = canEditEvent(event, nowDate);
        if (!ok.ok) throw new Error(ok.reason);
        const next = applyEventEdit(event, edited, ME, nowDate, newId('pc'));
        const msg: ChatMessage = {
          id: newId('c'), eventId: event.id, userId: ME, text: 'Hosts updated the event details', at: nowDate.toISOString(), system: true,
        };
        setState((s) => ({ ...s, events: s.events.map((e) => (e.id === event.id ? next : e)), chat: [...s.chat, msg] }));
      },
      changePlan: (eventId, change) => {
        const event = state.events.find((e) => e.id === eventId);
        if (!event) throw new Error('Event not found.');
        const nowDate = new Date();
        const result = applyPlanChange(event, change, ME, nowDate, BAN_ZONES, () => newId(`${eventId}-x`));
        const msg = planChangedMessage(eventId, ME, nowDate, newId('c'));
        setState((s) => ({ ...s, events: s.events.map((e) => (e.id === eventId ? result.event : e)), chat: [...s.chat, msg] }));
        return { warning: result.warning };
      },
      saveProfile: (draft) => {
        const problem = profileProblem(draft, state.users, ME);
        if (problem) throw new Error(problem);
        setState((s) => ({ ...s, onboarded: true, users: s.users.map((u) => (u.id === ME ? applyProfile(u, draft) : u)) }));
      },
      setGoing: (eventId, going) => {
        const event = state.events.find((e) => e.id === eventId);
        if (!event) throw new Error('Event not found.');
        if (!going) return updateEvent(eventId, (e) => dropOut(e, ME));
        const role = roleOf(event, ME, state.crews, state.users, state.builds);
        const eligible = role !== 'none';
        rsvp(event, ME, eligible); // throws with the reason if a host already said no
        updateEvent(eventId, (e) => rsvp(e, ME, eligible));
      },
      answerRequest: (eventId, userId, approve) => {
        const event = state.events.find((e) => e.id === eventId);
        if (!event) throw new Error('Event not found.');
        const next = applyAnswer(event, ME, state.crews, userId, approve);
        updateEvent(eventId, () => next);
      },
      checkIn: (eventId, stopIndex) => updateEvent(eventId, (e) => applyCheckIn(e, stopIndex, ME)),
      moveOn: (eventId) => {
        const event = state.events.find((e) => e.id === eventId);
        if (!event) throw new Error('Event not found.');
        const nowDate = new Date();
        const next = applyMoveOn(event, nowDate);
        const stop = next.stops[next.currentStop];
        // In the demo you're the host and may also be checked in: then you get the
        // same "moved on" notification as everyone else at the stop.
        const moved = movedOnReminder(event, ME, nowDate);
        const notice: Notice = moved
          ? { id: newId('n'), eventId, at: nowDate.toISOString(), read: false, kind: 'moved', key: moved.key, text: `${moved.title}. ${moved.body}` }
          : {
              id: newId('n'), eventId, at: nowDate.toISOString(), read: false, kind: 'host',
              text: `${event.title} moved on to ${stop.name}. Everyone checked in at ${event.stops[event.currentStop].name} has been told.`,
            };
        if (moved && state.settings.reminders) notifyNow(moved).catch(() => {});
        setState((s) => ({ ...s, events: s.events.map((e) => (e.id === eventId ? next : e)), notices: [notice, ...s.notices] }));
      },
      cancelEvent: (eventId) => {
        const msg: ChatMessage = { id: newId('c'), eventId, userId: ME, text: 'Hosts cancelled the event', at: new Date().toISOString(), system: true };
        setState((s) => ({ ...s, events: s.events.map((e) => (e.id === eventId ? { ...e, cancelled: true } : e)), chat: [...s.chat, msg] }));
      },
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
      markUnlockSeen: (eventId, stopIds) =>
        setState((s) => ({
          ...s,
          unlockSeen: { ...s.unlockSeen, [eventId]: Array.from(new Set([...(s.unlockSeen[eventId] ?? []), ...stopIds])) },
        })),
      markNoticesRead: () => setState((s) => ({ ...s, notices: s.notices.map((n) => ({ ...n, read: true })) })),
      resetDemo: () => setState(fresh()),
      finishDrive: (spotId, run) => {
        const spot = state.spots.find((x) => x.id === spotId);
        if (!spot || spot.kind !== 'drive' || !spot.path) return { ok: false, reason: 'Drive not found.' };
        const verdict = judgeRun(run, spot.path, driveMiles(spot));
        if (!verdict.ok) return verdict;
        try {
          recordCompletion(spot, ME, new Date());
        } catch (e) {
          return { ok: false, reason: e instanceof Error ? e.message : 'Could not record the drive.' };
        }
        updateSpot(spotId, (x) => recordCompletion(x, ME, new Date()));
        return { ok: true };
      },
      visitSpot: (spotId, photo) => {
        const spot = state.spots.find((x) => x.id === spotId);
        if (!spot) throw new Error('Spot not found.');
        recordCompletion(spot, ME, new Date(), photo);
        updateSpot(spotId, (x) => recordCompletion(x, ME, new Date(), photo));
      },
      rateSpot: (spotId, stars) => {
        const spot = state.spots.find((x) => x.id === spotId);
        if (!spot) throw new Error('Place not found.');
        const rated = applyRating(spot, ME, stars);
        updateSpot(spotId, () => rated);
      },
      suggestSpot: (draft) => {
        const { spot, warning } = makeSpot(draft, ME, new Date(), newId('sp'), state.spots, BAN_ZONES);
        setState((s) => ({ ...s, spots: [...s.spots, spot] }));
        return { id: spot.id, warning };
      },
      joinCrew: (crewId) => setState((s) => ({ ...s, ...applyJoinCrew({ crews: s.crews, users: s.users }, ME, crewId) })),
      leaveCrew: () => setState((s) => ({ ...s, ...applyLeaveCrew({ crews: s.crews, users: s.users }, ME) })),
      createCrew: (name, tag) => {
        const id = newId('crew');
        const next = applyCreateCrew({ crews: state.crews, users: state.users }, ME, name, tag, id);
        setState((s) => ({ ...s, crews: next.crews, users: next.users }));
        return id;
      },
      setCrewHost: (crewId, userId, host) => {
        const next = applySetCrewHost({ crews: state.crews, users: state.users }, ME, crewId, userId, host);
        setState((s) => ({ ...s, crews: next.crews }));
      },
    }),
    [state, ready, now, updateEvent, updateSpot],
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
