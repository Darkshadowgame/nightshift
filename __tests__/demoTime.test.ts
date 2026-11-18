import { bundledSpots } from '../src/lib/placeStore';
import { DEMO_HOME, seed } from '../src/data/seed';
import { roleOf } from '../src/lib/eventView';
import { inferAnchor, isUntouchedDemo, needsRefresh, refreshDemo, restartDemo, REFRESH_AFTER_MS } from '../src/lib/demoTime';
import { phaseOf } from '../src/lib/events';
import type { NightEvent } from '../src/lib/types';

const ANCHOR = new Date(2026, 10, 17, 21, 0); // 17 Nov 21:00 local
const LATER = new Date(2026, 10, 18, 20, 30); // next evening

function slice(now: Date) {
  const s = seed(now);
  return { events: s.events, chat: s.chat, votes: s.votes };
}
const byId = (events: NightEvent[], id: string) => events.find((e) => e.id === id)!;

describe('keeping the demo fresh', () => {
  test('an untouched demo moves back exactly to the scene seeded now', () => {
    const out = refreshDemo(slice(ANCHOR), ANCHOR, LATER);
    expect(JSON.stringify(out)).toBe(JSON.stringify(slice(LATER)));
  });

  test('after a refresh the live meet is live, the crew meet is soon and the past meet is past', () => {
    const out = refreshDemo(slice(ANCHOR), ANCHOR, LATER);
    expect(phaseOf(byId(out.events, 'ev-rolling-live'), LATER)).toBe('live');
    expect(phaseOf(byId(out.events, 'ev-rolling-host'), LATER)).toBe('revealed');
    expect(phaseOf(byId(out.events, 'ev-past-snowdome'), LATER)).toBe('over');
    for (const m of out.chat) expect(new Date(m.at).getTime()).toBeLessThanOrEqual(LATER.getTime());
  });

  test('your own events and your progress are kept', () => {
    const s = slice(ANCHOR);
    const mine: NightEvent = { ...byId(s.events, 'ev-cruise-peak'), id: 'ev-mine123', title: 'Mine' };
    const live = byId(s.events, 'ev-rolling-live');
    const progressed = { ...live, checkIns: { ...live.checkIns, me: ['rl-1', 'rl-2'] } };
    const input = { ...s, events: [...s.events.map((e) => (e.id === live.id ? progressed : e)), mine] };
    const out = refreshDemo(input, ANCHOR, LATER);
    expect(byId(out.events, 'ev-mine123')).toEqual(mine);
    const after = byId(out.events, 'ev-rolling-live');
    expect(after.checkIns.me).toEqual(['rl-1', 'rl-2']);
    expect(after.currentStop).toBe(live.currentStop);
    // the stop reveal moved with the event
    const shift = new Date(after.startsAt).getTime() - new Date(live.startsAt).getTime();
    expect(new Date(after.stops[1].revealedAt!).getTime() - new Date(live.stops[1].revealedAt!).getTime()).toBe(shift);
  });

  test('a seeded event whose time you edited moves by whole days, keeping your clock time', () => {
    const s = slice(ANCHOR);
    const edited = { ...byId(s.events, 'ev-cruise-peak'), startsAt: new Date(2026, 10, 18, 19, 0).toISOString() };
    const out = refreshDemo({ ...s, events: s.events.map((e) => (e.id === edited.id ? edited : e)) }, ANCHOR, new Date(2026, 10, 19, 20, 0));
    const d = new Date(byId(out.events, 'ev-cruise-peak').startsAt);
    expect([d.getDate(), d.getHours()]).toEqual([20, 19]);
  });

  test('votes move with their event', () => {
    const out = refreshDemo(slice(ANCHOR), ANCHOR, LATER);
    const ev = byId(out.events, 'ev-past-snowdome');
    for (const v of out.votes) expect(new Date(v.at).getTime()).toBeGreaterThan(new Date(ev.startsAt).getTime());
  });

  test('when to refresh: untouched and more than a minute old, or anything older than 6 hours', () => {
    const s = slice(ANCHOR);
    expect(isUntouchedDemo(s, ANCHOR)).toBe(true);
    expect(needsRefresh(s, ANCHOR, new Date(ANCHOR.getTime() + 30_000))).toBe(false);
    expect(needsRefresh(s, ANCHOR, new Date(ANCHOR.getTime() + 5 * 60_000))).toBe(true);
    const used = { ...s, chat: [...s.chat, { id: 'x', eventId: 'ev-rolling-live', userId: 'me', text: 'hi', at: ANCHOR.toISOString() }] };
    expect(isUntouchedDemo(used, ANCHOR)).toBe(false);
    expect(needsRefresh(used, ANCHOR, new Date(ANCHOR.getTime() + 60 * 60_000))).toBe(false);
    expect(needsRefresh(used, ANCHOR, new Date(ANCHOR.getTime() + REFRESH_AFTER_MS))).toBe(true);
  });

  test('older saves without an anchor work it out from the live meet', () => {
    expect(inferAnchor(slice(ANCHOR).events)).toEqual(ANCHOR);
  });
});

