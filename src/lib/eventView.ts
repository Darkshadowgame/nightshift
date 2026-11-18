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

/**
 * Where this user stands with one event, in one word (Review 12, K3). The ONE source for the status
 * tag on Tonight's cards and rows, the event page's hero, Search and Me, so a meet never says Going
 * in one place and Checked in in another.
 *
 * hosting / hosted: you host it (before or after it ends) · checkedIn: you checked in and it hasn't
 * ended · went: it ended and you were going or checked in · going: you said you're going ·
 * requested / declined: you asked to go · null: none of these.
 */
export type MyEventStatus = 'hosting' | 'hosted' | 'checkedIn' | 'went' | 'going' | 'requested' | 'declined';

export function myEventStatus(event: NightEvent, me: string, crews: Crew[], now: Date): MyEventStatus | null {
  const phase = phaseOf(event, now);
  const over = phase === 'over';
  if (isHost(event, me, crews)) return over ? 'hosted' : 'hosting';
  const checkedIn = (event.checkIns[me] ?? []).length > 0;
  if (phase === 'cancelled') return null;
  if (checkedIn) return over ? 'went' : 'checkedIn';
  if (event.going.includes(me)) return over ? 'went' : 'going';
  if (hasRequested(event, me)) return 'requested';
  if (event.declined?.includes(me)) return 'declined';
  return null;
}

/** The words for each status, as the tag shows them. */
export const STATUS_LABELS: Record<MyEventStatus, string> = {
  hosting: 'Hosting',
  hosted: 'Hosted',
  checkedIn: 'Checked in',
  went: 'Went',
  going: 'Going',
  requested: 'Requested',
  declined: 'Declined',
};

export interface EventView {
  event: NightEvent;
  role: Role;
  phase: Phase;
  /** Your status with it (myEventStatus): the tag every surface shows. */
  status: MyEventStatus | null;
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
  return { event, role, phase, shownStop, status: myEventStatus(event, me, crews, now) };
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
