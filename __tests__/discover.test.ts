import { seed } from '../src/data/seed';
import { DEFAULT_FILTER } from '../src/lib/invites';
import {
  alertProblem,
  DEFAULT_ALERTS,
  DEFAULT_TRAVEL_MILES,
  defaultFilters,
  describeDistance,
  inWindow,
  isNearbyMatch,
  nearbyArrivals,
  nearbyBatch,
  nearbyNotice,
  parseMiles,
  searchEvents,
  travelOf,
  travelProblem,
  welcomes,
  windowFor,
  type Who,
} from '../src/lib/discover';
import { applyProfile, profileProblem } from '../src/lib/profile';
import { milesBetween } from '../src/lib/geo';
import type { Build, NightEvent, User } from '../src/lib/types';

// Fictional people and places (Lincolnshire, well away from anyone real).
const HOME = { lat: 53.22, lng: -0.54 };
/** A point `miles` north of home. */
const north = (miles: number) => ({ lat: HOME.lat + miles / 69.05, lng: HOME.lng });

const me: User = { id: 'me', handle: 'me', name: 'Me', home: HOME, region: 'East', travelMiles: 25, alerts: 'notify' };
const host: User = { id: 'host', handle: 'host', name: 'Host', home: north(3), region: 'East' };
const car: Build = { id: 'b-car', ownerId: 'me', kind: 'car', make: 'Honda', model: 'Civic Type R', stockBhp: 316, weightKg: 1430, mods: [], photos: [] };

const NOW = new Date(2026, 10, 18, 20, 0); // Wed 18 Nov 2026, 20:00 local

function ev(id: string, over: Partial<NightEvent> = {}): NightEvent {
  return {
    id,
    type: 'meet',
    title: `Event ${id}`,
    startsAt: new Date(NOW.getTime() + 2 * 3_600_000).toISOString(),
    area: north(5),
    areaRadiusMiles: 3,
    areaName: 'Lincoln',
    stops: [{ id: `${id}-1`, name: 'Secret car park', at: north(6) }],
    currentStop: 0,
    revealMinutesBefore: 60,
    hostIds: ['host'],
    filter: { ...DEFAULT_FILTER, minMods: 0, radiusMiles: 25 },
    going: ['host'],
    checkIns: {},
    ...over,
  };
}

const who = (user: User = me, builds: Build[] = [car]): Who => ({ me: user.id, crews: [], users: [user, host], builds });

describe('willing to travel', () => {
  test('whole miles from 1 to 300', () => {
    expect(travelProblem(25)).toBeNull();
    expect(travelProblem(1)).toBeNull();
    expect(travelProblem(300)).toBeNull();
    expect(travelProblem(0)).toMatch(/1 to 300/);
    expect(travelProblem(301)).toMatch(/1 to 300/);
    expect(travelProblem(2.5)).toMatch(/whole/);
    expect(travelProblem(undefined)).toMatch(/how far/);
    expect(travelProblem(NaN)).toMatch(/how far/);
  });

  test('custom distances are read from what people type', () => {
    expect(parseMiles('40')).toBe(40);
    expect(parseMiles(' 40 mi ')).toBe(40);
    expect(parseMiles('15 miles')).toBe(15);
    expect(parseMiles('forty')).toBeNull();
    expect(parseMiles('-5')).toBeNull();
    expect(parseMiles('')).toBeNull();
  });

  test('defaults until you pick, and bad saved values fall back', () => {
    expect(travelOf(undefined)).toEqual({ miles: DEFAULT_TRAVEL_MILES, alerts: DEFAULT_ALERTS });
    expect(travelOf({ travelMiles: 50, alerts: 'search' })).toEqual({ miles: 50, alerts: 'search' });
    expect(travelOf({ travelMiles: 9999, alerts: 'loud' as never })).toEqual({ miles: DEFAULT_TRAVEL_MILES, alerts: DEFAULT_ALERTS });
  });

  test('alert mode is notify, search or off', () => {
    expect(alertProblem('notify')).toBeNull();
    expect(alertProblem('search')).toBeNull();
    expect(alertProblem('off')).toBeNull();
    expect(alertProblem('loud')).toMatch(/hear about/);
  });

  test('saved with the profile, checked first, kept when left out', () => {
    const draft = { handle: 'night_owl', name: 'Me', region: 'East', home: HOME };
    expect(profileProblem({ ...draft, travelMiles: 0 }, [me], 'me')).toMatch(/1 to 300/);
    expect(profileProblem({ ...draft, alerts: 'loud' as never }, [me], 'me')).toMatch(/hear about/);
    const saved = applyProfile(me, { ...draft, travelMiles: 50, alerts: 'off' });
    expect(saved).toMatchObject({ travelMiles: 50, alerts: 'off' });
    const kept = applyProfile(saved, draft);
    expect(kept).toMatchObject({ travelMiles: 50, alerts: 'off' });
  });
});

