import { compassName, decodeTile, tileKey, type Camera, type CameraDataset } from './cameraCodec';
import { milesBetween } from './geo';
import { decodePolyline } from './polyline';
import type { LatLng } from './types';

/**
 * The speed-camera map layer: which cameras and average-speed zones to draw
 * for the part of the map on screen. Data is OpenStreetMap's (ODbL), bundled in
 * src/data/cameras.ts and decoded one 1° tile at a time, only when a tile
 * first comes into view.
 *
 * Presented as speed-limit information ("Speed camera, 30 mph"), never as
 * police positions, and there is no way for people to report cameras or
 * police: the dataset stays OpenStreetMap's alone.
 */

/** Cameras show once the map is zoomed in to driving distance: about 35 miles top to bottom or less. */
export const CAMERA_MAX_SPAN = 0.5;
/** At most this many camera pins at once, nearest the middle of the map first. */
export const MAX_CAMERA_PINS = 120;

export const CAMERA_CREDIT = 'Speed cameras © OpenStreetMap contributors (ODbL)';
export const CAMERA_CAVEAT = 'Camera data is mapped by volunteers and may be incomplete or out of date. Always follow the signs and the limit.';

export interface Box {
  south: number;
  west: number;
  north: number;
  east: number;
}

export interface AverageZone {
  id: string;
  mph?: number;
  name?: string;
  path: LatLng[];
  box: Box;
}

/** The area round a map centre and span (degrees of latitude), with a margin so pins don't pop in at the edges. */
export function viewBox(centre: LatLng, span: number): Box {
  const latHalf = span * 0.6;
  const lngHalf = latHalf / Math.max(0.2, Math.cos((centre.lat * Math.PI) / 180));
  return { south: centre.lat - latHalf, north: centre.lat + latHalf, west: centre.lng - lngHalf, east: centre.lng + lngHalf };
}

export function inBox(p: LatLng, b: Box): boolean {
  return p.lat >= b.south && p.lat <= b.north && p.lng >= b.west && p.lng <= b.east;
}

function overlaps(a: Box, b: Box): boolean {
  return a.south <= b.north && a.north >= b.south && a.west <= b.east && a.east >= b.west;
}

function boxOf(points: LatLng[]): Box {
  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  return { south: Math.min(...lats), north: Math.max(...lats), west: Math.min(...lngs), east: Math.max(...lngs) };
}

/** Tile keys that cover a box. */
export function tilesFor(b: Box): string[] {
  const keys: string[] = [];
  for (let lat = Math.floor(b.south); lat <= Math.floor(b.north); lat++)
    for (let lng = Math.floor(b.west); lng <= Math.floor(b.east); lng++) keys.push(tileKey({ lat, lng }));
  return keys;
}

/** Decodes tiles and zones on first use and keeps them. */
export class CameraIndex {
  private tiles = new Map<string, Camera[]>();
  private zoneList: AverageZone[] | null = null;
  constructor(private data: CameraDataset) {}

  get count(): number {
    return this.data.count;
  }

  get generated(): string {
    return this.data.generated;
  }

  tile(key: string): Camera[] {
    let t = this.tiles.get(key);
    if (!t) {
      const raw = this.data.tiles[key];
      t = raw ? decodeTile(key, raw) : [];
      this.tiles.set(key, t);
    }
    return t;
  }

  /** How many tiles have been decoded so far (for tests). */
  get decodedTiles(): number {
    return this.tiles.size;
  }

  inBox(b: Box): Camera[] {
    return tilesFor(b).flatMap((k) => this.tile(k).filter((c) => inBox(c.at, b)));
  }

  zones(): AverageZone[] {
    if (!this.zoneList) {
      this.zoneList = this.data.zones.flatMap(([mph, name, enc], i) => {
        const path = decodePolyline(enc);
        if (path.length < 2) return [];
        return [{ id: `z${i}`, ...(mph ? { mph } : {}), ...(name ? { name } : {}), path, box: boxOf(path) }];
      });
    }
    return this.zoneList;
  }

  zonesIn(b: Box): AverageZone[] {
    return this.zones().filter((z) => overlaps(z.box, b));
  }

  find(id: string): Camera | undefined {
    const key = id.slice(0, id.lastIndexOf(':'));
    return this.tile(key).find((c) => c.id === id);
  }

  findZone(id: string): AverageZone | undefined {
    return this.zones().find((z) => z.id === id);
  }
}

/**
 * What the camera layer draws for this view: nothing when zoomed out too far
 * (`tooWide`), otherwise the nearest cameras to the centre and the zones that
 * cross the view.
 */
export function camerasForView(
  index: CameraIndex,
  centre: LatLng,
  span: number,
  max = MAX_CAMERA_PINS,
): { cameras: Camera[]; zones: AverageZone[]; tooWide: boolean } {
  if (span > CAMERA_MAX_SPAN) return { cameras: [], zones: [], tooWide: true };
  const b = viewBox(centre, span);
  const cameras = index
    .inBox(b)
    .map((c) => ({ c, d: milesBetween(centre, c.at) }))
    .sort((x, y) => x.d - y.d)
    .slice(0, max)
    .map((x) => x.c);
  return { cameras, zones: index.zonesIn(b), tooWide: false };
}

/**
 * Camera pins stay small so they don't crowd the map: a compact badge at
 * driving zoom, a little bigger only when zoomed right in to street level.
 */
export function cameraPinSize(span: number): number {
  return span <= 0.04 ? 20 : 15;
}

/** "Speed camera · 30 mph · faces north-east". */
export function describeCamera(c: Camera): string {
  return ['Speed camera', c.mph ? `${c.mph} mph` : 'limit not recorded', c.facing !== undefined ? `faces ${compassName(c.facing)}` : null]
    .filter(Boolean)
    .join(' · ');
}

/** "Average speed zone · 50 mph · about 3.2 mi". */
export function describeZone(z: AverageZone): string {
  let miles = 0;
  for (let i = 1; i < z.path.length; i++) miles += milesBetween(z.path[i - 1], z.path[i]);
  return ['Average speed zone', z.mph ? `${z.mph} mph` : 'limit not recorded', `about ${miles.toFixed(1)} mi`].join(' · ');
}

/** Where to put a zone's tappable pin: the point halfway along its line. */
export function zoneMidpoint(z: AverageZone): LatLng {
  return z.path[Math.floor(z.path.length / 2)];
}
