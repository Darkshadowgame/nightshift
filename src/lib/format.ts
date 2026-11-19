import { milesBetween } from './geo';
import type { LatLng } from './types';
import { whenLabel } from './when';

/**
 * Power in the one form (4.9): "197 bhp", with a no-break space so the number and its unit never
 * split across lines at large text ("197 / bhp", Review 16). Every build power on screen comes here.
 */
export function bhpText(bhp: number): string {
  return `${Math.round(bhp)}\u00a0bhp`;
}

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
  // A no-break space keeps the number with "mi" at large text, as with bhp (Review 16).
  const base = miles < 1 || n < 1 ? 'under 1\u00a0mi' : `${n}\u00a0mi`;
  if (from === 'about') return miles < 1 ? 'about 1\u00a0mi' : `about ${base}`;
  return from === 'home' ? `${base} from home` : base;
}

/** Where every distance is measured from: your GPS fix while location is on, else your home. */
export type DistanceOrigin = { at: LatLng; from: 'you' | 'home' };

/** Further than this from home, the GPS fix isn't "near you": Tonight is about home's area (Review 15 problem 11). */
export const AWAY_FROM_HOME_MILES = 30;

/**
 * The one origin: `here` (a GPS fix) when there is one, else `home`; null with neither. A fix far
 * from home (on holiday, a London phone on a Tamworth demo) measures from home, said "from home",
 * so the map, "Around Tamworth" and the distances agree.
 */
export function distanceOrigin(here: LatLng | null | undefined, home: LatLng | null | undefined): DistanceOrigin | null {
  const hasHome = !!home && (home.lat !== 0 || home.lng !== 0);
  if (here && !(hasHome && milesBetween(here, home!) > AWAY_FROM_HOME_MILES)) return { at: here, from: 'you' };
  if (hasHome) return { at: home!, from: 'home' };
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
export function goingSummary(going: number, cars = 0, bikes = 0, verb: 'going' | 'went' = 'going'): string {
  const mix = [cars ? plural(cars, 'car') : null, bikes ? plural(bikes, 'bike') : null].filter(Boolean).join(', ');
  return mix && cars + bikes > 0 ? `${going.toLocaleString('en-GB')} ${verb} · ${mix}` : `${going.toLocaleString('en-GB')} ${verb}`;
}

/** A display-italic character's width, in ems, rounded up; and the room kept for larger text (1.3x). */
const CHAR_EM = 0.56;
const TEXT_ROOM = 1.3;

/**
 * The cover's title: make and model each kept whole (no break inside "i30 N" or "Land Rover"), so it
 * reads "Hyundai / i30 N" over two lines at most, never "Hyundai i30 / N" (Review 15 decision 3).
 * The size shrinks until the longer piece fits on its line, with room for 1.3x text.
 */
export function coverTitle(make: string, model: string, room: number, max: number): { text: string; size: number } {
  const whole = (t: string) => t.trim().replace(/\s+/g, '\u00a0').replace(/-/g, '\u2011');
  const longest = Math.max(make.trim().length, model.trim().length, 1);
  const size = Math.max(14, Math.min(max, Math.floor(room / (longest * CHAR_EM * TEXT_ROOM))));
  return { text: `${whole(make)} ${whole(model)}`, size };
}
