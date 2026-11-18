import { appNow } from './appClock';
import { DEMO_HOME, ME, sampleHomes, samplePhotoRefs, seed, SEED_EVENT_IDS, type SeedState } from '../data/seed';
import { splitSavedSpots, type ProgressMap } from './placeStore';
import { SCHEMA_VERSION } from './persist';
import { tidyModel } from './vehicles';
import { isPublicType } from './events';
import { nearbyNotice } from './discover';
import type { NightEvent } from './types';
import { areaGivesAway, eventArea } from './area';
import { inferAnchor, isSeedEvent, needsRefresh, refreshDemo, restartDemo } from './demoTime';
import { migratePhotoRef } from './photos';
import { withRoles } from './crews';
import { DEFAULT_SETTINGS, upgradeSettings, type Settings } from './settings';
import { dedupeNotices } from './reminders';
import { markLegacyShopRefs, type PendingFeedback, type SentFeedback } from './feedbackQueue';
import type { Notice } from './notice';
import type { LatLng, PlaceRep } from './types';
import type { SceneNames } from './scene';
import { isBusyId, withBusy, withoutBusy } from '../data/busyNight';

/**
 * The app's state as it's kept on the phone, and the demo's helpers for it
 * (the sample scene, migrations from older saves). In demo mode this is the
 * whole truth; signed in, the same shape holds what the server returned
 * (src/lib/backend/remote.ts), cached on the phone.
 */

export interface Persisted extends SeedState {
  /** Saved shape (persist.ts). Missing on saves from before slices. */
  schemaVersion?: number;
  /** Bundled places: what people did there, by place id. `spots` only holds places people suggested. */
  placeProgress: ProgressMap;
  settings: Settings;
  /** Notices for the current user, e.g. "the meet moved on". */
  notices: Notice[];
  /** False until the person has set up their profile on first run. */
  onboarded: boolean;
  /** When they finished first run (ISO). Reminders from before then don't land in the list. */
  onboardedAt?: string;
  /**
   * Reminder keys that were already past when you said you're going (REVIEW-10 #13: "Location
   * shown" for the meet you'd just joined). They never land under the bell.
   */
  quietReminders?: string[];
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
  /** "Your feedback": what this phone sent (and, signed in, your reports from other phones), with the server's status. */
  sentFeedback?: SentFeedback[];
  /**
   * Signed in only: Nightshift's own drives and photo spots as the server has
   * them (spots.bundled_id). `ids`: bundled id -> the server row's id, for the
   * RPCs. `progress`: completions and ratings by bundled id (yours, plus
   * anonymous stand-ins for everyone else's counts). `placeProgress` then only
   * holds what this phone recorded before, shown as "Only on this phone".
   */
  bundledServer?: { ids: Record<string, string>; progress: ProgressMap };
  /** Signed in only: everyone's drives and photo spots as the server counts them (place_rep_for), by user id. */
  placeRep?: Record<string, PlaceRep>;
}



export function fresh(): Persisted {
  const now = appNow();
  return {
    ...seed(now), schemaVersion: SCHEMA_VERSION, placeProgress: {}, settings: DEFAULT_SETTINGS, notices: [], onboarded: false, unlockSeen: {}, seededAt: now.toISOString(),
    scene: { home: DEMO_HOME, names: {} }, realGpsDefault: true,
    // Nothing is known yet, so the sample events count as new near you once you've set up.
    nearby: { known: [], unseen: [] },
  };
}

/** Before the save has been read: nothing yet (screens wait for `ready`). Cheap, unlike fresh(). */
export const EMPTY: Persisted = {
  users: [], builds: [], crews: [], events: [], chat: [], votes: [], spots: [], placeProgress: {},
  settings: DEFAULT_SETTINGS, notices: [], onboarded: false, unlockSeen: {}, schemaVersion: SCHEMA_VERSION,
};

