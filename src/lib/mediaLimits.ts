/**
 * How many photos the server takes. 20261121100000_more_photos.sql raises posts, threads and
 * replies from 4 to 10 and adds photos to post comments (4). Until it's applied the app keeps to
 * the old limits, so a post never fails on the server: the remote service checks once whether
 * `post_comments.photos` exists (communityService `mediaLimits()`).
 */
export interface MediaLimits {
  /** Photos on a feed post, forum thread or forum reply. */
  photos: number;
  /** Photos on a post comment; 0 means comments can't have photos yet. */
  commentPhotos: number;
  /** Photos sent in one go in a chat (one message each). */
  chatPhotos: number;
  /** One video per post, thread, reply or message (20261121110100_videos.sql, build 16+). */
  video: boolean;
}

export const MEDIA_LIMITS: MediaLimits = { photos: 10, commentPhotos: 4, chatPhotos: 10, video: true };
/** Before the migration: what the server has always taken. */
export const OLD_MEDIA_LIMITS: MediaLimits = { photos: 4, commentPhotos: 0, chatPhotos: 10, video: false };

/** "Up to 10 photos a post." The same words as the server. */
export function photoLimitProblem(count: number, limit: number, what: 'post' | 'comment'): string | null {
  if (count <= limit) return null;
  return limit === 0 ? 'Comments can’t have photos yet.' : `Up to ${limit} photos a ${what}.`;
}

/** Postgres "undefined column": the server hasn't got comment photos yet. */
export function isMissingColumn(e: { code?: string; message?: string } | null | undefined): boolean {
  return !!e && (e.code === '42703' || /column .* does not exist/i.test(e.message ?? ''));
}
