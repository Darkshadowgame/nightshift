import { DEFAULT_EVENT_FILTER, filterEvents, filterLine, NO_EVENT_FILTER, savedEventFilter, whenEnds, type EventFilter } from '../src/lib/eventFilter';
import type { EventView, Role } from '../src/lib/eventView';
import type { EventType } from '../src/lib/types';

// Wednesday 18 Nov 2026, 21:00 local.
const NOW = new Date(2026, 10, 18, 21, 0);
const at = (days: number, hour: number) => new Date(2026, 10, 18 + days, hour, 0).toISOString();

function view(id: string, type: EventType, startsAt: string, role: Role = 'invited', phase = 'upcoming'): EventView {
  return { event: { id, type, startsAt } as never, role, phase: phase as never, status: null, shownStop: -1 };
}

const VIEWS: EventView[] = [
  view('live', 'meet', at(0, 19), 'public', 'live'),
  view('late', 'cruise', at(1, 1)), // 01:00 tonight
  view('notOpen', 'meet', at(0, 22), 'none'),
  view('requested', 'rolling', at(0, 23), 'requested'),
  view('fri', 'meet', at(2, 20)), // Friday: this week
  view('friCruise', 'cruise', at(2, 21)),
  view('nextWeek', 'rolling', at(8, 20)),
  view('show', 'show', at(0, 22), 'public'),
  view('goingNextWeek', 'meet', at(9, 20), 'going'),
  view('hostingNotOpen', 'cruise', at(10, 20), 'host'),
];
const ids = (r: { shown: EventView[] }) => r.shown.map((v) => v.event.id);
const f = (x: Partial<EventFilter>): EventFilter => ({ ...NO_EVENT_FILTER, ...x });

describe('event filter defaults', () => {
  test('Tonight and Only ones I can go to by default', () => {
    expect(DEFAULT_EVENT_FILTER).toEqual({ when: 'tonight', types: [], canGoOnly: true });
    expect(savedEventFilter(undefined)).toEqual(DEFAULT_EVENT_FILTER);
  });
  test('odd saves are cleaned; every type picked means all', () => {
    expect(savedEventFilter({ when: 'soon' as never, types: ['meet', 'x' as never], canGoOnly: 'y' as never })).toEqual({ when: 'tonight', types: ['meet'], canGoOnly: true });
    expect(savedEventFilter({ when: 'all', types: ['rolling', 'meet', 'cruise'], canGoOnly: false })).toEqual(NO_EVENT_FILTER);
  });
  test('tonight ends at 05:00, this week with Sunday night', () => {
    const e = whenEnds(NOW);
    expect(new Date(e.tonight)).toEqual(new Date(2026, 10, 19, 5, 0));
    expect(new Date(e.week)).toEqual(new Date(2026, 10, 23, 5, 0));
  });
});

describe('filterEvents', () => {
  test('All, nothing on: everything shows', () => {
    const r = filterEvents(VIEWS, NO_EVENT_FILTER, true, NOW);
    expect(r.shown).toHaveLength(VIEWS.length);
    expect([r.hiddenByFilters, r.hiddenByCar]).toEqual([0, 0]);
  });
  test('Tonight: live now and starting before 05:00, plus yours', () => {
    expect(ids(filterEvents(VIEWS, f({ when: 'tonight' }), true, NOW))).toEqual(['live', 'late', 'notOpen', 'requested', 'show', 'goingNextWeek', 'hostingNotOpen']);
  });
  test('This week: to Sunday night', () => {
    expect(ids(filterEvents(VIEWS, f({ when: 'week' }), true, NOW))).toEqual(['live', 'late', 'notOpen', 'requested', 'fri', 'friCruise', 'show', 'goingNextWeek', 'hostingNotOpen']);
  });
  test('Type chips: Cruises only (shows go too), yours stay', () => {
    expect(ids(filterEvents(VIEWS, f({ types: ['cruise'] }), true, NOW))).toEqual(['late', 'friCruise', 'goingNextWeek', 'hostingNotOpen']);
  });
  test('Only ones I can go to hides meets not open to you, keeps requested and yours', () => {
    const r = filterEvents(VIEWS, f({ canGoOnly: true }), true, NOW);
    expect(ids(r)).not.toContain('notOpen');
    expect(ids(r)).toContain('requested');
    expect([r.hiddenByFilters, r.hiddenByCar]).toEqual([0, 1]);
  });
  test('Events off: only yours', () => {
    const r = filterEvents(VIEWS, NO_EVENT_FILTER, false, NOW);
    expect(ids(r)).toEqual(['goingNextWeek', 'hostingNotOpen']);
    expect(r.hiddenByFilters).toBe(8);
  });
  test('counts split filters from car, each event counted once', () => {
    const r = filterEvents(VIEWS, DEFAULT_EVENT_FILTER, true, NOW);
    expect(ids(r)).toEqual(['live', 'late', 'requested', 'show', 'goingNextWeek', 'hostingNotOpen']);
    expect(r.hiddenByCar).toBe(1);
    expect(r.hiddenByFilters).toBe(3);
    expect(r.shown.length + r.hiddenByCar + r.hiddenByFilters).toBe(VIEWS.length);
  });
  test('the count is only meets inside When: meets you go to or host next week show but are is not "tonight" (Review 18)', () => {
    const r = filterEvents(VIEWS, DEFAULT_EVENT_FILTER, true, NOW);
    expect(r.shown.map((v) => v.event.id)).toContain('goingNextWeek');
    expect(r.shownInWhen).toBe(r.shown.length - 2);
  });
});

describe('filterLine', () => {
  test('everything shown after Show: a way back (Review 19)', () => {
    expect(filterLine(filterEvents(VIEWS, NO_EVENT_FILTER, true, NOW), NO_EVENT_FILTER, true, true)).toEqual({ text: '10 meets · Filters off', action: { label: 'Reset', clears: 'reset' } });
  });
  test('filters hid some: says by what, and Show', () => {
    const line = filterLine(filterEvents(VIEWS, DEFAULT_EVENT_FILTER, true, NOW), DEFAULT_EVENT_FILTER, true, true)!;
    expect(line.text).toBe('4 meets tonight · 4 hidden by your filters');
    expect(line.action).toEqual({ label: 'Show', clears: 'all' });
  });
  test('only the car hid some: Show; no car says so', () => {
    const r = filterEvents(VIEWS, f({ canGoOnly: true }), true, NOW);
    expect(filterLine(r, f({ canGoOnly: true }), true, true)).toEqual({ text: '9 meets · 1 not for your car', action: { label: 'Show', clears: 'all' } });
    expect(filterLine(r, f({ canGoOnly: true }), true, false)!.text).toBe('9 meets · 1 need a car');
  });
  test('Events off says so', () => {
    expect(filterLine(filterEvents(VIEWS, NO_EVENT_FILTER, false, NOW), NO_EVENT_FILTER, false, true)!.text).toBe('2 meets · 8 hidden, Events off');
  });
});
