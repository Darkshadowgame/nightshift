import { classOf } from './classes';
import { milesBetween } from './geo';
import type { Build, InviteFilter, LatLng, User } from './types';

export const DEFAULT_FILTER: InviteFilter = {
  everyone: false,
  cars: true,
  bikes: true,
  classes: [],
  minMods: 3,
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

export function buildMatches(build: Build, filter: InviteFilter): boolean {
  if (filter.everyone) return true;
  if (build.kind === 'car' && !filter.cars) return false;
  if (build.kind === 'bike' && !filter.bikes) return false;
  if (filter.classes.length > 0 && !filter.classes.includes(classOf(build))) return false;
  if (build.mods.length < filter.minMods) return false;
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
 * The invite in one line. An invite open to everyone still has a radius, so it
 * says so ("Public · anyone within 100 mi") rather than "everyone welcome".
 */
export function describeFilter(filter: InviteFilter): string {
  if (filter.everyone) return `Public · anyone within ${filter.radiusMiles} mi`;
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

