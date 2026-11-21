import type { LatLng } from './types';
import { milesBetween } from './geo';
import { PLACES } from '../data/places';
import { TOWNS } from '../data/towns';

/**
 * Land-safe demo places. The sample scene is laid out as raw offsets round your home, which on
 * the coast puts meets in the sea. Instead each demo meet is snapped to a bundled real place on
 * land (a photo spot, venue, track or town centre, never a drive's start, which can be a layby on
 * a cliff road) near where the raw point fell.
 *
 * The sample scene's own home is hand-checked land, so there nothing moves.
 */
export const LAND_ANCHORS: readonly LatLng[] = [
  ...PLACES.filter((p) => p.kind !== 'drive').map((p) => p.at),
  ...TOWNS.map((t) => t.at),
];

const key = (p: LatLng) => `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`;

/**
 * A snapper for one scene. Calling it with the same raw point gives the same place; different
 * raw points get different places while any are left, so meets don't stack on one spot.
 */
export function landSnapper(sampleHome: boolean): (raw: LatLng) => LatLng {
  if (sampleHome) return (raw) => raw;
  const memo = new Map<string, LatLng>();
  const used = new Set<string>();
  return (raw) => {
    const hit = memo.get(key(raw));
    if (hit) return hit;
    const sorted = [...LAND_ANCHORS].sort((a, b) => milesBetween(a, raw) - milesBetween(b, raw));
    const pick = sorted.find((a) => !used.has(key(a))) ?? sorted[0];
    used.add(key(pick));
    memo.set(key(raw), pick);
    return pick;
  };
}
