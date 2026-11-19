import {
  BUSY_PEOPLE,
  BUSY_VEHICLES,
  busyCommunity,
  busyDrivers,
  busyRoadReports,
  busyScene,
  findBusyVariant,
  isBusyId,
  withBusy,
  withoutBusy,
} from '../src/data/busyNight';
import { communitySample } from '../src/data/communitySeed';
import { DEMO_HOME, ME, seed } from '../src/data/seed';
import { allVariants } from '../src/data/vehicles';
import { emptyDemoCommunity, hasBusyCommunity, seedDemoCommunity, withBusyCommunity, withoutBusyCommunity } from '../src/lib/communityService';
import { buildMatches } from '../src/lib/invites';
import { fresh, freshen, setBusyNight } from '../src/lib/localState';
import { meetAt, postPlace } from '../src/lib/postPrivacy';
import { isLive, REPORT_GRID } from '../src/lib/roadReports';
import { EMPTY_DEMO_ROADS, settleDemo } from '../src/lib/roadService';
import { findVariant, modelLabel } from '../src/lib/vehicles';

const NOW = new Date('2026-11-20T21:10:00');
const base = seed(NOW);
const scene = busyScene(NOW, DEMO_HOME, base.users, base.builds);
const allEvents = [...base.events, ...scene.events];
const community = busyCommunity(NOW, DEMO_HOME, 'Midlands', allEvents, scene.builds);
const reports = busyRoadReports(DEMO_HOME, NOW);

const dupes = (ids: string[]) => ids.filter((id, i) => ids.indexOf(id) !== i);

