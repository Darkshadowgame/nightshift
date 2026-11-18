import { milesBetween } from './geo';
import { MAX_POINT_GAP_MILES, pathMiles } from './spots';
import type { LatLng } from './types';

/**
 * Rules for the full-screen map picker (components/MapPicker.tsx): one place
 * ("Set spot here") or a line of checkpoints for a drive ("Add checkpoint").
 * Pure, so it can be tested without a map.
 */

export type PickMode = 'point' | 'path';

/** A known place shown faintly on the picker, which the crosshair can snap to. */
export interface PickPlace {
  id: string;
  name: string;
  at: LatLng;
}

/** What the picker hands back for one place: where, and a name when it came from a known place. */
export interface PickedStop {
  at: LatLng;
  name?: string;
}

/** A second tap this close to the last checkpoint is a double tap, not a new point (about 15 m). */
export const MIN_STEP_MILES = 0.01;

/** Snap to a known place when the crosshair is within this share of the visible span... */
const SNAP_SHARE = 0.03;
/** ...but never further than this, however far out you've zoomed. */
const MAX_SNAP_MILES = 0.25;
/** Miles per degree of latitude. */
const MILES_PER_DEG = 69;

/** About a metre: no point pretending a finger on a phone map is more precise. */
export function roundAt(at: LatLng): LatLng {
  return { lat: Math.round(at.lat * 1e5) / 1e5, lng: Math.round(at.lng * 1e5) / 1e5 };
}

/** One place replaces the last; a drive adds to the end (a near-duplicate of the last point is ignored). */
export function addPoint(points: LatLng[], at: LatLng, mode: PickMode): LatLng[] {
  const p = roundAt(at);
  if (mode === 'point') return [p];
  const last = points[points.length - 1];
  if (last && milesBetween(last, p) < MIN_STEP_MILES) return points;
  return [...points, p];
}

export function undoPoint(points: LatLng[]): LatLng[] {
  return points.slice(0, -1);
}

/** How far the next checkpoint (at the crosshair) would be from the last one, and whether that's too far. */
export function gapTo(points: LatLng[], at: LatLng): { miles: number; tooFar: boolean } | null {
  const last = points[points.length - 1];
  if (!last) return null;
  const miles = milesBetween(last, at);
  return { miles, tooFar: miles > MAX_POINT_GAP_MILES };
}

/** The checkpoint count and length for the picker's bottom bar, e.g. "3 CHECKPOINTS · 2.4 MI". */
export function pathSummary(points: LatLng[]): string {
  const n = points.length;
  const count = `${n} CHECKPOINT${n === 1 ? '' : 'S'}`;
  return n > 1 ? `${count} · ${pathMiles(points).toFixed(1)} MI` : count;
}

/** Done is allowed once there's enough to hand back: one place, or a start and an end for a drive. */
export function canFinish(points: LatLng[], mode: PickMode): boolean {
  return mode === 'point' ? points.length === 1 : points.length >= 2;
}

/** The known place the crosshair is on, if any: the nearest within a zoom-dependent reach. */
export function snapPlace(at: LatLng, places: PickPlace[], span: number): PickPlace | null {
  const reach = Math.min(MAX_SNAP_MILES, span * MILES_PER_DEG * SNAP_SHARE);
  let best: PickPlace | null = null;
  let bestMiles = reach;
  for (const p of places) {
    const d = milesBetween(at, p.at);
    if (d <= bestMiles) {
      best = p;
      bestMiles = d;
    }
  }
  return best;
}

/** Where the crosshair is, as the stop to hand back: snapped onto a known place (with its name) when it's on one. */
export function crosshairStop(at: LatLng, places: PickPlace[], span: number): PickedStop {
  const snap = snapPlace(at, places, span);
  return snap ? { at: snap.at, name: snap.name } : { at: roundAt(at) };
}

/**
 * Context to draw faintly: the places near the view (about two screens' worth),
 * nearest first and capped, so a busy region doesn't flood the map.
 */
export function nearbyPlaces<T extends { at: LatLng }>(places: T[], centre: LatLng, span: number, limit = 60): T[] {
  const reach = Math.max(2, span * MILES_PER_DEG * 1.5);
  return places
    .map((p) => ({ p, d: milesBetween(centre, p.at) }))
    .filter((x) => x.d <= reach)
    .sort((a, b) => a.d - b.d)
    .slice(0, limit)
    .map((x) => x.p);
}

/** The live label when the geocoder can't name the crosshair (web preview, offline): plain coordinates. */
export function formatLatLng(at: LatLng): string {
  const ns = at.lat >= 0 ? 'N' : 'S';
  const ew = at.lng >= 0 ? 'E' : 'W';
  return `${Math.abs(at.lat).toFixed(4)}° ${ns}, ${Math.abs(at.lng).toFixed(4)}° ${ew}`;
}

/**
 * A readable name for the crosshair when the phone's geocoder can't give one (the web preview,
 * offline): the nearest known place within 2 mi ("Near Ventura Park"), else the nearest town
 * ("Near Tamworth", from areaNameNear). Never raw coordinates (REVIEW-7 problem 4), never
 * "Somewhere in Midlands" (Review 13).
 */
export function describePoint(at: LatLng, known: readonly { name: string; at: LatLng }[], town: string): string {
  let best: { name: string; miles: number } | null = null;
  for (const k of known) {
    const miles = milesBetween(at, k.at);
    if (miles <= 2 && (!best || miles < best.miles)) best = { name: k.name, miles };
  }
  if (best) return best.miles < 0.15 ? `At ${best.name}` : `Near ${best.name} (${best.miles < 1 ? best.miles.toFixed(1) : Math.round(best.miles)} mi)`;
  return `Near ${town}`;
}

/**
 * Where a post's place picker opens: the place already picked, else the last map view, else
 * where you are, never on your home area (it's refused there). If nothing else, about 2 km
 * north of home, outside the 1 km it refuses.
 */
export function postPickerStart(o: { picked: LatLng | null; lastView: LatLng | null; here: LatLng | null; home: LatLng | null }, clearKm = 1): LatLng {
  const clear = (p: LatLng | null): p is LatLng => !!p && (!o.home || milesBetween(p, o.home) * 1.609344 >= clearKm * 1.2);
  if (o.picked) return o.picked;
  if (clear(o.lastView)) return o.lastView;
  if (clear(o.here)) return o.here;
  const base = o.home ?? { lat: 52.63, lng: -1.7 };
  return { lat: base.lat + 0.02, lng: base.lng };
}
