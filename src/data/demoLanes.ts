import { metresBetween, type RawRouteLike } from '../lib/nav';
import type { LatLng } from '../lib/types';

/**
 * Junctions on the demo night's baked roads (demoRoads.ts) with their real lane markings, so the
 * web preview's driving view shows lane guidance without asking OpenStreetMap live. The `turnLanes`
 * values are the `turn:lanes` tags of the approach roads, read once from OpenStreetMap on
 * 18 Nov 2026 (© OpenStreetMap contributors, ODbL). The baked roads have no turn instructions of
 * their own, so each junction also brings its step.
 */
export interface DemoJunction {
  at: LatLng;
  /** Apple-style instruction for the step. */
  text: string;
  /** The approach road's `turn:lanes` for your direction (null: none tagged). */
  turnLanes: string | null;
}

export const DEMO_JUNCTIONS: DemoJunction[] = [
  // Marlborough Way (B5440) into the junction south of Ventura Park: left-or-straight, and a right-turn lane.
  { at: { lat: 52.62065, lng: -1.6708 }, text: 'Turn right', turnLanes: 'left;through|right' },
  // Tamworth Interchange (A5): a big roundabout, signed by exit.
  { at: { lat: 52.60377, lng: -1.64304 }, text: 'At the roundabout, take the 3rd exit', turnLanes: 'left|through|through|through' },
  // Dunton Island (M42 junction 9).
  { at: { lat: 52.53817, lng: -1.72469 }, text: 'At the roundabout, take the 2nd exit', turnLanes: 'through|through|right|right|right' },
];

/** A junction counts as on a route within this of one of its points (m). */
const ON_ROUTE_M = 30;

/**
 * The demo route with the junctions it passes put in as steps (in order along the route, so
 * buildRoute() reads them). Routes that pass none come back unchanged.
 */
export function withDemoJunctions(raw: RawRouteLike, junctions: DemoJunction[] = DEMO_JUNCTIONS): RawRouteLike {
  const added: RawRouteLike['steps'] = [];
  for (const j of junctions) {
    let best = -1;
    let bestD = Infinity;
    for (let i = 0; i + 1 < raw.coords.length; i += 2) {
      const d = metresBetween(j.at, { lat: raw.coords[i], lng: raw.coords[i + 1] });
      if (d < bestD) {
        bestD = d;
        best = i / 2;
      }
    }
    if (best < 1 || bestD > ON_ROUTE_M) continue;
    const leg = raw.legs.findIndex((l) => l.endIndex >= best);
    added.push({ text: j.text, distance: 0, lat: j.at.lat, lng: j.at.lng, index: best, leg: Math.max(0, leg) });
  }
  if (added.length === 0) return raw;
  return { ...raw, steps: [...raw.steps, ...added].sort((a, b) => a.index - b.index) };
}

/** The baked junction at a step, if it's one of them. */
export function demoJunctionAt(at: LatLng): DemoJunction | null {
  return DEMO_JUNCTIONS.find((j) => metresBetween(j.at, at) <= 5) ?? null;
}
