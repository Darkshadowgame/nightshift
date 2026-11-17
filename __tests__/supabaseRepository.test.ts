/**
 * SupabaseRepository against a mocked supabase-js client: which RPC or table
 * each store action uses, with which arguments, and how the answers land in
 * the app's state. The hosted project is exercised for real by
 * scripts/supabase-smoke.mjs.
 */
jest.mock('../src/lib/photos', () => ({
  photoUri: (ref: string) => `file:///docs/photos/${ref}`,
  deletePhotos: jest.fn(),
}));
jest.mock('../src/lib/notify', () => ({ notifyNow: jest.fn(() => Promise.resolve()) }));

import { createSupabaseRepository } from '../src/lib/backend/remote';
import { OFFLINE, type OutboxItem } from '../src/lib/backend/outbox';
import { EMPTY, type Persisted } from '../src/lib/localState';
import { DEFAULT_SETTINGS } from '../src/lib/settings';
import { bundledSpots } from '../src/lib/placeStore';
import { NEW_RUN } from '../src/lib/spots';
import type { Build, NightEvent } from '../src/lib/types';

const ME = '11111111-1111-4111-8111-111111111111';
const DAN = '22222222-2222-4222-8222-222222222222';
const EV = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
const S0 = 'aaaaaaaa-0000-4000-8000-000000000000';
const S1 = 'aaaaaaaa-0000-4000-8000-000000000001';
const BUILD = 'bbbbbbbb-0000-4000-8000-000000000001';
const SIGN = (p: string) => `https://proj.supabase.co/storage/v1/object/sign/photos/${p}?token=t`;

type Op = [string, unknown[]];
interface Query {
  table: string;
  ops: Op[];
}

/** A chainable stand-in for supabase-js: records every call and answers from `tables` / `rpcs`. */
function mockClient(opts: {
  tables?: (q: Query) => { data?: unknown; error?: { message: string } | null } | undefined;
  rpcs?: Record<string, (args: Record<string, unknown>) => unknown>;
  offline?: boolean;
} = {}) {
  const queries: Query[] = [];
  const rpcCalls: [string, Record<string, unknown>][] = [];
  const storage = {
    upload: jest.fn(async () => ({ data: {}, error: null })),
    remove: jest.fn(async () => ({ data: [], error: null })),
    list: jest.fn(async (prefix: string) => ({
      data: prefix === ME ? [{ name: 'builds', id: null }] : prefix === `${ME}/builds` ? [{ name: BUILD, id: null }] : [{ name: 'a.jpg', id: 'f1' }],
      error: null,
    })),
    createSignedUrls: jest.fn(async (paths: string[]) => ({ data: paths.map((p) => ({ path: p, signedUrl: SIGN(p), error: null })), error: null })),
  };
  const channel: { on: jest.Mock; subscribe: jest.Mock } = { on: jest.fn(), subscribe: jest.fn() };
  channel.on.mockImplementation(() => channel);
  channel.subscribe.mockImplementation(() => channel);
  const client = {
    from(table: string) {
      const q: Query = { table, ops: [] };
      queries.push(q);
      const builder: Record<string, unknown> = new Proxy(
        {},
        {
          get(_t, prop: string) {
            if (prop === 'then') {
              if (opts.offline) return (_res: unknown, rej: (e: unknown) => void) => rej(new TypeError('Network request failed'));
              const answer = opts.tables?.(q) ?? { data: [] };
              return (res: (v: unknown) => void) => res({ data: answer.data ?? [], error: answer.error ?? null });
            }
            return (...args: unknown[]) => {
              q.ops.push([prop, args]);
              return builder;
            };
          },
        },
      );
      return builder;
    },
    rpc: jest.fn(async (name: string, args: Record<string, unknown>) => {
      if (opts.offline) throw new TypeError('Network request failed');
      rpcCalls.push([name, args]);
      const fn = opts.rpcs?.[name];
      if (!fn) return { data: null, error: null };
      try {
        return { data: fn(args), error: null };
      } catch (e) {
        return { data: null, error: { message: (e as Error).message } };
      }
    }),
    storage: { from: jest.fn(() => storage) },
    channel: jest.fn(() => channel),
    removeChannel: jest.fn(),
  };
  return { client, queries, rpcCalls, storage, channel };
}

