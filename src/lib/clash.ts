import { endTime, phaseOf } from './events';
import type { NightEvent } from './types';

/** A meet with no end time is taken to run this long when checking for a clash (as events.ts does). */
const ASSUMED_HOURS = 4;

/**
 * A meet you're going to (not one you host) that overlaps the time you're about to host at
 * (Review 20 problem 2: the demo had you going to "Sunday coffee and cars" at Sun 10:00, and
 * hosting your own Sunday 10:00 meet said nothing). `selfId`: the meet being edited, left out.
 * Cancelled and finished meets don't count. The earliest clash, or undefined.
 */
export function goingClash(
  events: readonly NightEvent[],
  me: string,
  draft: { start: Date; end?: Date | null; selfId?: string },
  now: Date,
): NightEvent | undefined {
  const from = draft.start.getTime();
  const to = (draft.end ?? new Date(from + ASSUMED_HOURS * 3_600_000)).getTime();
  return events
    .filter((e) => e.id !== draft.selfId && !e.cancelled && e.going.includes(me) && !e.hostIds.includes(me))
    .filter((e) => phaseOf(e, now) !== 'over')
    .filter((e) => new Date(e.startsAt).getTime() < to && endTime(e).getTime() > from)
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())[0];
}

/** The warning's words: "You're going to Sunday coffee and cars then. Host anyway?" */
export const CLASH_WORDS = {
  title: 'Time clash',
  message: (title: string) => `You're going to ${title} then. Host anyway?`,
  change: 'Change time',
  confirm: 'Host anyway',
} as const;
