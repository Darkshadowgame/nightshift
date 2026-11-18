import { CLUSTER_SPAN, DRIVE_LINE_SPAN, MAX_PER_KIND, MIXED_SPAN, maxClusterKm, medoid, inViewOnly, nearestPoints, placesForView, regionKey } from '../src/lib/mapPlaces';
import { landmassOf } from '../src/lib/landmass';
import { bundledSpots } from '../src/lib/placeStore';
import type { LatLng, Spot } from '../src/lib/types';

const TAMWORTH = { lat: 52.63, lng: -1.69 };

function spot(id: string, kind: Spot['kind'], lat: number, lng: number, path = false): Spot {
  return {
    id, kind, name: id, at: { lat, lng }, description: '', status: 'approved', createdAt: '', completions: [], ratings: [],
    ...(path ? { path: [{ lat, lng }, { lat: lat + 0.01, lng }] } : {}),
  };
}

describe('places drawn for the view', () => {
  const all = bundledSpots();

  test('zoomed right out over the UK: a handful of count pins, not every place', () => {
    const v = placesForView(all, { lat: 54.5, lng: -3 }, 9);
    const markers = v.places.length + v.clusters.length;
    expect(markers).toBeLessThan(80);
    expect(markers).toBeGreaterThan(5);
    // Every place is still counted somewhere.
    expect(v.places.length + v.clusters.reduce((n, c) => n + c.count, 0)).toBe(all.length);
    expect(v.lines).toEqual([]);
    for (const c of v.clusters) expect(c.count).toBeGreaterThan(1);
  });

  test('zoomed in: only places near the view, capped per kind, no groups', () => {
    const v = placesForView(all, TAMWORTH, 0.5);
    expect(v.clusters).toEqual([]);
    expect(v.places.length).toBeLessThan(all.length / 4);
    for (const s of v.places) expect(Math.abs(s.at.lat - TAMWORTH.lat)).toBeLessThan(0.5);
    // Drives near the view get their line.
    for (const s of v.lines) expect(s.kind).toBe('drive');
  });

  test('more than the cap of one kind keeps the nearest', () => {
    const many = Array.from({ length: MAX_PER_KIND + 10 }, (_, i) => spot(`p${i}`, 'photo', 52.6 + i * 0.001, -1.7));
    const v = placesForView(many, { lat: 52.6, lng: -1.7 }, 0.3);
    expect(v.places).toHaveLength(MAX_PER_KIND);
    expect(v.places.map((s) => s.id)).toContain('p0');
    expect(v.places.map((s) => s.id)).not.toContain(`p${MAX_PER_KIND + 9}`);
  });

  test('the selected place always shows, with its line, even when it would be grouped', () => {
    const list = [spot('a', 'drive', 52.6, -1.7, true), spot('b', 'drive', 52.61, -1.71, true), spot('c', 'drive', 52.62, -1.7, true)];
    const v = placesForView(list, { lat: 52.6, lng: -1.7 }, CLUSTER_SPAN * 3, 'b');
    expect(v.places.map((s) => s.id)).toEqual(['b']);
    expect(v.clusters).toHaveLength(1);
    expect(v.clusters[0].count).toBe(2);
    expect(v.lines.map((s) => s.id)).toEqual(['b']);
    expect(placesForView(list, { lat: 52.6, lng: -1.7 }, DRIVE_LINE_SPAN).lines).toHaveLength(3);
  });

  test('group pins keep their id for the same cell, so the marker is reused', () => {
    const a = placesForView(all, { lat: 54.5, lng: -3 }, 9).clusters.map((c) => c.id);
    const b = placesForView(all, { lat: 54.5, lng: -3 }, 9).clusters.map((c) => c.id);
    expect(a).toEqual(b);
  });

  test('small pans snap to the same region key; zooming changes it', () => {
    const k = regionKey(TAMWORTH, 0.5).key;
    expect(regionKey({ lat: TAMWORTH.lat + 0.01, lng: TAMWORTH.lng - 0.01 }, 0.52).key).toBe(k);
    expect(regionKey(TAMWORTH, 1.2).key).not.toBe(k);
  });

  test('"Near me" fits the nearest points, not the whole country', () => {
    const pts = all.map((s) => s.at);
    const near = nearestPoints(pts, TAMWORTH, 60);
    expect(near).toHaveLength(60);
    for (const p of near) expect(Math.abs(p.lat - TAMWORTH.lat)).toBeLessThan(2);
  });
});

