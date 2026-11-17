import type { LatLng } from './types';

/**
 * Compact encoding for the bundled speed-camera dataset (src/data/cameras.ts).
 *
 * Cameras are grouped into 1° × 1° tiles so the app only decodes the tiles on
 * screen. Each camera is 8 characters of a URL-safe base-64 alphabet:
 *
 *   3 chars  latitude offset inside the tile, in 1e-5 degrees (about 1 m)
 *   3 chars  longitude offset inside the tile, in 1e-5 degrees
 *   1 char   speed limit: mph ÷ 5, or 0 when it isn't tagged
 *   1 char   direction it faces: 0 none, else 1 + bearing ÷ 6 (6° steps)
 *
 * Self-contained (type imports only): scripts/fetch-cameras.mjs imports it with Node.
 */

export const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
export const RECORD_LENGTH = 8;

export interface Camera {
  /** Stable for one dataset: tile key and position in the tile. */
  id: string;
  at: LatLng;
  /** Speed limit the camera enforces, when OpenStreetMap has it. */
  mph?: number;
  /** Compass bearing the camera faces (0 = north), when tagged. */
  facing?: number;
}

export interface CameraRecord {
  at: LatLng;
  mph?: number;
  facing?: number;
}

const VAL = (() => {
  const m: Record<string, number> = {};
  for (let i = 0; i < B64.length; i++) m[B64[i]] = i;
  return m;
})();

export function tileKey(p: LatLng): string {
  return `${Math.floor(p.lat)}_${Math.floor(p.lng)}`;
}

export function tileOrigin(key: string): LatLng {
  const [lat, lng] = key.split('_').map(Number);
  return { lat, lng };
}

function put(n: number, chars: number): string {
  let out = '';
  for (let i = chars - 1; i >= 0; i--) out += B64[(n >> (6 * i)) & 63];
  return out;
}

function get(s: string, at: number, chars: number): number {
  let n = 0;
  for (let i = 0; i < chars; i++) n = (n << 6) | (VAL[s[at + i]] ?? 0);
  return n;
}

export function encodeRecord(r: CameraRecord, key = tileKey(r.at)): string {
  const o = tileOrigin(key);
  const dLat = Math.min(99_999, Math.max(0, Math.round((r.at.lat - o.lat) * 1e5)));
  const dLng = Math.min(99_999, Math.max(0, Math.round((r.at.lng - o.lng) * 1e5)));
  const speed = r.mph && r.mph > 0 ? Math.min(63, Math.round(r.mph / 5)) : 0;
  const facing = r.facing === undefined ? 0 : 1 + (Math.round((((r.facing % 360) + 360) % 360) / 6) % 60);
  return put(dLat, 3) + put(dLng, 3) + B64[speed] + B64[facing];
}

/** Group records into tiles: { "52_-1": "AbC…" }. Sorted, so a rebuild with the same data gives the same file. */
export function encodeTiles(records: CameraRecord[]): Record<string, string> {
  const byTile = new Map<string, string[]>();
  for (const r of records) {
    const key = tileKey(r.at);
    const list = byTile.get(key) ?? [];
    list.push(encodeRecord(r, key));
    byTile.set(key, list);
  }
  const out: Record<string, string> = {};
  for (const key of [...byTile.keys()].sort()) out[key] = byTile.get(key)!.sort().join('');
  return out;
}

export function decodeTile(key: string, s: string): Camera[] {
  const o = tileOrigin(key);
  const out: Camera[] = [];
  for (let i = 0; i + RECORD_LENGTH <= s.length; i += RECORD_LENGTH) {
    const speed = VAL[s[i + 6]] ?? 0;
    const facing = VAL[s[i + 7]] ?? 0;
    out.push({
      id: `${key}:${i / RECORD_LENGTH}`,
      at: { lat: Math.round((o.lat + get(s, i, 3) / 1e5) * 1e5) / 1e5, lng: Math.round((o.lng + get(s, i + 3, 3) / 1e5) * 1e5) / 1e5 },
      ...(speed ? { mph: speed * 5 } : {}),
      ...(facing ? { facing: (facing - 1) * 6 } : {}),
    });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Reading OpenStreetMap tags (used by the build script, tested here)
// ---------------------------------------------------------------------------

const UK_LIMITS = [20, 30, 40, 50, 60, 70];

/**
 * A UK speed limit in mph from an OSM `maxspeed` value, or undefined when it
 * isn't clear. "30 mph" and the UK national-limit codes are read as they are.
 * A bare number is km/h in OSM: it's kept only when it converts cleanly to a UK
 * limit (48 → 30 mph); a bare 30 or 50 is ambiguous, so it's left out.
 */
export function parseMaxspeed(raw: string | undefined): number | undefined {
  if (!raw) return undefined;
  const v = raw.trim().toLowerCase();
  if (v === 'uk:nsl_single' || v === 'gb:nsl_single') return 60;
  if (v === 'uk:nsl_dual' || v === 'gb:nsl_dual' || v === 'uk:motorway' || v === 'gb:motorway') return 70;
  const mph = v.match(/^(\d{1,3})\s*mph$/);
  if (mph) {
    const n = Number(mph[1]);
    return n >= 5 && n <= 70 && n % 5 === 0 ? n : undefined;
  }
  const kmh = v.match(/^(\d{1,3})(\s*km\/h)?$/);
  if (kmh) {
    const n = Number(kmh[1]) / 1.609344;
    const limit = UK_LIMITS.find((l) => Math.abs(l - n) < 1.2);
    if (limit === undefined) return undefined;
    // A bare number that is itself a UK limit could be a mistagged mph value.
    if (!kmh[2] && UK_LIMITS.includes(Number(kmh[1]))) return undefined;
    return limit;
  }
  return undefined;
}

const CARDINAL: Record<string, number> = {
  n: 0, nne: 22.5, ne: 45, ene: 67.5, e: 90, ese: 112.5, se: 135, sse: 157.5,
  s: 180, ssw: 202.5, sw: 225, wsw: 247.5, w: 270, wnw: 292.5, nw: 315, nnw: 337.5,
};

/**
 * Compass bearing from an OSM `direction` value: degrees ("270") or a compass
 * point ("NE"). "forward", "backward", "both" and ranges are relative to the
 * road or ambiguous, so they give undefined.
 */
export function parseDirection(raw: string | undefined): number | undefined {
  if (!raw) return undefined;
  const v = raw.trim().toLowerCase();
  if (/^\d{1,3}(\.\d+)?$/.test(v)) {
    const n = Number(v);
    return n >= 0 && n <= 360 ? n % 360 : undefined;
  }
  return CARDINAL[v];
}

const POINTS = ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'];

/** "north-east" for 45°. */
export function compassName(bearing: number): string {
  return POINTS[Math.round((((bearing % 360) + 360) % 360) / 45) % 8];
}

/** The bundled dataset as written by scripts/fetch-cameras.mjs. */
export interface CameraDataset {
  /** Day the data was fetched (YYYY-MM-DD). */
  generated: string;
  count: number;
  /** Regions of the UK fetched (see scripts/fetch-cameras.mjs). */
  regions: string[];
  /** Tile key -> encoded cameras (see the top of this file). */
  tiles: Record<string, string>;
  /** Average-speed zones: [mph or 0, name or "", encoded polyline]. */
  zones: [number, string, string][];
}
