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
    const now = new Date();
    const s = seed(now);
    const awards = allAwards(s.votes, s.events, s.builds, now);
    const p = publicProfile('dan', s.users, s.builds, s.crews, s.events, awards, now)!;
    expect(p.handle).toBe('dan_r');
    expect(p.builds.length).toBeGreaterThan(0);
    expect(p.trophies.some((a) => a.category === 'best-in-show')).toBe(true);
    expect(p.crew?.id).toBe('nr');
    expect(p.meetsAttended).toBe(1);
    expect(JSON.stringify(p)).not.toContain('home');
    expect(Object.keys(p)).not.toContain('home');
    expect(publicProfile('nobody', s.users, s.builds, s.crews, s.events, awards, now)).toBeNull();
  });
});
