import {
  advanceRun,
  approveDue,
  averageStars,
  canRate,
  canVisit,
  DEMO_APPROVAL_MS,
  draftProblem,
  driveMiles,
  judgeRun,
  longGap,
  MAX_POINT_GAP_MILES,
  makeSpot,
  NEW_RUN,
  pathMiles,
  rateSpot,
  recordCompletion,
  runExpired,
  simulatedTimes,
  statsOf,
  visibleSpots,
  type DriveRun,
} from '../src/lib/spots';
import type { BanZone, LatLng, Spot } from '../src/lib/types';

const NOW = new Date('2026-11-20T22:00:00Z');
const PATH: LatLng[] = [
  { lat: 53.444, lng: -1.929 },
  { lat: 53.4325, lng: -1.8689 },
  { lat: 53.413, lng: -1.813 },
  { lat: 53.379, lng: -1.727 },
];
const MILES = 12.4;

/** The test path with extra points on each leg, as a person would drop them along the road. */
function dense(path: LatLng[], per = 3): LatLng[] {
  const out: LatLng[] = [path[0]];
  for (let i = 1; i < path.length; i++) {
    for (let k = 1; k <= per; k++) {
      const f = k / per;
      out.push({ lat: path[i - 1].lat + (path[i].lat - path[i - 1].lat) * f, lng: path[i - 1].lng + (path[i].lng - path[i - 1].lng) * f });
    }
  }
  return out;
}
const DENSE = dense(PATH);

function drive(overrides: Partial<Spot> = {}): Spot {
  return {
    id: 'd1', kind: 'drive', name: 'Test drive', at: PATH[1], description: '', path: PATH, miles: MILES,
    authorId: 'author', status: 'approved', createdAt: NOW.toISOString(), completions: [], ratings: [], ...overrides,
  };
}

function runAt(times: number[], order = PATH): DriveRun {
  return order.reduce((run, p, i) => advanceRun(run, PATH, p, times[i]), NEW_RUN);
}

const HOUR = 3_600_000;
const t0 = NOW.getTime();