describe('distance', () => {
  test('is measured to the rough area, never to a stop', () => {
    const e = ev('a', { area: north(10), stops: [{ id: 's', name: 'Hidden', at: north(1) }] });
    const hits = searchEvents([e], who(), HOME, defaultFilters(25), NOW);
    expect(hits[0].miles).toBeCloseTo(10, 0);
    expect(hits[0].miles).toBeCloseTo(milesBetween(HOME, e.area), 6);
  });

  test('reads plainly', () => {
    expect(describeDistance(0.4)).toBe('under 1 mi');
    expect(describeDistance(12.4)).toBe('about 12 mi');
  });
});

describe('when', () => {
  test('tonight runs to 5am', () => {
    const w = windowFor('tonight', NOW)!;
    expect(w.to).toEqual(new Date(2026, 10, 19, 5, 0));
    const small = new Date(2026, 10, 19, 2, 0);
    expect(windowFor('tonight', small)!.to).toEqual(new Date(2026, 10, 19, 5, 0));
  });

  test('the weekend is Friday 5pm to Monday 5am, and from now once it has started', () => {
    expect(windowFor('weekend', NOW)).toEqual({ from: new Date(2026, 10, 20, 17, 0), to: new Date(2026, 10, 23, 5, 0) });
    const sat = new Date(2026, 10, 21, 13, 0);
    expect(windowFor('weekend', sat)).toEqual({ from: sat, to: new Date(2026, 10, 23, 5, 0) });
    const earlyMon = new Date(2026, 10, 23, 3, 0);
    expect(windowFor('weekend', earlyMon)).toEqual({ from: earlyMon, to: new Date(2026, 10, 23, 5, 0) });
    const lateMon = new Date(2026, 10, 23, 9, 0);
    expect(windowFor('weekend', lateMon)!.from).toEqual(new Date(2026, 10, 27, 17, 0));
  });

  test('live events count for tonight; any time has no window', () => {
    const live = ev('live', { startsAt: new Date(NOW.getTime() - 30 * 60_000).toISOString() });
    expect(inWindow(live, windowFor('tonight', NOW))).toBe(true);
    const later = ev('later', { startsAt: new Date(2026, 10, 21, 22, 0).toISOString() });
    expect(inWindow(later, windowFor('tonight', NOW))).toBe(false);
    expect(inWindow(later, windowFor('week', NOW))).toBe(true);
    expect(inWindow(later, windowFor('weekend', NOW))).toBe(true);
    expect(windowFor('any', NOW)).toBeNull();
  });
});

