import { buildRoute, METRES_PER_MILE, metresBetween, type NavRoute } from '../src/lib/nav';
import {
  alertText,
  answerProblem,
  applyAnswer,
  closureAhead,
  demoReports,
  detourCandidates,
  dropViaArrivals,
  extendedExpiry,
  isBlockingClosure,
  KIND_INFO,
  newReport,
  offsetPoint,
  promptText,
  REPORT_GRID,
  reportAge,
  reportAlertDue,
  reportProblem,
  reportsFor,
  reportsOnRoute,
  roadRepFrom,
  ROAD_CLOSED_WARNING,
  routeAvoids,
  roughDistance,
  snapPoint,
  stillTherePrompt,
  withVias,
  type RoadReport,
} from '../src/lib/roadReports';
import { createLocalRoads, EMPTY_DEMO_ROADS, settleDemo, type DemoRoadState } from '../src/lib/roadService';
import { repLedger } from '../src/lib/rep';
import type { LatLng } from '../src/lib/types';

const NOW = new Date('2026-11-17T21:00:00Z');
const min = (n: number) => new Date(NOW.getTime() + n * 60_000);
/** About `m` metres north of a point. */
const north = (p: LatLng, m: number): LatLng => ({ lat: p.lat + m / 111_195, lng: p.lng });
const east = (p: LatLng, m: number): LatLng => ({ lat: p.lat, lng: p.lng + m / (111_195 * Math.cos((p.lat * Math.PI) / 180)) });

const START: LatLng = { lat: 52.6, lng: -1.7 };

function report(over: Partial<RoadReport> = {}): RoadReport {
  return {
    id: 'r1', kind: 'crash', at: north(START, 2000), heading: null, createdAt: min(-10).toISOString(), expiresAt: min(110).toISOString(),
    status: 'active', confirmCount: 0, clearCount: 0, mine: false, myVote: null, source: 'user', ...over,
  };
}

/** A straight road due north from START, `m` metres long, points every ~50 m. */
function straightRoute(m = 4500): NavRoute {
  const coords: number[] = [];
  for (let d = 0; d <= m; d += 50) {
    const p = north(START, d);
    coords.push(p.lat, p.lng);
  }
  return buildRoute({ coords, distance: m, time: m / 20, steps: [], legs: [{ endIndex: coords.length / 2 - 1, distance: m, time: m / 20 }] });
}

describe('what shows where (police only in the driving view)', () => {
  it('has the seven kinds in the grid, police labelled "Police / speed check"', () => {
    expect(REPORT_GRID).toEqual(['crash', 'hazard', 'roadworks', 'closure', 'traffic', 'mobile_camera', 'police']);
    expect(KIND_INFO.police.label).toBe('Police / speed check');
  });

  it('expires by kind: police 30 min, cameras 60, traffic 30, hazards and crashes 2 h, works and closures 24 h', () => {
    const ttl = Object.fromEntries(REPORT_GRID.map((k) => [k, KIND_INFO[k].ttlMin]));
    expect(ttl).toEqual({ police: 30, mobile_camera: 60, traffic: 30, hazard: 120, crash: 120, roadworks: 1440, closure: 1440 });
  });

  it('never shows police on the map, only in the driving view, and only within 10 miles there', () => {
    const police = report({ id: 'p', kind: 'police', at: START });
    const crash = report({ id: 'c' });
    expect(reportsFor([police, crash], 'map', NOW).map((r) => r.id)).toEqual(['c']);
    expect(reportsFor([police, crash], 'driving', NOW).map((r) => r.id)).toEqual(['p', 'c']);
    expect(reportsFor([police], 'driving', NOW, north(START, 9 * METRES_PER_MILE))).toHaveLength(1);
    expect(reportsFor([police], 'driving', NOW, north(START, 11 * METRES_PER_MILE))).toHaveLength(0);
  });

  it('drops expired and cleared reports', () => {
    expect(reportsFor([report({ expiresAt: min(-1).toISOString() })], 'map', NOW)).toHaveLength(0);
    expect(reportsFor([report({ status: 'cleared' })], 'map', NOW)).toHaveLength(0);
  });

  it('says how old a report is', () => {
    expect(reportAge(NOW.toISOString(), NOW)).toBe('just now');
    expect(reportAge(min(-12).toISOString(), NOW)).toBe('12 min ago');
    expect(reportAge(min(-130).toISOString(), NOW)).toBe('2 h ago');
    expect(reportAge(min(-60 * 30).toISOString(), NOW)).toBe('1 day ago');
  });

  it('keeps points to about 10 m', () => {
    expect(snapPoint({ lat: 52.486234, lng: -1.890467 })).toEqual({ lat: 52.4862, lng: -1.8905 });
  });
});

