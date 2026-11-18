import { classOf } from './classes';
import { milesBetween } from './geo';
import { modCount } from './modGroups';
import type { Build, InviteFilter, LatLng, User } from './types';

export const DEFAULT_FILTER: InviteFilter = {
  everyone: false,
  cars: true,
  bikes: true,
  classes: [],
  // No minimum: everyone is invited unless the host narrows it (REVIEW-7 problem 3).
  minMods: 0,
  brands: [],
  radiusMiles: 25,
};

/**
 * The host's own builds all fall outside this invite (B4: a bikes-only meet hosted from a Golf).
 * False with no builds, or when it's open to everyone: there's nothing to warn about then.
 */
export function hostLeftOut(filter: InviteFilter, hostBuilds: readonly Build[]): boolean {
  return !filter.everyone && hostBuilds.length > 0 && !hostBuilds.some((b) => buildMatches(b, filter));
}

/**
 * Which rows of the invite leave this build out, in plain words:
 * ["Minimum mods 3+ (it has 0)"]. Empty when it fits.
 */
export function rowsLeavingOut(build: Build, filter: InviteFilter): string[] {
  if (filter.everyone) return [];
  const out: string[] = [];
  if ((build.kind === 'car' && !filter.cars) || (build.kind === 'bike' && !filter.bikes)) out.push(`Vehicles: ${filter.cars ? 'cars' : 'bikes'} only (it's a ${build.kind})`);
  if (filter.classes.length > 0 && !filter.classes.includes(classOf(build))) out.push(`Class ${classRange(filter.classes)} (it's class ${classOf(build)})`);
  if (modCount(build.mods) < filter.minMods) out.push(`Minimum mods ${filter.minMods}+ (it has ${modCount(build.mods)})`);
  if (filter.brands.length > 0 && !filter.brands.some((b) => b.trim().toLowerCase() === build.make.trim().toLowerCase())) out.push(`Brands (it's a ${build.make})`);
  return out;
}

/**
 * The warning when the host's own builds are all left out, naming the row:
 * "Minimum mods 3+ leaves out your Civic Type R (it has 0)." Uses the build that's closest to fitting.
 */
export function leftOutMessage(filter: InviteFilter, hostBuilds: readonly Build[]): string | null {
  if (!hostLeftOut(filter, hostBuilds)) return null;
  const [best] = [...hostBuilds].map((b) => ({ b, rows: rowsLeavingOut(b, filter) })).sort((x, y) => x.rows.length - y.rows.length);
  if (!best || best.rows.length === 0) return null;
  const rows = best.rows.map((r) => r.replace(/ \(.*\)$/, ''));
  const why = best.rows.map((r) => r.match(/\((.*)\)$/)?.[1]).filter(Boolean).join(', ');
  const verb = rows.length === 1 ? 'leaves' : 'leave';
  return `${rows.join(' and ')} ${verb} out your ${best.b.make} ${best.b.model} (${why}).`;
}

export function buildMatches(build: Build, filter: InviteFilter): boolean {
  if (filter.everyone) return true;
  if (build.kind === 'car' && !filter.cars) return false;
  if (build.kind === 'bike' && !filter.bikes) return false;
  if (filter.classes.length > 0 && !filter.classes.includes(classOf(build))) return false;
  if (modCount(build.mods) < filter.minMods) return false;
  if (filter.brands.length > 0) {
    const make = build.make.trim().toLowerCase();
    if (!filter.brands.some((b) => b.trim().toLowerCase() === make)) return false;
  }
  return true;
}

export interface InviteResult {
  userIds: string[];
  buildIds: string[];
}

/** Everyone with at least one matching build who lives inside the radius of the area. */
export function invitees(users: User[], builds: Build[], filter: InviteFilter, area: LatLng): InviteResult {
  const userIds: string[] = [];
  const buildIds: string[] = [];
  for (const user of users) {
    if (milesBetween(user.home, area) > filter.radiusMiles) continue;
    const own = builds.filter((b) => b.ownerId === user.id);
    const matching = filter.everyone ? own : own.filter((b) => buildMatches(b, filter));
    if (filter.everyone || matching.length > 0) {
      userIds.push(user.id);
      buildIds.push(...matching.map((b) => b.id));
    }
  }
  return { userIds, buildIds };
}

