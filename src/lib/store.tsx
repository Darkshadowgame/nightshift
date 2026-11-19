import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Updates from 'expo-updates';
import Constants from 'expo-constants';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState, Platform } from 'react-native';
import { ME, seededStops } from '../data/seed';
import { accountKey, clearAccountCache, DEMO_BUSY_ON_START_KEY, useAuth } from './auth';
import type { AwardCategory } from './awards';
import { supabase } from './backend/client';
import { fetchFeedbackStatus, sendPendingFeedback, type AppInfo } from './backend/feedback';
import { UNKNOWN_HOME } from './backend/mapping';
import type { OutboxItem } from './backend/outbox';
import { createSupabaseRepository, type SupabaseRepository } from './backend/remote';
import { ClockProvider } from './clock';
import { alertProblem, travelProblem, nearbyArrivals, nearbyBatch, nearbyNotice, travelOf, type AlertMode } from './discover';
import { isPublicType, type PlanChange } from './events';
import { isSeedEvent, restartDemo, restartDemoClock, startDemoClock, stopDemoClock, toRealTime } from './demoTime';
import { appNow, appNowMs, realNowMs } from './appClock';
import { isUuid, mergeStatuses, sentEntry, type FeedbackContext, type PendingFeedback, type SentFeedback } from './feedbackQueue';
import { newId } from './ids';
import { createLocalRepository } from './localRepository';
import { allPhotos, EMPTY, everyLoad, forgetSeedEvents, fresh, freshen, layBusy, migrate, setBusyNight, type Persisted } from './localState';
import { geocoderAvailable, nameForPlace, townForPlace } from './location';
import type { Notice } from './notice';
import { notifyNow, syncReminders } from './notify';
import { changedSlices, joinSlices, LEGACY_KEY, needsMigration, SLICE_KEYS, sliceKey, splitState } from './persist';
import { deletePhotos, photoUri } from './photos';
import { bundledSpots, joinServerSpots, joinSpots } from './placeStore';
import type { ProfileDraft } from './profile';
import { dueReminders, isSignedUp, remindersFor, upcomingReminders } from './reminders';
import type { BackendExtras, Repository } from './repository';
import { applySceneNames, sameHome, stopsToName, type SceneNames } from './scene';
import { DEFAULT_SETTINGS, type Settings } from './settings';
import { approveDue, DEMO_APPROVAL_MS, type DriveRun, type SpotDraft, type Verdict } from './spots';
import type { Build, LatLng, NightEvent } from './types';
import { savedPlaces, type SavedPlaces } from './whereTo';

/**
 * The one store every screen reads and writes through. Its writes go to a
 * Repository (repository.ts): the demo's LocalRepository, or the
 * SupabaseRepository when signed in. Reads are the same shape either way
 * (localState.ts): signed in it holds what the server returned, cached on the
 * phone so the app opens instantly and works offline.
 */

/** How long to wait after a change before saving (the latest state wins; flushed when the app goes to the background). */
const SAVE_DELAY_MS = 500;
/** Signed in and offline: try the server again this often. */
const RETRY_MS = 20_000;

export type { Notice };

