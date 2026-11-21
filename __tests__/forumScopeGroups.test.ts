import { communitySample } from '../src/data/communitySeed';
import { allVariants } from '../src/data/vehicles';
import { browseGroups, buildGroups, findGroup, inGroup, joinGroup, leaveGroup, searchGroups, suggestedGroups } from '../src/lib/forumGroups';
import { threadFromRow, type ThreadRow } from '../src/lib/backend/community';
import { threadProblem, threadsFor } from '../src/lib/forum';
import { findVariant } from '../src/lib/vehicles';

const NOW = new Date('2026-11-21T12:00:00Z');
const home = { lat: 52.6, lng: -1.7 };
const list = allVariants();

describe('forum scope', () => {
  const threads = communitySample(NOW, home, 'Midlands').threads;
  it('Everyone is nationwide threads, Local is your region', () => {
    const everyone = threadsFor(threads, 'all', 'Midlands', 'everyone');
    const local = threadsFor(threads, 'all', 'Midlands', 'local');
    expect(everyone.length).toBeGreaterThan(5);
    expect(everyone.every((t) => !t.region)).toBe(true);
    expect(local.length).toBeGreaterThanOrEqual(3);
    expect(local.every((t) => t.region === 'Midlands')).toBe(true);
    expect(threadsFor(threads, 'all', 'London', 'local')).toHaveLength(0);
  });

  it('a group is a filtered forum, and a make group takes its models', () => {
    const leon = threadsFor(threads, 'all', 'Midlands', 'everyone', 'seat:leon');
    expect(leon.map((t) => t.id)).toEqual(['ft-leon-dsg']);
    expect(threadsFor(threads, 'all', 'Midlands', 'local', 'seat:leon').map((t) => t.id)).toEqual(['ft-leon-cruise']);
    expect(threadsFor(threads, 'all', 'Midlands', 'everyone', 'cupra').map((t) => t.id)).toEqual(['ft-cupra-fault']);
    expect(inGroup('bmw:335i', 'bmw')).toBe(true);
    expect(inGroup('bmw:335i', 'bmw:m3')).toBe(false);
    expect(inGroup(undefined, 'bmw')).toBe(false);
  });

  it('checks scope and group on a draft', () => {
    const base = { board: 'advice' as const, title: 'Cupra gearbox warning', body: '', photos: [] };
    expect(threadProblem({ ...base, region: 'Midlands', groupKey: 'cupra:formentor' })).toBeNull();
    expect(threadProblem({ ...base, region: 'Narnia' })).toMatch(/region/);
    expect(threadProblem({ ...base, groupKey: 'Not A Key' })).toMatch(/group/);
    expect(threadProblem({ ...base, board: 'local' })).toMatch(/region/);
  });

  it('reads a server row with a group', () => {
    const row = { id: 'x', board: 'advice', region: null, group_key: 'seat:leon', author_id: 'a', title: 'T', body: '', photos: [], build_id: null, created_at: '', last_activity_at: '', reply_count: 0, solved_reply_id: null, hidden_at: null } as ThreadRow;
    expect(threadFromRow(row).groupKey).toBe('seat:leon');
  });
});

describe('forum groups from the vehicle list', () => {
  it('derives makes and models, once each, with BMW as one group', () => {
    const groups = buildGroups(list);
    const keys = groups.map((g) => g.key);
    expect(new Set(keys).size).toBe(keys.length);
    expect(findGroup(list, 'seat:leon')?.label).toBe('SEAT Leon');
    expect(findGroup(list, 'bmw')?.label).toBe('BMW');
  });
  it('suggests groups from the garage, model first', () => {
    const v = list.find((x) => x.make === 'SEAT' && x.model === 'Leon')!;
    expect(findVariant(list, v.id)).toBe(v);
    expect(suggestedGroups(list, [v, v]).map((g) => g.key)).toEqual(['seat:leon', 'seat']);
    expect(suggestedGroups(list, [v], ['seat']).map((g) => g.key)).toEqual(['seat:leon']);
  });
  it('searches by every word and browses the biggest makes', () => {
    expect(searchGroups(list, 'leon seat').map((g) => g.key)).toContain('seat:leon');
    expect(searchGroups(list, '')).toEqual([]);
    expect(browseGroups(list, ['bmw']).some((g) => g.key === 'bmw')).toBe(false);
  });
  it('joins and leaves once', () => {
    expect(joinGroup(joinGroup(undefined, 'seat'), 'seat')).toEqual(['seat']);
    expect(leaveGroup(['seat', 'bmw'], 'seat')).toEqual(['bmw']);
  });
});
