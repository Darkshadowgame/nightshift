import type { LatLng } from './types';

/**
 * Which way the driving view's map faces, and where it centres. Pure: the
 * driving screen feeds in the GPS fix, the compass and the route, and draws
 * what comes out.
 *
 * GPS course is only good while you're moving: slow or stopped it wanders or
 * goes missing. So, in order:
 *   1. GPS course, when it's valid and you're above about 2.5 m/s (5.6 mph);
 *   2. the phone's compass (true north if it has it, else magnetic);
 *   3. the route's bearing where you are, only when you're on the route;
 *   4. otherwise keep the last heading (never snap back to north).
 * The result is eased so the map turns smoothly and doesn't twitch.
 */

/** Above this (m/s) GPS course is trusted. */
export const COURSE_MIN_SPEED = 2.5;
/** Changes smaller than this (degrees) are jitter: the map stays put. */
export const HEADING_DEADBAND = 3;
/** How far towards the new heading each update moves (0–1). */
export const HEADING_EASE = 0.5;
/** Within this (m) of the route you count as on it: the route's bearing can stand in. */
export const ROUTE_BEARING_METRES = 30;

export type HeadingSource = 'gps' | 'compass' | 'route' | 'none';

/** The fields we use from expo-location's heading object. -1 (or below) means unknown. */
export interface CompassReading {
  trueHeading: number;
  magHeading: number;
}

/** Wrap any angle to 0–360. */
export function normaliseDegrees(d: number): number {
  const r = d % 360;
  return r < 0 ? r + 360 : r;
}

/** The signed shortest turn from `from` to `to`, in degrees (-180 to 180). */
export function shortestTurn(from: number, to: number): number {
  const d = normaliseDegrees(to - from);
  return d > 180 ? d - 360 : d;
}

/** The compass's heading: true north when it has it (needs location), else magnetic. Null if neither. */
export function compassHeading(r: CompassReading | null | undefined): number | null {
  if (!r) return null;
  if (Number.isFinite(r.trueHeading) && r.trueHeading >= 0) return normaliseDegrees(r.trueHeading);
  if (Number.isFinite(r.magHeading) && r.magHeading >= 0) return normaliseDegrees(r.magHeading);
  return null;
}

export interface HeadingInputs {
  /** GPS course in degrees, null when unknown. */
  course: number | null | undefined;
  /** m/s, null when unknown. */
  speed: number | null | undefined;
  /** From compassHeading(). */
  compass: number | null | undefined;
  /** The route's bearing at your snapped point, and how far (m) you are from the route. */
  route?: { bearing: number; off: number } | null;
}

/** The best heading to face, and where it came from. Null heading: nothing to go on. */
export function pickHeading(i: HeadingInputs): { heading: number | null; source: HeadingSource } {
  if (i.course != null && Number.isFinite(i.course) && i.course >= 0 && i.speed != null && i.speed > COURSE_MIN_SPEED) {
    return { heading: normaliseDegrees(i.course), source: 'gps' };
  }
  if (i.compass != null && Number.isFinite(i.compass) && i.compass >= 0) return { heading: normaliseDegrees(i.compass), source: 'compass' };
  if (i.route && Number.isFinite(i.route.bearing) && i.route.off <= ROUTE_BEARING_METRES) {
    return { heading: normaliseDegrees(i.route.bearing), source: 'route' };
  }
  return { heading: null, source: 'none' };
}

/**
 * Ease from the shown heading towards the target the short way round. Turns
 * under the deadband are ignored, so a resting compass doesn't wobble the map.
 * No target keeps what's shown; nothing shown yet takes the target as it is.
 */
export function smoothHeading(
  shown: number | null,
  target: number | null,
  ease: number = HEADING_EASE,
  deadband: number = HEADING_DEADBAND,
): number | null {
  if (target == null || !Number.isFinite(target)) return shown;
  if (shown == null) return normaliseDegrees(target);
  const turn = shortestTurn(shown, target);
  if (Math.abs(turn) < deadband) return shown;
  // Never stop short of the deadband: a small step left over would just sit there.
  const step = Math.abs(turn * ease) < deadband ? turn : turn * ease;
  return Math.round(normaliseDegrees(shown + step) * 10) / 10;
}

/** Snap the camera onto the route only when you're this close to it (m). */
export const FOCUS_SNAP_METRES = 15;

/**
 * Where the driving view's camera centres: on you. When you're moving along
 * the route and within a few metres of it, on the route itself, so GPS wobble
 * doesn't throw you onto the verge. Never onto the route when you're clearly
 * off it, stopped, going the other way or the fix is poor.
 */
export function driveFocus(
  fix: { at: LatLng; speed: number | null; course: number | null; accuracy: number | null } | null,
  snap: { at: LatLng; off: number; bearing: number } | null | undefined,
): LatLng | null {
  if (!fix) return null;
  if (!snap || !Number.isFinite(snap.off)) return fix.at;
  const moving = fix.speed != null && fix.speed > COURSE_MIN_SPEED;
  const poor = fix.accuracy != null && fix.accuracy > 30;
  const sameWay = fix.course == null || fix.course < 0 || Math.abs(shortestTurn(fix.course, snap.bearing)) < 60;
  return moving && !poor && sameWay && snap.off <= FOCUS_SNAP_METRES ? snap.at : fix.at;
}