interface Store extends Persisted {
  ready: boolean;
  me: string;
  /** Where writes go: the demo on the phone, or the backend. */
  backend: 'local' | 'supabase';
  /** Signed in: whether the server answered the last request. Always true in the demo. */
  online: boolean;
  /** Signed in: writes made offline waiting to be sent. */
  pendingWrites: number;
  /** Signed-in extras (live updates, server search, invite counts). Null in the demo. */
  remote: BackendExtras | null;
  saveBuild: (b: Build) => Promise<void>;
  deleteBuild: (id: string) => Promise<void>;
  /** Create an event. Resolves with its id (the server's when signed in). */
  saveEvent: (e: NightEvent) => Promise<string>;
  /** Host edits an event before it starts. Rejects with a readable reason if not allowed. */
  editEvent: (e: NightEvent) => Promise<void>;
  /** Host changes a rolling meet's stops on the night. Resolves with any ban-zone warning. */
  changePlan: (eventId: string, change: PlanChange) => Promise<{ warning?: string }>;
  /** Save the person's own profile. Rejects with a readable reason if something is missing. */
  saveProfile: (draft: ProfileDraft) => Promise<void>;
  /**
   * Going, or for people the invite doesn't cover (with that build), a request a host must approve.
   * `buildId`: the car or bike you're bringing; another one later is a vehicle change. False drops out or withdraws.
   * Resolves with where you ended up.
   */
  setGoing: (eventId: string, going: boolean, buildId?: string) => Promise<'going' | 'requested' | 'none'>;
  /** Host approves or declines a request to go. */
  answerRequest: (eventId: string, userId: string, approve: boolean) => Promise<void>;
  /** Invite connections to an event (eventInvites.ts). Resolves with the ids newly invited. */
  inviteConnections: (eventId: string, userIds: string[], ctx: { connected: string[]; blocked: ReadonlySet<string> }) => Promise<string[]>;
  /** `buildId`: the build you actually turned up in, if it isn't the one you said. `position`: the GPS fix (needed signed in). */
  checkIn: (eventId: string, stopIndex: number, buildId?: string, position?: LatLng | null) => Promise<void>;
  moveOn: (eventId: string) => Promise<void>;
  cancelEvent: (eventId: string) => Promise<void>;
  sendChat: (eventId: string, text: string) => Promise<void>;
  /** Rejects with a readable reason if the vote isn't allowed. */
  vote: (eventId: string, category: AwardCategory, buildId: string) => Promise<void>;
  setSettings: (patch: Partial<Settings>) => void;
  /** "Where to?" recent places, Home and Work (kept in the phone's settings only). */
  updatePlaces: (fn: (p: SavedPlaces) => SavedPlaces) => void;
  markNoticesRead: () => void;
  /** Put a notice under the bell (e.g. "Bex accepted your request"). */
  addNotice: (n: Omit<Notice, 'id' | 'read'>) => void;
  markLocationNoticeSeen: () => void;
  /** Queue a suggestion or report (see feedbackQueue.ts); it's sent to the team when there's a connection. */
  queueFeedback: (item: PendingFeedback) => void;
  /** "Your feedback": ask the server what's happened to this phone's reports (and, signed in, your own). */
  refreshFeedback: () => Promise<void>;
  /** Sent automatically with a report: versions, device, the screen it came from, the backend mode. */
  feedbackContext: (route: string) => FeedbackContext;
  /** Remember that the "unlocked" moment has been shown for these stops. */
  markUnlockSeen: (eventId: string, stopIds: string[]) => void;
  resetDemo: () => void;
  /** Lay the sample events, chat, votes and spot visits out fresh. Keeps your profile, builds, photos, crews and what you made. */
  restartDemoEvents: () => void;
  /** Demo: Settings › Demo › Busy night, a much fuller made-up scene (busyNight.ts). Off restores the normal demo night. */
  setBusyNight: (on: boolean) => void;
  /** Schedule reminders again now, e.g. once notifications have just been allowed. */
  refreshReminders: () => void;
  /** Willing to travel and how you hear about new events near you. Rejects with a readable reason. */
  setTravelPrefs: (prefs: { travelMiles?: number; alerts?: AlertMode }) => Promise<void>;
  /** Find events has been opened: new ones near you are no longer new. */
  markNearbySeen: () => void;
  /** Finish a drive. Checks the run (every checkpoint, in order, at a believable pace); records only pass or fail. */
  finishDrive: (spotId: string, run: DriveRun) => Promise<Verdict>;
  /** Record a photo spot visit, with an optional plate-blurred photo. `position`: the fix the distance check used. */
  visitSpot: (spotId: string, photo?: string, position?: LatLng | null) => Promise<void>;
  /** 1–5 stars. Rejects if you haven't finished it or you suggested it. */
  rateSpot: (spotId: string, stars: number) => Promise<void>;
  /** Suggest a drive or photo spot. It starts pending. Rejects if the draft isn't ready. */
  suggestSpot: (draft: SpotDraft) => Promise<{ id: string; warning?: string }>;
  joinCrew: (crewId: string) => Promise<void>;
  leaveCrew: () => Promise<void>;
  /** Start a crew and join it. Resolves with the new crew's id. */
  createCrew: (name: string, tag: string) => Promise<string>;
  /** Crew owner makes a member a host, or takes it away. */
  setCrewHost: (crewId: string, userId: string, host: boolean) => Promise<void>;
  /** Demo: bring a sample person who isn't in a crew into yours. */
  addToCrew: (crewId: string, userId: string) => Promise<void>;
  /** Signed in: delete the account, everything in it and its photos (Apple 5.1.1(v)), then sign out. */
  deleteAccount: () => Promise<void>;
}

