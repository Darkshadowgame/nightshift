import { milesBetween } from './geo';
import type { LatLng } from './types';
import { whenLabel } from './when';

function hhmm(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/**
 * "Tonight 22:30", "Today 14:00", "Tomorrow 06:00", "Sat 23:00", "Sat 14 Dec, 09:00" (when.ts
 * `whenLabel`, Redesign 2 4.10); "Started 22:00" for the day after a start. Prefer `eventTimeLabel`
 * (when.ts) for events: it says "Live · until 23:00" and "Ended 23:00".
 */
export function formatWhen(iso: string, now: Date): string {
  const d = new Date(iso);
  if (d.getTime() < now.getTime() && now.getTime() - d.getTime() < 86_400_000) return `Started ${hhmm(d)}`;
  return whenLabel(d, now);
}

/**
 * "in 25 min", "in 3 h", "12 min ago". Not for screens' countdowns: those are `clockWithCountdown`
 * (when.ts), which only goes relative under an hour ("21:30 (in 20 min)").
 */
export function formatRelative(iso: string, now: Date): string {
  const diff = new Date(iso).getTime() - now.getTime();
  const mins = Math.round(Math.abs(diff) / 60_000);
  const text = mins < 60 ? `${mins} min` : mins < 48 * 60 ? `${Math.round(mins / 60)} h` : `${Math.round(mins / 1440)} days`;
  return diff >= 0 ? `in ${text}` : `${text} ago`;
}

export function formatTime(iso: string): string {
  return hhmm(new Date(iso));
}

/** "1 build", "2 builds", "0 trophies" (pass the plural when it isn't just +s). */
export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n.toLocaleString('en-GB')} ${n === 1 ? one : many}`;
}

/** Short age for feeds and lists: "now", "12m", "3h", "2d", then "14 Nov". */
export function shortAgo(iso: string, now: Date): string {
  const mins = Math.max(0, Math.round((now.getTime() - new Date(iso).getTime()) / 60_000));
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  if (mins < 24 * 60) return `${Math.round(mins / 60)}h`;
  if (mins < 7 * 24 * 60) return `${Math.round(mins / 1440)}d`;
  const d = new Date(iso);
  return `${d.getDate()} ${d.toLocaleString('en-GB', { month: 'short' })}`;
}

/**
 * The toast after hosting: "Invites sent to 12 people", "… to 1 person", "… to fewer than 3 people"
 * (signed in, small counts stay vague); a public event is just "Published".
 */
export function sentToast(invited: string, isPublic: boolean, openToAll = false): string {
  if (isPublic) return 'Published';
  if (openToAll) return /^\d+$/.test(invited) && invited !== '1' ? `Invites sent to ${invited} people nearby` : invited === '1' ? 'Invites sent to 1 person nearby' : 'Invites sent to people nearby';
  // Who: the people nearby whose car or bike fits (REVIEW-9: "Invites sent to 1 person" with no clue who).
  if (invited === '1') return 'Invites sent to 1 person nearby whose car or bike fits';
  if (/^\d+$/.test(invited) || invited === 'fewer than 3') return `Invites sent to ${invited} people nearby whose car or bike fits`;
  return 'Invites sent';
}

/**
 * A distance in the one wording (Redesign 2, 4.9, Review 11). Whole miles, one rounding
 * everywhere: "2 mi", "under 1 mi". `from`: `you` (a GPS fix) gives "2 mi"; `home` gives
 * "2 mi from home"; `about` (a meet whose point you can't see yet) gives "about 2 mi". Never
 * "from the map's centre".
 */
export function distanceText(miles: number, from: 'you' | 'home' | 'about' = 'you'): string {
  const n = Math.round(miles);
  const base = miles < 1 || n < 1 ? 'under 1 mi' : `${n} mi`;
  if (from === 'about') return miles < 1 ? 'about 1 mi' : `about ${base}`;
  return from === 'home' ? `${base} from home` : base;
}

/** Where every distance is measured from: your GPS fix while location is on, else your home. */
export type DistanceOrigin = { at: LatLng; from: 'you' | 'home' };

/** The one origin: `here` (a GPS fix) when there is one, else `home`; null with neither. */
export function distanceOrigin(here: LatLng | null | undefined, home: LatLng | null | undefined): DistanceOrigin | null {
  if (here) return { at: here, from: 'you' };
  if (home && (home.lat !== 0 || home.lng !== 0)) return { at: home, from: 'home' };
  return null;
}

/**
 * The distance to a meet, the same on every screen (Tonight, the event page, Search, lists): from
 * the one origin (`distanceOrigin`) to the meet's **area** centre, which never moves when the meet
 * point shows, so going doesn't change the number. "2 mi" from you, "2 mi from home", and
 * "about 2 mi" (with "from home" when from home) while you can't see the meet point yet.
 * Null with no origin.
 */
export function meetDistance(event: { area: LatLng }, origin: DistanceOrigin | null, pointHidden = false): string | null {
  if (!origin) return null;
  const miles = milesBetween(origin.at, event.area);
  const text = distanceText(miles, pointHidden ? 'about' : origin.from);
  return pointHidden && origin.from === 'home' ? `${text} from home` : text;
}

/** "9 going · 7 cars, 2 bikes" (Redesign 2, 4.9: no class codes). Leaves out a zero kind; a bare count when nothing's known. */
export function goingSummary(going: number, cars = 0, bikes = 0): string {
  const mix = [cars ? plural(cars, 'car') : null, bikes ? plural(bikes, 'bike') : null].filter(Boolean).join(', ');
  return mix && cars + bikes > 0 ? `${going.toLocaleString('en-GB')} going · ${mix}` : `${going.toLocaleString('en-GB')} going`;
}
