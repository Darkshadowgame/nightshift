import { countdown, eventClock, mapHud, orderPins, unlocksIn } from '../src/lib/hud';
import { viewEvent } from '../src/lib/eventView';
import { plural } from '../src/lib/format';
import { DEFAULT_FILTER } from '../src/lib/invites';
import type { NightEvent } from '../src/lib/types';

const NOW = new Date('2026-11-20T22:00:00Z');
const mins = (m: number) => new Date(NOW.getTime() + m * 60_000).toISOString();

function meet(overrides: Partial<NightEvent> = {}): NightEvent {
  return {
    id: 'e1', type: 'meet', title: 'Test', startsAt: mins(120), endsAt: mins(240),
    area: { lat: 52.6, lng: -1.7 }, areaName: 'Area',
    stops: [{ id: 's1', name: 'One', at: { lat: 52.6, lng: -1.7 } }],
    currentStop: 0, revealMinutesBefore: 60, hostIds: ['host'],
    filter: DEFAULT_FILTER, going: ['me'], checkIns: {}, ...overrides,
  };
}
const view = (e: NightEvent, me = 'me') => viewEvent(e, me, [], [], [], NOW);

describe('countdown', () => {
  test('minutes, hours and days, rounded up so it never says 0m', () => {
    expect(countdown(mins(0.2), NOW)).toBe('1m');
    expect(countdown(mins(45), NOW)).toBe('45m');
    expect(countdown(mins(60), NOW)).toBe('1h');
    expect(countdown(mins(134), NOW)).toBe('2h 14m');
    expect(countdown(mins(60 * 50), NOW)).toBe('2d 2h');
    expect(countdown(mins(60 * 72), NOW)).toBe('3d');
  });
  test('the past is "now", never negative', () => {
    expect(countdown(mins(-5), NOW)).toBe('now');
  });
});

describe('event clock', () => {
  test('upcoming counts down to the start, live counts down to the end', () => {
    expect(eventClock(view(meet()), NOW)).toEqual({ label: 'Starts in', value: '2h', live: false });
    expect(eventClock(view(meet({ startsAt: mins(-10), endsAt: mins(90) })), NOW)).toEqual({ label: 'Live · ends in', value: '1h 30m', live: true });
    expect(eventClock(view(meet({ startsAt: mins(-200), endsAt: mins(-100) })), NOW).label).toBe('Finished');
    expect(eventClock(view(meet({ cancelled: true })), NOW).label).toBe('Cancelled');
  });

  test('unlock countdown only for people going who cannot see the place yet', () => {
    expect(unlocksIn(view(meet()), NOW)).toBe('1h');
    expect(unlocksIn(view(meet(), 'host'), NOW)).toBeNull(); // hosts always see it
    expect(unlocksIn(view(meet({ startsAt: mins(30) })), NOW)).toBeNull(); // already revealed
    expect(unlocksIn(view(meet({ type: 'show' })), NOW)).toBeNull(); // public
    expect(unlocksIn(view(meet({ going: [] }), 'stranger'), NOW)).toBeNull(); // not invited (no home, no build)
  });
});

describe('map HUD', () => {
  test('live events and the next one you are part of', () => {
    const live = meet({ id: 'live', startsAt: mins(-10), endsAt: mins(60) });
    const pub = meet({ id: 'show', type: 'show', startsAt: mins(30), going: [] });
    const mine = meet({ id: 'mine', startsAt: mins(90) });
    const old = meet({ id: 'old', startsAt: mins(-300), endsAt: mins(-200) });
    const hud = mapHud([live, pub, mine, old].map((e) => view(e)), NOW);
    expect(hud.live.map((v) => v.event.id)).toEqual(['live']);
    expect(hud.next?.event.id).toBe('mine'); // yours beats an earlier public show
    expect(hud.tonight).toBe(3);
  });

  test('falls back to a public event, and to nothing', () => {
    const pub = meet({ id: 'show', type: 'show', startsAt: mins(30), going: [] });
    expect(mapHud([view(pub)], NOW).next?.event.id).toBe('show');
    expect(mapHud([], NOW)).toEqual({ live: [], next: null, tonight: 0 });
  });
});

describe('pin order', () => {
  test('live pins draw last (on top), locked areas under visible events, spots at the bottom', () => {
    const pins = [
      { id: 'live', glyph: 'rolling', live: true },
      { id: 'lock', glyph: 'locked' },
      { id: 'spot', glyph: 'photo' },
      { id: 'meet', glyph: 'meet' },
      { id: 'lock2', glyph: 'locked' },
    ];
    expect(orderPins(pins).map((p) => p.id)).toEqual(['spot', 'lock', 'lock2', 'meet', 'live']);
  });
});

test('plural', () => {
  expect(plural(1, 'build')).toBe('1 build');
  expect(plural(2, 'build')).toBe('2 builds');
  expect(plural(0, 'trophy', 'trophies')).toBe('0 trophies');
});
