import { monthLine, passportOf, PASSPORT_TILES, passportLine, recapOf, recapText, regionOfEvent, regionsVisited, visitsOf, withDemoHistory } from '../src/lib/passport';
import { DEFAULT_FILTER } from '../src/lib/invites';
import { REGIONS, nearestRegion } from '../src/lib/profile';
import {
  canConfirmSeen,
  hostRecordFromEvents,
  seenInPerson,
  SEEN_NEEDED,
  SEEN_PER_DAY,
  sharedMeets,
  trustSignal,
  witnessCount,
  type Sighting,
} from '../src/lib/trust';
import type { NightEvent } from '../src/lib/types';

const NOW = new Date('2026-11-21T12:00:00Z');
const day = (n: number) => new Date(NOW.getTime() - n * 86_400_000).toISOString();

function ev(id: string, over: Partial<NightEvent> = {}): NightEvent {
  return {
    id, type: 'meet', title: id, startsAt: day(10), endsAt: new Date(NOW.getTime() - 9.9 * 86_400_000).toISOString(),
    area: { lat: 52.6, lng: -1.7 }, areaName: 'Tamworth', stops: [{ id: 's', name: 'S', at: { lat: 52.6, lng: -1.7 } }], currentStop: 0,
    revealMinutesBefore: 60, hostIds: ['host'], filter: DEFAULT_FILTER, going: [], checkIns: {}, ...over,
  };
}

describe('passport', () => {
  test('every region has exactly one tile, and no two tiles share a place', () => {
    expect(Object.keys(PASSPORT_TILES).sort()).toEqual(REGIONS.map((r) => r.name).sort());
    const places = Object.values(PASSPORT_TILES).map((t) => `${t.col},${t.row}`);
    expect(new Set(places).size).toBe(places.length);
  });

  test('a region fills in when you check in at a meet there', () => {
    const events = [
      ev('a', { checkIns: { me: ['s'], x: ['s'] }, areaName: 'Wales', area: { lat: 52.2, lng: -3.6 } }),
      ev('b', { checkIns: { me: ['s'] } }),
      ev('c', { checkIns: { x: ['s'] } }),
      ev('d', { checkIns: { me: ['s'] }, cancelled: true }),
    ];
    const visits = visitsOf(events, 'me', nearestRegion);
    expect(visits.map((v) => v.id).sort()).toEqual(['a', 'b']);
    const stamps = passportOf(visits);
    expect(stamps).toHaveLength(11);
    expect(stamps.find((s) => s.region === 'Wales')?.meets).toBe(1);
    expect(stamps.find((s) => s.region === 'Midlands')?.meets).toBe(1);
    expect(regionsVisited(stamps)).toBe(2);
    expect(passportLine(stamps)).toBe('2 of 11 regions');
  });

  test('an area named after a region uses that region', () => {
    expect(regionOfEvent({ area: { lat: 0, lng: 0 }, areaName: ' london ' }, nearestRegion)).toBe('London');
  });

  test('people at the same meet are kept for the recap, not yourself', () => {
    const [v] = visitsOf([ev('a', { checkIns: { me: ['s'], x: ['s'], y: [] } })], 'me', nearestRegion);
    expect(v.people).toEqual(['x']);
  });
});

