import { allAwards } from '../src/lib/awards';
import { applyProfile, handleProblem, normaliseHandle, profileProblem } from '../src/lib/profile';
import { publicProfile } from '../src/lib/people';
import { seed } from '../src/data/seed';

const users = seed(new Date()).users;
const me = users.find((u) => u.id === 'me')!;

describe('first-run profile', () => {
  test('handles are tidied and checked', () => {
    expect(normaliseHandle(' @Night_Owl ')).toBe('night_owl');
    expect(handleProblem('ab', users, 'me')).toMatch(/3/);
    expect(handleProblem('bad handle', users, 'me')).toMatch(/letters/);
    expect(handleProblem('dan_r', users, 'me')).toMatch(/already/);
    expect(handleProblem('you', users, 'me')).toBeNull(); // your own handle is fine
    expect(handleProblem('fresh.one', users, 'me')).toBeNull();
  });

  test('every field is needed', () => {
    const draft = { handle: 'fresh', name: 'Sam', region: 'Midlands', home: { lat: 52.6312, lng: -1.6987 } };
    expect(profileProblem(draft, users, 'me')).toBeNull();
    expect(profileProblem({ ...draft, name: ' ' }, users, 'me')).toMatch(/name/);
    expect(profileProblem({ ...draft, region: 'Mars' }, users, 'me')).toMatch(/region/);
    expect(profileProblem({ ...draft, home: null }, users, 'me')).toMatch(/home/);
  });

  test('home is saved fuzzed, the id stays the same', () => {
    const u = applyProfile(me, { handle: '@Fresh', name: ' Sam ', region: 'London', home: { lat: 51.50734, lng: -0.12776 } });
    expect(u.id).toBe('me');
    expect(u.handle).toBe('fresh');
    expect(u.name).toBe('Sam');
    expect(u.home.lat).toBeCloseTo(51.51, 5);
    expect(u.home.lng).toBeCloseTo(-0.13, 5);
  });
});

describe('other people', () => {
  test('a public profile has builds and trophies but no location', () => {
    const now = new Date(2026, 10, 18, 20, 30); // an evening: the rolling meet is on
    const s = seed(now);
    const awards = allAwards(s.votes, s.events, s.builds, now);
    const p = publicProfile('dan', s.users, s.builds, s.crews, s.events, awards, now)!;
    expect(p.handle).toBe('dan_r');
    expect(p.builds.length).toBeGreaterThan(0);
    expect(p.trophies.some((a) => a.category === 'best-in-show')).toBe(true);
    expect(p.crew?.id).toBe('nr');
    // The finished sample meet and the live rolling meet he's checked in at (attended counts from check-in).
    expect(p.meetsAttended).toBe(2);
    expect(JSON.stringify(p)).not.toContain('home');
    expect(Object.keys(p)).not.toContain('home');
    expect(publicProfile('nobody', s.users, s.builds, s.crews, s.events, awards, now)).toBeNull();
  });
});

describe('a made-up demo handle (REVIEW-9)', () => {
  const { suggestHandle, handleProblem } = jest.requireActual('../src/lib/profile') as typeof import('../src/lib/profile');
  test('from the car, or "night", and always a valid handle', () => {
    expect(suggestHandle('Civic Type R FK8', 4821)).toBe('civic_4821');
    expect(suggestHandle(undefined, 1234)).toBe('night_1234');
    expect(suggestHandle('86', 1234)).toBe('night_1234');
    for (const h of [suggestHandle('Golf GTI Mk7', 9999), suggestHandle('', 1000)]) expect(handleProblem(h, [], 'me')).toBeNull();
  });
});

describe('area names come from the nearest town (Review 12 decision 1)', () => {
  const { areaNameNear, nearestTown } = jest.requireActual('../src/lib/profile') as typeof import('../src/lib/profile');
  const { TOWNS } = jest.requireActual('../src/data/towns') as typeof import('../src/data/towns');
  it('names the demo area Tamworth, never the region', () => {
    expect(nearestTown({ lat: 52.62, lng: -1.7 })).toBe('Tamworth');
    expect(areaNameNear({ lat: 52.62, lng: -1.7 })).toBe('Tamworth');
    expect(areaNameNear({ lat: 52.48, lng: -1.9 })).toBe('Birmingham');
  });
  it('falls back to the region far from any town', () => {
    expect(nearestTown({ lat: 58.6, lng: -4.9 }, 20)).toBeNull();
    expect(areaNameNear({ lat: 58.6, lng: -4.9 })).toBe('Scotland');
  });
  it('keeps every town in the UK and named once', () => {
    expect(new Set(TOWNS.map((t) => t.name)).size).toBe(TOWNS.length);
    for (const t of TOWNS) {
      expect(t.at.lat).toBeGreaterThan(49.8);
      expect(t.at.lat).toBeLessThan(61);
      expect(t.at.lng).toBeGreaterThan(-8.3);
      expect(t.at.lng).toBeLessThan(1.8);
    }
  });
});
