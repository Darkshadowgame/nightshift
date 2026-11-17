import { cellOf, lookupDue, overpassQuery, parseMaxspeed, pickWay, remember, roadInfo, waysFrom, type OsmWay } from '../src/lib/speedLimit';

describe('maxspeed', () => {
  test.each([
    ['30 mph', { value: 30, unit: 'mph' }],
    ['20mph', { value: 20, unit: 'mph' }],
    ['50', { value: 50, unit: 'kmh' }],
    ['80 km/h', { value: 80, unit: 'kmh' }],
    ['GB:nsl_single', { value: 60, unit: 'mph' }],
    ['GB:nsl_dual', { value: 70, unit: 'mph' }],
    ['UK:motorway', { value: 70, unit: 'mph' }],
    ['30 mph;40 mph', { value: 30, unit: 'mph' }],
  ])('%s', (tag, want) => {
    expect(parseMaxspeed(tag)).toEqual(want);
  });
  test.each(['none', 'signals', 'variable', 'walk', '', '999 mph', '2'])('untrusted: %s', (tag) => {
    expect(parseMaxspeed(tag)).toBeNull();
  });
});

// Two roads crossing at (52.6, -1.7): High Street runs north–south, Mill Lane east–west.
const high: OsmWay = { id: 1, tags: { name: 'High Street', maxspeed: '30 mph' }, geometry: [{ lat: 52.598, lon: -1.7 }, { lat: 52.602, lon: -1.7 }] };
const mill: OsmWay = { id: 2, tags: { name: 'Mill Lane', ref: 'B5404', maxspeed: '20 mph' }, geometry: [{ lat: 52.6, lon: -1.703 }, { lat: 52.6, lon: -1.697 }] };
const bypass: OsmWay = { id: 3, tags: { ref: 'A5', maxspeed: 'GB:nsl_dual', oneway: 'yes' }, geometry: [{ lat: 52.6001, lon: -1.703 }, { lat: 52.6001, lon: -1.697 }] };

describe('the way you are on', () => {
  test('nearest, nudged by the way you are heading', () => {
    expect(pickWay([high, mill], { lat: 52.6, lng: -1.7 }, 0)?.id).toBe(1);
    expect(pickWay([high, mill], { lat: 52.6, lng: -1.7 }, 90)?.id).toBe(2);
    expect(pickWay([high, mill], { lat: 52.5995, lng: -1.7 }, null)?.id).toBe(1);
  });
  test('a one-way road the wrong way round loses to a two-way one', () => {
    expect(pickWay([mill, bypass], { lat: 52.60008, lng: -1.699 }, 270)?.id).toBe(2);
    expect(pickWay([mill, bypass], { lat: 52.60008, lng: -1.699 }, 90)?.id).toBe(3);
  });
  test('nothing within 30 m', () => {
    expect(pickWay([high], { lat: 52.6, lng: -1.695 }, null)).toBeNull();
  });
  test('name, number and limit', () => {
    expect(roadInfo(high)).toEqual({ wayId: 1, name: 'High Street', limit: { value: 30, unit: 'mph' } });
    expect(roadInfo(bypass)).toEqual({ wayId: 3, name: 'A5', limit: { value: 70, unit: 'mph' } });
    expect(roadInfo({ id: 4 })).toEqual({ wayId: 4, name: null, limit: null });
  });
});

describe('lookups', () => {
  test('only the square centre is sent, to about 10 m', () => {
    const a = cellOf({ lat: 52.60012, lng: -1.70044 });
    const b = cellOf({ lat: 52.60098, lng: -1.70101 });
    expect(b.key).toBe(a.key);
    expect(Math.abs(a.centre.lat - 52.60012)).toBeLessThan(0.002);
    const q = overpassQuery(a.centre);
    expect(q).toContain(`around:160,${a.centre.lat.toFixed(4)},${a.centre.lng.toFixed(4)}`);
    expect(q).toContain('out tags geom');
  });
  test('answers are checked', () => {
    expect(waysFrom({ elements: [{ type: 'way', id: 1, geometry: [{ lat: 1, lon: 1 }, { lat: 1, lon: 2 }] }, { type: 'node', id: 2 }, { type: 'way', id: 3 }] })).toHaveLength(1);
    expect(waysFrom(null)).toEqual([]);
    expect(waysFrom('<html>')).toEqual([]);
  });
  test('throttled, and cached squares are not asked again', () => {
    expect(lookupDue(false, 0, 5000)).toBe(true);
    expect(lookupDue(false, 3000, 5000)).toBe(false);
    expect(lookupDue(true, 0, 60_000)).toBe(false);
  });
  test('the cache keeps the latest', () => {
    const c = new Map<string, number>();
    for (let i = 0; i < 5; i++) remember(c, `k${i}`, i, 3);
    expect([...c.keys()]).toEqual(['k2', 'k3', 'k4']);
  });
});
