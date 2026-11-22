jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
import { dropOut, rsvp, checkIn } from '../src/lib/events';
import { draftFromEvent } from '../src/lib/hostDraft';
import {
  albumState, arrivalBoard, canPostToAlbum, canSeeArrivals, capacityProblem, cleanRules, copyOf, hostStats, historyLine, isFull, joinWaitlist, meetHistory,
  placesLeft, promoteWaitlist, rulesOf, seenAt, statusRow, statusSummary, waitPosition, withCoHost, withStatus,
} from '../src/lib/meetExtras';
import { DEFAULT_FILTER } from '../src/lib/invites';
import type { Build, NightEvent } from '../src/lib/types';

const T0 = new Date('2026-11-20T20:00:00Z');
const H = 3_600_000;
const iso = (ms: number) => new Date(ms).toISOString();

function ev(over: Partial<NightEvent> = {}): NightEvent {
  return {
    id: 'e1', type: 'meet', title: 'Car park meet', startsAt: iso(T0.getTime()), endsAt: iso(T0.getTime() + 3 * H),
    area: { lat: 52.5, lng: -1.8 }, areaName: 'Tamworth', stops: [{ id: 's1', name: 'Car park', at: { lat: 52.5, lng: -1.8 } }], currentStop: 0,
    revealMinutesBefore: 60, hostIds: ['host'], filter: { ...DEFAULT_FILTER, everyone: true }, going: ['host'], checkIns: {}, ...over,
  };
}
const build = (id: string, owner: string): Build => ({ id, ownerId: owner, kind: 'car', make: 'Mazda', model: 'MX-5', photos: [] }) as unknown as Build;
const at = (h: number) => new Date(T0.getTime() + h * H);

describe('album window', () => {
  const e = ev();
  test('runs from 30 minutes before the start to 48 hours after the end', () => {
    const a = albumState(e, at(0));
    expect(a.from.getTime()).toBe(T0.getTime() - 30 * 60_000);
    expect(a.closesAt.getTime()).toBe(T0.getTime() + 3 * H + 48 * H);
    expect(a.closed).toBe(false);
    expect(albumState(e, at(3 + 48)).closed).toBe(true);
  });
  test('only people who turned up (or hosts) add photos, and not once it closes', () => {
    const went = ev({ going: ['host', 'a'], checkIns: { a: ['s1'] } });
    expect(canPostToAlbum(went, 'a', [], at(10))).toBe(true);
    expect(canPostToAlbum(went, 'a', [], at(3 + 47))).toBe(true);
    expect(canPostToAlbum(went, 'a', [], at(3 + 49))).toBe(false);
    expect(canPostToAlbum(went, 'b', [], at(10))).toBe(false);
    expect(canPostToAlbum(went, 'host', [], at(1))).toBe(true);
    expect(canPostToAlbum(went, 'a', [], at(-2))).toBe(false);
    expect(canPostToAlbum({ ...went, cancelled: true }, 'a', [], at(1))).toBe(false);
  });
});

describe('arrival board and seen at', () => {
  const builds = [build('b1', 'a'), build('b2', 'b'), build('b3', 'c')];
  const e = ev({
    going: ['host', 'a', 'b', 'c'],
    vehicles: { a: 'b1', b: 'b2', c: 'b3' },
    checkIns: { a: ['s1'], b: ['s1'], c: ['s1'] },
    arrivals: { a: iso(T0.getTime()), b: iso(T0.getTime() + H), c: iso(T0.getTime() + 2 * H) },
  });
  test('most recent arrival first', () => {
    expect(arrivalBoard(e, builds).map((x) => x.userId)).toEqual(['c', 'b', 'a']);
  });
  test('people with no recorded time come after the timed ones', () => {
    const old = ev({ ...e, arrivals: { b: iso(T0.getTime()) } });
    const ids = arrivalBoard(old, builds).map((x) => x.userId);
    expect(ids[0]).toBe('b');
    expect(ids).toHaveLength(3);
  });
  test('seen at lists the vehicles that were there, each once', () => {
    expect(seenAt(e, builds).map((b) => b.id).sort()).toEqual(['b1', 'b2', 'b3']);
    expect(seenAt(ev({ ...e, going: ['host', 'a'], checkIns: { a: ['s1'] } }), builds).map((b) => b.id)).toEqual(['b1']);
  });
  test('who may see the wall', () => {
    expect(canSeeArrivals(e, 'a', [], false)).toBe(true);
    expect(canSeeArrivals(e, 'host', [], false)).toBe(true);
    expect(canSeeArrivals(e, 'stranger', [], false)).toBe(false);
    expect(canSeeArrivals(e, 'stranger', [], true)).toBe(true);
  });
  test('the first check-in records when they arrived, a second does not', () => {
    const e1 = ev({ going: ['host', 'a'] });
    const one = checkIn(e1, 0, 'a', undefined, at(1));
    expect(one.arrivals?.a).toBe(at(1).toISOString());
    const two = checkIn({ ...one, stops: [...one.stops, { id: 's2', name: 'Two', at: { lat: 52.6, lng: -1.8 } }] }, 1, 'a', undefined, at(2));
    expect(two.arrivals?.a).toBe(at(1).toISOString());
  });
});

