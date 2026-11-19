/**
 * The bundled photo spots, UK-wide (photo-spots sweep, Nov 2026): every one sourced, in the UK,
 * pinned once, tagged with its area and vehicles, and every nation and English region covered.
 * Spots inside a ban zone are kept but always flagged (owner: warn, never block).
 */
import { PLACES, UK_AREAS } from '../src/data/places';
import { places as SWEEP } from '../src/data/regions/photoSpots';
import { photoEvidence, UNVETTED_PHOTO_SPOTS } from '../src/data/photoVetting';
import { BAN_ZONES } from '../src/data/banZones';
import { bundledSpots } from '../src/lib/placeStore';
import { inZone } from '../src/lib/zones';
import { milesBetween } from '../src/lib/geo';
import { inUk } from '../src/lib/placeNames';

const PHOTOS = PLACES.filter((p) => p.kind === 'photo');
const METRES_PER_MILE = 1609.344;

/** Every nation and English region has at least this many photo spots on the map. */
const MIN_PER_AREA = 8;

describe('photo spots', () => {
  test('every one has a source, an area and the vehicles it suits, and is in the UK', () => {
    for (const p of PHOTOS) {
      expect(p.sources.length).toBeGreaterThan(0);
      expect(UK_AREAS).toContain(p.area);
      expect(p.vehicles?.length).toBeGreaterThan(0);
      for (const v of p.vehicles!) expect(['car', 'bike']).toContain(v);
      expect(inUk(p.at)).toBe(true);
    }
  });

  test('the sweep: a web source and an OpenStreetMap parking link each, and evidence of cars or bikes there', () => {
    expect(SWEEP.length).toBeGreaterThanOrEqual(150);
    for (const p of SWEEP) {
      expect(p.sources.some((s) => /^https:\/\//.test(s) && !/openstreetmap\.org/.test(s))).toBe(true);
      expect(p.sources.some((s) => /^https:\/\/www\.openstreetmap\.org\/(node|way|relation)\/\d+$/.test(s))).toBe(true);
      expect(photoEvidence(p)).not.toBeNull();
    }
  });

  test('no two photo spots within 200 m of each other', () => {
    const close: string[] = [];
    for (let i = 0; i < PHOTOS.length; i++)
      for (let j = i + 1; j < PHOTOS.length; j++)
        if (milesBetween(PHOTOS[i].at, PHOTOS[j].at) * METRES_PER_MILE < 200) close.push(`${PHOTOS[i].id} / ${PHOTOS[j].id}`);
    expect(close).toEqual([]);
  });

  test('every spot inside a ban zone is flagged, so the app warns there', () => {
    const spots = new Map(bundledSpots().map((s) => [s.id, s]));
    let inside = 0;
    for (const p of PHOTOS) {
      const zones = BAN_ZONES.filter((z) => inZone(p.at, z)).map((z) => z.id);
      const s = spots.get(p.id)!;
      if (zones.length) {
        inside++;
        expect(s.banZone).toBeTruthy();
        expect(s.banZoneIds).toEqual(expect.arrayContaining(zones));
      } else expect(s.banZone).toBeUndefined();
    }
    expect(inside).toBeGreaterThan(0);
  });

  test('bike-only spots say how: push it, engine off', () => {
    for (const p of PHOTOS.filter((x) => x.vehicles?.length === 1 && x.vehicles[0] === 'bike')) {
      expect((p.warnings ?? []).join(' ')).toMatch(/Bikes only/);
    }
  });

  test(`every nation and English region has at least ${MIN_PER_AREA} photo spots on the map`, () => {
    const shown = PHOTOS.filter((p) => !UNVETTED_PHOTO_SPOTS.has(p.id));
    const short = UK_AREAS.filter((a) => shown.filter((p) => p.area === a).length < MIN_PER_AREA);
    expect(short).toEqual([]);
  });
});
