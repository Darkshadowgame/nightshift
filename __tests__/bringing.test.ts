import { castVote, categoriesFor, eligibleFor, results, type Vote } from '../src/lib/awards';
import {
  awardBuilds,
  broughtBuild,
  buildLine,
  buildTag,
  canGoWith,
  checkInBuild,
  chosenBuild,
  classMix,
  classMixText,
  defaultBuild,
  fitsInvite,
  lastBrought,
} from '../src/lib/bringing';
import { canChangeVehicle, checkIn, dropOut, rsvp, answerRequest, applyEventEdit } from '../src/lib/events';
import { roleOf } from '../src/lib/eventView';
import { DEFAULT_FILTER, invitees } from '../src/lib/invites';
import type { Build, Crew, NightEvent, User } from '../src/lib/types';

const START = new Date('2026-11-20T22:00:00Z');
const at = (h: number) => new Date(START.getTime() + h * 3_600_000);

const mod = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `m${i}`, category: 'other' as const, name: `Mod ${i}` }));
const build = (id: string, ownerId: string, extra: Partial<Build> = {}): Build => ({
  id, ownerId, kind: 'car', make: 'Ford', model: 'Fiesta', stockBhp: 200, weightKg: 1200, mods: mod(3), photos: [], ...extra,
});

// Phil has a modified bike, a modified car and a stock daily. The invite: bikes only, 3+ mods.
const bike = build('bike', 'me', { kind: 'bike', make: 'Yamaha', model: 'R1', stockBhp: 197, weightKg: 201 });
const car = build('car', 'me', { make: 'Honda', model: 'Civic Type R', stockBhp: 316, weightKg: 1380 });
const daily = build('daily', 'me', { make: 'Skoda', model: 'Octavia', stockBhp: 150, weightKg: 1350, mods: [] });
const builds: Build[] = [car, daily, bike, build('o1', 'other'), build('o2', 'other', { kind: 'bike', make: 'Kawasaki', model: 'ZX-6R', stockBhp: 128, weightKg: 196 })];

const home = { lat: 52.6, lng: -1.7 };
const users: User[] = [
  { id: 'me', handle: 'me', name: 'Me', region: 'Midlands', home },
  { id: 'other', handle: 'o', name: 'O', region: 'Midlands', home },
  { id: 'far', handle: 'f', name: 'F', region: 'South West', home: { lat: 50.37, lng: -4.14 } },
];
const crews: Crew[] = [];

const bikesOnly: NightEvent = {
  id: 'e', type: 'meet', title: 'Bike night', startsAt: START.toISOString(), endsAt: at(3).toISOString(), area: home, areaName: 'Midlands',
  stops: [{ id: 's', name: 'Spot', at: home }], currentStop: 0, revealMinutesBefore: 60, hostIds: ['host'],
  filter: { ...DEFAULT_FILTER, cars: false, bikes: true, minMods: 3 }, going: ['host'], checkIns: {},
};
const everyone: NightEvent = { ...bikesOnly, id: 'all', filter: { ...DEFAULT_FILTER, everyone: true } };
const show: NightEvent = { ...bikesOnly, id: 'show', type: 'show' };

describe('which builds the invite covers', () => {
  test('per build: only the modified bike fits a bikes-only invite', () => {
    expect(fitsInvite(bikesOnly, bike)).toBe(true);
    expect(fitsInvite(bikesOnly, car)).toBe(false);
    expect(fitsInvite(bikesOnly, daily)).toBe(false);
  });

  test('everyone welcome and public events cover every build', () => {
    expect(fitsInvite(everyone, daily)).toBe(true);
    expect(fitsInvite(show, daily)).toBe(true);
  });

  test('going straight in depends on the build you bring, and your home area', () => {
    expect(canGoWith(bikesOnly, 'me', crews, users, builds, bike)).toBe(true);
    expect(canGoWith(bikesOnly, 'me', crews, users, builds, car)).toBe(false);
    expect(canGoWith(bikesOnly, 'far', crews, users, [...builds, build('fb', 'far', { kind: 'bike' })], build('fb', 'far', { kind: 'bike' }))).toBe(false);
    expect(canGoWith(show, 'far', crews, users, builds, daily)).toBe(true);
    expect(canGoWith(bikesOnly, 'host', crews, users, builds, car)).toBe(true); // hosts always
  });

  test('with no build picked, the old rule: any of your builds', () => {
    expect(canGoWith(bikesOnly, 'me', crews, users, builds)).toBe(true);
  });

  test('alerts and search ("I can go") still count any build', () => {
    // Bringing the car doesn't change that the invite reaches you.
    const going = rsvp(bikesOnly, 'me', false, 'car');
    expect(invitees([users[0]], builds, going.filter, going.area).userIds).toEqual(['me']);
    expect(roleOf({ ...going, requests: [] }, 'me', crews, users, builds)).toBe('invited');
  });
});