describe('one-tap status', () => {
  const e = ev({ going: ['host', 'a'], checkIns: {} });
  test('running late before you arrive, left after', () => {
    expect(statusRow(e, 'a', at(-1))).toEqual({ offer: 'late', set: false });
    expect(statusRow(ev({ going: ['host', 'a'], checkIns: { a: ['s1'] } }), 'a', at(1))).toEqual({ offer: 'left', set: false });
  });
  test('nothing when you are not going, or it is over', () => {
    expect(statusRow(e, 'b', at(-1))).toBeNull();
    expect(statusRow(e, 'a', at(10))).toBeNull();
  });
  test('set, summarise and clear', () => {
    const late = withStatus(e, 'a', 'late');
    expect(statusRow(late, 'a', at(-1))?.set).toBe(true);
    expect(statusSummary(late)).toBe('1 running late');
    expect(statusSummary(withStatus(late, 'host', 'left'))).toBe('1 running late, 1 on the way');
    expect(withStatus(late, 'a', null).status).toEqual({});
    expect(() => withStatus(e, 'b', 'late')).toThrow();
  });
  test('arriving clears running late, dropping out clears any status', () => {
    const late = withStatus(e, 'a', 'late');
    expect(checkIn(late, 0, 'a', undefined, at(1)).status?.a).toBeUndefined();
    expect(dropOut(late, 'a').status?.a).toBeUndefined();
  });
});

describe('rules', () => {
  test('only standard rules show, in list order', () => {
    expect(rulesOf({ rules: ['litter', 'made-up', 'no-revving'] })).toEqual(['No revving or loud exhausts', 'Take your litter home']);
    expect(cleanRules(['litter', 'nope', 'no-revving', 'litter'])).toEqual(['no-revving', 'litter']);
  });
});

describe('capacity and waitlist', () => {
  const full = ev({ capacity: 2, going: ['host', 'a', 'b'] });
  test('hosts take no place', () => {
    expect(isFull(full)).toBe(true);
    expect(isFull({ ...full, capacity: 3 })).toBe(false);
    expect(placesLeft({ ...full, capacity: 5 })).toBe(3);
    expect(placesLeft(ev())).toBeNull();
  });
  test('a full meet puts the next person on the waitlist, in order', () => {
    const one = rsvp(full, 'c', true, undefined, at(-5));
    expect(one.going).not.toContain('c');
    expect(one.waitlist).toEqual(['c']);
    const two = rsvp(one, 'd', true, undefined, at(-5));
    expect(two.waitlist).toEqual(['c', 'd']);
    expect(waitPosition(two, 'd')).toBe(2);
    expect(waitPosition(two, 'a')).toBe(0);
  });
  test('a host can still join a full meet', () => {
    expect(rsvp({ ...full, going: ['a', 'b'] }, 'host', true, undefined, at(-5)).going).toContain('host');
  });
  test('someone dropping out moves the first waiting person up', () => {
    const waiting = joinWaitlist(joinWaitlist(full, 'c'), 'd');
    const after = dropOut(waiting, 'a');
    expect(after.going).toEqual(['host', 'b', 'c']);
    expect(after.waitlist).toEqual(['d']);
  });
  test('leaving the waitlist keeps everyone else in line', () => {
    const waiting = joinWaitlist(joinWaitlist(full, 'c'), 'd');
    expect(dropOut(waiting, 'c').waitlist).toEqual(['d']);
  });
  test('raising the limit lets people in', () => {
    const waiting = joinWaitlist(joinWaitlist(full, 'c'), 'd');
    const { event, moved } = promoteWaitlist({ ...waiting, capacity: 3 });
    expect(moved).toEqual(['c']);
    expect(event.waitlist).toEqual(['d']);
  });
  test('capacity must be a whole number from 1 to 500', () => {
    expect(capacityProblem('')).toBeNull();
    expect(capacityProblem('20')).toBeNull();
    expect(capacityProblem(0)).not.toBeNull();
    expect(capacityProblem('1.5')).not.toBeNull();
    expect(capacityProblem(501)).not.toBeNull();
  });
});

