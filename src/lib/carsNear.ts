import { classOf, effectivePower } from './classes';
import { milesBetween } from './geo';
import type { Build, ClassLetter, LatLng, User, VehicleKind } from './types';

/**
 * Cars near you (Community › People): who lives within your travel distance,
 * with a rough distance only. Signed in, the server works the distance out
 * (people_near(), never a home); the demo does the same sums here.
 *
 * Privacy: both homes (already snapped to ~1 km) are snapped again to 0.05°
 * (about 5 km), and the miles are rounded, so moving your own home around
 * can't pin anyone down. Mirrors private.coarse() and private.rough_miles().
 */

const COARSE = 0.05;

export function coarse(p: LatLng): LatLng {
  return { lat: Math.round(p.lat / COARSE) * COARSE, lng: Math.round(p.lng / COARSE) * COARSE };
}

/** Under 5 → 5 ("under 5 mi"); to the nearest 2 under 20, 5 under 50, 10 beyond. */
export function roughMiles(miles: number): number {
  if (miles < 5) return 5;
  if (miles < 20) return Math.max(6, Math.round(miles / 2) * 2);
  if (miles < 50) return Math.round(miles / 5) * 5;
  return Math.round(miles / 10) * 10;
}

/** "Under 5 mi" or "About 12 mi". */
export function distanceLabel(miles: number): string {
  return miles <= 5 ? 'Under 5 mi' : `About ${miles} mi`;
}

export function roughMilesBetween(a: LatLng, b: LatLng): number {
  return roughMiles(milesBetween(coarse(a), coarse(b)));
}

export interface Nearby {
  userId: string;
  miles: number;
}

/** The demo's people_near(): not you, not hidden, not blocked, within the distance, nearest first. */
export function peopleNear(
  me: User,
  users: User[],
  maxMiles: number,
  opts: { hidden?: ReadonlySet<string>; blocked?: ReadonlySet<string> } = {},
): Nearby[] {
  const out: Nearby[] = [];
  for (const u of users) {
    if (u.id === me.id || opts.hidden?.has(u.id) || opts.blocked?.has(u.id)) continue;
    if (!u.home || (u.home.lat === 0 && u.home.lng === 0)) continue;
    const miles = roughMilesBetween(me.home, u.home);
    if (miles <= maxMiles) out.push({ userId: u.id, miles });
  }
  return out.sort((a, b) => a.miles - b.miles || a.userId.localeCompare(b.userId));
}

// ---------------------------------------------------------------------------
// Cards and filters
// ---------------------------------------------------------------------------

export interface NearFilter {
  /** Both, cars or bikes. */
  kind: 'all' | VehicleKind;
  /** Empty means every class. */
  classes: ClassLetter[];
  /** Empty means every make. */
  make: string;
  /** Several makes (People's filter sheet). Empty or missing means every make. */
  makes?: string[];
}

export const ANY_NEAR: NearFilter = { kind: 'all', classes: [], make: '' };

export interface PersonCard {
  user: User;
  miles: number;
  /** The builds that match the filter (all of them with no filter), best first. */
  builds: Build[];
  /** The build the card shows: the strongest matching one. */
  lead: Build | null;
}

function buildMatches(b: Build, f: NearFilter): boolean {
  if (f.kind !== 'all' && b.kind !== f.kind) return false;
  if (f.classes.length && !f.classes.includes(classOf(b))) return false;
  if (f.make.trim() && b.make.toLowerCase() !== f.make.trim().toLowerCase()) return false;
  if (f.makes?.length && !f.makes.some((m) => m.toLowerCase() === b.make.toLowerCase())) return false;
  return true;
}

export function isFiltered(f: NearFilter): boolean {
  return f.kind !== 'all' || f.classes.length > 0 || f.make.trim() !== '' || (f.makes?.length ?? 0) > 0;
}

/** Cards for the People list. With a filter on, people with no matching build drop out. */
export function personCards(near: Nearby[], users: User[], builds: Build[], f: NearFilter): PersonCard[] {
  const byId = new Map(users.map((u) => [u.id, u]));
  const out: PersonCard[] = [];
  for (const n of near) {
    const user = byId.get(n.userId);
    if (!user) continue;
    const theirs = builds
      .filter((b) => b.ownerId === n.userId && buildMatches(b, f))
      .sort((a, b) => effectivePower(b) - effectivePower(a));
    if (isFiltered(f) && theirs.length === 0) continue;
    out.push({ user, miles: n.miles, builds: theirs, lead: theirs[0] ?? null });
  }
  return out;
}

/** Makes among the people listed, for the make filter (A to Z). */
export function makesNear(near: Nearby[], builds: Build[]): string[] {
  const ids = new Set(near.map((n) => n.userId));
  return Array.from(new Set(builds.filter((b) => ids.has(b.ownerId)).map((b) => b.make))).sort((a, b) => a.localeCompare(b));
}

/** Builds to rate (like / pass): near you, not yours, not rated yet, nearest people first. */
export function buildsToRate(near: Nearby[], builds: Build[], me: string, rated: ReadonlySet<string>): Build[] {
  const order = new Map(near.map((n, i) => [n.userId, i]));
  return builds
    .filter((b) => b.ownerId !== me && order.has(b.ownerId) && !rated.has(b.id))
    .sort((a, b) => (order.get(a.ownerId) ?? 0) - (order.get(b.ownerId) ?? 0));
}