describe('the rules (same as the server)', () => {
  const here = START;
  it('only reports within half a mile of where you are, in the UK', () => {
    expect(reportProblem([], here, here, NOW)).toBeNull();
    expect(reportProblem([], north(here, 0.6 * METRES_PER_MILE), here, NOW)).toBe('You can only report within half a mile of where you are.');
    expect(reportProblem([], here, null, NOW)).toBe('Reporting needs your current location.');
    expect(reportProblem([], { lat: 48.85, lng: 2.35 }, { lat: 48.85, lng: 2.35 }, NOW)).toBe('Reports are for UK roads only.');
  });

  it('allows one report every 2 minutes and 30 a day', () => {
    expect(reportProblem([min(-1).toISOString()], here, here, NOW)).toMatch(/just sent a report/);
    expect(reportProblem([min(-3).toISOString()], here, here, NOW)).toBeNull();
    const thirty = Array.from({ length: 30 }, (_, i) => min(-5 - i * 20).toISOString());
    expect(reportProblem(thirty, here, here, NOW)).toMatch(/most reports for one day/);
  });

  it('answers: not your own, once, within a mile, not open data', () => {
    const r = report({ at: here });
    expect(answerProblem(r, here, NOW)).toBeNull();
    expect(answerProblem({ ...r, mine: true }, here, NOW)).toBe("You can't confirm your own report.");
    expect(answerProblem({ ...r, myVote: 'gone' }, here, NOW)).toBe("You've already answered for this one.");
    expect(answerProblem(r, north(here, 1.2 * METRES_PER_MILE), NOW)).toBe('You need to be within a mile of the report to answer.');
    expect(answerProblem({ ...r, expiresAt: min(-1).toISOString() }, here, NOW)).toBe('That report has already expired.');
    expect(answerProblem({ ...r, source: 'tfl' }, here, NOW)).toMatch(/open data/);
  });

  it('"still there" extends a report from now, up to the cap; police never past 30 minutes', () => {
    const crash = report({ createdAt: min(-60).toISOString(), expiresAt: min(60).toISOString() });
    expect(extendedExpiry(crash, NOW)).toBe(min(120).toISOString());
    const old = report({ createdAt: min(-210).toISOString(), expiresAt: min(10).toISOString() });
    expect(extendedExpiry(old, NOW)).toBe(min(30).toISOString());
    const police = report({ kind: 'police', createdAt: min(-20).toISOString(), expiresAt: min(10).toISOString() });
    expect(applyAnswer(police, 'still_there', NOW).expiresAt).toBe(min(10).toISOString());
  });

  it('clears after two "gone" in a row; a "still there" in between starts again', () => {
    let r = applyAnswer(report(), 'gone', NOW, false);
    expect(r.status).toBe('active');
    r = applyAnswer(r, 'still_there', NOW, false);
    r = applyAnswer(r, 'gone', NOW, false);
    expect(r.status).toBe('active');
    r = applyAnswer(r, 'gone', NOW, false);
    expect(r.status).toBe('cleared');
    expect(r.clearCount).toBe(3);
    expect(r.confirmCount).toBe(1);
  });
});

