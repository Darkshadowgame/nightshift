import type { LatLng } from './types';

const EARTH_MILES = 3958.8;

export function milesBetween(a: LatLng, b: LatLng): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_MILES * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function formatMiles(miles: number): string {
  if (miles < 0.1) return 'here';
  if (miles < 10) return `${miles.toFixed(1)} mi`;
  return `${Math.round(miles)} mi`;
}

/** Snap a position to a ~1 km grid so it can't pinpoint a house. */
export function fuzz(p: LatLng): LatLng {
  const step = 0.01;
  return { lat: Math.round(p.lat / step) * step, lng: Math.round(p.lng / step) * step };
}
