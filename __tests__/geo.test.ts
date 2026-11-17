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
