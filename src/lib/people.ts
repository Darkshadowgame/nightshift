import { awardRep, hasLegend, type Award } from './awards';
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
  /** Finished events they checked in at. */
  meetsAttended: number;
  /** Finished events they hosted. */
  hosted: number;
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
  };
}