const Ctx = createContext<Store | null>(null);

export { newId };

/** App version, update and device, sent with feedback. */
function appInfo(): AppInfo {
  return {
    app_version: process.env.EXPO_PUBLIC_APP_VERSION ?? null,
    update_id: Updates.updateId ?? null,
    device: `${Platform.OS} ${String(Platform.Version ?? '')}`.trim().slice(0, 200),
  };
}

/** The device model ("iPhone 15 Pro"), never the phone's own name. Null when the build can't tell. */
function deviceModel(): string | null {
  try {
    const ios = Constants.platform?.ios;
    return (ios?.model || ios?.platform || null)?.slice(0, 60) ?? null;
  } catch {
    return null;
  }
}

function contextFor(route: string, backend: string): FeedbackContext {
  return {
    runtime: Updates.runtimeVersion ?? null,
    channel: Updates.channel ?? null,
    model: deviceModel(),
    os: `${Platform.OS} ${String(Platform.Version ?? '')}`.trim(),
    route: route.slice(0, 200),
    backend,
  };
}

/** Signed out (the sign-in screen), feedback waits here: that mode keeps nothing else on the phone. */
const SIGNED_OUT_FEEDBACK_KEY = 'nightshift.feedback.signedOut';

/** A signed-in person's state before the server has answered (and nothing is cached). */
function accountStart(uid: string): Persisted {
  return {
    ...EMPTY,
    users: [{ id: uid, handle: '', name: '', region: '', home: UNKNOWN_HOME }],
    settings: DEFAULT_SETTINGS,
    nearby: { known: [], unseen: [] },
  };
}

type Mode = { kind: 'demo' } | { kind: 'account'; uid: string } | { kind: 'none' };

/** Picks the store for who's using the app; a new person gets a fresh one. */
export function StoreProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const mode: Mode =
    auth.status === 'signedIn' && auth.userId ? { kind: 'account', uid: auth.userId } : auth.status === 'demo' ? { kind: 'demo' } : { kind: 'none' };
  const key = mode.kind === 'account' ? `account:${mode.uid}` : mode.kind;
  return (
    <StoreForMode key={key} mode={mode} signOut={auth.signOut}>
      {children}
    </StoreForMode>
  );
}

