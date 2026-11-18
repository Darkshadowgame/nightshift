import { activeStopIndex, canSeeStop, hasRequested, isHost, isPublicType, phaseOf, type Phase } from './events';
import { invitees } from './invites';
import type { Build, Crew, NightEvent, User } from './types';

/**
 * How this person relates to an event. `requested`: they asked to go and a host
 * hasn't answered. `declined`: a host said no. Neither can see the place.
 */
export type Role = 'host' | 'going' | 'invited' | 'public' | 'requested' | 'declined' | 'none';

/** Roles that can tap "I'm going" and go straight in. */
export function canJoinDirectly(role: Role): boolean {
  return role === 'host' || role === 'going' || role === 'invited' || role === 'public';
}

export interface EventView {
  event: NightEvent;
  role: Role;
  phase: Phase;
  /** Index of the stop to show on the map, or -1 when only the area may be shown. */
  shownStop: number;
}

export function roleOf(event: NightEvent, me: string, crews: Crew[], users: User[], builds: Build[]): Role {
  if (isHost(event, me, crews)) return 'host';
  if (event.going.includes(me)) return 'going';
  if (isPublicType(event.type)) return 'public';
  const meUser = users.find((u) => u.id === me);
  if (meUser && invitees([meUser], builds, event.filter, event.area).userIds.includes(me)) return 'invited';
  if (hasRequested(event, me)) return 'requested';
  if (event.declined?.includes(me)) return 'declined';
  return 'none';
}

/** How one event looks to this user (any role, including none). */
export function viewEvent(event: NightEvent, me: string, crews: Crew[], users: User[], builds: Build[], now: Date): EventView {
  const role = roleOf(event, me, crews, users, builds);
  const phase = phaseOf(event, now);
  const active = activeStopIndex(event);
  // The furthest stop this user may see, up to the active one.
  let shownStop = -1;
  for (let i = active; i >= 0; i--) {
    if (canSeeStop(event, i, me, crews, now)) {
      shownStop = i;
      break;
    }
  }
  return { event, role, phase, shownStop };
}

/**
 * Every event, as this user sees it, soonest first. Events not open to you stay in (Redesign 2: they
 * say "Not open to your car" instead of disappearing).
 */
export function viewEvents(events: NightEvent[], me: string, crews: Crew[], users: User[], builds: Build[], now: Date): EventView[] {
  return events
    .map((event) => viewEvent(event, me, crews, users, builds, now))
    .sort((a, b) => new Date(a.event.startsAt).getTime() - new Date(b.event.startsAt).getTime());
}

/**
 * Stops this person can now see but hasn't been shown the "unlocked" moment for.
 * Hosts and public events never get the moment: nothing was ever hidden from them.
 */
export function newlyUnlocked(
  event: NightEvent,
  me: string,
  crews: Crew[],
  now: Date,
  seen: string[],
): string[] {
  if (isHost(event, me, crews) || isPublicType(event.type)) return [];
  // A finished or cancelled event has nothing left to unlock.
  const phase = phaseOf(event, now);
  if (phase === 'over' || phase === 'cancelled') return [];
  return event.stops
    .filter((s, i) => canSeeStop(event, i, me, crews, now) && !seen.includes(s.id))
    .map((s) => s.id);
}
