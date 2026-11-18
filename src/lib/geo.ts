import type { LatLng } from './types';

const EARTH_MILES = 3958.8;

export function milesBetween(a: LatLng, b: LatLng): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_MILES * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** "2.3 mi", "14 mi". Under 0.1 mi says so, because callers add "from you" or "from home" (REVIEW-8: "here from you"). */
export function formatMiles(miles: number): string {
  if (miles < 0.1) return 'under 0.1 mi';
  if (miles < 10) return `${miles.toFixed(1)} mi`;
  return `${Math.round(miles)} mi`;
}

/** Snap a position to a ~1 km grid so it can't pinpoint a house. */
export function fuzz(p: LatLng): LatLng {
  const step = 0.01;
  return { lat: Math.round(p.lat / step) * step, lng: Math.round(p.lng / step) * step };
}

/** A map centre and span (degrees of latitude) that shows every point, with a margin. */
export function fitRegion(points: LatLng[], minSpan = 0.3): { centre: LatLng; span: number } | null {
  if (points.length === 0) return null;
  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  const [south, north] = [Math.min(...lats), Math.max(...lats)];
  const [west, east] = [Math.min(...lngs), Math.max(...lngs)];
  const centre = { lat: (south + north) / 2, lng: (west + east) / 2 };
  // The maps show 1.2× the span across, so a wide spread needs a little less height.
  const span = Math.max(minSpan, (north - south) * 1.5, ((east - west) * 1.5) / 1.2);
  return { centre, span };
}
