import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import { BAN_ZONES, DEMO_HOME, ME, sampleHomes, seed, seededStops, SEED_EVENT_IDS, type SeedState } from '../data/seed';
import { geocoderAvailable, nameForPlace, townForPlace } from './location';
import { applySceneNames, sameHome, stopsToName, type SceneNames } from './scene';
import { castVote as applyVote, type AwardCategory } from './awards';
import { areaGivesAway, eventArea } from './area';
import { inferAnchor, isSeedEvent, needsRefresh, refreshDemo, restartDemo } from './demoTime';
import { canJoinDirectly, roleOf } from './eventView';
import { deletePhotos, migratePhotoRef } from './photos';
import { droppedPhotos } from './photoRefs';
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
  addToCrew as applyAddToCrew,
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
import { alertProblem, nearbyArrivals, nearbyBatch, nearbyNotice, travelOf, travelProblem, type AlertMode } from './discover';
import { DEFAULT_SETTINGS, upgradeSettings, type Settings } from './settings';
import { dedupeNotices, dueReminders, movedOnReminder, upcomingReminders, type ReminderKind } from './reminders';
import type { PendingFeedback } from './feedbackQueue';
import type { Build, ChatMessage, LatLng, NightEvent, Spot } from './types';

/**
 * Phase 1 keeps everything on the phone. Every read and write goes through this
 * store, so moving to Supabase later only replaces this file.
 */

const KEY = 'nightshift.v1';

interface Persisted extends SeedState {
  settings: Settings;
  /** Notices for the current user, e.g. "the meet moved on". */
  notices: Notice[];
  /** False until the person has set up their profile on first run. */
  onboarded: boolean;
  /** When they finished first run (ISO). Reminders from before then don't land in the list. */
  onboardedAt?: string;
  /** eventId -> stop ids this person has already seen the "unlocked" moment for. */
  unlockSeen: Record<string, string[]>;
  /** When the demo scene's times were last laid out (ISO). Used to keep the demo fresh. */
  seededAt?: string;
  /** Where the sample scene was drawn (your fuzzed home area) and the geocoder's names for its stops. */
  scene?: { home: LatLng; names: SceneNames };
  /** Set once "skip the GPS check" has been turned off for saves from before real GPS was the default. */
  realGpsDefault?: boolean;
  /** The Map tab has said once that location is off and it's showing your home area. */
  locationNoticeSeen?: boolean;
  /**
   * New events near you. `known`: every event id already looked at, so each
   * event is only ever "new" once. `unseen`: new ones near you not yet seen in
   * Find events (the "I'll search" setting marks these instead of notifying).
   */
  nearby?: { known: string[]; unseen: string[] };
  /** Suggestions from the vehicle and mod pickers, waiting to be sent to the backend's feedback table. */
  pendingFeedback?: PendingFeedback[];
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
  markLocationNoticeSeen: () => void;
  /** Queue a suggestion (see feedbackQueue.ts) to be sent later. */
  queueFeedback: (item: PendingFeedback) => void;
  /** Remember that the "unlocked" moment has been shown for these stops. */
  markUnlockSeen: (eventId: string, stopIds: string[]) => void;
  resetDemo: () => void;
  /** Lay the sample events, chat, votes and spot visits out fresh. Keeps your profile, builds, photos, crews and what you made. */
  restartDemoEvents: () => void;
  /** Schedule reminders again now, e.g. once notifications have just been allowed. */
  refreshReminders: () => void;
  /** Willing to travel and how you hear about new events near you. Throws with a readable reason. */
  setTravelPrefs: (prefs: { travelMiles?: number; alerts?: AlertMode }) => void;
  /** Find events has been opened: new ones near you are no longer new. */
  markNearbySeen: () => void;
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
  /** Demo: bring a sample person who isn't in a crew into yours. Throws with a readable reason. */
  addToCrew: (crewId: string, userId: string) => void;
}

const Ctx = createContext<Store | null>(null);

function fresh(): Persisted {
  const now = new Date();
  return {
    ...seed(now), settings: DEFAULT_SETTINGS, notices: [], onboarded: false, unlockSeen: {}, seededAt: now.toISOString(),
    scene: { home: DEMO_HOME, names: {} }, realGpsDefault: true,
    // Nothing is known yet, so the sample events count as new near you once you've set up.
    nearby: { known: [], unseen: [] },
  };
}

