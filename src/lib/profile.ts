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

export function regionCentre(region: string): LatLng {
  return (REGIONS.find((r) => r.name === region) ?? REGIONS[0]).centre;
}

export interface ProfileDraft {
  handle: string;
  name: string;
  region: string;
  home: LatLng | null;
}

/** "@Dan_R " -> "dan_r". */
export function normaliseHandle(raw: string): string {
  return raw.trim().replace(/^@+/, '').toLowerCase();
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
  if (!draft.home) return 'Long-press the map to set your rough home area.';
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
  };
}
