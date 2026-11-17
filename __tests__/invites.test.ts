import { DEFAULT_FILTER, describeFilter } from '../src/lib/invites';

describe('describeFilter', () => {
  it('never says "everyone welcome" next to a radius', () => {
    expect(describeFilter({ ...DEFAULT_FILTER, everyone: true, radiusMiles: 100 })).toBe('Public · anyone within 100 mi');
  });
  it('lists the build filters in plain words, with "and"', () => {
    expect(describeFilter({ ...DEFAULT_FILTER, everyone: false, cars: true, bikes: true, classes: ['A', 'S'], minMods: 3, brands: [], radiusMiles: 25 })).toBe(
      'Cars and bikes · Class S/A · 3+ mods · within 25 mi',
    );
    expect(describeFilter({ ...DEFAULT_FILTER, everyone: false, cars: false, bikes: true, classes: [], minMods: 0, brands: [], radiusMiles: 10 })).toBe('Bikes · within 10 mi');
  });
});