describe('Busy night: a much fuller demo scene (Settings › Demo)', () => {
  it('has about 60 more people, 20 more events and plenty of everything else', () => {
    expect(scene.users).toHaveLength(60);
    expect(scene.builds.length).toBeGreaterThanOrEqual(70);
    expect(scene.events.length).toBeGreaterThanOrEqual(20);
    expect(scene.events.filter((e) => e.going.length >= 40).length).toBeGreaterThanOrEqual(3);
    expect(new Set(scene.events.map((e) => e.type))).toEqual(new Set(['meet', 'cruise', 'rolling']));
    expect(scene.chat.length).toBeGreaterThanOrEqual(40);
    expect(community.posts.length).toBeGreaterThanOrEqual(30);
    expect(community.threads.filter((t) => t.listing).length).toBeGreaterThanOrEqual(8);
    expect(community.threads.filter((t) => !t.listing).length).toBeGreaterThanOrEqual(10);
    expect(community.conversations.length).toBeGreaterThanOrEqual(3);
    expect(community.connections.filter((r) => r.to === ME && r.status === 'pending').length).toBeGreaterThanOrEqual(3);
    expect(reports.length).toBeGreaterThanOrEqual(40);
    expect(new Set(reports.map((r) => r.kind))).toEqual(new Set(REPORT_GRID));
    expect(reports.every((r) => isLive(r, NOW))).toBe(true);
  });

  it('spreads its meets over tonight and this week, round home and a few further away', () => {
    const t = NOW.getTime();
    const live = scene.events.filter((e) => new Date(e.startsAt).getTime() <= t && new Date(e.endsAt!).getTime() > t);
    expect(live.length).toBeGreaterThanOrEqual(3);
    expect(scene.events.every((e) => new Date(e.endsAt!).getTime() > t)).toBe(true);
    const far = scene.events.filter((e) => e.stops[0].at && Math.abs(e.stops[0].at.lat - DEMO_HOME.lat) > 0.35);
    expect(far.length).toBeGreaterThanOrEqual(2);
    // Varied invite rules: open to anyone, cars or bikes only, classes, brands and mods.
    const f = scene.events.map((e) => e.filter);
    expect(f.some((x) => x.everyone)).toBe(true);
    expect(f.some((x) => !x.cars && x.bikes)).toBe(true);
    expect(f.some((x) => x.brands.length > 0)).toBe(true);
    expect(f.some((x) => x.classes.length > 0)).toBe(true);
    expect(f.some((x) => x.minMods > 0)).toBe(true);
  });

  it('only has people going whose build the invite lets in, each bringing it', () => {
    const builds = [...base.builds, ...scene.builds];
    for (const e of scene.events) {
      for (const u of e.going) {
        const b = builds.find((x) => x.id === e.vehicles?.[u]);
        expect(b?.ownerId).toBe(u);
        expect(buildMatches(b!, e.filter)).toBe(true);
      }
      expect(e.going).not.toContain(ME);
    }
  });

  it('is the same every time (seeded)', () => {
    const again = seed(NOW);
    expect(busyScene(NOW, DEMO_HOME, again.users, again.builds)).toEqual(scene);
    expect(busyCommunity(NOW, DEMO_HOME, 'Midlands', allEvents, scene.builds)).toEqual(community);
    expect(busyRoadReports(DEMO_HOME, NOW)).toEqual(reports);
    expect(busyDrivers(DEMO_HOME, NOW)).toEqual(busyDrivers(DEMO_HOME, NOW));
  });

  it('has no duplicate ids, and none that clash with the normal demo', () => {
    const sample = communitySample(NOW, DEMO_HOME, 'Midlands');
    const groups: string[][] = [
      [...base.users, ...scene.users].map((u) => u.id),
      [...base.users, ...scene.users].map((u) => u.handle),
      [...base.builds, ...scene.builds].map((b) => b.id),
      allEvents.map((e) => e.id),
      allEvents.flatMap((e) => e.stops.map((s) => s.id)),
      [...base.chat, ...scene.chat].map((m) => m.id),
      [...sample.posts, ...community.posts].map((p) => p.id),
      [...sample.comments, ...community.comments].map((c) => c.id),
      [...sample.threads, ...community.threads].map((t) => t.id),
      [...sample.replies, ...community.replies].map((r) => r.id),
      [...sample.conversations, ...community.conversations].map((c) => c.id),
      [...sample.messages, ...community.messages].map((m) => m.id),
      reports.map((r) => r.id),
      scene.builds.flatMap((b) => b.mods.map((m) => m.id)),
    ];
    for (const ids of groups) expect(dupes(ids)).toEqual([]);
    // Everything it adds is marked as busy, so turning it off finds it all.
    for (const id of [...scene.users.map((u) => u.id), ...scene.builds.map((b) => b.id), ...scene.events.map((e) => e.id), ...community.posts.map((p) => p.id), ...reports.map((r) => r.id)]) {
      expect(isBusyId(id)).toBe(true);
    }
    for (const id of [...base.users.map((u) => u.id), ...base.builds.map((b) => b.id), ...base.events.map((e) => e.id)]) expect(isBusyId(id)).toBe(false);
  });

  it('every build is a real model from the vehicle data', () => {
    const list = allVariants();
    for (const spec of BUSY_VEHICLES) expect(findBusyVariant(list, spec)).toBeDefined();
    for (const b of scene.builds) {
      const v = findVariant(list, b.vehicleId);
      expect(v).toBeDefined();
      expect(v!.make).toBe(b.make);
      expect(modelLabel(v!)).toBe(b.model);
      expect(b.kind).toBe(v!.kind);
      expect(b.year!).toBeGreaterThanOrEqual(v!.from);
    }
    expect(scene.builds.filter((b) => b.kind === 'bike').length).toBeGreaterThanOrEqual(15);
  });

  it('never puts a post on a meet point, so no post gives a hidden one away (postPrivacy)', () => {
    const placed = community.posts.filter((p) => p.at);
    expect(placed.length).toBeGreaterThanOrEqual(5);
    for (const p of placed) {
      expect(meetAt(p.at, allEvents)).toBeNull();
      expect(postPlace(p, { events: allEvents })?.kind).toBe('place');
    }
  });

  it('uses only the licensed sample and stand-in photos', () => {
    for (const p of community.posts) for (const ref of p.photos) expect(ref).toMatch(/^sample:si-/);
    for (const b of scene.builds) expect(b.photos).toEqual([]);
  });

  it('has invented handles only', () => {
    expect(BUSY_PEOPLE).toHaveLength(60);
    for (const u of scene.users) expect(u.handle).toMatch(/^[a-z0-9._]+$/);
  });
});

