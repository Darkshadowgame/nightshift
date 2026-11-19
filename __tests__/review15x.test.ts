import fixture from './fixtures/nav-route-two-legs.json';
import { coverTitle } from '../src/lib/format';
import { eventPrimary, RESULTS_IN, statusLine } from '../src/lib/eventAction';
import { DEFAULT_FILTER } from '../src/lib/invites';
import { buildRoute, metresBetween, pointAlong, routeAhead } from '../src/lib/nav';
import type { Build, NightEvent } from '../src/lib/types';

/** Review 15 (X): the vote status in the demo, the cover title, the drive line. */
const start = new Date('2026-11-20T22:00:00Z');
const at = (mins: number) => new Date(start.getTime() + mins * 60_000);
const event: NightEvent = {
  id: 'e', type: 'meet', title: 'Meet', startsAt: start.toISOString(), endsAt: at(180).toISOString(),
  area: { lat: 52.6, lng: -1.7 }, areaName: 'Midlands',
  stops: [{ id: 's', name: 'Spot', at: { lat: 52.62, lng: -1.72 } }], currentStop: 0, revealMinutesBefore: 60,
  hostIds: ['host'], filter: DEFAULT_FILTER, going: ['host', 'me'], checkIns: { me: ['s'] },
};
const build = (id: string, ownerId: string): Build => ({ id, ownerId, kind: 'car', make: 'Make', model: id, stockBhp: 300, weightKg: 1400, photos: [], mods: [] });
const builds = [build('a', 'me'), build('b', 'host')];

describe('the vote status line in the demo (decision 2)', () => {
  test('before voting: how many trophies; after: results are in; never a time it will not keep', () => {
    const vote = eventPrimary(event, 'me', 'going', [], builds, at(10));
    expect(vote.kind).toBe('vote');
    const before = statusLine(event, vote, { me: 'me', crews: [], builds, users: [], votes: [], now: at(10), demo: true, trophies: 3 });
    expect(before.note).toBe('Vote for 3 trophies.');
    const v = [{ eventId: 'e', voterId: 'me', category: 'best-in-show' as const, buildId: 'b', at: at(20).toISOString() }];
    const voted = eventPrimary(event, 'me', 'going', [], builds, at(20), v);
    // Voting not over for you yet (Review 17): no "Results are in." and no "Results tomorrow 23:00";
    // the "1 of 3 voted" row says where you are.
    expect(statusLine(event, voted, { me: 'me', crews: [], builds, users: [], votes: v, now: at(20), demo: true }).note).toBeUndefined();
    // Every trophy voted, or Done: the results are in.
    expect(statusLine(event, voted, { me: 'me', crews: [], builds, users: [], votes: v, now: at(20), demo: true, resultsIn: true }).note).toBe(RESULTS_IN);
  });
  test('ended with results: the winner is on the cover, not in the line', () => {
    const v = [1, 2, 3].map((n) => ({ eventId: 'e', voterId: `v${n}`, category: 'best-in-show' as const, buildId: 'b', at: at(20).toISOString() }));
    const later = at(60 * 30);
    const ended = eventPrimary({ ...event, checkIns: {} }, 'me', 'going', [], builds, later, v);
    const line = statusLine({ ...event, checkIns: {} }, ended, { me: 'me', crews: [], builds, users: [], votes: v, now: later });
    expect(line.text).not.toMatch(/Best in show|@/);
  });
});

describe('coverTitle (decision 3)', () => {
  test('make and model each stay whole, so the only break is between them', () => {
    const t = coverTitle('Hyundai', 'i30 N', 178, 24);
    expect(t.text).toBe('Hyundai i30 N');
    expect(t.text.split(' ')).toEqual(['Hyundai', 'i30 N']);
    expect(coverTitle('Land Rover', 'Defender 110', 178, 24).text).toBe('Land Rover Defender 110');
    expect(coverTitle('Yamaha', 'YZF-R6', 178, 24).text).toBe('Yamaha YZF‑R6');
  });
  test('a long model shrinks to fit its line, with room for 1.3x text', () => {
    expect(coverTitle('Hyundai', 'i30 N', 178, 24).size).toBe(24);
    const long = coverTitle('BMW', 'M4 Competition', 178, 24);
    expect(long.size).toBeLessThan(24);
    expect(14 * 0.56 * 1.3 * long.size).toBeLessThanOrEqual(178);
  });
});

describe('routeAhead (problem 13)', () => {
  const route = buildRoute(fixture as never, ['A', 'B']);
  test('starts where you are and keeps only the way ahead', () => {
    expect(routeAhead(route, 0)).toBe(route.coords);
    const along = route.length / 2;
    const ahead = routeAhead(route, along);
    expect(metresBetween(ahead[0], pointAlong(route, along).at)).toBeLessThan(1);
    expect(ahead[ahead.length - 1]).toEqual(route.coords[route.coords.length - 1]);
    expect(ahead.length).toBeLessThan(route.coords.length);
    expect(routeAhead(route, route.length + 10)).toEqual([]);
  });
});