/** Keep the demo scene's times current (see demoTime.ts). Events made on the phone are left alone. */
function freshen(state: Persisted, now: Date): Persisted {
  if (!state.scene) return state; // older save: migrate() redraws the scene round your home
  const anchor = state.seededAt ? new Date(state.seededAt) : inferAnchor(state.events);
  if (!anchor || isNaN(anchor.getTime())) return { ...state, seededAt: state.seededAt ?? now.toISOString() };
  if (!needsRefresh(state, anchor, now, state.scene)) return { ...state, seededAt: anchor.toISOString() };
  return { ...state, ...refreshDemo(state, anchor, now, state.scene), seededAt: now.toISOString() };
}

/**
 * Draw the sample scene round a new home area: sample events, chat, votes and
 * real places laid out fresh (your own events, builds and crews stay), and
 * sample people's rough homes moved with it.
 */
function redrawScene(s: Persisted, home: LatLng, now: Date): Persisted {
  const scene = { home, names: {} };
  const restarted = restartDemo(s, now, scene);
  const homes = sampleHomes(home);
  const region = seed(now, scene).users.find((u) => u.id !== ME)?.region;
  return {
    ...s,
    ...restarted,
    users: s.users.map((u) => (u.id !== ME && homes.has(u.id) ? { ...u, home: homes.get(u.id)!, region: region ?? u.region } : u)),
    unlockSeen: Object.fromEntries(Object.entries(s.unlockSeen).filter(([id]) => !isSeedEvent(id))),
    notices: s.notices.filter((n) => !isSeedEvent(n.eventId)),
    nearby: forgetSeedEvents(s.nearby),
    seededAt: now.toISOString(),
    onboardedAt: s.onboarded ? now.toISOString() : s.onboardedAt,
    scene,
  };
}

/** The sample events are laid out again: they count as new near you again, like their reminders. */
function forgetSeedEvents(nearby: Persisted['nearby']): Persisted['nearby'] {
  if (!nearby) return nearby;
  return { known: nearby.known.filter((id) => !isSeedEvent(id)), unseen: nearby.unseen.filter((id) => !isSeedEvent(id)) };
}

/** Data saved by an older version of the app: fill in anything that's new since. */
function migrate(parsed: Persisted): Persisted {
  const base = fresh();
  // Real GPS is now the default: the old "simulate GPS" default goes off, once.
  let next: Persisted = { ...base, ...parsed, settings: upgradeSettings(parsed.settings, !!parsed.realGpsDefault), realGpsDefault: true };
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
  // Sample events added since this save was made (e.g. the invite a few hours away).
  const have = new Set(next.events.map((e) => e.id));
  const sceneBase = parsed.scene ? seed(new Date(), parsed.scene).events : base.events;
  const added = sceneBase.filter((e) => SEED_EVENT_IDS.includes(e.id) && !have.has(e.id));
  if (added.length) next = { ...next, events: [...next.events, ...added] };
  // In-app reminders used to be keyed by time, so the demo moving its times added repeats.
  next = { ...next, notices: dedupeNotices(next.notices ?? []) };
  if (!parsed.scene) {
    // Saved before the sample scene followed your home area and the real UK places arrived:
    // drop the old Midlands sample places (keep your own) and draw the scene round your home once.
    const mine = next.spots.filter((x) => x.authorId === ME);
    const home = next.users.find((u) => u.id === ME)?.home ?? DEMO_HOME;
    next = redrawScene({ ...next, spots: mine }, home, new Date());
  }
  // Saved before "new events near you": what's already there isn't new.
  if (!parsed.nearby) next = { ...next, nearby: { known: next.events.map((e) => e.id), unseen: [] } };
  return next;
}

