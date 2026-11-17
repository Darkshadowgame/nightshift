import { activeStopIndex, canSeeStop, isHost, isPublicType, phaseOf, type Phase } from './events';
import { invitees } from './invites';
import type { Build, Crew, NightEvent, User } from './types';

export type Role = 'host' | 'going' | 'invited' | 'public' | 'none';

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
  return 'none';
}

export function viewEvents(events: NightEvent[], me: string, crews: Crew[], users: User[], builds: Build[], now: Date): EventView[] {
  return events
    .map((event) => {
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
    })
    .filter((v) => v.role !== 'none')
    .sort((a, b) => new Date(a.event.startsAt).getTime() - new Date(b.event.startsAt).getTime());
}