describe('groups stay on land (medoid, landmass, radius cap)', () => {
  const all = bundledSpots();
  const UK = { lat: 54.5, lng: -3 };
  const SPANS = [1.2, 2, 3.5, 6, 9, 14, 24, 40];

  test('the Thames estuary: Norfolk and Kent drives never group onto the water', () => {
    const list = [
      spot('norwich', 'drive', 52.63, 1.3), spot('cromer', 'drive', 52.93, 1.3), spot('kings-lynn', 'drive', 52.75, 0.4),
      spot('canterbury', 'drive', 51.28, 1.08), spot('dover', 'drive', 51.13, 1.31), spot('margate', 'drive', 51.38, 1.38), spot('maidstone', 'drive', 51.27, 0.52),
    ];
    const atOf = new Set(list.map((s) => `${s.at.lat},${s.at.lng}`));
    for (const span of SPANS) {
      for (const c of placesForView(list, { lat: 52, lng: 0.9 }, span).clusters) {
        expect(atOf.has(`${c.at.lat},${c.at.lng}`)).toBe(true);
        // Not in the estuary between Southend, Sheppey and the open sea.
        expect(c.at.lat > 51.42 && c.at.lat < 51.56 && c.at.lng > 0.7 && c.at.lng < 1.2).toBe(false);
        // Never one group from the Wash to Dover (about 190 km).
        expect(c.count).toBeLessThan(list.length);
      }
    }
  });

  test('Belfast and Stranraer never group, at any zoom', () => {
    const list = [spot('belfast', 'photo', 54.597, -5.93), spot('stranraer', 'photo', 54.903, -5.024)];
    expect(landmassOf(list[0].at)).toBe('northern-ireland');
    expect(landmassOf(list[1].at)).toBe('gb');
    for (const span of SPANS) {
      const v = placesForView(list, { lat: 54.7, lng: -5.5 }, span);
      expect(v.clusters).toEqual([]);
      expect(v.places).toHaveLength(2);
    }
  });

  test('the islands stay apart from the mainland across the narrow straits', () => {
    const pairs: [LatLng, LatLng, string][] = [
      [{ lat: 50.73, lng: -1.16 }, { lat: 50.79, lng: -1.09 }, 'isle-of-wight'], // Ryde, Portsmouth
      [{ lat: 50.69, lng: -1.53 }, { lat: 50.758, lng: -1.545 }, 'isle-of-wight'], // Yarmouth IoW, Lymington
      [{ lat: 57.413, lng: -6.195 }, { lat: 57.4327, lng: -5.8158 }, 'skye'], // Portree, Applecross
      [{ lat: 54.15, lng: -4.48 }, { lat: 54.49, lng: -3.6 }, 'isle-of-man'], // Douglas, St Bees
      [{ lat: 54.457, lng: -5.475 }, { lat: 54.84, lng: -5.12 }, 'northern-ireland'], // Kirkistown, Portpatrick
      [{ lat: 55.2, lng: -6.24 }, { lat: 55.29, lng: -5.8 }, 'northern-ireland'], // Ballycastle, Mull of Kintyre
    ];
    for (const [island, mainland, name] of pairs) {
      expect(landmassOf(island)).toBe(name);
      expect(landmassOf(mainland)).toBe('gb');
    }
    // A few mainland places that sit near an outline.
    for (const p of [{ lat: 57.28, lng: -5.71 }, { lat: 57.21, lng: -5.62 }, { lat: 50.9, lng: -1.4 }, { lat: 53.23, lng: -4.13 }]) expect(landmassOf(p)).toBe('gb');
  });

  test('every group pin sits on one of its own places, inside the radius cap', () => {
    for (const span of SPANS) {
      const v = placesForView(all, UK, span);
      for (const c of v.clusters) {
        const members = all.filter((s) => (c.mixed || s.kind === c.kind) && s.at.lat === c.at.lat && s.at.lng === c.at.lng);
        expect(members.length).toBeGreaterThan(0);
        expect(c.zoomSpan).toBeLessThan(span);
      }
      // Every place still counted exactly once.
      const inView = v.places.length + v.clusters.reduce((n, c) => n + c.count, 0);
      if (span >= 9) expect(inView).toBe(all.length);
    }
  });

  test('zoomed far out: per-island counts add up, nothing merges across the sea', () => {
    for (const span of [9, 14, 24, 40]) {
      const v = placesForView(all, UK, span);
      for (const land of ['northern-ireland', 'isle-of-wight', 'skye'] as const) {
        const expected = all.filter((s) => landmassOf(s.at) === land).length;
        const shown =
          v.places.filter((s) => landmassOf(s.at) === land).length +
          v.clusters.filter((c) => landmassOf(c.at) === land).reduce((n, c) => n + c.count, 0);
        expect(shown).toBe(expected);
      }
      // A readable number of markers for the whole UK: regional counts of every kind together, not hundreds of pins.
      expect(v.places.length + v.clusters.length).toBeLessThan(45);
    }
  });

  test('zoomed far out, kinds share one count; closer in, each kind keeps its own', () => {
    const far = placesForView(all, UK, MIXED_SPAN * 3);
    expect(far.clusters.some((c) => c.mixed)).toBe(true);
    const near = placesForView(all, { lat: 52.6, lng: -1.7 }, MIXED_SPAN);
    expect(near.clusters.every((c) => !c.mixed)).toBe(true);
  });

  test('medoid: the member nearest the centre, not the centre', () => {
    const list = [spot('a', 'drive', 52.63, 1.3), spot('b', 'drive', 51.28, 1.08), spot('c', 'drive', 52.0, 1.1)];
    expect(medoid(list).id).toBe('c');
    expect(maxClusterKm(0.5)).toBeCloseTo(13.875);
    expect(maxClusterKm(100)).toBe(120);
  });
});