export function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Persisted>(fresh);
  const [ready, setReady] = useState(false);
  const [now, setNow] = useState(() => new Date());
  /** Bumped when notifications are allowed or the app comes back to the front, to sync reminders again. */
  const [reminderTick, setReminderTick] = useState(0);
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

  // Back from the background (or from the Settings app): catch up on the time and the reminders.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (st) => {
      if (st !== 'active') return;
      setNow(new Date());
      setReminderTick((n) => n + 1);
    });
    return () => sub.remove();
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
  }, [ready, allEvents, allCrews, remindersOn, reminderTick]);

  // ...and put reminders that have come due into the in-app list.
  const onboarded = state.onboarded;
  useEffect(() => {
    if (!ready || !onboarded) return;
    setState((s) => {
      const seen = new Set(s.notices.map((n) => n.key).filter((k): k is string => !!k));
      const due = dueReminders(s.events, ME, s.crews, now, seen, s.onboardedAt ? new Date(s.onboardedAt) : undefined);
      if (due.length === 0) return s;
      const added: Notice[] = due.map((r) => ({
        id: newId('n'), eventId: r.eventId, at: r.at.toISOString(), read: false, kind: r.kind, key: r.key, text: `${r.title}. ${r.body}`,
      }));
      return { ...s, notices: [...added.reverse(), ...s.notices].slice(0, 100) };
    });
  }, [ready, onboarded, now, allEvents]);

  // New events near you: an in-app notice (and a phone notification) for "Notify me",
  // a NEW tag in Find events for "I'll search", nothing for "Off". Each event only once.
  const { users: allUsers, builds: allBuilds, nearby } = state;
  const notifiedFor = useRef<object | null>(null);
  useEffect(() => {
    if (!ready || !onboarded || !nearby) return;
    const nowDate = new Date();
    const who = { me: ME, crews: allCrews, users: allUsers, builds: allBuilds };
    const { arrived, matches } = nearbyArrivals(allEvents, nearby.known, who, nowDate);
    if (arrived.length === 0) return;
    const mode = travelOf(allUsers.find((u) => u.id === ME)).alerts;
    setState((s) => {
      const known = new Set(s.nearby?.known ?? []);
      const newly = new Set(arrived.filter((id) => !known.has(id)));
      if (newly.size === 0) return s;
      const fresh = matches.filter((e) => newly.has(e.id));
      const keys = new Set(s.notices.map((n) => n.key).filter((k): k is string => !!k));
      const added: Notice[] =
        mode === 'notify'
          ? fresh
              .map((e) => nearbyNotice(e, nowDate))
              .filter((r) => !keys.has(r.key))
              .map((r) => ({ id: newId('n'), eventId: r.eventId, at: r.at.toISOString(), read: false, kind: 'nearby', key: r.key, text: `${r.title}. ${r.body}` }))
          : [];
      const unseen = s.nearby?.unseen ?? [];
      return {
        ...s,
        nearby: { known: [...known, ...newly], unseen: mode === 'search' ? [...unseen, ...fresh.map((e) => e.id)] : unseen },
        notices: added.length > 0 ? [...added, ...s.notices].slice(0, 100) : s.notices,
      };
    });
    // One phone notification per batch (React may run this effect twice for the same state in development).
    if (mode === 'notify' && notifiedFor.current !== nearby) {
      notifiedFor.current = nearby;
      const batch = nearbyBatch(matches, nowDate);
      if (batch) notifyNow(batch).catch(() => {});
    }
  }, [ready, onboarded, nearby, allEvents, allUsers, allBuilds, allCrews]);

  // Name the sample stops after real places near them, with the phone's geocoder (a few lookups, one at a time).
  const scene = state.scene;
  useEffect(() => {
    if (!ready || !onboarded || !scene || !geocoderAvailable) return;
    const seeded = seededStops(scene.home);
    const todo = stopsToName(allEvents, seeded, scene.names).slice(0, 12);
    const areas = allEvents.filter((e) => isSeedEvent(e.id) && !isPublicType(e.type) && !scene.names[`area:${e.id}`]);
    if (todo.length === 0 && areas.length === 0) return;
    let cancelled = false;
    (async () => {
      const found: SceneNames = {};
      for (const t of todo) {
        if (cancelled) return;
        // Unnamed stops keep their neutral name ("Retail park car park"); mark them tried.
        found[t.id] = (await nameForPlace(t.at)) ?? seeded.get(t.id)!.name;
      }
      for (const e of areas) {
        if (cancelled) return;
        found[`area:${e.id}`] = (await townForPlace(e.area)) ?? e.areaName;
      }
      if (cancelled) return;
      setState((s) => {
        if (!s.scene || !sameHome(s.scene.home, scene.home)) return s;
        const names = { ...s.scene.names, ...found };
        return { ...s, scene: { ...s.scene, names }, events: applySceneNames(s.events, names, seeded) };
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, onboarded, scene, allEvents]);

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
      saveBuild: (b) => {
        // Photos taken off the build: delete their files (they were only ever this build's).
        const before = state.builds.find((x) => x.id === b.id)?.photos ?? [];
        const elsewhere = state.builds.filter((x) => x.id !== b.id).flatMap((x) => x.photos);
        deletePhotos(droppedPhotos(before, b.photos, elsewhere));
        setState((s) => ({
          ...s,
          builds: s.builds.some((x) => x.id === b.id) ? s.builds.map((x) => (x.id === b.id ? b : x)) : [...s.builds, b],
        }));
      },
      deleteBuild: (id) => {
        const before = state.builds.find((x) => x.id === id)?.photos ?? [];
        const elsewhere = state.builds.filter((x) => x.id !== id).flatMap((x) => x.photos);
        deletePhotos(droppedPhotos(before, [], elsewhere));
        setState((s) => ({ ...s, builds: s.builds.filter((b) => b.id !== id) }));
      },
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
        setState((s) => {
          const users = s.users.map((u) => (u.id === ME ? applyProfile(u, draft) : u));
          const next = { ...s, onboarded: true, onboardedAt: s.onboardedAt ?? new Date().toISOString(), users };
          // A new home area: the sample scene moves with it.
          const home = users.find((u) => u.id === ME)!.home;
          return sameHome(s.scene?.home, home) ? next : redrawScene(next, home, new Date());
        });
      },
      setGoing: (eventId, going) => {
        const event = state.events.find((e) => e.id === eventId);
        if (!event) throw new Error('Event not found.');
        if (!going) return updateEvent(eventId, (e) => dropOut(e, ME));
        const role = roleOf(event, ME, state.crews, state.users, state.builds);
        const eligible = canJoinDirectly(role);
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
      markLocationNoticeSeen: () => setState((s) => ({ ...s, locationNoticeSeen: true })),
      queueFeedback: (item) => setState((s) => ({ ...s, pendingFeedback: [...(s.pendingFeedback ?? []), item].slice(-50) })),
      resetDemo: () => setState(fresh()),
      restartDemoEvents: () => {
        const nowDate = new Date();
        setState((s) => {
          const restarted = restartDemo(s, nowDate, s.scene);
          const unlockSeen = Object.fromEntries(Object.entries(s.unlockSeen).filter(([id]) => !isSeedEvent(id)));
          return {
            ...s,
            ...restarted,
            unlockSeen,
            notices: s.notices.filter((n) => !isSeedEvent(n.eventId)),
            nearby: forgetSeedEvents(s.nearby),
            seededAt: nowDate.toISOString(),
            // Reminders from the restarted events count as news again.
            onboardedAt: nowDate.toISOString(),
          };
        });
      },
      refreshReminders: () => setReminderTick((n) => n + 1),
      setTravelPrefs: ({ travelMiles, alerts }) => {
        const problem = (travelMiles !== undefined && travelProblem(travelMiles)) || (alerts !== undefined && alertProblem(alerts));
        if (problem) throw new Error(problem);
        setState((s) => ({
          ...s,
          users: s.users.map((u) =>
            u.id === ME ? { ...u, ...(travelMiles !== undefined ? { travelMiles } : {}), ...(alerts !== undefined ? { alerts } : {}) } : u,
          ),
          // Leaving "I'll search" clears the NEW tags it was keeping.
          nearby: alerts && alerts !== 'search' && s.nearby ? { ...s.nearby, unseen: [] } : s.nearby,
        }));
      },
      markNearbySeen: () =>
        setState((s) => (s.nearby && s.nearby.unseen.length > 0 ? { ...s, nearby: { ...s.nearby, unseen: [] } } : s)),
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
      addToCrew: (crewId, userId) => {
        const next = applyAddToCrew({ crews: state.crews, users: state.users }, ME, crewId, userId);
        setState((s) => ({ ...s, crews: next.crews, users: next.users }));
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

export type { LatLng, Settings };
