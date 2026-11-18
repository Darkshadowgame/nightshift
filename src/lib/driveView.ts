import { etaClock, formatDistance, formatDuration, metresBetween, mphOf, type Manoeuvre, type NavRoute, type NavStop, type Progress, type RawRouteLike } from './nav';
import { mphLimit, type SpeedValue } from './speedLimit';
import type { LatLng } from './types';

/**
 * The driving view's layout logic (src/app/drive.tsx): what the banner and
 * bottom bar say, the road you're on, the speed-limit roundel, the map's
 * orientation and icon, panning and recentring, and when you're stopped.
 * Pure, so it's tested without a phone.
 */

// ---------------------------------------------------------------------------
// Road names from Apple's instructions
// ---------------------------------------------------------------------------

/**
 * The road an instruction turns onto: "Turn right onto High Street" is "High
 * Street", "At the roundabout, take the second exit onto the A38" is "A38",
 * "Continue on M6" is "M6". Null when it names no road ("Keep left at the fork").
 */
export function roadFromInstruction(text: string | null | undefined): string | null {
  if (!text) return null;
  const t = text.trim();
  const m = /\b(?:onto|on to)\s+(.+)$/i.exec(t) ?? /^(?:continue|stay|keep going)\s+(?:on|along)\s+(.+)$/i.exec(t);
  if (!m) return null;
  let road = m[1]
    .replace(/,?\s+then\b.*$/i, '')
    .replace(/\s+(?:towards?|for)\s+.*$/i, '')
    .replace(/[.,;]+$/, '')
    .trim();
  road = road.replace(/^the\s+(?=[A-Z]\d|M\d)/i, '');
  return road.length >= 2 ? road : null;
}

/**
 * The road you're on, from the route: the road the last manoeuvre you passed
 * turned onto. Null off the route or before the first named turn.
 */
export function roadOnRoute(route: NavRoute, progress: Progress, maxOff = 40): string | null {
  if (progress.snap.off > maxOff) return null;
  const passed = progress.stepIndex < 0 ? route.steps.length - 1 : progress.stepIndex - 1;
  for (let i = passed; i >= 0 && i >= passed - 3; i--) {
    if (route.steps[i].kind === 'arrive') break;
    const road = roadFromInstruction(route.steps[i].text);
    if (road) return road;
  }
  return null;
}

export interface BannerInfo {
  kind: Manoeuvre;
  /** Metres to the manoeuvre. */
  distance: number;
  /** The big line: the road to turn onto, else the instruction. */
  title: string;
  /** The instruction in full (for the screen reader and when the title is a road). */
  text: string;
  /** "Then…": the manoeuvre after, when it comes soon after this one. */
  then: { kind: Manoeuvre; title: string } | null;
}

/** Within this (m) after the next manoeuvre, the one after it is shown as "Then". */
export const THEN_WITHIN_M = 500;

/** The top banner for where you are on the route. Null with no manoeuvres left. */
export function bannerFor(route: NavRoute, progress: Progress): BannerInfo | null {
  const i = progress.stepIndex;
  if (i < 0) return null;
  const step = route.steps[i];
  const after = route.steps[i + 1];
  const titleOf = (s: { kind: Manoeuvre; text: string }) => (s.kind === 'arrive' ? s.text : roadFromInstruction(s.text) ?? s.text);
  return {
    kind: step.kind,
    distance: progress.toStep,
    title: titleOf(step),
    text: step.text,
    then: after && after.along - step.along <= THEN_WITHIN_M ? { kind: after.kind, title: titleOf(after) } : null,
  };
}

/** The bottom bar's trip readouts: arrival time, distance and time left. */
export function tripSummary(nowMs: number, metresLeft: number, secondsLeft: number): { eta: string; distance: string; time: string } {
  return { eta: etaClock(nowMs, secondsLeft), distance: formatDistance(metresLeft), time: formatDuration(secondsLeft) };
}

// ---------------------------------------------------------------------------
// Speed and the limit
// ---------------------------------------------------------------------------

