import { seed, SEED_EVENT_IDS, type SceneOptions } from '../data/seed';
import { clockOffset, realNowMs, setClockOffset, weekdayAt } from './appClock';
import type { Vote } from './awards';
import { endTime } from './events';
import type { ChatMessage, NightEvent, Spot } from './types';

/**
 * The demo night (Redesign 2, 3.1): a virtual clock and a scene that stays fresh.
 *
 * The demo always runs on a Friday night. When the demo starts, the app's clock (appClock.ts) is
 * set to read Friday 21:10, whatever the real time, and it moves on in real time from there. The
 * sample events (seed.ts) are laid out round that moment, so a tester at lunchtime and one in the
 * evening see the same night. Signed-in people use the real clock.
 *
 * Saved data keeps absolute times, so on a later visit seeded events are moved back into place;
 * events made on the phone are never touched.
 */

// ---------------------------------------------------------------------------
// The virtual clock
// ---------------------------------------------------------------------------

/** Friday (5) at 21:10: where every demo night starts. */
export const DEMO_START = { weekday: 5, hour: 21, minute: 10 } as const;
/** A night lasts this long; opened again after that, the demo starts the night over at 21:10. */
export const DEMO_NIGHT_MS = 110 * 60_000;
/** Where the clock offset is kept between launches (AsyncStorage in the app). */
export const DEMO_CLOCK_KEY = 'nightshift.demoClock';

/** The Friday 21:10 a demo started at `realNow` runs on: this week's (today's if it's Friday). */
export function demoStartFor(realNow: number): Date {
  return weekdayAt(new Date(realNow), DEMO_START.weekday, DEMO_START.hour, DEMO_START.minute);
}

/** The offset that makes the app's clock read Friday 21:10 at `realNow`. */
export function freshDemoOffset(realNow: number): number {
  return demoStartFor(realNow).getTime() - realNow;
}

/**
 * The offset to use on launch: the saved one while its night is still on (the clock reads no later
 * than 23:00 that night), else a fresh night. `saved` is what `startDemoClock` kept last time.
 */
export function demoOffsetOnLaunch(saved: { offset: number; start: number } | null, realNow: number): { offset: number; start: number; fresh: boolean } {
  if (saved && Number.isFinite(saved.offset) && Number.isFinite(saved.start)) {
    const virtual = realNow + saved.offset;
    if (virtual >= saved.start && virtual - saved.start <= DEMO_NIGHT_MS) return { ...saved, fresh: false };
  }
  const offset = freshDemoOffset(realNow);
  return { offset, start: realNow + offset, fresh: true };
}

type Storage = { getItem: (k: string) => Promise<string | null>; setItem: (k: string, v: string) => Promise<void> };

/** Demo mode starting: set the app's clock to the demo night (kept, or a fresh Friday 21:10). */
export async function startDemoClock(storage: Storage, realNow = realNowMs()): Promise<{ fresh: boolean }> {
  let saved: { offset: number; start: number } | null = null;
  try {
    const raw = await storage.getItem(DEMO_CLOCK_KEY);
    saved = raw ? (JSON.parse(raw) as { offset: number; start: number }) : null;
  } catch {
    saved = null;
  }
  const next = demoOffsetOnLaunch(saved, realNow);
  setClockOffset(next.offset);
  if (next.fresh) await storage.setItem(DEMO_CLOCK_KEY, JSON.stringify({ offset: next.offset, start: next.start })).catch(() => {});
  return { fresh: next.fresh };
}

/** "Restart the demo night" and "Reset everything": the clock goes back to Friday 21:10. */
export function restartDemoClock(storage: Storage, realNow = realNowMs()): void {
  const offset = freshDemoOffset(realNow);
  setClockOffset(offset);
  storage.setItem(DEMO_CLOCK_KEY, JSON.stringify({ offset, start: realNow + offset })).catch(() => {});
}

/** Signed in or signed out: the real clock. */
export function stopDemoClock(): void {
  setClockOffset(0);
}

/** A real-time date for something on the app's clock (phone notifications fire on the real clock). */
export function toRealTime(d: Date): Date {
  return new Date(d.getTime() - clockOffset());
}

// ---------------------------------------------------------------------------
// Keeping the scene fresh
// ---------------------------------------------------------------------------

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

/** Older saves have no anchor: the seed starts the live meet about 40 minutes before it, so work back from that. */
export function inferAnchor(events: NightEvent[]): Date | null {
  const live = events.find((e) => e.id === 'ev-meet-now');
  return live ? new Date(new Date(live.startsAt).getTime() + 40 * 60_000) : null;
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

  // Sample events the seed no longer makes (older demo nights) go.
  const kept = slice.events.filter((e) => !SEED_IDS.has(e.id) || fresh.has(e.id));
  const events = kept.map((e) => {
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

  const chat = slice.chat.filter((m) => !SEED_IDS.has(m.eventId) || fresh.has(m.eventId)).map((m) => (SEED_IDS.has(m.eventId) ? { ...m, at: shift(m.at, age) } : m));
  const votes = slice.votes.filter((v) => !SEED_IDS.has(v.eventId) || fresh.has(v.eventId)).map((v) => {
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
