import { awardRep, hasLegend, type Award } from './awards';
import { isHost, phaseOf } from './events';
import { attendedEvents, hostedEvents } from './rep';
import type { Build, Crew, NightEvent, User } from './types';

/**
 * What other people can see about someone. Deliberately has no location:
 * never the home area, and no upcoming events (those could give away where
 * someone will be).
 */
export interface PublicProfile {
  id: string;
  handle: string;
  name: string;
  region: string;
  crew?: Crew;
  builds: Build[];
  trophies: Award[];
  awardRep: number;
  legend: boolean;
  /** Events they checked in at (live or finished, not cancelled): the rep ledger's count. */
  meetsAttended: number;
  /** Finished events they hosted: the rep ledger's count. */
  hosted: number;
  /** Events they took part in: checked in at, or hosted once it started. The profile's "Events". */
  events: number;
}

export function publicProfile(
  userId: string,
  users: User[],
  builds: Build[],
  crews: Crew[],
  events: NightEvent[],
  awards: Award[],
  now: Date,
): PublicProfile | null {
  const user = users.find((u) => u.id === userId);
  if (!user) return null;
  return {
    id: user.id,
    handle: user.handle,
    name: user.name,
    region: user.region,
    crew: crews.find((c) => c.id === user.crewId),
    builds: builds.filter((b) => b.ownerId === userId),
    trophies: awards.filter((a) => a.ownerId === userId),
    awardRep: awardRep(awards, userId),
    legend: hasLegend(awards, userId, now),
    meetsAttended: attendedEvents(events, userId, now).length,
    hosted: hostedEvents(events, userId, crews, now).length,
    // "Events" on a profile: every event they checked in at or hosted once it started (REVIEW-8: "0 Events"
    // after checking in at one). Upcoming ones stay out (they'd say where someone will be); cancelled never count.
    events: new Set([
      ...attendedEvents(events, userId, now).map((e) => e.id),
      ...events.filter((e) => ['live', 'over'].includes(phaseOf(e, now)) && isHost(e, userId, crews)).map((e) => e.id),
    ]).size,
  };
}