function event(over: Partial<NightEvent> = {}): NightEvent {
  return {
    id: EV, type: 'rolling', title: 'Late one', startsAt: '2026-11-20T20:00:00.000Z', area: { lat: 52.5, lng: -1.9 }, areaRadiusMiles: 4,
    areaName: 'Birmingham', stops: [{ id: S0, name: 'One', at: { lat: 52.48, lng: -1.88 } }, { id: S1, name: 'Two', at: { lat: 52.52, lng: -1.92 } }],
    currentStop: 0, revealMinutesBefore: 60, hostIds: [ME], going: [], checkIns: {},
    filter: { everyone: true, cars: true, bikes: true, classes: [], minMods: 0, brands: [], radiusMiles: 25 }, ...over,
  };
}

function setup(m: ReturnType<typeof mockClient>, start: Partial<Persisted> = {}) {
  let state: Persisted = {
    ...EMPTY, settings: DEFAULT_SETTINGS, users: [{ id: ME, handle: 'me', name: 'Me', region: 'East', home: { lat: 52.21, lng: 0.12 } }],
    events: [event()], ...start,
  };
  let outbox: OutboxItem[] = [];
  const online: boolean[] = [];
  const repo = createSupabaseRepository({
    client: m.client as never,
    uid: ME,
    get: () => state,
    set: (fn) => {
      state = fn(state);
    },
    spots: () => [...bundledSpots(), ...state.spots],
    setOnline: (o) => online.push(o),
    outbox: { get: () => outbox, set: (x) => (outbox = x) },
    appInfo: () => ({ app_version: 'v1.0.42', update_id: 'u1', device: 'ios 26.1' }),
  });
  return { repo, state: () => state, outbox: () => outbox, online };
}

const rpcNames = (m: ReturnType<typeof mockClient>) => m.rpcCalls.map(([n]) => n);

