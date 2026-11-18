import { bundledSpots } from '../src/lib/placeStore';
import { inZone } from '../src/lib/zones';
import { PLACES, placeSpots, SYSTEM_AUTHOR } from '../src/data/places';
import { BAN_ZONES } from '../src/data/seed';
import { milesBetween } from '../src/lib/geo';
import { inUk } from '../src/lib/placeNames';
import { longGap, MAX_POINT_GAP_MILES, pathMiles } from '../src/lib/spots';

describe('bundled UK places', () => {
  test('ids are unique and every place is in the UK', () => {
    expect(new Set(PLACES.map((p) => p.id)).size).toBe(PLACES.length);
    for (const p of PLACES) {
      expect(inUk(p.at)).toBe(true);
      for (const q of p.path ?? []) expect(inUk(q)).toBe(true);
      expect(p.sources.length).toBeGreaterThan(0);
      expect(p.name.length).toBeGreaterThan(0);
    }
  });

  test('nationwide, not just the Midlands', () => {
    const tracks = PLACES.filter((p) => p.kind === 'track');
    const drives = PLACES.filter((p) => p.kind === 'drive');
    expect(tracks.length).toBeGreaterThanOrEqual(25);
    expect(drives.length).toBeGreaterThanOrEqual(12);
    const lats = PLACES.map((p) => p.at.lat);
    expect(Math.max(...lats) - Math.min(...lats)).toBeGreaterThan(5);
    for (const name of ['Silverstone', 'Brands Hatch', 'Knockhill', 'Kirkistown', 'Shelsley Walsh']) {
      expect(tracks.some((t) => t.name.startsWith(name))).toBe(true);
    }
  });

  test('drives follow the road: points at most 1.5 mi apart, length close to the stated miles', () => {
    for (const d of PLACES.filter((p) => p.kind === 'drive')) {
      expect(d.path!.length).toBeGreaterThanOrEqual(3);
      expect(longGap(d.path!)).toBeNull();
      expect(MAX_POINT_GAP_MILES).toBe(1.5);
      expect(d.at).toEqual(d.path![0]);
      // The thinned line cuts a few corners, so it's a bit shorter than the road, never longer.
      const drawn = pathMiles(d.path!);
      expect(drawn).toBeLessThanOrEqual(d.miles! + 0.1);
      expect(drawn).toBeGreaterThan(d.miles! * 0.65);
    }
  });

  test('added by Nightshift, not by a person; tracks have no author', () => {
    const spots = placeSpots('2026-01-01T00:00:00.000Z');
    for (const s of spots) {
      if (s.kind === 'track' || s.kind === 'venue') expect(s.authorId).toBeUndefined();
      else expect(s.authorId).toBe(SYSTEM_AUTHOR);
      expect(s.status).toBe('approved');
      expect(s.completions).toEqual([]);
    }
  });

  test('places inside a ban zone carry the warning, worked out from the current zones', () => {
    const spots = bundledSpots();
    for (const s of spots) {
      const inside = BAN_ZONES.filter((z) => [s.at, ...(s.path ?? [])].some((p) => inZone(p, z)));
      expect(new Set(s.banZoneIds ?? [])).toEqual(new Set(inside.map((z) => z.id)));
      if (inside.length) expect(inside.map((z) => z.name)).toContain(s.banZone);
      else expect(s.banZone).toBeUndefined();
    }
    expect(spots.some((s) => s.banZone === 'Westminster and Kensington')).toBe(true);
  });

  test('closed venues and duplicates of the bundled tracks are left out', () => {
    expect(PLACES.some((p) => /rockingham/i.test(p.name))).toBe(false);
    expect(PLACES.filter((p) => /snetterton/i.test(p.name))).toHaveLength(1);
    expect(PLACES.filter((p) => p.kind === 'venue').length).toBeGreaterThan(10);
    const rykas = PLACES.find((p) => p.name.startsWith("Ryka's"))!;
    expect(rykas.warnings!.join(' ')).toMatch(/Outside the researched area/);
  });

  test('sample ban zones say they are samples', () => {
    for (const z of BAN_ZONES) expect(z.note).toMatch(/^Sample — check the current order\./);
  });
});

describe('splitWarnings (REVIEW-8: no internal data notes shown to people)', () => {
  const { splitWarnings, placeDescription, placeSpots } = require('../src/data/places');
  it('moves confidence and OSM notes to devNotes and keeps real warnings', () => {
    expect(splitWarnings(['Paid parking; opening times apply.', 'Medium confidence: car park position is an unnamed OSM car park near the tower. Check it before you go.'])).toEqual({
      warnings: ['Paid parking; opening times apply.'],
      devNotes: ['Medium confidence: car park position is an unnamed OSM car park near the tower. Check it before you go.'],
    });
  });
  it('splits a warning that mixes both', () => {
    const r = splitWarnings(['Unfenced moor roads, sheep and ponies; single-track sections. Car park position is an unnamed OSM car park south of the summit.']);
    expect(r.warnings).toEqual(['Unfenced moor roads, sheep and ponies; single-track sections.']);
    expect(r.devNotes).toHaveLength(1);
  });
  it('no bundled place shows a data note to people', () => {
    for (const s of placeSpots('2026-01-01T00:00:00Z')) {
      for (const w of s.warnings ?? []) expect(w).not.toMatch(/confidence|OSM|research/i);
      expect(s.description).not.toMatch(/Untimed: rep for finishing/);
    }
  });
  it('drops the repeated "Untimed" line from drive descriptions', () => {
    expect(placeDescription('A great road. Untimed: rep for finishing it within the limits.')).toBe('A great road.');
  });
});
