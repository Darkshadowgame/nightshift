import { areaGivesAway, areaRadiusFor, eventArea, MIN_AREA_RADIUS_MILES, roughArea } from '../src/lib/area';
import { milesBetween } from '../src/lib/geo';
import { isPublicType } from '../src/lib/events';
import { nearestRegion } from '../src/lib/profile';
import { seed } from '../src/data/seed';
import type { LatLng } from '../src/lib/types';

const VENTURA: LatLng = { lat: 52.6205, lng: -1.7265 };

/** Repeatable pseudo-random points around the Midlands. */
function rng(seedN: number) {
  let x = seedN;
  return () => ((x = (x * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
}

function check(stops: LatLng[], key: string) {
  const area = roughArea(stops, key);
  for (const s of stops) expect(milesBetween(area, s)).toBeGreaterThanOrEqual(0.75);
  const r = areaRadiusFor(area, stops);
  expect(r).toBeGreaterThanOrEqual(MIN_AREA_RADIUS_MILES);
  for (const s of stops) expect(milesBetween(area, s)).toBeLessThan(r);
  return area;
}

describe('rough area', () => {
  test('a one-spot meet: the area is not the spot, and the circle still contains it', () => {
    const area = check([VENTURA], 'ev-x');
    const d = milesBetween(area, VENTURA);
    expect(d).toBeGreaterThanOrEqual(1);
    expect(d).toBeLessThan(4);
  });

  test('never within 0.75 mi of any stop, for many random events', () => {
    const r = rng(42);
    for (let i = 0; i < 400; i++) {
      const n = 1 + Math.floor(r() * 5);
      const base = { lat: 52 + r(), lng: -2.2 + r() * 1.2 };
      const spread = r() * 0.3;
      const stops = Array.from({ length: n }, () => ({ lat: base.lat + (r() - 0.5) * spread, lng: base.lng + (r() - 0.5) * spread }));
      check(stops, `ev-${i}`);
    }
  });

  test('same stops and id give the same area; a tiny move usually keeps it', () => {
    expect(roughArea([VENTURA], 'a')).toEqual(roughArea([VENTURA], 'a'));
    expect(roughArea([VENTURA], 'a')).not.toEqual(roughArea([VENTURA], 'b'));
  });

  test('public events (shows, track days) just use the venue', () => {
    expect(eventArea([VENTURA], 'x', true).area).toEqual(VENTURA);
  });

  test('every seeded private event has a fuzzed area that contains its stops', () => {
    for (const e of seed(new Date('2026-11-17T21:00:00Z')).events) {
      if (isPublicType(e.type)) continue;
      expect(areaGivesAway(e)).toBe(false);
      const stops = e.stops.flatMap((s) => (s.at ? [s.at] : []));
      for (const s of stops) {
        expect(milesBetween(e.area, s)).toBeGreaterThanOrEqual(0.75);
        expect(milesBetween(e.area, s)).toBeLessThan(e.areaRadiusMiles!);
      }
    }
  });

  test('the old leak is caught', () => {
    expect(areaGivesAway({ area: { lat: 52.62, lng: -1.72 }, stops: [{ id: 's', name: 'Ventura', at: VENTURA }] } as never)).toBe(true);
  });

  test('area names default to the nearest region', () => {
    expect(nearestRegion({ lat: 52.63, lng: -1.69 })).toBe('Midlands');
    expect(nearestRegion({ lat: 53.4, lng: -2.3 })).toBe('North West');
  });
});