describe('find events', () => {
  const near = ev('near', { area: north(4) });
  const mid = ev('mid', { area: north(12), type: 'cruise' });
  const far = ev('far', { area: north(60), filter: { ...DEFAULT_FILTER, minMods: 0, radiusMiles: 100 } });
  const bikes = ev('bikes', { area: north(8), filter: { ...DEFAULT_FILTER, cars: false, bikes: true, minMods: 0, radiusMiles: 25 } });
  const classS = ev('class-s', { area: north(6), filter: { ...DEFAULT_FILTER, classes: ['S'], minMods: 0, radiusMiles: 25 } });
  const show = ev('show', { area: north(20), type: 'show', revealMinutesBefore: 0 });
  const gone = ev('gone', { area: north(2), cancelled: true });
  const done = ev('done', { area: north(2), startsAt: new Date(NOW.getTime() - 10 * 3_600_000).toISOString() });
  const all = [far, mid, near, bikes, classS, show, gone, done];
  const ids = (hits: { view: { event: NightEvent } }[]) => hits.map((h) => h.view.event.id);

  test('nearest first, inside your travel distance, finished and cancelled left out', () => {
    expect(ids(searchEvents(all, who(), HOME, defaultFilters(25), NOW))).toEqual(['near', 'class-s', 'bikes', 'mid', 'show']);
  });

  test('any distance finds the far one too', () => {
    expect(ids(searchEvents(all, who(), HOME, { ...defaultFilters(25), maxMiles: null }, NOW))).toContain('far');
  });

  test('by type', () => {
    expect(ids(searchEvents(all, who(), HOME, { ...defaultFilters(25), types: ['cruise', 'show'] }, NOW))).toEqual(['mid', 'show']);
  });

  test('"I can go" keeps only events you would be straight in to', () => {
    const hits = searchEvents(all, who(), HOME, defaultFilters(25), NOW);
    expect(hits.find((h) => h.view.event.id === 'class-s')!.canGo).toBe(false); // the Civic isn't S class
    expect(hits.find((h) => h.view.event.id === 'bikes')!.canGo).toBe(false); // no bike
    expect(hits.find((h) => h.view.event.id === 'show')!.canGo).toBe(true); // public
    expect(ids(searchEvents(all, who(), HOME, { ...defaultFilters(25), canGoOnly: true }, NOW))).toEqual(['near', 'mid', 'show']);
  });

  test('cars or bikes', () => {
    expect(welcomes(bikes.filter, 'cars')).toBe(false);
    expect(welcomes(bikes.filter, 'bikes')).toBe(true);
    expect(welcomes({ ...bikes.filter, everyone: true }, 'cars')).toBe(true);
    expect(ids(searchEvents(all, who(), HOME, { ...defaultFilters(25), vehicles: 'bikes' }, NOW))).toEqual(['near', 'class-s', 'bikes', 'mid', 'show']);
    expect(ids(searchEvents(all, who(), HOME, { ...defaultFilters(25), vehicles: 'cars' }, NOW))).not.toContain('bikes');
  });

  test('by date', () => {
    const weekend = ev('weekend', { area: north(3), startsAt: new Date(2026, 10, 21, 22, 0).toISOString() });
    const f = { ...defaultFilters(25) };
    expect(ids(searchEvents([near, weekend], who(), HOME, { ...f, when: 'tonight' }, NOW))).toEqual(['near']);
    expect(ids(searchEvents([near, weekend], who(), HOME, { ...f, when: 'weekend' }, NOW))).toEqual(['weekend']);
    expect(ids(searchEvents([near, weekend], who(), HOME, { ...f, when: 'week' }, NOW))).toEqual(['weekend', 'near']);
  });

  test('locked events only show the rough area', () => {
    const hit = searchEvents([near], who(), HOME, defaultFilters(25), NOW)[0];
    expect(hit.view.role).toBe('invited');
    expect(hit.view.shownStop).toBe(-1);
    const shown = searchEvents([show], who(), HOME, defaultFilters(25), NOW)[0];
    expect(shown.view.shownStop).toBe(0);
  });

  test('from where you are instead of home', () => {
    const there = north(60);
    expect(ids(searchEvents(all, who(), there, defaultFilters(10), NOW))).toEqual(['far']);
  });
});

