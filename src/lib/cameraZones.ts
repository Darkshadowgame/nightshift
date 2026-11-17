import type { LatLng } from './types';

/**
 * The line drawn for an average-speed zone from its OpenStreetMap enforcement
 * relation: start ("from") to end ("to"), through the cameras ("device") in
 * order along the way. With no start or end, the two cameras furthest apart
 * stand in. Returns null when there isn't enough to draw a line.
 *
 * Self-contained (type imports only): the build script imports it with Node.
 */

const R = 6_371_008.8;

function metres(a: LatLng, b: LatLng): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Where p falls along a→b: 0 at a, 1 at b (flat projection, fine at these distances). */
function along(a: LatLng, b: LatLng, p: LatLng): number {
  const k = Math.cos((a.lat * Math.PI) / 180);
  const dx = (b.lng - a.lng) * k;
  const dy = b.lat - a.lat;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return 0;
  return (((p.lng - a.lng) * k) * dx + (p.lat - a.lat) * dy) / len2;
}

/** Longer than this and it's probably a mapping mistake. The A9 zone is about 160 km. */
export const MAX_ZONE_METRES = 250_000;
/** Points closer than this are merged (two cameras on one gantry). */
const MERGE_METRES = 40;

export function zonePath(z: { from: LatLng[]; to: LatLng[]; devices: LatLng[] }): LatLng[] | null {
  let start: LatLng | undefined = z.from[0];
  let end: LatLng | undefined = z.to[z.to.length - 1];
  const devices = z.devices.slice();
  if (!start || !end) {
    const all = [...(start ? [start] : []), ...devices, ...(end ? [end] : [])];
    if (all.length < 2) return null;
    let best: [LatLng, LatLng] = [all[0], all[1]];
    let bestD = -1;
    for (let i = 0; i < all.length; i++)
      for (let j = i + 1; j < all.length; j++) {
        const d = metres(all[i], all[j]);
        if (d > bestD) {
          bestD = d;
          best = [all[i], all[j]];
        }
      }
    [start, end] = start ? [start, best[0] === start ? best[1] : best[0]] : end ? [best[0] === end ? best[1] : best[0], end] : best;
  }
  const a = start;
  const b = end;
  const total = metres(a, b);
  if (total < MERGE_METRES || total > MAX_ZONE_METRES) return null;
  const middle = devices
    .map((p) => ({ p, t: along(a, b, p) }))
    .filter((x) => x.t > 0 && x.t < 1)
    .sort((x, y) => x.t - y.t)
    .map((x) => x.p);
  const path: LatLng[] = [];
  for (const p of [a, ...middle, b]) {
    if (path.length && metres(path[path.length - 1], p) < MERGE_METRES) continue;
    path.push({ lat: Math.round(p.lat * 1e5) / 1e5, lng: Math.round(p.lng * 1e5) / 1e5 });
  }
  return path.length >= 2 ? path : null;
}
