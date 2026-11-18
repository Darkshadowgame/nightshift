import {
  applyEventEdit, applyPlanChange, banZoneAt, canEditEvent, canMoveStop, canRemoveStop, canSeeStop, checkIn, eventLink,
  moveOn, PLAN_CHANGED_TEXT, planChangedMessage, shareText, stopsFromDraft,
} from '../src/lib/events';
import { areaGivesAway } from '../src/lib/area';
import { milesBetween } from '../src/lib/geo';
import { DEFAULT_FILTER } from '../src/lib/invites';
import type { BanZone, Crew, NightEvent } from '../src/lib/types';

const NOW = new Date('2026-11-20T22:00:00Z');
const mins = (m: number) => new Date(NOW.getTime() + m * 60_000).toISOString();
const crews: Crew[] = [];
const zones: BanZone[] = [{ id: 'z', name: 'Test zone', centre: { lat: 52.48, lng: -1.89 }, radiusMiles: 4, note: 'Sample.' }];
let n = 0;
const makeId = () => `id${++n}`;

function rolling(overrides: Partial<NightEvent> = {}): NightEvent {
  return {
    id: 'e1', type: 'rolling', title: 'Test', startsAt: mins(-30), endsAt: mins(120),
    area: { lat: 52.6, lng: -1.7 }, areaName: 'Tamworth',
    stops: [
      { id: 's1', name: 'One', at: { lat: 52.6, lng: -1.7 } },
      { id: 's2', name: 'Two', at: { lat: 52.65, lng: -1.75 } },
      { id: 's3', name: 'Three', at: { lat: 52.7, lng: -1.8 } },
    ],
    currentStop: 0, revealMinutesBefore: 60, hostIds: ['host'],
    filter: DEFAULT_FILTER, going: ['a', 'b'], checkIns: {}, ...overrides,
  };
}

describe('changing a rolling meet on the night', () => {
  test('renaming logs who, when and what', () => {
    const r = applyPlanChange(rolling(), { kind: 'rename', stopId: 's2', name: 'Two B' }, 'host', NOW, zones, makeId);
    expect(r.event.stops[1].name).toBe('Two B');
    expect(r.event.changes).toHaveLength(1);
    expect(r.log).toMatchObject({ by: 'host', at: NOW.toISOString() });
    expect(r.log.text).toContain('Two B');
    expect(r.warning).toBeUndefined();
  });

  test('moving into a ban zone warns but is allowed', () => {
    const r = applyPlanChange(rolling(), { kind: 'move', stopId: 's3', at: { lat: 52.48, lng: -1.9 } }, 'host', NOW, zones, makeId);
    expect(r.event.stops[2].at).toEqual({ lat: 52.48, lng: -1.9 });
    expect(r.warning).toContain('Test zone');
    expect(r.log.banZone).toBe('Test zone');
  });

  test('stops at or before the current one with check-ins cannot move', () => {
    let e = checkIn(rolling(), 0, 'a');
    expect(canMoveStop(e, 0).ok).toBe(false);
    expect(() => applyPlanChange(e, { kind: 'move', stopId: 's1', at: { lat: 52, lng: -1 } }, 'host', NOW, zones, makeId)).toThrow();
    e = moveOn(e, NOW);
    // Stop 2 is now current but nobody has checked in yet, so it can still move.
    expect(canMoveStop(e, 1).ok).toBe(true);
    // The meet has left stop 1.
    expect(canMoveStop(rolling({ currentStop: 1 }), 0).ok).toBe(false);
  });

  test('adding or moving a stop works the rough area out again', () => {
    const far = { lat: 52.9, lng: -1.4 };
    const added = applyPlanChange(rolling(), { kind: 'add', name: 'Far', at: far }, 'host', NOW, zones, makeId).event;
    expect(milesBetween(added.area, far)).toBeLessThanOrEqual(added.areaRadiusMiles!);
    expect(areaGivesAway(added)).toBe(false);
    const moved = applyPlanChange(rolling(), { kind: 'move', stopId: 's1', at: { lat: 52.6, lng: -1.7 } }, 'host', NOW, zones, makeId).event;
    expect(areaGivesAway(moved)).toBe(false);
    for (const st of moved.stops) expect(milesBetween(moved.area, st.at!)).toBeLessThanOrEqual(moved.areaRadiusMiles!);
    // Renaming leaves the area alone.
    const renamed = applyPlanChange(rolling(), { kind: 'rename', stopId: 's1', name: 'Uno' }, 'host', NOW, zones, makeId).event;
    expect(renamed.area).toEqual(rolling().area);
  });

  test('the current stop with nobody checked in can move', () => {
    expect(canMoveStop(rolling(), 0).ok).toBe(true);
  });

  test('only stops not reached yet can be removed', () => {
    const e = rolling({ currentStop: 1 });
    expect(canRemoveStop(e, 1).ok).toBe(false);
    expect(canRemoveStop(e, 0).ok).toBe(false);
    const r = applyPlanChange(e, { kind: 'remove', stopId: 's3' }, 'host', NOW, zones, makeId);
    expect(r.event.stops.map((s) => s.id)).toEqual(['s1', 's2']);
    expect(r.event.currentStop).toBe(1);
  });

  test('adding a stop puts it at the end, hidden until hosts move on', () => {
    let e = checkIn(rolling({ stops: rolling().stops.slice(0, 1) }), 0, 'a');
    const r = applyPlanChange(e, { kind: 'add', name: 'New', at: { lat: 52.66, lng: -1.7 } }, 'host', NOW, zones, makeId);
    e = r.event;
    expect(e.stops).toHaveLength(2);
    expect(e.stops[1].revealedAt).toBeUndefined();
    expect(canSeeStop(e, 1, 'a', crews, NOW)).toBe(false);
    e = moveOn(e, NOW);
    expect(canSeeStop(e, 1, 'a', crews, NOW)).toBe(true);
    expect(canSeeStop(e, 1, 'b', crews, NOW)).toBe(true); // everyone going sees the meet point it's at now
    expect(canSeeStop(e, 1, 'stranger', crews, NOW)).toBe(false);
  });

  test('changes are refused once the meet is over or for other types', () => {
    expect(() => applyPlanChange(rolling({ endsAt: mins(-1) }), { kind: 'remove', stopId: 's3' }, 'host', NOW, zones, makeId)).toThrow();
    expect(() => applyPlanChange(rolling({ type: 'meet' }), { kind: 'remove', stopId: 's3' }, 'host', NOW, zones, makeId)).toThrow();
  });

  test('the chat line never names a place', () => {
    const msg = planChangedMessage('e1', 'host', NOW, 'c1');
    expect(msg.text).toBe(PLAN_CHANGED_TEXT);
    expect(msg.system).toBe(true);
    for (const s of rolling().stops) expect(msg.text).not.toContain(s.name);
  });

  test('ban zone lookup', () => {
    expect(banZoneAt({ lat: 52.48, lng: -1.89 }, zones)?.id).toBe('z');
    expect(banZoneAt({ lat: 53.5, lng: -1.89 }, zones)).toBeUndefined();
  });
});