describe('rep', () => {
  it('pays +10 per confirmed report (5 a day) and +2 per answer (10 a day)', () => {
    const day = (h: number) => `2026-11-17T${String(h).padStart(2, '0')}:00:00.000Z`;
    const rep = roadRepFrom(Array.from({ length: 7 }, (_, i) => day(10 + i)), Array.from({ length: 12 }, (_, i) => day(i)));
    expect(rep).toEqual({ reportsConfirmed: 7, reportedRep: 50, reportsChecked: 12, checkedRep: 20 });
    expect(roadRepFrom([day(10), '2026-11-18T10:00:00.000Z'], []).reportedRep).toBe(20);
  });

  it('shows "Road reports confirmed" in the rep ledger, and nothing without confirmations', () => {
    const base = { events: [], spots: [], builds: [], awards: [], now: NOW };
    const none = repLedger('me', base);
    expect(none.lines.find((l) => l.source === 'roadReports')).toMatchObject({ label: 'Road reports confirmed', count: 0, rep: 0 });
    const some = repLedger('me', { ...base, roadRep: { reportsConfirmed: 2, reportedRep: 20, reportsChecked: 3, checkedRep: 6 } });
    expect(some.lines.find((l) => l.source === 'roadReports')).toMatchObject({ count: 2, rep: 20 });
    expect(some.lines.find((l) => l.source === 'roadChecks')).toMatchObject({ label: 'Road reports checked', count: 3, rep: 6 });
    expect(some.total).toBe(26);
  });
});

describe('the driving view: alerts ahead', () => {
  const route = straightRoute();

  it('finds reports on the route, in order, and leaves out ones off it', () => {
    const near = report({ id: 'a', at: east(north(START, 1500), 15) });
    const far = report({ id: 'b', at: north(START, 3000) });
    const off = report({ id: 'c', at: east(north(START, 2000), 300) });
    const on = reportsOnRoute(route, [far, off, near]);
    expect(on.map((x) => x.report.id)).toEqual(['a', 'b']);
    expect(on[0].along).toBeGreaterThan(1450);
    expect(on[0].along).toBeLessThan(1550);
  });

  it('leaves out a report made heading the other way (the other carriageway)', () => {
    const southbound = report({ heading: 180 });
    const northbound = report({ id: 'n', heading: 5 });
    expect(reportsOnRoute(route, [southbound, northbound]).map((x) => x.report.id)).toEqual(['n']);
  });

  it('alerts once, within about three quarters of a mile: "Crash reported ahead, half a mile"', () => {
    const on = reportsOnRoute(route, [report()]);
    expect(reportAlertDue(on, 0, new Set())).toBeNull();
    const due = reportAlertDue(on, 2000 - 800, new Set());
    expect(due?.report.id).toBe('r1');
    expect(alertText(due!, 2000 - 800)).toEqual({ spoken: 'Crash reported ahead, half a mile', banner: 'CRASH REPORTED AHEAD · 0.5 MI' });
    expect(reportAlertDue(on, 1200, new Set(['r1']))).toBeNull();
    expect(reportAlertDue(on, 2100, new Set())).toBeNull();
  });

  it('says open-data closures without "reported"', () => {
    const on = reportsOnRoute(route, [report({ kind: 'closure', source: 'tfl', fullClosure: true })]);
    expect(alertText(on[0], 1600).spoken).toBe('Road closure ahead, a quarter of a mile');
  });

  it('speaks distances roughly', () => {
    expect(roughDistance(800)).toBe('half a mile');
    expect(roughDistance(400)).toBe('a quarter of a mile');
    expect(roughDistance(1609)).toBe('1 mile');
    expect(roughDistance(150)).toBe('150 yards');
  });
});

describe('the driving view: "Still there?"', () => {
  const route = straightRoute();
  const on = (r: RoadReport) => reportsOnRoute(route, [r]);

  it('asks just after you pass someone else\'s report', () => {
    const r = report();
    expect(stillTherePrompt(on(r), 1990, new Set(), NOW)).toBeNull();
    expect(stillTherePrompt(on(r), 2050, new Set(), NOW)?.id).toBe('r1');
    expect(stillTherePrompt(on(r), 2600, new Set(), NOW)).toBeNull();
    expect(promptText(r)).toBe('Crash still there?');
    expect(promptText(report({ kind: 'police' }))).toBe('Police check still there?');
  });

  it("doesn't ask about your own, one you answered, one already asked, or open data", () => {
    expect(stillTherePrompt(on(report({ mine: true })), 2050, new Set(), NOW)).toBeNull();
    expect(stillTherePrompt(on(report({ myVote: 'gone' })), 2050, new Set(), NOW)).toBeNull();
    expect(stillTherePrompt(on(report()), 2050, new Set(['r1']), NOW)).toBeNull();
    expect(stillTherePrompt(on(report({ source: 'tfl' })), 2050, new Set(), NOW)).toBeNull();
  });
});