describe('drives', () => {
  test('checkpoints only count in order', () => {
    let run = advanceRun(NEW_RUN, PATH, PATH[2], t0);
    expect(run.passed).toBe(0);
    run = advanceRun(run, PATH, PATH[0], t0);
    expect(run.passed).toBe(1);
    run = advanceRun(run, PATH, PATH[2], t0 + 1000);
    expect(run.passed).toBe(1);
    run = advanceRun(run, PATH, { lat: 53.4326, lng: -1.869 }, t0 + 2000); // within 0.2 mi of checkpoint 2
    expect(run.passed).toBe(2);
  });

  test('a far-off position does not pass a checkpoint', () => {
    expect(advanceRun(NEW_RUN, PATH, { lat: 53.5, lng: -1.929 }, t0).passed).toBe(0);
  });

  test('a run at a steady legal pace passes', () => {
    const times = simulatedTimes(PATH, MILES, t0);
    expect(judgeRun(runAt(times), PATH, MILES)).toEqual({ ok: true });
  });

  test('a run that would average over 60 mph does not count, and the reason has no numbers', () => {
    const times = PATH.map((_, i) => t0 + (i * (MILES / 80) * HOUR) / (PATH.length - 1));
    const verdict = judgeRun(runAt(times), PATH, MILES);
    expect(verdict.ok).toBe(false);
    if (!verdict.ok) expect(verdict.reason).not.toMatch(/\d/);
  });

  test('averaging over 45 mph along the drawn route fails; under it passes', () => {
    const miles = pathMiles(PATH);
    const at = (mph: number) => PATH.map((_, i) => t0 + (i * (miles / mph) * HOUR) / (PATH.length - 1));
    // judge against the line itself (no stated length), as for a community drive
    expect(judgeRun(runAt(at(50)), PATH, miles).ok).toBe(false);
    expect(judgeRun(runAt(at(40)), PATH, miles).ok).toBe(true);
  });

  test("on a national-limit road the road's limit is the cap, and the wording never says anyone sped", () => {
    const miles = pathMiles(PATH);
    const at = (mph: number) => PATH.map((_, i) => t0 + (i * (miles / mph) * HOUR) / (PATH.length - 1));
    expect(judgeRun(runAt(at(52)), PATH, miles, 60).ok).toBe(true);
    const v = judgeRun(runAt(at(65)), PATH, miles, 60);
    expect(v.ok).toBe(false);
    if (!v.ok) {
      expect(v.reason).toMatch(/looks too quick to count/);
      expect(v.reason).not.toMatch(/limit|speeding|broke/i);
    }
  });

  test('the distance for the check is along the route, and a longer stated length only makes it stricter', () => {
    expect(driveMiles(drive({ miles: undefined }))).toBeCloseTo(pathMiles(PATH), 5);
    expect(driveMiles(drive({ miles: 1 }))).toBeCloseTo(pathMiles(PATH), 5);
    expect(driveMiles(drive({ miles: 99 }))).toBe(99);
  });

  test('missing a checkpoint fails', () => {
    const run = advanceRun(advanceRun(NEW_RUN, PATH, PATH[0], t0), PATH, PATH[1], t0 + HOUR / 4);
    expect(judgeRun(run, PATH, MILES).ok).toBe(false);
  });

  test('taking far too long fails', () => {
    const times = PATH.map((_, i) => t0 + i * 2 * HOUR);
    const run = runAt(times);
    expect(runExpired(run, MILES, t0 + 6 * HOUR)).toBe(true);
    const verdict = judgeRun(run, PATH, MILES);
    expect(verdict.ok).toBe(false);
    if (!verdict.ok) expect(verdict.reason).not.toMatch(/\d/);
  });

  test('completions only store the day', () => {
    const done = recordCompletion(drive(), 'me', new Date('2026-11-20T23:47:12Z'));
    expect(done.completions).toEqual([{ userId: 'me', on: '2026-11-20' }]);
    expect(JSON.stringify(done.completions)).not.toMatch(/T\d\d:/);
  });

  test('pending places cannot be completed', () => {
    expect(() => recordCompletion(drive({ status: 'pending' }), 'me', NOW)).toThrow();
  });
});

describe('ratings', () => {
  test('you have to finish it first, and authors cannot rate their own', () => {
    expect(canRate(drive(), 'me').ok).toBe(false);
    const done = recordCompletion(drive(), 'me', NOW);
    expect(canRate(done, 'me').ok).toBe(true);
    const own = recordCompletion(drive(), 'author', NOW);
    expect(canRate(own, 'author').ok).toBe(false);
    expect(() => rateSpot(own, 'author', 5)).toThrow();
  });

  test('one rating per person, the latest counts', () => {
    let s = recordCompletion(drive(), 'me', NOW);
    s = rateSpot(s, 'me', 2);
    s = rateSpot(s, 'me', 5);
    expect(s.ratings).toEqual([{ userId: 'me', stars: 5 }]);
    expect(averageStars(s)).toEqual({ average: 5, count: 1 });
    expect(() => rateSpot(s, 'me', 0)).toThrow();
  });

  test('repeat drives by one person count once for the author', () => {
    let s = recordCompletion(drive(), 'me', NOW);
    s = recordCompletion(s, 'me', NOW);
    expect(statsOf(s).completions).toEqual(['me']);
  });
});

describe('photo spots', () => {
  const spot: Spot = {
    id: 'p1', kind: 'photo', name: 'Viaduct', at: { lat: 53.387, lng: -1.724 }, description: '', authorId: 'a',
    status: 'approved', createdAt: NOW.toISOString(), completions: [], ratings: [],
  };

  test('check in within 0.2 mi, or with simulate on', () => {
    expect(canVisit(spot, { lat: 53.388, lng: -1.724 }, false).ok).toBe(true);
    expect(canVisit(spot, { lat: 53.4, lng: -1.724 }, false).ok).toBe(false);
    expect(canVisit(spot, null, false).ok).toBe(false);
    expect(canVisit(spot, null, true).ok).toBe(true);
    expect(canVisit({ ...spot, status: 'pending' }, null, true).ok).toBe(false);
  });

  test('a visit can carry a photo', () => {
    expect(recordCompletion(spot, 'me', NOW, 'file:///x.jpg').completions[0].photo).toBe('file:///x.jpg');
  });
});

