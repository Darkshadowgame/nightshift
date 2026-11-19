import { DEMO_HOME, ME } from '../src/data/seed';
import { isBusyId } from '../src/data/busyNight';
import { detentTops, settle } from '../src/components/sheetDetents';
import { paddedRegion } from '../src/components/mapTypes';
import { viewEvents, type EventView } from '../src/lib/eventView';
import { fresh, setBusyNight } from '../src/lib/localState';
import { clusterEventPins, clusterZoomSpan, EVENT_CLUSTER_MIN_SPAN, regionKey } from '../src/lib/mapPlaces';
import type { LatLng } from '../src/lib/types';

/**
 * "Some events I can't open, it just has a symbol like waves around it" (build 14, Busy night):
 * a group of meets with a live one in it is drawn with the live pulse, and tapping it zoomed
 * by the group's span fitted into the part of the map above the sheet, so the whole map (which
 * the pins are grouped on) came out no closer: the group never split and its meets never opened.
 */
const NOW = new Date('2026-11-20T21:10:00');
const state = setBusyNight(fresh(), true, NOW);
const views = viewEvents(state.events, ME, state.crews ?? [], state.users, state.builds, NOW).filter((v) => v.phase !== 'over' && v.phase !== 'cancelled');
const pointOf = (v: EventView): LatLng => (v.shownStop >= 0 ? (v.event.stops[v.shownStop].at ?? v.event.area) : v.event.area);
const pins = views.map((v) => ({ id: `ev:${v.event.id}`, at: pointOf(v), live: v.phase === 'live' }));

// An iPhone 15's Tonight map: the box under the header, the card's peek over its bottom.
const HEIGHT = 560;
const WIDTH = 393;
const PADDING = { top: 28, bottom: 300 };

/** What the map's whole span is, as the pins are grouped on it, after a tap on a group. */
function afterTap(zoomCentre: LatLng, zoomSpan: number, fix: boolean, shown?: number, width = WIDTH, height = HEIGHT) {
  const asked = fix ? clusterZoomSpan(zoomSpan, { w: width, h: height }, PADDING, zoomCentre.lat, shown) : zoomSpan;
  const whole = paddedRegion({ centre: zoomCentre, span: asked }, height, PADDING);
  // The map also fits the region's width (1.2 × its height in degrees), then rounds to a quarter zoom.
  const byWidth = (1.2 * asked * Math.cos((zoomCentre.lat * Math.PI) / 180) * height) / width;
  return regionKey(whole.centre, Math.max(whole.span, byWidth) * 2 ** 0.125).span;
}

/** Taps every group down until each meet is its own pin; how many taps the deepest took (Infinity: stuck). */
function tapsToOpenAll(span: number, fix: boolean, members = pins, depth = 0, width = WIDTH, height = HEIGHT): number {
  if (depth > 12) return Infinity;
  const { clusters } = clusterEventPins(members, span);
  let most = depth;
  for (const c of clusters)
    most = Math.max(most, tapsToOpenAll(afterTap(c.zoomCentre, c.zoomSpan, fix, span, width, height), fix, c.members, depth + 1, width, height));
  return most;
}

describe('Every busy-night meet on the map opens (Review: "waves" symbol)', () => {
  it('has busy meets live now, which group with others when zoomed out', () => {
    expect(views.filter((v) => isBusyId(v.event.id) && v.phase === 'live').length).toBeGreaterThanOrEqual(3);
    const { clusters } = clusterEventPins(pins, regionKey(DEMO_HOME, 0.6).span);
    expect(clusters.some((c) => c.members.some((m) => m.live))).toBe(true);
  });

  it('every event id resolves to a view and to the event the event page loads', () => {
    for (const e of state.events) {
      expect(views.find((v) => v.event.id === e.id) ?? (e.endsAt ?? '') <= NOW.toISOString()).toBeTruthy();
      expect(state.events.find((x) => x.id === e.id)).toBe(e);
    }
    expect(views.filter((v) => isBusyId(v.event.id)).length).toBeGreaterThanOrEqual(20);
  });

  it('tapping groups splits them down to single pins at every starting zoom', () => {
    for (const start of [0.15, 0.3, 0.6, 1.2, 2.4]) {
      const span = regionKey(DEMO_HOME, start).span;
      expect(tapsToOpenAll(span, true)).toBeLessThan(8);
      // A tall, narrow map (the width decides how far in it can go) and a wide one.
      expect(tapsToOpenAll(span, true, pins, 0, 393, 1400)).toBeLessThan(8);
      expect(tapsToOpenAll(span, true, pins, 0, 1000, 560)).toBeLessThan(8);
    }
  });

  it('before the fix a group could be tapped forever without splitting', () => {
    expect([0.15, 0.3, 0.6, 1.2].some((s) => tapsToOpenAll(regionKey(DEMO_HOME, s).span, false) === Infinity)).toBe(true);
  });

  it('a tap always zooms the whole map in, down to street level where nothing groups', () => {
    for (const span of [0.04, 0.1, 0.5, 2]) {
      const next = afterTap(DEMO_HOME, Math.max(EVENT_CLUSTER_MIN_SPAN, span / 2), true, span);
      expect(next).toBeLessThanOrEqual(Math.max(EVENT_CLUSTER_MIN_SPAN, span / 2) + 1e-9);
      expect(afterTap(DEMO_HOME, span, true, span, 393, 1400)).toBeLessThan(span);
    }
  });

  it('no two meets sit on the same spot, so at street level each has its own pin', () => {
    for (let i = 0; i < pins.length; i++)
      for (let j = i + 1; j < pins.length; j++) {
        const a = pins[i].at;
        const b = pins[j].at;
        expect(Math.hypot(a.lat - b.lat, a.lng - b.lng)).toBeGreaterThan(EVENT_CLUSTER_MIN_SPAN * 0.09);
      }
  });
});

describe('Tonight sheet: min, after a tap on the map closes a card', () => {
  const tops = detentTops(700, 300, 8);
  it('sits below peek, showing just the grabber and one line', () => {
    expect(tops.min).toBeGreaterThan(tops.peek);
    expect(700 - tops.min).toBeLessThan(100);
  });
  it('a drag never drops to min from above, and a drag up from min goes back to peek', () => {
    expect(settle(tops.min, 0, tops)).toBe('peek');
    expect(settle(tops.min - 5, 0, tops, true)).toBe('min');
    expect(settle(tops.peek - 10, -0.5, tops, true)).not.toBe('min');
  });
});