describe('rule-checked actions go to their RPCs', () => {
  it('setGoing: set_going with the build you bring, then reads the event back through get_event_stops', async () => {
    const m = mockClient({ rpcs: { set_going: () => 'requested', get_event_stops: () => [] } });
    const { repo } = setup(m);
    await expect(repo.setGoing(EV, true, BUILD)).resolves.toBe('requested');
    expect(m.rpcCalls[0]).toEqual(['set_going', { p_event_id: EV, p_going: true, p_build_id: BUILD }]);
    expect(rpcNames(m)).toContain('get_event_stops');
    // Exact stops are never read from the table directly.
    expect(m.queries.some((q) => q.table === 'event_stops')).toBe(false);
  });

  it("setGoing: a demo build id isn't sent", async () => {
    const m = mockClient({ rpcs: { set_going: () => 'going' } });
    const { repo } = setup(m);
    await repo.setGoing(EV, true, 'b-me-0');
    expect(m.rpcCalls[0][1].p_build_id).toBeNull();
  });

  it("the server's sentence comes back as the error", async () => {
    const m = mockClient({ rpcs: { move_on: () => { throw new Error('Only hosts can move the meet on.'); } } });
    const { repo } = setup(m);
    await expect(repo.moveOn(EV)).rejects.toThrow('Only hosts can move the meet on.');
  });

  it('checkIn: sends the GPS fix (never stored) and refuses without one', async () => {
    const m = mockClient({ rpcs: { check_in: () => null } });
    const { repo } = setup(m);
    await expect(repo.checkIn(EV, 0)).rejects.toThrow('Turn on location so the app can see you are at the stop.');
    await repo.checkIn(EV, 0, BUILD, { lat: 52.4801, lng: -1.8801 });
    expect(m.rpcCalls.find(([n]) => n === 'check_in')![1]).toEqual({ p_event_id: EV, p_position: 0, p_lat: 52.4801, p_lng: -1.8801, p_build_id: BUILD });
  });

  it('moveOn: tells the host how many people were told (the audience move_on returns)', async () => {
    const m = mockClient({ rpcs: { move_on: () => [DAN, ME], get_event_stops: () => [] } });
    const { repo, state } = setup(m);
    await repo.moveOn(EV);
    expect(state().notices[0].text).toMatch(/1 person checked in at One has been told/);
  });

  it('saveEvent creates (no id) and resolves with the server id; editEvent sends the id', async () => {
    const NEW = 'cccccccc-0000-4000-8000-000000000001';
    const m = mockClient({ rpcs: { save_event: () => ({ id: NEW, warnings: [] }), get_event_stops: () => [] } });
    const { repo } = setup(m);
    await expect(repo.saveEvent(event({ id: 'local-new' }))).resolves.toBe(NEW);
    expect((m.rpcCalls[0][1].p_event as { id: unknown }).id).toBeNull();
    await repo.editEvent(event());
    const edit = m.rpcCalls.filter(([n]) => n === 'save_event')[1][1];
    expect((edit.p_event as { id: unknown }).id).toBe(EV);
    expect(edit.p_stops).toEqual([
      { id: S0, name: 'One', lat: 52.48, lng: -1.88, note: null },
      { id: S1, name: 'Two', lat: 52.52, lng: -1.92, note: null },
    ]);
  });

  it('changePlan add: sends the place and the rough area worked out again on the phone', async () => {
    const m = mockClient({ rpcs: { change_plan: () => ({ warning: null }), get_event_stops: () => [] } });
    const { repo } = setup(m);
    const now = Date.now();
    const live = event({ startsAt: new Date(now - 600_000).toISOString(), endsAt: new Date(now + 3_600_000).toISOString() });
    const { repo: r2 } = setup(m, { events: [live] });
    void repo;
    await r2.changePlan(EV, { kind: 'add', name: 'Three', at: { lat: 52.5, lng: -1.86 } });
    const args = m.rpcCalls.find(([n]) => n === 'change_plan')![1];
    expect(args).toMatchObject({ p_event_id: EV, p_kind: 'add', p_name: 'Three', p_lat: 52.5, p_lng: -1.86 });
    expect(typeof args.p_area_lat).toBe('number');
    expect(args.p_area_radius_miles).toBeGreaterThanOrEqual(3);
    expect(args.p_stop_id).toBeUndefined();
  });

  it('vote, crews, answering requests, cancelling', async () => {
    const m = mockClient({ rpcs: { create_crew: () => 'crew-uuid' } });
    const { repo } = setup(m);
    await repo.vote(EV, 'best-in-show', BUILD);
    await expect(repo.createCrew('Night Owls', 'no')).resolves.toBe('crew-uuid');
    await repo.joinCrew('crew-2');
    await repo.setCrewHost('crew-uuid', DAN, true);
    await repo.leaveCrew();
    await repo.answerRequest(EV, DAN, false);
    await repo.cancelEvent(EV);
    expect(m.rpcCalls.filter(([n]) => n !== 'get_event_stops' && n !== 'spot_stats')).toEqual([
      ['cast_vote', { p_event_id: EV, p_category: 'best-in-show', p_build_id: BUILD }],
      ['create_crew', { p_name: 'Night Owls', p_tag: 'no' }],
      ['join_crew', { p_crew_id: 'crew-2' }],
      ['set_crew_role', { p_crew_id: 'crew-uuid', p_user_id: DAN, p_role: 'host' }],
      ['leave_crew', {}],
      ['answer_request', { p_event_id: EV, p_user_id: DAN, p_approve: false }],
      ['cancel_event', { p_event_id: EV }],
    ]);
    await expect(repo.addToCrew('crew-uuid', DAN)).rejects.toThrow(/invite/);
  });

  it('profile: save_profile then save_travel_prefs', async () => {
    const m = mockClient();
    const { repo } = setup(m);
    await repo.saveProfile({ handle: '@Me_Two', name: 'Me', region: 'East', home: { lat: 52.2, lng: 0.1 }, travelMiles: 50, alerts: 'search' });
    expect(m.rpcCalls.slice(0, 2)).toEqual([
      ['save_profile', { p_handle: '@Me_Two', p_name: 'Me', p_region: 'East', p_home_lat: 52.2, p_home_lng: 0.1 }],
      ['save_travel_prefs', { p_travel_miles: 50, p_new_event_alerts: 'search' }],
    ]);
  });

  it('places: suggest_spot; drives on the server go to complete_drive with the fixes; bundled ones stay on the phone', async () => {
    const m = mockClient({ rpcs: { suggest_spot: () => ({ id: 'sp-new', warning: null }), complete_drive: () => ({ ok: false, reason: 'Pass every checkpoint in order to finish.' }) } });
    const path = [{ lat: 53.4, lng: -1.8 }, { lat: 53.41, lng: -1.82 }];
    const serverDrive = {
      id: 'dddddddd-0000-4000-8000-000000000001', kind: 'drive' as const, name: 'Server drive', at: path[0], description: '', path, miles: 1.2,
      status: 'approved' as const, createdAt: 't', completions: [], ratings: [],
    };
    const { repo, state } = setup(m, { spots: [serverDrive] });
    const t0 = Date.now() - 20 * 60_000;
    const run = { passed: 2, startedAt: t0, lastAt: t0 + 10 * 60_000, fixes: [{ ...path[0], t: t0 }, { ...path[1], t: t0 + 10 * 60_000 }] };
    await expect(repo.finishDrive(serverDrive.id, run)).resolves.toEqual({ ok: false, reason: 'Pass every checkpoint in order to finish.' });
    expect(m.rpcCalls.find(([n]) => n === 'complete_drive')![1]).toEqual({ p_spot_id: serverDrive.id, p_fixes: run.fixes });

    (global as { fetch?: unknown }).fetch = jest.fn(async () => ({ arrayBuffer: async () => new ArrayBuffer(8) }));
    await expect(repo.suggestSpot({ kind: 'photo', name: 'Quarry view', description: '', points: [{ lat: 53.0, lng: -1.5 }], photo: 'ph-q.jpg' })).resolves.toEqual({ id: 'sp-new' });
    expect(m.rpcCalls.find(([n]) => n === 'suggest_spot')![1]).toEqual({ p_kind: 'photo', p_name: 'Quarry view', p_description: '', p_points: [{ lat: 53, lng: -1.5 }] });
    // The suggester's photo goes to the place's fixed path.
    expect((m.storage.upload.mock.calls[0] as unknown[])[0]).toBe(`${ME}/spots/sp-new/suggested.jpg`);

    const bundled = bundledSpots().find((s) => s.kind === 'drive' && s.path && s.path.length >= 2)!;
    const before = m.rpcCalls.length;
    const verdict = await repo.finishDrive(bundled.id, NEW_RUN);
    expect(verdict.ok).toBe(false);
    expect(m.rpcCalls.length).toBe(before);
    expect(state().placeProgress[bundled.id]).toBeUndefined();
  });
});