describe('suggestions', () => {
  const zones: BanZone[] = [{ id: 'z', name: 'Test zone', centre: { lat: 52.48, lng: -1.89 }, radiusMiles: 4, note: '' }];

  test('drafts need a name and enough points', () => {
    expect(draftProblem({ kind: 'drive', name: 'x', description: '', points: PATH }, [])).toMatch(/name/);
    expect(draftProblem({ kind: 'drive', name: 'New road', description: '', points: [PATH[0]] }, [])).toMatch(/start and a finish/);
    expect(draftProblem({ kind: 'drive', name: 'New road', description: '', points: [PATH[0], { lat: 53.4441, lng: -1.929 }] }, [])).toMatch(/at least/);
    expect(draftProblem({ kind: 'drive', name: 'Test drive', description: '', points: PATH }, [drive()])).toMatch(/already/);
    expect(draftProblem({ kind: 'drive', name: 'New road', description: '', points: DENSE }, [])).toBeNull();
    expect(draftProblem({ kind: 'photo', name: 'New spot', description: '', points: [] }, [])).toMatch(/on the map/);
    // A photo spot needs a photo of the place with a car or bike in it.
    expect(draftProblem({ kind: 'photo', name: 'New spot', description: '', points: [{ lat: 52.4, lng: -1.8 }] }, [])).toMatch(/car or bike/);
    expect(draftProblem({ kind: 'photo', name: 'New spot', description: '', points: [{ lat: 52.4, lng: -1.8 }], photo: 'ph-x.jpg' }, [])).toBeNull();
  });

  test('drive points more than 1.5 mi apart are rejected with the reason', () => {
    expect(longGap(PATH)).not.toBeNull();
    expect(longGap(DENSE)).toBeNull();
    const problem = draftProblem({ kind: 'drive', name: 'New road', description: '', points: PATH }, []);
    expect(problem).toMatch(/Points 1 and 2 are .* mi apart/);
    expect(problem).toContain(`${MAX_POINT_GAP_MILES} mi`);
    expect(() => makeSpot({ kind: 'drive', name: 'New road', description: '', points: PATH }, 'me', NOW, 'n1', [], zones)).toThrow(/apart/);
  });

  test('a new drive starts pending, with its length measured along the route', () => {
    const { spot, warning } = makeSpot({ kind: 'drive', name: 'New road', description: '', points: DENSE }, 'me', NOW, 'n1', [], zones);
    expect(spot.status).toBe('pending');
    expect(spot.authorId).toBe('me');
    expect(spot.miles).toBeCloseTo(pathMiles(DENSE), 1);
    expect(warning).toBeUndefined();
  });

  test('a place inside a ban zone gets a warning, not a block', () => {
    const { spot, warning } = makeSpot(
      { kind: 'photo', name: 'City arches', description: '', points: [{ lat: 52.476, lng: -1.884 }], photo: 'ph-car.jpg' },
      'me', NOW, 'n2', [], zones,
    );
    expect(spot.photo).toBe('ph-car.jpg');
    expect(spot.banZone).toBe('Test zone');
    expect(warning).toMatch(/Test zone/);
  });

  test('the demo approves suggestions after a short wait', () => {
    const { spot } = makeSpot({ kind: 'drive', name: 'New road', description: '', points: DENSE }, 'me', NOW, 'n1', [], zones);
    expect(approveDue([spot], new Date(t0 + 1000))[0].status).toBe('pending');
    expect(approveDue([spot], new Date(t0 + DEMO_APPROVAL_MS))[0].status).toBe('approved');
  });

  test('other people only see approved places; authors see their own pending ones', () => {
    const pending = drive({ id: 'p', status: 'pending', authorId: 'me' });
    expect(visibleSpots([drive(), pending], 'someone').map((s) => s.id)).toEqual(['d1']);
    expect(visibleSpots([drive(), pending], 'me').map((s) => s.id)).toEqual(['d1', 'p']);
  });
});
