import { DEFAULT_FILTER } from '../src/lib/invites';
import { attendedEvents, authorRep, duplicateBuild, vehicleKey, hostedEvents, levelFor, repForLevel, repLedger, REP, routeScore, validRatings, ROUTE_APPROVED_REP } from '../src/lib/rep';
import { publicProfile } from '../src/lib/people';
import type { Build, NightEvent } from '../src/lib/types';

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

  test('the same vehicle added twice earns its mods once (B3)', () => {
    const golf = (id: string, mods: string[], extra: Partial<Build> = {}): Build => ({
      id, ownerId: 'me', kind: 'car', make: 'Volkswagen', model: 'Golf R', year: 2019, stockBhp: 300, weightKg: 1500, photos: [],
      mods: mods.map((name, i) => ({ id: `${id}${i}`, category: 'engine', name })), ...extra,
    });
    const mods = (builds: Build[]) => repLedger('me', { now: NOW, events: [], spots: [], builds, awards: [] }).lines.find((l) => l.source === 'mods')!;
    expect(mods([golf('a', ['Intake', 'Exhaust'])]).count).toBe(2);
    // Copies (case and spaces aside) don't add anything; a mod only one copy has still counts.
    expect(mods([golf('a', ['Intake', 'Exhaust']), golf('b', ['Intake', 'Exhaust'], { model: ' golf  r ' }), golf('c', ['Intake', 'Exhaust'])]).count).toBe(2);
    expect(mods([golf('a', ['Intake']), golf('b', ['Intake', 'Exhaust'])]).count).toBe(2);
    // Another year, or a bike, is another vehicle.
    expect(mods([golf('a', ['Intake']), golf('b', ['Intake'], { year: 2015 })]).count).toBe(2);
  });

  test('duplicate builds are found by vehicle, never the build itself or someone else\'s', () => {
    const b = (id: string, ownerId: string, model = 'Golf R') => ({ id, ownerId, kind: 'car' as const, make: 'VW', model, year: 2019 });
    const all = [b('a', 'me'), b('x', 'them'), b('c', 'me', 'Polo')];
    expect(duplicateBuild(b('new', 'me'), all)?.id).toBe('a');
    expect(duplicateBuild(b('a', 'me'), all)).toBeUndefined();
    expect(duplicateBuild(b('new', 'me', 'Up'), all)).toBeUndefined();
    expect(vehicleKey({ kind: 'car', make: ' VW ', model: 'GOLF  R', year: 2019 })).toBe(vehicleKey({ kind: 'car', make: 'vw', model: 'golf r', year: 2019 }));
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

describe('rep and public profile agree', () => {
  const NOW = new Date('2026-11-20T22:00:00Z');
  const home = { lat: 52.6, lng: -1.7 };
  const ev = (id: string, startsAt: string, endsAt: string, extra: Partial<NightEvent> = {}): NightEvent => ({
    id, type: 'meet', title: id, startsAt, endsAt, area: home, areaName: '',
    stops: [{ id: `${id}-s`, name: 'Stop', at: home }], currentStop: 0, revealMinutesBefore: 60, hostIds: ['x'],
    filter: DEFAULT_FILTER, going: ['me'], checkIns: { me: [`${id}-s`] }, ...extra,
  });
  const crews = [{ id: 'c', name: 'C', tag: 'CC', memberIds: ['me', 'x'], ownerId: 'x', hostIds: ['me'] }];
  const events = [
    ev('done', '2026-11-10T20:00:00Z', '2026-11-10T23:00:00Z', { crewId: 'c' }),
    ev('live', '2026-11-20T21:00:00Z', '2026-11-21T01:00:00Z'),
  ];

  test('attended and hosted count finished events only, crew hosts included', () => {
    expect(attendedEvents(events, 'me', NOW).map((e) => e.id)).toEqual(['done']);
    expect(hostedEvents(events, 'me', crews, NOW).map((e) => e.id)).toEqual(['done']);
    const ledger = repLedger('me', { now: NOW, events, spots: [], builds: [], awards: [], crews });
    const by = Object.fromEntries(ledger.lines.map((l) => [l.source, l]));
    expect(by.attended.count).toBe(1);
    expect(by.hosted.count).toBe(1);
    const users = [{ id: 'me', handle: 'me', name: 'Me', region: 'Midlands', home, crewId: 'c' }];
    const p = publicProfile('me', users, [], crews, events, [], NOW)!;
    expect(p.meetsAttended).toBe(by.attended.count);
    expect(p.hosted).toBe(by.hosted.count);
  });
});

describe('drive length tiers', () => {
  const { driveTier, authorRep: aRep, ROUTE_APPROVED_REP: base } = require('../src/lib/rep');

  test('short, medium, long and epic drives pay different rep', () => {
    expect(driveTier(6)).toMatchObject({ key: 'short', rep: 50 });
    expect(driveTier(12)).toMatchObject({ key: 'medium', rep: 100 });
    expect(driveTier(30)).toMatchObject({ key: 'long', rep: 175 });
    expect(driveTier(80)).toMatchObject({ key: 'epic', rep: 250 });
  });

  test('tier boundaries start at 10, 25 and 50 miles', () => {
    expect(driveTier(9.9).key).toBe('short');
    expect(driveTier(10).key).toBe('medium');
    expect(driveTier(25).key).toBe('long');
    expect(driveTier(50).key).toBe('epic');
  });

  test('unknown length counts as medium', () => {
    expect(driveTier(undefined).key).toBe('medium');
    expect(driveTier(0).key).toBe('medium');
  });

  test('a long drive pays its author more per completion than a short one', () => {
    const drivers = ['a', 'b', 'c', 'd', 'e'];
    const ratings = drivers.map((userId) => ({ userId, stars: 5 }));
    const short = aRep({ kind: 'route', miles: 6, authorId: 'x', completions: drivers, ratings });
    const long = aRep({ kind: 'route', miles: 60, authorId: 'x', completions: drivers, ratings });
    expect(long - base).toBeGreaterThan(short - base);
  });

  test('photo spots are not scaled by length', () => {
    const drivers = ['a', 'b', 'c'];
    const ratings = drivers.map((userId) => ({ userId, stars: 5 }));
    expect(aRep({ kind: 'spot', miles: 100, authorId: 'x', completions: drivers, ratings })).toBe(
      aRep({ kind: 'spot', authorId: 'x', completions: drivers, ratings }),
    );
  });
});