describe('plain data goes to tables', () => {
  const build: Build = {
    id: BUILD, ownerId: ME, kind: 'car', make: 'VW', model: 'Golf R', stockBhp: 296, weightKg: 1450,
    mods: [{ id: 'm1', category: 'exhaust', name: 'Cat-back', bhpGain: 10 }],
    photos: [SIGN(`${ME}/builds/${BUILD}/old.jpg`), 'ph-new.jpg'],
  };

  beforeEach(() => {
    (global as { fetch?: unknown }).fetch = jest.fn(async () => ({ arrayBuffer: async () => new ArrayBuffer(8) }));
  });

  it('saveBuild: uploads new photos under {uid}/builds/{id}/, upserts the build, replaces mods and photo rows, removes dropped files', async () => {
    const m = mockClient();
    const prev: Build = { ...build, photos: [SIGN(`${ME}/builds/${BUILD}/old.jpg`), SIGN(`${ME}/builds/${BUILD}/gone.jpg`)] };
    const { repo } = setup(m, { builds: [prev] });
    await repo.saveBuild(build);
    const uploaded = (m.storage.upload.mock.calls[0] as unknown[])[0] as string;
    expect(uploaded).toMatch(new RegExp(`^${ME}/builds/${BUILD}/[0-9a-f-]{36}\\.jpg$`));
    const upsert = m.queries.find((q) => q.table === 'builds' && q.ops[0][0] === 'upsert')!;
    expect(upsert.ops[0][1][0]).toMatchObject({ id: BUILD, make: 'VW', model: 'Golf R', stock_bhp: 296 });
    expect(upsert.ops[0][1][0]).not.toHaveProperty('owner_id');
    const modsInsert = m.queries.find((q) => q.table === 'build_mods' && q.ops[0][0] === 'insert')!;
    expect(modsInsert.ops[0][1][0]).toEqual([{ build_id: BUILD, category: 'exhaust', name: 'Cat-back', bhp_gain: 10, position: 0 }]);
    const photos = m.queries.find((q) => q.table === 'build_photos' && q.ops[0][0] === 'insert')!;
    expect((photos.ops[0][1][0] as { storage_path: string }[]).map((p) => p.storage_path)).toEqual([`${ME}/builds/${BUILD}/old.jpg`, uploaded]);
    expect(m.storage.remove).toHaveBeenCalledWith([`${ME}/builds/${BUILD}/gone.jpg`]);
  });

  it('offline: a build edit and chat queue up (shown at once), rule-checked actions say so', async () => {
    const m = mockClient({ offline: true });
    const { repo, state, outbox, online } = setup(m);
    await repo.saveBuild({ ...build, photos: [] });
    await repo.sendChat(EV, 'On my way');
    expect(outbox().map((x) => x.kind)).toEqual(['saveBuild', 'chat']);
    expect(state().builds.map((b) => b.id)).toEqual([BUILD]);
    expect(state().chat.map((c) => c.text)).toEqual(['On my way']);
    await expect(repo.setGoing(EV, true)).rejects.toThrow(OFFLINE);
    await expect(repo.vote(EV, 'sound', BUILD)).rejects.toThrow(OFFLINE);
    expect(online).toContain(false);
  });

  it('flush: sends the queue in order, then the pending feedback without reading it back', async () => {
    const m = mockClient();
    const { repo, outbox, state } = setup(m, {
      pendingFeedback: [{ id: 'f1', kind: 'idea', message: 'Missing vehicle: Ariel Atom', screen: 'vehicle-picker', at: 't' }],
    });
    // Queue while offline, then come back.
    const off = mockClient({ offline: true });
    void off;
    await repo.flush();
    expect(outbox()).toEqual([]);
    const fb = m.queries.find((q) => q.table === 'feedback')!;
    expect(fb.ops).toEqual([['insert', [{ kind: 'idea', message: 'Missing vehicle: Ariel Atom', screen: 'vehicle-picker', app_version: 'v1.0.42', update_id: 'u1', device: 'ios 26.1' }]]]);
    expect(fb.ops.some(([op]) => op === 'select')).toBe(false);
    expect(state().pendingFeedback).toEqual([]);
  });

  it('chat: an insert of event_id and body only', async () => {
    const m = mockClient();
    const { repo } = setup(m);
    await repo.sendChat(EV, 'Heading off in 5');
    const q = m.queries.find((x) => x.table === 'chat_messages' && x.ops[0][0] === 'insert')!;
    expect(q.ops[0][1][0]).toEqual({ event_id: EV, body: 'Heading off in 5' });
  });
});

