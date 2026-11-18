import { bundledSpots } from '../src/lib/placeStore';
import { DEMO_HOME, seed } from '../src/data/seed';
import { roleOf } from '../src/lib/eventView';
import { DEMO_NIGHT_MS, demoOffsetOnLaunch, demoStartFor, inferAnchor, isUntouchedDemo, needsRefresh, refreshDemo, restartDemo, REFRESH_AFTER_MS, startDemoClock, toRealTime } from '../src/lib/demoTime';
import { appNow, setClockOffset } from '../src/lib/appClock';
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

  test('after a refresh the live meet is live, the late rolling meet is to come and the past meet is past', () => {
    const out = refreshDemo(slice(ANCHOR), ANCHOR, LATER);
    expect(phaseOf(byId(out.events, 'ev-meet-now'), LATER)).toBe('live');
    expect(phaseOf(byId(out.events, 'ev-rolling-late'), LATER)).toBe('upcoming');
    expect(phaseOf(byId(out.events, 'ev-past-snowdome'), LATER)).toBe('over');
    for (const m of out.chat) expect(new Date(m.at).getTime()).toBeLessThanOrEqual(LATER.getTime());
  });

  test('your own events and your progress are kept', () => {
    const s = slice(ANCHOR);
    const mine: NightEvent = { ...byId(s.events, 'ev-cruise-peak'), id: 'ev-mine123', title: 'Mine' };
    const live = byId(s.events, 'ev-rolling-late');
    const revealedAt = new Date(new Date(live.startsAt).getTime() + 35 * 60_000).toISOString();
    const progressed = { ...live, currentStop: 1, stops: live.stops.map((st, i) => (i === 1 ? { ...st, revealedAt } : st)), checkIns: { ...live.checkIns, me: ['rl-1', 'rl-2'] } };
    const input = { ...s, events: [...s.events.map((e) => (e.id === live.id ? progressed : e)), mine] };
    const out = refreshDemo(input, ANCHOR, LATER);
    expect(byId(out.events, 'ev-mine123')).toEqual(mine);
    const after = byId(out.events, 'ev-rolling-late');
    expect(after.checkIns.me).toEqual(['rl-1', 'rl-2']);
    expect(after.currentStop).toBe(1);
    // the meet point's move-on time moved with the event
    const shift = new Date(after.startsAt).getTime() - new Date(live.startsAt).getTime();
    expect(new Date(after.stops[1].revealedAt!).getTime() - new Date(revealedAt).getTime()).toBe(shift);
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
    const used = { ...s, chat: [...s.chat, { id: 'x', eventId: 'ev-meet-now', userId: 'me', text: 'hi', at: ANCHOR.toISOString() }] };
    expect(isUntouchedDemo(used, ANCHOR)).toBe(false);
    expect(needsRefresh(used, ANCHOR, new Date(ANCHOR.getTime() + 60 * 60_000))).toBe(false);
    expect(needsRefresh(used, ANCHOR, new Date(ANCHOR.getTime() + REFRESH_AFTER_MS))).toBe(true);
  });

  test('older saves without an anchor work it out from the live meet (it started 40 minutes before)', () => {
    const live = { ...byId(slice(ANCHOR).events, 'ev-meet-now'), startsAt: new Date(ANCHOR.getTime() - 40 * 60_000).toISOString() };
    expect(inferAnchor([live])).toEqual(ANCHOR);
  });

  test('sample events the seed no longer makes are dropped, with their chat', () => {
    const s = slice(ANCHOR);
    const old = { ...byId(s.events, 'ev-meet-tam'), id: 'ev-rolling-host' };
    const out = refreshDemo({ ...s, events: [...s.events, old], chat: [...s.chat, { id: 'o', eventId: 'ev-rolling-host', userId: 'dan', text: 'x', at: ANCHOR.toISOString() }] }, ANCHOR, LATER);
    expect(out.events.some((e) => e.id === 'ev-rolling-host')).toBe(false);
    expect(out.chat.some((m) => m.id === 'o')).toBe(false);
  });
});

describe('restarting the demo events', () => {
  test('sample events, chat, votes and spot visits go back to a fresh seed; your own things stay', () => {
    const s = seed(ANCHOR);
    const mine: NightEvent = { ...byId(s.events, 'ev-meet-tam'), id: 'ev-mine', title: 'Mine' };
    const used = {
      events: [mine, ...s.events.map((e) => (e.id === 'ev-rolling-late' ? { ...e, currentStop: 1, checkIns: { me: ['rl-1'] } } : e))],
      chat: [...s.chat, { id: 'x1', eventId: 'ev-mine', userId: 'me', text: 'mine', at: ANCHOR.toISOString() }, { id: 'x2', eventId: 'ev-meet-now', userId: 'me', text: 'old', at: ANCHOR.toISOString() }],
      votes: s.votes,
      spots: [{ ...bundledSpots()[0], id: 'sp-mine', authorId: 'me', name: 'Mine' }],
    };
    const out = restartDemo(used, LATER);
    const again = seed(LATER);
    expect(out.events.map((e) => e.id).sort()).toEqual(['ev-mine', ...again.events.map((e) => e.id)].sort());
    expect(byId(out.events, 'ev-rolling-late')).toEqual(byId(again.events, 'ev-rolling-late'));
    expect(byId(out.events, 'ev-mine')).toBe(mine);
    expect(out.chat.map((m) => m.id)).toContain('x1');
    expect(out.chat.map((m) => m.id)).not.toContain('x2');
    // Bundled places aren't in the slice at all (the store clears their progress itself).
    expect(out.spots.every((x) => x.authorId === 'me')).toBe(true);
    expect(out.spots.some((x) => x.id === 'sp-mine')).toBe(true);
    expect(phaseOf(byId(out.events, 'ev-meet-now'), LATER)).toBe('live');
  });
});

