import { sunTimes } from './sun';
import type { LatLng } from './types';

/**
 * When to drive it: sunrise and sunset for the road today (worked out on the phone), and a plain
 * rule of thumb for "usually quiet". It is not live traffic and it says so.
 */
const clock = (ms: number) => new Date(ms).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/London' });

export interface DriveTimes {
  sunrise: string | null;
  sunset: string | null;
  /** Polar day or night: no times. */
  note: string | null;
}

export function driveSun(when: Date, at: LatLng): DriveTimes {
  const s = sunTimes(when, at);
  if (s.polar) return { sunrise: null, sunset: null, note: s.polar === 'day' ? 'The sun does not set today.' : 'The sun does not rise today.' };
  return { sunrise: clock(s.sunrise!), sunset: clock(s.sunset!), note: null };
}

/** The usual quiet window: early weekday mornings and early Sundays, whichever day it is. */
export const QUIET_WINDOW = 'Usually quietest: weekdays before 09:00, Sundays before 10:00.';
export const QUIET_CAVEAT = 'A rule of thumb, not live traffic.';
