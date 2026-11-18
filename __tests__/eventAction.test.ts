import { myEventStatus } from '../src/lib/eventView';
import { eventPrimary, mixLine, openToLine, statusLine, untilText, whenLine } from '../src/lib/eventAction';
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

describe('eventPrimary: the one state, by the 3.5 table', () => {
  test("not going: I'm going when open to you, Ask to go when not", () => {
    expect(eventPrimary({ ...event, going: ['host'] }, 'me', 'invited', crews, [], at(-300))).toEqual({ kind: 'join', request: false });
    expect(eventPrimary({ ...event, going: ['host'] }, 'me', 'public', crews, [], at(-300))).toEqual({ kind: 'join', request: false });
    expect(eventPrimary({ ...event, going: ['host'] }, 'me', 'none', crews, [], at(-300))).toEqual({ kind: 'join', request: true });
    expect(eventPrimary({ ...event, going: ['host'], requests: ['me'] }, 'me', 'requested', crews, [], at(-300)).kind).toBe('requested');
    expect(eventPrimary({ ...event, going: ['host'], declined: ['me'] }, 'me', 'declined', crews, [], at(-300)).kind).toBe('declined');
  });

  test('going, before the location shows: waiting, with when it shows; the line has the one countdown', () => {
    const p = eventPrimary(event, 'me', 'going', crews, [], at(-80));
    expect(p).toEqual({ kind: 'waiting', at: at(-60).toISOString() });
    const line = statusLine(event, p, { me: 'me', crews, builds: [], users: [], votes: [], now: at(-80) }).text;
    expect(line).toMatch(/^Location shows at \d\d:\d\d \(in 20 min\)\.$/);
    expect(JSON.stringify(p) + line).not.toMatch(/unlock|stop/i);
  });

  test('not going and hidden: says who sees it and when', () => {
    const p = eventPrimary({ ...event, going: ['host'] }, 'me', 'invited', crews, [], at(-120));
    expect(statusLine({ ...event, going: ['host'] }, p, { me: 'me', crews, builds: [], users: [], votes: [], now: at(-120) }).text).toMatch(/^Location shows at \d\d:\d\d to people going\.$/);
    // Live, not going: the 4.11 words with no time (it has passed).
    const live = eventPrimary({ ...event, going: ['host'] }, 'me', 'invited', crews, [], at(10));
    expect(statusLine({ ...event, going: ['host'] }, live, { me: 'me', crews, builds: [], users: [], votes: [], now: at(10) }).text).toBe('Location shows to people going.');
  });

  test('not open to your car: why, and Ask to go', () => {
    const narrow = { ...event, going: ['host'], filter: { ...DEFAULT_FILTER, everyone: false, classes: ['S' as const, 'A' as const] } };
    const p = eventPrimary(narrow, 'me', 'none', crews, [], at(-300));
    expect(statusLine(narrow, p, { me: 'me', crews, builds: [], users: [], votes: [], now: at(-300) }).text).toBe('Open to Class A and up. Ask a host to let you in.');
    expect(openToLine({ ...DEFAULT_FILTER, everyone: false, cars: false, bikes: true })).toBe('Open to bikes only.');
  });

  test('going, the location is shown, before check-in opens: Navigate, and when check-in opens', () => {
    const p = eventPrimary(event, 'me', 'going', crews, [], at(-50));
    expect(p).toEqual({ kind: 'navigate', opensAt: at(-30).toISOString() });
    // The place line says only where (4.11, Review 14); the next step is the note.
    const line = statusLine(event, p, { me: 'me', crews, builds: [], users: [], votes: [], now: at(-50) });
    expect(line.text).toBe('Spot, Midlands.');
    expect(line.note).toMatch(/^Check-in opens at \d\d:\d\d \(in 20 min\)\.$/);
  });

  test('check-in opens 30 minutes before the start', () => {
    expect(eventPrimary(event, 'me', 'going', crews, [], at(-20))).toEqual({ kind: 'checkin', stopIndex: 0 });
  });

  test('checked in: Vote while voting is open, then Voted; Ended once it closes', () => {
    const b = [build('a', 'me', 'car', 300), build('b', 'host', 'car', 400)];
    const done = { ...event, checkIns: { me: ['s'] } };
    expect(eventPrimary(done, 'me', 'going', crews, b, at(10)).kind).toBe('vote');
    expect(eventPrimary(done, 'me', 'going', crews, b, at(200)).kind).toBe('vote');
    const v = [{ eventId: 'e', voterId: 'me', category: 'best-in-show' as const, buildId: 'b', at: at(20).toISOString() }];
    const voted = eventPrimary(done, 'me', 'going', crews, b, at(30), v);
    expect(voted.kind).toBe('voted');
    const votedLine = statusLine(done, voted, { me: 'me', crews, builds: b, users: [], votes: v, now: at(30) });
    expect(votedLine.text).toBe('Spot, Midlands.');
    expect(votedLine.note).toMatch(/^Results (tomorrow|tonight|\w{3}) \d\d:\d\d\.$/);
    // The demo: voting is closed for you once you've voted, so the results are in now (said once).
    expect(statusLine(done, voted, { me: 'me', crews, builds: b, users: [], votes: v, now: at(30), resultsIn: true }).note).toBe('Results are in.');
    // Checked in never hides the meet point, and the line never repeats "checked in" (the tag says it).
    const vote = eventPrimary(done, 'me', 'going', crews, b, at(10));
    const voteLine = statusLine(done, vote, { me: 'me', crews, builds: b, users: [], votes: [], now: at(10) });
    expect(voteLine.text).toBe('Spot, Midlands.');
    expect(voteLine.note).toMatch(/^Voting closes (tomorrow|tonight|\w{3}) \d\d:\d\d\.$/);
    const early = eventPrimary(done, 'me', 'going', crews, b, at(-10));
    const earlyLine = statusLine(done, early, { me: 'me', crews, builds: b, users: [], votes: [], now: at(-10) });
    expect(earlyLine.text).toBe('Spot, Midlands.');
    expect(earlyLine.note).toMatch(/^Voting opens at \d\d:\d\d\.$/);
    // Before the start, voting isn't open yet: just checked in.
    expect(eventPrimary(done, 'me', 'going', crews, b, at(-10))).toEqual({ kind: 'checkedIn', stopIndex: 0 });
    expect(eventPrimary(done, 'me', 'going', crews, b, at(180 + 25 * 60)).kind).toBe('ended');
  });

  test('cancelled and finished-without-you', () => {
    const c = eventPrimary({ ...event, cancelled: true }, 'me', 'going', crews, [], at(-20));
    expect(c.kind).toBe('cancelled');
    expect(statusLine(event, c, { me: 'me', crews, builds: [], users: [], votes: [], now: at(-20) }).text).toBe('Cancelled by the host.');
    expect(eventPrimary({ ...event, going: ['host'] }, 'me', 'invited', crews, [], at(200)).kind).toBe('ended');
  });

  test('a rolling meet: a late joiner goes straight to the meet point it is at now', () => {
    const rolling: NightEvent = {
      ...event, type: 'rolling', currentStop: 1,
      stops: [{ id: 's1', name: 'One', at: { lat: 52.6, lng: -1.7 } }, { id: 's2', name: 'Two', at: { lat: 52.7, lng: -1.7 }, revealedAt: at(20).toISOString() }],
    };
    expect(eventPrimary(rolling, 'me', 'going', crews, [], at(30))).toEqual({ kind: 'checkin', stopIndex: 1 });
    expect(eventPrimary({ ...rolling, checkIns: { me: ['s1'] } }, 'me', 'going', crews, [], at(30))).toEqual({ kind: 'checkin', stopIndex: 1 });
    const line = statusLine(rolling, { kind: 'checkin', stopIndex: 1 }, { me: 'me', crews, builds: [], users: [], votes: [], now: at(30) });
    // "Check-in is open" is the ActionBar's Check in, never the place line (Review 14).
    expect(line.text).toBe('Now at Two. Next location when the host moves on.');
    expect(line.note).toBeUndefined();
  });

  test('untilText', () => {
    // 4.10 order: the day, then the clock ("tomorrow 23:00", never "23:00 tomorrow").
    expect(untilText(at(60 * 24), at(0))).toMatch(/^(tomorrow|Sat|Sun|Mon|Tue|Wed|Thu|Fri) \d\d:\d\d$/);
  });
});

