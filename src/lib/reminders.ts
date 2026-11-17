import { EVENT_LABELS, isHost, isPublicType, moveOnAudience, revealTime } from './events';
import { formatTime } from './format';
import type { Crew, NightEvent } from './types';

/**
 * Reminders for events. Pure: works out which local notifications should exist,
 * and the side-effect layer (src/lib/notify.ts) makes the phone match.
 *
 * Lock screens are public, so reminder text never names a stop or a place:
 * only the event's title and its rough area.
 */

export type ReminderKind = 'reveal' | 'soon' | 'moved';

export const SOON_MINUTES = 30;

export interface Reminder {
  /** Stable id. Changes whenever the time or text changes, so edits reschedule. */
  key: string;
  eventId: string;
  kind: ReminderKind;
  at: Date;
  title: string;
  body: string;
  /** In-app route the notification opens. */
  url: string;
}

export function eventUrl(eventId: string): string {
  return `/event/${eventId}`;
}

/** Short stable hash so an edited title gives a new key. */
function hash(text: string): string {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

function make(event: NightEvent, kind: ReminderKind, at: Date, title: string, body: string): Reminder {
  return {
    key: `ns.${event.id}.${kind}.${at.getTime().toString(36)}.${hash(title + body)}`,
    eventId: event.id,
    kind,
    at,
    title,
    body,
    url: eventUrl(event.id),
  };
}

/** Is this person signed up to the event, as a host or going? */
export function isSignedUp(event: NightEvent, me: string, crews: Crew[]): boolean {
  return event.going.includes(me) || isHost(event, me, crews);
}

/**
 * Every reminder this person should get for one event, past or future.
 * - At the reveal time (not for shows and track days, which are public).
 * - 30 minutes before the start, when check-in opens.
 * If both fall at the same moment, only the start reminder is kept.
 */
export function remindersFor(event: NightEvent, me: string, crews: Crew[]): Reminder[] {
  if (event.cancelled || !isSignedUp(event, me, crews)) return [];
  const host = isHost(event, me, crews);
  const start = new Date(event.startsAt);
  const soonAt = new Date(start.getTime() - SOON_MINUTES * 60_000);
  const label = EVENT_LABELS[event.type].toLowerCase();
  const out: Reminder[] = [];

  const reveal = revealTime(event);
  if (!isPublicType(event.type) && event.revealMinutesBefore > 0 && reveal.getTime() !== soonAt.getTime()) {
    out.push(
      make(
        event,
        'reveal',
        reveal,
        `${event.title}: location unlocked`,
        host
          ? `People going can now see where your ${label} is.`
          : `Open Nightshift to see where the ${label} is. Starts ${formatTime(event.startsAt)}.`,
      ),
    );
  }
  out.push(
    make(
      event,
      'soon',
      soonAt,
      `${event.title} starts in ${SOON_MINUTES} min`,
      host
        ? `Check-in is open. ${event.areaName}.`
        : isPublicType(event.type) || event.revealMinutesBefore >= SOON_MINUTES
          ? `Check-in is open. ${event.areaName}.`
          : `Location unlocked and check-in is open. ${event.areaName}.`,
    ),
  );
  return out;
}

/** Reminders that should be scheduled on the phone now: future ones only. */
export function upcomingReminders(events: NightEvent[], me: string, crews: Crew[], now: Date): Reminder[] {
  return events
    .flatMap((e) => remindersFor(e, me, crews))
    .filter((r) => r.at.getTime() > now.getTime())
    .sort((a, b) => a.at.getTime() - b.at.getTime());
}

/** iOS keeps at most 64 pending local notifications per app; stay well under. */
export const MAX_SCHEDULED = 48;

export interface ReminderPlan {
  /** Keys of scheduled notifications to cancel. */
  cancel: string[];
  /** Reminders to schedule. */
  schedule: Reminder[];
}

/**
 * Compare what's scheduled with what should be. Anything scheduled that isn't
 * wanted (dropped out, edited, cancelled) is cancelled; anything missing is added.
 * Only keys this app made (starting "ns.") are ever touched.
 */
export function planReminders(scheduledKeys: string[], wanted: Reminder[]): ReminderPlan {
  const keep = wanted.slice(0, MAX_SCHEDULED);
  const want = new Set(keep.map((r) => r.key));
  const have = new Set(scheduledKeys.filter((k) => k.startsWith('ns.')));
  return {
    cancel: [...have].filter((k) => !want.has(k)),
    schedule: keep.filter((r) => !have.has(r.key)),
  };
}

/** How long a reminder that fired while the app was shut still counts as news. */
export const NEWS_WINDOW_MS = 6 * 60 * 60 * 1000;

/**
 * Reminders that have come due and aren't in the in-app list yet, so the list
 * matches what the phone showed (or would have shown).
 */
export function dueReminders(events: NightEvent[], me: string, crews: Crew[], now: Date, seenKeys: Set<string>): Reminder[] {
  const t = now.getTime();
  return events
    .flatMap((e) => remindersFor(e, me, crews))
    .filter((r) => r.at.getTime() <= t && t - r.at.getTime() < NEWS_WINDOW_MS && !seenKeys.has(r.key))
    .sort((a, b) => a.at.getTime() - b.at.getTime());
}

/**
 * The "moved on" message for someone checked in at the stop being left.
 * Never names the new place: it only unlocks in the app.
 * Returns null when this person wasn't checked in there.
 */
export function movedOnReminder(before: NightEvent, me: string, now: Date): Reminder | null {
  if (before.type !== 'rolling') return null;
  if (!moveOnAudience(before, before.currentStop).includes(me)) return null;
  const next = before.currentStop + 2;
  const title = `${before.title} moved on`;
  const body = `Stop ${next} is unlocked. Open Nightshift to see where.`;
  return make(before, 'moved', now, title, body);
}
