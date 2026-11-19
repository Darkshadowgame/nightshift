/**
 * Rep for using the app (owner decision, 19 Nov 2026): +5 for a finished in-app navigation
 * (2 miles, 3 minutes, a plausible pace, 3 a day) and +2 for posting a road report (10 a day),
 * -2 for one cleared as wrong (never below 0), the toasts, and the server switch-over.
 */
import { addTripFix, judgeTrip, NAV_RULES, navRepFrom, navRepNow, NEW_TRIP, repToast, tripProblem, type NavTrip } from '../src/lib/navRep';
import { METRES_PER_MILE } from '../src/lib/nav';
import { applyAnswer, clearedAsWrong, newReport, postRepNow, roadRepFrom, roadReportsLine, ROAD_RULES } from '../src/lib/roadReports';
import { createLocalRoads, EMPTY_DEMO_ROADS, type DemoRoadState } from '../src/lib/roadService';
import { createRemoteRoads, serverHasNavRep } from '../src/lib/backend/roads';
import { HOW_TO_EARN as EARN, repLedger } from '../src/lib/rep';
import type { LatLng } from '../src/lib/types';

const NOW = new Date('2026-11-19T20:00:00Z');
const START: LatLng = { lat: 52.4862, lng: -1.8904 };
/** `m` metres north of a point. */
const north = (p: LatLng, m: number): LatLng => ({ lat: p.lat + m / 111_195, lng: p.lng });

/** A drive north at `mps` for `seconds`, one fix a second. */
function drive(mps: number, seconds: number, from = START): NavTrip {
  let t = NEW_TRIP;
  for (let s = 0; s <= seconds; s++) t = addTripFix(t, north(from, mps * s), NOW.getTime() + s * 1000, 5);
  return t;
}

describe('navigation: does the trip count?', () => {
  it('counts 2+ miles over 3+ minutes at a plausible pace', () => {
    // 15 m/s (about 34 mph) for 5 minutes: 4,500 m, 2.8 miles.
    const v = judgeTrip(drive(15, 300));
    expect(v.ok).toBe(true);
    if (v.ok) {
      expect(v.trip.durationS).toBe(300);
      expect(v.trip.distanceM / METRES_PER_MILE).toBeCloseTo(2.8, 1);
    }
  });

  it("doesn't count under 2 miles, under 3 minutes, or an implausible pace", () => {
    expect(judgeTrip(drive(10, 300))).toEqual({ ok: false, why: 'short' }); // 1.9 miles
    expect(judgeTrip(drive(30, 170))).toEqual({ ok: false, why: 'quick' }); // 3.2 miles in under 3 minutes
    expect(judgeTrip(drive(34, 400))).toEqual({ ok: false, why: 'implausible' }); // about 76 mph average
    expect(judgeTrip(NEW_TRIP)).toEqual({ ok: false, why: 'none' });
  });

  it('uses the same rule as the drives check: average over the limit, never a time or speed said', () => {
    expect(NAV_RULES.maxAverageMph).toBe(70);
    const at = (miles: number, s: number) => tripProblem({ distanceM: miles * METRES_PER_MILE, durationS: s, from: START, to: north(START, miles * METRES_PER_MILE) });
    expect(at(2, 180)).toBe(null); // 40 mph
    expect(at(3.6, 180)).toBe('implausible'); // 72 mph
    expect(at(1.99, 600)).toBe('short');
    expect(at(5, 179)).toBe('quick');
    // Claiming less than the straight line between start and finish.
    expect(tripProblem({ distanceM: 4000, durationS: 600, from: START, to: north(START, 9000) })).toBe('implausible');
  });

  it('skips poor fixes and GPS jumps no car could make', () => {
    let t = addTripFix(NEW_TRIP, START, 0, 5);
    t = addTripFix(t, north(START, 5000), 1000, 5); // 5 km in a second
    expect(t.metres).toBe(0);
    t = addTripFix(t, north(START, 5020), 2000, 500); // poor accuracy: ignored
    expect(t.lastAt).toBe(1000);
    t = addTripFix(t, north(START, 5020), 2000, 5);
    expect(t.metres).toBeCloseTo(20, 0);
  });
});

