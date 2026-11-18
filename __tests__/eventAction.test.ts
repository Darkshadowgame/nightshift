import { eventPrimary, mixLine, whenLine } from '../src/lib/eventAction';
import { classRange, DEFAULT_FILTER, fromVehicleSelection, vehicleSelection } from '../src/lib/invites';
import type { Build, Crew, NightEvent } from '../src/lib/types';

const crews: Crew[] = [];
const start = new Date('2026-11-20T22:00:00Z');
const at = (mins: number) => new Date(start.getTime() + mins * 60_000);
const event: NightEvent = {
  id: 'e', type: 'meet', title: 'Meet', startsAt: start.toISOString(), endsAt: at(180).toISOString(),
  area: { lat: 52.6, lng: -1.7 }, areaName: 'Midlands',
  stops: [{ id: 's', name: 'Spot', at: { lat: 52.62, lng: -1.72 } }], currentStop: 0, revealMinutesBefore: 60,
  hostIds: ['host'], filter: DEFAULT_FILTER, going: ['host', 'me'], checkIns: {},
};
const build = (id: string, ownerId: string, kind: 'car' | 'bike', bhp: number, mods = 3): Build => ({
  id, ownerId, kind, make: 'Make', model: id, stockBhp: bhp, weightKg: kind === 'car' ? 1400 : 200, photos: [],
  mods: Array.from({ length: mods }, (_, i) => ({ id: `${id}${i}`, category: 'engine' as const, name: `Mod ${i}` })),
});

describe('eventPrimary: the one action, by state', () => {
  test('not going: I\'m going when invited, Request to go when not', () => {
    expect(eventPrimary({ ...event, going: ['host'] }, 'me', 'invited', crews, [], at(-300))).toEqual({ kind: 'join', request: false });
    expect(eventPrimary({ ...event, going: ['host'] }, 'me', 'public', crews, [], at(-300))).toEqual({ kind: 'join', request: false });
    expect(eventPrimary({ ...event, going: ['host'] }, 'me', 'none', crews, [], at(-300))).toEqual({ kind: 'join', request: true });
    expect(eventPrimary({ ...event, going: ['host'], requests: ['me'] }, 'me', 'requested', crews, [], at(-300)).kind).toBe('requested');
    expect(eventPrimary({ ...event, going: ['host'], declined: ['me'] }, 'me', 'declined', crews, [], at(-300)).kind).toBe('declined');
  });

  test('going, before the reveal: Navigate, not ready, says when it unlocks', () => {
    const p = eventPrimary(event, 'me', 'going', crews, [], at(-120));
    expect(p).toEqual({ kind: 'navigate', ready: false, hint: 'The stop unlocks for people going in 1h.' });
  });

  test('going, unlocked, before check-in opens: Navigate is ready', () => {
    const p = eventPrimary(event, 'me', 'going', crews, [], at(-50));
    expect(p.kind).toBe('navigate');
    expect(p.kind === 'navigate' && p.ready).toBe(true);
  });

  test('check-in opens 30 minutes before the start', () => {
    expect(eventPrimary(event, 'me', 'going', crews, [], at(-20))).toEqual({ kind: 'checkin', stopIndex: 0 });
  });

  test('checked in: Vote while voting is open, and after the end until it closes', () => {
    const b = [build('a', 'me', 'car', 300), build('b', 'host', 'car', 400)];
    const done = { ...event, checkIns: { me: ['s'] } };
    expect(eventPrimary(done, 'me', 'going', crews, b, at(10)).kind).toBe('vote');
    expect(eventPrimary(done, 'me', 'going', crews, b, at(200)).kind).toBe('vote');
    // Before the start, voting isn't open yet: just checked in.
    expect(eventPrimary(done, 'me', 'going', crews, b, at(-10))).toEqual({ kind: 'checkedIn', stopIndex: 0 });
    // Voting closed: nothing left.
    expect(eventPrimary(done, 'me', 'going', crews, b, at(180 + 25 * 60)).kind).toBe('none');
  });

  test('cancelled and finished-without-you have no primary', () => {
    expect(eventPrimary({ ...event, cancelled: true }, 'me', 'going', crews, [], at(-20)).kind).toBe('none');
    expect(eventPrimary({ ...event, going: ['host'] }, 'me', 'invited', crews, [], at(200)).kind).toBe('none');
  });

  test('a rolling meet: the next stop waits for the hosts to move on', () => {
    const rolling: NightEvent = {
      ...event, type: 'rolling', currentStop: 1,
      stops: [{ id: 's1', name: 'One', at: { lat: 52.6, lng: -1.7 } }, { id: 's2', name: 'Two', at: { lat: 52.7, lng: -1.7 }, revealedAt: at(20).toISOString() }],
    };
    const p = eventPrimary(rolling, 'me', 'going', crews, [], at(30));
    expect(p.kind).toBe('navigate');
    expect(p.kind === 'navigate' && p.hint).toMatch(/hosts move on/);
    expect(eventPrimary({ ...rolling, checkIns: { me: ['s1'] } }, 'me', 'going', crews, [], at(30))).toEqual({ kind: 'checkin', stopIndex: 1 });
  });
});

describe('whenLine', () => {
  test('relative and absolute', () => {
    expect(whenLine(event, at(-130)).relative).toBe('Starts in 2h 10m');
    expect(whenLine(event, at(30))).toEqual({ relative: 'Live now, ends in 2h 30m', absolute: expect.stringMatching(/^\d\d:\d\d–\d\d:\d\d$/) });
    expect(whenLine(event, at(300)).relative).toBe('Finished');
    expect(whenLine({ ...event, cancelled: true }, at(-30)).relative).toBe('Cancelled');
  });
});

describe('mixLine', () => {
  test('plain words, not class codes', () => {
    const b = [build('a', 'me', 'car', 300), build('b', 'host', 'car', 310), build('c', 'x', 'bike', 120)];
    const line = mixLine({ ...event, going: ['me', 'host', 'x'] }, b);
    expect(line).toMatch(/^2 cars, 1 bike/);
    expect(mixLine({ ...event, going: [] }, b)).toBe('');
  });
});

describe('invite chips', () => {
  test('nothing selected is cars and bikes; one is only that', () => {
    expect(vehicleSelection({ cars: true, bikes: true })).toEqual([]);
    expect(vehicleSelection({ cars: false, bikes: true })).toEqual(['bike']);
    expect(fromVehicleSelection([])).toEqual({ cars: true, bikes: true });
    expect(fromVehicleSelection(['car'])).toEqual({ cars: true, bikes: false });
    expect(fromVehicleSelection(['car', 'bike'])).toEqual({ cars: true, bikes: true });
  });

  test('class ranges read lowest first', () => {
    expect(classRange(['S', 'A'])).toBe('A–S');
    expect(classRange(['S'])).toBe('S');
    expect(classRange(['S', 'B'])).toBe('B, S');
    expect(classRange(['A', 'B', 'C'])).toBe('C–A');
  });
});