/**
 * Nothing narrowed: cars and bikes, any class, any mods, any brand. DESIGN-SYSTEM.md: nothing
 * picked means everyone, so the form saves this as `everyone` (the DB column the server reads).
 */
export function narrowsNothing(filter: Pick<InviteFilter, 'cars' | 'bikes' | 'classes' | 'minMods' | 'brands'>): boolean {
  return filter.cars && filter.bikes && filter.classes.length === 0 && filter.minMods <= 0 && filter.brands.length === 0;
}

/** The filter as saved: `everyone` set from the picks (REVIEW-9 decision 5), the radius kept. */
export function normaliseFilter(filter: InviteFilter): InviteFilter {
  if (filter.everyone || narrowsNothing(filter)) return { ...filter, everyone: true, cars: true, bikes: true, classes: [], minMods: 0, brands: [] };
  return filter;
}

/**
 * The invite in one line. An invite open to everyone still has a radius, so it
 * says so ("Anyone within 100 mi") rather than "everyone welcome".
 */
export function describeFilter(filter: InviteFilter): string {
  if (filter.everyone) return `Anyone within ${filter.radiusMiles} mi`;
  const parts: string[] = [];
  if (filter.cars && !filter.bikes) parts.push('Cars');
  else if (filter.bikes && !filter.cars) parts.push('Bikes');
  else parts.push('Cars and bikes');
  if (filter.classes.length > 0) parts.push(`Class ${classRange(filter.classes)}`);
  if (filter.minMods > 0) parts.push(`${filter.minMods}+ mods`);
  if (filter.brands.length > 0) parts.push(filter.brands.join(', '));
  parts.push(`within ${filter.radiusMiles} mi`);
  return parts.join(' · ');
}

/**
 * The host form's "Who can come" line (REVIEW-11): open reads as open, and the count says what
 * it is. `people` is the count as the form has it: "18", "fewer than 3", "…" or "?".
 *
 *   Open to anyone within 25 mi · about 18 people nearby
 *   Cars · Class A–S · within 25 mi · 7 people match
 */
export function inviteSummary(filter: InviteFilter, people: string): string {
  const n = /^\d+$/.test(people) ? Number(people) : null;
  if (filter.everyone) {
    const count = n === null ? `${people} people nearby` : n === 1 ? 'about 1 person nearby' : `about ${n} people nearby`;
    return `Open to anyone within ${filter.radiusMiles} mi · ${count}`;
  }
  const count = n === null ? `${people} people match` : n === 1 ? '1 person matches' : `${n} people match`;
  return `${describeFilter(filter)} · ${count}`;
}

const ORDER = 'SABCD';
function classSort(a: string, b: string) {
  return ORDER.indexOf(a) - ORDER.indexOf(b);
}

/**
 * Classes in words, lowest first: a run reads as a range ("A–S", "C–A"), a gap as a list
 * ("B, S"), one on its own as itself ("S").
 */
export function classRange(classes: readonly string[]): string {
  const sorted = [...new Set(classes)].sort(classSort).reverse();
  if (sorted.length <= 1) return sorted.join('');
  const idx = sorted.map((c) => ORDER.indexOf(c));
  const run = idx.every((v, i) => i === 0 || idx[i - 1] - v === 1);
  return run ? `${sorted[0]}–${sorted[sorted.length - 1]}` : sorted.join(', ');
}

export type VehicleKey = 'car' | 'bike';

/**
 * The invite's Cars and Bikes as a filter-chip selection (DESIGN-SYSTEM.md: nothing selected =
 * everyone in that dimension). Both on is [], so tapping "Cars" means cars only, never "cars off".
 */
export function vehicleSelection(filter: Pick<InviteFilter, 'cars' | 'bikes'>): VehicleKey[] {
  if (filter.cars && !filter.bikes) return ['car'];
  if (filter.bikes && !filter.cars) return ['bike'];
  return [];
}

/** Back from the chips: [] (or both) is cars and bikes. */
export function fromVehicleSelection(selected: readonly VehicleKey[]): Pick<InviteFilter, 'cars' | 'bikes'> {
  const one = selected.length === 1 ? selected[0] : null;
  return { cars: one !== 'bike', bikes: one !== 'car' };
}