describe('navigation: caps', () => {
  it('pays 5 each, 3 a day', () => {
    const day = (h: number, d = 19) => `2026-11-${d}T${String(h).padStart(2, '0')}:00:00.000Z`;
    expect(navRepFrom([day(9), day(10), day(11), day(12)])).toEqual({ navigations: 4, navigationRep: 15 });
    expect(navRepFrom([day(9), day(10), day(11), day(9, 20)]).navigationRep).toBe(20);
    expect(navRepNow([day(9), day(10)], NOW)).toBe(5);
    expect(navRepNow([day(9), day(10), day(11)], NOW)).toBe(0);
    expect(navRepNow([day(9, 18), day(10, 18), day(11, 18)], NOW)).toBe(5);
  });
});

describe('road reports: posting and wrong ones', () => {
  it('pays 2 for posting, 10 a day', () => {
    const day = (i: number) => `2026-11-19T${String(i).padStart(2, '0')}:00:00.000Z`;
    const ten = Array.from({ length: 10 }, (_, i) => day(i));
    expect(postRepNow(ten.slice(0, 9), NOW)).toBe(2);
    expect(postRepNow(ten, NOW)).toBe(0);
    expect(roadRepFrom([], [], { postedAt: [...ten, day(11), day(12)] })).toMatchObject({ reportsPosted: 12, postedRep: 20 });
  });

  it('is wrong when two clear it within 10 minutes and nobody confirmed it', () => {
    const r = newReport('r1', 'police', START, null, NOW);
    const at = (min: number) => new Date(NOW.getTime() + min * 60_000);
    const quick = applyAnswer(applyAnswer(r, 'gone', at(3), false), 'gone', at(6), false);
    expect(quick.status).toBe('cleared');
    expect(clearedAsWrong(quick)).toBe(true);
    const late = applyAnswer(applyAnswer(r, 'gone', at(5), false), 'gone', at(12), false);
    expect(clearedAsWrong(late)).toBe(false);
    const confirmed = applyAnswer(applyAnswer(applyAnswer(applyAnswer(r, 'still_there', at(1), false), 'still_there', at(2), false), 'gone', at(3), false), 'gone', at(4), false);
    expect(confirmed.status).toBe('cleared');
    expect(clearedAsWrong(confirmed)).toBe(false);
    expect(clearedAsWrong(applyAnswer(r, 'gone', at(1), false))).toBe(false);
  });

  it('takes 2 off for a wrong one, but the line never goes below 0', () => {
    const rep = roadRepFrom([], [], { postedAt: [NOW.toISOString()], wrongAt: ['a', 'b', 'c'].map(() => NOW.toISOString()) });
    expect(rep.wrongRep).toBe(-6);
    expect(roadReportsLine(rep)).toEqual({ count: 1, rep: 0 });
    // With a confirmed one too: 2 + 10 - 6.
    expect(roadReportsLine({ ...rep, reportsConfirmed: 1, reportedRep: 10 }).rep).toBe(6);
    // "Still there?" answers are their own line: a wrong report doesn't take from them.
    const ledger = repLedger('me', { events: [], spots: [], builds: [], awards: [], now: NOW, roadRep: { ...rep, reportsChecked: 2, checkedRep: 4 } });
    expect(ledger.lines.find((l) => l.source === 'roadReports')).toMatchObject({ label: 'Road reports', rep: 0 });
    expect(ledger.total).toBe(4);
  });
});

describe('what is shown', () => {
  it('toasts only when rep was paid', () => {
    expect(repToast(5, 'navigation')).toBe('+5 rep · Drive complete');
    expect(repToast(2, 'report')).toBe('+2 rep · Thanks for the report');
    expect(repToast(0, 'navigation')).toBeNull();
    expect(repToast(0, 'report')).toBeNull();
  });

  it('has Navigation and Road reports lines in the ledger, labelled demo in the demo', () => {
    const base = { events: [], spots: [], builds: [], awards: [], now: NOW };
    const rep = roadRepFrom([], [], { navigatedAt: [NOW.toISOString()], postedAt: [NOW.toISOString()] });
    const ledger = repLedger('me', { ...base, roadRep: rep });
    expect(ledger.lines.find((l) => l.source === 'navigation')).toMatchObject({ label: 'Navigation', count: 1, rep: 5 });
    expect(ledger.lines.find((l) => l.source === 'roadReports')).toMatchObject({ label: 'Road reports', count: 1, rep: 2 });
    expect(ledger.total).toBe(7);
    const demo = repLedger('me', { ...base, roadRep: { ...rep, demo: true } });
    expect(demo.lines.find((l) => l.source === 'navigation')!.label).toBe('Navigation (demo)');
  });

  it('lists both in how to earn', () => {
    const words = EARN.map((e) => `${e.what} ${e.rep}`).join('\n');
    expect(words).toMatch(/Finish a trip with directions.*\+5/);
    expect(words).toMatch(/Report traffic, police or a hazard.*\+2/);
    expect(words).toMatch(/cleared as wrong.*-2/);
  });
});

