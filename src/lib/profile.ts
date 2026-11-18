import { alertProblem, travelProblem, type AlertMode } from './discover';
import { fuzz } from './geo';
import type { LatLng, User } from './types';

/** Regions to pick from on first run, with a map centre for each. */
export const REGIONS: { name: string; centre: LatLng }[] = [
  { name: 'Midlands', centre: { lat: 52.6, lng: -1.7 } },
  { name: 'North West', centre: { lat: 53.5, lng: -2.5 } },
  { name: 'North East', centre: { lat: 54.9, lng: -1.6 } },
  { name: 'Yorkshire', centre: { lat: 53.8, lng: -1.5 } },
  { name: 'East', centre: { lat: 52.4, lng: 0.7 } },
  { name: 'London', centre: { lat: 51.51, lng: -0.12 } },
  { name: 'South East', centre: { lat: 51.2, lng: -0.6 } },
  { name: 'South West', centre: { lat: 50.9, lng: -3.3 } },
  { name: 'Wales', centre: { lat: 52.2, lng: -3.6 } },
  { name: 'Scotland', centre: { lat: 56.0, lng: -3.8 } },
  { name: 'Northern Ireland', centre: { lat: 54.6, lng: -6.3 } },
];

/** The region whose centre is closest: a sensible default name for an event's area. */
export function nearestRegion(p: LatLng): string {
  const d = (r: LatLng) => (r.lat - p.lat) ** 2 + ((r.lng - p.lng) * Math.cos((p.lat * Math.PI) / 180)) ** 2;
  return [...REGIONS].sort((a, b) => d(a.centre) - d(b.centre))[0].name;
}

export function regionCentre(region: string): LatLng {
  return (REGIONS.find((r) => r.name === region) ?? REGIONS[0]).centre;
}

export interface ProfileDraft {
  handle: string;
  name: string;
  region: string;
  home: LatLng | null;
  /** Willing to travel, in whole miles. Left out: keep what's saved (or the default). */
  travelMiles?: number;
  /** New events near you: notify, search or off. Left out: keep what's saved. */
  alerts?: AlertMode;
}

/** "@Dan_R " -> "dan_r". */
export function normaliseHandle(raw: string): string {
  return raw.trim().replace(/^@+/, '').toLowerCase();
}

/**
 * A handle for someone trying the demo who hasn't typed one (REVIEW-9): "night_4821", or after
 * the car they picked ("civic_4821"). Changeable later on the profile. `n` is 1000–9999.
 */
export function suggestHandle(model: string | undefined, n: number): string {
  const word = (model ?? '').toLowerCase().split(/[^a-z0-9]+/).find((w) => /^[a-z][a-z0-9]{2,11}$/.test(w));
  return `${word ?? 'night'}_${Math.max(1000, Math.min(9999, Math.round(n)))}`;
}

export function handleProblem(raw: string, users: User[], me: string): string | null {
  const handle = normaliseHandle(raw);
  if (handle.length < 3) return 'Handles need at least 3 characters.';
  if (handle.length > 20) return 'Keep your handle to 20 characters or fewer.';
  if (!/^[a-z0-9._]+$/.test(handle)) return 'Use letters, numbers, dots and underscores only.';
  if (users.some((u) => u.id !== me && u.handle.toLowerCase() === handle)) return 'Someone already has that handle.';
  return null;
}

/** The first thing wrong with the draft, or null when it can be saved. */
export function profileProblem(draft: ProfileDraft, users: User[], me: string): string | null {
  const h = handleProblem(draft.handle, users, me);
  if (h) return h;
  if (!draft.name.trim()) return 'Add a display name.';
  if (draft.name.trim().length > 30) return 'Keep your name to 30 characters or fewer.';
  if (!REGIONS.some((r) => r.name === draft.region)) return 'Pick your region.';
  if (!draft.home) return 'Set your rough home area: use your current location, search your town or postcode, or choose it on the map.';
  if (draft.travelMiles !== undefined) {
    const t = travelProblem(draft.travelMiles);
    if (t) return t;
  }
  if (draft.alerts !== undefined) {
    const a = alertProblem(draft.alerts);
    if (a) return a;
  }
  return null;
}

/** Apply the draft to the user. Home is always saved fuzzed to about 1 km. */
export function applyProfile(user: User, draft: ProfileDraft): User {
  return {
    ...user,
    handle: normaliseHandle(draft.handle),
    name: draft.name.trim(),
    region: draft.region,
    home: draft.home ? fuzz(draft.home) : user.home,
    travelMiles: draft.travelMiles ?? user.travelMiles,
    alerts: draft.alerts ?? user.alerts,
  };
}