describe('whenLine', () => {
  test('relative and absolute', () => {
    expect(whenLine(event, at(300)).relative).toBe('Finished');
    expect(whenLine({ ...event, cancelled: true }, at(-30)).relative).toBe('Cancelled');
    expect(whenLine(event, at(30)).absolute).toMatch(/^\d\d:\d\d–\d\d:\d\d$/);
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

describe('myEventStatus: one status everywhere (Review 12, K3)', () => {
  test('going, checked in, went, hosting, hosted, none', () => {
    expect(myEventStatus(event, 'me', crews, at(-30))).toBe('going');
    expect(myEventStatus({ ...event, checkIns: { me: ['s'] } }, 'me', crews, at(10))).toBe('checkedIn');
    expect(myEventStatus({ ...event, checkIns: { me: ['s'] } }, 'me', crews, at(400))).toBe('went');
    expect(myEventStatus(event, 'me', crews, at(400))).toBe('went');
    expect(myEventStatus(event, 'host', crews, at(10))).toBe('hosting');
    expect(myEventStatus(event, 'host', crews, at(400))).toBe('hosted');
    expect(myEventStatus(event, 'stranger', crews, at(10))).toBeNull();
    expect(myEventStatus({ ...event, cancelled: true }, 'me', crews, at(10))).toBeNull();
  });
});
