import fixture from './fixtures/nav-route-two-legs.json';
import {
  arrivedByRoute,
  bannerFor,
  cameraHeading,
  canPan,
  iconRotation,
  isMoving,
  liveSpeed,
  nameLookupDue,
  navIconOf,
  overLimit,
  recentreDue,
  roadFromInstruction,
  roadOnRoute,
  shownLimit,
  straightRoute,
  tripSummary,
} from '../src/lib/driveView';
import { buildRoute, progressOn, snapToRoute, type RawRouteLike } from '../src/lib/nav';

const route = buildRoute(fixture as RawRouteLike, ['Retail park', 'Viewpoint']);
const at = (lat: number, lng: number) => ({ lat, lng });

describe('road names from instructions', () => {
  test.each([
    ['Turn right onto High Street', 'High Street'],
    ['At the roundabout, take the second exit onto the A38', 'A38'],
    ['Continue on M6', 'M6'],
    ['Turn left onto Lichfield Road towards Walsall', 'Lichfield Road'],
    ['Bear right onto Mill Lane, then turn left', 'Mill Lane'],
    ['Keep left at the fork', null],
    ['Take the exit on the left', null],
    ['Arrive at the destination', null],
    ['', null],
  ])('%s', (text, road) => {
    expect(roadFromInstruction(text)).toBe(road);
  });
});

describe('banner and the road you are on', () => {
  test('before the first turn: turn onto Mill Lane, no road yet', () => {
    const p = progressOn(route, snapToRoute(route, at(52.605, -1.7)));
    const b = bannerFor(route, p)!;
    expect(b.kind).toBe('right');
    expect(b.title).toBe('Mill Lane');
    expect(b.text).toBe('Turn right onto Mill Lane');
    expect(roadOnRoute(route, p)).toBeNull();
  });
  test('after the turn: on Mill Lane, heading for the stop', () => {
    const p = progressOn(route, snapToRoute(route, at(52.6135, -1.692)));
    expect(roadOnRoute(route, p)).toBe('Mill Lane');
    expect(bannerFor(route, p)!.kind).toBe('arrive');
  });
  test('off the route: no road from the route', () => {
    const p = progressOn(route, snapToRoute(route, at(52.6135, -1.65)));
    expect(roadOnRoute(route, p)).toBeNull();
  });
  test('then: shown only when the next one comes soon after', () => {
    const p = progressOn(route, snapToRoute(route, at(52.605, -1.7)));
    // The stop is 1 km after the turn: no "then".
    expect(bannerFor(route, p)!.then).toBeNull();
  });
  test('trip summary', () => {
    const now = new Date(2026, 10, 17, 21, 0).getTime();
    expect(tripSummary(now, 1609.344 * 3.2, 600)).toEqual({ eta: '21:10', distance: '3.2 mi', time: '10 min' });
  });
});

describe('speed and the limit', () => {
  test('fixes drying up means stopped', () => {
    expect(liveSpeed(12, 1000)).toBe(12);
    expect(liveSpeed(12, 6000)).toBe(0);
    expect(liveSpeed(null, 1000)).toBeNull();
    expect(isMoving(3)).toBe(true);
    expect(isMoving(1)).toBe(false);
    expect(isMoving(null)).toBe(false);
  });
  test('camera or zone first, then the road', () => {
    expect(shownLimit({ mph: 40, source: 'camera' }, { value: 30, unit: 'mph' })).toEqual({ value: 40, unit: 'mph', mph: 40, source: 'camera' });
    expect(shownLimit(null, { value: 30, unit: 'mph' })).toEqual({ value: 30, unit: 'mph', mph: 30, source: 'road' });
    expect(shownLimit(null, { value: 50, unit: 'kmh' })).toEqual({ value: 50, unit: 'kmh', mph: 31, source: 'road' });
    expect(shownLimit(null, null)).toBeNull();
  });
  test('over is the whole mph shown above the limit', () => {
    const l = shownLimit(null, { value: 30, unit: 'mph' });
    expect(overLimit(13.4112, l)).toBe(false); // 30
    expect(overLimit(13.9, l)).toBe(true); // 31
    expect(overLimit(20, null)).toBe(false);
  });
});

