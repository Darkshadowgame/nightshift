import { idsWithoutBlocked, visibleConversations, withoutBlocked } from '../src/lib/blocking';
import { crewMeets, crewVehicles, mutualMeets } from '../src/lib/crewPage';
import { EMBLEMS, emblemLabel, emblemOf, isEmblem, withEmblem } from '../src/lib/crewEmblems';
import { DEFAULT_FILTER } from '../src/lib/invites';
import type { Conversation } from '../src/lib/messages';
import { QUICK_REPLIES, showQuickReplies } from '../src/lib/quickReplies';
import { modelKey, sameModelNear } from '../src/lib/sameModel';
import type { Build, Crew, NightEvent, User } from '../src/lib/types';

const NOW = new Date('2026-11-20T12:00:00Z');
const home = { lat: 52.6, lng: -1.7 };
const user = (id: string, region = 'West Midlands'): User => ({ id, handle: id, name: id, home, region });
const build = (id: string, ownerId: string, make: string, model: string): Build => ({ id, ownerId, kind: 'car', make, model, stockBhp: 100, weightKg: 1000, mods: [], photos: [] });
const ev = (id: string, startsAt: string, extra: Partial<NightEvent> = {}): NightEvent => ({
  id, type: 'meet', title: id, startsAt, endsAt: new Date(new Date(startsAt).getTime() + 3 * 3600_000).toISOString(), area: home, areaName: '',
  stops: [{ id: `${id}-s`, name: 'Stop', at: home }], currentStop: 0, revealMinutesBefore: 60, hostIds: ['x'],
  filter: DEFAULT_FILTER, going: [], checkIns: {}, ...extra,
});

describe('quick replies', () => {
  test('three short replies', () => {
    expect(QUICK_REPLIES).toEqual(['On my way', 'Where are you parked?', 'Running late']);
  });
  test('shown only on an empty box in a chat you can send in', () => {
    expect(showQuickReplies('', true)).toBe(true);
    expect(showQuickReplies('  ', true)).toBe(true);
    expect(showQuickReplies('h', true)).toBe(false);
    expect(showQuickReplies('', false)).toBe(false);
  });
});

describe('crew emblems', () => {
  test('a built-in set, and the server pattern accepts exactly it', () => {
    expect(EMBLEMS.length).toBe(48);
    expect(EMBLEMS.every(isEmblem)).toBe(true);
    expect(isEmblem('bolt-8')).toBe(false);
    expect(isEmblem('logo.png')).toBe(false);
    expect(isEmblem(undefined)).toBe(false);
  });
  test('a crew with none picked still gets a steady emblem', () => {
    const c = { id: 'crew-1' };
    expect(isEmblem(emblemOf(c))).toBe(true);
    expect(emblemOf(c)).toBe(emblemOf({ id: 'crew-1' }));
    expect(emblemOf({ id: 'crew-1', emblem: 'star-2' })).toBe('star-2');
    expect(emblemOf({ id: 'crew-1', emblem: 'junk' })).toBe(emblemOf(c));
  });
  test('only the owner picks, and only from the set', () => {
    const crews: Crew[] = [{ id: 'c', name: 'C', tag: 'CC', memberIds: ['o', 'm'], ownerId: 'o', hostIds: [] }];
    expect(withEmblem(crews, 'o', 'c', 'wheel-3')[0].emblem).toBe('wheel-3');
    expect(() => withEmblem(crews, 'm', 'c', 'wheel-3')).toThrow(/owner/);
    expect(() => withEmblem(crews, 'o', 'c', 'nope')).toThrow(/list/);
    expect(emblemLabel('wheel-3')).toBe('Wheel, blue');
  });
});

describe('crew page', () => {
  const crew: Crew = { id: 'c', name: 'C', tag: 'CC', memberIds: ['a', 'b', 'z'], ownerId: 'a', hostIds: [] };
  const users = [user('a'), user('b'), user('z'), user('q')];
  const builds = [build('1', 'a', 'Mazda', 'MX-5'), build('2', 'b', 'Honda', 'Civic'), build('3', 'z', 'Ford', 'Fiesta'), build('4', 'q', 'Seat', 'Leon')];
  test('members vehicles, blocked members left out', () => {
    expect(crewVehicles(crew, users, builds).map((v) => v.build.id)).toEqual(['1', '2', '3']);
    expect(crewVehicles(crew, users, builds, new Set(['b'])).map((v) => v.build.id)).toEqual(['1', '3']);
  });
  test('upcoming meets members are going to, soonest first, counts only, blocked not counted', () => {
    const events = [
      ev('later', '2026-11-27T19:00:00Z', { going: ['a', 'b'] }),
      ev('soon', '2026-11-21T19:00:00Z', { going: ['a', 'q'] }),
      ev('nobody', '2026-11-22T19:00:00Z', { going: ['q'] }),
      ev('over', '2026-11-10T19:00:00Z', { going: ['a'] }),
      ev('cancelled', '2026-11-23T19:00:00Z', { going: ['a'], cancelled: true }),
    ];
    const meets = crewMeets(crew, events, NOW);
    expect(meets.map((m) => [m.event.id, m.crewGoing])).toEqual([['soon', 1], ['later', 2]]);
    expect(crewMeets(crew, events, NOW, new Set(['b'])).map((m) => [m.event.id, m.crewGoing])).toEqual([['soon', 1], ['later', 1]]);
    expect(crewMeets(crew, events, NOW, new Set(['a', 'b'])).length).toBe(0);
  });
});