describe('new events near you', () => {
  test('eligible, inside your distance, not already yours', () => {
    expect(isNearbyMatch(ev('ok'), who(), NOW)).toBe(true);
    // Your build doesn't fit the filter.
    expect(isNearbyMatch(ev('s', { filter: { ...DEFAULT_FILTER, classes: ['S'], minMods: 0, radiusMiles: 25 } }), who(), NOW)).toBe(false);
    // Everyone welcome needs no build.
    expect(isNearbyMatch(ev('all', { filter: { ...DEFAULT_FILTER, everyone: true, radiusMiles: 25 } }), who(me, []), NOW)).toBe(true);
    // Public shows and track days are open to anyone.
    expect(isNearbyMatch(ev('show', { type: 'show', revealMinutesBefore: 0 }), who(me, []), NOW)).toBe(true);
    // Outside your travel distance (the host's invite radius would have covered it).
    const shortHop = { ...me, travelMiles: 5 };
    expect(isNearbyMatch(ev('far', { area: north(8) }), who(shortHop), NOW)).toBe(false);
    // Outside the host's invite radius: you'd only be able to ask.
    expect(isNearbyMatch(ev('narrow', { area: north(20), filter: { ...DEFAULT_FILTER, minMods: 0, radiusMiles: 10 } }), who(), NOW)).toBe(false);
    // Already going, hosting, asked or turned down.
    expect(isNearbyMatch(ev('going', { going: ['host', 'me'] }), who(), NOW)).toBe(false);
    expect(isNearbyMatch(ev('mine', { hostIds: ['me'] }), who(), NOW)).toBe(false);
    expect(isNearbyMatch(ev('asked', { requests: ['me'], filter: { ...DEFAULT_FILTER, classes: ['S'], minMods: 0, radiusMiles: 25 } }), who(), NOW)).toBe(false);
    // Started, or cancelled.
    expect(isNearbyMatch(ev('live', { startsAt: new Date(NOW.getTime() - 60_000).toISOString() }), who(), NOW)).toBe(false);
    expect(isNearbyMatch(ev('off', { cancelled: true }), who(), NOW)).toBe(false);
  });

  test('only events that have just appeared count, once', () => {
    const a = ev('a');
    const b = ev('b', { filter: { ...DEFAULT_FILTER, classes: ['S'], minMods: 0, radiusMiles: 25 } });
    const first = nearbyArrivals([a, b], [], who(), NOW);
    expect(first.arrived).toEqual(['a', 'b']);
    expect(first.matches.map((e) => e.id)).toEqual(['a']);
    const again = nearbyArrivals([a, b], first.arrived, who(), NOW);
    expect(again).toEqual({ arrived: [], matches: [] });
  });

  test('the message never names a stop, a street or a distance', () => {
    const e = ev('x', { title: 'Late one', areaName: 'Lincoln' });
    const n = nearbyNotice(e, NOW);
    expect(n.title).toBe('New meet near you');
    expect(n.body).toBe('Late one · Tonight 22:00 · Lincoln');
    expect(`${n.title} ${n.body}`).not.toMatch(/car park|mi\b|\d+\.\d+/);
    expect(n.url).toBe('/event/x');
    expect(n.key).toBe('ns.x.nearby');
  });

  test('several at once make one phone notification that opens Find events', () => {
    expect(nearbyBatch([], NOW)).toBeNull();
    expect(nearbyBatch([ev('one')], NOW)!.url).toBe('/event/one');
    const batch = nearbyBatch([ev('one'), ev('two'), ev('three')], NOW)!;
    expect(batch.title).toBe('3 new events near you');
    expect(batch.url).toBe('/search?tab=events');
    expect(nearbyBatch([ev('s1', { type: 'show' }), ev('s2', { type: 'trackday' })], NOW)!.title).toBe('2 new shows and track days near you');
  });
});