describe('events culled to the view', () => {
  const ev = (id: string, ...at: LatLng[]) => ({ id, at });
  const points = (e: { at: LatLng[] }) => e.at;

  test('keeps what is in the view (with a margin) and drops the rest of the country', () => {
    const near = ev('near', { lat: 52.7, lng: -1.6 });
    // Just off the top of a 0.5° view, inside the margin.
    const edge = ev('edge', { lat: TAMWORTH.lat + 0.4, lng: TAMWORTH.lng });
    const far = ev('far', { lat: 57.1, lng: -2.1 });
    expect(inViewOnly([near, edge, far], points, TAMWORTH, 0.5).map((e) => e.id)).toEqual(['near', 'edge']);
  });

  test('a cruise stays if any stop on its route is in view', () => {
    const cruise = ev('cruise', { lat: 55, lng: -3 }, { lat: 52.64, lng: -1.7 });
    expect(inViewOnly([cruise], points, TAMWORTH, 0.3)).toHaveLength(1);
  });

  test('the selected one always stays; missing points are ignored', () => {
    const far = { id: 'far', at: [null, { lat: 57.1, lng: -2.1 }] as (LatLng | null)[] };
    expect(inViewOnly([far], (e) => e.at, TAMWORTH, 0.3)).toEqual([]);
    expect(inViewOnly([far], (e) => e.at, TAMWORTH, 0.3, (e) => e.id === 'far')).toEqual([far]);
  });

  test('zoomed right out over the UK: everything stays', () => {
    const all = [ev('a', { lat: 50.2, lng: -5.3 }), ev('b', { lat: 58.4, lng: -3.1 }), ev('c', { lat: 54.6, lng: -5.9 })];
    expect(inViewOnly(all, points, { lat: 54.5, lng: -3 }, 9)).toHaveLength(3);
  });
});
