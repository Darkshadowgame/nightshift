import type { LatLng } from './types';

/**
 * Where the Tonight map was last looking, for this session only (never saved). The post place
 * picker opens here rather than on your home area, which it refuses (REVIEW-7 problem 4).
 */
let last: LatLng | null = null;

export function rememberMapView(at: LatLng): void {
  last = at;
}

export function lastMapView(): LatLng | null {
  return last;
}
