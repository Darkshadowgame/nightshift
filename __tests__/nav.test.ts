import fixture from './fixtures/nav-route-two-legs.json';
import type { Camera } from '../src/lib/cameraCodec';
import type { AverageZone } from '../src/lib/cameras';
import {
  activeLimit,
  ARROWS,
  buildRoute,
  camerasAhead,
  camerasOnRoute,
  checkOffRoute,
  dueAnnouncement,
  etaClock,
  formatDistance,
  formatDuration,
  isOver,
  manoeuvreOf,
  metresBetween,
  mphOf,
  ON_ROUTE,
  pointAlong,
  progressOn,
  reachedStop,
  routePoints,
  secondsBetween,
  snapToRoute,
  spokenDistance,
  stopAlongs,
  zoneAverageMph,
  zonesOnRoute,
  zoneStatus,
  type Fix,
  type NavStop,
  type RawRouteLike,
} from '../src/lib/nav';
import type { LatLng } from '../src/lib/types';

/**
 * Fixture: two legs as the native module returns them. Leg 1 goes 1.5 km north
 * from (52.6, -1.7), turns right and goes 1 km east to stop A. Leg 2 carries on
 * 600 m east, turns left and goes 2.5 km north to the end. Points every 50 m.
 */
const raw = fixture as RawRouteLike;
const P = {
  start: { lat: 52.6, lng: -1.7 },
  corner1: { lat: 52.61349, lng: -1.7 },
  stopA: { lat: 52.613489, lng: -1.685189 },
  corner2: { lat: 52.613489, lng: -1.676302 },
  end: { lat: 52.635972, lng: -1.676302 },
};
const route = buildRoute(raw, ['Retail park', 'Viewpoint']);

/** A point `m` metres east (+) or north of p. */
function offset(p: LatLng, eastM: number, northM = 0): LatLng {
  return { lat: p.lat + northM / 111_320, lng: p.lng + eastM / (111_320 * Math.cos((p.lat * Math.PI) / 180)) };
}

function fix(at: LatLng, t: number, extra: Partial<Fix> = {}): Fix {
  return { at, t, speed: 13, course: null, accuracy: 10, ...extra };
}

describe('units', () => {
  test('yards under a tenth of a mile, miles above', () => {
    expect(formatDistance(50)).toBe('50 yd');
    expect(formatDistance(183)).toBe('0.1 mi');
    expect(formatDistance(150)).toBe('160 yd');
    expect(formatDistance(1609.344 * 0.42)).toBe('0.4 mi');
    expect(formatDistance(1609.344 * 12.4)).toBe('12 mi');
    expect(formatDistance(-5)).toBe('10 yd');
  });

  test('spoken distances', () => {
    expect(spokenDistance(120)).toBe('150 yards');
    expect(spokenDistance(1609.344 * 0.42)).toBe('0.4 miles');
    expect(spokenDistance(1609.344 * 1.02)).toBe('1 mile');
    expect(spokenDistance(1609.344 * 12.4)).toBe('12 miles');
  });

  test('mph from m/s, null when the phone does not know', () => {
    expect(mphOf(13.4112)).toBe(30);
    expect(mphOf(-1)).toBeNull();
    expect(mphOf(null)).toBeNull();
  });

  test('durations and clock times', () => {
    expect(formatDuration(25 * 60)).toBe('25 min');
    expect(formatDuration(65 * 60)).toBe('1 h 05 min');
    const at = new Date(2026, 10, 20, 21, 30).getTime();
    expect(etaClock(at, 12 * 60)).toBe('21:42');
  });
});