describe('closures and rerouting', () => {
  const route = straightRoute();
  const closureAt = north(START, 2500);

  it('a driver\'s closure blocks once 2 others confirm it; open data when the whole road is shut', () => {
    expect(isBlockingClosure(report({ kind: 'closure', confirmCount: 1 }))).toBe(false);
    expect(isBlockingClosure(report({ kind: 'closure', confirmCount: 2 }))).toBe(true);
    expect(isBlockingClosure(report({ kind: 'closure', source: 'tfl', fullClosure: true }))).toBe(true);
    expect(isBlockingClosure(report({ kind: 'roadworks', source: 'national_highways', fullClosure: false }))).toBe(false);
    expect(isBlockingClosure(report({ kind: 'crash', confirmCount: 5 }))).toBe(false);
  });

  it('finds the closure ahead on this leg only', () => {
    const c = report({ id: 'x', kind: 'closure', confirmCount: 2, at: closureAt });
    const on = reportsOnRoute(route, [c]);
    expect(closureAhead(on, 1000, route.length, NOW)?.report.id).toBe('x');
    expect(closureAhead(on, 1000, 2000, NOW)).toBeNull();
    expect(closureAhead(on, 2600, route.length, NOW)).toBeNull();
  });

  it('checks a new route keeps 100 m clear of the closure', () => {
    const c = report({ kind: 'closure', confirmCount: 2, at: closureAt });
    expect(routeAvoids(route.coords, c)).toBe(false);
    // Round it: out 500 m east before the closure, north past it, back.
    const round = [START, north(START, 2000), east(north(START, 2000), 500), east(north(START, 3000), 500), north(START, 3000), north(START, 4500)];
    expect(routeAvoids(round, c)).toBe(true);
    // A detour that cuts back too close isn't good enough.
    const close = [START, north(START, 2000), east(north(START, 2500), 80), north(START, 3000)];
    expect(routeAvoids(close, c)).toBe(false);
  });

  it('checks every point of an open-data closed stretch', () => {
    const stretch = report({ kind: 'closure', source: 'tfl', at: north(START, 2600), path: [east(north(START, 2400), 300), east(north(START, 2600), 300)] });
    expect(routeAvoids(route.coords, stretch)).toBe(true);
    expect(routeAvoids([east(north(START, 2400), 250), north(START, 4000)], stretch)).toBe(false);
  });

  it('offers detour points square to the road, either side, near first', () => {
    const cands = detourCandidates(route, 2500);
    expect(cands).toHaveLength(6);
    const d0 = metresBetween(cands[0], closureAt);
    expect(d0).toBeGreaterThan(480);
    expect(d0).toBeLessThan(520);
    // Road runs north: the first is west, the second east, at the closure's latitude.
    expect(cands[0].lng).toBeLessThan(closureAt.lng);
    expect(cands[1].lng).toBeGreaterThan(closureAt.lng);
    expect(Math.abs(cands[0].lat - closureAt.lat)).toBeLessThan(0.0005);
    expect(metresBetween(cands[4], closureAt)).toBeGreaterThan(1700);
  });

  it('puts the detour point in before the next stop and says nothing on arriving there', () => {
    const pts = [START, north(START, 3000), north(START, 6000)];
    const v = offsetPoint(north(START, 1500), 90, 500);
    expect(withVias(pts, [0, 1], [v])).toEqual({ points: [START, v, north(START, 3000), north(START, 6000)], legStops: [-1, 0, 1] });
    expect(withVias(pts, [0, 1], [])).toEqual({ points: pts, legStops: [0, 1] });
    const r = buildRoute({
      coords: [START.lat, START.lng, v.lat, v.lng, north(START, 3000).lat, north(START, 3000).lng],
      distance: 4000, time: 300,
      steps: [
        { text: 'Arrive at the destination', notice: '', distance: 0, lat: v.lat, lng: v.lng, index: 1, leg: 0 },
        { text: 'Turn left onto Mill Lane', notice: '', distance: 100, lat: v.lat, lng: v.lng, index: 1, leg: 1 },
        { text: 'Arrive at the destination', notice: '', distance: 0, lat: 0, lng: 0, index: 2, leg: 1 },
      ],
      legs: [{ endIndex: 1, distance: 2000, time: 150 }, { endIndex: 2, distance: 2000, time: 150 }],
    }, ['', 'Car park']);
    expect(dropViaArrivals(r, [-1, 0]).steps.map((s) => s.text)).toEqual(['Turn left onto Mill Lane', 'Arrive at Car park']);
  });

  it('has the diversion warning', () => {
    expect(ROAD_CLOSED_WARNING).toBe('Road closed ahead — follow diversion signs');
  });
});

