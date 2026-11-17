/**
 * Turning the host form's day and time chips into a start time.
 *
 * "Tonight" with a morning time (before noon) means the early hours after
 * tonight, so "Tonight 06:00" is tomorrow at 06:00 and the form says so.
 * "Tonight" with a time that has already passed is an error, never quietly
 * moved to tomorrow.
 */

export interface DayChoice {
  label: string;
  /** 0 tonight, 1 tomorrow, 2 in two days, 7 next week, -1 this weekend (Saturday). */
  days: number;
  /** Editing: keep the event's own date. */
  date?: string;
}

export type StartResult = { ok: true; start: Date } | { ok: false; reason: string };

export function startFrom(choice: DayChoice, time: string, now: Date): StartResult {
  const [h, m] = time.split(':').map(Number);
  let d: Date;
  if (choice.date) {
    d = new Date(choice.date);
    d.setHours(h, m, 0, 0);
  } else {
    d = new Date(now);
    if (choice.days === -1) {
      const toSat = (6 - d.getDay() + 7) % 7;
      d.setDate(d.getDate() + toSat);
    } else d.setDate(d.getDate() + choice.days);
    d.setHours(h, m, 0, 0);
    // Tonight's small hours belong to the night that's starting.
    if (choice.days === 0 && h < 12) d.setDate(d.getDate() + 1);
    // This weekend: if Saturday's time has gone, Sunday at the same time.
    if (choice.days === -1 && d.getTime() <= now.getTime()) d.setDate(d.getDate() + 1);
  }
  if (d.getTime() <= now.getTime()) {
    return {
      ok: false,
      reason: choice.days === 0 && !choice.date ? `${time} has passed tonight. Pick a later time or another day.` : 'Pick a start time in the future.',
    };
  }
  return { ok: true, start: d };
}
