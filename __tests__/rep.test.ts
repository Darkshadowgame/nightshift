import { DEFAULT_FILTER } from '../src/lib/invites';
import { authorRep, levelFor, repForLevel, repLedger, REP, routeScore, validRatings, ROUTE_APPROVED_REP } from '../src/lib/rep';
import type { NightEvent } from '../src/lib/types';

const people = (n: number, prefix = 'u') => Array.from({ length: n }, (_, i) => `${prefix}${i}`);

describe('route rep', () => {
  test('a new route earns the approval bonus only', () => {
    expect(authorRep({ authorId: 'a', completions: [], ratings: [] })).toBe(ROUTE_APPROVED_REP);
  });

  test('a popular, well-rated route earns far more than a poor one', () => {
    const good = people(100);
    const bad = people(10);
    const goodRep = authorRep({ authorId: 'a', completions: good, ratings: good.map((u) => ({ userId: u, stars: 5 })) });
    const badRep = authorRep({ authorId: 'b', completions: bad, ratings: bad.map((u) => ({ userId: u, stars: 2 })) });
    expect(goodRep).toBe(ROUTE_APPROVED_REP + 100 * 20);
    expect(badRep).toBeLessThan(ROUTE_APPROVED_REP + 20);
  });

  test('the author cannot rate or drive their own route for rep', () => {
    const r = { authorId: 'a', completions: ['a', 'a', 'a'], ratings: [{ userId: 'a', stars: 5 }] };
    expect(validRatings(r)).toHaveLength(0);
    expect(authorRep(r)).toBe(ROUTE_APPROVED_REP);
  });

  test('only people who completed the route can rate it', () => {
    const r = { authorId: 'a', completions: ['x'], ratings: [{ userId: 'x', stars: 4 }, { userId: 'never-drove', stars: 5 }] };
    expect(validRatings(r)).toEqual([{ userId: 'x', stars: 4 }]);
  });

  test('one rating per person, latest wins', () => {
    const r = { authorId: 'a', completions: ['x'], ratings: [{ userId: 'x', stars: 1 }, { userId: 'x', stars: 5 }] };
    expect(validRatings(r)).toEqual([{ userId: 'x', stars: 5 }]);
  });

  test('three mates giving 5 stars cannot max out the score', () => {
    const mates = people(3, 'm');
    expect(routeScore({ authorId: 'a', completions: mates, ratings: mates.map((u) => ({ userId: u, stars: 5 })) })).toBeLessThan(4);
  });

  test('photo spots use the same rules at half the rate', () => {
    const v = people(50);
    const ratings = v.map((u) => ({ userId: u, stars: 5 }));
    expect(authorRep({ kind: 'spot', authorId: 'a', completions: v, ratings })).toBe(ROUTE_APPROVED_REP + 50 * 10);
    expect(authorRep({ kind: 'route', authorId: 'a', completions: v, ratings })).toBe(ROUTE_APPROVED_REP + 50 * 20);
  });
});

describe('rep ledger and levels', () => {
  const NOW = new Date('2026-11-20T22:00:00Z');
  const home = { lat: 52.6, lng: -1.7 };
  const past = (id: string, hostIds: string[], attendees: string[]): NightEvent => ({
    id, type: 'meet', title: id, startsAt: '2026-11-10T20:00:00Z', endsAt: '2026-11-10T23:00:00Z', area: home, areaName: '',
    stops: [{ id: `${id}-s`, name: 'Stop', at: home }], currentStop: 0, revealMinutesBefore: 60, hostIds,
    filter: DEFAULT_FILTER, going: attendees, checkIns: Object.fromEntries(attendees.map((u) => [u, [`${id}-s`]])),
  });
  const spot = (id: string, kind: 'drive' | 'photo', authorId: string, done: string[], status: 'approved' | 'pending' = 'approved') => ({
    id, kind, name: id, at: home, description: '', authorId, status, createdAt: '2026-11-01T00:00:00Z',
    completions: done.map((userId) => ({ userId, on: '2026-11-10' })), ratings: [],
  });

  test('every source adds up', () => {
    const crowd = Array.from({ length: 10 }, (_, i) => `p${i}`);
    const ledger = repLedger('me', {
      now: NOW,
      events: [past('big', ['me'], crowd), past('small', ['me'], ['p1']), past('went', ['x'], ['me', 'p1'])],
      spots: [
        spot('d1', 'drive', 'x', ['me', 'me']),
        spot('p1', 'photo', 'x', ['me']),
        spot('mine', 'drive', 'me', ['me', 'p1']),
        spot('pend', 'photo', 'me', [], 'pending'),
      ],
      builds: [{ id: 'b', ownerId: 'me', kind: 'car', make: 'M', model: 'M', stockBhp: 100, weightKg: 1000, mods: [{ id: '1', category: 'engine', name: 'x' }, { id: '2', category: 'engine', name: 'y' }], photos: [] }],
      awards: [{ eventId: 'went', category: 'best-in-show', buildId: 'b', ownerId: 'me', votes: 3, at: NOW.toISOString() }],
    });
    const by = Object.fromEntries(ledger.lines.map((l) => [l.source, l]));
    expect(by.attended).toMatchObject({ count: 1, rep: REP.attended });
    expect(by.hosted).toMatchObject({ count: 2, rep: REP.hostedBig + REP.hostedSmall });
    expect(by.drives).toMatchObject({ count: 1, rep: REP.drive }); // own drive doesn't pay, repeats count once
    expect(by.spots).toMatchObject({ count: 1, rep: REP.photoSpot });
    expect(by.authored.count).toBe(1); // pending doesn't count yet
    expect(by.authored.rep).toBe(ROUTE_APPROVED_REP + 5); // one completion by someone else at the 3-star prior
    expect(by.awards.rep).toBe(500);
    expect(by.mods).toMatchObject({ count: 2, rep: 2 * REP.mod });
    expect(ledger.total).toBe(ledger.lines.reduce((s, l) => s + l.rep, 0));
  });

  test('hosting only pays once the event is over, and not for cancelled events', () => {
    const live = { ...past('live', ['me'], ['p1']), startsAt: '2026-11-20T21:00:00Z', endsAt: '2026-11-21T01:00:00Z' };
    const cancelled = { ...past('c', ['me'], ['p1']), cancelled: true };
    const ledger = repLedger('me', { now: NOW, events: [live, cancelled], spots: [], builds: [], awards: [] });
    expect(ledger.lines.find((l) => l.source === 'hosted')!.rep).toBe(0);
  });

  test('levels follow 250 × n(n+1)/2', () => {
    expect([1, 2, 3, 4, 5].map(repForLevel)).toEqual([0, 250, 750, 1500, 2500]);
    expect(levelFor(0)).toMatchObject({ level: 1, floor: 0, next: 250, progress: 0 });
    expect(levelFor(249).level).toBe(1);
    expect(levelFor(250).level).toBe(2);
    expect(levelFor(1000)).toMatchObject({ level: 3, floor: 750, next: 1500, progress: 250 / 750 });
  });
});
