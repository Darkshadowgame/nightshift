import { fitRegion } from '../src/lib/geo';

describe('fitting the map to everything', () => {
  test('centres on the spread and covers it with a margin', () => {
    const r = fitRegion([{ lat: 52.5, lng: -1.9 }, { lat: 53.5, lng: -1.5 }])!;
    expect(r.centre.lat).toBeCloseTo(53);
    expect(r.centre.lng).toBeCloseTo(-1.7);
    expect(r.span).toBeCloseTo(1.5);
  });

  test('a single place gets the minimum span; nothing gives null', () => {
    expect(fitRegion([{ lat: 52, lng: -1 }])).toEqual({ centre: { lat: 52, lng: -1 }, span: 0.3 });
    expect(fitRegion([])).toBeNull();
  });
});

describe('formatMiles', () => {
  const { formatMiles } = require('../src/lib/geo');
  it('never says "here" (it gets "from you" added)', () => {
    expect(`${formatMiles(0)} from you`).toBe('under 0.1 mi from you');
    expect(formatMiles(2.34)).toBe('2.3 mi');
    expect(formatMiles(14.4)).toBe('14 mi');
  });
});
