/**
 * Turning the host form's day and time chips into a start time.
 *
 * "Tonight" with a small-hours time (before 5am) means the early hours after
 * tonight, so "Tonight 01:00" is tomorrow at 01:00 and the form says so.
 * "Tonight" with a time that has already passed is an error, never quietly
 * moved to tomorrow.
 */

export interface DayChoice {
  label: string;
  /** 0 tonight, 1 tomorrow, 2 in two days, 7 next week, -1 the coming Saturday, -2 the coming Sunday. */
  days: number;
  /** A date picked from the calendar, or (editing) the event's own date. */
  date?: string;
}

/** Times before this hour on "Tonight" are the small hours after midnight. */
export const SMALL_HOURS_END = 5;

/** How far ahead an event can be (REVIEW-9 decision 4: any date in the next 60 days). */
export const MAX_DAYS_AHEAD = 60;

/** Every start time, in 15-minute steps: "00:00" … "23:45". */
export const ALL_TIMES: string[] = Array.from({ length: 96 }, (_, i) => `${String(Math.floor(i / 4)).padStart(2, '0')}:${String((i % 4) * 15).padStart(2, '0')}`);

const dayName = (d: Date) => d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });

/** The quick picks: Tonight, Tomorrow, Sat, Sun (with their dates). */
export function quickDays(now: Date): DayChoice[] {
  const next = (weekday: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() + ((weekday - d.getDay() + 7) % 7));
    return d;
  };
  return [
    { label: 'Tonight', days: 0 },
    { label: 'Tomorrow', days: 1 },
    { label: `Sat ${next(6).getDate()}`, days: -1 },
    { label: `Sun ${next(0).getDate()}`, days: -2 },
  ];
}

/** Every date from today to 60 days ahead, for "Pick a date": "Today", "Tomorrow", then "Fri 20 Nov". */
export function calendarDays(now: Date, count = MAX_DAYS_AHEAD + 1): DayChoice[] {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    d.setHours(12, 0, 0, 0);
    return { label: i === 0 ? `Today, ${dayName(d)}` : i === 1 ? `Tomorrow, ${dayName(d)}` : dayName(d), days: i, date: d.toISOString() };
  });
}

/** "HH:MM" this many minutes after a start, for the end-time quick picks. */
export function timeAfter(start: Date, minutes: number): string {
  const d = new Date(start.getTime() + minutes * 60_000);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** The end as a date: the same day as the start, or the next day when the time is at or before the start. */
export function endFrom(start: Date, time: string | null): Date | null {
  if (!time) return null;
  const [h, m] = time.split(':').map(Number);
  const d = new Date(start);
  d.setHours(h, m, 0, 0);
  if (d.getTime() <= start.getTime()) d.setDate(d.getDate() + 1);
  return d;
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
    if (choice.days === -1 || choice.days === -2) {
      const weekday = choice.days === -1 ? 6 : 0;
      d.setDate(d.getDate() + ((weekday - d.getDay() + 7) % 7));
      d.setHours(h, m, 0, 0);
      // Saturday (or Sunday) is today but that time has gone: the next one.
      if (d.getTime() <= now.getTime()) d.setDate(d.getDate() + 7);
    } else d.setDate(d.getDate() + choice.days);
    d.setHours(h, m, 0, 0);
    // Tonight's small hours belong to the night that's starting.
    if (choice.days === 0 && h < SMALL_HOURS_END) d.setDate(d.getDate() + 1);
  }
  if (d.getTime() - now.getTime() > (MAX_DAYS_AHEAD + 1) * 86_400_000) return { ok: false, reason: `Pick a date in the next ${MAX_DAYS_AHEAD} days.` };
  if (d.getTime() <= now.getTime()) {
    return {
      ok: false,
      reason: choice.days === 0 && !choice.date ? `${time} has passed tonight. Pick a later time or another day.` : 'Pick a start time in the future.',
    };
  }
  return { ok: true, start: d };
}

/**
 * The start-time chips for a day, in the order they happen: for Tonight the evening first, then
 * the small hours labelled "06:00 tomorrow" (startFrom puts them after midnight); for any other day
 * the morning first. Times are "HH:MM".
 */
export function orderedTimes(choice: DayChoice, times: readonly string[], now: Date): { time: string; label: string }[] {
  const at = (t: string) => {
    const r = startFrom(choice, t, now);
    if (r.ok) return r.start.getTime();
    // A time that has passed tonight sorts where it would have been.
    const [h, m] = t.split(':').map(Number);
    return (h < SMALL_HOURS_END && choice.days === 0 && !choice.date ? 24 + h : h) * 60 + m - 1e15;
  };
  const tonight = choice.days === 0 && !choice.date;
  return [...new Set(times)]
    .map((time) => ({ time, label: tonight && Number(time.split(':')[0]) < SMALL_HOURS_END ? `${time} tomorrow` : time, ms: at(time) }))
    .sort((a, b) => a.ms - b.ms)
    .map(({ time, label }) => ({ time, label }));
}

/** Quick start times in the evening (REVIEW-10: no stray 10:00; "Other time" covers mornings). */
export const EVENING_TIMES = ['19:00', '19:30', '20:00', '21:00', '22:00', '22:30'];

/**
 * Where a new event's When step starts (REVIEW-10: the default was 22:30 even at lunchtime):
 * tonight at 20:00, or the next quick evening time at least half an hour away, or tomorrow at
 * 20:00 once tonight's are gone. `day` is the quick-day index (0 Tonight, 1 Tomorrow).
 */
export function defaultStart(now: Date): { day: 0 | 1; time: string } {
  const soonest = now.getTime() + 30 * 60_000;
  const tonight = { label: 'Tonight', days: 0 };
  const ok = (t: string) => {
    const r = startFrom(tonight, t, now);
    return r.ok && r.start.getTime() >= soonest;
  };
  if (now.getHours() >= SMALL_HOURS_END && ok('20:00')) return { day: 0, time: '20:00' };
  const later = now.getHours() >= SMALL_HOURS_END ? EVENING_TIMES.find(ok) : undefined;
  return later ? { day: 0, time: later } : { day: now.getHours() < SMALL_HOURS_END ? 0 : 1, time: '20:00' };
}

/** A day from the date picker ("2026-11-27", local) as a day choice: "Fri 27 Nov". */
export function pickedDayChoice(day: string, now: Date): DayChoice {
  const [y, m, d] = day.split('-').map(Number);
  const date = new Date(y, m - 1, d, 12);
  const today = new Date(now);
  today.setHours(12, 0, 0, 0);
  return { label: dayName(date), days: Math.round((date.getTime() - today.getTime()) / 86_400_000), date: date.toISOString() };
}