describe('arrival by the route', () => {
  const stop = { id: 's', name: 'Shop', at: at(52.6135, -1.6852), role: 'destination' as const };
  test('reached the end of the leg near a set-back stop', () => {
    expect(arrivedByRoute(1000, 990, 10, at(52.6143, -1.6852), stop)).toBe(true);
  });
  test('not yet, or far from the pin, or off the route', () => {
    expect(arrivedByRoute(1000, 900, 10, at(52.6135, -1.6852), stop)).toBe(false);
    expect(arrivedByRoute(1000, 1000, 10, at(52.62, -1.6852), stop)).toBe(false);
    expect(arrivedByRoute(1000, 1000, 90, at(52.6135, -1.6852), stop)).toBe(false);
    expect(arrivedByRoute(NaN, 1000, 0, at(52.6135, -1.6852), stop)).toBe(false);
  });
});

describe('map', () => {
  test('north-up keeps north at the top; your icon turns instead', () => {
    expect(cameraHeading('north', 90)).toBe(0);
    expect(cameraHeading('heading', 90)).toBe(90);
    expect(iconRotation(90, 0)).toBe(90);
    expect(iconRotation(90, 90)).toBe(0);
    expect(iconRotation(10, 350)).toBe(20);
  });
  test('panning only while stopped; back to following after 8 s or on moving off', () => {
    expect(canPan(0)).toBe(true);
    expect(canPan(10)).toBe(false);
    expect(recentreDue(null, 10_000, 0)).toBe(false);
    expect(recentreDue(1000, 5000, 0)).toBe(false);
    expect(recentreDue(1000, 9000, 0)).toBe(true);
    expect(recentreDue(1000, 2000, 8)).toBe(true);
  });
  test('icon: saved choice, or the white arrow', () => {
    expect(navIconOf(undefined)).toEqual({ shape: 'arrow', colour: 'white', hex: '#f4f6fa' });
    expect(navIconOf({ shape: 'bike', colour: 'red' })).toEqual({ shape: 'bike', colour: 'red', hex: '#ff5a5a' });
    expect(navIconOf({ shape: 'tank' as never, colour: 'gold' })).toEqual({ shape: 'arrow', colour: 'white', hex: '#f4f6fa' });
  });
  test('road name lookups: every 15 s or 150 m, never faster than 5 s', () => {
    const p = at(52.6, -1.7);
    expect(nameLookupDue(null, p, 0)).toBe(true);
    expect(nameLookupDue({ at: p, t: 0 }, at(52.61, -1.7), 3000)).toBe(false);
    expect(nameLookupDue({ at: p, t: 0 }, at(52.602, -1.7), 6000)).toBe(true);
    expect(nameLookupDue({ at: p, t: 0 }, p, 10_000)).toBe(false);
    expect(nameLookupDue({ at: p, t: 0 }, p, 15_000)).toBe(true);
  });
});

describe('the web preview demo drive', () => {
  const pts = [at(52.6, -1.7), at(52.61, -1.69), at(52.62, -1.71)];
  const r = buildRoute(straightRoute(pts, ['Start', 'Finish']), ['Start', 'Finish']);
  it('runs through every point, one leg each, ending on the last point', () => {
    expect(r.legs).toHaveLength(2);
    expect(r.coords[0]).toEqual(pts[0]);
    expect(r.coords[r.legs[0].endIndex]).toEqual(pts[1]);
    expect(r.coords[r.coords.length - 1]).toEqual(pts[2]);
    expect(r.length).toBeGreaterThan(2000);
  });
  it('says where to head and when you arrive', () => {
    expect(r.steps[0].text).toBe('Head towards Start');
    expect(r.steps.filter((s) => s.kind === 'arrive')).toHaveLength(2);
  });
});

describe('the demo drive follows the baked road (Review 11)', () => {
  const { straightRoute: route } = require('../src/lib/driveView');
  const a = { lat: 52.63, lng: -1.7 };
  const b = { lat: 52.6105, lng: -1.672 };
  const road = [a, { lat: 52.63, lng: -1.68 }, { lat: 52.615, lng: -1.672 }, b];
  test('a leg with a road goes along it, from its start to the point exactly', () => {
    const r = route([a, b], ['Leisure park car park'], 60, () => road);
    const pts: { lat: number; lng: number }[] = [];
    for (let i = 0; i < r.coords.length; i += 2) pts.push({ lat: r.coords[i], lng: r.coords[i + 1] });
    expect(pts[0]).toEqual(a);
    expect(pts[pts.length - 1]).toEqual(b);
    expect(pts.some((p) => Math.abs(p.lat - 52.63) < 1e-9 && Math.abs(p.lng + 1.68) < 1e-9)).toBe(true);
    expect(r.distance).toBeGreaterThan(route([a, b]).distance);
    expect(r.legs[0].endIndex).toBe(pts.length - 1);
  });
  test('a leg without one is still a straight line', () => {
    expect(route([a, b], [], 60, () => null)).toEqual(route([a, b]));
  });
});
