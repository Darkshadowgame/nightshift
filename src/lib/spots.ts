import { banZoneAt, banZoneWarning } from './events';
import { milesBetween } from './geo';
import type { RouteStats } from './rep';
import type { BanZone, LatLng, Spot, SpotCompletion } from './types';

/**
 * Drives and photo spots.
 *
 * A drive is finished by passing every checkpoint (the points of its path) in
 * order within a generous time window. A run that would mean averaging more
 * than MAX_AVERAGE_MPH doesn't count. Nothing here ever reports a time or a
 * speed: the only answer is pass or fail, and only the day is stored.
 */

/** How close you must get to a drive checkpoint. */
export const CHECKPOINT_RADIUS_MILES = 0.2;
/** How close you must be to a photo spot to check in. */
export const PHOTO_SPOT_RADIUS_MILES = 0.2;
/** Above this average the run is implausible on these roads at the limits. */
export const MAX_AVERAGE_MPH = 60;
/** Pending suggestions are approved after this long in the demo. */
export const DEMO_APPROVAL_MS = 10_000;

export const SPOT_LABELS = { drive: 'Drive', photo: 'Photo spot', track: 'Track' } as const;

/** Length of a line through the points, in miles. */
export function pathMiles(path: LatLng[]): number {
  let total = 0;
  for (let i = 1; i < path.length; i++) total += milesBetween(path[i - 1], path[i]);
  return total;
}

/** The distance used for the plausibility check: the stated road length, or the line. */
export function driveMiles(spot: Spot): number {
  return spot.miles ?? pathMiles(spot.path ?? []);
}

/** Generous: half an hour plus 6 minutes a mile (10 mph on average). */
export function driveWindowMs(miles: number): number {
  return (30 + miles * 6) * 60_000;
}

export interface DriveRun {
  /** Checkpoints passed so far, in order. */
  passed: number;
  /** When the first checkpoint was passed (ms). Kept in memory only. */
  startedAt?: number;
  /** When the latest checkpoint was passed (ms). Kept in memory only. */
  lastAt?: number;
}

export const NEW_RUN: DriveRun = { passed: 0 };

/** Feed a GPS fix in. Only the next checkpoint counts, so they have to be passed in order. */
export function advanceRun(run: DriveRun, checkpoints: LatLng[], position: LatLng, atMs: number): DriveRun {
  const next = checkpoints[run.passed];
  if (!next) return run;
  if (milesBetween(position, next) > CHECKPOINT_RADIUS_MILES) return run;
  return { passed: run.passed + 1, startedAt: run.startedAt ?? atMs, lastAt: atMs };
}

export function runExpired(run: DriveRun, miles: number, nowMs: number): boolean {
  return run.startedAt !== undefined && nowMs - run.startedAt > driveWindowMs(miles);
}

export type Verdict = { ok: true } | { ok: false; reason: string };

/** Pass or fail. The reason never includes a time or a speed. */
export function judgeRun(run: DriveRun, checkpoints: LatLng[], miles: number): Verdict {
  if (checkpoints.length < 2) return { ok: false, reason: 'This drive has no checkpoints.' };
  if (run.passed < checkpoints.length || run.startedAt === undefined || run.lastAt === undefined)
    return { ok: false, reason: 'Pass every checkpoint in order to finish.' };
  const elapsed = run.lastAt - run.startedAt;
  if (elapsed > driveWindowMs(miles))
    return { ok: false, reason: "That took longer than a drive allows, so it doesn't count. Start again when you're ready." };
  const hours = elapsed / 3_600_000;
  if (hours <= 0 || miles / hours > MAX_AVERAGE_MPH)
    return { ok: false, reason: "That was quicker than these roads allow at the speed limits, so it doesn't count. Drives are never about speed." };
  return { ok: true };
}

/**
 * Simulate mode: timestamps for each checkpoint as if driven at a steady,
 * legal pace, so the same checks run as on the road.
 */
export function simulatedTimes(checkpoints: LatLng[], miles: number, startMs: number, mph = 35): number[] {
  const line = pathMiles(checkpoints);
  const totalMs = (miles / mph) * 3_600_000;
  let done = 0;
  return checkpoints.map((p, i) => {
    if (i > 0) done += milesBetween(checkpoints[i - 1], p);
    return startMs + Math.round(line > 0 ? (done / line) * totalMs : 0);
  });
}

export function dayOf(now: Date): string {
  return now.toISOString().slice(0, 10);
}

export function hasCompleted(spot: Spot, userId: string): boolean {
  return spot.completions.some((c) => c.userId === userId);
}

/** Add a completion (drive finished, or photo spot visited). */
export function recordCompletion(spot: Spot, userId: string, now: Date, photo?: string): Spot {
  if (spot.status !== 'approved') throw new Error('This place is waiting for approval.');
  if (spot.kind === 'track') throw new Error('Tracks are driven at track days.');
  const c: SpotCompletion = { userId, on: dayOf(now), ...(photo ? { photo } : {}) };
  return { ...spot, completions: [...spot.completions, c] };
}

export function canRate(spot: Spot, userId: string): Verdict {
  if (spot.authorId === userId) return { ok: false, reason: "You can't rate a place you suggested." };
  if (!hasCompleted(spot, userId))
    return { ok: false, reason: spot.kind === 'drive' ? 'Finish the drive to rate it.' : 'Visit the spot to rate it.' };
  return { ok: true };
}

