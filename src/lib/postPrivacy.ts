import { canSeeStop, isPublicType } from './events';
import { milesBetween } from './geo';
import type { Post, PostDraft } from './posts';
import type { Crew, LatLng, NightEvent } from './types';

/**
 * A post must never give away a meet point before it shows (Redesign 2, 4.11; REVIEW-11 #16).
 * A post made at a meet point (a photo from the event page) is tied to that meet: it keeps the
 * meet's id and drops the typed place name. Its place line says the meet point only to people who
 * can see it, and "Around {Area}" to everyone else; the map's Posts layer leaves it out for them.
 * (Its pin stays on the post, so the event page still finds the photos taken there.)
 */

/** Within this of a meet point, a place is that meet point. */
export const MEET_POINT_MILES = 0.25;

/** The meet (and stop) a place is at, for meets whose location is hidden until it shows. Shows and track days are public. */
export function meetAt(at: LatLng | null | undefined, events: readonly NightEvent[]): { event: NightEvent; stopIndex: number } | null {
  if (!at) return null;
  for (const event of events) {
    if (isPublicType(event.type)) continue;
    const stopIndex = event.stops.findIndex((s) => s.at && milesBetween(s.at, at) <= MEET_POINT_MILES);
    if (stopIndex >= 0) return { event, stopIndex };
  }
  return null;
}

/** Before saving a post: a place at a hidden meet point gets the meet's id, and its name is dropped. */
export function guardMeetPoint(d: PostDraft, events: readonly NightEvent[]): PostDraft {
  const hit = meetAt(d.at, events);
  if (!hit) return d;
  return { ...d, placeName: undefined, eventId: hit.event.id };
}

/** Can this viewer see the meet point a place is at? True when it isn't at one. */
export function placeVisible(at: LatLng | null | undefined, viewer: { me: string; events: readonly NightEvent[]; crews: Crew[]; now: Date }): boolean {
  const hit = meetAt(at, viewer.events);
  return !hit || canSeeStop(hit.event, hit.stopIndex, viewer.me, viewer.crews, viewer.now);
}

/** The place line under a post for this viewer: the meet point only if they can see it. */
export function postPlace(
  post: Pick<Post, 'at' | 'placeName' | 'eventId'>,
  viewer: { me: string; events: readonly NightEvent[]; crews: Crew[]; now: Date },
): string | null {
  const tied = post.eventId ? viewer.events.find((e) => e.id === post.eventId) : undefined;
  const near = meetAt(post.at, viewer.events);
  const hit = near ?? (tied ? { event: tied, stopIndex: 0 } : null);
  if (hit) {
    const { event, stopIndex } = hit;
    if (canSeeStop(event, stopIndex, viewer.me, viewer.crews, viewer.now)) {
      // A rolling meet moves on: a tied post can't say which meet point, so it says none.
      return post.placeName ?? (!near && event.type === 'rolling' ? null : (event.stops[stopIndex]?.name ?? null));
    }
    return `Around ${event.areaName}`;
  }
  if (post.eventId) return null;
  return post.placeName ? post.placeName : post.at ? 'On the map' : null;
}
