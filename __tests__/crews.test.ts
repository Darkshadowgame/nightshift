import { addToCrew, createCrew, crewEvents, crewHostLoss, crewless, crewProblem, crewRole, isCrewHost, joinCrew, leaveCrew, normaliseTag, setCrewHost, sortCrews, withRoles } from '../src/lib/crews';
import { isHost } from '../src/lib/events';
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
    expect(crew).toEqual({ id: 'c', name: 'Night Owls', tag: 'OWL', memberIds: ['y'], ownerId: 'y', hostIds: [] });
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

  describe('roles', () => {
    const crew: Crew = { id: 'r', name: 'Roles', tag: 'RL', memberIds: ['o', 'h', 'm'], ownerId: 'o', hostIds: ['h'] };
    const people: User[] = ['o', 'h', 'm', 'n'].map((id) => ({ id, handle: id, name: id, region: 'Midlands', home, crewId: id === 'n' ? undefined : 'r' }));
    const state = { crews: [crew], users: people };
    const event = { crewId: 'r', hostIds: ['someone'] } as unknown as NightEvent;

    test('owner and hosts host crew events; plain members and outsiders do not', () => {
      expect(crewRole(crew, 'o')).toBe('owner');
      expect(crewRole(crew, 'h')).toBe('host');
      expect(crewRole(crew, 'm')).toBe('member');
      expect(crewRole(crew, 'n')).toBeUndefined();
      expect(isHost(event, 'o', [crew])).toBe(true);
      expect(isHost(event, 'h', [crew])).toBe(true);
      expect(isHost(event, 'm', [crew])).toBe(false);
    });

    test('joining makes you a plain member, never a host', () => {
      const next = joinCrew(state, 'n', 'r');
      const c = next.crews[0];
      expect(crewRole(c, 'n')).toBe('member');
      expect(isCrewHost(c, 'n')).toBe(false);
      expect(isHost(event, 'n', next.crews)).toBe(false);
    });

    test('only the owner picks hosts', () => {
      const made = setCrewHost(state, 'o', 'r', 'm', true);
      expect(crewRole(made.crews[0], 'm')).toBe('host');
      expect(crewRole(setCrewHost(made, 'o', 'r', 'm', false).crews[0], 'm')).toBe('member');
      expect(() => setCrewHost(state, 'h', 'r', 'm', true)).toThrow(/owner/);
      expect(() => setCrewHost(state, 'o', 'r', 'n', true)).toThrow(/not in this crew/);
    });

    test('a host who leaves loses the role; an owner who leaves hands over to a host', () => {
      const hostLeft = leaveCrew(state, 'h').crews[0];
      expect(hostLeft.hostIds).toEqual([]);
      const ownerLeft = leaveCrew(state, 'o').crews[0];
      expect(ownerLeft.ownerId).toBe('h');
      expect(ownerLeft.hostIds).toEqual([]);
      const noHosts = leaveCrew({ ...state, crews: [{ ...crew, hostIds: [] }] }, 'o').crews[0];
      expect(noHosts.ownerId).toBe('h'); // longest-standing member
    });

    test('crews saved before roles get their first member as owner', () => {
      expect(withRoles({ id: 'x', name: 'Old', tag: 'OLD', memberIds: ['a', 'b'] })).toMatchObject({ ownerId: 'a', hostIds: [] });
    });
  });
});

describe('crew host rights when you move crews', () => {
  const now = new Date('2026-11-20T20:00:00Z');
  const ev = (id: string, hostIds: string[], startsInMin: number, extra: Partial<NightEvent> = {}): NightEvent => ({
    id, type: 'meet', title: id, startsAt: new Date(now.getTime() + startsInMin * 60_000).toISOString(),
    area: home, areaName: 'Here', stops: [{ id: `${id}-s`, name: 'Spot', at: home }], currentStop: 0, revealMinutesBefore: 60,
    hostIds, crewId: 'a', filter: DEFAULT_FILTER, going: [], checkIns: {}, ...extra,
  });
  const roled: Crew[] = [{ id: 'a', name: 'Alpha', tag: 'ALP', memberIds: ['me', 'x'], ownerId: 'x', hostIds: ['me'] }, crews[1]];
  const events = [
    ev('crew-only', ['x'], 30),
    ev('named', ['x', 'me'], 30),
    ev('finished', ['x'], -600),
    ev('cancelled', ['x'], 30, { cancelled: true }),
  ];

  test('lists only crew events you host through the crew, still to come', () => {
    expect(crewHostLoss('me', { crews: roled, users }, events, now).map((e) => e.id)).toEqual(['crew-only']);
  });

  test('after leaving, named co-host rights stay and crew-only ones go', () => {
    const left = leaveCrew({ crews: roled, users }, 'me');
    expect(isHost(events[1], 'me', left.crews)).toBe(true);
    expect(isHost(events[0], 'me', left.crews)).toBe(false);
  });

  test('plain members lose nothing', () => {
    const plain: Crew[] = [{ ...roled[0], hostIds: [] }];
    expect(crewHostLoss('me', { crews: plain, users }, events, now)).toEqual([]);
  });
});

describe('bringing sample people into your crew (demo)', () => {
  test('the owner adds someone crewless, who can then be made a host', () => {
    const started = createCrew({ crews, users }, 'me', 'Night Owls', 'owl', 'c');
    expect(crewless(started, ['me']).map((u) => u.id)).toEqual(['y']);
    const added = addToCrew(started, 'me', 'c', 'y');
    expect(added.crews.find((c) => c.id === 'c')!.memberIds).toEqual(['me', 'y']);
    expect(added.users.find((u) => u.id === 'y')!.crewId).toBe('c');
    const hosted = setCrewHost(added, 'me', 'c', 'y', true);
    expect(crewRole(hosted.crews.find((c) => c.id === 'c')!, 'y')).toBe('host');
  });

  test('only owners and hosts add people, and never someone already in a crew', () => {
    const started = createCrew({ crews, users }, 'me', 'Night Owls', 'owl', 'c');
    expect(() => addToCrew(started, 'y', 'c', 'y')).toThrow('Only the owner');
    expect(() => addToCrew(started, 'me', 'c', 'x')).toThrow('already in a crew');
  });
});