describe('co-hosts', () => {
  test('a host adds one; others cannot; no duplicates; capped', () => {
    const e = ev({ going: ['host', 'a'], requests: ['a'] });
    expect(withCoHost(e, 'host', [], 'a').hostIds).toEqual(['host', 'a']);
    expect(() => withCoHost(e, 'a', [], 'b')).toThrow('Only hosts');
    expect(() => withCoHost(e, 'host', [], 'host')).toThrow('already');
    expect(() => withCoHost(ev({ hostIds: ['host', 'h2', 'h3', 'h4', 'h5'] }), 'host', [], 'x')).toThrow('up to 5');
  });
});

describe('history and the host dashboard', () => {
  const past = (id: string, going: string[], checked: string[], daysAgo: number, over: Partial<NightEvent> = {}) =>
    ev({ id, going, checkIns: Object.fromEntries(checked.map((u) => [u, ['s1']])), startsAt: iso(T0.getTime() - daysAgo * 24 * H), endsAt: iso(T0.getTime() - daysAgo * 24 * H + 3 * H), ...over });
  const now = at(0);
  test('counts earlier runs of the same meet and the usual turnout', () => {
    const events = [past('p1', ['host', 'a', 'b', 'c'], ['a', 'b', 'c'], 14), past('p2', ['host', 'a', 'b'], ['a', 'b'], 7), past('x', ['q'], ['q'], 3, { title: 'Something else', hostIds: ['other'] })];
    const h = meetHistory(ev(), events, now);
    expect(h).toEqual({ runs: 2, typical: 2 });
    expect(historyLine(h)).toBe('Has run 2 times before. Usually about 2 people turn up.');
  });
  test('a first run, or a cancelled one, says nothing', () => {
    expect(historyLine(meetHistory(ev(), [], now))).toBeNull();
    expect(meetHistory(ev(), [past('p', ['a'], ['a'], 7, { cancelled: true })], now).runs).toBe(0);
  });
  test('same name needs a shared host', () => {
    expect(meetHistory(ev(), [past('p', ['a'], ['a'], 7, { hostIds: ['other'] })], now).runs).toBe(0);
  });
  test('regulars versus new people, and arrivals by the hour', () => {
    const events = [past('p1', ['host', 'a', 'b'], ['a', 'b'], 7)];
    const live = ev({
      going: ['host', 'a', 'n1', 'n2'],
      checkIns: { a: ['s1'], n1: ['s1'], n2: ['s1'] },
      arrivals: { a: iso(T0.getTime()), n1: iso(T0.getTime() + 10 * 60_000), n2: iso(T0.getTime() + 70 * 60_000) },
    });
    const s = hostStats(live, events, at(2));
    expect(s).toMatchObject({ going: 3, arrived: 3, regulars: 1, newcomers: 2 });
    expect(s.arrivalsByHour.map((b) => b.count)).toEqual([2, 1]);
  });
  test('the server numbers win when it has them', () => {
    expect(hostStats(ev({ going: ['host', 'a'] }), [], now, { regulars: 4, newcomers: 6 })).toMatchObject({ regulars: 4, newcomers: 6 });
  });
});

describe('same as last time', () => {
  const last = ev({
    title: 'Friday meet', rules: ['litter'], capacity: 10, going: ['host', 'a'], checkIns: { a: ['s1'] }, arrivals: { a: iso(T0.getTime()) },
    waitlist: ['z'], status: { a: 'left' }, gallery: ['g'], requests: ['r'],
  });
  test('copies the meet a week on with nobody going', () => {
    const now = at(2);
    const c = copyOf(last, 'new1', now);
    expect(new Date(c.startsAt).getTime()).toBe(T0.getTime() + 7 * 24 * H);
    expect(new Date(c.endsAt!).getTime() - new Date(c.startsAt).getTime()).toBe(3 * H);
    expect(c).toMatchObject({ id: 'new1', going: [], checkIns: {}, waitlist: [], status: {}, arrivals: {}, requests: [], title: 'Friday meet', rules: ['litter'], capacity: 10 });
    expect(c.stops[0].id).toBe('new1-s0');
    expect(c.stops[0].at).toEqual(last.stops[0].at);
  });
  test('skips weeks that have already gone', () => {
    const c = copyOf(last, 'n', new Date(T0.getTime() + 15 * 24 * H));
    expect(new Date(c.startsAt).getTime()).toBe(T0.getTime() + 21 * 24 * H);
  });
  test('the draft lands on the last step with everything carried over', () => {
    const d = draftFromEvent(last, 'host', at(2));
    expect(d.step).toBe(3);
    expect(d).toMatchObject({ title: 'Friday meet', rules: ['litter'], capacity: 10, coHosts: [], crewOwned: false });
    expect(d.stops).toHaveLength(1);
    expect(d.day.date).toBeDefined();
  });
});
