import { createCrew, crewEvents, crewProblem, joinCrew, leaveCrew, normaliseTag, sortCrews } from '../src/lib/crews';
import { DEFAULT_FILTER } from '../src/lib/invites';
import type { Crew, NightEvent, User } from '../src/lib/types';

const home = { lat: 52.6, lng: -1.7 };
const users: User[] = [
  { id: 'me', handle: 'me', name: 'Me', region: 'Midlands', home, crewId: 'a' },
  { id: 'x', handle: 'x', name: 'X', region: 'Midlands', home, crewId: 'a' },
  { id: 'y', handle: 'y', name: 'Y', region: 'Midlands', home },
];
const crews: Crew[] = [
  { id: 'a', name: 'Alpha', tag: 'ALP', memberIds: ['me', 'x'] },
  { id: 'b', name: 'Bravo', tag: 'BR', memberIds: [] },
];

describe('crews', () => {
  test('joining a crew leaves your old one, and both lists stay in step', () => {
    const next = joinCrew({ crews, users }, 'me', 'b');
    expect(next.crews.find((c) => c.id === 'a')!.memberIds).toEqual(['x']);
    expect(next.crews.find((c) => c.id === 'b')!.memberIds).toEqual(['me']);
    expect(next.users.find((u) => u.id === 'me')!.crewId).toBe('b');
  });

  test('leaving', () => {
    const next = leaveCrew({ crews, users }, 'me');
    expect(next.crews[0].memberIds).toEqual(['x']);
    expect(next.users[0].crewId).toBeUndefined();
  });

  test('joining a crew that does not exist throws', () => {
    expect(() => joinCrew({ crews, users }, 'me', 'zzz')).toThrow();
  });

  test('creating a crew makes you its first member', () => {
    const next = createCrew({ crews, users }, 'y', 'Night Owls', 'owl', 'c');
    const crew = next.crews.find((c) => c.id === 'c')!;
    expect(crew).toEqual({ id: 'c', name: 'Night Owls', tag: 'OWL', memberIds: ['y'] });
    expect(next.users.find((u) => u.id === 'y')!.crewId).toBe('c');
  });

  test('names and tags are checked', () => {
    expect(crewProblem('ab', 'AB', crews)).toMatch(/3 characters/);
    expect(crewProblem('alpha', 'ZZ', crews)).toMatch(/already/);
    expect(crewProblem('Charlie', 'A', crews)).toMatch(/2 to 4/);
    expect(crewProblem('Charlie', 'ABCDE', crews)).toMatch(/2 to 4/);
    expect(crewProblem('Charlie', 'br', crews)).toMatch(/tag/);
    expect(crewProblem('Charlie', 'CH', crews)).toBeNull();
    expect(normaliseTag(' n-r! ')).toBe('NR');
  });

  test('crew events and sorting', () => {
    const ev = (id: string, crewId?: string, cancelled?: boolean): NightEvent => ({
      id, type: 'meet', title: id, startsAt: '2026-11-20T22:00:00Z', area: home, areaName: '', stops: [], currentStop: 0,
      revealMinutesBefore: 60, hostIds: [], crewId, filter: DEFAULT_FILTER, going: [], checkIns: {}, cancelled,
    });
    expect(crewEvents(crews[0], [ev('1', 'a'), ev('2', 'b'), ev('3', 'a', true)]).map((e) => e.id)).toEqual(['1']);
    expect(sortCrews(crews).map((c) => c.id)).toEqual(['a', 'b']);
  });
});