describe('the demo', () => {
  it('lays out sample reports around home, police among them but never on the map', () => {
    const samples = demoReports(START, NOW);
    expect(samples.length).toBeGreaterThanOrEqual(6);
    expect(samples.some((r) => r.kind === 'police')).toBe(true);
    expect(reportsFor(samples, 'map', NOW).some((r) => r.kind === 'police')).toBe(false);
    expect(samples.every((r) => metresBetween(r.at, START) < 4 * METRES_PER_MILE)).toBe(true);
    // A confirmed closure to try rerouting with.
    expect(samples.some((r) => isBlockingClosure(r))).toBe(true);
  });

  it('reports, rate-limits, answers and pays rep on the phone', async () => {
    let state: DemoRoadState = EMPTY_DEMO_ROADS;
    let now = NOW;
    const roads = createLocalRoads({ get: () => state, set: (s) => (state = s), home: () => START, me: 'me', now: () => now });
    const near = await roads.near(START, 5, 'map');
    expect(near.length).toBeGreaterThan(3);
    expect(near.some((r) => r.kind === 'police')).toBe(false);
    expect((await roads.near(START, 5, 'driving')).some((r) => r.kind === 'police')).toBe(true);

    const { id } = await roads.report('hazard', START, 10, START);
    await expect(roads.report('crash', START, null, START)).rejects.toThrow(/just sent a report/);
    await expect(roads.report('crash', north(START, 1500), null, START)).rejects.toThrow(/half a mile/);
    await expect(roads.answer(id, 'still_there', START)).rejects.toThrow("You can't confirm your own report.");

    const sample = near.find((r) => r.kind === 'crash')!;
    await expect(roads.answer(sample.id, 'still_there', north(START, 20 * METRES_PER_MILE))).rejects.toThrow(/within a mile/);
    await roads.answer(sample.id, 'still_there', sample.at);
    await expect(roads.answer(sample.id, 'gone', sample.at)).rejects.toThrow(/already answered/);
    expect((await roads.rep(['me'])).me).toEqual({ reportsConfirmed: 0, reportedRep: 0, reportsChecked: 1, checkedRep: 2 });

    // Two sample drivers confirm your report 20 s later.
    now = new Date(NOW.getTime() + 25_000);
    const mine = (await roads.near(START, 5, 'map')).find((r) => r.id === id)!;
    expect(mine.confirmCount).toBe(2);
    expect((await roads.rep(['me', 'someone'])).me).toEqual({ reportsConfirmed: 1, reportedRep: 10, reportsChecked: 1, checkedRep: 2 });
  });

  it('lays the samples out again once most have run out', () => {
    const s = settleDemo(EMPTY_DEMO_ROADS, START, NOW);
    const later = new Date(NOW.getTime() + 6 * 3600_000);
    const again = settleDemo(s, START, later);
    expect(again.samples).not.toBe(s.samples);
    expect(again.samples.filter((r) => reportsFor([r], 'driving', later).length).length).toBeGreaterThanOrEqual(6);
  });

  it('lays the samples out again round a new home area', () => {
    const s = settleDemo(EMPTY_DEMO_ROADS, START, NOW);
    const moved = { lat: 53.48, lng: -2.24 };
    const again = settleDemo(s, moved, NOW);
    expect(again.samplesAround).toEqual(moved);
    expect(again.samples.every((r) => metresBetween(r.at, moved) < 4 * METRES_PER_MILE)).toBe(true);
    expect(settleDemo(again, moved, NOW)).toBe(again);
  });

  it('makes reports that start unconfirmed, snapped, with their time to live', () => {
    const r = newReport('x', 'mobile_camera', { lat: 52.123456, lng: -1.987654 }, 359.7, NOW);
    expect(r).toMatchObject({ at: { lat: 52.1235, lng: -1.9877 }, heading: 0, confirmCount: 0, mine: true, expiresAt: min(60).toISOString() });
  });
});