describe('building a route', () => {
  test('joins the legs, drops empty steps and names each arrival', () => {
    expect(route.coords).toHaveLength(raw.coords.length / 2);
    expect(route.length).toBeGreaterThan(5550);
    expect(route.length).toBeLessThan(5650);
    expect(route.steps.map((s) => s.text)).toEqual([
      'Turn right onto Mill Lane',
      'Arrive at Retail park',
      'Turn left onto High Street',
      'Arrive at Viewpoint, on your right',
    ]);
    expect(route.steps[0].along).toBeCloseTo(1500, -1);
    expect(route.legs[0].endAlong).toBeCloseTo(2500, -1);
    expect(route.legs[1].endAlong).toBeCloseTo(route.length, 3);
  });

  test('turn kinds and arrows from the wording', () => {
    expect(manoeuvreOf('Turn right onto Mill Lane')).toBe('right');
    expect(manoeuvreOf('At the roundabout, take the second exit onto A5')).toBe('roundabout');
    expect(manoeuvreOf('Keep left at the fork')).toBe('keepLeft');
    expect(manoeuvreOf('Take the exit on the left towards M6')).toBe('slightLeft');
    expect(manoeuvreOf('Make a U-turn')).toBe('uturn');
    expect(manoeuvreOf('The destination is on your left')).toBe('arrive');
    expect(manoeuvreOf('Continue onto B4100')).toBe('straight');
    expect(ARROWS.roundabout).toBe('↻');
  });

  test('a point along the route and its direction', () => {
    const p = pointAlong(route, 750);
    expect(metresBetween(p.at, offset(P.start, 0, 750))).toBeLessThan(5);
    expect(p.bearing).toBeCloseTo(0, 0);
    const q = pointAlong(route, 2000);
    expect(q.bearing).toBeCloseTo(90, 0);
    expect(pointAlong(route, 99_999).at).toEqual(route.coords[route.coords.length - 1]);
  });
});

describe('progress along the route', () => {
  test('snaps a position beside the road to the route', () => {
    const snap = snapToRoute(route, offset(P.start, 20, 600));
    expect(snap.off).toBeGreaterThan(15);
    expect(snap.off).toBeLessThan(25);
    expect(snap.along).toBeCloseTo(600, -1);
  });

  test('distance to the next turn, to the stop and to the end, with time left', () => {
    const p = progressOn(route, snapToRoute(route, offset(P.start, 0, 1000)));
    expect(p.stepIndex).toBe(0);
    expect(p.toStep).toBeCloseTo(500, -1);
    expect(p.leg).toBe(0);
    expect(p.toLegEnd).toBeCloseTo(1500, -1);
    expect(p.toEnd).toBeCloseTo(route.length - 1000, -1);
    // Leg 1 is 240 s over 2500 m: 1500 m left is 144 s.
    expect(p.secondsToLegEnd).toBeCloseTo(144, -1);
    expect(p.secondsToEnd).toBeCloseTo(144 + 360, -1);
    expect(secondsBetween(route, 0, route.length)).toBeCloseTo(600, 0);
  });

  test('past the first turn the next manoeuvre is the arrival', () => {
    const p = progressOn(route, snapToRoute(route, offset(P.corner1, 300)));
    expect(route.steps[p.stepIndex].text).toBe('Arrive at Retail park');
    expect(p.toStep).toBeCloseTo(700, -1);
  });

  test('on a road driven both ways, the hint keeps you on the stretch you are on', () => {
    // Out and back: north 1 km, then back south on the same road.
    const coords: number[] = [];
    for (let i = 0; i <= 20; i++) coords.push(52.6 + (i * 50) / 111_320, -1.7);
    for (let i = 19; i >= 0; i--) coords.push(52.6 + (i * 50) / 111_320, -1.7);
    const loop = buildRoute({ coords, distance: 2000, time: 200, steps: [], legs: [{ endIndex: 40, distance: 2000, time: 200 }] });
    const p = offset(P.start, 0, 300);
    expect(snapToRoute(loop, p, 250).along).toBeCloseTo(300, -1);
    expect(snapToRoute(loop, p, 1650).along).toBeCloseTo(1700, -1);
    expect(snapToRoute(loop, p, undefined, 180).along).toBeCloseTo(1700, -1);
  });
});

