import { buildRoute } from '../src/lib/nav';
import {
  demoMembers, expiryOf, groupChipText, groupExpired, groupFromRow, groupLink, GROUP_MS, isStale, lastUpdatedText,
  memberFromRow, normaliseCode, relationText, relationTo, shouldPostPosition, STALE_MS,
} from '../src/lib/groupLive';

// A straight road north from the Midlands, about 5.5 km.
const coords: number[] = [];
for (let i = 0; i <= 50; i++) coords.push(52.5 + i * 0.001, -1.5);
const route = buildRoute({ coords, time: 600, steps: [], legs: [] } as never);
const at = (lat: number, lng = -1.5) => ({ lat, lng });

describe('sending', () => {
  const last = { at: at(52.5), t: 100_000 };
  test('the first fix goes', () => expect(shouldPostPosition(null, last)).toBe(true));
  test('never more often than every 5 seconds', () => {
    expect(shouldPostPosition(last, { at: at(52.52), t: 104_000 })).toBe(false);
  });
  test('moved more than 15 m after 5 s: goes', () => {
    expect(shouldPostPosition(last, { at: at(52.5003), t: 105_000 })).toBe(true);
  });
  test('barely moved: waits until 15 s', () => {
    expect(shouldPostPosition(last, { at: at(52.50005), t: 110_000 })).toBe(false);
    expect(shouldPostPosition(last, { at: at(52.50005), t: 115_000 })).toBe(true);
  });
});

describe('stale and expiry', () => {
  test('older than 60 s, or never, is stale', () => {
    expect(isStale(1000, 1000 + STALE_MS)).toBe(false);
    expect(isStale(1000, 1001 + STALE_MS)).toBe(true);
    expect(isStale(null, 5)).toBe(true);
  });
  test('ends 6 hours after it started', () => {
    expect(expiryOf(0)).toBe(GROUP_MS);
    expect(groupExpired({ expiresAt: GROUP_MS }, GROUP_MS - 1)).toBe(false);
    expect(groupExpired({ expiresAt: GROUP_MS }, GROUP_MS)).toBe(true);
  });
  test('last updated wording', () => {
    expect(lastUpdatedText(null, 0)).toBe('No position yet');
    expect(lastUpdatedText(0, 3000)).toBe('Just now');
    expect(lastUpdatedText(0, 30_000)).toBe('30 s ago');
    expect(lastUpdatedText(0, 180_000)).toBe('3 min ago');
  });
});

describe('ahead and behind', () => {
  test('along the route', () => {
    expect(relationTo(at(52.51), at(52.52), route)).toMatchObject({ kind: 'ahead' });
    expect(relationTo(at(52.52), at(52.51), route)).toMatchObject({ kind: 'behind' });
    const r = relationTo(at(52.51), at(52.52), route);
    expect(r.kind === 'ahead' && Math.round(r.metres / 100)).toBe(11);
    expect(relationText(r)).toMatch(/mi ahead$/);
  });
  test('alongside', () => expect(relationTo(at(52.51), at(52.51001), route).kind).toBe('alongside'));
  test('off the route: straight line', () => {
    const r = relationTo(at(52.51), at(52.51, -1.4), route);
    expect(r.kind).toBe('away');
    expect(relationText(r)).toMatch(/away$/);
  });
  test('no route: straight line; no position: unknown', () => {
    expect(relationTo(at(52.5), at(52.6), null).kind).toBe('away');
    expect(relationTo(at(52.5), null, route)).toEqual({ kind: 'unknown' });
    expect(relationText({ kind: 'unknown' })).toBe('Not sharing yet');
  });
  test('chip', () => expect(groupChipText(3)).toBe('3 in the group'));
});

describe('codes and rows', () => {
  test('a code is 16 hex characters', () => {
    expect(normaliseCode(' 0123456789ABCDEF ')).toBe('0123456789abcdef');
    expect(normaliseCode('abc')).toBeNull();
    expect(groupLink('0123456789abcdef')).toBe('nightshift://group/0123456789abcdef');
  });
  test('rows from the server', () => {
    const g = groupFromRow({ id: 'g', code: '0123456789abcdef', title: 'Cruise', target_kind: 'event', target_id: 'e', leader_id: 'u', started_at: '2026-11-22T10:00:00Z', expires_at: '2026-11-22T16:00:00Z', member_count: 4 });
    expect(g).toMatchObject({ targetKind: 'event', memberCount: 4, expiresAt: Date.parse('2026-11-22T16:00:00Z') });
    expect(groupFromRow(null)).toBeNull();
    const m = memberFromRow({ user_id: 'u', handle: 'sam', display_name: 'Sam', lat: null, lng: null, updated_at: null, is_leader: true });
    expect(m).toMatchObject({ at: null, updatedAt: null, isLeader: true, name: 'Sam' });
    expect(memberFromRow({ user_id: 'u2', handle: 'jo', lat: 52.5, lng: -1.5, updated_at: '2026-11-22T10:00:00Z' })).toMatchObject({ at: { lat: 52.5, lng: -1.5 }, name: 'jo' });
  });
});

describe('demo members', () => {
  test('on the route, ahead and behind, one stale', () => {
    const now = 1_000_000;
    const list = demoMembers(route, 2000, now);
    expect(list).toHaveLength(3);
    for (const m of list) {
      expect(m.at).not.toBeNull();
      expect(m.at!.lng).toBeCloseTo(-1.5, 5);
    }
    expect(list[0].at!.lat).toBeGreaterThan(list[1].at!.lat);
    expect(list.map((m) => isStale(m.updatedAt, now))).toEqual([false, false, true]);
    expect(demoMembers(null, 0, now)).toEqual([]);
  });
});
