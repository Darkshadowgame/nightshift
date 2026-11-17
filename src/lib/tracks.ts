import { CIRCUIT_OUTLINES } from '../data/circuits';
import { TRACK_INFO, type LapRecord, type TrackInfo, type TrackLayout, type TrackVehicle } from '../data/trackInfo';
import { inBox, viewBox } from './cameras';
import { matchLayout } from './outline';
import { decodePolyline } from './polyline';
import type { LatLng, Spot } from './types';

/**
 * Circuit details for the track screen and the map: the outline of the main
 * layout (OpenStreetMap, bundled in src/data/circuits.ts), the published
 * layouts and lap records (src/data/trackInfo.ts).
 */

/** Circuit outlines appear on the main map once it's zoomed in this far (about 10 miles top to bottom). */
export const TRACK_OUTLINE_SPAN = 0.15;

export interface TrackOutline {
  path: LatLng[];
  closed: boolean;
  metres: number;
  /** The published layout this outline matches by length, if any. */
  layout?: TrackLayout;
}

const decoded = new Map<string, TrackOutline | null>();

export function trackOutline(id: string): TrackOutline | null {
  if (decoded.has(id)) return decoded.get(id)!;
  const raw = CIRCUIT_OUTLINES[id];
  let out: TrackOutline | null = null;
  if (raw) {
    const path = decodePolyline(raw.p);
    if (path.length >= 2) {
      const layout = matchLayout(raw.m, TRACK_INFO[id]?.layouts ?? []);
      out = { path: raw.closed ? [...path, path[0]] : path, closed: raw.closed, metres: raw.m, ...(layout ? { layout } : {}) };
    }
  }
  decoded.set(id, out);
  return out;
}

export function trackInfo(id: string): TrackInfo | undefined {
  return TRACK_INFO[id];
}

/** Layout names to pick from when entering a time. */
export function layoutNames(id: string): string[] {
  return (TRACK_INFO[id]?.layouts ?? []).map((l) => l.name);
}

/** The published outright record for a layout, for the "quicker than the record" check. */
export function outrightRecord(id: string, layout: string): LapRecord | undefined {
  return TRACK_INFO[id]?.records.find((r) => r.kind === 'outright' && r.layout === layout);
}

/** "3.916 km (2.43 mi)". */
export function formatLength(km: number): string {
  return `${km < 10 ? km.toFixed(3).replace(/\.?0+$/, '') : km.toFixed(1)} km (${(km / 1.609344).toFixed(2)} mi)`;
}

/** Tracks whose outline should be drawn on the main map for this view. */
export function outlinesInView(spots: Spot[], centre: LatLng, span: number): { id: string; outline: TrackOutline }[] {
  if (span > TRACK_OUTLINE_SPAN) return [];
  const b = viewBox(centre, span * 1.5);
  return spots.flatMap((s) => {
    if (s.kind !== 'track' || !inBox(s.at, b)) return [];
    const outline = trackOutline(s.id);
    return outline ? [{ id: s.id, outline }] : [];
  });
}

export const ALL_VEHICLES: TrackVehicle[] = ['car', 'bike', 'kart'];

/**
 * What runs at a track: from trackInfo.ts when known, otherwise karts at a
 * kart venue and cars only at sprint courses and hill climbs, else cars and bikes.
 */
export function trackVehicles(spot: Pick<Spot, 'id' | 'name'>): TrackVehicle[] {
  const known = TRACK_INFO[spot.id]?.vehicles;
  if (known?.length) return known;
  if (/kart/i.test(spot.name)) return ['kart'];
  if (TRACK_INFO[spot.id]?.run) return ['car'];
  return ['car', 'bike'];
}

/** Spectator stadiums don't run track days. */
export function isSpectatorVenue(id: string): boolean {
  return !!TRACK_INFO[id]?.spectator;
}

/** The map's Cars / Bikes / Karts chips: a track shows if anything it runs is picked. */
export function matchesVehicles(spot: Pick<Spot, 'id' | 'name'>, picked: TrackVehicle[]): boolean {
  return trackVehicles(spot).some((v) => picked.includes(v));
}