describe('the demo night (Redesign 2, 3.1)', () => {
  const FRIDAY = new Date(2026, 10, 20, 21, 10); // Fri 20 Nov 21:10
  const night = seed(FRIDAY);
  const at = (id: string) => byId(night.events, id);
  const hm = (iso: string) => { const d = new Date(iso); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };

  test('the car park meet-up is live 20:30–23:00, open to anyone, with plenty checked in', () => {
    const e = at('ev-meet-now');
    expect(e.title).toBe('Car park meet-up');
    expect([hm(e.startsAt), hm(e.endsAt!)]).toEqual(['20:30', '23:00']);
    expect(phaseOf(e, FRIDAY)).toBe('live');
    expect(e.filter.everyone).toBe(true);
    expect(Object.keys(e.checkIns).length).toBeGreaterThan(4);
    expect(e.stops[0].name).toBe('Leisure park car park');
  });

  test('the late rolling meet runs 22:00–00:30 and its location shows at 21:30', () => {
    const e = at('ev-rolling-late');
    expect(e.type).toBe('rolling');
    expect([hm(e.startsAt), hm(e.endsAt!)]).toEqual(['22:00', '00:30']);
    expect(new Date(new Date(e.startsAt).getTime() - e.revealMinutesBefore * 60_000).getHours()).toBe(21);
    expect(e.revealMinutesBefore).toBe(30);
    expect(phaseOf(e, FRIDAY)).not.toBe('live');
  });

  test('the cruise is tomorrow at 20:00, Class S and A only; coffee is Sunday 10:00; last week is over', () => {
    const cruise = at('ev-cruise-peak');
    expect(new Date(cruise.startsAt).getDate()).toBe(21);
    expect(hm(cruise.startsAt)).toBe('20:00');
    expect(cruise.title).toBe('Saturday night cruise');
    expect(cruise.filter.classes).toEqual(['S', 'A']);
    const coffee = new Date(at('ev-meet-soon').startsAt);
    expect([coffee.getDay(), coffee.getHours()]).toEqual([0, 10]);
    expect(at('ev-meet-soon').title).toBe('Sunday coffee and cars');
    expect(phaseOf(at('ev-past-snowdome'), FRIDAY)).toBe('over');
  });

  test('last week has the three trophies only', () => {
    expect([...new Set(night.votes.map((v) => v.category))].sort()).toEqual(['best-bike', 'best-car', 'best-in-show']);
  });

  test('a brand-new user can go to the live meet and Sunday coffee, car or not', () => {
    const users = night.users.map((u) => (u.id === 'me' ? { ...u, home: DEMO_HOME } : u));
    for (const id of ['ev-meet-now', 'ev-rolling-late', 'ev-meet-soon']) expect(['invited', 'public']).toContain(roleOf(at(id), 'me', night.crews, users, night.builds));
  });
});

describe('the virtual clock', () => {
  afterEach(() => setClockOffset(0));
  const WED_LUNCH = new Date(2026, 10, 18, 12, 30).getTime();
  const WED_EVENING = new Date(2026, 10, 18, 20, 30).getTime();

  test('the demo starts on Friday at 21:10, at lunchtime or in the evening', () => {
    for (const real of [WED_LUNCH, WED_EVENING]) {
      const d = demoStartFor(real);
      expect([d.getDay(), d.getHours(), d.getMinutes()]).toEqual([5, 21, 10]);
    }
  });

  test('a saved night carries on until it is over, then a fresh one starts', () => {
    const first = demoOffsetOnLaunch(null, WED_LUNCH);
    expect(first.fresh).toBe(true);
    const later = demoOffsetOnLaunch(first, WED_LUNCH + 30 * 60_000);
    expect(later).toEqual({ ...first, fresh: false });
    const next = demoOffsetOnLaunch(first, WED_LUNCH + DEMO_NIGHT_MS + 60_000);
    expect(next.fresh).toBe(true);
    expect(new Date(WED_LUNCH + DEMO_NIGHT_MS + 60_000 + next.offset).getHours()).toBe(21);
  });

  test('startDemoClock sets the app clock and keeps the offset; phone notifications go back to real time', async () => {
    const store = new Map<string, string>();
    const storage = { getItem: async (k: string) => store.get(k) ?? null, setItem: async (k: string, v: string) => void store.set(k, v) };
    expect((await startDemoClock(storage, WED_EVENING)).fresh).toBe(true);
    expect(store.size).toBe(1);
    const shown = appNow();
    expect(shown.getDay()).toBe(5);
    expect(Math.abs(toRealTime(shown).getTime() - Date.now())).toBeLessThan(5_000);
    expect((await startDemoClock(storage, WED_EVENING + 60_000)).fresh).toBe(false);
  });
});
