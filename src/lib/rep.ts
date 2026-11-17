import { awardRep, type Award } from './awards';
import { phaseOf } from './events';
import { hasCompleted, statsOf } from './spots';
import type { Build, NightEvent, Spot } from './types';

/**
 * Rep for people who suggest drives and photo spots (Phase 3 feature; the maths lives here now).
 *
 * - Suggesting a route or spot that gets approved: +50.
 * - Every time someone else completes the route or visits the spot (GPS-checked; a spot
 *   visit also needs a photo taken there), they're asked for 1–5 stars.
 * - The author earns per completion, scaled by the average rating:
 *   routes 5 stars = 20, 4 = 12, 3 = 5, 2 = 1, 1 = 0; photo spots pay half (10, 6, 2, 0, 0)
 *   because a stop for a photo is easier than driving a whole route.
 * So a great route lots of people drive earns far more than a poor one few people take.
 *
 * Anti-gaming: only completed drives can rate, one rating per person per route,
 * the author can't rate their own route, and the average uses a prior of
 * 3 stars from 5 imaginary ratings, so three mates giving 5 stars can't max it out.
 */

export const ROUTE_APPROVED_REP = 50;
const PER_COMPLETION_BY_STARS = { route: [0, 0, 1, 5, 12, 20], spot: [0, 0, 0, 2, 6, 10] }; // index = rounded stars
const PRIOR_STARS = 3;
const PRIOR_COUNT = 5;

export interface RouteRating {
  userId: string;
  stars: number;
}

export interface RouteStats {
  /** Drive or photo spot. Defaults to a drive (route). */
  kind?: 'route' | 'spot';
  authorId: string;
  /** User ids of GPS-verified completions, one entry per drive. */
  completions: string[];
  ratings: RouteRating[];
}

/** Ratings that count: from people who completed it, not the author, latest one per person. */
export function validRatings(route: RouteStats): RouteRating[] {
  const completed = new Set(route.completions);
  const latest = new Map<string, number>();
  for (const r of route.ratings) {
    if (r.userId === route.authorId || !completed.has(r.userId)) continue;
    if (r.stars < 1 || r.stars > 5) continue;
    latest.set(r.userId, Math.round(r.stars));
  }
  return [...latest].map(([userId, stars]) => ({ userId, stars }));
}

/** Average with a prior, so a handful of ratings can't push a route to the top. */
export function routeScore(route: RouteStats): number {
  const ratings = validRatings(route);
  const total = ratings.reduce((s, r) => s + r.stars, 0) + PRIOR_STARS * PRIOR_COUNT;
  return total / (ratings.length + PRIOR_COUNT);
}

export function authorRep(route: RouteStats): number {
  const byOthers = route.completions.filter((u) => u !== route.authorId).length;
  const per = PER_COMPLETION_BY_STARS[route.kind ?? 'route'][Math.round(routeScore(route))];
  return ROUTE_APPROVED_REP + byOthers * per;
}

// ---------------------------------------------------------------------------
// The rep ledger: everything a person has earned, and their level
// ---------------------------------------------------------------------------

export const REP = {
  /** Per event you checked in at. */
  attended: 150,
  /** Per finished event you hosted with 10 or more people checked in. */
  hostedBig: 400,
  /** Per other finished event you hosted. */
  hostedSmall: 100,
  /** People checked in for the bigger hosting reward. */
  hostedBigCrowd: 10,
  /** First time you finish each drive. */
  drive: 100,
  /** First visit to each photo spot. */
  photoSpot: 50,
  /** Per logged mod on your builds. */
  mod: 20,
} as const;

export type RepSource = 'attended' | 'hosted' | 'drives' | 'spots' | 'authored' | 'awards' | 'mods';

export interface RepLine {
  source: RepSource;
  label: string;
  /** How many things earned it (events, drives, mods...). */
  count: number;
  rep: number;
}

export interface RepLedger {
  total: number;
  lines: RepLine[];
}

export interface RepInputs {
  events: NightEvent[];
  spots: Spot[];
  builds: Build[];
  awards: Award[];
  now: Date;
}

function checkedInAt(e: NightEvent, userId: string): boolean {
  return (e.checkIns[userId] ?? []).length > 0;
}

function crowd(e: NightEvent): number {
  return Object.values(e.checkIns).filter((ids) => ids.length > 0).length;
}

/** Every source of someone's rep, with counts. Pure, so it's the same on every phone. */
export function repLedger(userId: string, input: RepInputs): RepLedger {
  const live = input.events.filter((e) => !e.cancelled);
  const attended = live.filter((e) => checkedInAt(e, userId)).length;

  const hosted = live.filter((e) => e.hostIds.includes(userId) && phaseOf(e, input.now) === 'over');
  const hostedRep = hosted.reduce((s, e) => s + (crowd(e) >= REP.hostedBigCrowd ? REP.hostedBig : REP.hostedSmall), 0);

  // Your own places don't pay you for driving or visiting them.
  const others = input.spots.filter((s) => s.status === 'approved' && s.authorId !== userId);
  const drives = others.filter((s) => s.kind === 'drive' && hasCompleted(s, userId)).length;
  const spots = others.filter((s) => s.kind === 'photo' && hasCompleted(s, userId)).length;

  const authored = input.spots.filter((s) => s.authorId === userId && s.status === 'approved' && s.kind !== 'track');
  const authoredRep = authored.reduce((sum, s) => sum + authorRep(statsOf(s)), 0);

  const mine = input.awards.filter((a) => a.ownerId === userId);
  const mods = input.builds.filter((b) => b.ownerId === userId).reduce((n, b) => n + b.mods.length, 0);

  const lines: RepLine[] = [
    { source: 'attended', label: 'Meets attended', count: attended, rep: attended * REP.attended },
    { source: 'hosted', label: 'Events hosted', count: hosted.length, rep: hostedRep },
    { source: 'drives', label: 'Drives finished', count: drives, rep: drives * REP.drive },
    { source: 'spots', label: 'Photo spots visited', count: spots, rep: spots * REP.photoSpot },
    { source: 'authored', label: 'Places you suggested', count: authored.length, rep: authoredRep },
    { source: 'awards', label: 'Trophies', count: mine.length, rep: awardRep(input.awards, userId) },
    { source: 'mods', label: 'Mods logged', count: mods, rep: mods * REP.mod },
  ];
  return { total: lines.reduce((s, l) => s + l.rep, 0), lines };
}

/** Rep needed to reach a level. Level 1 is 0, level 2 is 250, 3 is 750, 4 is 1,500 and so on. */
export function repForLevel(level: number): number {
  const n = Math.max(1, Math.floor(level)) - 1;
  return (250 * n * (n + 1)) / 2;
}

export interface LevelInfo {
  level: number;
  rep: number;
  /** Rep at the start of this level. */
  floor: number;
  /** Rep needed for the next level. */
  next: number;
  /** 0 to 1 through this level. */
  progress: number;
}

export function levelFor(rep: number): LevelInfo {
  const r = Math.max(0, Math.floor(rep));
  let level = 1;
  while (repForLevel(level + 1) <= r) level++;
  const floor = repForLevel(level);
  const next = repForLevel(level + 1);
  return { level, rep: r, floor, next, progress: (r - floor) / (next - floor) };
}
