import { DEFAULT_FILTER, describeFilter, hostLeftOut } from '../src/lib/invites';
import type { Build } from '../src/lib/types';

describe('describeFilter', () => {
  it('never says "everyone welcome" next to a radius', () => {
    expect(describeFilter({ ...DEFAULT_FILTER, everyone: true, radiusMiles: 100 })).toBe('Public · anyone within 100 mi');
  });
  it('lists the build filters in plain words, with "and"', () => {
    expect(describeFilter({ ...DEFAULT_FILTER, everyone: false, cars: true, bikes: true, classes: ['A', 'S'], minMods: 3, brands: [], radiusMiles: 25 })).toBe(
      'Cars and bikes · Class A–S · 3+ mods · within 25 mi',
    );
    expect(describeFilter({ ...DEFAULT_FILTER, everyone: false, cars: false, bikes: true, classes: [], minMods: 0, brands: [], radiusMiles: 10 })).toBe('Bikes · within 10 mi');
  });
});

describe('hostLeftOut (B4)', () => {
  const golf: Build = {
    id: 'g', ownerId: 'me', kind: 'car', make: 'Volkswagen', model: 'Golf R', stockBhp: 300, weightKg: 1500, photos: [],
    mods: [1, 2, 3].map((i) => ({ id: `m${i}`, category: 'engine', name: `Mod ${i}` })),
  };
  test('warns when none of your builds fits, never when one does or you have none', () => {
    expect(hostLeftOut({ ...DEFAULT_FILTER, cars: false }, [golf])).toBe(true);
    expect(hostLeftOut({ ...DEFAULT_FILTER, brands: ['Honda'] }, [golf])).toBe(true);
    expect(hostLeftOut(DEFAULT_FILTER, [golf])).toBe(false);
    expect(hostLeftOut({ ...DEFAULT_FILTER, cars: false, everyone: true }, [golf])).toBe(false);
    expect(hostLeftOut({ ...DEFAULT_FILTER, cars: false }, [])).toBe(false);
  });
});