/** One rating per person: a new one replaces the old. */
export function rateSpot(spot: Spot, userId: string, stars: number): Spot {
  const ok = canRate(spot, userId);
  if (!ok.ok) throw new Error(ok.reason);
  const n = Math.round(stars);
  if (n < 1 || n > 5) throw new Error('Pick 1 to 5 stars.');
  return { ...spot, ratings: [...spot.ratings.filter((r) => r.userId !== userId), { userId, stars: n }] };
}

export function myRating(spot: Spot, userId: string): number | undefined {
  return spot.ratings.find((r) => r.userId === userId)?.stars;
}

/** Rating stats as rep.ts expects them. Repeat drives by the same person count once. */
export function statsOf(spot: Spot): RouteStats {
  return {
    kind: spot.kind === 'photo' ? 'spot' : 'route',
    authorId: spot.authorId ?? '',
    completions: [...new Set(spot.completions.map((c) => c.userId))],
    ratings: spot.ratings,
  };
}

/** Plain average of the ratings that count, for display. */
export function averageStars(spot: Spot): { average: number; count: number } {
  const counted = new Set(statsOf(spot).completions);
  const valid = spot.ratings.filter((r) => r.userId !== spot.authorId && counted.has(r.userId));
  if (valid.length === 0) return { average: 0, count: 0 };
  return { average: valid.reduce((s, r) => s + r.stars, 0) / valid.length, count: valid.length };
}

export function canVisit(spot: Spot, position: LatLng | null, skipDistance: boolean): Verdict {
  if (spot.kind !== 'photo') return { ok: false, reason: 'Only photo spots take check-ins.' };
  if (spot.status !== 'approved') return { ok: false, reason: 'This spot is waiting for approval.' };
  if (skipDistance) return { ok: true };
  if (!position) return { ok: false, reason: 'Turn on location so the app can see you are at the spot.' };
  if (milesBetween(position, spot.at) > PHOTO_SPOT_RADIUS_MILES)
    return { ok: false, reason: `You need to be within ${PHOTO_SPOT_RADIUS_MILES} mi of ${spot.name}.` };
  return { ok: true };
}

/** Places people can see: approved ones, plus your own pending suggestions. */
export function visibleSpots(spots: Spot[], userId: string): Spot[] {
  return spots.filter((s) => s.status === 'approved' || s.authorId === userId);
}

// ---------------------------------------------------------------------------
// Suggestions
// ---------------------------------------------------------------------------

export interface SpotDraft {
  kind: 'drive' | 'photo';
  name: string;
  description: string;
  /** Drives: the route, in order. Photo spots: one point. */
  points: LatLng[];
}

export const MIN_DRIVE_MILES = 1;
export const MAX_DRIVE_MILES = 80;

export function draftProblem(d: SpotDraft, spots: Spot[]): string | null {
  const name = d.name.trim();
  if (name.length < 3) return 'Give it a name of at least 3 characters.';
  if (name.length > 40) return 'Keep the name to 40 characters or fewer.';
  if (spots.some((s) => s.name.toLowerCase() === name.toLowerCase())) return 'There is already a place with that name.';
  if (d.kind === 'photo') {
    if (d.points.length !== 1) return 'Long-press the map to place the spot.';
    return null;
  }
  if (d.points.length < 2) return 'Long-press the map to add at least a start and a finish.';
  const miles = pathMiles(d.points);
  if (miles < MIN_DRIVE_MILES) return `A drive needs to be at least ${MIN_DRIVE_MILES} mile long.`;
  if (miles > MAX_DRIVE_MILES) return `Keep drives under ${MAX_DRIVE_MILES} miles.`;
  return null;
}

/** The first ban zone any point of the draft is inside. */
export function draftBanZone(points: LatLng[], zones: BanZone[]): BanZone | undefined {
  for (const p of points) {
    const z = banZoneAt(p, zones);
    if (z) return z;
  }
  return undefined;
}

/** Turn a draft into a pending place. Throws if the draft isn't ready. */
export function makeSpot(
  d: SpotDraft,
  authorId: string,
  now: Date,
  id: string,
  spots: Spot[],
  zones: BanZone[],
): { spot: Spot; warning?: string } {
  const problem = draftProblem(d, spots);
  if (problem) throw new Error(problem);
  const zone = draftBanZone(d.points, zones);
  const name = d.name.trim();
  const base: Spot = {
    id,
    kind: d.kind,
    name,
    at: d.points[0],
    description: d.description.trim() || (d.kind === 'drive' ? 'A drive suggested by the community. Never timed.' : 'A photo spot suggested by the community.'),
    authorId,
    status: 'pending',
    createdAt: now.toISOString(),
    completions: [],
    ratings: [],
    ...(zone ? { banZone: zone.name } : {}),
  };
  const spot: Spot =
    d.kind === 'drive'
      ? { ...base, path: d.points, miles: Math.round(pathMiles(d.points) * 10) / 10, at: d.points[Math.floor(d.points.length / 2)] }
      : base;
  return { spot, warning: zone ? banZoneWarning(name, zone) : undefined };
}

/** Demo only: approve suggestions once they've waited long enough. */
export function approveDue(spots: Spot[], now: Date): Spot[] {
  let changed = false;
  const next = spots.map((s) => {
    if (s.status === 'pending' && now.getTime() - new Date(s.createdAt).getTime() >= DEMO_APPROVAL_MS) {
      changed = true;
      return { ...s, status: 'approved' as const };
    }
    return s;
  });
  return changed ? next : spots;
}