describe('Busy night on and off', () => {
  const normal = fresh();

  it('is off by default, so the demo night is the fixed one', () => {
    expect(normal.settings.busyNight).toBeFalsy();
    expect(normal.events.some((e) => isBusyId(e.id))).toBe(false);
    expect(normal.users.some((u) => isBusyId(u.id))).toBe(false);
  });

  it('on adds the scene; off restores the normal demo exactly', () => {
    const on = setBusyNight(normal, true, NOW);
    expect(on.settings.busyNight).toBe(true);
    expect(on.users.length).toBe(normal.users.length + 60);
    expect(on.events.filter((e) => isBusyId(e.id)).length).toBeGreaterThanOrEqual(20);
    // Its meets don't each pop up as "new near you".
    for (const e of on.events.filter((x) => isBusyId(x.id))) expect(on.nearby?.known).toContain(e.id);
    const off = setBusyNight(on, false, NOW);
    expect({ ...off, nearby: undefined }).toEqual({ ...normal, settings: { ...normal.settings, busyNight: false }, nearby: undefined });
    expect(off.nearby).toEqual(normal.nearby);
  });

  it('takes out busy people who went to a normal meet, and keeps you going to a busy one', () => {
    const on = setBusyNight(normal, true, NOW);
    const joined = { ...on, events: on.events.map((e) => (e.id === 'ev-meet-now' ? { ...e, going: [...e.going, BUSY_PEOPLE[0]] } : e)) };
    expect(withoutBusy(joined).events.find((e) => e.id === 'ev-meet-now')).toEqual(normal.events.find((e) => e.id === 'ev-meet-now'));
    const first = on.events.find((e) => isBusyId(e.id))!;
    const going = { ...on, events: on.events.map((e) => (e.id === first.id ? { ...e, going: [...e.going, ME] } : e)) };
    expect(withBusy(going, NOW, DEMO_HOME).events.find((e) => e.id === first.id)!.going).toContain(ME);
  });

  it('the demo refresh leaves the normal scene as it would be without it', () => {
    const later = new Date(NOW.getTime() + 3 * 60 * 60_000);
    const plain = freshen(normal, later);
    const busy = freshen(setBusyNight(normal, true, NOW), later);
    expect(busy.settings.busyNight).toBe(true);
    expect(withoutBusy(busy).events).toEqual(plain.events);
    expect(busy.events.some((e) => isBusyId(e.id))).toBe(true);
  });

  it('going to a busy meet survives the refresh on load (Review 18: a reload lost it)', () => {
    const on = setBusyNight(normal, true, NOW);
    const first = on.events.find((e) => isBusyId(e.id))!;
    const going = { ...on, events: on.events.map((e) => (e.id === first.id ? { ...e, going: [...e.going, ME] } : e)) };
    const later = new Date(NOW.getTime() + 3 * 60 * 60_000);
    expect(freshen(going, later).events.find((e) => e.id === first.id)!.going).toContain(ME);
  });

  it('the Community and road reports come out cleanly too', () => {
    const demo = seedDemoCommunity(emptyDemoCommunity(), DEMO_HOME, 'Midlands', NOW);
    const withIt = withBusyCommunity(demo, community);
    expect(hasBusyCommunity(withIt)).toBe(true);
    expect(withoutBusyCommunity(withIt)).toEqual(demo);
    const roadsOn = settleDemo(EMPTY_DEMO_ROADS, DEMO_HOME, NOW, true);
    expect(roadsOn.busy!.length).toBeGreaterThanOrEqual(40);
    expect(settleDemo(roadsOn, DEMO_HOME, NOW, false).busy).toEqual([]);
    expect(settleDemo(EMPTY_DEMO_ROADS, DEMO_HOME, NOW, false).busy).toBeUndefined();
  });
});