describe('the demo pays in its own ledger', () => {
  it('pays a finished simulated navigation, 3 a day, and posting', async () => {
    let state: DemoRoadState = EMPTY_DEMO_ROADS;
    let now = NOW;
    const roads = createLocalRoads({ get: () => state, set: (s) => (state = s), home: () => START, me: 'me', now: () => now });
    const trip = { distanceM: 5000, durationS: 600, from: START, to: north(START, 4000) };
    expect(await roads.navigated(trip)).toEqual({ rep: 5 });
    expect(await roads.navigated({ ...trip, distanceM: 1000 })).toEqual({ rep: 0 });
    expect(await roads.navigated(trip)).toEqual({ rep: 5 });
    expect(await roads.navigated(trip)).toEqual({ rep: 5 });
    expect(await roads.navigated(trip)).toEqual({ rep: 0 });
    const me = (await roads.rep(['me'])).me;
    expect(me).toMatchObject({ navigations: 4, navigationRep: 15, demo: true });
    now = new Date(NOW.getTime() + 86_400_000);
    expect(await roads.navigated(trip)).toEqual({ rep: 5 });
    expect((await roads.report('traffic', START, null, START)).rep).toBe(ROAD_RULES.postRep);
  });
});

describe('signed in: the server pays, once the migration is applied', () => {
  const UID = '11111111-1111-4111-8111-111111111111';
  const OLD_ROW = { user_id: UID, reports_confirmed: 0, reports_checked: 0, reported_rep: 0, checked_rep: 0 };
  const NEW_ROW = { ...OLD_ROW, reports_posted: 1, posted_rep: 2, reports_wrong: 0, wrong_rep: 0, navigations: 1, navigation_rep: 5 };
  const trip = { distanceM: 5000, durationS: 600, from: START, to: north(START, 4000) };

  function client(rows: unknown[], nav: unknown = { ok: true, rep: 5 }) {
    const calls: string[] = [];
    return {
      calls,
      client: {
        rpc: jest.fn((name: string) => {
          calls.push(name);
          if (name === 'road_rep_for') return Promise.resolve({ data: rows, error: null });
          if (name === 'complete_navigation') return Promise.resolve({ data: nav, error: null });
          return Promise.resolve({ data: null, error: null });
        }),
      },
    };
  }

  it('tells from road_rep_for whether the server has it', () => {
    expect(serverHasNavRep([OLD_ROW])).toBe(false);
    expect(serverHasNavRep([NEW_ROW])).toBe(true);
    expect(serverHasNavRep([])).toBeNull();
  });

  it('never calls complete_navigation before the migration, and quietly pays nothing', async () => {
    const c = client([OLD_ROW]);
    const roads = createRemoteRoads(c.client as never);
    expect(await roads.navigated(trip)).toEqual({ rep: 0 }); // not known yet
    await roads.rep([UID]);
    expect(await roads.navigated(trip)).toEqual({ rep: 0 });
    expect(c.calls).not.toContain('complete_navigation');
  });

  it('calls it once the server has it, and shows what it paid', async () => {
    const c = client([NEW_ROW]);
    const roads = createRemoteRoads(c.client as never);
    const rep = await roads.rep([UID]);
    expect(rep[UID]).toMatchObject({ postedRep: 2, navigations: 1, navigationRep: 5 });
    expect(await roads.navigated(trip)).toEqual({ rep: 5 });
    expect(c.calls).toContain('complete_navigation');
    const capped = client([NEW_ROW], { ok: true, rep: 0 });
    const r2 = createRemoteRoads(capped.client as never);
    await r2.rep([UID]);
    expect(await r2.navigated(trip)).toEqual({ rep: 0 });
  });
});
