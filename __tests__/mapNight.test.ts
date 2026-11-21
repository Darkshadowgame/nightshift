import type { EventView } from '../src/lib/eventView';
import {
  BUSY_GOING, eveningOffset, eveningStart, eveningTimes, glowLevel, glowRadii, homePlace, milesFromLine, nearLine, onAt, onAtLine, stripMeets, VERY_BUSY_GOING,
} from '../src/lib/mapNight';

// Saturday 21 Nov 2026, 20:10 local.
const NOW = new Date(2026, 10, 21, 20, 10);
const at = (h: number, m = 0, days = 0) => new Date(2026, 10, 21 + days, h, m);

function view(id: string, start: Date, hours: number, going = 3, phase = 'upcoming'): EventView {
  const end = new Date(start.getTime() + hours * 3_600_000);
  return {
    event: { id, title: `Meet ${id}`, type: 'meet', startsAt: start.toISOString(), endsAt: end.toISOString(), going: Array.from({ length: going }, (_, i) => `u${i}`) } as never,
    role: 'public', phase: phase as never, status: null, shownStop: -1,
  };
}

describe('tonight strip', () => {
  const views = [
    view('late', at(23), 2),
    view('soon', at(21), 2),
    view('live', at(19), 3, 9, 'live'),
    view('over', at(17), 2),
    view('tomorrow', at(20, 0, 1), 2),
    view('mid', at(22), 2),
  ];
  test('live first, then soonest, three at most, nothing ended', () => {
    expect(stripMeets(views, NOW).map((m) => m.id)).toEqual(['live', 'soon', 'mid']);
  });
  test('says Live or the clock, and the going count', () => {
    const [a, b] = stripMeets(views, NOW);
    expect(a).toMatchObject({ time: 'Live', live: true, going: 9 });
    expect(b).toMatchObject({ time: '21:00', live: false, going: 3 });
  });
  test('fewer than three is fine, none is empty', () => {
    expect(stripMeets([views[0]], NOW)).toHaveLength(1);
    expect(stripMeets([], NOW)).toEqual([]);
  });
});

describe('time check', () => {
  test('the evening starts at 18:00, and the small hours belong to the night before', () => {
    expect(eveningStart(NOW)).toEqual(at(18));
    expect(eveningStart(at(1, 15, 1))).toEqual(at(18));
  });
  test('steps are 30 minutes, kept inside 18:00 to 02:00', () => {
    expect(eveningTimes(NOW, 0)).toEqual(at(18));
    expect(eveningTimes(NOW, 100)).toEqual(at(19, 30));
    expect(eveningTimes(NOW, 9999)).toEqual(at(2, 0, 1));
    expect(eveningTimes(NOW, -50)).toEqual(at(18));
  });
  test('offset is the inverse, clamped', () => {
    expect(eveningOffset(NOW, at(20))).toBe(120);
    expect(eveningOffset(NOW, at(9))).toBe(0);
    expect(eveningOffset(NOW, at(5, 0, 1))).toBe(480);
  });
  test('a meet is on from its start until its end', () => {
    const v = view('x', at(21), 2);
    expect(onAt(v, at(20, 59))).toBe(false);
    expect(onAt(v, at(21))).toBe(true);
    expect(onAt(v, at(22, 59))).toBe(true);
    expect(onAt(v, at(23))).toBe(false);
  });
  test('the line says how many are on', () => {
    expect(onAtLine(0, at(22, 30))).toBe('No meets on at 22:30');
    expect(onAtLine(1, at(22, 30))).toBe('1 meet on at 22:30');
    expect(onAtLine(3, at(22, 30))).toBe('3 meets on at 22:30');
  });
});

describe('busy glow', () => {
  test('levels follow the going count', () => {
    expect(glowLevel(0)).toBe(0);
    expect(glowLevel(BUSY_GOING - 1)).toBe(0);
    expect(glowLevel(BUSY_GOING)).toBe(1);
    expect(glowLevel(VERY_BUSY_GOING - 1)).toBe(1);
    expect(glowLevel(VERY_BUSY_GOING)).toBe(2);
  });
  test('rings grow with the level', () => {
    expect(glowRadii(0)).toEqual([]);
    expect(glowRadii(1)).toHaveLength(1);
    expect(glowRadii(2)).toHaveLength(2);
  });
});

describe('near my way home', () => {
  // Made-up points in the Midlands: a line about 13 miles west to east.
  const start = { lat: 52.7, lng: -2.0 };
  const end = { lat: 52.7, lng: -1.7 };
  test('a point beside the line is near, one far off is not', () => {
    expect(milesFromLine({ lat: 52.72, lng: -1.85 }, start, end)).toBeLessThan(2);
    expect(milesFromLine({ lat: 52.9, lng: -1.85 }, start, end)).toBeGreaterThan(10);
  });
  test('beyond the ends it measures to the end point, not the infinite line', () => {
    expect(milesFromLine({ lat: 52.7, lng: -1.4 }, start, end)).toBeGreaterThan(10);
  });
  test('start and end the same point still works', () => {
    expect(milesFromLine({ lat: 52.7, lng: -1.9 }, start, start)).toBeGreaterThan(4);
    expect(milesFromLine(start, start, start)).toBe(0);
  });
  test('picks the meets within ten minutes of the line', () => {
    const places = [
      { id: 'near', at: { lat: 52.71, lng: -1.8 } },
      { id: 'far', at: { lat: 52.95, lng: -1.8 } },
      { id: 'on', at: { lat: 52.7, lng: -1.9 } },
    ];
    expect(nearLine(start, end, places)).toEqual(['near', 'on']);
    expect(nearLine(start, end, places, 0.1)).toEqual(['on']);
  });
  test('Home is the entry labelled Home, whatever the case; none means nothing', () => {
    expect(homePlace(undefined)).toBeNull();
    expect(homePlace([])).toBeNull();
    expect(homePlace([{ id: 'a', label: 'Work', lat: 1, lng: 2 }])).toBeNull();
    expect(homePlace([{ id: 'a', label: 'Work', lat: 1, lng: 2 }, { id: 'b', label: ' home ', lat: 52.5, lng: -1.5 }])).toEqual({ lat: 52.5, lng: -1.5 });
    expect(homePlace([{ id: 'b', label: 'Home', lat: 'x', lng: 1 }])).toBeNull();
    expect(homePlace('nope')).toBeNull();
  });
});
