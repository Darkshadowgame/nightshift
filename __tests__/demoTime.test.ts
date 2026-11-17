import { seed } from '../src/data/seed';
import { inferAnchor, isUntouchedDemo, needsRefresh, refreshDemo, REFRESH_AFTER_MS } from '../src/lib/demoTime';
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
