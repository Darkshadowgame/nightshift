import { CIRCUIT_OUTLINES } from '../src/data/circuits';
import { PLACES } from '../src/data/places';
import { TRACK_INFO } from '../src/data/trackInfo';
import { recordMs } from '../src/lib/laptimes';
import { inUk } from '../src/lib/placeNames';
import { metresBetween } from '../src/lib/polyline';
import { formatLength, matchesVehicles, trackOutline, trackVehicles } from '../src/lib/tracks';

const tracks = PLACES.filter((p) => p.kind === 'track');

describe('bundled track details', () => {
  test('every entry is a bundled track, with sane layouts and sourced records', () => {
    for (const [id, info] of Object.entries(TRACK_INFO)) {
      expect(tracks.some((t) => t.id === id)).toBe(true);
      for (const l of info.layouts) expect(l.km).toBeGreaterThan(0.3);
      const names = info.layouts.map((l) => l.name);
      for (const r of info.records) {
        expect(info.source).toMatch(/^https:\/\//);
        if (names.length) expect(names).toContain(r.layout);
        expect(recordMs(r.time)).toBeGreaterThan(10_000);
        expect(r.year).toBeGreaterThan(1900);
        expect(r.year).toBeLessThanOrEqual(2026);
      }
    }
  });

  test('what runs where (cars and bikes; kart circuits were taken out)', () => {
    const byId = (id: string) => tracks.find((t) => t.id === id)!;
    expect(trackVehicles(byId('tr-silverstone'))).toEqual(['car', 'bike']);
    expect(trackVehicles(byId('tr-brands-hatch'))).toEqual(['car', 'bike']);
    expect(trackVehicles(byId('tr-shelsley'))).toEqual(['car']);
    expect(trackVehicles(byId('tr-teesside'))).toEqual(['car', 'bike']);
    expect(matchesVehicles(byId('tr-shelsley'), ['bike'])).toBe(false);
    expect(matchesVehicles(byId('tr-silverstone'), ['bike'])).toBe(true);
  });

  test('no kart circuits on the map', () => {
    for (const t of tracks) expect(trackVehicles(t).every((v) => v === 'car' || v === 'bike')).toBe(true);
    for (const id of ['k-t-buckmore', 'kt-whilton-mill', 'ea-t-ellough', 'sws-t-clay-pigeon', 'sni-t-nutts-corner']) {
      expect(tracks.some((t) => t.id === id)).toBe(false);
      expect(TRACK_INFO[id]).toBeUndefined();
    }
  });

  test('lengths read well', () => {
    expect(formatLength(3.916)).toBe('3.916 km (2.43 mi)');
    expect(formatLength(5.9)).toBe('5.9 km (3.67 mi)');
  });
});

describe('circuit outlines from OpenStreetMap', () => {
  const ids = Object.keys(CIRCUIT_OUTLINES);

  test('most circuits have one, each at its venue and in the UK', () => {
    expect(ids.length).toBeGreaterThanOrEqual(20);
    for (const id of ids) {
      const t = tracks.find((x) => x.id === id);
      expect(t).toBeDefined();
      const o = trackOutline(id)!;
      expect(o.path.length).toBeGreaterThanOrEqual(o.closed ? 4 : 2);
      for (const p of o.path) expect(inUk(p)).toBe(true);
      const nearest = Math.min(...o.path.map((p) => metresBetween(p, t!.at)));
      expect(nearest).toBeLessThan(2500);
    }
  });

  test('loops close, and where a layout matches it is within 6% of the published length', () => {
    for (const id of ids) {
      const o = trackOutline(id)!;
      if (o.closed) expect(o.path[0]).toEqual(o.path[o.path.length - 1]);
      if (o.layout) expect(Math.abs(o.layout.km * 1000 - o.metres) / (o.layout.km * 1000)).toBeLessThanOrEqual(0.06);
    }
    for (const id of ['tr-silverstone', 'tr-brands-hatch', 'tr-snetterton']) expect(trackOutline(id)?.closed).toBe(true);
  });
});

describe('photo spots are car and bike photo locations', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { photoEvidence, UNVETTED_PHOTO_SPOTS } = require('../src/data/photoVetting') as typeof import('../src/data/photoVetting');
  test('evidence from a car or bike source, the description, or the known list; car parks alone are not evidence', () => {
    const base = { id: 'x', warnings: [] as string[], sources: ['OpenStreetMap (ODbL)'] };
    expect(photoEvidence({ ...base, description: 'National Trust car park with a view.' })).toBeNull();
    expect(photoEvidence({ ...base, description: 'Cable car and dockside views.' })).toBeNull();
    expect(photoEvidence({ ...base, description: 'Rolling shots of cars with Big Ben behind.' })?.kind).toBe('description');
    expect(photoEvidence({ ...base, description: 'A view.', sources: ['https://www.bestbikingroads.com/x'] })?.kind).toBe('source');
    expect(photoEvidence({ ...base, id: 'ph-hartside', description: 'Viewpoint and café.' })?.kind).toBe('known');
  });
  test('scenic-only bundled spots are hidden, vetted ones stay', () => {
    expect(UNVETTED_PHOTO_SPOTS.has('ph-hartside')).toBe(false);
    expect(UNVETTED_PHOTO_SPOTS.has('l-p-westminster-bridge')).toBe(false);
    expect(UNVETTED_PHOTO_SPOTS.has('ea-p-saxtead')).toBe(false);
    expect(UNVETTED_PHOTO_SPOTS.size).toBeGreaterThan(0);
  });
});
