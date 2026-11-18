import { isDaytime, mapAppearance, sunTimes } from '../src/lib/sun';

const TAMWORTH = { lat: 52.63, lng: -1.7 };
const hm = (ms: number | null) => {
  const d = new Date(ms!);
  return d.getUTCHours() * 60 + d.getUTCMinutes();
};

describe('sunrise and sunset', () => {
  test('mid-November in the Midlands: about 07:25 and 16:10 UTC', () => {
    const s = sunTimes(new Date('2026-11-18T12:00:00Z'), TAMWORTH);
    expect(Math.abs(hm(s.sunrise) - (7 * 60 + 27))).toBeLessThan(8);
    expect(Math.abs(hm(s.sunset) - (16 * 60 + 9))).toBeLessThan(8);
  });
  test('midsummer: about 03:45 and 20:30 UTC', () => {
    const s = sunTimes(new Date('2026-06-21T12:00:00Z'), TAMWORTH);
    expect(Math.abs(hm(s.sunrise) - (3 * 60 + 44))).toBeLessThan(8);
    expect(Math.abs(hm(s.sunset) - (20 * 60 + 32))).toBeLessThan(8);
  });
  test('polar night and day', () => {
    expect(sunTimes(new Date('2026-12-21T12:00:00Z'), { lat: 80, lng: 0 }).polar).toBe('night');
    expect(sunTimes(new Date('2026-06-21T12:00:00Z'), { lat: 80, lng: 0 }).polar).toBe('day');
  });
});

describe('map style', () => {
  test('Day and Night are fixed; Auto follows the sun', () => {
    const noon = new Date('2026-11-18T12:00:00Z');
    const night = new Date('2026-11-18T21:10:00Z');
    expect(mapAppearance('day', night, TAMWORTH)).toBe('light');
    expect(mapAppearance('night', noon, TAMWORTH)).toBe('dark');
    expect(mapAppearance('auto', noon, TAMWORTH)).toBe('light');
    expect(mapAppearance('auto', night, TAMWORTH)).toBe('dark');
    expect(mapAppearance(undefined, night)).toBe('dark');
    expect(isDaytime(new Date('2026-11-18T07:00:00Z'), TAMWORTH)).toBe(false);
    expect(isDaytime(new Date('2026-11-18T08:00:00Z'), TAMWORTH)).toBe(true);
  });
});
