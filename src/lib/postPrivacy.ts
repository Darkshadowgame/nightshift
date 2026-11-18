import { canSeeStop, isPublicType } from './events';
import { milesBetween } from './geo';
import type { Post, PostDraft } from './posts';
import type { Crew, LatLng, NightEvent } from './types';

/**
 * A post must never give away a meet point before it shows (Redesign 2, 4.11; REVIEW-11 #16).
 * A post made at a meet point (a photo from the event page) is tied to that meet: it keeps the
 * meet's id and drops the typed place name. Its card says "At {event name}" (a link to the event),
 * never the place, to anyone; the map's Posts layer leaves it out for people who can't see the meet point.
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

/** What a post card says about where it was taken. */
export type PostPlace = { kind: 'event'; eventId: string; text: string } | { kind: 'place'; text: string };

/**
 * Where a post was taken, for its card (REVIEW-12 #1). A post made at a meet (tied to it, or sitting
 * on one of its meet points) never names the place, to anyone, the author included: it says
 * "At {event name}" and links to the event, and the event page decides what to show about where it
 * is. A meet the viewer can't see at all (not in their list) gives no line. Any other post keeps its
 * own place name, or "On the map".
 */
export function postPlace(
  post: Pick<Post, 'at' | 'placeName' | 'eventId'>,
  viewer: { events: readonly NightEvent[] },
): PostPlace | null {
  const tied = post.eventId ? viewer.events.find((e) => e.id === post.eventId) : undefined;
  const event = tied ?? (post.eventId ? undefined : meetAt(post.at, viewer.events)?.event);
  if (event) return { kind: 'event', eventId: event.id, text: `At ${event.title}` };
  if (post.eventId) return null;
  if (post.placeName) return { kind: 'place', text: post.placeName };
  return post.at ? { kind: 'place', text: 'On the map' } : null;
}