describe('the default pick', () => {
  test('first build the invite covers, when nothing was brought before', () => {
    expect(defaultBuild(bikesOnly, 'me', builds, [bikesOnly])?.id).toBe('bike');
    expect(defaultBuild(everyone, 'me', builds, [everyone])?.id).toBe('car');
  });

  test('the last one you brought, when the invite covers it', () => {
    const lastWeek: NightEvent = { ...everyone, id: 'lw', startsAt: at(-170).toISOString(), going: ['me'], vehicles: { me: 'daily' } };
    const older: NightEvent = { ...everyone, id: 'old', startsAt: at(-500).toISOString(), going: ['me'], vehicles: { me: 'car' } };
    const events = [older, lastWeek, everyone];
    expect(lastBrought(events, 'me', builds)?.id).toBe('daily');
    expect(defaultBuild(everyone, 'me', builds, events)?.id).toBe('daily');
    // The bikes-only invite doesn't cover the daily: first match instead.
    expect(defaultBuild(bikesOnly, 'me', builds, [...events, bikesOnly])?.id).toBe('bike');
  });

  test('ignores events you dropped out of and builds since deleted', () => {
    const dropped: NightEvent = { ...everyone, id: 'd', startsAt: at(-10).toISOString(), going: [], vehicles: { me: 'daily' } };
    const deleted: NightEvent = { ...everyone, id: 'x', startsAt: at(-5).toISOString(), going: ['me'], vehicles: { me: 'gone' } };
    expect(lastBrought([dropped, deleted], 'me', builds)).toBeUndefined();
  });

  test('what you already picked for this event wins', () => {
    expect(defaultBuild({ ...bikesOnly, requests: ['me'], vehicles: { me: 'car' } }, 'me', builds, [])?.id).toBe('car');
  });

  test('none without builds; nothing nobody else owns', () => {
    expect(defaultBuild(bikesOnly, 'nobody', builds, [])).toBeUndefined();
    expect(chosenBuild({ ...bikesOnly, vehicles: { me: 'o1' } }, 'me', builds)).toBeUndefined();
  });
});

describe('going with a build', () => {
  const now = at(-5);

  test('a build the invite covers: straight in, and the pick is stored', () => {
    const e = rsvp(bikesOnly, 'me', true, 'bike', now);
    expect(e.going).toContain('me');
    expect(e.vehicles).toEqual({ me: 'bike' });
  });

  test("one it doesn't: a request, with the pick stored for the host to see", () => {
    const e = rsvp(bikesOnly, 'me', false, 'car', now);
    expect(e.going).not.toContain('me');
    expect(e.requests).toEqual(['me']);
    expect(e.vehicles).toEqual({ me: 'car' });
    // Approved: going with that car.
    const ok = answerRequest(e, 'host', crews, 'me', true);
    expect(ok.going).toContain('me');
    expect(broughtBuild(ok, 'me', builds)?.id).toBe('car');
  });

  test('a request changed to a build that fits goes straight in', () => {
    const asked = rsvp(bikesOnly, 'me', false, 'car', now);
    const e = rsvp(asked, 'me', true, 'bike', now);
    expect(e.going).toContain('me');
    expect(e.requests).toEqual([]);
    expect(e.vehicles?.me).toBe('bike');
  });

  test("changing to a build the invite doesn't cover puts you back to asking", () => {
    const going = rsvp(bikesOnly, 'me', true, 'bike', now);
    const e = rsvp(going, 'me', false, 'car', now);
    expect(e.going).not.toContain('me');
    expect(e.requests).toEqual(['me']);
    expect(e.vehicles?.me).toBe('car');
  });

  test('tapping again with the same build changes nothing', () => {
    const going = rsvp(bikesOnly, 'me', true, 'bike', now);
    expect(rsvp(going, 'me', true, 'bike', now)).toBe(going);
    expect(rsvp(going, 'me', false, undefined, now)).toBe(going);
  });

  test('dropping out forgets the pick', () => {
    const going = rsvp(bikesOnly, 'me', true, 'bike', now);
    expect(dropOut(going, 'me').vehicles).toEqual({});
  });

  test('editing the event keeps the picks', () => {
    const going = rsvp(bikesOnly, 'me', true, 'bike', now);
    expect(applyEventEdit(going, { ...going, vehicles: undefined, title: 'New' }, 'host', now, 'pc').vehicles).toEqual({ me: 'bike' });
  });
});

