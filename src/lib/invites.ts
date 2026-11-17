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

export function describeFilter(filter: InviteFilter): string {
  if (filter.everyone) return `Everyone welcome · ${filter.radiusMiles} mi`;
  const parts: string[] = [];
  if (filter.cars && !filter.bikes) parts.push('Cars');
  else if (filter.bikes && !filter.cars) parts.push('Bikes');
  else parts.push('Cars + bikes');
  if (filter.classes.length > 0) parts.push(`Class ${[...filter.classes].sort(classSort).join('/')}`);
  if (filter.minMods > 0) parts.push(`${filter.minMods}+ mods`);
  if (filter.brands.length > 0) parts.push(filter.brands.join(', '));
  parts.push(`${filter.radiusMiles} mi`);
  return parts.join(' · ');
}

const ORDER = 'SABCD';
function classSort(a: string, b: string) {
  return ORDER.indexOf(a) - ORDER.indexOf(b);
}