/** Sample "new near you" notices, written again from the (moved) events they're about. Others are left alone. */
export function retimeNearbyNotices(notices: readonly Notice[], events: readonly NightEvent[]): Notice[] {
  const byId = new Map(events.map((e) => [e.id, e]));
  return notices.map((n) => {
    const e = n.kind === 'nearby' && isSeedEvent(n.eventId) ? byId.get(n.eventId) : undefined;
    if (!e) return n;
    const r = nearbyNotice(e, new Date(n.at));
    return { ...n, text: `${r.title}. ${r.body}` };
  });
}

/** Keep the demo scene's times current (see demoTime.ts). Events made on the phone are left alone. */
export function freshen(state: Persisted, now: Date): Persisted {
  if (!state.scene) return state; // older save: migrate() redraws the scene round your home
  const anchor = state.seededAt ? new Date(state.seededAt) : inferAnchor(state.events);
  if (!anchor || isNaN(anchor.getTime())) return { ...state, seededAt: state.seededAt ?? now.toISOString() };
  // The busy night (Settings › Demo) is laid out again with the demo night, never refreshed with it:
  // the demo night's own checks only ever see the normal scene.
  const busy = !!state.settings?.busyNight;
  const plain = busy ? withoutBusy(state) : state;
  if (!needsRefresh(plain, anchor, now, state.scene)) return { ...state, seededAt: anchor.toISOString() };
  // "New near you" notices quote the event's time, which has just moved (B7: 03:18 in the notice,
  // 03:25 on the event): write them again from the moved events, as if sent then.
  const refreshed = refreshDemo(plain, anchor, now, state.scene);
  const next = {
    ...plain,
    ...refreshed,
    notices: retimeNearbyNotices(plain.notices, refreshed.events),
    seededAt: now.toISOString(),
  };
  return busy ? layBusy(next, now) : next;
}

/** Lay the busy night out round the scene's home for `now` (again), without "new near you" for each of its meets. */
export function layBusy(s: Persisted, now: Date): Persisted {
  const next = withBusy(s, now, s.scene?.home ?? DEMO_HOME);
  const ids = next.events.filter((e) => isBusyId(e.id)).map((e) => e.id);
  return { ...next, nearby: next.nearby ? { ...next.nearby, known: Array.from(new Set([...next.nearby.known, ...ids])) } : next.nearby };
}

/**
 * Settings › Demo › Busy night. On: the fuller scene goes in (src/data/busyNight.ts). Off: all of
 * it comes back out, with its notices, so the demo night is exactly as it was.
 */
export function setBusyNight(s: Persisted, on: boolean, now: Date): Persisted {
  const settings = { ...s.settings, busyNight: on };
  if (on) return layBusy({ ...s, settings }, now);
  const plain = withoutBusy(s);
  return {
    ...plain,
    settings,
    notices: plain.notices.filter((n) => !isBusyId(n.eventId)),
    unlockSeen: Object.fromEntries(Object.entries(plain.unlockSeen).filter(([id]) => !isBusyId(id))),
    nearby: plain.nearby ? { known: plain.nearby.known.filter((id) => !isBusyId(id)), unseen: plain.nearby.unseen.filter((id) => !isBusyId(id)) } : plain.nearby,
  };
}

/**
 * Draw the sample scene round a new home area: sample events, chat, votes and
 * real places laid out fresh (your own events, builds and crews stay), and
 * sample people's rough homes moved with it.
 */