describe('changing the vehicle', () => {
  const going = rsvp(everyone, 'me', true, 'car', at(-5));

  test('until the start; after that only at check-in; never once checked in', () => {
    expect(canChangeVehicle(going, 'me', at(-1)).ok).toBe(true);
    expect(canChangeVehicle(going, 'me', at(0.5))).toEqual({ ok: false, reason: 'It has started. Change your vehicle when you check in.' });
    expect(canChangeVehicle(going, 'me', at(0.5), true).ok).toBe(true);
    const inside = checkIn(going, 0, 'me');
    expect(canChangeVehicle(inside, 'me', at(0.5), true).ok).toBe(false);
    expect(canChangeVehicle({ ...going, cancelled: true }, 'me', at(-1)).ok).toBe(false);
    expect(canChangeVehicle(going, 'me', at(4)).ok).toBe(false);
  });

  test('a change after the start is refused away from check-in', () => {
    expect(() => rsvp(going, 'me', true, 'daily', at(0.5))).toThrow(/Change your vehicle when you check in/);
    expect(rsvp(going, 'me', true, 'daily', at(-0.5)).vehicles?.me).toBe('daily');
  });

  test('at check-in: turned up in something else', () => {
    const e = checkIn(going, 0, 'me', { buildId: 'daily', fits: true });
    expect(e.vehicles?.me).toBe('daily');
    expect(e.checkIns.me).toEqual(['s']);
  });

  test("at check-in: a build the invite doesn't cover is refused", () => {
    const g = rsvp(bikesOnly, 'me', true, 'bike', at(-5));
    expect(() => checkIn(g, 0, 'me', { buildId: 'car', fits: false })).toThrow(/doesn't match the invite/);
  });

  test('once checked in the vehicle is set', () => {
    const inside = checkIn(going, 0, 'me');
    expect(() => checkIn(inside, 0, 'me', { buildId: 'daily', fits: true })).toThrow(/vehicle is set/);
    expect(() => rsvp(inside, 'me', true, 'daily', at(0.5))).toThrow(/vehicle is set/);
  });

  test('checked in with no vehicle on record: the next stop still checks in (B2)', () => {
    const twoStops = { ...going, stops: [...going.stops, { ...going.stops[0], id: 's2' }], vehicles: {} };
    const first = checkIn(twoStops, 0, 'me');
    const second = checkIn(first, 1, 'me', { buildId: 'car', fits: true });
    expect(second.checkIns.me).toEqual(['s', 's2']);
    expect(second.vehicles?.me).toBe('car');
    // One that doesn't fit isn't recorded, and still doesn't block the check-in.
    const third = checkIn(first, 1, 'me', { buildId: 'car', fits: false });
    expect(third.checkIns.me).toEqual(['s', 's2']);
    expect(third.vehicles?.me).toBeUndefined();
  });

  test('a host checking in with a build counts as going', () => {
    const e = checkIn({ ...everyone, going: [] }, 0, 'host', { buildId: 'o1', fits: true });
    expect(e.going).toEqual(['host']);
    expect(e.vehicles).toEqual({ host: 'o1' });
  });
});

describe('who shows with what', () => {
  test('the brought build, not the first build', () => {
    const e: NightEvent = { ...everyone, going: ['me', 'other'], vehicles: { me: 'bike' } };
    expect(broughtBuild(e, 'me', builds)?.id).toBe('bike');
    // Old data without a pick: the first build the invite covers.
    expect(broughtBuild(e, 'other', builds)?.id).toBe('o1');
    expect(broughtBuild({ ...bikesOnly, going: ['other'] }, 'other', builds)?.id).toBe('o2');
  });

  test('class counts use what people are bringing', () => {
    const e: NightEvent = { ...everyone, going: ['me', 'other'], vehicles: { me: 'bike', other: 'o2' } };
    expect(classMix(e, builds).reduce((n, c) => n + c.count, 0)).toBe(2);
    // Both bikes: the bike scale, said so.
    expect(classMixText(e, builds)).toMatch(/^Bikes \d[SABCD]( \d[SABCD])?$/);
    expect(classMixText({ ...e, going: [] }, builds)).toBe('');
    // A car and a bike: two scales, never added together.
    const mixed: NightEvent = { ...e, vehicles: { me: 'bike', other: 'o1' } };
    expect(classMixText(mixed, builds)).toMatch(/^Cars \d[SABCD] · Bikes \d[SABCD]$/);
    expect(classMixText({ ...e, going: ['other'], vehicles: { other: 'o1' } }, builds)).toMatch(/^\d[SABCD]$/);
  });

  test('tags show the swap and the tune stage', () => {
    const tuned = build('t', 'me', {
      tuneStage: 'stage2',
      engineSwap: { donorMake: 'Honda', donorModel: 'K20A', bhp: 220 },
    });
    expect(buildTag(tuned)).toBe('K20A swap · Stage 2');
    expect(buildLine(tuned)).toBe('Ford Fiesta · K20A swap · Stage 2');
    expect(buildTag(daily)).toBeNull();
  });
});

describe('award candidates', () => {
  const met: NightEvent = {
    ...everyone,
    going: ['me', 'other', 'third'],
    vehicles: { me: 'bike' },
    checkIns: { me: ['s'], other: ['s'], third: ['s'] },
  };
  const all = [...builds, build('t1', 'third'), build('t2', 'third'), build('t3', 'third')];

  test('the build each person brought; all their builds only when there is no pick', () => {
    // `other` and `third` never picked (old data): all their builds.
    expect(awardBuilds(met, all).map((b) => b.id).sort()).toEqual(['bike', 'o1', 'o2', 't1', 't2', 't3']);
    const picked = { ...met, vehicles: { me: 'bike', other: 'o1', third: 't2' } };
    expect(awardBuilds(picked, all).map((b) => b.id).sort()).toEqual(['bike', 'o1', 't2']);
  });

  test('builds left at home cannot be voted for', () => {
    const picked = { ...met, vehicles: { me: 'bike', other: 'o1', third: 't2' } };
    expect(eligibleFor('best-in-show', picked, all).map((b) => b.id)).not.toContain('car');
    expect(() => castVote([], picked, all, 'other', 'best-in-show', 'car', at(1))).toThrow(/can't win/);
    expect(castVote([], picked, all, 'other', 'best-in-show', 'bike', at(1))).toHaveLength(1);
  });

  test('categories count brought builds only', () => {
    // Everyone brought a car: no bike award, even though `me` owns a bike.
    const cars = { ...met, vehicles: { me: 'car', other: 'o1', third: 't1' } };
    expect(categoriesFor(cars, all)).not.toContain('best-car');
    const mixed = { ...met, vehicles: { me: 'bike', other: 'o1', third: 't1' } };
    expect(categoriesFor(mixed, all)).toContain('best-car');
  });

  test('results only count votes for builds that are candidates', () => {
    const picked = { ...met, vehicles: { me: 'bike', other: 'o1', third: 't2' } };
    const v = (voterId: string, buildId: string, h: number): Vote => ({ eventId: 'all', voterId, category: 'best-in-show', buildId, at: at(h).toISOString() });
    // Three votes for the car `me` left at home (e.g. cast before a pick changed) don't win.
    const votes = [v('a', 'car', 1), v('b', 'car', 1.1), v('c', 'car', 1.2), v('d', 'bike', 1.3)];
    expect(results(votes, picked, all, at(40))).toEqual([]);
  });
});

describe('check-in records the build the screen says you are bringing', () => {
  test('going with no pick on record, two builds, the last brought differs: both read the same build', () => {
    // Going to an everyone-welcome meet saved before vehicle picks (no vehicles[me]).
    const tonight: NightEvent = { ...everyone, id: 'tonight', going: ['host', 'me'] };
    // Last time, the bike was brought to another event.
    const before: NightEvent = { ...everyone, id: 'before', startsAt: at(-48).toISOString(), endsAt: at(-45).toISOString(), going: ['me'], vehicles: { me: 'bike' } };
    const mine = [car, bike];
    expect(defaultBuild(tonight, 'me', mine, [tonight, before])?.id).toBe('bike');
    const shown = broughtBuild(tonight, 'me', mine);
    expect(checkInBuild(tonight, 'me', mine)?.id).toBe(shown?.id);
    expect(shown?.id).toBe('car');
  });

  test('a pick on record wins, and "Something else?" at check-in wins over that', () => {
    const tonight: NightEvent = { ...everyone, id: 'tonight', going: ['host', 'me'], vehicles: { me: 'bike' } };
    expect(checkInBuild(tonight, 'me', builds)?.id).toBe('bike');
    expect(checkInBuild(tonight, 'me', builds, 'daily')?.id).toBe('daily');
    // Someone else's build can't be picked.
    expect(checkInBuild(tonight, 'me', builds, 'o1')?.id).toBe('bike');
  });
});
