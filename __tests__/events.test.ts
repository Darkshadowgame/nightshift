import { canCheckIn, canSeeStop, checkIn, checkInOpensAt, checkInWindowOpen, isHost, missingStops, moveOn, moveOnAudience, phaseOf } from '../src/lib/events';
import { DEFAULT_FILTER, buildMatches, invitees } from '../src/lib/invites';
import type { Build, Crew, NightEvent, User } from '../src/lib/types';

const NOW = new Date('2026-11-20T22:00:00Z');
const mins = (m: number) => new Date(NOW.getTime() + m * 60_000).toISOString();
const crews: Crew[] = [{ id: 'c1', name: 'Crew', tag: 'C', memberIds: ['crewmate', 'plain'], ownerId: 'crewmate', hostIds: [] }];

function rolling(overrides: Partial<NightEvent> = {}): NightEvent {
  return {
    id: 'e1', type: 'rolling', title: 'Test', startsAt: mins(-30), endsAt: mins(120),
    area: { lat: 52.6, lng: -1.7 }, areaName: 'Area',
    stops: [
      { id: 's1', name: 'One', at: { lat: 52.6, lng: -1.7 } },
      { id: 's2', name: 'Two', at: { lat: 52.65, lng: -1.75 } },
      { id: 's3', name: 'Three (not placed)' },
    ],
    currentStop: 0, revealMinutesBefore: 60, hostIds: ['host'], crewId: 'c1',
    filter: DEFAULT_FILTER, going: ['a', 'b'], checkIns: {}, ...overrides,
  };
}

describe('rolling meets', () => {
  test('stop 1 is visible to people going after the reveal, not before', () => {
    const e = rolling({ startsAt: mins(90) });
    expect(canSeeStop(e, 0, 'a', crews, NOW)).toBe(false); // reveal is at +30
    expect(canSeeStop(e, 0, 'a', crews, new Date(NOW.getTime() + 31 * 60_000))).toBe(true);
    expect(canSeeStop(e, 0, 'stranger', crews, new Date(NOW.getTime() + 31 * 60_000))).toBe(false);
  });

  test('hosts, including the crew owner, see every planned stop; plain crew members do not host', () => {
    const e = rolling();
    expect(isHost(e, 'crewmate', crews)).toBe(true);
    expect(isHost(e, 'plain', crews)).toBe(false);
    expect(canSeeStop(e, 1, 'plain', crews, NOW)).toBe(false);
    expect(canSeeStop(e, 1, 'host', crews, NOW)).toBe(true);
    expect(canSeeStop(e, 1, 'crewmate', crews, NOW)).toBe(true);
    expect(canSeeStop(e, 2, 'host', crews, NOW)).toBe(false); // no place yet
  });

  test('moving on shows the new meet point to everyone going; only people checked in are told', () => {
    let e = rolling();
    e = checkIn(e, 0, 'a');
    expect(canSeeStop(e, 1, 'a', crews, NOW)).toBe(false); // never one ahead
    e = moveOn(e, NOW);
    expect(e.currentStop).toBe(1);
    expect(e.stops[1].revealedAt).toBe(NOW.toISOString());
    expect(canSeeStop(e, 1, 'a', crews, NOW)).toBe(true);
    expect(canSeeStop(e, 1, 'b', crews, NOW)).toBe(true); // going, joined late: can find it now
    expect(canSeeStop(e, 1, 'stranger', crews, NOW)).toBe(false);
    expect(moveOnAudience(e, 0)).toEqual(['a']); // the "moved on" notice
  });

  test('a late joiner sees and checks in at the current meet point, never the next one', () => {
    const s3 = { id: 's3', name: 'Three', at: { lat: 52.7, lng: -1.8 } };
    const e = rolling({ stops: [...rolling().stops.slice(0, 2), s3], currentStop: 1, checkIns: { a: ['s1'] }, going: ['a', 'b', 'late'] });
    expect(canSeeStop(e, 1, 'late', crews, NOW)).toBe(true);
    expect(canSeeStop(e, 2, 'late', crews, NOW)).toBe(false);
    expect(canSeeStop(e, 2, 'a', crews, NOW)).toBe(false);
    expect(canCheckIn(e, 1, 'late', crews, NOW, null, true).ok).toBe(true);
    expect(canCheckIn(e, 2, 'late', crews, NOW, null, true).ok).toBe(false);
    // A meet point it has left: shown to people who were there, not to the late joiner.
    const later = moveOn(checkIn(e, 1, 'late'), NOW);
    expect(canSeeStop(later, 1, 'late', crews, NOW)).toBe(true);
    expect(canSeeStop(later, 1, 'b', crews, NOW)).toBe(false);
    expect(canSeeStop(later, 0, 'b', crews, NOW)).toBe(true);
    expect(moveOnAudience(later, 1)).toEqual(['late']);
  });

  test('moving on stops at the last planned stop', () => {
    const e = rolling({ stops: rolling().stops.slice(0, 2), currentStop: 1 });
    expect(() => moveOn(e, NOW)).toThrow();
  });

  test('every stop must be placed before the event', () => {
    expect(missingStops(rolling().stops).map((s) => s.id)).toEqual(['s3']);
  });

  test('check-in needs you near the current stop', () => {
    const e = rolling();
    expect(canCheckIn(e, 0, 'a', crews, NOW, { lat: 52.6, lng: -1.7 }).ok).toBe(true);
    expect(canCheckIn(e, 0, 'a', crews, NOW, { lat: 52.7, lng: -1.7 }).ok).toBe(false);
    expect(canCheckIn(e, 0, 'a', crews, NOW, null).ok).toBe(false);
    expect(canCheckIn(e, 0, 'a', crews, NOW, null, true).ok).toBe(true);
    expect(canCheckIn(e, 0, 'stranger', crews, NOW, null, true).ok).toBe(false);
  });

  test('you cannot check in at a stop the meet has left', () => {
    let e = checkIn(rolling(), 0, 'a');
    e = moveOn(e, NOW);
    expect(canCheckIn(e, 0, 'a', crews, NOW, null, true).ok).toBe(false);
    expect(canCheckIn(e, 1, 'a', crews, NOW, null, true).ok).toBe(true);
  });

  test('checking in twice does not duplicate', () => {
    const e = checkIn(checkIn(rolling(), 0, 'a'), 0, 'a');
    expect(e.checkIns.a).toEqual(['s1']);
  });
});