function StoreForMode({ mode, signOut, children }: { mode: Mode; signOut: () => Promise<void>; children: ReactNode }) {
  const demo = mode.kind === 'demo';
  const uid = mode.kind === 'account' ? mode.uid : null;
  const me = uid ?? ME;
  // A cheap placeholder until the save is read: the demo scene is only built when there's no save.
  const [state, setState] = useState<Persisted>(() => (uid ? accountStart(uid) : EMPTY));
  const [ready, setReady] = useState(mode.kind === 'none');
  const [online, setOnline] = useState(true);
  const [outbox, setOutboxState] = useState<OutboxItem[]>([]);
  /** Ticks every 30 s inside the store only (due reminders). Screens get the time from useNow(), not from here. */
  const [tick, setTick] = useState(0);
  /** Bumped when notifications are allowed or the app comes back to the front, to sync reminders again. */
  const [reminderTick, setReminderTick] = useState(0);
  const loaded = useRef(false);
  /** The latest state, for repositories (a render's `state` can be stale inside async work). */
  const latest = useRef(state);
  latest.current = state;
  const outboxRef = useRef<OutboxItem[]>([]);
  /** What's on the phone now (for writing only the slices that changed), the latest state waiting to be saved, and its timer. */
  const savedState = useRef<Persisted | null>(null);
  const pendingSave = useRef<Persisted | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const legacySave = useRef(false);
  /** Until when a change is saved at once, not after SAVE_DELAY_MS (going: a quick reload keeps it, Review 18). */
  const saveNowUntil = useRef(0);

  const set = useCallback((fn: (s: Persisted) => Persisted) => {
    setState((s) => {
      const next = fn(s);
      latest.current = next;
      return next;
    });
  }, []);

  /**
   * Bundled places joined with what people did there, then the places people suggested.
   * Signed in, "what people did there" is the server's (the same on every phone); what this
   * phone kept before is only marked "Only on this phone" (placeStore.ts joinServerSpots).
   */
  const joinAll = (s: Persisted) =>
    uid ? joinServerSpots(bundledSpots(), s.bundledServer?.progress ?? {}, s.placeProgress, s.spots, uid) : joinSpots(bundledSpots(), s.placeProgress, s.spots);
  const spots = useMemo(
    () => joinAll(state),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.placeProgress, state.spots, state.bundledServer],
  );

  const repo = useMemo<Repository | null>(() => {
    const get = () => latest.current;
    const allSpots = () => joinAll(latest.current);
    if (mode.kind === 'demo') return createLocalRepository({ get, set, spots: allSpots });
    if (mode.kind === 'account') {
      return createSupabaseRepository({
        client: supabase(),
        uid: mode.uid,
        get,
        set,
        spots: allSpots,
        setOnline,
        appInfo,
        outbox: {
          get: () => outboxRef.current,
          set: (items) => {
            outboxRef.current = items;
            setOutboxState(items);
            AsyncStorage.setItem(accountKey(mode.uid, 'outbox'), JSON.stringify(items)).catch(() => {});
          },
        },
      });
    }
    return null;
    // The mode never changes for this store (a new mode is a new store).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const remote = repo && repo.kind === 'supabase' ? (repo as SupabaseRepository) : null;

  // Load: the demo's slices, or the signed-in person's cache, then the server.
  useEffect(() => {
    // The demo runs on its own Friday night (demoTime.ts); everyone else on the real clock.
    if (mode.kind !== 'demo') stopDemoClock();
    if (mode.kind === 'none') return;
    let live = true;
    (async () => {
      if (mode.kind === 'demo') {
        let next: Persisted | null = null;
        await startDemoClock(AsyncStorage);
        try {
          let saved = joinSlices(await AsyncStorage.multiGet(SLICE_KEYS)) as Persisted | null;
          if (saved) savedState.current = saved;
          else {
            const raw = await AsyncStorage.getItem(LEGACY_KEY);
            if (raw) {
              saved = JSON.parse(raw) as Persisted;
              legacySave.current = true;
            }
          }
          if (saved) {
            // Freshen before migrating, so "is this still the untouched demo?" compares like with like.
            const freshened = freshen(saved, appNow());
            next = everyLoad(needsMigration(saved) ? migrate(freshened) : freshened);
          }
        } catch {
          // Unreadable storage: start from the demo scene.
          savedState.current = null;
        }
        // Settings › Try the busy demo (auth.tryDemo): Busy night on as the demo opens. Read once.
        const busyOnStart = !!(await AsyncStorage.getItem(DEMO_BUSY_ON_START_KEY).catch(() => null));
        if (busyOnStart) await AsyncStorage.removeItem(DEMO_BUSY_ON_START_KEY).catch(() => {});
        if (!live) return;
        const start = next ?? fresh();
        set(() => (busyOnStart && !start.settings?.busyNight ? setBusyNight(start, true, appNow()) : start));
        loaded.current = true;
        setReady(true);
        return;
      }
      // Signed in: show the cache at once, then refresh from the server.
      const uidKey = mode.uid;
      let cached: Persisted | null = null;
      try {
        const [rawState, rawOutbox] = await Promise.all([AsyncStorage.getItem(accountKey(uidKey, 'state')), AsyncStorage.getItem(accountKey(uidKey, 'outbox'))]);
        if (rawState) cached = { ...accountStart(uidKey), ...(JSON.parse(rawState) as Persisted) };
        if (rawOutbox) {
          outboxRef.current = JSON.parse(rawOutbox) as OutboxItem[];
          setOutboxState(outboxRef.current);
        }
      } catch {
        cached = null;
      }
      if (!live) return;
      if (cached) {
        const c = cached;
        set(() => ({ ...c, settings: { ...DEFAULT_SETTINGS, ...c.settings } }));
        loaded.current = true;
        setReady(true);
      }
      try {
        await remote!.refresh();
      } catch {
        // Offline (or the server is down): the cache stands; the retry below tries again.
      }
      if (!live) return;
      loaded.current = true;
      setReady(true);
    })();
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Write the latest state: the demo's changed slices, or the signed-in cache. */
  const flush = useCallback(async () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = null;
    const next = pendingSave.current;
    if (!next) return;
    pendingSave.current = null;
    try {
      if (mode.kind === 'account') {
        await AsyncStorage.setItem(accountKey(mode.uid, 'state'), JSON.stringify(next));
        return;
      }
      const changed = changedSlices(savedState.current, next);
      if (changed.length === 0) return;
      const parts = splitState(next);
      await AsyncStorage.multiSet(changed.map((n) => [sliceKey(n), JSON.stringify(parts[n])] as [string, string]));
      savedState.current = next;
      if (legacySave.current) {
        legacySave.current = false;
        await AsyncStorage.removeItem(LEGACY_KEY);
      }
    } catch {
      // Try again with the next change.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!loaded.current || mode.kind === 'none') return;
    pendingSave.current = state;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    if (realNowMs() < saveNowUntil.current) {
      flush();
      return;
    }
    saveTimer.current = setTimeout(() => {
      flush();
    }, SAVE_DELAY_MS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, flush]);

  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 30_000);
    return () => clearInterval(t);
  }, []);

  // Going to the background: save now. Back to the front: catch up on reminders (and, signed in, the server).
  useEffect(() => {
    const sub = AppState.addEventListener('change', (st) => {
      if (st !== 'active') {
        flush();
        return;
      }
      setTick((n) => n + 1);
      setReminderTick((n) => n + 1);
      if (remote) remote.refresh().catch(() => {});
    });
    return () => sub.remove();
  }, [flush, remote]);

  // Signed in: live notices ("moved on"), and retry the server while offline.
  useEffect(() => {
    if (!remote || !ready) return;
    return remote.watchNotices();
  }, [remote, ready]);
  useEffect(() => {
    if (!remote || online) return;
    const t = setInterval(() => remote.refresh().catch(() => {}), RETRY_MS);
    return () => clearInterval(t);
  }, [remote, online]);

  // Signed out (sign-in screen): keep the feedback queue and "Your feedback" on the phone.
  const signedOutLoaded = useRef(false);
  useEffect(() => {
    if (mode.kind !== 'none') return;
    AsyncStorage.getItem(SIGNED_OUT_FEEDBACK_KEY)
      .then((raw) => {
        const saved = raw ? (JSON.parse(raw) as { pendingFeedback?: PendingFeedback[]; sentFeedback?: SentFeedback[] }) : {};
        set((s) => ({
          ...s,
          pendingFeedback: [...(saved.pendingFeedback ?? []), ...(s.pendingFeedback ?? [])].slice(-50),
          sentFeedback: [...(s.sentFeedback ?? []), ...(saved.sentFeedback ?? [])].slice(0, 50),
        }));
      })
      .catch(() => {})
      .finally(() => {
        signedOutLoaded.current = true;
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (mode.kind !== 'none' || !signedOutLoaded.current) return;
    AsyncStorage.setItem(SIGNED_OUT_FEEDBACK_KEY, JSON.stringify({ pendingFeedback: state.pendingFeedback ?? [], sentFeedback: state.sentFeedback ?? [] })).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.pendingFeedback, state.sentFeedback]);

  // The demo and signed out: feedback waiting to go to the team is sent (allowed signed out).
  const pendingCount = state.pendingFeedback?.length ?? 0;
  useEffect(() => {
    if (remote || !ready || pendingCount === 0) return;
    let live = true;
    const t = setTimeout(() => {
      sendPendingFeedback(supabase(), latest.current.pendingFeedback ?? [], appInfo())
        .then(({ done }) => {
          if (live && done.length) set((s) => ({ ...s, pendingFeedback: (s.pendingFeedback ?? []).filter((f) => !done.includes(f.id)) }));
        })
        .catch(() => {});
    }, 2000);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [remote, ready, pendingCount, reminderTick, set]);
  // Signed in: the same, through the repository (after the outbox).
  useEffect(() => {
    if (!remote || !ready || pendingCount === 0 || !online) return;
    const t = setTimeout(() => remote.flush().catch(() => {}), 2000);
    return () => clearTimeout(t);
  }, [remote, ready, pendingCount, online]);

  // Demo: suggestions are approved a few seconds after they're made.
  useEffect(() => {
    if (!demo) return;
    const pending = state.spots.filter((x) => x.status === 'pending');
    if (pending.length === 0) return;
    const due = Math.min(...pending.map((x) => new Date(x.createdAt).getTime() + DEMO_APPROVAL_MS));
    const t = setTimeout(() => set((s) => ({ ...s, spots: approveDue(s.spots, appNow()) })), Math.max(0, due - appNowMs()) + 50);
    return () => clearTimeout(t);
  }, [demo, state.spots, set]);

  // Reminders: keep the phone's scheduled notifications in line with what you're going to.
  const { events: allEvents, crews: allCrews } = state;
  const remindersOn = state.settings.reminders;
  useEffect(() => {
    if (!ready || mode.kind === 'none') return;
    // Phone notifications fire on the real clock: the demo's Friday-night times are moved back to it.
    const wanted = remindersOn ? upcomingReminders(allEvents, me, allCrews, appNow()).map((r) => ({ ...r, at: toRealTime(r.at) })) : [];
    const t = setTimeout(() => {
      syncReminders(wanted).catch(() => {});
    }, 400);
    return () => clearTimeout(t);
  }, [ready, allEvents, allCrews, remindersOn, reminderTick, me, mode.kind]);

  // ...and put reminders that have come due into the in-app list.
  const onboarded = state.onboarded;
  /** Events you were going to (or hosting) last time this ran; null until the first run after loading. */
  const signedUpBefore = useRef<Set<string> | null>(null);
  useEffect(() => {
    if (!ready || !onboarded) return;
    const nowDate = appNow();
    const signedUp = new Set(allEvents.filter((e) => isSignedUp(e, me, allCrews)).map((e) => e.id));
    const before = signedUpBefore.current;
    signedUpBefore.current = signedUp;
    // REVIEW-10 #13: you just said you're going, so a reminder already past for that event
    // ("location shown", "starts in 15 min") isn't news. Keep it quiet for good.
    const joinedNow = new Set(before ? [...signedUp].filter((id) => !before.has(id)) : []);
    const justPast = allEvents
      .filter((e) => joinedNow.has(e.id))
      .flatMap((e) => remindersFor(e, me, allCrews))
      .filter((r) => r.at.getTime() <= nowDate.getTime())
      .map((r) => r.key);
    set((s) => {
      const quiet = new Set(s.quietReminders ?? []);
      const newlyQuiet = justPast.filter((k) => !quiet.has(k));
      for (const k of newlyQuiet) quiet.add(k);
      const seen = new Set([...s.notices.map((n) => n.key).filter((k): k is string => !!k), ...quiet]);
      const due = dueReminders(s.events, me, s.crews, nowDate, seen, s.onboardedAt ? new Date(s.onboardedAt) : undefined);
      if (due.length === 0) return newlyQuiet.length ? { ...s, quietReminders: [...quiet].slice(-200) } : s;
      const added: Notice[] = due.map((r) => ({
        id: newId('n'), eventId: r.eventId, at: r.at.toISOString(), read: false, kind: r.kind, key: r.key, text: `${r.title}. ${r.body}`,
      }));
      return { ...s, notices: [...added.reverse(), ...s.notices].slice(0, 100), ...(newlyQuiet.length ? { quietReminders: [...quiet].slice(-200) } : {}) };
    });
  }, [ready, onboarded, tick, allEvents, allCrews, me, set]);

  // Demo: new events near you: an in-app notice (and a phone notification) for "Notify me",
  // a NEW tag in Find events for "I'll search", nothing for "Off". Each event only once.
  // Signed in, the server writes these notices (private.queue_nearby_notices).
  const { users: allUsers, builds: allBuilds, nearby } = state;
  const notifiedFor = useRef<object | null>(null);
  useEffect(() => {
    if (!demo || !ready || !onboarded || !nearby) return;
    const nowDate = appNow();
    const who = { me: ME, crews: allCrews, users: allUsers, builds: allBuilds };
    // REVIEW-10 #13: the sample events are already on Tonight, so they never arrive as "new near
    // you" (five notices copying the list on a first open), and nothing you're going to is news.
    const news = allEvents.filter((e) => !isSeedEvent(e.id) && !e.going.includes(ME) && !e.hostIds.includes(ME));
    const { arrived, matches } = nearbyArrivals(news, nearby.known, who, nowDate);
    if (arrived.length === 0) return;
    const alerts = travelOf(allUsers.find((u) => u.id === ME)).alerts;
    set((s) => {
      const known = new Set(s.nearby?.known ?? []);
      const newly = new Set(arrived.filter((id) => !known.has(id)));
      if (newly.size === 0) return s;
      const freshOnes = matches.filter((e) => newly.has(e.id));
      const keys = new Set(s.notices.map((n) => n.key).filter((k): k is string => !!k));
      const added: Notice[] =
        alerts === 'notify'
          ? freshOnes
              .map((e) => nearbyNotice(e, nowDate))
              .filter((r) => !keys.has(r.key))
              .map((r) => ({ id: newId('n'), eventId: r.eventId, at: r.at.toISOString(), read: false, kind: 'nearby', key: r.key, text: `${r.title}. ${r.body}` }))
          : [];
      const unseen = s.nearby?.unseen ?? [];
      return {
        ...s,
        nearby: { known: [...known, ...newly], unseen: alerts === 'search' ? [...unseen, ...freshOnes.map((e) => e.id)] : unseen },
        notices: added.length > 0 ? [...added, ...s.notices].slice(0, 100) : s.notices,
      };
    });
    // One phone notification per batch (React may run this effect twice for the same state in development).
    if (alerts === 'notify' && notifiedFor.current !== nearby) {
      notifiedFor.current = nearby;
      const batch = nearbyBatch(matches, nowDate);
      if (batch) notifyNow(batch).catch(() => {});
    }
  }, [demo, ready, onboarded, nearby, allEvents, allUsers, allBuilds, allCrews, set]);

  // Demo: name the sample stops after real places near them, with the phone's geocoder (a few lookups, one at a time).
  const scene = state.scene;
  useEffect(() => {
    if (!demo || !ready || !onboarded || !scene || !geocoderAvailable) return;
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
      set((s) => {
        if (!s.scene || !sameHome(s.scene.home, scene.home)) return s;
        const names = { ...s.scene.names, ...found };
        return { ...s, scene: { ...s.scene, names }, events: applySceneNames(s.events, names, seeded) };
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [demo, ready, onboarded, scene, allEvents, set]);

  const store = useMemo<Store>(() => {
    const need = (): Repository => {
      if (!repo) throw new Error('Sign in or try the demo first.');
      return repo;
    };
    return {
      ...state,
      spots,
      ready,
      me,
      backend: remote ? 'supabase' : 'local',
      online: remote ? online : true,
      pendingWrites: outbox.length,
      remote,
      saveBuild: async (b) => need().saveBuild(b),
      deleteBuild: async (id) => need().deleteBuild(id),
      saveEvent: async (e) => need().saveEvent(e),
      editEvent: async (e) => need().editEvent(e),
      changePlan: async (id, change) => need().changePlan(id, change),
      saveProfile: async (draft) => need().saveProfile(draft),
      setGoing: async (id, going, buildId) => {
        // Saved at once, not debounced: a reload straight after I'm going keeps it (Review 18).
        saveNowUntil.current = realNowMs() + 2000;
        return need().setGoing(id, going, buildId);
      },
      answerRequest: async (id, userId, approve) => need().answerRequest(id, userId, approve),
      inviteConnections: async (id, userIds, ctx) => need().inviteConnections(id, userIds, ctx),
      checkIn: async (id, stop, buildId, position) => need().checkIn(id, stop, buildId, position),
      moveOn: async (id) => need().moveOn(id),
      cancelEvent: async (id) => need().cancelEvent(id),
      sendChat: async (id, text) => need().sendChat(id, text),
      vote: async (id, category, buildId) => need().vote(id, category, buildId),
      setTravelPrefs: async (prefs) => {
        // The same sentences as the server's save_travel_prefs(), without a round trip.
        const problem = (prefs.travelMiles !== undefined && travelProblem(prefs.travelMiles)) || (prefs.alerts !== undefined && alertProblem(prefs.alerts));
        if (problem) throw new Error(problem);
        return need().setTravelPrefs(prefs);
      },
      finishDrive: async (spotId, run) => need().finishDrive(spotId, run),
      visitSpot: async (spotId, photo, position) => need().visitSpot(spotId, photo, position),
      rateSpot: async (spotId, stars) => need().rateSpot(spotId, stars),
      suggestSpot: async (draft) => need().suggestSpot(draft),
      joinCrew: async (crewId) => need().joinCrew(crewId),
      leaveCrew: async () => need().leaveCrew(),
      createCrew: async (name, tag) => need().createCrew(name, tag),
      setCrewHost: async (crewId, userId, host) => need().setCrewHost(crewId, userId, host),
      addToCrew: async (crewId, userId) => need().addToCrew(crewId, userId),
      markNoticesRead: () => {
        repo?.markNoticesRead().catch(() => {});
      },
      addNotice: (n) => set((s) => ({ ...s, notices: [{ ...n, id: newId('n'), read: false }, ...s.notices].slice(0, 100) })),
      setSettings: (patch) => set((s) => ({ ...s, settings: { ...s.settings, ...patch } })),
      updatePlaces: (fn) => set((s) => ({ ...s, settings: { ...s.settings, places: fn(savedPlaces(s.settings.places)) } })),
      markUnlockSeen: (eventId, stopIds) =>
        set((s) => ({ ...s, unlockSeen: { ...s.unlockSeen, [eventId]: Array.from(new Set([...(s.unlockSeen[eventId] ?? []), ...stopIds])) } })),
      markLocationNoticeSeen: () => set((s) => ({ ...s, locationNoticeSeen: true })),
      queueFeedback: (item) =>
        set((s) => ({
          ...s,
          pendingFeedback: [...(s.pendingFeedback ?? []), item].slice(-50),
          sentFeedback: isUuid(item.id) ? [sentEntry(item), ...(s.sentFeedback ?? []).filter((f) => f.id !== item.id)].slice(0, 50) : s.sentFeedback,
        })),
      refreshFeedback: async () => {
        const mine = latest.current.sentFeedback ?? [];
        const rows = await fetchFeedbackStatus(supabase(), mine.map((f) => f.id), mode.kind === 'account');
        set((s) => {
          const list = s.sentFeedback ?? [];
          const known = new Set(list.map((f) => f.id));
          // Signed in: reports sent from another phone join the list.
          const others: SentFeedback[] = rows
            .filter((r) => !known.has(r.id) && r.message && r.created_at)
            .map((r) => ({ ...sentEntry({ id: r.id, kind: (r.kind ?? 'other') as SentFeedback['kind'], message: r.message!, screen: '', at: r.created_at! }) }));
          return { ...s, sentFeedback: mergeStatuses([...list, ...others], rows) };
        });
      },
      feedbackContext: (route) => contextFor(route, mode.kind === 'account' ? 'signed-in' : mode.kind === 'demo' ? 'demo' : 'signed-out'),
      resetDemo: () => {
        if (!demo) return;
        // Photo files go too: nothing would point at them any more.
        deletePhotos(allPhotos(latest.current));
        restartDemoClock(AsyncStorage);
        set(() => fresh());
      },
      restartDemoEvents: () => {
        if (!demo) return;
        restartDemoClock(AsyncStorage);
        const nowDate = appNow();
        set((s) => restartDemoScene(s, nowDate));
      },
      setBusyNight: (on) => {
        if (!demo) return;
        const nowDate = appNow();
        set((s) => setBusyNight(s, on, nowDate));
      },
      refreshReminders: () => setReminderTick((n) => n + 1),
      markNearbySeen: () => set((s) => (s.nearby && s.nearby.unseen.length > 0 ? { ...s, nearby: { ...s.nearby, unseen: [] } } : s)),
      deleteAccount: async () => {
        if (!remote || !uid) throw new Error('Only an account can be deleted. The demo lives on this phone: use Reset everything.');
        await remote.deleteAccount();
        await clearAccountCache(uid);
        await signOut();
      },
    };
  }, [state, spots, ready, me, remote, online, outbox, repo, set, demo, uid, signOut]);

  return (
    <Ctx.Provider value={store}>
      <ClockProvider>{children}</ClockProvider>
    </Ctx.Provider>
  );
}

/** Demo: lay the sample events out fresh (see restartDemoEvents). */
function restartDemoScene(s: Persisted, nowDate: Date): Persisted {
  const restarted = restartDemo(s, nowDate, s.scene);
  const unlockSeen = Object.fromEntries(Object.entries(s.unlockSeen).filter(([id]) => !isSeedEvent(id)));
  // Drives and visits on the real places start again too (their photo files with them).
  deletePhotos(Object.values(s.placeProgress).flatMap((p) => p.completions.flatMap((c) => (c.photo ? [c.photo] : []))));
  const next: Persisted = {
    ...s,
    ...restarted,
    placeProgress: {},
    unlockSeen,
    notices: s.notices.filter((n) => !isSeedEvent(n.eventId)),
    nearby: forgetSeedEvents(s.nearby),
    seededAt: nowDate.toISOString(),
    // Reminders from the restarted events count as news again.
    onboardedAt: nowDate.toISOString(),
  };
  // The busy night (if on) starts again with the demo night.
  return next.settings.busyNight ? layBusy(next, nowDate) : next;
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
