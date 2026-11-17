import { compassHeading, driveFocus, normaliseDegrees, pickHeading, shortestTurn, smoothHeading } from '../src/lib/heading';

describe('angles', () => {
  test('normalise wraps both ways', () => {
    expect(normaliseDegrees(370)).toBe(10);
    expect(normaliseDegrees(-10)).toBe(350);
    expect(normaliseDegrees(0)).toBe(0);
  });
  test('shortest turn goes the short way across north', () => {
    expect(shortestTurn(350, 10)).toBe(20);
    expect(shortestTurn(10, 350)).toBe(-20);
    expect(shortestTurn(90, 270)).toBe(180);
    expect(shortestTurn(0, 0)).toBe(0);
  });
});

describe('compass', () => {
  test('true north first, then magnetic, else null', () => {
    expect(compassHeading({ trueHeading: 45, magHeading: 47 })).toBe(45);
    expect(compassHeading({ trueHeading: -1, magHeading: 47 })).toBe(47);
    expect(compassHeading({ trueHeading: -1, magHeading: -1 })).toBeNull();
    expect(compassHeading(null)).toBeNull();
  });
});

describe('pick the heading', () => {
  const route = { bearing: 200, off: 5 };
  test('GPS course when moving', () => {
    expect(pickHeading({ course: 90, speed: 10, compass: 180, route })).toEqual({ heading: 90, source: 'gps' });
  });
  test('slow or stopped: the compass, not the course', () => {
    expect(pickHeading({ course: 90, speed: 1, compass: 180, route })).toEqual({ heading: 180, source: 'compass' });
    expect(pickHeading({ course: 90, speed: null, compass: 180, route })).toEqual({ heading: 180, source: 'compass' });
    expect(pickHeading({ course: -1, speed: 12, compass: 180, route })).toEqual({ heading: 180, source: 'compass' });
  });
  test('route bearing only as a last resort, and only on the route', () => {
    expect(pickHeading({ course: null, speed: 0, compass: null, route })).toEqual({ heading: 200, source: 'route' });
    expect(pickHeading({ course: null, speed: 0, compass: null, route: { bearing: 200, off: 120 } })).toEqual({ heading: null, source: 'none' });
  });
  test('nothing to go on', () => {
    expect(pickHeading({ course: null, speed: null, compass: null })).toEqual({ heading: null, source: 'none' });
  });
});

describe('smoothing', () => {
  test('first heading is taken as it is', () => {
    expect(smoothHeading(null, 123)).toBe(123);
  });
  test('no target keeps what is shown (never back to north)', () => {
    expect(smoothHeading(77, null)).toBe(77);
  });
  test('ignores jitter under 3 degrees', () => {
    expect(smoothHeading(100, 102)).toBe(100);
    expect(smoothHeading(359, 1)).toBe(359);
  });
  test('eases part of the way, the short way round north', () => {
    expect(smoothHeading(350, 30)).toBe(10);
    expect(smoothHeading(10, 330)).toBe(350);
  });
  test('settles on the target rather than creeping', () => {
    let h: number | null = 0;
    for (let i = 0; i < 12; i++) h = smoothHeading(h, 90);
    expect(h).toBe(90);
  });
  test('a small step finishes rather than stalling just short', () => {
    expect(smoothHeading(100, 105)).toBe(105);
  });
});

describe('camera focus', () => {
  const fix = { at: { lat: 52, lng: -1 }, speed: 12, course: 90, accuracy: 5 };
  const snap = { at: { lat: 52.0001, lng: -1 }, off: 8, bearing: 92 };
  test('moving along the route: on the route', () => {
    expect(driveFocus(fix, snap)).toEqual(snap.at);
  });
  test('clearly off the route: on you', () => {
    expect(driveFocus(fix, { ...snap, off: 40 })).toEqual(fix.at);
  });
  test('stopped: on you (a car park next to the road)', () => {
    expect(driveFocus({ ...fix, speed: 0 }, snap)).toEqual(fix.at);
  });
  test('going the other way, or a poor fix: on you', () => {
    expect(driveFocus({ ...fix, course: 270 }, snap)).toEqual(fix.at);
    expect(driveFocus({ ...fix, accuracy: 65 }, snap)).toEqual(fix.at);
  });
  test('no route yet: on you; no fix: nothing', () => {
    expect(driveFocus(fix, null)).toEqual(fix.at);
    expect(driveFocus(null, snap)).toBeNull();
  });
});