/** A fix older than this means you've stopped (the phone sends fewer while still). */
export const STALE_FIX_MS = 4000;
/** Above this (m/s, about 5.6 mph) you're moving: no panning, no menus. */
export const MOVING_MPS = 2.5;

/** Your speed now: the fix's, or 0 once fixes have dried up (stopped), null if unknown. */
export function liveSpeed(speed: number | null | undefined, fixAgeMs: number): number | null {
  if (fixAgeMs > STALE_FIX_MS) return 0;
  return speed != null && Number.isFinite(speed) && speed >= 0 ? speed : null;
}

export function isMoving(speed: number | null | undefined): boolean {
  return speed != null && speed > MOVING_MPS;
}

export interface ShownLimit {
  /** The number in the roundel. */
  value: number;
  unit: 'mph' | 'kmh';
  /** The same in mph, to compare with your speed. */
  mph: number;
  source: 'zone' | 'camera' | 'road';
}

/**
 * The roundel: an average-speed zone's or a camera's limit while one applies
 * (they're signed), else the road's from OpenStreetMap. Null hides the roundel.
 */
export function shownLimit(cameraOrZone: { mph: number; source: 'zone' | 'camera' } | null, road: SpeedValue | null): ShownLimit | null {
  if (cameraOrZone) return { value: cameraOrZone.mph, unit: 'mph', mph: cameraOrZone.mph, source: cameraOrZone.source };
  if (road) return { value: road.value, unit: road.unit, mph: mphLimit(road), source: 'road' };
  return null;
}

/** Over the limit, as shown: the whole mph on screen is above it. */
export function overLimit(speedMps: number | null | undefined, limit: ShownLimit | null): boolean {
  const mph = mphOf(speedMps);
  return mph != null && limit != null && mph > limit.mph;
}

// ---------------------------------------------------------------------------
// Arrival
// ---------------------------------------------------------------------------

/**
 * Arrived by the route: you've driven to where the route meets the next stop
 * (within 25 m of its end) and you're within 250 m of the stop itself. Catches
 * addresses set back from the road, where you never get within the 80 m
 * arrival radius of the pin.
 */
export function arrivedByRoute(stopAlong: number | undefined, along: number, off: number, at: LatLng, stop: NavStop | undefined): boolean {
  if (!stop || stopAlong === undefined || !Number.isFinite(stopAlong)) return false;
  return off <= 60 && along >= stopAlong - 25 && metresBetween(at, stop.at) <= 250;
}

// ---------------------------------------------------------------------------
// The map: orientation, panning, your icon
// ---------------------------------------------------------------------------

export type MapOrientation = 'heading' | 'north';

/** Which way the map's top faces. */
export function cameraHeading(mode: MapOrientation, heading: number): number {
  return mode === 'north' ? 0 : heading;
}

/** How far your icon turns on screen: the way you're heading, less the way the map faces. */
export function iconRotation(heading: number, mapHeading: number): number {
  return (((heading - mapHeading) % 360) + 360) % 360;
}

/** Look round the map only while stopped. */
export function canPan(speed: number | null | undefined): boolean {
  return !isMoving(speed);
}

/** After a pan, the map goes back to following you after this long. */
export const RECENTRE_MS = 8000;

export function recentreDue(pannedAt: number | null, now: number, speed: number | null | undefined): boolean {
  return pannedAt != null && (now - pannedAt >= RECENTRE_MS || isMoving(speed));
}

export type NavIconShape = 'arrow' | 'hatch' | 'saloon' | 'coupe' | 'estate' | 'bike';

export const NAV_ICON_SHAPES: { id: NavIconShape; label: string }[] = [
  { id: 'arrow', label: 'Arrow' },
  { id: 'hatch', label: 'Hatchback' },
  { id: 'saloon', label: 'Saloon' },
  { id: 'coupe', label: 'Coupé' },
  { id: 'estate', label: 'Estate or van' },
  { id: 'bike', label: 'Bike' },
];

