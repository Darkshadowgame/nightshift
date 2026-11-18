import { seed } from '../src/data/seed';
import { nearbyNotice } from '../src/lib/discover';
import { freshen, retimeNearbyNotices } from '../src/lib/localState';
import type { Notice } from '../src/lib/notice';

const T0 = new Date('2026-11-18T01:00:00Z');

describe('sample notices follow the sample events when their times move (B7)', () => {
  const events = seed(T0).events;
  const e = events.find((x) => x.id !== 'ev-rolling-live' && new Date(x.startsAt) > T0)!;
  const notice = (eventId: string, kind: Notice['kind'], text: string): Notice => ({ id: `n-${eventId}-${kind}`, eventId, at: T0.toISOString(), read: false, kind, text });

  test('a nearby notice is written again from the moved event; others are left alone', () => {
    const moved = events.map((x) => (x.id === e.id ? { ...x, startsAt: new Date(new Date(x.startsAt).getTime() + 7 * 60_000).toISOString() } : x));
    const r = nearbyNotice(moved.find((x) => x.id === e.id)!, T0);
    const before = [notice(e.id, 'nearby', 'old text 03:18'), notice(e.id, 'soon', 'keep'), notice('my-own-event', 'nearby', 'mine')];
    const after = retimeNearbyNotices(before, moved);
    expect(after[0].text).toBe(`${r.title}. ${r.body}`);
    expect(after[0].text).not.toContain('03:18');
    expect(after[1]).toBe(before[1]);
    expect(after[2]).toBe(before[2]);
  });

  test('freshen moves the notice with the event', () => {
    const state = { ...seed(T0), notices: [notice(e.id, 'nearby', 'stale')], scene: { home: seed(T0).users[0].home, names: {} }, seededAt: T0.toISOString() } as never;
    const later = new Date(T0.getTime() + 3 * 86_400_000);
    const out = freshen(state, later) as unknown as { events: typeof events; notices: Notice[] };
    const ev = out.events.find((x) => x.id === e.id)!;
    expect(out.notices[0].text).toBe(`${nearbyNotice(ev, T0).title}. ${nearbyNotice(ev, T0).body}`);
  });
});