describe('other event types', () => {
  test('cruise route shows in full to people going after the reveal', () => {
    const e = rolling({ type: 'cruise', currentStop: 0 });
    expect(canSeeStop(e, 1, 'a', crews, NOW)).toBe(true);
    expect(canSeeStop(e, 1, 'stranger', crews, NOW)).toBe(false);
  });

  test('shows and track days are public', () => {
    const e = rolling({ type: 'show', startsAt: mins(10_000), going: [] });
    expect(canSeeStop(e, 0, 'stranger', crews, NOW)).toBe(true);
  });

  test('cancelled events hide their stops from guests', () => {
    const e = rolling({ type: 'meet', cancelled: true });
    expect(canSeeStop(e, 0, 'a', crews, NOW)).toBe(false);
    expect(phaseOf(e, NOW)).toBe('cancelled');
  });

  test('phases follow the clock', () => {
    const e = rolling({ startsAt: mins(90), endsAt: mins(200) });
    expect(phaseOf(e, NOW)).toBe('upcoming');
    expect(phaseOf(e, new Date(NOW.getTime() + 40 * 60_000))).toBe('revealed');
    expect(phaseOf(e, new Date(NOW.getTime() + 100 * 60_000))).toBe('live');
    expect(phaseOf(e, new Date(NOW.getTime() + 300 * 60_000))).toBe('over');
  });
});

describe('invites', () => {
  const b = (id: string, ownerId: string, extra: Partial<Build>): Build => ({
    id, ownerId, kind: 'car', make: 'BMW', model: 'M', stockBhp: 300, weightKg: 1450,
    mods: [1, 2, 3].map((i) => ({ id: `${id}${i}`, category: 'other' as const, name: 'x' })), photos: [], ...extra,
  });
  const users: User[] = [
    { id: 'near', handle: 'n', name: 'N', region: '', home: { lat: 52.6, lng: -1.7 } },
    { id: 'far', handle: 'f', name: 'F', region: '', home: { lat: 51.5, lng: -0.1 } },
    { id: 'bikeOnly', handle: 'b', name: 'B', region: '', home: { lat: 52.61, lng: -1.71 } },
  ];
  const builds: Build[] = [
    b('b1', 'near', {}),
    b('b2', 'far', {}),
    b('b3', 'bikeOnly', { kind: 'bike', make: 'Yamaha', stockBhp: 197, weightKg: 201 }),
  ];
  const area = { lat: 52.6, lng: -1.7 };

  test('radius keeps far-away people out', () => {
    expect(invitees(users, builds, DEFAULT_FILTER, area).userIds.sort()).toEqual(['bikeOnly', 'near']);
  });

  test('cars-only filter skips bikes', () => {
    expect(invitees(users, builds, { ...DEFAULT_FILTER, bikes: false }, area).userIds).toEqual(['near']);
  });

  test('class filter', () => {
    expect(invitees(users, builds, { ...DEFAULT_FILTER, classes: ['S'] }, area).userIds).toEqual(['bikeOnly']);
  });

  test('everyone welcome ignores the build filter but keeps the radius', () => {
    const f = { ...DEFAULT_FILTER, everyone: true, classes: ['S' as const], minMods: 10 };
    expect(invitees(users, builds, f, area).userIds.sort()).toEqual(['bikeOnly', 'near']);
  });

  test('min mods and brands', () => {
    expect(buildMatches(builds[0], { ...DEFAULT_FILTER, minMods: 4 })).toBe(false);
    expect(buildMatches(builds[0], { ...DEFAULT_FILTER, brands: ['bmw'] })).toBe(true);
    expect(buildMatches(builds[0], { ...DEFAULT_FILTER, brands: ['Audi'] })).toBe(false);
  });
});

describe('check-in window', () => {
  test('opens 30 minutes before the start and closes at the end', () => {
    const e = rolling({ startsAt: mins(60 * 48), endsAt: mins(60 * 50) });
    expect(checkInWindowOpen(e, NOW)).toBe(false);
    expect(checkInOpensAt(e).toISOString()).toBe(mins(60 * 48 - 30));
    expect(checkInWindowOpen(e, new Date(NOW.getTime() + (60 * 48 - 30) * 60_000))).toBe(true);
    expect(checkInWindowOpen(e, new Date(NOW.getTime() + 60 * 50 * 60_000))).toBe(false);
    expect(checkInWindowOpen({ ...rolling(), cancelled: true }, NOW)).toBe(false);
  });
});