describe('mutual meets', () => {
  const events = [
    ev('m1', '2026-10-01T19:00:00Z', { checkIns: { me: ['m1-s'], them: ['m1-s'] } }),
    ev('m2', '2026-10-15T19:00:00Z', { checkIns: { me: ['m2-s'], them: ['m2-s'] } }),
    ev('m3', '2026-11-01T19:00:00Z', { checkIns: { me: ['m3-s'], them: ['m3-s'] } }),
    ev('m4', '2026-11-05T19:00:00Z', { checkIns: { me: ['m4-s'], them: ['m4-s'] } }),
    ev('only-me', '2026-11-06T19:00:00Z', { checkIns: { me: ['only-me-s'] } }),
    ev('going-only', '2026-11-07T19:00:00Z', { going: ['me', 'them'] }),
    ev('cancelled', '2026-11-08T19:00:00Z', { checkIns: { me: ['cancelled-s'], them: ['cancelled-s'] }, cancelled: true }),
  ];
  test('count, and the most recent few', () => {
    const r = mutualMeets(events, 'me', 'them', NOW);
    expect(r.count).toBe(4);
    expect(r.recent.map((e) => e.id)).toEqual(['m4', 'm3', 'm2']);
  });
  test('nothing for yourself or strangers', () => {
    expect(mutualMeets(events, 'me', 'me', NOW).count).toBe(0);
    expect(mutualMeets(events, 'me', 'nobody', NOW)).toEqual({ count: 0, recent: [] });
  });
});

describe('same model near you', () => {
  const users = [user('me'), user('a'), user('b', 'Scotland'), user('c'), user('d'), user('e')];
  const builds = [
    build('0', 'me', 'Mazda', 'MX-5'),
    build('1', 'a', 'mazda', 'mx5'),
    build('2', 'b', 'Mazda', 'MX-5'),
    build('3', 'c', 'Mazda', 'MX-5'),
    build('4', 'd', 'Honda', 'Civic'),
    build('5', 'e', 'Mazda', 'MX-5'),
  ];
  const base = { me: 'me', users, builds, blocked: new Set<string>() };
  test('matches make and model loosely', () => {
    expect(modelKey({ make: 'Mazda', model: 'MX-5' })).toBe(modelKey({ make: 'mazda', model: 'mx5' }));
  });
  test('same region and same model only', () => {
    expect(sameModelNear(base).map((m) => m.user.id)).toEqual(['a', 'c', 'e']);
  });
  test('blocked people, people who opted out, and connections never appear', () => {
    expect(sameModelNear({ ...base, blocked: new Set(['a']), hidden: new Set(['c']), skip: new Set(['e']) })).toEqual([]);
  });
  test('opting out yourself hides the list, and no garage means no list', () => {
    expect(sameModelNear({ ...base, meHidden: true })).toEqual([]);
    expect(sameModelNear({ ...base, builds: builds.slice(1) })).toEqual([]);
  });
  test('capped', () => {
    expect(sameModelNear({ ...base, max: 2 }).length).toBe(2);
  });
});

describe('blocking helpers', () => {
  const blocked = new Set(['bad']);
  test('lists lose blocked people', () => {
    expect(idsWithoutBlocked(['a', 'bad', 'b'], blocked)).toEqual(['a', 'b']);
    expect(withoutBlocked([{ u: 'bad' }, { u: 'a' }, { u: null }], (x) => x.u, blocked)).toEqual([{ u: 'a' }, { u: null }]);
  });
  const conv = (id: string, kind: 'direct' | 'group', memberIds: string[], senderId: string | null = null): Conversation => ({
    id, kind, memberIds, adminIds: [], lastMessageAt: '2026-11-20T10:00:00Z', unread: 2, canSend: true, last: { body: 'hi', senderId, kind: 'text' },
  });
  test('chat list hides a 1-to-1 with a blocked person and quotes no blocked sender', () => {
    const out = visibleConversations([conv('d1', 'direct', ['me', 'bad']), conv('d2', 'direct', ['me', 'a']), conv('g1', 'group', ['me', 'a', 'bad'], 'bad'), conv('g2', 'group', ['me', 'a'], 'a')], 'me', blocked);
    expect(out.map((c) => c.id)).toEqual(['d2', 'g1', 'g2']);
    expect(out[1].last).toBeUndefined();
    expect(out[1].unread).toBe(0);
    expect(out[2].last?.body).toBe('hi');
  });
});