describe('the demo scene', () => {
  // An evening: the rolling meet has started (the demo lays its meets out at real evening times).
  const now = new Date(2026, 10, 18, 20, 30);
  const s = seed(now);
  // You start fresh (no car, no events): add a stock car, as the first-run step does.
  const stock = { id: 'b-new', ownerId: 'me', kind: 'car' as const, make: 'Ford', model: 'Fiesta ST', stockBhp: 197, weightKg: 1262, mods: [], photos: [] };
  const meWho: Who = { me: 'me', crews: s.crews, users: s.users, builds: [...s.builds, stock] };

  test("you start fresh: hosting nothing, in no crew, going only to Sunday coffee (so you can say you can't make it), and you went to last week's meet", () => {
    expect(s.builds.filter((b) => b.ownerId === 'me')).toHaveLength(0);
    expect(s.users.find((u) => u.id === 'me')!.crewId).toBeUndefined();
    for (const e of s.events) {
      // Last week's meet counts on Me as a meet you went to (Review 17).
      const past = e.id === 'ev-past-snowdome';
      expect(e.going.includes('me')).toBe(e.id === 'ev-meet-soon' || past);
      expect(e.hostIds).not.toContain('me');
      if (past) expect(e.checkIns.me).toEqual(['ps-1']);
      else expect(Object.keys(e.checkIns)).not.toContain('me');
    }
    expect(s.crews.some((c) => c.memberIds.includes('me') || (c.hostIds ?? []).includes('me'))).toBe(false);
    expect(s.votes.some((v) => v.voterId === 'me')).toBe(false);
  });

  test("on first run, the hot hatch meet is new near you; the coffee meet you're going to, your own and finished ones are not", () => {
    const { arrived, matches } = nearbyArrivals(s.events, [], meWho, now);
    const ids = matches.map((e) => e.id);
    expect(arrived).toHaveLength(s.events.length);
    expect(ids).toContain('ev-meet-tam');
    expect(ids).not.toContain('ev-meet-soon'); // you're going already
    expect(ids).not.toContain('ev-rolling-live'); // live already
    expect(ids).not.toContain('ev-cruise-peak'); // S and A class only
    expect(ids).not.toContain('ev-past-snowdome'); // finished
    expect(ids).not.toContain('ev-bike-cat'); // bikes only, and you have a car
  });

  test('a short travel distance stops the alert but never hides anything from Find events', () => {
    const short = { ...meWho, users: s.users.map((u) => (u.id === 'me' ? { ...u, travelMiles: 1 } : u)) };
    expect(nearbyArrivals(s.events, [], short, now).matches.map((e) => e.id)).not.toContain('ev-meet-soon');
    const home = s.users.find((u) => u.id === 'me')!.home;
    const all = searchEvents(s.events, short, home, { ...defaultFilters(1), maxMiles: null }, now);
    expect(all.length).toBeGreaterThanOrEqual(7);
  });
});

describe('find summary', () => {
  const { defaultFilters, describeFilters, hitNote } = jest.requireActual('../src/lib/discover') as typeof import('../src/lib/discover');
  it('sums up the usual search in one line', () => {
    expect(describeFilters(defaultFilters(25), false)).toBe('25 mi from home · any time · cars and bikes');
  });
  it('adds what else is set', () => {
    const f = { ...defaultFilters(25), maxMiles: null, when: 'tonight' as const, vehicles: 'bikes' as const, types: ['show' as const, 'meet' as const], canGoOnly: true };
    expect(describeFilters(f, true)).toBe('any distance from where you are · tonight · bikes · meet, show · only ones I can go to');
  });
  it('words each result with the glossary', () => {
    expect(hitNote({ miles: 12.4, canGo: true, view: { role: 'invited' } }, false)).toBe('about 12 mi from home · you can go');
    expect(hitNote({ miles: 0.5, canGo: false, view: { role: 'requested' } }, true)).toBe('under 1 mi away · requested');
    expect(hitNote({ miles: 30, canGo: false, view: { role: 'none' } }, false)).toBe('about 30 mi from home · request to go');
    expect(hitNote({ miles: 2, canGo: true, view: { role: 'host' } }, false)).toBe("about 2 mi from home · you're hosting");
    expect(hitNote({ miles: 2, canGo: true, view: { role: 'going' } }, false)).toBe("about 2 mi from home · you're going");
    expect(hitNote({ miles: 2, canGo: true, view: { role: 'invited', event: { type: 'meet', filter: { everyone: true } } } }, false)).toBe('about 2 mi from home');
    expect(hitNote({ miles: 2, canGo: true, view: { role: 'public' } }, false)).toBe('about 2 mi from home');
  });
});
