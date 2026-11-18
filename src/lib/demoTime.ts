import { seed, SEED_EVENT_IDS, type SceneOptions } from '../data/seed';
import type { Vote } from './awards';
import { endTime } from './events';
import type { ChatMessage, NightEvent, Spot } from './types';

/**
 * Keeps the demo scene fresh. The seed is laid out relative to when it was made
 * (a rolling meet live now, a crew meet in 30 minutes, a cruise in two days at
 * 22:30). Saved data keeps absolute times, so a day later the demo looks dead.
 * On load, seeded events are moved back into place; events made on the phone
 * are never touched.
 */

/** Re-anchor the demo when it's older than this, even if it's been used. */
export const REFRESH_AFTER_MS = 6 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface DemoSlice {
  events: NightEvent[];
  chat: ChatMessage[];
  votes: Vote[];
}

const SEED_IDS = new Set(SEED_EVENT_IDS);

function shift(iso: string, ms: number): string {
  return new Date(new Date(iso).getTime() + ms).toISOString();
}

/** Nothing seeded has changed since the seed was made at `anchor`. */
export function isUntouchedDemo(slice: DemoSlice, anchor: Date, scene: SceneOptions = {}): boolean {
  const original = seed(anchor, scene);
  const pick = (s: DemoSlice) => JSON.stringify({ e: s.events, c: s.chat, v: s.votes });
  return pick(slice) === pick({ events: original.events, chat: original.chat, votes: original.votes });
}

/** Older saves have no anchor: the seed starts the live rolling meet 45 minutes before it, so work back from that. */
export function inferAnchor(events: NightEvent[]): Date | null {
  const live = events.find((e) => e.id === 'ev-rolling-live');
  return live ? new Date(new Date(live.startsAt).getTime() + 45 * 60_000) : null;
}

export function needsRefresh(slice: DemoSlice, anchor: Date, now: Date, scene: SceneOptions = {}): boolean {
  const age = now.getTime() - anchor.getTime();
  if (age <= 60_000) return false;
  return age >= REFRESH_AFTER_MS || isUntouchedDemo(slice, anchor, scene) || !demoMeetLive(slice.events, now);
}

/** The always-on demo meet (REVIEW-10 decision 1) is on now. False once it has ended, so the demo re-anchors. */
export function demoMeetLive(events: NightEvent[], now: Date): boolean {
  const e = events.find((x) => x.id === 'ev-meet-now');
  if (!e || e.cancelled) return true; // removed or cancelled by hand: leave it
  return new Date(e.startsAt).getTime() <= now.getTime() && endTime(e).getTime() > now.getTime();
}

/**
 * Move seeded events to where the seed made at `now` would put them. Each
 * event's own history (stops moved on, plan changes, votes) moves with it, so
 * a meet you checked in at stays checked in. An event whose time you edited
 * moves by whole days, keeping your clock time. Chat moves by the time since
 * the anchor, so it stays in the past.
 */
export function refreshDemo(slice: DemoSlice, anchor: Date, now: Date, scene: SceneOptions = {}): DemoSlice {
  const seededNow = seed(now, scene);
  // Untouched: simply the scene as it's laid out now (evening times, live only once started).
  if (isUntouchedDemo(slice, anchor, scene)) return { events: seededNow.events, chat: seededNow.chat, votes: seededNow.votes };
  const thenList = seed(anchor, scene).events;
  const then = new Map(thenList.map((e) => [e.id, e]));
  const fresh = new Map(seededNow.events.map((e) => [e.id, e]));
  // A sample event you never touched is laid out afresh, so it isn't "moved on" before it starts.
  const untouched = new Set(slice.events.filter((e) => then.has(e.id) && JSON.stringify(then.get(e.id)) === JSON.stringify(e)).map((e) => e.id));
  const age = now.getTime() - anchor.getTime();
  const wholeDays = Math.round(age / DAY_MS) * DAY_MS;
  const deltas = new Map<string, number>();

  const events = slice.events.map((e) => {
    if (!SEED_IDS.has(e.id)) return e;
    if (untouched.has(e.id) && fresh.has(e.id)) {
      deltas.set(e.id, new Date(fresh.get(e.id)!.startsAt).getTime() - new Date(e.startsAt).getTime());
      return fresh.get(e.id)!;
    }
    const was = then.get(e.id);
    const target = fresh.get(e.id);
    const delta =
      was && target && was.startsAt === e.startsAt
        ? new Date(target.startsAt).getTime() - new Date(e.startsAt).getTime()
        : wholeDays;
    deltas.set(e.id, delta);
    if (delta === 0) return e;
    return {
      ...e,
      startsAt: shift(e.startsAt, delta),
      ...(e.endsAt ? { endsAt: shift(e.endsAt, delta) } : {}),
      stops: e.stops.map((st) => (st.revealedAt ? { ...st, revealedAt: shift(st.revealedAt, delta) } : st)),
      ...(e.changes ? { changes: e.changes.map((c) => ({ ...c, at: shift(c.at, delta) })) } : {}),
    };
  });

  const chat = slice.chat.map((m) => (SEED_IDS.has(m.eventId) ? { ...m, at: shift(m.at, age) } : m));
  const votes = slice.votes.map((v) => {
    const d = deltas.get(v.eventId);
    return d ? { ...v, at: shift(v.at, d) } : v;
  });
  return { events, chat, votes };
}

export interface RestartSlice extends DemoSlice {
  spots: Spot[];
}

/**
 * "Restart the demo events": lay the sample events out again as if the demo
 * was installed now, with their seeded chat, votes and check-ins, and put the
 * real drives, photo spots and tracks back to their seeded state. The scene
 * is drawn round `scene.home` (your fuzzed home area).
 * Everything you made stays: events and places you created, and (outside this
 * slice) your profile, builds, photos and crews.
 */
export function restartDemo(slice: RestartSlice, now: Date, scene: SceneOptions = {}): RestartSlice {
  const fresh = seed(now, scene);
  const seedSpots = new Map(fresh.spots.map((x) => [x.id, x]));
  return {
    events: [...slice.events.filter((e) => !SEED_IDS.has(e.id)), ...fresh.events],
    chat: [...slice.chat.filter((m) => !SEED_IDS.has(m.eventId)), ...fresh.chat],
    votes: [...slice.votes.filter((v) => !SEED_IDS.has(v.eventId)), ...fresh.votes],
    spots: [
      ...slice.spots.map((x) => seedSpots.get(x.id) ?? x),
      ...fresh.spots.filter((x) => !slice.spots.some((y) => y.id === x.id)),
    ],
  };
}

/** Is this one of the sample events (as opposed to one made on the phone)? */
export function isSeedEvent(eventId: string): boolean {
  return SEED_IDS.has(eventId);
}
