import { BUNDLED_IDS, bundledSpots, isBundled, joinSpots, setProgress, splitSavedSpots, withZones } from '../src/lib/placeStore';
import { placeSpots, PLACES } from '../src/data/places';
import type { BanZone, Spot } from '../src/lib/types';

const ZONE: BanZone = { id: 'z', name: 'Test zone', centre: { lat: 53.4, lng: -1.8 }, radiusMiles: 50, note: 'x' };

function mine(id: string): Spot {
  return { id, kind: 'photo', name: 'Mine', at: { lat: 53.4, lng: -1.8 }, description: '', authorId: 'me', status: 'approved', createdAt: '', completions: [], ratings: [] };
}

describe('bundled places are read from the bundle, not the save', () => {
  test('built once per launch, one per bundled place', () => {
    expect(bundledSpots()).toBe(bundledSpots());
    expect(bundledSpots()).toHaveLength(PLACES.length);
    expect(isBundled(PLACES[0].id)).toBe(true);
    expect(isBundled('sp-mine')).toBe(false);
  });

  test('progress joins onto the bundled place; places without progress are the same objects', () => {
    const base = bundledSpots();
    const id = base[3].id;
    const joined = joinSpots(base, { [id]: { completions: [{ userId: 'me', on: '2026-11-17' }], ratings: [] } }, [mine('sp-1')]);
    expect(joined).toHaveLength(base.length + 1);
    expect(joined[3].completions).toHaveLength(1);
    expect(joined[3]).not.toBe(base[3]);
    expect(joined[4]).toBe(base[4]);
    expect(joined[joined.length - 1].id).toBe('sp-1');
  });

  test('setProgress keeps only places with something in them', () => {
    const s = { ...bundledSpots()[0], completions: [{ userId: 'me', on: '2026-11-17' }] };
    const p = setProgress({}, s);
    expect(Object.keys(p)).toEqual([s.id]);
    expect(setProgress(p, { ...s, completions: [] })).toEqual({});
  });

  test('ban zones are worked out when read: all of them, the smallest first, and stale tags go', () => {
    const small: BanZone = { ...ZONE, id: 'small', name: 'Small', radiusMiles: 2 };
    const s = withZones({ ...mine('x'), banZone: 'Old name' }, [ZONE, small]);
    expect(s.banZone).toBe('Small');
    expect(s.banZoneIds).toEqual(['small', 'z']);
    const out = withZones({ ...mine('x'), banZone: 'Old name', at: { lat: 50, lng: 0 } }, [ZONE]);
    expect(out.banZone).toBeUndefined();
    expect(out.banZoneIds).toBeUndefined();
  });
});

describe('migrating an old save (every bundled place copied in)', () => {
  test('keeps progress and your own places, drops the copies', () => {
    const copies = placeSpots('2026-01-01T00:00:00.000Z');
    const done = { ...copies[5], completions: [{ userId: 'me', on: '2026-11-01', photo: 'a.jpg' }], ratings: [{ userId: 'me', stars: 4 }] };
    const retiredVisited: Spot = { ...copies[0], id: 'kt-retired', completions: [{ userId: 'me', on: '2026-10-01' }] };
    const retiredUntouched: Spot = { ...copies[0], id: 'kt-gone' };
    const saved = [...copies.map((x) => (x.id === done.id ? done : x)), mine('sp-1'), retiredVisited, retiredUntouched];
    const { own, progress } = splitSavedSpots(saved, 'me');
    expect(own.map((x) => x.id)).toEqual(['sp-1', 'kt-retired']);
    expect(Object.keys(progress)).toEqual([done.id]);
    expect(progress[done.id].completions[0].photo).toBe('a.jpg');
    expect(progress[done.id].ratings).toHaveLength(1);
    // The rest is read from the bundle again, so the save is tiny.
    expect(JSON.stringify({ own, progress }).length).toBeLessThan(2_000);
    expect(BUNDLED_IDS.has(done.id)).toBe(true);
  });
});
