/**
 * Rep for people who suggest sprint routes and photo spots (Phase 3 feature; the maths lives here now).
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
  /** Sprint route or photo spot. Defaults to route. */
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
