import type { LatLng } from './types';

/**
 * Where "Start navigation" goes: Slipstream's own driving view by default, or
 * another app. Links carry the coordinates only (no stop or event names), so
 * a secret stop's name never leaves the phone in a URL.
 */

export type DirectionsApp = 'nightshift' | 'apple' | 'google' | 'waze';

export const DIRECTIONS_APPS: { id: DirectionsApp; label: string }[] = [
  { id: 'nightshift', label: 'Slipstream' },
  { id: 'apple', label: 'Apple Maps' },
  { id: 'google', label: 'Google Maps' },
  { id: 'waze', label: 'Waze' },
];

export function appLabel(app: DirectionsApp): string {
  return DIRECTIONS_APPS.find((a) => a.id === app)?.label ?? 'Slipstream';
}

const ll = (p: LatLng) => `${p.lat.toFixed(6)},${p.lng.toFixed(6)}`;

/**
 * Links for one app, to try in order: the app's own scheme first (when it has
 * one), then a web link that works without the app.
 * `via`: stops to pass on the way (Google's web link only; the apps take the destination).
 */
export function directionsUrls(app: Exclude<DirectionsApp, 'nightshift'>, to: LatLng, via: LatLng[] = []): string[] {
  switch (app) {
    case 'apple':
      return [`https://maps.apple.com/?daddr=${ll(to)}&dirflg=d`];
    case 'google': {
      const web = `https://www.google.com/maps/dir/?api=1&destination=${ll(to)}&travelmode=driving${
        via.length ? `&waypoints=${encodeURIComponent(via.map(ll).join('|'))}` : ''
      }`;
      return [`comgooglemaps://?daddr=${ll(to)}&directionsmode=driving`, web];
    }
    case 'waze':
      return [`waze://?ll=${ll(to)}&navigate=yes`, `https://waze.com/ul?ll=${ll(to)}&navigate=yes`];
  }
}

/** Text for the share sheet ("Other app…"): the coordinates and an Apple Maps link. */
export function shareLocationText(to: LatLng): string {
  return `${ll(to)}\nhttps://maps.apple.com/?ll=${ll(to)}`;
}
