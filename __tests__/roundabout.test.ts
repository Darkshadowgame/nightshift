import { exitAngle, exitLine, lockScreenRoad, ordinal, otherArms, polar, roundaboutExit, roundaboutLabel, sweepTo } from '../src/lib/roundabout';
import { buildRoute, manoeuvreOf, progressOn, snapToRoute } from '../src/lib/nav';
import { bannerFor, roadFromInstruction } from '../src/lib/driveView';
import { liveActivityContent } from '../src/lib/liveActivity';

describe('roundaboutExit', () => {
  test.each([
    ['At the roundabout, take the 1st exit', 1],
    ['At the roundabout, take the 2nd exit onto A51', 2],
    ['At the roundabout, take the 3rd exit', 3],
    ['At the roundabout, take the 4th exit onto High Street', 4],
    ['At the roundabout, take the 8th exit', 8],
    ['At the roundabout, take the second exit', 2],
    ['At the roundabout take the Third Exit onto the A5', 3],
    ['Enter the roundabout and take the first exit', 1],
    ['At the roundabout, take the fifth exit', 5],
    ['At the roundabout, take the sixth exit', 6],
    ['At the roundabout, take the seventh exit', 7],
    ['At the roundabout, take the eighth exit', 8],
    ['At the roundabout, take exit 2', 2],
    ['At the roundabout, take exit number 3 onto A38', 3],
    ['At the traffic circle, take the 2nd exit', 2],
    ['At the rotary, take the 2nd exit', 2],
    ['AT THE ROUNDABOUT, TAKE THE 3RD EXIT', 3],
    ['At the roundabout, take the 2nd exit onto the A38 towards Derby, then at the next roundabout take the 1st exit', 2],
  ])('%s', (text, n) => expect(roundaboutExit(text)).toBe(n));

  test.each([
    'At the roundabout, take the exit',
    'Enter the roundabout',
    'Exit the roundabout',
    'At the roundabout, turn left',
    'Continue straight at the roundabout',
    'Turn right onto High Street',
    'Take exit 12 onto the M42',
    'Take the 2nd exit',
    'At the roundabout, take the 0th exit',
    'At the roundabout, take the 15th exit',
    'At the roundabout, take the eleventh exit',
    '',
  ])('no number: %s', (text) => expect(roundaboutExit(text)).toBeNull());

  test('null and undefined', () => {
    expect(roundaboutExit(null)).toBeNull();
    expect(roundaboutExit(undefined)).toBeNull();
  });
});

describe('words', () => {
  test('ordinals', () => {
    expect([1, 2, 3, 4, 9, 11, 12, 13, 21].map(ordinal)).toEqual(['1st', '2nd', '3rd', '4th', '9th', '11th', '12th', '13th', '21st']);
  });
  test('screen reader label', () => {
    expect(roundaboutLabel(2)).toBe('Roundabout, second exit');
    expect(roundaboutLabel(null)).toBe('Roundabout');
  });
  test('line without a road', () => expect(exitLine(3)).toBe('Take the 3rd exit'));
  test('lock screen line', () => {
    expect(lockScreenRoad('A51', 2)).toBe('2nd exit · A51');
    expect(lockScreenRoad('', 1)).toBe('1st exit');
    expect(lockScreenRoad('Take the 3rd exit', 3)).toBe('Take the 3rd exit');
    expect(lockScreenRoad('A51', null)).toBe('A51');
  });
});

describe('layout', () => {
  test('1 left, 2 straight on, 3 right, 4 back towards you', () => {
    expect([1, 2, 3, 4].map(exitAngle)).toEqual([270, 0, 90, 135]);
  });
  test('later exits are on the ring, never on the entry, and differ from the first four', () => {
    for (const n of [5, 6, 7, 8, 9]) {
      const a = exitAngle(n);
      expect(a).toBeGreaterThanOrEqual(0);
      expect(a).toBeLessThan(360);
      expect(Math.abs(a - 180)).toBeGreaterThan(20);
    }
  });
  test('faint arms leave out the taken one', () => {
    expect(otherArms(2)).toEqual([270, 90]);
    expect(otherArms(4)).toEqual([270, 0, 90]);
  });
  test('sweep is clockwise from the entry', () => {
    expect(sweepTo(1)).toBe(90);
    expect(sweepTo(2)).toBe(180);
    expect(sweepTo(3)).toBe(270);
  });
  test('polar: up, right, down', () => {
    expect(polar(50, 50, 10, 0)).toEqual({ x: 50, y: 40 });
    expect(polar(50, 50, 10, 90).x).toBeCloseTo(60);
    expect(polar(50, 50, 10, 180).y).toBeCloseTo(60);
  });
});

describe('with the route', () => {
  test('a roundabout step is a roundabout and says its exit', () => {
    const text = 'At the roundabout, take the 2nd exit onto A51';
    expect(manoeuvreOf(text)).toBe('roundabout');
    expect(roundaboutExit(text)).toBe(2);
    expect(roadFromInstruction(text)).toBe('A51');
  });
});

describe('banner and lock screen', () => {
  // A straight line north, with a roundabout 300 m on and a right turn 200 m after it.
  const line = (m: number) => ({ lat: 52 + m / 111195, lng: -1.5 });
  const raw = {
    coords: [0, 100, 300, 500, 700].flatMap((m) => [line(m).lat, line(m).lng]),
    distance: 700,
    time: 60,
    steps: [
      { text: 'Head off', distance: 300, ...line(0), index: 0, leg: 0 },
      { text: 'At the roundabout, take the 2nd exit onto A51', distance: 200, ...line(300), index: 2, leg: 0 },
      { text: 'At the roundabout, take the exit', distance: 200, ...line(500), index: 3, leg: 0 },
      { text: 'Arrive at the destination', distance: 0, ...line(700), index: 4, leg: 0 },
    ],
    legs: [{ endIndex: 4, distance: 700, time: 60 }],
  };
  const r = buildRoute(raw);
  const at = (m: number) => progressOn(r, snapToRoute(r, line(m)));
  test('the banner carries the exit, and the next one as then', () => {
    const b = bannerFor(r, at(100))!;
    expect(b.kind).toBe('roundabout');
    expect(b.exit).toBe(2);
    expect(b.title).toBe('A51');
    expect(b.then).toEqual({ kind: 'roundabout', title: 'At the roundabout, take the exit', exit: null });
  });
  test('no road named: the title says the exit', () => {
    const b = bannerFor(r, at(400))!;
    expect(b.exit).toBeNull();
  });
  test('other turns have no exit', () => {
    expect(bannerFor(r, at(600))).toMatchObject({ kind: 'arrive', exit: null });
  });
  test('the lock screen says the exit in words', () => {
    const b = bannerFor(r, at(100))!;
    const c = liveActivityContent({ phase: 'driving', banner: b, trip: { eta: '14:32', distance: '12 mi' }, destination: 'X' });
    expect(c?.arrow).toBe('roundabout');
    expect(c?.road).toBe('2nd exit · A51');
  });
  test('a roundabout with no exit number keeps its road line', () => {
    const c = liveActivityContent({ phase: 'driving', banner: { kind: 'roundabout', distance: 50, title: 'A51', exit: null }, trip: null, destination: 'X' });
    expect(c?.road).toBe('A51');
  });
  test('other manoeuvres are untouched', () => {
    const c = liveActivityContent({ phase: 'driving', banner: { kind: 'right', distance: 50, title: 'High Street' }, trip: null, destination: 'X' });
    expect(c?.road).toBe('High Street');
  });
});
