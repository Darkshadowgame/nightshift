import { phaseOf } from './events';
import { attendedEvents } from './rep';
import type { Build, Crew, NightEvent, User } from './types';

/** A crew member's vehicle, for the crew page. */
export interface CrewVehicle {
  build: Build;
  owner: User;
}

/** Every vehicle owned by someone in the crew (not blocked), members in crew order. */
export function crewVehicles(crew: Crew, users: User[], builds: Build[], blocked: ReadonlySet<string> = new Set()): CrewVehicle[] {
  const out: CrewVehicle[] = [];
  for (const uid of crew.memberIds) {
    if (blocked.has(uid)) continue;
    const owner = users.find((u) => u.id === uid);
    if (!owner) continue;
    for (const build of builds.filter((b) => b.ownerId === uid)) out.push({ build, owner });
  }
  return out;
}

/** An upcoming meet that some of the crew are going to. Counts only: never which member, which would say where one person will be. */
export interface CrewMeet {
  event: NightEvent;
  crewGoing: number;
}

/** Meets still to come (or live now) with at least one crew member going, soonest first. Blocked people are not counted. */
export function crewMeets(crew: Crew, events: NightEvent[], now: Date, blocked: ReadonlySet<string> = new Set(), limit = 5): CrewMeet[] {
  const members = new Set(crew.memberIds.filter((m) => !blocked.has(m)));
  return events
    .filter((e) => {
      const p = phaseOf(e, now);
      return p !== 'over' && p !== 'cancelled';
    })
    .map((event) => ({ event, crewGoing: event.going.filter((g) => members.has(g)).length }))
    .filter((x) => x.crewGoing > 0)
    .sort((a, b) => a.event.startsAt.localeCompare(b.event.startsAt))
    .slice(0, limit);
}

/** Meets two people have both been to: the count, and the most recent few. Checked in at, never just "going". */
export function mutualMeets(events: NightEvent[], a: string, b: string, now: Date, limit = 3): { count: number; recent: NightEvent[] } {
  if (a === b) return { count: 0, recent: [] };
  const mine = new Set(attendedEvents(events, a, now).map((e) => e.id));
  const both = attendedEvents(events, b, now).filter((e) => mine.has(e.id)).sort((x, y) => y.startsAt.localeCompare(x.startsAt));
  return { count: both.length, recent: both.slice(0, limit) };
}
