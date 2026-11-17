import { CLUSTER_SPAN, DRIVE_LINE_SPAN, MAX_PER_KIND, nearestPoints, placesForView, regionKey } from '../src/lib/mapPlaces';
import { bundledSpots } from '../src/lib/placeStore';
import type { Spot } from '../src/lib/types';

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
