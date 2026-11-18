import {
  buildFromRow,
  buildPhotoPath,
  buildToRow,
  chatFromRow,
  crewFromRow,
  eventFromRows,
  eventToRpc,
  isUuid,
  modsToRows,
  noticeFromRow,
  spotFromRow,
  stopFromRow,
  storagePathOf,
  UNKNOWN_HOME,
  userFromRows,
  votesForApp,
  type EventRow,
  type StopRow,
} from '../src/lib/backend/mapping';
import { canSeeStop } from '../src/lib/events';
import { allAwards } from '../src/lib/awards';
import { averageStars, statsOf } from '../src/lib/spots';
import type { Build, NightEvent } from '../src/lib/types';

const U1 = '11111111-1111-4111-8111-111111111111';
const U2 = '22222222-2222-4222-8222-222222222222';
const EV = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
const S0 = 'aaaaaaaa-0000-4000-8000-000000000000';
const S1 = 'aaaaaaaa-0000-4000-8000-000000000001';
const B1 = 'bbbbbbbb-0000-4000-8000-000000000001';

const eventRow: EventRow = {
  id: EV, type: 'rolling', title: 'Late one', description: null, starts_at: '2026-11-20T20:00:00.000Z', ends_at: null,
  reveal_minutes_before: 60, area_lat: 52.5, area_lng: -1.9, area_radius_miles: 4, area_name: 'Birmingham', current_stop: 0,
  crew_id: null, route_miles: null, invite_everyone: false, invite_cars: true, invite_bikes: false, invite_classes: ['A', 'B'],
  invite_min_mods: 2, invite_brands: ['BMW'], invite_radius_miles: 25, created_by: U1, cancelled_at: null,
};
const stop = (position: number, visible: boolean, id = position ? S1 : S0): StopRow => ({
  id, event_id: EV, position, name: visible ? `Place ${position}` : null, lat: visible ? 52.48 : null, lng: visible ? -1.88 : null,
  note: null, revealed_at: null, visible,
});

describe('people', () => {
  it('maps a profile; other people never get a real home', () => {
    const u = userFromRows({ id: U2, handle: 'dan', display_name: 'Dan', region: 'Midlands', onboarded: true });
    expect(u).toEqual({ id: U2, handle: 'dan', name: 'Dan', region: 'Midlands', home: UNKNOWN_HOME });
  });
  it('your own row carries your home and travel settings', () => {
    const u = userFromRows(
      { id: U1, handle: 'me', display_name: 'Me', region: 'East', onboarded: true },
      { home: { user_id: U1, lat: 52.21, lng: 0.12 }, settings: { travel_miles: 50, new_event_alerts: 'search' }, crewId: 'c1' },
    );
    expect(u.home).toEqual({ lat: 52.21, lng: 0.12 });
    expect(u).toMatchObject({ travelMiles: 50, alerts: 'search', crewId: 'c1' });
  });
});

describe('garage', () => {
  const row = {
    id: B1, owner_id: U1, kind: 'car' as const, make: 'VW', model: 'Golf R', year: 2019, nickname: null, stock_bhp: '296' as unknown as number,
    weight_kg: 1450, torque_lb_ft: null, dyno_bhp: null, colour: '#ff9a2e', vehicle_id: 'vw-golf-r-mk7', tune_stage: 'stage1' as const,
    engine_swap: null,
    build_mods: [
      { id: 'm2', category: 'exhaust' as const, name: 'Cat-back', bhp_gain: 10, position: 1 },
      { id: 'm1', category: 'intake' as const, name: 'Intake', bhp_gain: null, position: 0 },
    ],
    build_photos: [
      { storage_path: `${U1}/builds/${B1}/b.jpg`, position: 1 },
      { storage_path: `${U1}/builds/${B1}/a.jpg`, position: 0 },
    ],
  };
  it('orders mods and photos, turns numerics into numbers and photo paths into URLs', () => {
    const b = buildFromRow(row, (p) => `https://x.supabase.co/storage/v1/object/sign/photos/${p}?token=t`);
    expect(b.stockBhp).toBe(296);
    expect(b.mods.map((m) => m.name)).toEqual(['Intake', 'Cat-back']);
    expect(b.mods[0].bhpGain).toBeUndefined();
    expect(b.photos[0]).toContain(`${B1}/a.jpg`);
    expect(b).toMatchObject({ vehicleId: 'vw-golf-r-mk7', tuneStage: 'stage1', colour: '#ff9a2e' });
    expect(b.nickname).toBeUndefined();
  });
  it('round-trips the row and keeps the Storage path recoverable from a signed URL', () => {
    const b = buildFromRow(row, (p) => `https://x.supabase.co/storage/v1/object/sign/photos/${encodeURIComponent(p).replace(/%2F/g, '/')}?token=t`);
    const back = buildToRow(b);
    expect(back).toMatchObject({ id: B1, make: 'VW', stock_bhp: 296, vehicle_id: 'vw-golf-r-mk7', tune_stage: 'stage1', engine_swap: null });
    expect(storagePathOf(b.photos[0])).toBe(`${U1}/builds/${B1}/a.jpg`);
    expect(storagePathOf('ph-abc.jpg')).toBeNull();
    expect(storagePathOf('file:///x/photos/ph-abc.jpg')).toBeNull();
  });
  it('drops a colour the database would refuse and blanks empty text', () => {
    const b: Build = { ...buildFromRow(row), colour: 'orange', nickname: '  ' };
    expect(buildToRow(b)).toMatchObject({ colour: null, nickname: null });
  });
  it('mods become rows in order; photo paths start with your id (the bucket policy)', () => {
    expect(modsToRows(B1, [{ id: 'x', category: 'engine', name: ' Remap ', bhpGain: 40 }])).toEqual([
      { build_id: B1, category: 'engine', name: 'Remap', bhp_gain: 40, position: 0 },
    ]);
    expect(buildPhotoPath(U1, B1, 'f')).toBe(`${U1}/builds/${B1}/f.jpg`);
  });
});