describe('editing before the start', () => {
  test('allowed before the start with no check-ins only', () => {
    expect(canEditEvent(rolling({ startsAt: mins(60) }), NOW).ok).toBe(true);
    expect(canEditEvent(rolling(), NOW).ok).toBe(false);
    expect(canEditEvent(rolling({ startsAt: mins(20), checkIns: { a: ['s1'] } }), NOW).ok).toBe(false);
    expect(canEditEvent(rolling({ startsAt: mins(60), cancelled: true }), NOW).ok).toBe(false);
  });

  test('existing stops keep their ids, new ones get fresh ids', () => {
    const existing = rolling().stops;
    const stops = stopsFromDraft('e1', [
      { key: 's2', name: 'Two renamed', at: { lat: 1, lng: 1 } },
      { key: 'new', name: '', at: { lat: 2, lng: 2 } },
      { key: 'unplaced', name: 'x' },
    ], existing, (i) => `Stop ${i + 1}`);
    expect(stops.map((s) => s.id)).toEqual(['s2', 'e1-s1']);
    expect(stops[1].name).toBe('Stop 2');
  });

  test('editing keeps going, check-ins and logs the change', () => {
    const e = rolling({ startsAt: mins(60), going: ['a', 'host'] });
    const edited = applyEventEdit(e, { ...e, title: 'New name', going: [], checkIns: {} }, 'host', NOW, 'l1');
    expect(edited.title).toBe('New name');
    expect(edited.going).toEqual(['a', 'host']);
    expect(edited.changes?.[0].text).toMatch(/Edited/);
  });
});

describe('sharing', () => {
  test('share text has the deep link and the area, never a stop', () => {
    const e = rolling();
    const text = shareText(e, 'Tonight 22:30');
    expect(eventLink('e1')).toBe('nightshift://event/e1');
    expect(text).toContain('nightshift://event/e1');
    expect(text).toContain('Tamworth');
    for (const s of e.stops) expect(text).not.toContain(s.name);
  });
});
