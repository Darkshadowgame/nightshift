import { AUTO_START_MS, autoStartAllowed, autoStartDue, secondsLeft, startLabel } from '../src/lib/autoStart';

describe('route preview auto-start', () => {
  test('only with exactly one route, no screen reader and no touch', () => {
    expect(autoStartAllowed({ routes: 1, screenReader: false, touched: false })).toBe(true);
    expect(autoStartAllowed({ routes: 2, screenReader: false, touched: false })).toBe(false);
    expect(autoStartAllowed({ routes: 3, screenReader: false, touched: false })).toBe(false);
    expect(autoStartAllowed({ routes: 0, screenReader: false, touched: false })).toBe(false);
    expect(autoStartAllowed({ routes: 1, screenReader: true, touched: false })).toBe(false);
    expect(autoStartAllowed({ routes: 1, screenReader: false, touched: true })).toBe(false);
  });
  test('counts 5, 4, 3, 2, 1, then starts at 5 seconds', () => {
    const t0 = 1_000_000;
    expect(AUTO_START_MS).toBe(5000);
    expect([0, 999, 1000, 2500, 4000, 4999].map((d) => secondsLeft(t0, t0 + d))).toEqual([5, 5, 4, 3, 1, 1]);
    expect(secondsLeft(t0, t0 + 5000)).toBe(0);
    expect(secondsLeft(t0, t0 + 9000)).toBe(0);
    expect(autoStartDue(t0, t0 + 4999)).toBe(false);
    expect(autoStartDue(t0, t0 + 5000)).toBe(true);
    expect(autoStartDue(null, t0 + 60_000)).toBe(false);
  });
  test('the button says the count, then plain Start', () => {
    expect(startLabel(5)).toBe('Start · 5');
    expect(startLabel(1)).toBe('Start · 1');
    expect(startLabel(0)).toBe('Start');
    expect(startLabel(null)).toBe('Start');
  });
});