describe('crews', () => {
  it('owner, hosts and members in joining order', () => {
    const c = crewFromRow({
      id: 'c', name: 'Night Owls', tag: 'NO',
      crew_members: [
        { user_id: U2, role: 'host', joined_at: '2026-11-02' },
        { user_id: U1, role: 'owner', joined_at: '2026-11-01' },
      ],
    });
    expect(c).toEqual({ id: 'c', name: 'Night Owls', tag: 'NO', memberIds: [U1, U2], ownerId: U1, hostIds: [U2] });
  });
});

describe('events', () => {
  it('a locked stop has no place and a neutral name, so the app can never show it', () => {
    expect(stopFromRow(stop(1, false))).toEqual({ id: S1, name: 'Meet point 2' });
    expect(stopFromRow(stop(0, true))).toEqual({ id: S0, name: 'Place 0', at: { lat: 52.48, lng: -1.88 } });
  });

  it('puts the event together from its parts', () => {
    const e = eventFromRows(eventRow, {
      hosts: [{ event_id: EV, user_id: U1 }],
      going: [{ event_id: EV, user_id: U2, build_id: B1 }, { event_id: 'other', user_id: U1, build_id: null }],
      requests: [
        { event_id: EV, user_id: 'r1', status: 'pending', build_id: 'b-r1' },
        { event_id: EV, user_id: 'r2', status: 'declined', build_id: null },
        { event_id: EV, user_id: 'r3', status: 'approved', build_id: null },
      ],
      checkIns: [{ event_id: EV, user_id: U2, stop_id: S0 }],
      stops: [stop(1, false), stop(0, true)],
      changes: [{ id: 'pc', event_id: EV, by_user: U1, at: '2026-11-20T20:10:00Z', text: 'Moved on.', ban_zone: null }],
    });
    expect(e.hostIds).toEqual([U1]);
    expect(e.going).toEqual([U2]);
    expect(e.requests).toEqual(['r1']);
    expect(e.declined).toEqual(['r2']);
    expect(e.vehicles).toEqual({ [U2]: B1, r1: 'b-r1' });
    expect(e.checkIns).toEqual({ [U2]: [S0] });
    expect(e.stops.map((s) => s.id)).toEqual([S0, S1]);
    expect(e.filter).toEqual({ everyone: false, cars: true, bikes: false, classes: ['A', 'B'], minMods: 2, brands: ['BMW'], radiusMiles: 25 });
    expect(e.area).toEqual({ lat: 52.5, lng: -1.9 });
    expect(e.changes).toHaveLength(1);
    expect(e.cancelled).toBeUndefined();
  });

  it("the phone's own reveal rule agrees with what the server sent: a locked stop stays locked whatever the clock says", () => {
    const e = eventFromRows({ ...eventRow, starts_at: '2020-01-01T20:00:00Z' }, {
      hosts: [{ event_id: EV, user_id: U1 }], going: [{ event_id: EV, user_id: U2, build_id: null }], requests: [],
      checkIns: [], stops: [stop(0, true), stop(1, false)],
    });
    const now = new Date('2020-01-01T20:30:00Z');
    expect(canSeeStop(e, 0, U2, [], now)).toBe(true);
    expect(canSeeStop({ ...e, currentStop: 1, checkIns: { [U2]: [S0] } }, 1, U2, [], now)).toBe(false);
  });

  it('save_event: create sends no id; edit sends the id, server stop ids, and co-hosts besides you', () => {
    const e = eventFromRows(eventRow, { hosts: [{ event_id: EV, user_id: U1 }], going: [], requests: [], checkIns: [], stops: [stop(0, true)] });
    const draft: NightEvent = {
      ...e, hostIds: [U1, U2, 'sample-dan'],
      stops: [...e.stops, { id: 'local-stop', name: 'New one', at: { lat: 52.51, lng: -1.91 } }],
    };
    const create = eventToRpc(draft, U1, true);
    expect(create.p_event.id).toBeNull();
    const edit = eventToRpc(draft, U1, false);
    expect(edit.p_event).toMatchObject({
      id: EV, type: 'rolling', area: { lat: 52.5, lng: -1.9 }, area_radius_miles: 4, crew_id: null,
      filter: { everyone: false, cars: true, bikes: false, classes: ['A', 'B'], min_mods: 2, brands: ['BMW'], radius_miles: 25 },
    });
    expect(edit.p_stops).toEqual([
      { id: S0, name: 'Place 0', lat: 52.48, lng: -1.88, note: null },
      { id: null, name: 'New one', lat: 52.51, lng: -1.91, note: null },
    ]);
    expect(edit.p_cohost_ids).toEqual([U2]);
  });
});

