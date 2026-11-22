import { plural } from './format';
import { REGIONS } from './profile';
import type { LatLng, NightEvent } from './types';

/**
 * The passport, the quiet streak and the season recap (level-up, profile area). All worked out on
 * the phone from meets you have already been to: nothing is stored and nothing is sent anywhere.
 *
 * A "visit" is a meet you checked in at (and that wasn't cancelled). The demo also has a short,
 * made-up history (`DEMO_VISITS`) so a new demo person's passport, recap and streak are not empty;
 * it is only ever added in the demo (`withDemoHistory`).
 */

export interface Visit {
  /** The meet's id (made-up ids start with "demo-"). */
  id: string;
  region: string;
  /** ISO time the meet started. */
  at: string;
  /** You hosted it. */
  hosted: boolean;
  /** Other people who checked in at the same meet. */
  people: string[];
}

const REGION_NAMES = REGIONS.map((r) => r.name);

/** An event's region: its area name when that is a region ("Midlands"), else the nearest region centre. */
export function regionOfEvent(e: Pick<NightEvent, 'area' | 'areaName'>, nearest: (p: LatLng) => string): string {
  const named = REGION_NAMES.find((r) => r.toLowerCase() === e.areaName.trim().toLowerCase());
  return named ?? nearest(e.area);
}

/** Meets you checked in at, newest first. `nearest` is `nearestRegion` (injected so tests stay light). */
export function visitsOf(events: readonly NightEvent[], me: string, nearest: (p: LatLng) => string): Visit[] {
  return events
    .filter((e) => !e.cancelled && (e.checkIns[me] ?? []).length > 0)
    .map<Visit>((e) => ({
      id: e.id,
      region: regionOfEvent(e, nearest),
      at: e.startsAt,
      hosted: e.hostIds.includes(me),
      people: Object.entries(e.checkIns)
        .filter(([u, stops]) => u !== me && stops.length > 0)
        .map(([u]) => u),
    }))
    .sort((a, b) => b.at.localeCompare(a.at));
}

/** A made-up earlier season for the demo person: days before today, a region, who was there. */
const DEMO_VISITS: { daysAgo: number; region: string; hosted?: boolean; people: string[] }[] = [
  { daysAgo: 3, region: 'Midlands', people: ['dan', 'kez', 'mo'] },
  { daysAgo: 12, region: 'Midlands', people: ['dan', 'em'] },
  { daysAgo: 26, region: 'Yorkshire', people: ['kez', 'tom'] },
  { daysAgo: 49, region: 'North West', people: ['mo', 'liv'] },
  { daysAgo: 77, region: 'Wales', people: ['sully', 'liv', 'cal'] },
  { daysAgo: 118, region: 'South West', people: ['aimee'] },
  { daysAgo: 160, region: 'London', hosted: true, people: ['priya', 'nina'] },
];

/** The demo's drives and photo spots from earlier in the year (added to the real count in the recap). */
export const DEMO_EXTRAS = { drives: 4, photoSpots: 3 };

/** Real visits plus the demo's made-up history (the demo only). */
export function withDemoHistory(real: Visit[], now: Date): Visit[] {
  const extra = DEMO_VISITS.map<Visit>((d, i) => ({
    id: `demo-visit-${i}`,
    region: d.region,
    at: new Date(now.getTime() - d.daysAgo * 86_400_000).toISOString(),
    hosted: !!d.hosted,
    people: d.people,
  }));
  return [...real, ...extra].sort((a, b) => b.at.localeCompare(a.at));
}

export interface Stamp {
  region: string;
  meets: number;
}

/** One stamp per app region, in the app's order. A region with no meets has `meets: 0`. */
export function passportOf(visits: readonly Visit[]): Stamp[] {
  return REGION_NAMES.map((region) => ({ region, meets: visits.filter((v) => v.region === region).length }));
}

export function regionsVisited(stamps: readonly Stamp[]): number {
  return stamps.filter((s) => s.meets > 0).length;
}

/**
 * Where each region sits on the passport's tile map (column, row), roughly north at the top and
 * west on the left. 4 columns by 4 rows; every region once.
 */
export const PASSPORT_TILES: Record<string, { col: number; row: number }> = {
  Scotland: { col: 1, row: 0 },
  'Northern Ireland': { col: 0, row: 1 },
  'North West': { col: 1, row: 1 },
  Yorkshire: { col: 2, row: 1 },
  'North East': { col: 3, row: 1 },
  Wales: { col: 1, row: 2 },
  Midlands: { col: 2, row: 2 },
  East: { col: 3, row: 2 },
  'South West': { col: 1, row: 3 },
  London: { col: 2, row: 3 },
  'South East': { col: 3, row: 3 },
};

/** "3 of 11 regions", the one passport line on Me. */
export function passportLine(stamps: readonly Stamp[]): string {
  return `${regionsVisited(stamps)} of ${stamps.length} regions`;
}

function sameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

/**
 * The quiet streak: "3 meets this month", a plain fact. Nothing at all for none (never "you've
 * lost your streak"), and it never notifies.
 */
export function monthLine(visits: readonly Visit[], now: Date): string | null {
  const n = visits.filter((v) => sameMonth(new Date(v.at), now) && new Date(v.at).getTime() <= now.getTime()).length;
  return n > 0 ? `${plural(n, 'meet')} this month` : null;
}

export interface Recap {
  year: number;
  meets: number;
  hosted: number;
  drives: number;
  photoSpots: number;
  regions: number;
  people: number;
}

export interface Completions {
  drives: number;
  photoSpots: number;
}

/** Year-so-far: meets, drives, photo spots, regions and the people you met at meets. */
export function recapOf(visits: readonly Visit[], done: Completions, now: Date): Recap {
  const year = now.getFullYear();
  const mine = visits.filter((v) => new Date(v.at).getFullYear() === year && new Date(v.at).getTime() <= now.getTime());
  return {
    year,
    meets: mine.length,
    hosted: mine.filter((v) => v.hosted).length,
    drives: done.drives,
    photoSpots: done.photoSpots,
    regions: new Set(mine.map((v) => v.region)).size,
    people: new Set(mine.flatMap((v) => v.people)).size,
  };
}

/** The recap as plain words for the share sheet. */
export function recapText(r: Recap): string {
  const parts = [plural(r.meets, 'meet'), plural(r.drives, 'drive'), plural(r.photoSpots, 'photo spot'), plural(r.regions, 'region')];
  return `My ${r.year} on Slipstream so far: ${parts.join(', ')}.`;
}