/** Bright on the dark map, and none of them the route's orange. */
export const NAV_ICON_COLOURS: { id: string; label: string; hex: string }[] = [
  { id: 'white', label: 'White', hex: '#f4f6fa' },
  { id: 'blue', label: 'Blue', hex: '#4da3ff' },
  { id: 'green', label: 'Green', hex: '#5fe08f' },
  { id: 'yellow', label: 'Yellow', hex: '#ffd23f' },
  { id: 'red', label: 'Red', hex: '#ff5a5a' },
  { id: 'purple', label: 'Purple', hex: '#c69cff' },
];

export interface NavIcon {
  shape: NavIconShape;
  colour: string;
}

export const DEFAULT_NAV_ICON: NavIcon = { shape: 'arrow', colour: 'white' };

/** The saved icon, with anything unknown replaced by the default. */
export function navIconOf(saved: Partial<NavIcon> | null | undefined): NavIcon & { hex: string } {
  const shape = NAV_ICON_SHAPES.some((s) => s.id === saved?.shape) ? saved!.shape! : DEFAULT_NAV_ICON.shape;
  const colour = NAV_ICON_COLOURS.find((c) => c.id === saved?.colour) ?? NAV_ICON_COLOURS[0];
  return { shape, colour: colour.id, hex: colour.hex };
}

// ---------------------------------------------------------------------------
// Road name off the route (the phone's reverse geocoder)
// ---------------------------------------------------------------------------

export const NAME_EVERY_MS = 15_000;
export const NAME_EVERY_M = 150;

/** Ask the reverse geocoder again? After 15 s or 150 m, and never more than every 5 s. */
export function nameLookupDue(last: { at: LatLng; t: number } | null, at: LatLng, now: number): boolean {
  if (!last) return true;
  const elapsed = now - last.t;
  if (elapsed < 5000) return false;
  return elapsed >= NAME_EVERY_MS || metresBetween(last.at, at) >= NAME_EVERY_M;
}

// ---------------------------------------------------------------------------
// The web preview's demo drive
// ---------------------------------------------------------------------------

/** The demo drive's pace on the web preview, where there are no Apple directions (m/s, about 30 mph). */
export const DEMO_ROUTE_SPEED = 13.4;

/**
 * A route without Apple's directions (the web preview's demo drive): straight lines through the
 * points, a point every ~60 m so the simulated drive moves smoothly, one "Head towards" step at the
 * start of each leg and an arrival at the end. Same shape as Apple's, so buildRoute() reads it.
 */
export function straightRoute(points: LatLng[], names: string[] = [], spacingM = 60): RawRouteLike {
  const coords: number[] = [];
  const steps: RawRouteLike['steps'] = [];
  const legs: RawRouteLike['legs'] = [];
  let total = 0;
  const push = (p: LatLng) => coords.push(p.lat, p.lng);
  if (points.length) push(points[0]);
  for (let k = 0; k + 1 < points.length; k++) {
    const a = points[k];
    const b = points[k + 1];
    const d = metresBetween(a, b);
    const startIndex = coords.length / 2 - 1;
    const name = names[k];
    steps.push({ text: name ? `Head towards ${name}` : 'Head off', distance: d, lat: a.lat, lng: a.lng, index: startIndex, leg: k });
    const n = Math.max(1, Math.ceil(d / spacingM));
    for (let i = 1; i <= n; i++) push({ lat: a.lat + ((b.lat - a.lat) * i) / n, lng: a.lng + ((b.lng - a.lng) * i) / n });
    const endIndex = coords.length / 2 - 1;
    steps.push({ text: 'Arrive at your destination', distance: 0, lat: b.lat, lng: b.lng, index: endIndex, leg: k });
    legs.push({ endIndex, distance: d, time: d / DEMO_ROUTE_SPEED });
    total += d;
  }
  return { coords, distance: total, time: total / DEMO_ROUTE_SPEED, steps, legs };
}