describe('chat, notices, votes', () => {
  it('chat and notices', () => {
    expect(chatFromRow({ id: 'c', event_id: EV, user_id: U1, body: 'Hi', system: false, created_at: 't' })).toEqual({ id: 'c', eventId: EV, userId: U1, text: 'Hi', at: 't' });
    expect(chatFromRow({ id: 'c', event_id: EV, user_id: U1, body: 'Hosts changed the plan', system: true, created_at: 't' }).system).toBe(true);
    expect(
      noticeFromRow({ id: 'n', event_id: EV, kind: 'moved', key: 'ns.x.moved.1', title: 'Late one moved on', body: 'Stop 2 is unlocked.', created_at: 't', read_at: null }),
    ).toEqual({ id: 'n', eventId: EV, text: 'Late one moved on. Stop 2 is unlocked.', at: 't', read: false, kind: 'moved', key: 'ns.x.moved.1' });
    expect(noticeFromRow({ id: 'n', event_id: null, kind: 'system', key: null, title: 'A', body: 'B', created_at: 't', read_at: 't' })).toEqual({
      id: 'n', eventId: '', text: 'A. B', at: 't', read: true,
    });
  });

  it('secret votes: awards become anonymous tallies that give the same winners', () => {
    const awarded = '2026-11-12T00:00:00.000Z';
    const votes = votesForApp(
      [
        { event_id: 'closed', voter_id: U1, category: 'best-in-show', build_id: B1, created_at: 't' },
        { event_id: 'open', voter_id: U1, category: 'sound', build_id: B1, created_at: 't' },
      ],
      [{ event_id: 'closed', category: 'best-in-show', build_id: B1, owner_id: U2, votes: 4, awarded_at: awarded }],
    );
    // Your vote on the closed event is already in its tally; the open one is yours.
    expect(votes.filter((v) => v.eventId === 'closed')).toHaveLength(4);
    expect(votes.filter((v) => v.voterId === U1).map((v) => v.eventId)).toEqual(['open']);
    const event = {
      id: 'closed', type: 'meet', title: 'x', startsAt: '2026-11-10T20:00:00Z', area: { lat: 0, lng: 0 }, areaName: 'x', stops: [], currentStop: 0,
      revealMinutesBefore: 0, hostIds: [], filter: { everyone: true, cars: true, bikes: true, classes: [], minMods: 0, brands: [], radiusMiles: 25 },
      going: [], checkIns: { [U2]: ['s'] },
    } as NightEvent;
    const build = { id: B1, ownerId: U2, kind: 'car', make: 'VW', model: 'Golf', stockBhp: 300, weightKg: 1400, mods: [], photos: [] } as Build;
    const awards = allAwards(votes, [event], [build], new Date('2026-11-17T00:00:00Z'));
    expect(awards).toEqual([expect.objectContaining({ category: 'best-in-show', buildId: B1, ownerId: U2, votes: 4 })]);
  });
});

describe('places from the server', () => {
  const row = {
    id: 'sp', kind: 'drive' as const, name: 'Snake Pass', description: 'd', lat: 53.4, lng: -1.8,
    path: [{ lat: 53.4, lng: -1.8 }, { lat: 53.41, lng: -1.82 }], miles: 3.2, author_id: U2, status: 'approved' as const,
    created_at: 't', ban_zone: null, warnings: ['Snow gates'], region: 'Peak District',
  };
  it('counts and the average come out as the server says; only your own completion is real', () => {
    const s = spotFromRow(row, {
      me: U1,
      stats: { spot_id: 'sp', people: 3, rating_average: 4, rating_count: 2, completed_by_me: true },
      mine: [{ spot_id: 'sp', completed_on: '2026-11-15', photo_path: null }],
      myRating: { spot_id: 'sp', stars: 5 },
    });
    expect(statsOf(s).completions).toHaveLength(3);
    expect(averageStars(s)).toEqual({ average: 4, count: 2 });
    expect(s.completions.filter((c) => c.userId === U1)).toEqual([{ userId: U1, on: '2026-11-15' }]);
    expect(s.ratings.find((r) => r.userId === U1)?.stars).toBe(5);
    expect(s).toMatchObject({ path: row.path, miles: 3.2, authorId: U2, warnings: ['Snow gates'], region: 'Peak District', status: 'approved' });
  });
  it('a pending suggestion stays pending', () => {
    expect(spotFromRow({ ...row, status: 'pending' }, { me: U1 }).status).toBe('pending');
  });
});

describe('ids', () => {
  it('knows server ids from the demo ids', () => {
    expect(isUuid(EV)).toBe(true);
    expect(isUuid('ev-abc123')).toBe(false);
    expect(isUuid(undefined)).toBe(false);
  });
});
