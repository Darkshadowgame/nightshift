/**
 * Tonight's map, extras for Meets (pure logic; the screen draws them):
 *
 * - Tonight strip: the next three meets as a swipeable row in the sheet (`stripMeets`).
 * - Time check: drag across the evening (18:00 to 02:00) and see which meets are on at that time
 *   (`eveningTimes`, `onAt`). Off by default, switched on from the Layers sheet's When section.
 * - Busy glow: a soft glow under meets many people are going to (`glowLevel`), from the going
 *   counts the app already has. Never the only signal: the count is in the strip, the card and the list.
 * - Near my way home: meets within about ten minutes of the line from you to Home (`nearLine`,
 *   `homePlace`). Home comes only from a phone-only setting, and nothing here stores, sends or logs it.
 */

import { endTime } from './events';
import type { EventView } from './eventView';
import { milesBetween } from './geo';
import { isOrganised } from './organised';
import type { LatLng } from './types';
import { clock, SMALL_HOURS_END } from './when';

export const STRIP_SIZE = 3;

export interface StripMeet {
  id: string;
  title: string;
  /** "Live" or the start clock, "21:30". */
  time: string;
  live: boolean;
  going: number;
  /** An organised event (organised.ts): the chip says so, and the strip groups it after the local meets. */
  organised?: boolean;
}

/**
 * The next meets, soonest first: live now, then the ones still to come. Meets that have ended are
 * left out. The caller passes the views the map shows, so filters already apply.
 */
export function stripMeets(views: readonly EventView[], now: Date, size = STRIP_SIZE): StripMeet[] {
  const t = now.getTime();
  const next = views
    .filter((v) => endTime(v.event).getTime() > t)
    .sort((a, b) => {
      const la = a.phase === 'live' ? 0 : 1;
      const lb = b.phase === 'live' ? 0 : 1;
      return la - lb || new Date(a.event.startsAt).getTime() - new Date(b.event.startsAt).getTime();
    });
  // Local meets first, then organised events, up to `size` of each (organised.ts keeps them apart).
  const pick = (organised: boolean) => next.filter((v) => isOrganised(v.event) === organised).slice(0, size);
  return [...pick(false), ...pick(true)].map((v) => ({
    id: v.event.id,
    title: v.event.title,
    time: v.phase === 'live' ? 'Live' : clock(v.event.startsAt),
    live: v.phase === 'live',
    going: v.event.going.length,
    ...(isOrganised(v.event) ? { organised: true } : {}),
  }));
}

/** The evening runs 18:00 to 02:00 (480 minutes), in 30 minute steps. */
export const EVENING_FROM_HOUR = 18;
export const EVENING_MINUTES = 8 * 60;
export const EVENING_STEP = 30;

/** The start of tonight's evening: 18:00 on the night `now` belongs to (before 05:00 is still last night). */
export function eveningStart(now: Date): Date {
  const d = new Date(now);
  if (d.getHours() < SMALL_HOURS_END) d.setDate(d.getDate() - 1);
  d.setHours(EVENING_FROM_HOUR, 0, 0, 0);
  return d;
}

/** The time `offset` minutes into the evening, snapped to a step and kept inside it. */
export function eveningTimes(now: Date, offset: number): Date {
  const clamped = Math.min(EVENING_MINUTES, Math.max(0, offset));
  const snapped = Math.round(clamped / EVENING_STEP) * EVENING_STEP;
  return new Date(eveningStart(now).getTime() + snapped * 60_000);
}

/** Minutes into the evening for a time (the scrubber's first position), clamped to the evening. */
export function eveningOffset(now: Date, at: Date): number {
  return Math.min(EVENING_MINUTES, Math.max(0, Math.round((at.getTime() - eveningStart(now).getTime()) / 60_000)));
}

/** Is the meet on at this time (started and not yet over)? */
export function onAt(view: Pick<EventView, 'event'>, at: Date): boolean {
  const t = at.getTime();
  return new Date(view.event.startsAt).getTime() <= t && t < endTime(view.event).getTime();
}

/** "3 meets on at 22:30": said under the scrubber, so the fade is never the only signal. */
export function onAtLine(count: number, at: Date): string {
  return `${count === 0 ? 'No meets' : count === 1 ? '1 meet' : `${count} meets`} on at ${clock(at)}`;
}

/** Going counts from which a meet glows: busy, and very busy. */
export const BUSY_GOING = 12;
export const VERY_BUSY_GOING = 30;

/** 0 none, 1 busy, 2 very busy. */
export function glowLevel(going: number): 0 | 1 | 2 {
  return going >= VERY_BUSY_GOING ? 2 : going >= BUSY_GOING ? 1 : 0;
}

/** Glow circle radii in miles for a level: soft rings of growing size. */
export function glowRadii(level: 0 | 1 | 2): number[] {
  return level === 2 ? [0.5, 1] : level === 1 ? [0.6] : [];
}

/** About ten minutes' drive on ordinary roads. */
export const NEAR_ROUTE_MILES = 5;

/** Distance in miles from a point to the straight line (a segment) between two points. Flat-earth maths, fine at this scale. */
export function milesFromLine(p: LatLng, a: LatLng, b: LatLng): number {
  const kx = Math.cos((((a.lat + b.lat) / 2) * Math.PI) / 180);
  const px = (p.lng - a.lng) * kx;
  const py = p.lat - a.lat;
  const bx = (b.lng - a.lng) * kx;
  const by = b.lat - a.lat;
  const len2 = bx * bx + by * by;
  const u = len2 === 0 ? 0 : Math.min(1, Math.max(0, (px * bx + py * by) / len2));
  const closest = { lat: a.lat + u * by, lng: a.lng + (u * bx) / kx };
  return milesBetween(p, closest);
}

/** The ids of the places within `miles` of the line from `start` to `end`. */
export function nearLine(start: LatLng, end: LatLng, places: readonly { id: string; at: LatLng }[], miles = NEAR_ROUTE_MILES): string[] {
  return places.filter((x) => milesFromLine(x.at, start, end) <= miles).map((x) => x.id);
}

export interface FavouritePlace {
  id: string;
  label: string;
  lat: number;
  lng: number;
}

/**
 * Home from the phone-only `settings.favouritePlaces` (the drives area builds it), the entry labelled
 * Home. Null when nothing is set. Read-only: this never stores the place anywhere.
 */
export function homePlace(places: unknown): LatLng | null {
  if (!Array.isArray(places)) return null;
  for (const p of places as Partial<FavouritePlace>[]) {
    if (p && typeof p.label === 'string' && p.label.trim().toLowerCase() === 'home' && Number.isFinite(p.lat) && Number.isFinite(p.lng)) {
      return { lat: p.lat as number, lng: p.lng as number };
    }
  }
  return null;
}
