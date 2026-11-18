import { DEFAULT_FILTER, describeFilter, hostLeftOut, inviteRows } from '../src/lib/invites';
import type { Build } from '../src/lib/types';

describe('describeFilter', () => {
  it('never says "everyone welcome" next to a radius', () => {
    expect(describeFilter({ ...DEFAULT_FILTER, everyone: true, radiusMiles: 100 })).toBe('Anyone within 100 mi');
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

describe('inviteRows (Review 14 decision 1: who can come apart from who we tell)', () => {
  it('open: Everyone can come; the radius is only who we tell', () => {
    expect(inviteRows({ ...DEFAULT_FILTER, everyone: true, radiusMiles: 25 }, '18')).toEqual({ come: 'Everyone', tell: 'drivers within 25 mi · about 18 people' });
    expect(inviteRows({ ...DEFAULT_FILTER, everyone: true, radiusMiles: 25 }, '1').tell).toBe('drivers within 25 mi · about 1 person');
    expect(inviteRows({ ...DEFAULT_FILTER, everyone: true, radiusMiles: 10 }, 'fewer than 3').tell).toBe('drivers within 10 mi · fewer than 3 people');
    // The posted meet (Review 15 decision 1): the same two rows, no count.
    expect(inviteRows({ ...DEFAULT_FILTER, everyone: true, radiusMiles: 25 })).toEqual({ come: 'Everyone', tell: 'drivers within 25 mi' });
    expect(inviteRows({ ...DEFAULT_FILTER, everyone: false, cars: false, bikes: true, classes: [], minMods: 0, brands: [], radiusMiles: 10 }).tell).toBe('matching drivers within 10 mi');
  });
  it('limited: the limits, never the radius, say who can come', () => {
    const r = inviteRows({ ...DEFAULT_FILTER, everyone: false, cars: false, bikes: true, classes: [], minMods: 0, brands: [], radiusMiles: 10 }, '7');
    expect(r).toEqual({ come: 'Bikes', tell: 'matching drivers within 10 mi · 7 people' });
    expect(r.come).not.toMatch(/mi\b/);
  });
});
