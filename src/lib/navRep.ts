import { metresBetween, METRES_PER_MILE } from './nav';
import type { LatLng } from './types';

/**
 * A little rep for using the app (owner decision, 19 Nov 2026): +5 for a
 * finished in-app navigation and +2 for posting a road report (the report
 * rules live in roadReports.ts). Pure: no network, storage or clock of its own.
 *
 * Navigation counts only when you reach the destination (or the last stop),
 * drove at least 2 miles and for at least 3 minutes, at a plausible pace (the
 * same "too quick to count" pattern as drives in spots.ts, with the national
 * limit as the ceiling because a trip can be on motorways). At most 3 a day.
 * Signed in, the server's complete_navigation() judges it again and pays it;
 * the demo's simulated drives only ever pay in the demo's own ledger.
 * Like drives, nothing here ever reports a time or a speed.
 */

export const NAV_RULES = {
  rep: 5,
  perDay: 3,
  minMiles: 2,
  minMinutes: 3,
  /** Above this average the trip doesn't count (UK national speed limit). */
  maxAverageMph: 70,
  /** Fixes worse than this (metres) don't add distance. */
  worstAccuracy: 100,
  /** A jump between two fixes faster than this (m/s) is a GPS glitch, not driving. */
  glitchMps: 80,
} as const;

/** What the driving view keeps while you drive: in memory only, sent once on arrival. */
export interface NavTrip {
  /** First and latest fix (ms, the fix's own clock). */
  startedAt: number | null;
  lastAt: number | null;
  from: LatLng | null;
  last: LatLng | null;
  /** Distance driven, fix to fix. */
  metres: number;
}

export const NEW_TRIP: NavTrip = { startedAt: null, lastAt: null, from: null, last: null, metres: 0 };

/** Feed a fix in while navigating. */
export function addTripFix(trip: NavTrip, at: LatLng, t: number, accuracy: number | null = null): NavTrip {
  if (accuracy != null && accuracy > NAV_RULES.worstAccuracy) return trip;
  if (!trip.last || trip.lastAt === null) return { startedAt: t, lastAt: t, from: at, last: at, metres: 0 };
  if (t < trip.lastAt) return trip;
  const d = metresBetween(trip.last, at);
  const dt = (t - trip.lastAt) / 1000;
  // A jump no car could make between two fixes: skip its distance, keep going from here.
  const add = dt > 0 && d / dt > NAV_RULES.glitchMps ? 0 : d;
  return { ...trip, lastAt: t, last: at, metres: trip.metres + add };
}

/** What's sent to the server: distance, time, and where it started and ended (compared, never stored). */
export interface FinishedTrip {
  distanceM: number;
  durationS: number;
  from: LatLng;
  to: LatLng;
}

export type TripVerdict = { ok: true; trip: FinishedTrip } | { ok: false; why: 'short' | 'quick' | 'implausible' | 'none' };

/** Why a finished trip doesn't count, or null. The server's complete_navigation() checks the same. */
export function tripProblem(t: FinishedTrip): 'short' | 'quick' | 'implausible' | null {
  const miles = t.distanceM / METRES_PER_MILE;
  if (!(miles >= NAV_RULES.minMiles)) return 'short';
  if (!(t.durationS >= NAV_RULES.minMinutes * 60)) return 'quick';
  if (miles / (t.durationS / 3600) > NAV_RULES.maxAverageMph) return 'implausible';
  // Can't have driven less than the straight line.
  if (metresBetween(t.from, t.to) > t.distanceM + 200) return 'implausible';
  return null;
}

/** Does this trip count? Never says a time or a speed, only yes or no. */
export function judgeTrip(trip: NavTrip): TripVerdict {
  if (trip.startedAt === null || trip.lastAt === null || !trip.from || !trip.last) return { ok: false, why: 'none' };
  const finished: FinishedTrip = { distanceM: Math.round(trip.metres), durationS: Math.round((trip.lastAt - trip.startedAt) / 1000), from: trip.from, to: trip.last };
  const why = tripProblem(finished);
  return why ? { ok: false, why } : { ok: true, trip: finished };
}

/** Day key for the daily caps (as roadReports.ts: the server uses Europe/London). */
const dayOf = (iso: string) => iso.slice(0, 10);

/** Rep a new finished trip pays now: 5, or 0 once 3 have finished today. `finishedAt`: the earlier ones. */
export function navRepNow(finishedAt: string[], now: Date): number {
  const today = dayOf(now.toISOString());
  return finishedAt.filter((t) => dayOf(t) === today).length >= NAV_RULES.perDay ? 0 : NAV_RULES.rep;
}

/** Rep from navigation: 5 per finished trip, at most 3 paid a day. `finishedAt`: every finished trip. */
export function navRepFrom(finishedAt: string[]): { navigations: number; navigationRep: number } {
  const perDay = new Map<string, number>();
  let rep = 0;
  for (const t of [...finishedAt].sort()) {
    const n = perDay.get(dayOf(t)) ?? 0;
    if (n < NAV_RULES.perDay) rep += NAV_RULES.rep;
    perDay.set(dayOf(t), n + 1);
  }
  return { navigations: finishedAt.length, navigationRep: rep };
}

/**
 * The small toast at the moment rep is earned (Redesign 2, 4.12: a moment like
 * check-in, owner decision 19 Nov 2026). Nothing when nothing was paid.
 */
export function repToast(rep: number, why: 'navigation' | 'report'): string | null {
  if (!(rep > 0)) return null;
  return `+${rep} rep · ${why === 'navigation' ? 'Drive complete' : 'Thanks for the report'}`;
}
