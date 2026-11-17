import { milesBetween } from './geo';
import type { LatLng, NightEvent } from './types';

/**
 * The rough area people see before the reveal. It must never give the place
 * away, so it is not the stops' centre: the centre is snapped to a ~2 mi grid,
 * then pushed 1–2 mi in a direction picked from the event id. The circle drawn
 * round it is at least 3 mi and still contains every stop, without being
 * centred on any of them.
 */

/** Grid step: about 2 mi in both directions in the UK. */
const GRID_LAT = 0.03;
const GRID_LNG = 0.045;
/** Never put the area this close to a real stop. Tests check 0.75 mi; we aim wider. */
const MIN_CLEARANCE_MILES = 1;
export const MIN_AREA_RADIUS_MILES = 3;

const MILES_PER_DEG_LAT = 69.05;

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function offset(p: LatLng, bearingDeg: number, miles: number): LatLng {
  const b = (bearingDeg * Math.PI) / 180;
  const dLat = (miles * Math.cos(b)) / MILES_PER_DEG_LAT;
  const dLng = (miles * Math.sin(b)) / (MILES_PER_DEG_LAT * Math.cos((p.lat * Math.PI) / 180));
  return { lat: round(p.lat + dLat), lng: round(p.lng + dLng) };
}

function round(n: number): number {
  return Math.round(n * 1000) / 1000;
}

function centroid(points: LatLng[]): LatLng {
  return {
    lat: points.reduce((a, p) => a + p.lat, 0) / points.length,
    lng: points.reduce((a, p) => a + p.lng, 0) / points.length,
  };
}

function nearest(p: LatLng, stops: LatLng[]): number {
  return Math.min(...stops.map((s) => milesBetween(p, s)));
}

/**
 * A fuzzed point near the stops. Same stops and id give the same answer, and
 * small moves of a stop usually don't change it (the grid absorbs them).
 */
export function roughArea(stops: LatLng[], key: string): LatLng {
  if (stops.length === 0) throw new Error('Place a stop first.');
  const c = centroid(stops);
  const snapped = { lat: Math.round(c.lat / GRID_LAT) * GRID_LAT, lng: Math.round(c.lng / GRID_LNG) * GRID_LNG };
  const h = hash(`${key}:${snapped.lat.toFixed(3)},${snapped.lng.toFixed(3)}`);
  const bearing = h % 360;
  const miles = 1 + ((h >>> 9) % 1000) / 1000; // 1–2 mi
  // Try the picked direction first, then turn and go a little further until clear of every stop.
  for (let ring = 0; ring < 6; ring++) {
    for (let turn = 0; turn < 12; turn++) {
      const p = offset(snapped, bearing + turn * 30, miles + ring * 0.75);
      if (nearest(p, stops) >= MIN_CLEARANCE_MILES) return p;
    }
  }
  // Very spread-out stops: go well clear of the furthest one.
  return offset(snapped, bearing, miles + Math.max(...stops.map((s) => milesBetween(snapped, s))) + MIN_CLEARANCE_MILES);
}

/** Circle radius that contains every stop, at least 3 mi, in whole miles. */
export function areaRadiusFor(area: LatLng, stops: LatLng[]): number {
  const far = stops.length ? Math.max(...stops.map((s) => milesBetween(area, s))) : 0;
  return Math.max(MIN_AREA_RADIUS_MILES, Math.ceil(far + 0.5));
}

/** Area and radius for an event's stops. Public events (shows, track days) just use the venue. */
export function eventArea(stops: LatLng[], key: string, isPublic: boolean): { area: LatLng; areaRadiusMiles: number } {
  if (isPublic) return { area: stops[0], areaRadiusMiles: MIN_AREA_RADIUS_MILES };
  const area = roughArea(stops, key);
  return { area, areaRadiusMiles: areaRadiusFor(area, stops) };
}

/** The circle to draw for an event (older saved events may have no radius yet). */
export function areaRadius(event: NightEvent): number {
  if (event.areaRadiusMiles) return event.areaRadiusMiles;
  return areaRadiusFor(event.area, event.stops.flatMap((s) => (s.at ? [s.at] : [])));
}

/** True when the area sits too close to one of the stops (e.g. data saved before the fix). */
export function areaGivesAway(event: NightEvent, minMiles = 0.75): boolean {
  const stops = event.stops.flatMap((s) => (s.at ? [s.at] : []));
  return stops.length > 0 && nearest(event.area, stops) < minMiles;
}
