import { OVERPASS_URL, overpassQuery, waysFrom, type OsmWay } from './speedLimit';
import type { LatLng } from './types';

/**
 * Asks OpenStreetMap's Overpass API for the roads round a square's centre
 * (speedLimit.ts). Sent as a POST body, never in the URL; only the rounded
 * centre goes. Fails quietly: empty on any error or after 8 s.
 */
export async function fetchRoads(centre: LatLng, radius?: number): Promise<OsmWay[] | null> {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 8000);
  try {
    const res = await fetch(OVERPASS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body: `data=${encodeURIComponent(overpassQuery(centre, radius))}`,
      signal: ctl.signal,
    });
    if (!res.ok) return null;
    return waysFrom(await res.json());
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}
