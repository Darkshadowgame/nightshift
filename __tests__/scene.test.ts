import { bundledSpots } from '../src/lib/placeStore';
import { DEMO_HOME, NEAR_YOU, sampleHomes, seed, seededStops } from '../src/data/seed';
import { areaGivesAway } from '../src/lib/area';
import { isPublicType } from '../src/lib/events';
import { milesBetween } from '../src/lib/geo';
import { applySceneNames, nearest, sameHome, stopsToName, translate } from '../src/lib/scene';
import { DEFAULT_SETTINGS, upgradeSettings } from '../src/lib/settings';

const NOW = new Date(2026, 10, 17, 21, 0);
const LEEDS = { lat: 53.8, lng: -1.55 };
const TRURO = { lat: 50.26, lng: -5.05 };

describe('moving the sample scene', () => {
  test('a point keeps its distance and direction from home', () => {
    const p = { lat: 52.6842, lng: -1.8105 };
    const moved = translate(p, DEMO_HOME, LEEDS);
    expect(milesBetween(moved, LEEDS)).toBeCloseTo(milesBetween(p, DEMO_HOME), 1);
    expect(moved.lat).toBeGreaterThan(LEEDS.lat); // still north
    expect(moved.lng).toBeLessThan(LEEDS.lng); // still west
    expect(translate(p, DEMO_HOME, DEMO_HOME)).toEqual(p);
  });

  test('sample meets are drawn round your home, not the Midlands', () => {
    const s = seed(NOW, { home: LEEDS });
    for (const id of ['ev-rolling-live', 'ev-rolling-host', 'ev-meet-soon', 'ev-meet-tam', 'ev-past-snowdome']) {
      const e = s.events.find((x) => x.id === id)!;
      for (const st of e.stops) expect(milesBetween(st.at!, LEEDS)).toBeLessThan(15);
      expect(e.areaName).toBe(NEAR_YOU);
    }
    const homes = sampleHomes(LEEDS);
    for (const u of s.users) expect(milesBetween(u.home, LEEDS)).toBeLessThan(35);
    expect(homes.size).toBe(s.users.length);
    expect(s.users.every((u) => u.region === 'Yorkshire')).toBe(true);
  });

  test('rough areas keep the fuzzing rules: never on a stop', () => {
    for (const home of [LEEDS, TRURO, DEMO_HOME]) {
      for (const e of seed(NOW, { home }).events) {
        if (!isPublicType(e.type)) expect(areaGivesAway(e)).toBe(false);
      }
    }
  });

  test('cruises use the nearest real drives, shows and track days the nearest real venues', () => {
    const s = seed(NOW, { home: LEEDS });
    const cruise = s.events.find((e) => e.id === 'ev-cruise-peak')!;
    const ride = s.events.find((e) => e.id === 'ev-bike-cat')!;
    expect(cruise.title).toMatch(/^Night cruise: /);
    expect(ride.title).not.toBe(cruise.title.replace('Night cruise', 'Sunrise ride'));
    const drive = bundledSpots().find((x) => cruise.title.endsWith(x.name))!;
    expect(drive.kind).toBe('drive');
    expect(cruise.stops[0].at).toEqual(drive.path![0]);
    const show = s.events.find((e) => e.id === 'ev-show-don')!;
    expect(bundledSpots().some((x) => x.kind === 'track' && x.name === show.stops[0].name)).toBe(true);
  });

  test('sample stops get neutral names; the geocoder names them without touching host edits', () => {
    const s = seed(NOW, { home: LEEDS });
    const seeded = seededStops(LEEDS);
    const todo = stopsToName(s.events, seeded, {});
    expect(todo.map((t) => t.id)).toContain('rl-1');
    const live = s.events.find((e) => e.id === 'ev-rolling-live')!;
    expect(live.stops[0].name).toBe('Retail park car park');
    const edited = s.events.map((e) => (e.id === 'ev-rolling-live' ? { ...e, stops: e.stops.map((st, i) => (i === 1 ? { ...st, name: 'My spot' } : st)) } : e));
    const names = { 'rl-1': 'Birstall Retail Park, Leeds', 'rl-2': 'Somewhere', 'pc-1': 'A57, Glossop', 'area:ev-rolling-live': 'Leeds' };
    const out = applySceneNames(edited, names, seeded).find((e) => e.id === 'ev-rolling-live')!;
    expect(out.stops[0].name).toBe('Birstall Retail Park, Leeds');
    expect(out.stops[1].name).toBe('My spot');
    expect(out.areaName).toBe('Leeds');
    const cruise = applySceneNames(edited, names, seeded).find((e) => e.id === 'ev-cruise-peak')!;
    expect(cruise.stops[0].name).toBe('Start: A57, Glossop');
    // seeding with the names gives the same result, so "untouched demo" still compares like with like
    expect(seed(NOW, { home: LEEDS, names }).events.find((e) => e.id === 'ev-rolling-live')!.stops[0].name).toBe('Birstall Retail Park, Leeds');
  });

  test('helpers', () => {
    expect(nearest([{ at: LEEDS, n: 'a' }, { at: TRURO, n: 'b' }], DEMO_HOME, 1)[0].n).toBe('a');
    expect(sameHome(LEEDS, { ...LEEDS })).toBe(true);
    expect(sameHome(undefined, LEEDS)).toBe(false);
    expect(sameHome(LEEDS, TRURO)).toBe(false);
  });
});

describe('real GPS by default', () => {
  test('new installs use real GPS', () => {
    expect(DEFAULT_SETTINGS.simulateGps).toBe(false);
  });
  test('old saves are switched to real GPS once, then left alone', () => {
    expect(upgradeSettings({ ...DEFAULT_SETTINGS, simulateGps: true }, false).simulateGps).toBe(false);
    expect(upgradeSettings({ ...DEFAULT_SETTINGS, simulateGps: true }, true).simulateGps).toBe(true);
    expect(upgradeSettings(undefined, false)).toEqual(DEFAULT_SETTINGS);
    expect(upgradeSettings({ reminders: false }, true).reminders).toBe(false);
  });
});