describe('announcements', () => {
  const at = (northM: number, said = new Set<string>()) =>
    dueAnnouncement(route, progressOn(route, snapToRoute(route, offset(P.start, 0, northM))), 13, said);

  test('a quarter of a mile, 200 yards, then now, each once', () => {
    expect(at(1100)?.text).toBe('In a quarter of a mile, turn right onto Mill Lane');
    expect(at(1100)?.band).toBe('quarter');
    expect(at(1350)?.text).toBe('In 200 yards, turn right onto Mill Lane');
    expect(at(1460)?.text).toBe('Turn right onto Mill Lane');
    const said = new Set([at(1460)!.key]);
    expect(at(1465, said)).toBeNull();
  });

  test('1 mile is left out when the turn comes sooner than that after the start', () => {
    // The first turn is only 1500 m from the start: no "In 1 mile".
    expect(at(100)).toBeNull();
  });

  test('1 mile before a turn that follows a long straight', () => {
    const coords: number[] = [];
    for (let i = 0; i <= 80; i++) coords.push(52.6 + (i * 50) / 111_320, -1.7);
    const long = buildRoute({
      coords, distance: 4000, time: 300,
      steps: [{ text: 'Turn left onto Long Road', distance: 0, lat: coords[160], lng: coords[161], index: 80, leg: 0 }],
      legs: [{ endIndex: 80, distance: 4000, time: 300 }],
    });
    const a = dueAnnouncement(long, progressOn(long, snapToRoute(long, offset(P.start, 0, 2600))), 25, new Set());
    expect(a?.text).toBe('In 1 mile, turn left onto Long Road');
  });

  test('the arrival itself is left to the arrival check', () => {
    const a = dueAnnouncement(route, progressOn(route, snapToRoute(route, offset(P.stopA, -20))), 5, new Set());
    expect(a).toBeNull();
  });
});

describe('off the route', () => {
  test('more than 50 m away for more than 5 seconds', () => {
    const away = offset(P.start, 80, 600);
    const snap = snapToRoute(route, away);
    let r = checkOffRoute(ON_ROUTE, snap, fix(away, 0));
    expect(r.off).toBe(false);
    r = checkOffRoute(r.state, snap, fix(away, 4000));
    expect(r.off).toBe(false);
    r = checkOffRoute(r.state, snap, fix(away, 6000));
    expect(r.off).toBe(true);
    // Back on the road resets it.
    const back = offset(P.start, 5, 650);
    expect(checkOffRoute(r.state, snapToRoute(route, back), fix(back, 7000)).state).toEqual(ON_ROUTE);
  });

  test('a poor GPS fix widens the margin', () => {
    const away = offset(P.start, 80, 600);
    const snap = snapToRoute(route, away);
    const r1 = checkOffRoute(ON_ROUTE, snap, fix(away, 0, { accuracy: 120 }));
    expect(checkOffRoute(r1.state, snap, fix(away, 9000, { accuracy: 120 })).off).toBe(false);
  });

  test('heading the wrong way along the route', () => {
    const p = offset(P.start, 0, 600);
    const snap = snapToRoute(route, p);
    const r1 = checkOffRoute(ON_ROUTE, snap, fix(p, 0, { course: 180, speed: 12 }));
    expect(r1.state.reason).toBe('wrongWay');
    expect(checkOffRoute(r1.state, snap, fix(p, 5500, { course: 180, speed: 12 })).off).toBe(true);
    // Standing still, the heading means nothing.
    expect(checkOffRoute(ON_ROUTE, snap, fix(p, 0, { course: 180, speed: 1 })).state).toEqual(ON_ROUTE);
  });
});

describe('stops', () => {
  const stops: NavStop[] = [
    { id: 'a', name: 'Retail park', at: P.stopA, role: 'stop', checkIn: true },
    { id: 'b', name: 'Viewpoint', at: P.end, role: 'destination' },
  ];

  test('arrival at the next stop in order', () => {
    expect(reachedStop(stops, 0, offset(P.stopA, -40))).toBe(0);
    expect(reachedStop(stops, 0, offset(P.stopA, -300))).toBe(-1);
    expect(reachedStop(stops, 1, offset(P.stopA, -40))).toBe(-1);
    expect(reachedStop(stops, 0, P.end)).toBe(1);
  });

  test('checkpoints count from 0.2 mi', () => {
    const cps: NavStop[] = [{ id: 'c', name: 'Checkpoint 2', at: P.corner1, role: 'checkpoint' }];
    expect(reachedStop(cps, 0, offset(P.corner1, 0, -300))).toBe(0);
    expect(reachedStop(cps, 0, offset(P.corner1, 0, -400))).toBe(-1);
  });

  test('rerouting goes from where you are through the stops still to come', () => {
    const here = offset(P.start, 100, 100);
    expect(routePoints(here, stops, 1)).toEqual({ points: [here, P.end], legStops: [1] });
  });

  test('long drives are thinned to a few dozen legs, keeping the next stop and the finish', () => {
    const many: NavStop[] = Array.from({ length: 60 }, (_, i) => ({ id: `cp${i}`, name: `C${i}`, at: offset(P.start, 0, i * 1600), role: 'checkpoint' }));
    const { points, legStops } = routePoints(P.start, many, 5, 30);
    expect(points).toHaveLength(31);
    expect(legStops[0]).toBe(5);
    expect(legStops[legStops.length - 1]).toBe(59);
    expect([...legStops].sort((a, b) => a - b)).toEqual(legStops);
  });

  test('where each stop sits along the route', () => {
    const [a, b] = stopAlongs(route, stops, 0);
    expect(a).toBeCloseTo(2500, -1);
    expect(b).toBeCloseTo(route.length, -1);
    expect(stopAlongs(route, stops, 1)[0]).toBeNaN();
  });
});

