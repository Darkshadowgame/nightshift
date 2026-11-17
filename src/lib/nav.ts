import type { Camera } from './cameraCodec';
import type { AverageZone } from './cameras';
import type { LatLng } from './types';

/**
 * The turn-by-turn engine for the driving view (src/app/drive.tsx). Pure: no
 * GPS, no network, no clock of its own. Directions come from Apple through
 * modules/nav-directions; this file works out where you are on the route,
 * what to say and when, when you've gone off the route, when you've reached a
 * stop, and which speed cameras and average-speed zones are ahead.
 *
 * Safety rules (docs/SPEC.md, "Driving view"): nothing here records, scores or
 * ranks speed or time. Your speed is compared with the limit a camera or zone
 * enforces, live, and is never stored. Cameras are speed-limit information only
 * (OpenStreetMap's dataset). Drivers' road reports, including the owner-approved
 * "Police / speed check", live in roadReports.ts with their own safeguards.
 */

// ---------------------------------------------------------------------------
// Units (UK: miles and yards)
// ---------------------------------------------------------------------------

export const METRES_PER_MILE = 1609.344;
export const METRES_PER_YARD = 0.9144;
export const MPS_TO_MPH = 3600 / METRES_PER_MILE;

/** "150 yd" under a tenth of a mile, "0.4 mi", "12 mi". */
export function formatDistance(metres: number): string {
  const m = Math.max(0, metres);
  if (m < METRES_PER_MILE / 10) {
    const yd = m / METRES_PER_YARD;
    return `${Math.max(10, Math.round(yd / 10) * 10)} yd`;
  }
  const mi = m / METRES_PER_MILE;
  if (mi < 10) return `${mi.toFixed(1)} mi`;
  return `${Math.round(mi)} mi`;
}

/** For the voice: "150 yards", "0.4 miles", "1 mile", "12 miles". */
export function spokenDistance(metres: number): string {
  const m = Math.max(0, metres);
  if (m < METRES_PER_MILE / 10) return `${Math.max(50, Math.round(m / METRES_PER_YARD / 50) * 50)} yards`;
  const mi = m / METRES_PER_MILE;
  const shown = mi < 10 ? Number(mi.toFixed(1)) : Math.round(mi);
  return shown === 1 ? '1 mile' : `${shown} miles`;
}

/** Whole mph from a GPS speed in m/s, or null when the phone doesn't know. */
export function mphOf(speedMps: number | null | undefined): number | null {
  if (speedMps == null || !Number.isFinite(speedMps) || speedMps < 0) return null;
  return Math.round(speedMps * MPS_TO_MPH);
}

// ---------------------------------------------------------------------------
// Geometry
// ---------------------------------------------------------------------------

const EARTH_M = 6371008.8;
const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;

