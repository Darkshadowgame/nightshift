import { milesBetween } from './geo';
import type { LatLng, NightEvent } from './types';

/**
 * Track days at a circuit, from the meets of type "Track day" (no second system): upcoming, not
 * cancelled, held at that circuit, soonest first, with who from the app is going.
 */

/** A meet counts as "at" a circuit within this many miles of it. */
export const TRACK_DAY_RADIUS_MILES = 1.5;
/** Track days run all day when no end is set. */
const DEFAULT_LENGTH_MS = 8 * 3_600_000;

export interface TrackDay {
  id: string;
  title: string;
  startsAt: string;
  going: string[];
  /** The real meet this opens; absent for the demo's made-up rows. */
  eventId?: string;
}

/** Where a meet is: its current stop if it has a place, else nothing (a hidden meet isn't placed). */
function placeOf(e: NightEvent): LatLng | null {
  const stop = e.stops[e.currentStop] ?? e.stops[0];
  return stop?.at ?? null;
}

/** Upcoming (or running) track days at a circuit. */
export function trackDaysAt(events: readonly NightEvent[], track: LatLng, now: Date, radius = TRACK_DAY_RADIUS_MILES): TrackDay[] {
  const t = now.getTime();
  return events
    .filter((e) => {
      if (e.type !== 'trackday' || e.cancelled) return false;
      const end = e.endsAt ? Date.parse(e.endsAt) : Date.parse(e.startsAt) + DEFAULT_LENGTH_MS;
      if (end < t) return false;
      const at = placeOf(e);
      return !!at && milesBetween(at, track) <= radius;
    })
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
    .map((e) => ({ id: e.id, title: e.title, startsAt: e.startsAt, going: e.going, eventId: e.id }));
}

/** Real track days plus extra rows (the demo's), in date order. */
export function mergeTrackDays(real: readonly TrackDay[], extra: readonly TrackDay[]): TrackDay[] {
  return [...real, ...extra].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}
