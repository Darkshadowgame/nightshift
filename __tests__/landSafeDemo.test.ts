import { busyScene } from '../src/data/busyNight';
import { seed } from '../src/data/seed';
import { LAND_ANCHORS } from '../src/lib/landSafe';
import { PLACES } from '../src/data/places';
import { milesBetween } from '../src/lib/geo';
import type { LatLng } from '../src/lib/types';

const NOW = new Date('2026-11-20T21:10:00');
const key = (p: LatLng) => `${p.lat},${p.lng}`;
const land = new Set(LAND_ANCHORS.map(key));
// Cruises follow a real drive's own road line, which is land by construction.
const roadPoints = new Set(PLACES.filter((p) => p.kind === 'drive').flatMap((p) => (p.path ?? [p.at]).map(key)));

// Bundled coastal places used as the user's home: the demo must never put a meet in the sea round any of them.
const COASTAL = ['Brighton', 'Blackpool', 'Whitby', 'Newquay', 'Aberystwyth', 'Southend-on-Sea'];
const origins = COASTAL.map((n) => {
  const hit = (require('../src/data/towns') as typeof import('../src/data/towns')).TOWNS.find((t) => t.name === n);
  return hit ? { name: n, at: hit.at } : null;
}).filter((x): x is { name: string; at: LatLng } => !!x);

describe('demo meets are land-safe on the coast', () => {
  it('has several coastal origins to test with', () => {
    expect(origins.length).toBeGreaterThanOrEqual(4);
  });

  it.each(origins.map((o) => [o.name, o.at] as const))('every demo meet stop round %s is on a bundled land place or a bundled drive road', (_n, home) => {
    const base = seed(NOW, { home, names: {} });
    const busy = busyScene(NOW, home, base.users, base.builds);
    const stops = [...base.events, ...busy.events].flatMap((e) => e.stops.flatMap((s) => (s.at ? [s.at] : [])));
    expect(stops.length).toBeGreaterThan(20);
    for (const at of stops) expect(land.has(key(at)) || roadPoints.has(key(at))).toBe(true);
    // And they're near the user, not flung across the country.
    expect(stops.filter((at) => milesBetween(at, home) <= 60).length).toBeGreaterThan(stops.length * 0.5);
  });
});
