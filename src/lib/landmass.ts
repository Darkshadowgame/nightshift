import type { LatLng } from './types';

/**
 * Which piece of land a point is on, so the map never groups places across
 * the sea (Belfast with Stranraer, Ryde with Portsmouth). Rough outlines,
 * drawn by hand to sit in the water between each island and the mainland:
 * good to a few hundred metres at the narrow straits, which is plenty for
 * grouping pins. Anything not on a listed island is "gb" (Great Britain,
 * with the islands joined to it by a bridge or causeway, such as Anglesey).
 *
 * Skye has a bridge, but it's listed: from far out, a group straddling the
 * Inner Sound would sit in the water.
 */
export type Landmass =
  | 'gb'
  | 'northern-ireland'
  | 'isle-of-man'
  | 'isle-of-wight'
  | 'skye'
  | 'outer-hebrides'
  | 'orkney'
  | 'shetland'
  | 'scilly'
  | 'channel-islands';

/** [lat, lng] rings. */
const OUTLINES: [Exclude<Landmass, 'gb'>, [number, number][]][] = [
  [
    'northern-ireland',
    // The North Channel runs between Kintyre / the Rhins of Galloway and the Antrim and Down coasts.
    [[55.42, -7.6], [55.42, -6.45], [55.0, -5.62], [54.6, -5.36], [54.2, -5.6], [53.95, -6.1], [54.0, -7.2], [54.2, -8.3], [54.7, -8.2], [55.2, -7.7]],
  ],
  ['isle-of-man', [[54.45, -4.85], [54.45, -4.25], [54.0, -4.25], [54.0, -4.85]]],
  [
    'isle-of-wight',
    // Through the Solent: Lymington, Southampton Water and Portsmouth stay on the mainland.
    [[50.716, -1.6], [50.771, -1.3], [50.733, -1.07], [50.66, -1.04], [50.56, -1.3], [50.65, -1.6]],
  ],
  [
    'skye',
    // Through the Inner Sound and Kyle Rhea: Kyle of Lochalsh, Applecross and Glenelg stay on the mainland.
    [[57.75, -6.85], [57.75, -6.12], [57.45, -6.0], [57.33, -5.9], [57.285, -5.74], [57.25, -5.7], [57.15, -5.75], [57.0, -5.95], [57.1, -6.35], [57.35, -6.85]],
  ],
  ['outer-hebrides', [[58.6, -7.2], [58.6, -6.0], [57.9, -6.3], [57.1, -7.1], [56.75, -7.3], [56.75, -7.8], [57.6, -7.8], [58.3, -7.2]]],
  ['orkney', [[59.45, -3.5], [59.45, -2.3], [58.95, -2.3], [58.7, -2.8], [58.7, -3.45]]],
  ['shetland', [[60.95, -1.9], [60.95, -0.6], [59.8, -1.0], [59.8, -1.5]]],
  ['scilly', [[50.02, -6.5], [50.02, -6.2], [49.85, -6.2], [49.85, -6.5]]],
  ['channel-islands', [[49.8, -2.8], [49.8, -1.95], [49.15, -1.95], [49.15, -2.8]]],
];

function inside(p: LatLng, ring: [number, number][]): boolean {
  let hit = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [yi, xi] = ring[i];
    const [yj, xj] = ring[j];
    if (yi > p.lat !== yj > p.lat && p.lng < ((xj - xi) * (p.lat - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}

/** The island (or mainland) a point is on. */
export function landmassOf(p: LatLng): Landmass {
  for (const [name, ring] of OUTLINES) if (inside(p, ring)) return name;
  return 'gb';
}
