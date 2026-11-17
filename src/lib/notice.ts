import type { ReminderKind } from './reminders';

/** An in-app notice for the current user, e.g. "the meet moved on". */
export interface Notice {
  id: string;
  eventId: string;
  text: string;
  at: string;
  read: boolean;
  kind?: ReminderKind | 'host';
  /** Reminder key, so a reminder only lands in the list once. */
  key?: string;
  /** Came from the server's notices table (signed in), so the server's copy replaces it on refresh. */
  remote?: boolean;
}