export function metresBetween(a: LatLng, b: LatLng): number {
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Compass bearing from a to b, 0–360 (0 = north). */
export function bearing(a: LatLng, b: LatLng): number {
  const y = Math.sin(rad(b.lng - a.lng)) * Math.cos(rad(b.lat));
  const x = Math.cos(rad(a.lat)) * Math.sin(rad(b.lat)) - Math.sin(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.cos(rad(b.lng - a.lng));
  return (deg(Math.atan2(y, x)) + 360) % 360;
}

/** Smallest angle between two bearings, 0–180. */
export function angleBetween(a: number, b: number): number {
  const d = Math.abs((((a - b) % 360) + 360) % 360);
  return d > 180 ? 360 - d : d;
}

/** Nearest point on segment a→b to p, in a local flat projection (fine over a few km). */
export function projectOnSegment(p: LatLng, a: LatLng, b: LatLng): { t: number; at: LatLng; off: number } {
  const k = Math.cos(rad(p.lat));
  const ax = a.lng * k, ay = a.lat;
  const bx = b.lng * k, by = b.lat;
  const px = p.lng * k, py = p.lat;
  const dx = bx - ax, dy = by - ay;
  const len2 = dx * dx + dy * dy;
  const t = len2 > 0 ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2)) : 0;
  const at = { lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t };
  return { t, at, off: metresBetween(p, at) };
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

/** Apple's answer, as modules/nav-directions returns it. */
export interface RawRouteLike {
  coords: number[];
  distance: number;
  time: number;
  steps: { text: string; notice?: string; distance: number; lat: number; lng: number; index: number; leg: number }[];
  legs: { endIndex: number; distance: number; time: number }[];
}

export type Manoeuvre =
  | 'straight'
  | 'left'
  | 'right'
  | 'slightLeft'
  | 'slightRight'
  | 'sharpLeft'
  | 'sharpRight'
  | 'keepLeft'
  | 'keepRight'
  | 'uturn'
  | 'roundabout'
  | 'arrive';

/** The arrow glyph for the banner. UK roundabouts go clockwise. */
export const ARROWS: Record<Manoeuvre, string> = {
  straight: '↑',
  left: '←',
  right: '→',
  slightLeft: '↖',
  slightRight: '↗',
  sharpLeft: '↙',
  sharpRight: '↘',
  keepLeft: '↖',
  keepRight: '↗',
  uturn: '↶',
  roundabout: '↻',
  arrive: '◉',
};

/** What kind of turn an instruction is, from Apple's wording. */
export function manoeuvreOf(text: string): Manoeuvre {
  const t = text.toLowerCase();
  if (/destination|arrive/.test(t)) return 'arrive';
  if (/u-?turn/.test(t)) return 'uturn';
  if (/roundabout|rotary|traffic circle/.test(t)) return 'roundabout';
  if (/sharp left/.test(t)) return 'sharpLeft';
  if (/sharp right/.test(t)) return 'sharpRight';
  if (/keep left/.test(t)) return 'keepLeft';
  if (/keep right/.test(t)) return 'keepRight';
  if (/(slight|bear) left|exit on the left|left exit/.test(t)) return 'slightLeft';
  if (/(slight|bear) right|exit on the right|right exit/.test(t)) return 'slightRight';
  if (/\bleft\b/.test(t)) return 'left';
  if (/\bright\b/.test(t)) return 'right';
  return 'straight';
}

export interface NavStep {
  /** Instruction to show and say, e.g. "Turn right onto High Street". */
  text: string;
  kind: Manoeuvre;
  /** Where the manoeuvre is. */
  at: LatLng;
  /** Index into the route's points. */
  index: number;
  /** Metres from the start of the route to the manoeuvre. */
  along: number;
  leg: number;
}

export interface NavLeg {
  endIndex: number;
  /** Metres from the start of the route to the end of this leg. */
  endAlong: number;
  /** Apple's estimate for the leg, in seconds. */
  time: number;
  /** Length of the leg along the drawn line, in metres. */
  length: number;
}

export interface NavRoute {
  coords: LatLng[];
  /** Metres from the start to each point. */
  cum: number[];
  /** Total length along the line, in metres. */
  length: number;
  /** Apple's total time, in seconds. */
  time: number;
  steps: NavStep[];
  legs: NavLeg[];
}

/**
 * Turns Apple's answer into a route the engine can follow. `legNames` names
 * where each leg ends, so "Arrive at the destination" becomes "Arrive at
 * Retail park car park".
 */
export function buildRoute(raw: RawRouteLike, legNames: string[] = []): NavRoute {
  const coords: LatLng[] = [];
  for (let i = 0; i + 1 < raw.coords.length; i += 2) coords.push({ lat: raw.coords[i], lng: raw.coords[i + 1] });
  const cum: number[] = [0];
  for (let i = 1; i < coords.length; i++) cum.push(cum[i - 1] + metresBetween(coords[i - 1], coords[i]));
  const length = cum[cum.length - 1] ?? 0;
  const clampIndex = (i: number) => Math.max(0, Math.min(coords.length - 1, Math.round(i)));

  let prevEnd = 0;
  const legs: NavLeg[] = raw.legs.map((l) => {
    const endIndex = clampIndex(l.endIndex);
    const endAlong = cum[endIndex] ?? 0;
    const leg = { endIndex, endAlong, time: l.time, length: Math.max(0, endAlong - prevEnd) };
    prevEnd = endAlong;
    return leg;
  });

  const steps: NavStep[] = raw.steps
    .filter((s) => s.text.trim().length > 0)
    .map((s) => {
      const index = clampIndex(s.index);
      const kind = manoeuvreOf(s.text);
      let text = s.text.trim();
      const name = legNames[s.leg];
      if (kind === 'arrive' && name) {
        const side = /on (your|the) (left|right)/i.exec(text);
        text = side ? `Arrive at ${name}, on your ${side[2].toLowerCase()}` : `Arrive at ${name}`;
      }
      return { text, kind, at: { lat: s.lat, lng: s.lng }, index, along: cum[index] ?? 0, leg: s.leg };
    })
    .sort((a, b) => a.along - b.along);

  return { coords, cum, length, time: raw.time, steps, legs };
}

/** The point and direction of travel a given distance along the route (used by the demo drive). */
export function pointAlong(route: NavRoute, along: number): { at: LatLng; bearing: number } {
  const { coords, cum } = route;
  if (coords.length === 0) return { at: { lat: 0, lng: 0 }, bearing: 0 };
  if (coords.length === 1 || along <= 0) return { at: coords[0], bearing: coords.length > 1 ? bearing(coords[0], coords[1]) : 0 };
  const d = Math.min(along, route.length);
  let i = 0;
  while (i < coords.length - 2 && cum[i + 1] < d) i++;
  const segLen = cum[i + 1] - cum[i];
  const t = segLen > 0 ? (d - cum[i]) / segLen : 0;
  const a = coords[i], b = coords[i + 1];
  return { at: { lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t }, bearing: bearing(a, b) };
}

// ---------------------------------------------------------------------------
// Where am I on the route?
// ---------------------------------------------------------------------------

export interface Snap {
  /** Segment index: between coords[index] and coords[index + 1]. */
  index: number;
  at: LatLng;
  /** Metres from the route (sideways). */
  off: number;
  /** Metres from the start of the route. */
  along: number;
  /** Direction of the route here. */
  bearing: number;
}

function snapSegment(route: NavRoute, p: LatLng, i: number): Snap {
  const a = route.coords[i], b = route.coords[i + 1];
  const { t, at, off } = projectOnSegment(p, a, b);
  return { index: i, at, off, along: route.cum[i] + (route.cum[i + 1] - route.cum[i]) * t, bearing: bearing(a, b) };
}

/**
 * Snaps a position to the route. With `hintAlong` (where you were last time)
 * it prefers the stretch near there, so a route that comes back along the same
 * road doesn't jump ahead; `course` (GPS heading) breaks ties the same way.
 */
export function snapToRoute(route: NavRoute, p: LatLng, hintAlong?: number, course?: number | null): Snap {
  const n = route.coords.length;
  if (n === 0) return { index: 0, at: p, off: Infinity, along: 0, bearing: 0 };
  if (n === 1) return { index: 0, at: route.coords[0], off: metresBetween(p, route.coords[0]), along: 0, bearing: 0 };
  let best: Snap | null = null;
  let bestScore = Infinity;
  for (let i = 0; i < n - 1; i++) {
    const s = snapSegment(route, p, i);
    let score = s.off;
    if (hintAlong !== undefined) {
      // Gently prefer the stretch you were on: jumping a long way along the route needs to be clearly nearer.
      const jump = s.along - hintAlong;
      if (jump < -150) score += (-jump - 150) * 0.2;
      if (jump > 400) score += (jump - 400) * 0.02;
    }
    if (course != null && course >= 0 && angleBetween(course, s.bearing) > 100) score += 40;
    if (score < bestScore) {
      bestScore = score;
      best = s;
    }
  }
  return best!;
}

export interface Progress {
  snap: Snap;
  /** Index into route.steps of the next manoeuvre, or -1 when there are none left. */
  stepIndex: number;
  /** Metres to the next manoeuvre. */
  toStep: number;
  /** Metres to the end of the route. */
  toEnd: number;
  /** Leg you're on. */
  leg: number;
  /** Metres to the end of this leg. */
  toLegEnd: number;
  /** Seconds to the end of the route (Apple's estimate, scaled to what's left). */
  secondsToEnd: number;
  /** Seconds to the end of this leg. */
  secondsToLegEnd: number;
}

/** Seconds to drive from one point along the route to another, from Apple's time for each leg. */
export function secondsBetween(route: NavRoute, from: number, to: number): number {
  if (to <= from) return 0;
  let total = 0;
  let legStart = 0;
  for (const leg of route.legs) {
    const a = Math.max(from, legStart);
    const b = Math.min(to, leg.endAlong);
    if (b > a && leg.length > 0) total += (leg.time * (b - a)) / leg.length;
    legStart = leg.endAlong;
  }
  if (route.legs.length === 0 && route.length > 0) total = (route.time * (to - from)) / route.length;
  return total;
}

export function progressOn(route: NavRoute, snap: Snap): Progress {
  const along = snap.along;
  const stepIndex = route.steps.findIndex((s) => s.along > along + 3);
  const toStep = stepIndex >= 0 ? route.steps[stepIndex].along - along : 0;
  let leg = route.legs.findIndex((l) => l.endAlong > along + 1);
  if (leg < 0) leg = Math.max(0, route.legs.length - 1);
  const legEnd = route.legs[leg]?.endAlong ?? route.length;
  return {
    snap,
    stepIndex,
    toStep,
    toEnd: Math.max(0, route.length - along),
    leg,
    toLegEnd: Math.max(0, legEnd - along),
    secondsToEnd: secondsBetween(route, along, route.length),
    secondsToLegEnd: secondsBetween(route, along, legEnd),
  };
}

// ---------------------------------------------------------------------------
// What to say, and when
// ---------------------------------------------------------------------------

/** Announcement bands before a manoeuvre: 1 mile, a quarter of a mile, 200 yards, and "now". */
export type Band = 'mile' | 'quarter' | 'yards' | 'now';

const BANDS: { band: Band; max: number; min: number; gap: number; say: string }[] = [
  { band: 'mile', max: 1750, min: 1100, gap: 2000, say: 'In 1 mile' },
  { band: 'quarter', max: 480, min: 300, gap: 650, say: 'In a quarter of a mile' },
  { band: 'yards', max: 200, min: 90, gap: 260, say: 'In 200 yards' },
];

/** How close "now" is: about 4 seconds ahead, between 25 and 70 metres. */
export function nowDistance(speedMps: number | null | undefined): number {
  const v = speedMps != null && speedMps > 0 ? speedMps : 0;
  return Math.max(25, Math.min(70, v * 4));
}

function lowerFirst(s: string): string {
  return s ? s[0].toLowerCase() + s.slice(1) : s;
}

export interface Announcement {
  /** Said once: `${route id}:${step}:${band}`. */
  key: string;
  band: Band;
  text: string;
}

/**
 * The announcement due now, if any. Each band is said once per manoeuvre;
 * a band whose window was skipped (e.g. you joined late) is skipped too. Bands
 * further out than the gap since the last manoeuvre are left out, so you
 * aren't told about the next turn while still making this one.
 */
export function dueAnnouncement(route: NavRoute, progress: Progress, speedMps: number | null | undefined, said: ReadonlySet<string>, routeKey = 'r'): Announcement | null {
  const i = progress.stepIndex;
  if (i < 0) return null;
  const step = route.steps[i];
  const prevAlong = i > 0 ? route.steps[i - 1].along : 0;
  const gap = step.along - prevAlong;
  const d = progress.toStep;
  const next = route.steps[i + 1];
  const then = next && next.along - step.along < 150 && next.kind !== 'arrive' ? `, then ${lowerFirst(next.text)}` : '';
  const key = (band: Band) => `${routeKey}:${i}:${band}`;

  if (d <= nowDistance(speedMps)) {
    // Arriving is said by the arrival check, with the stop's name.
    if (step.kind === 'arrive' || said.has(key('now'))) return null;
    return { key: key('now'), band: 'now', text: `${step.text}${then}` };
  }
  for (const b of BANDS) {
    if (d <= b.max && d > b.min && gap > b.gap) {
      if (said.has(key(b.band))) return null;
      return { key: key(b.band), band: b.band, text: `${b.say}, ${lowerFirst(step.text)}${b.band === 'yards' ? then : ''}` };
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Off the route
// ---------------------------------------------------------------------------

export const OFF_ROUTE_METRES = 50;
export const OFF_ROUTE_SECONDS = 5;
/** Below this speed the GPS heading is noise, so "heading the wrong way" isn't checked. */
const WRONG_WAY_MIN_MPS = 4;

export interface Fix {
  at: LatLng;
  /** m/s, null when unknown. */
  speed: number | null;
  /** GPS course, 0–360, null when unknown. */
  course: number | null;
  /** Metres. */
  accuracy: number | null;
  /** ms. */
  t: number;
}

export interface OffRouteState {
  /** When the current spell off the route began (ms), or null while on it. */
  since: number | null;
  reason?: 'away' | 'wrongWay';
}

export const ON_ROUTE: OffRouteState = { since: null };

/**
 * Off the route: more than 50 m from it (or the GPS accuracy, if worse) for
 * more than 5 seconds, or heading the opposite way along it for as long.
 */
export function checkOffRoute(state: OffRouteState, snap: Snap, fix: Fix): { state: OffRouteState; off: boolean } {
  const limit = Math.max(OFF_ROUTE_METRES, Math.min(fix.accuracy ?? 0, 150));
  const away = snap.off > limit;
  const wrongWay = !away && fix.course != null && fix.course >= 0 && (fix.speed ?? 0) >= WRONG_WAY_MIN_MPS && angleBetween(fix.course, snap.bearing) > 135;
  if (!away && !wrongWay) return { state: ON_ROUTE, off: false };
  const since = state.since ?? fix.t;
  const next: OffRouteState = { since, reason: away ? 'away' : 'wrongWay' };
  return { state: next, off: fix.t - since > OFF_ROUTE_SECONDS * 1000 };
}

// ---------------------------------------------------------------------------
// Stops
// ---------------------------------------------------------------------------

export type StopRole = 'stop' | 'checkpoint' | 'destination';

export interface NavStop {
  id: string;
  name: string;
  at: LatLng;
  role: StopRole;
  /** Events: the stop's index in the event, for check-in. */
  eventStop?: number;
  /** Offer check-in on arrival (cruise regroup stops, meets). */
  checkIn?: boolean;
}

/** Checkpoints count from 0.2 mi, as on a drive (CHECKPOINT_RADIUS_MILES in spots.ts); stops from about 80 m. */
export function arrivalRadius(stop: NavStop): number {
  return stop.role === 'checkpoint' ? 0.2 * METRES_PER_MILE : 80;
}

/**
 * Which stop you've just reached, if any: the next one in order, or one of
 * the few after it (then the ones before it were passed by, e.g. a missed GPS
 * fix). Never further ahead, so a road that loops back past a later stop
 * doesn't skip the rest. Returns the index of the stop reached, or -1.
 */
export function reachedStop(stops: NavStop[], next: number, at: LatLng, lookahead = 3): number {
  for (let i = next; i < Math.min(stops.length, next + 1 + lookahead); i++) {
    if (metresBetween(at, stops[i].at) <= arrivalRadius(stops[i])) return i;
  }
  return -1;
}

/**
 * Points to route through: where you are, then each stop not yet reached.
 * Long drives are thinned to at most `maxLegs` legs (always keeping the next
 * stop and the last one), because Apple limits how many directions requests
 * a phone can make a minute. Returns the points and, for each leg, which stop
 * it ends at.
 */
export function routePoints(from: LatLng, stops: NavStop[], next: number, maxLegs = 30): { points: LatLng[]; legStops: number[] } {
  const remaining = stops.map((s, i) => ({ s, i })).slice(next);
  let picked = remaining;
  if (remaining.length > maxLegs) {
    const keep = new Set<number>([0, remaining.length - 1]);
    const step = (remaining.length - 1) / (maxLegs - 1);
    for (let k = 1; k < maxLegs - 1; k++) keep.add(Math.round(k * step));
    picked = remaining.filter((_, k) => keep.has(k));
  }
  return { points: [from, ...picked.map((x) => x.s.at)], legStops: picked.map((x) => x.i) };
}

/** Where each stop sits along the route (metres), searched in order; NaN for a stop the route doesn't pass. */
export function stopAlongs(route: NavRoute, stops: NavStop[], next: number): number[] {
  let hint = 0;
  return stops.map((s, i) => {
    if (i < next) return NaN;
    const snap = snapToRoute(route, s.at, hint);
    if (snap.off > Math.max(250, arrivalRadius(s) * 1.5)) return NaN;
    hint = snap.along;
    return snap.along;
  });
}

// ---------------------------------------------------------------------------
// Speed cameras and average-speed zones on the route
// ---------------------------------------------------------------------------

/** Cameras count as on the route within this many metres of it. */
export const CAMERA_CORRIDOR_METRES = 40;
/** Alerts start this far ahead: about half a mile. */
export const CAMERA_ALERT_METRES = 805;

export interface RouteCamera {
  id: string;
  at: LatLng;
  mph?: number;
  /** Metres from the start of the route. */
  along: number;
}

export interface RouteZone {
  id: string;
  mph?: number;
  name?: string;
  startAlong: number;
  endAlong: number;
}

/** The box round the route, with a margin in degrees. */
export function routeBox(route: NavRoute, margin = 0.01): { south: number; west: number; north: number; east: number } {
  let south = Infinity, north = -Infinity, west = Infinity, east = -Infinity;
  for (const c of route.coords) {
    south = Math.min(south, c.lat);
    north = Math.max(north, c.lat);
    west = Math.min(west, c.lng);
    east = Math.max(east, c.lng);
  }
  return { south: south - margin, north: north + margin, west: west - margin, east: east + margin };
}

/** Every pass of the route within `corridor` metres of a point: one per stretch, at its nearest. */
export function passesNear(route: NavRoute, p: LatLng, corridor: number): Snap[] {
  const out: Snap[] = [];
  let run: Snap | null = null;
  // Cheap test first: a segment whose box is clearly further than the corridor can't be near.
  const dLat = corridor / 111_000;
  const dLng = dLat / Math.max(0.2, Math.cos(rad(p.lat)));
  for (let i = 0; i < route.coords.length - 1; i++) {
    const a = route.coords[i], b = route.coords[i + 1];
    if (
      p.lat < Math.min(a.lat, b.lat) - dLat || p.lat > Math.max(a.lat, b.lat) + dLat ||
      p.lng < Math.min(a.lng, b.lng) - dLng || p.lng > Math.max(a.lng, b.lng) + dLng
    ) {
      if (run) {
        out.push(run);
        run = null;
      }
      continue;
    }
    const s = snapSegment(route, p, i);
    if (s.off <= corridor) {
      if (!run || s.off < run.off) run = s;
    } else if (run) {
      out.push(run);
      run = null;
    }
  }
  if (run) out.push(run);
  // Two stretches a few metres apart along the route are the same pass.
  return out.filter((s, k) => k === 0 || s.along - out[k - 1].along > 100);
}

/**
 * Cameras on the route, in order. A camera tagged with a direction that
 * points across the road you're on (a camera on a side road at a junction)
 * is left out; untagged ones are kept.
 */
export function camerasOnRoute(route: NavRoute, cameras: Camera[], corridor = CAMERA_CORRIDOR_METRES): RouteCamera[] {
  if (route.coords.length < 2) return [];
  const box = routeBox(route, 0.002);
  const out: RouteCamera[] = [];
  for (const c of cameras) {
    if (c.at.lat < box.south || c.at.lat > box.north || c.at.lng < box.west || c.at.lng > box.east) continue;
    for (const pass of passesNear(route, c.at, corridor)) {
      if (c.facing !== undefined) {
        const d = angleBetween(c.facing, pass.bearing);
        if (d > 50 && d < 130) continue;
      }
      out.push({ id: c.id, at: c.at, ...(c.mph ? { mph: c.mph } : {}), along: pass.along });
    }
  }
  return out.sort((a, b) => a.along - b.along);
}

function pathLength(path: LatLng[]): number {
  let m = 0;
  for (let i = 1; i < path.length; i++) m += metresBetween(path[i - 1], path[i]);
  return m;
}

/**
 * Average-speed zones you drive through in their own direction (start to
 * end), with where they start and end along the route.
 */
export function zonesOnRoute(route: NavRoute, zones: AverageZone[], corridor = 60): RouteZone[] {
  if (route.coords.length < 2) return [];
  const box = routeBox(route, 0.01);
  const out: RouteZone[] = [];
  for (const z of zones) {
    if (z.box.north < box.south || z.box.south > box.north || z.box.east < box.west || z.box.west > box.east) continue;
    const first = z.path[0];
    const last = z.path[z.path.length - 1];
    const starts = passesNear(route, first, corridor);
    const ends = passesNear(route, last, corridor);
    const zoneLen = pathLength(z.path);
    for (const s of starts) {
      const e = ends.find((x) => x.along > s.along);
      if (!e) continue;
      const len = e.along - s.along;
      // The route must follow the zone's road, not just touch both ends.
      if (len < zoneLen * 0.7 || len > zoneLen * 1.4 + 200) continue;
      const mid = z.path[Math.floor(z.path.length / 2)];
      if (!passesNear(route, mid, corridor * 2).some((m) => m.along > s.along && m.along < e.along)) continue;
      out.push({ id: z.id, ...(z.mph ? { mph: z.mph } : {}), ...(z.name ? { name: z.name } : {}), startAlong: s.along, endAlong: e.along });
    }
  }
  return out.sort((a, b) => a.startAlong - b.startAlong);
}

/** Cameras ahead within the alert distance, nearest first. */
export function camerasAhead(cameras: RouteCamera[], along: number, range = CAMERA_ALERT_METRES): RouteCamera[] {
  return cameras.filter((c) => c.along > along && c.along - along <= range);
}

export interface ZoneStatus {
  /** The zone you're in now. */
  inside?: RouteZone;
  /** The next zone, when it starts within the alert distance. */
  ahead?: RouteZone;
}

export function zoneStatus(zones: RouteZone[], along: number, range = CAMERA_ALERT_METRES): ZoneStatus {
  const inside = zones.find((z) => along >= z.startAlong && along < z.endAlong);
  const ahead = zones.find((z) => z.startAlong > along && z.startAlong - along <= range);
  return { ...(inside ? { inside } : {}), ...(ahead ? { ahead } : {}) };
}

/** Entered a zone: where and when (kept only while you're in it, never saved). */
export interface ZoneRun {
  zoneId: string;
  enteredAlong: number;
  enteredAt: number;
}

/** Your average through the zone so far, in mph. Null for the first few seconds. */
export function zoneAverageMph(run: ZoneRun, along: number, nowMs: number): number | null {
  const seconds = (nowMs - run.enteredAt) / 1000;
  if (seconds < 5) return null;
  return Math.round(((along - run.enteredAlong) / seconds) * MPS_TO_MPH);
}

export interface Limit {
  mph: number;
  source: 'zone' | 'camera';
}

/**
 * The limit to compare your speed with: the zone's while you're in an
 * average-speed zone, else the nearest camera ahead that has one. Only
 * camera and zone data: there's no road speed-limit data in the app.
 */
export function activeLimit(zone: ZoneStatus, ahead: RouteCamera[]): Limit | null {
  if (zone.inside?.mph) return { mph: zone.inside.mph, source: 'zone' };
  const cam = ahead.find((c) => c.mph);
  return cam?.mph ? { mph: cam.mph, source: 'camera' } : null;
}

/** Over the limit, as shown: the whole mph on screen is above it. */
export function isOver(speedMps: number | null | undefined, limit: Limit | null): boolean {
  const mph = mphOf(speedMps);
  return mph != null && limit != null && mph > limit.mph;
}

/** "Speed camera ahead, 30 miles per hour" (speed-limit information only). */
export function cameraAnnouncement(c: RouteCamera): string {
  return c.mph ? `Speed camera ahead, ${c.mph} miles per hour` : 'Speed camera ahead';
}

export function zoneStartAnnouncement(z: RouteZone): string {
  return z.mph ? `Average speed zone starts, ${z.mph} miles per hour` : 'Average speed zone starts';
}

export const ZONE_END_ANNOUNCEMENT = 'Average speed zone ends';

/** "21:42" for an arrival in `seconds`. */
export function etaClock(nowMs: number, seconds: number): string {
  const d = new Date(nowMs + seconds * 1000);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** "25 min" or "1 h 05 min". */
export function formatDuration(seconds: number): string {
  const min = Math.max(1, Math.round(seconds / 60));
  if (min < 60) return `${min} min`;
  return `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, '0')} min`;
}