describe('quiet streak', () => {
  test('a plain line for meets this month, nothing for none', () => {
    const none = visitsOf([], 'me', nearestRegion);
    expect(monthLine(none, NOW)).toBeNull();
    const events = [ev('a', { startsAt: day(1), checkIns: { me: ['s'] } }), ev('b', { startsAt: day(3), checkIns: { me: ['s'] } }), ev('old', { startsAt: day(40), checkIns: { me: ['s'] } })];
    expect(monthLine(visitsOf(events, 'me', nearestRegion), NOW)).toBe('2 meets this month');
    expect(monthLine(visitsOf([events[0]], 'me', nearestRegion), NOW)).toBe('1 meet this month');
  });

  test('never says anything about losing a streak', () => {
    const line = monthLine(withDemoHistory([], NOW), NOW) ?? '';
    expect(line).not.toMatch(/lost|streak|keep|don't|miss/i);
  });
});

describe('season recap', () => {
  test('counts this year only', () => {
    const events = [
      ev('a', { startsAt: day(5), checkIns: { me: ['s'], x: ['s'] }, hostIds: ['me'] }),
      ev('b', { startsAt: day(200), checkIns: { me: ['s'], y: ['s'] }, areaName: 'Wales' }),
      ev('last-year', { startsAt: '2025-06-01T10:00:00Z', checkIns: { me: ['s'], z: ['s'] } }),
    ];
    const r = recapOf(visitsOf(events, 'me', nearestRegion), { drives: 2, photoSpots: 1 }, NOW);
    expect(r).toMatchObject({ year: 2026, meets: 2, hosted: 1, drives: 2, photoSpots: 1, regions: 2, people: 2 });
    expect(recapText(r)).toBe('My 2026 on Slipstream so far: 2 meets, 2 drives, 1 photo spot, 2 regions.');
  });

  test("the demo's made-up season fills the passport and the streak, never a place name", () => {
    const visits = withDemoHistory([], NOW);
    expect(regionsVisited(passportOf(visits))).toBeGreaterThanOrEqual(4);
    expect(monthLine(visits, NOW)).toMatch(/this month/);
    expect(visits.every((v) => v.id.startsWith('demo-'))).toBe(true);
  });
});

describe('trusted host and neighbour-friendly record (one signal)', () => {
  const past = (id: string, n: number, over: Partial<NightEvent> = {}) =>
    ev(id, { checkIns: Object.fromEntries(Array.from({ length: n }, (_, i) => [`u${i}`, ['s']])), ...over });

  test('only meets that really ran count', () => {
    const events = [
      past('a', 4), past('b', 3),
      past('tiny', 2),
      past('cancelled', 5, { cancelled: true }),
      past('future', 5, { startsAt: new Date(NOW.getTime() + 86_400_000).toISOString(), endsAt: undefined }),
      past('other', 5, { hostIds: ['someone'] }),
    ];
    expect(hostRecordFromEvents(events, 'host', NOW)).toEqual({ meetsRun: 2, upheld: 0 });
  });

  test('five clean meets earn Trusted host; three or four get one plain line; fewer say nothing', () => {
    expect(trustSignal({ meetsRun: 5, upheld: 0 })).toMatchObject({ tier: 'trusted', label: 'Trusted host' });
    expect(trustSignal({ meetsRun: 12, upheld: 0 })?.tier).toBe('trusted');
    expect(trustSignal({ meetsRun: 3, upheld: 0 })).toMatchObject({ tier: 'record', label: '3 past meets, no complaints' });
    expect(trustSignal({ meetsRun: 4, upheld: 0 })?.tier).toBe('record');
    expect(trustSignal({ meetsRun: 2, upheld: 0 })).toBeNull();
    expect(trustSignal(null)).toBeNull();
  });

  test('one upheld report removes the signal, and says nothing negative', () => {
    expect(trustSignal({ meetsRun: 9, upheld: 1 })).toBeNull();
  });
});

describe('seen in person', () => {
  const meet = ev('m', { checkIns: { owner: ['s'], a: ['s'], b: ['s'] } });
  const sight = (witnessId: string): Sighting => ({ buildId: 'bld', eventId: 'm', witnessId });

  test('needs three different people', () => {
    expect(seenInPerson([sight('a'), sight('a'), sight('b')], 'bld')).toBe(false);
    expect(witnessCount([sight('a'), sight('a'), sight('b')], 'bld')).toBe(2);
    expect(seenInPerson([sight('a'), sight('b'), sight('c')], 'bld')).toBe(true);
    expect(SEEN_NEEDED).toBe(3);
  });

  test('only people who were at the same meet, never your own, once each, and a daily limit', () => {
    expect(canConfirmSeen(meet, 'owner', 'a', 'bld', [], 0)).toEqual({ ok: true });
    expect(canConfirmSeen(meet, 'owner', 'owner', 'bld', [], 0).ok).toBe(false);
    expect(canConfirmSeen(meet, 'owner', 'stranger', 'bld', [], 0).ok).toBe(false);
    expect(canConfirmSeen(meet, 'owner', 'a', 'bld', [sight('a')], 0).ok).toBe(false);
    expect(canConfirmSeen(meet, 'owner', 'a', 'bld', [], SEEN_PER_DAY).ok).toBe(false);
  });

  test('shared meets need both people checked in', () => {
    expect(sharedMeets([meet, ev('n', { checkIns: { a: ['s'] } })], 'owner', 'a').map((e) => e.id)).toEqual(['m']);
  });
});
