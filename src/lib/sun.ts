import type { LatLng } from './types';

/**
 * Sunrise and sunset, worked out on the phone (NOAA's simplified solar equations, good to a
 * couple of minutes in the UK), for the maps' Auto day/night style. Nothing is sent anywhere.
 */

export type MapStyleChoice = 'auto' | 'day' | 'night';
export type MapAppearance = 'light' | 'dark';

export const MAP_STYLE_LABELS: Record<MapStyleChoice, string> = { auto: 'Auto', day: 'Day', night: 'Night' };

/** Where Auto works from when your location isn't known: the middle of England. */
export const DEFAULT_SUN_PLACE: LatLng = { lat: 52.5, lng: -1.5 };

const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;

/**
 * Today's sunrise and sunset (UTC ms) at a place, for the UTC day containing `when`. Null for
 * either when the sun doesn't rise or set that day (polar day or night).
 */
export function sunTimes(when: Date, at: LatLng): { sunrise: number | null; sunset: number | null; polar: 'day' | 'night' | null } {
  const dayStart = Date.UTC(when.getUTCFullYear(), when.getUTCMonth(), when.getUTCDate());
  const start = Date.UTC(when.getUTCFullYear(), 0, 1);
  const n = Math.floor((dayStart - start) / 86_400_000) + 1;
  // Fractional year (radians), at midday.
  const g = ((2 * Math.PI) / 365) * (n - 1);
  const eqTime = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
  const decl =
    0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g) - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
  // Sun's centre 0.833° below the horizon (refraction and its radius).
  const cosH = (Math.cos(rad(90.833)) - Math.sin(rad(at.lat)) * Math.sin(decl)) / (Math.cos(rad(at.lat)) * Math.cos(decl));
  if (cosH > 1) return { sunrise: null, sunset: null, polar: 'night' };
  if (cosH < -1) return { sunrise: null, sunset: null, polar: 'day' };
  const ha = deg(Math.acos(cosH));
  const noonMin = 720 - 4 * at.lng - eqTime;
  return {
    sunrise: dayStart + (noonMin - 4 * ha) * 60_000,
    sunset: dayStart + (noonMin + 4 * ha) * 60_000,
    polar: null,
  };
}

/** Daylight at a place and time. */
export function isDaytime(when: Date, at: LatLng): boolean {
  const s = sunTimes(when, at);
  if (s.polar) return s.polar === 'day';
  const t = when.getTime();
  return t >= s.sunrise! && t < s.sunset!;
}

/** Light or dark map for the choice: Auto goes by the sun where you are (else mid-England). */
export function mapAppearance(choice: MapStyleChoice | null | undefined, when: Date, at?: LatLng | null): MapAppearance {
  if (choice === 'day') return 'light';
  if (choice === 'night') return 'dark';
  return isDaytime(when, at ?? DEFAULT_SUN_PLACE) ? 'light' : 'dark';
}