describe('speed cameras and average-speed zones', () => {
  const cams: Camera[] = [
    { id: 'on', at: offset(P.start, 8, 900), mph: 30, facing: 180 },
    { id: 'untagged', at: offset(P.corner1, 400, 5) },
    { id: 'sideRoad', at: offset(P.start, 10, 1200), mph: 40, facing: 90 },
    { id: 'far', at: offset(P.start, 500, 900), mph: 50 },
  ];
  const onRoute = camerasOnRoute(route, cams);

  test('only cameras on the route, in order, leaving out ones facing across it', () => {
    expect(onRoute.map((c) => c.id)).toEqual(['on', 'untagged']);
    expect(onRoute[0].along).toBeCloseTo(900, -1);
    expect(onRoute[1].along).toBeCloseTo(1900, -1);
  });

  test('alerts within about half a mile ahead', () => {
    expect(camerasAhead(onRoute, 0).map((c) => c.id)).toEqual([]);
    expect(camerasAhead(onRoute, 200).map((c) => c.id)).toEqual(['on']);
    expect(camerasAhead(onRoute, 950).map((c) => c.id)).toEqual([]);
  });

  test('the limit and the red state come from the camera ahead', () => {
    const limit = activeLimit({}, camerasAhead(onRoute, 500));
    expect(limit).toEqual({ mph: 30, source: 'camera' });
    expect(isOver(13.4, limit)).toBe(false); // 30 mph
    expect(isOver(14.0, limit)).toBe(true); // 31 mph
    expect(isOver(null, limit)).toBe(false);
    expect(activeLimit({}, [])).toBeNull();
  });

  const zonePath = [offset(P.corner2, 0, 200), offset(P.corner2, 0, 1200), offset(P.corner2, 0, 2200)];
  const box = { south: zonePath[0].lat, north: zonePath[2].lat, west: P.corner2.lng, east: P.corner2.lng };
  const zones: AverageZone[] = [
    { id: 'z0', mph: 50, path: zonePath, box },
    { id: 'zBackwards', mph: 40, path: [...zonePath].reverse(), box },
  ];

  test('zones driven in their own direction, with where they start and end', () => {
    const zs = zonesOnRoute(route, zones);
    expect(zs.map((z) => z.id)).toEqual(['z0']);
    expect(zs[0].startAlong).toBeCloseTo(3300, -1);
    expect(zs[0].endAlong).toBeCloseTo(5300, -1);
    expect(zoneStatus(zs, 3000).ahead?.id).toBe('z0');
    expect(zoneStatus(zs, 3500).inside?.id).toBe('z0');
    expect(zoneStatus(zs, 5400)).toEqual({});
    expect(activeLimit(zoneStatus(zs, 3500), [])).toEqual({ mph: 50, source: 'zone' });
  });

  test('your average through the zone so far', () => {
    const run = { zoneId: 'z0', enteredAlong: 3300, enteredAt: 0 };
    expect(zoneAverageMph(run, 3310, 2000)).toBeNull();
    // 1000 m in 50 s is 20 m/s, about 45 mph.
    expect(zoneAverageMph(run, 4300, 50_000)).toBe(45);
  });
});
