import { milesBetween } from './geo';
import { textProblem } from './moderation';
import type { LatLng } from './types';
import { videoProblem, type VideoDraft, type VideoRef } from './videoRules';

/**
 * Feed posts (Community › Feed): text and up to 10 plate-blurred photos, an
 * optional place picked on the map, Public or Connections only, likes and
 * comments. Posts with a place show on the map's Posts layer. Mirrors
 * create_post(), feed_posts(), like_post() and comment_post().
 *
 * Location privacy: never within about 1 km of your own home area (the
 * server refuses it too), so a post can't give away where you live.
 */

export type PostVisibility = 'public' | 'connections';

export const VISIBILITY: Record<PostVisibility, { label: string; hint: string }> = {
  public: { label: 'Public', hint: 'Everyone on Nightshift' },
  connections: { label: 'Connections', hint: 'Only people you’re connected with' },
};

export interface Post {
  id: string;
  authorId: string;
  body: string;
  /** Photo refs: stored names on the phone, signed URLs from the server. */
  photos: string[];
  /** One clip with its cover (build 16+). */
  video?: VideoRef;
  at?: LatLng;
  placeName?: string;
  visibility: PostVisibility;
  buildId?: string;
  /** Made at a meet's meet point: the meet, never the place (postPrivacy.ts). */
  eventId?: string;
  createdAt: string;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  /** Hidden after reports: only the author sees it, with a note. */
  hidden?: boolean;
  sample?: boolean;
}

export interface PostComment {
  id: string;
  postId: string;
  authorId: string;
  body: string;
  /** Up to 4 plate-blurred photos (20261121100000_more_photos.sql); refs like a post's. */
  photos?: string[];
  createdAt: string;
  hidden?: boolean;
  sample?: boolean;
}

export interface PostDraft {
  body: string;
  photos: string[];
  video?: VideoDraft | null;
  at?: LatLng | null;
  placeName?: string;
  visibility: PostVisibility;
  buildId?: string;
  /** Set by guardMeetPoint (postPrivacy.ts) for a post made at a meet point. */
  eventId?: string;
}

export const POST_LIMITS = { body: 2000, comment: 1000, photos: 10, commentPhotos: 4, placeName: 80 } as const;
/** No place within this of your home area (the server uses 1 km too). */
export const HOME_CLEARANCE_KM = 1;
const UK = { south: 49.8, north: 60.9, west: -8.7, east: 1.9 };

/** Why this place can't be shared, or null. `home`: your own (fuzzed) home area. */
export function locationProblem(at: LatLng, home: LatLng | null): string | null {
  if (at.lat < UK.south || at.lat > UK.north || at.lng < UK.west || at.lng > UK.east) return 'Places are for the UK only.';
  if (home && (home.lat !== 0 || home.lng !== 0) && milesBetween(at, home) * 1.609344 < HOME_CLEARANCE_KM) {
    return "That's within about 1 km of your home area, so it can't be shared. Pick a spot further away.";
  }
  return null;
}

export function postProblem(d: PostDraft, home: LatLng | null): string | null {
  const body = d.body.trim();
  if (!body && d.photos.length === 0 && !d.video) return 'Write something or add a photo.';
  const v = videoProblem(d.video);
  if (v) return v;
  if (body.length > POST_LIMITS.body) return 'Keep it to 2,000 characters or fewer.';
  if (d.photos.length > POST_LIMITS.photos) return 'Up to 10 photos a post.';
  if (d.at) {
    const p = locationProblem(d.at, home);
    if (p) return p;
  }
  return textProblem(`${body}\n${d.at ? d.placeName ?? '' : ''}`);
}

export function commentProblem(body: string, photos: readonly string[] = []): string | null {
  const b = body.trim();
  if (!b && photos.length === 0) return 'Write a comment first.';
  if (photos.length > POST_LIMITS.commentPhotos) return 'Up to 4 photos a comment.';
  if (!b) return null;
  if (b.length > POST_LIMITS.comment) return 'Keep it to 1,000 characters or fewer.';
  return textProblem(b);
}

/** Snap a shared place to 4 decimal places (~10 m), as the server stores it. */
export function snapPlace(at: LatLng): LatLng {
  return { lat: Math.round(at.lat * 1e4) / 1e4, lng: Math.round(at.lng * 1e4) / 1e4 };
}

export type FeedScope = 'local' | 'connections';

/**
 * The demo's feed_posts(). Local: public posts placed within `miles` of your
 * home area or by people living within it. Connections: theirs and yours.
 * Never people you blocked (or who blocked you); hidden posts only to their author.
 */
export function feedFor(
  posts: Post[],
  scope: FeedScope,
  ctx: { me: string; home: LatLng | null; miles: number; homes: Map<string, LatLng>; connected: ReadonlySet<string>; blocked: ReadonlySet<string> },
): Post[] {
  const visible = posts.filter((p) => canSee(p, ctx));
  const chosen = visible.filter((p) => {
    if (scope === 'connections') return p.authorId === ctx.me || ctx.connected.has(p.authorId);
    if (p.visibility !== 'public' || !ctx.home) return false;
    if (p.at && milesBetween(p.at, ctx.home) <= ctx.miles) return true;
    const h = ctx.homes.get(p.authorId);
    return !!h && milesBetween(h, ctx.home) <= ctx.miles;
  });
  return chosen.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** The same rule as private.can_see_post(). */
export function canSee(p: Post, ctx: { me: string; connected: ReadonlySet<string>; blocked: ReadonlySet<string> }): boolean {
  if (p.authorId === ctx.me) return true;
  if (p.hidden || ctx.blocked.has(p.authorId)) return false;
  return p.visibility === 'public' || ctx.connected.has(p.authorId);
}

/** Posts with a place, in a map box, from the last 30 days (posts_in_box()). */
export function postsInBox(posts: Post[], box: { south: number; west: number; north: number; east: number }, now: Date): Post[] {
  const since = now.getTime() - 30 * 86_400_000;
  return posts.filter(
    (p) => p.at && !p.hidden && new Date(p.createdAt).getTime() > since && p.at.lat >= box.south && p.at.lat <= box.north && p.at.lng >= box.west && p.at.lng <= box.east,
  );
}

/** Apply a like or unlike to a post the phone already has. */
export function withLike(p: Post, on: boolean): Post {
  if (p.likedByMe === on) return p;
  return { ...p, likedByMe: on, likeCount: Math.max(0, p.likeCount + (on ? 1 : -1)) };
}

/** Community's one feed (Redesign 2, 3.7): near you plus your connections, each post once, newest first. Null until either has loaded. */
export function mergeFeeds(a: Post[] | null, b: Post[] | null): Post[] | null {
  if (!a && !b) return null;
  const byId = new Map<string, Post>();
  for (const p of [...(a ?? []), ...(b ?? [])]) if (!byId.has(p.id)) byId.set(p.id, p);
  return [...byId.values()].sort((x, y) => y.createdAt.localeCompare(x.createdAt));
}
