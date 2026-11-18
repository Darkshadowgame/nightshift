import { buildRoute, type RawRouteLike } from '../src/lib/nav';
import { applyAnswer, type RoadReport } from '../src/lib/roadReports';
import { defaultChoice, routeCards, troubleLines, type RouteOption } from '../src/lib/routeChoice';

const NOW = new Date('2026-11-20T21:00:00Z');

/** A straight raw route along latitude `lat` from lng a to lng b. */
function raw(lat: number, a: number, b: number): RawRouteLike {
  const coords: number[] = [];
  for (let i = 0; i <= 20; i++) coords.push(lat, a + ((b - a) * i) / 20);
  return { coords, distance: 0, time: 0, steps: [], legs: [{ endIndex: 20, distance: 0, time: 0 }] };
}
const option = (lat: number, time: number, name: string): RouteOption => ({ route: buildRoute(raw(lat, -1.7, -1.6)), name, time, distance: 7000, advisories: [] });

function report(id: string, kind: RoadReport['kind'], lat: number, extra: Partial<RoadReport> = {}): RoadReport {
  return {
    id, kind, at: { lat, lng: -1.65 }, heading: null, createdAt: '2026-11-20T20:30:00Z', expiresAt: '2026-11-21T20:30:00Z',
    status: 'active', confirmCount: 0, clearCount: 0, mine: false, myVote: null, source: 'national_highways', fullClosure: true, ...extra,
  };
}

describe('route cards', () => {
  const m6 = option(52.6, 18 * 60, 'M6');
  const a5 = option(52.65, 21 * 60, 'A5');
  test('the quickest is "Fastest", the others "via" their road', () => {
    const cards = routeCards([m6, a5], [], NOW);
    expect(cards.map((c) => c.title)).toEqual(['Fastest · 18 min', 'via A5 · 21 min']);
    expect(cards.map((c) => c.note)).toEqual([null, null]);
  });
  test('a route that avoids a closure on another says so, and is picked first', () => {
    const closed = report('c1', 'closure', 52.6, { road: 'M6' });
    const cards = routeCards([m6, a5], [closed], NOW);
    expect(cards[0].note).toBe('M6 closed on this route');
    expect(cards[0].tone).toBe('bad');
    expect(cards[1].note).toBe('Avoids the M6 closure');
    expect(cards[1].tone).toBe('good');
    expect(defaultChoice(cards, [m6, a5])).toBe(1);
  });
  test('traffic counts too, after closures', () => {
    const jam = report('t1', 'traffic', 52.6, { source: 'user' });
    const cards = routeCards([m6, a5], [jam], NOW);
    expect(cards[0].note).toBe('Traffic reported on this route');
    expect(cards[1].note).toBe('Avoids reported traffic');
    // Traffic doesn't change the pick: the fastest stays.
    expect(defaultChoice(cards, [m6, a5])).toBe(0);
  });
  test("a driver's closure counts once two others confirm it", () => {
    let r = report('u1', 'closure', 52.6, { source: 'user', fullClosure: undefined });
    expect(routeCards([m6, a5], [r], NOW)[1].note).toBeNull();
    for (let i = 0; i < 2; i++) r = applyAnswer(r, 'still_there', NOW, false);
    expect(routeCards([m6, a5], [r], NOW)[1].note).toBe('Avoids a reported closure');
  });
  test('two routes with the same name are numbered; expired reports are ignored', () => {
    const old = report('x', 'closure', 52.6, { expiresAt: '2026-11-20T20:00:00Z' });
    expect(routeCards([m6, option(52.65, 25 * 60, 'M6'), option(52.7, 30 * 60, 'M6')], [old], NOW).map((c) => c.title)).toEqual([
      'Fastest · 18 min',
      'Route 2 · 25 min',
      'Route 3 · 30 min',
    ]);
  });
  test('one route: one card, and the reports on it as lines', () => {
    expect(routeCards([m6], [report('c', 'closure', 52.6)], NOW)[0].note).toBe('Road closed on this route');
    expect(troubleLines(m6.route, [report('k', 'crash', 52.6, { source: 'user' })], NOW)).toEqual(['Crash reported · 2.1 mi along']);
  });
});