describe('restarting the demo events', () => {
  test('sample events, chat, votes and spot visits go back to a fresh seed; your own things stay', () => {
    const s = seed(ANCHOR);
    const mine: NightEvent = { ...byId(s.events, 'ev-meet-tam'), id: 'ev-mine', title: 'Mine' };
    const used = {
      events: [mine, ...s.events.map((e) => (e.id === 'ev-rolling-host' ? { ...e, currentStop: 1, checkIns: { me: ['rh-1'] } } : e))],
      chat: [...s.chat, { id: 'x1', eventId: 'ev-mine', userId: 'me', text: 'mine', at: ANCHOR.toISOString() }, { id: 'x2', eventId: 'ev-rolling-live', userId: 'me', text: 'old', at: ANCHOR.toISOString() }],
      votes: s.votes,
      spots: [{ ...bundledSpots()[0], id: 'sp-mine', authorId: 'me', name: 'Mine' }],
    };
    const out = restartDemo(used, LATER);
    const again = seed(LATER);
    expect(out.events.map((e) => e.id).sort()).toEqual(['ev-mine', ...again.events.map((e) => e.id)].sort());
    expect(byId(out.events, 'ev-rolling-host')).toEqual(byId(again.events, 'ev-rolling-host'));
    expect(byId(out.events, 'ev-mine')).toBe(mine);
    expect(out.chat.map((m) => m.id)).toContain('x1');
    expect(out.chat.map((m) => m.id)).not.toContain('x2');
    // Bundled places aren't in the slice at all (the store clears their progress itself).
    expect(out.spots.every((x) => x.authorId === 'me')).toBe(true);
    expect(out.spots.some((x) => x.id === 'sp-mine')).toBe(true);
    expect(phaseOf(byId(out.events, 'ev-rolling-live'), LATER)).toBe('live');
  });
});

describe('the sample scene', () => {
  test('has an invite a few hours away that you are not going to yet', () => {
    const e = byId(seed(ANCHOR).events, 'ev-meet-soon');
    const hours = (new Date(e.startsAt).getTime() - ANCHOR.getTime()) / 3_600_000;
    expect(hours).toBeGreaterThanOrEqual(2);
    expect(hours).toBeLessThanOrEqual(4);
    expect(e.going).not.toContain('me');
    expect(phaseOf(e, ANCHOR)).toBe('upcoming');
    const s = seed(ANCHOR);
    const users = s.users.map((u) => (u.id === 'me' ? { ...u, home: DEMO_HOME } : u));
    // You start with no car: invites match once you add one (a stock car is enough here).
    expect(s.builds.some((b) => b.ownerId === 'me')).toBe(false);
    expect(roleOf(e, 'me', s.crews, users, s.builds)).toBe('none');
    const stock = { id: 'b-new', ownerId: 'me', kind: 'car' as const, make: 'Ford', model: 'Fiesta ST', stockBhp: 197, weightKg: 1262, mods: [], photos: [] };
    expect(roleOf(e, 'me', s.crews, users, [...s.builds, stock])).toBe('invited');
  });

  test('the Sunday meet is on a Sunday, at least two days back', () => {
    for (let d = 0; d < 7; d++) {
      const now = new Date(2026, 10, 15 + d, 21, 0);
      const e = byId(seed(now).events, 'ev-past-snowdome');
      const start = new Date(e.startsAt);
      expect(start.getDay()).toBe(0);
      expect(now.getTime() - start.getTime()).toBeGreaterThanOrEqual(2 * 86_400_000 - 3 * 3_600_000);
      expect(phaseOf(e, now)).toBe('over');
    }
  });
});