export function redrawScene(s: Persisted, home: LatLng, now: Date): Persisted {
  const scene = { home, names: {} };
  const restarted = restartDemo(s, now, scene);
  const homes = sampleHomes(home);
  const region = seed(now, scene).users.find((u) => u.id !== ME)?.region;
  const redrawn: Persisted = {
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
  return redrawn.settings?.busyNight ? layBusy(redrawn, now) : redrawn;
}

/** The sample events are laid out again: they count as new near you again, like their reminders. */
export function forgetSeedEvents(nearby: Persisted['nearby']): Persisted['nearby'] {
  if (!nearby) return nearby;
  return { known: nearby.known.filter((id) => !isSeedEvent(id)), unseen: nearby.unseen.filter((id) => !isSeedEvent(id)) };
}

/** Data saved by an older version of the app: fill in anything that's new since. */
export function migrate(parsed: Persisted): Persisted {
  const base = fresh();
  // Real GPS is now the default: the old "simulate GPS" default goes off, once.
  let next: Persisted = { ...base, ...parsed, settings: upgradeSettings(parsed.settings, !!parsed.realGpsDefault), realGpsDefault: true };
  // Saved before bundled places were read from the bundle: the save held a copy of every one.
  // Keep only what people did there, and the places people suggested.
  if (!parsed.placeProgress) {
    const { own, progress } = splitSavedSpots(next.spots ?? [], ME);
    next = { ...next, spots: own, placeProgress: progress };
  }
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
    // Sample builds saved before they had photos get their Commons photo (REVIEW-8).
    builds: next.builds.map((b) => ({ ...b, photos: b.photos.length ? b.photos.map(migratePhotoRef) : b.ownerId !== ME ? samplePhotoRefs(b.id) : [] })),
    spots: next.spots.map((x) => ({
      ...x,
      completions: x.completions.map((c) => (c.photo ? { ...c, photo: migratePhotoRef(c.photo) } : c)),
    })),
    placeProgress: Object.fromEntries(
      Object.entries(next.placeProgress).map(([id, p]) => [
        id,
        { ...p, completions: p.completions.map((c) => (c.photo ? { ...c, photo: migratePhotoRef(c.photo) } : c)) },
      ]),
    ),
  };
  // Sample events added since this save was made (e.g. the invite a few hours away).
  const have = new Set(next.events.map((e) => e.id));
  const sceneBase = parsed.scene ? seed(appNow(), parsed.scene).events : base.events;
  const added = sceneBase.filter((e) => SEED_EVENT_IDS.includes(e.id) && !have.has(e.id));
  if (added.length) next = { ...next, events: [...next.events, ...added] };
  // In-app reminders used to be keyed by time, so the demo moving its times added repeats.
  next = { ...next, notices: dedupeNotices(next.notices ?? []) };
  if (!parsed.scene) {
    // Saved before the sample scene followed your home area and the real UK places arrived:
    // drop the old Midlands sample places (keep your own) and draw the scene round your home once.
    const mine = next.spots.filter((x) => x.authorId === ME);
    const home = next.users.find((u) => u.id === ME)?.home ?? DEMO_HOME;
    next = redrawScene({ ...next, spots: mine }, home, appNow());
  }
  // Saved before "new events near you": what's already there isn't new.
  if (!parsed.nearby) next = { ...next, nearby: { known: next.events.map((e) => e.id), unseen: [] } };
  // Bike builds titled with their years twice ("Yamaha YZF-R6 2017-2020", schema 3): the model alone.
  if ((parsed.schemaVersion ?? 1) < 3) next = { ...next, builds: next.builds.map((b) => (b.vehicleId ? { ...b, model: tidyModel(b.model) } : b)) };
  // Shop suggestions queued before shop ids were stable (schema 3): mark the old listing numbers.
  if ((parsed.schemaVersion ?? 1) < 3 && next.pendingFeedback) next = { ...next, pendingFeedback: markLegacyShopRefs(next.pendingFeedback) };
  return { ...next, schemaVersion: SCHEMA_VERSION };
}

/** On every load, however new the save: settings added since get their defaults. */
export function everyLoad(saved: Persisted): Persisted {
  return { ...saved, settings: upgradeSettings(saved.settings, true) };
}

/** Every photo file the state refers to (builds, visits, suggested places), for Reset everything. */
export function allPhotos(s: Persisted): string[] {
  const visits = (cs: { photo?: string }[]) => cs.flatMap((c) => (c.photo ? [c.photo] : []));
  return [
    ...s.builds.flatMap((b) => b.photos),
    ...s.spots.flatMap((x) => [...(x.photo ? [x.photo] : []), ...visits(x.completions)]),
    ...Object.values(s.placeProgress ?? {}).flatMap((p) => visits(p.completions)),
  ];
}

