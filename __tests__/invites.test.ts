import { DEFAULT_FILTER, describeFilter, hostLeftOut, inviteHeadline, inviteSummary } from '../src/lib/invites';
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

describe('inviteHeadline and inviteSummary (Review 12 decision 2: open reads as open)', () => {
  it('says anyone can come first, then the reach and about how many people nearby', () => {
    expect(inviteHeadline({ ...DEFAULT_FILTER, everyone: true, radiusMiles: 25 }, '18')).toEqual({ title: 'Anyone can come', detail: 'within 25 mi of the meet · about 18 people nearby' });
    expect(inviteSummary({ ...DEFAULT_FILTER, everyone: true, radiusMiles: 25 }, '18')).toBe('Anyone can come · within 25 mi of the meet · about 18 people nearby');
    expect(inviteSummary({ ...DEFAULT_FILTER, everyone: true, radiusMiles: 25 }, '1')).toBe('Anyone can come · within 25 mi of the meet · about 1 person nearby');
    expect(inviteSummary({ ...DEFAULT_FILTER, everyone: true, radiusMiles: 10 }, 'fewer than 3')).toBe('Anyone can come · within 10 mi of the meet · fewer than 3 people nearby');
  });
  it('titles a limited meet "Only some can come"', () => {
    expect(inviteHeadline({ ...DEFAULT_FILTER, everyone: false, cars: false, bikes: true, classes: [], minMods: 0, brands: [], radiusMiles: 10 }, '7')).toEqual({ title: 'Only some can come', detail: 'Bikes · within 10 mi · 7 people match' });
  });
  it('says a limited meet as its limits and how many match', () => {
    expect(inviteSummary({ ...DEFAULT_FILTER, everyone: false, cars: false, bikes: true, classes: [], minMods: 0, brands: [], radiusMiles: 10 }, '7')).toBe('Bikes · within 10 mi · 7 people match');
  });
});
