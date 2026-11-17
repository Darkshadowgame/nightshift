import { milesBetween } from './geo';
import type { BanZone, LatLng } from './types';

/**
 * Ban zones: is a point inside one? A zone is either a circle (small PSPOs and
 * dispersal hotspots) or one or more simplified council-boundary polygons
 * (borough- or city-wide orders). Pure: the screens and the store share it.
 */

/** Ray casting on lat/lng: fine at council scale (a few miles), well away from the poles. */
export function pointInPolygon(p: LatLng, ring: readonly LatLng[]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i];
    const b = ring[j];
    if (a.lat > p.lat !== b.lat > p.lat && p.lng < ((b.lng - a.lng) * (p.lat - a.lat)) / (b.lat - a.lat) + a.lng) inside = !inside;
  }
  return inside;
}

export function inZone(p: LatLng, z: BanZone): boolean {
  if (z.polygons?.length) return z.polygons.some((ring) => pointInPolygon(p, ring));
  return milesBetween(z.centre, p) <= z.radiusMiles;
}

/** Rough size in square miles, so the most specific zone comes first. */
export function zoneSize(z: BanZone): number {
  if (!z.polygons?.length) return Math.PI * z.radiusMiles * z.radiusMiles;
  let total = 0;
  for (const ring of z.polygons) {
    const lat0 = ring[0]?.lat ?? 0;
    const kx = 69.17 * Math.cos((lat0 * Math.PI) / 180);
    let a = 0;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) a += (ring[j].lng * kx) * (ring[i].lat * 69) - (ring[i].lng * kx) * (ring[j].lat * 69);
    total += Math.abs(a) / 2;
  }
  return total;
}

/** Every zone this point is inside, the most specific (smallest) first. */
export function zonesAt(p: LatLng, zones: readonly BanZone[]): BanZone[] {
  return zones.filter((z) => inZone(p, z)).sort((a, b) => zoneSize(a) - zoneSize(b));
}

/** Every zone any of these points is inside (each once), the most specific first. */
export function zonesForPoints(points: readonly LatLng[], zones: readonly BanZone[]): BanZone[] {
  const hit = new Set<BanZone>();
  for (const z of zones) if (points.some((p) => inZone(p, z))) hit.add(z);
  return [...hit].sort((a, b) => zoneSize(a) - zoneSize(b));
}

/** Map shapes for drawing the zones: circles for circle zones, outlines for polygon zones. */
export function zoneShapes(zones: readonly BanZone[], colour: string): {
  circles: { id: string; centre: LatLng; radiusMiles: number; colour: string }[];
  polygons: { id: string; coords: LatLng[]; colour: string }[];
} {
  const circles: { id: string; centre: LatLng; radiusMiles: number; colour: string }[] = [];
  const polygons: { id: string; coords: LatLng[]; colour: string }[] = [];
  for (const z of zones) {
    if (z.polygons?.length) z.polygons.forEach((ring, i) => polygons.push({ id: `bz:${z.id}:${i}`, coords: ring, colour }));
    else circles.push({ id: `bz:${z.id}`, centre: z.centre, radiusMiles: z.radiusMiles, colour });
  }
  return { circles, polygons };
}
