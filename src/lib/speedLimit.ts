import { angleBetween, bearing, projectOnSegment } from './nav';
import type { LatLng } from './types';

/**
 * The road you're on, from OpenStreetMap: its name and speed limit (maxspeed),
 * for the driving view's road name and speed-limit roundel. Pure: the driving
 * screen asks Overpass (overpass-api.de) for the roads round a ~200 m square
 * when you enter a new one, keeps the answer for that square, and picks the
 * road you're on from it on every fix. Never needed to drive: unknown just
 * hides the roundel. Only the square's centre is sent (about 100 m), never
 * a name, a route or an account. © OpenStreetMap contributors, ODbL.
 */

export const OSM_CREDIT = 'Road names and limits © OpenStreetMap';
export const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

export interface SpeedValue {
  value: number;
  unit: 'mph' | 'kmh';
}

/** What a road's limit says in mph (km/h roads abroad converted, to the nearest whole mph). */
export function mphLimit(v: SpeedValue): number {
  return v.unit === 'mph' ? v.value : Math.round(v.value * 0.621371);
}

/**
 * An OSM maxspeed tag: "30 mph", "50" (km/h), "GB:nsl_single" (60 mph),
 * "GB:nsl_dual" and "GB:motorway" (70 mph). Null for "none", "signals",
 * "variable", "walk" and anything else we can't trust.
 */
export function parseMaxspeed(tag: string | null | undefined): SpeedValue | null {
  if (!tag) return null;
  const t = tag.split(';')[0].trim().toLowerCase();
  if (/^(gb|uk):nsl_single$/.test(t)) return { value: 60, unit: 'mph' };
  if (/^(gb|uk):(nsl_dual|motorway)$/.test(t)) return { value: 70, unit: 'mph' };
  const mph = /^(\d{1,3})\s*mph$/.exec(t);
  if (mph) return plausible({ value: Number(mph[1]), unit: 'mph' });
  const kmh = /^(\d{1,3})(?:\s*(?:km\/h|kmh|kph))?$/.exec(t);
  if (kmh) return plausible({ value: Number(kmh[1]), unit: 'kmh' });
  return null;
}

function plausible(v: SpeedValue): SpeedValue | null {
  const mph = mphLimit(v);
  return mph >= 5 && mph <= 90 ? v : null;
}

export interface OsmWay {
  id: number;
  tags?: Record<string, string>;
  geometry?: { lat: number; lon: number }[];
}

/** About 220 m by 140 m in the UK: the area one lookup covers. */
const CELL_DEG = 0.002;
/** Covers the whole square from its centre, with a margin. */
export const LOOKUP_RADIUS_M = 160;
/** At most one lookup this often. */
export const LOOKUP_MIN_MS = 4000;

const ROADS =
  'motorway|motorway_link|trunk|trunk_link|primary|primary_link|secondary|secondary_link|tertiary|tertiary_link|unclassified|residential|living_street|service|road';

/** The square you're in: its key and centre (the only position sent). */
export function cellOf(at: LatLng): { key: string; centre: LatLng } {
  const lat = Math.floor(at.lat / CELL_DEG) * CELL_DEG + CELL_DEG / 2;
  const lng = Math.floor(at.lng / CELL_DEG) * CELL_DEG + CELL_DEG / 2;
  return { key: `${lat.toFixed(4)},${lng.toFixed(4)}`, centre: { lat: Number(lat.toFixed(4)), lng: Number(lng.toFixed(4)) } };
}

/** The Overpass query for the roads round a square's centre. */
export function overpassQuery(centre: LatLng, radius = LOOKUP_RADIUS_M): string {
  return `[out:json][timeout:8];way(around:${radius},${centre.lat.toFixed(4)},${centre.lng.toFixed(4)})[highway~"^(${ROADS})$"];out tags geom;`;
}

/** Ways from an Overpass answer; empty for anything unexpected. */
export function waysFrom(json: unknown): OsmWay[] {
  const els = (json as { elements?: unknown[] } | null)?.elements;
  if (!Array.isArray(els)) return [];
  return els.filter((e): e is OsmWay => {
    const w = e as OsmWay & { type?: string };
    return w?.type === 'way' && typeof w.id === 'number' && Array.isArray(w.geometry) && w.geometry.length > 1;
  });
}

/** Within this (m) of a way you're on it. */
const ON_WAY_M = 30;

/**
 * The way you're on: the nearest within 30 m, with a nudge towards ways that
 * run the way you're heading (a side road meeting yours scores worse), and
 * against one-way roads the wrong way round. Null when nothing is close.
 */
export function pickWay(ways: OsmWay[], at: LatLng, heading: number | null): OsmWay | null {
  let best: OsmWay | null = null;
  let bestScore = Infinity;
  for (const w of ways) {
    const g = w.geometry!;
    let near = Infinity;
    let dir = 0;
    for (let i = 0; i + 1 < g.length; i++) {
      const a = { lat: g[i].lat, lng: g[i].lon };
      const b = { lat: g[i + 1].lat, lng: g[i + 1].lon };
      const { off } = projectOnSegment(at, a, b);
      if (off < near) {
        near = off;
        dir = bearing(a, b);
      }
    }
    if (near > ON_WAY_M) continue;
    let score = near;
    if (heading != null && heading >= 0) {
      const diff = angleBetween(heading, dir);
      const across = Math.min(diff, 180 - diff);
      if (across > 40) score += 20;
      if (w.tags?.oneway === 'yes' && diff > 100) score += 30;
    }
    if (score < bestScore) {
      bestScore = score;
      best = w;
    }
  }
  return best;
}

export interface RoadInfo {
  wayId: number;
  /** "High Street", or a number such as "A38" when it has no name. */
  name: string | null;
  limit: SpeedValue | null;
}

/** The name and limit from a way's tags. */
export function roadInfo(w: OsmWay): RoadInfo {
  const t = w.tags ?? {};
  const name = (t.name || t.ref || '').trim() || null;
  const limit = parseMaxspeed(t.maxspeed) ?? parseMaxspeed(t['maxspeed:type']) ?? parseMaxspeed(t['source:maxspeed']);
  return { wayId: w.id, name, limit };
}

/** Keeps the latest squares' answers (oldest dropped first). */
export function remember<T>(cache: Map<string, T>, key: string, value: T, max = 40): void {
  cache.delete(key);
  cache.set(key, value);
  while (cache.size > max) cache.delete(cache.keys().next().value as string);
}

/** Look up a new square? Only when it isn't cached and the last lookup was a few seconds ago. */
export function lookupDue(cached: boolean, lastAt: number, now: number): boolean {
  return !cached && now - lastAt >= LOOKUP_MIN_MS;
}