describe('reads', () => {
  it('refresh: builds the state from tables, views and RPCs; other people get no home', async () => {
    const m = mockClient({
      tables: (q) => {
        switch (q.table) {
          case 'profiles':
            return { data: [
              { id: ME, handle: 'me', display_name: 'Me', region: 'East', onboarded: true, onboarded_at: '2026-11-17T00:00:00Z' },
              { id: DAN, handle: 'dan', display_name: 'Dan', region: 'Midlands', onboarded: true, onboarded_at: null },
            ] };
          case 'my_home': return { data: [{ user_id: ME, lat: 52.21, lng: 0.12 }] };
          case 'profile_settings': return { data: [{ travel_miles: 40, new_event_alerts: 'notify' }] };
          case 'crews': return { data: [{ id: 'c1', name: 'Owls', tag: 'OW', crew_members: [{ user_id: DAN, role: 'owner', joined_at: 't' }] }] };
          case 'events_list': return { data: [{
            id: EV, type: 'meet', title: 'Meet', description: null, starts_at: '2026-11-20T20:00:00Z', ends_at: null, reveal_minutes_before: 60,
            area_lat: 52.5, area_lng: -1.9, area_radius_miles: 3, area_name: 'Brum', current_stop: 0, crew_id: null, route_miles: null,
            invite_everyone: true, invite_cars: true, invite_bikes: true, invite_classes: [], invite_min_mods: 0, invite_brands: [], invite_radius_miles: 25,
            created_by: DAN, cancelled_at: null,
          }] };
          case 'event_hosts': return { data: [{ event_id: EV, user_id: DAN }] };
          case 'event_going': return { data: [{ event_id: EV, user_id: ME, build_id: null }] };
          case 'builds': return { data: [{
            id: BUILD, owner_id: DAN, kind: 'car', make: 'BMW', model: 'M2', year: null, nickname: null, stock_bhp: 453, weight_kg: 1700,
            torque_lb_ft: null, dyno_bhp: null, colour: null, vehicle_id: null, tune_stage: null, engine_swap: null, build_mods: [],
            build_photos: [{ storage_path: `${DAN}/builds/${BUILD}/a.jpg`, position: 0 }],
          }] };
          case 'notices': return { data: [{ id: 'n1', event_id: EV, kind: 'nearby', key: 'ns.e.nearby', title: 'New meet near you', body: 'Meet', created_at: '2026-11-17T10:00:00Z', read_at: null }] };
          default: return { data: [] };
        }
      },
      rpcs: { get_event_stops: () => [{ id: S0, event_id: EV, position: 0, name: null, lat: null, lng: null, note: null, revealed_at: null, visible: false }] },
    });
    const { repo, state } = setup(m, { notices: [{ id: 'local', eventId: EV, text: 'Reminder', at: '2026-11-17T09:00:00Z', read: false, key: 'ns.e.soon' }] });
    await repo.refresh();
    const s = state();
    expect(s.onboarded).toBe(true);
    expect(s.users.find((u) => u.id === ME)).toMatchObject({ home: { lat: 52.21, lng: 0.12 }, travelMiles: 40 });
    expect(s.users.find((u) => u.id === DAN)).toMatchObject({ crewId: 'c1', home: { lat: 0, lng: 0 } });
    expect(s.events[0]).toMatchObject({ id: EV, going: [ME], hostIds: [DAN], stops: [{ id: S0, name: 'Stop 1' }] });
    expect(s.events[0].stops[0].at).toBeUndefined();
    expect(s.builds[0].photos[0]).toBe(SIGN(`${DAN}/builds/${BUILD}/a.jpg`));
    expect(s.notices.map((n) => n.id)).toEqual(['n1', 'local']);
    expect(m.queries.some((q) => q.table === 'event_stops' || q.table === 'profile_homes')).toBe(false);
  });

  it('searchEvents: search_events with "Any distance" as 600 and the point you send', async () => {
    const m = mockClient({ rpcs: { search_events: () => [{ event_id: EV, miles: '3.7', can_go: true }] } });
    const { repo } = setup(m);
    const hits = await repo.searchEvents({ maxMiles: null, types: ['meet'], when: 'tonight', canGoOnly: true, vehicles: 'bikes' }, { lat: 52.49, lng: -1.89 });
    expect(hits).toEqual([{ eventId: EV, miles: 3.7, canGo: true }]);
    expect(m.rpcCalls[0]).toEqual(['search_events', {
      p_max_miles: 600, p_types: ['meet'], p_when: 'tonight', p_can_go_only: true, p_vehicles: 'bikes', p_from_lat: 52.49, p_from_lng: -1.89,
    }]);
  });

  it('inviteCount: invite_count with the filter in snake case', async () => {
    const m = mockClient({ rpcs: { invite_count: () => ({ people: null, builds: 7 }) } });
    const { repo } = setup(m);
    await expect(repo.inviteCount(event().filter, { lat: 52.5, lng: -1.9 })).resolves.toEqual({ people: null, builds: 7 });
    expect(m.rpcCalls[0][1]).toEqual({
      p_filter: { everyone: true, cars: true, bikes: true, classes: [], min_mods: 0, brands: [], radius_miles: 25 }, p_area_lat: 52.5, p_area_lng: -1.9,
    });
  });

  it('watchEvent: one channel for the event row, chat, going, requests and check-ins; unsubscribes', () => {
    const m = mockClient();
    const { repo } = setup(m);
    const stop = repo.watchEvent(EV);
    const tables = m.channel.on.mock.calls.map((c: unknown[]) => c[1] as { table: string; filter: string });
    expect(tables.map((t) => t.table)).toEqual(['events', 'chat_messages', 'event_going', 'event_requests', 'check_ins']);
    expect(tables[0].filter).toBe(`id=eq.${EV}`);
    expect(tables[1].filter).toBe(`event_id=eq.${EV}`);
    expect(tables.some((t) => t.table === 'event_stops')).toBe(false);
    stop();
    expect(m.client.removeChannel).toHaveBeenCalled();
    expect(repo.watchEvent('demo-event')).toBeInstanceOf(Function);
  });
});

describe('delete my account', () => {
  it('removes every file under photos/{uid}/ first, then calls delete_my_account', async () => {
    const m = mockClient();
    const { repo } = setup(m);
    await repo.deleteAccount();
    expect(m.storage.remove).toHaveBeenCalledWith([`${ME}/builds/${BUILD}/a.jpg`]);
    expect(m.rpcCalls.map(([n]) => n)).toEqual(['delete_my_account']);
    const removeOrder = m.storage.remove.mock.invocationCallOrder[0];
    const rpcOrder = m.client.rpc.mock.invocationCallOrder[0];
    expect(removeOrder).toBeLessThan(rpcOrder);
  });
});
