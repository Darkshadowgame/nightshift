/**
 * Road reports against a mocked supabase-js client: which RPC each action
 * calls with which arguments, and how rows become reports. The hosted project
 * is exercised for real by scripts/supabase-smoke.mjs.
 */
import { closureFromRow, createRemoteRoads, reportFromRow, type RoadClosureRow, type RoadReportRow } from '../src/lib/backend/roads';
import { OFFLINE } from '../src/lib/backend/outbox';

const NOW = new Date('2026-11-17T21:00:00Z');
const UID = '11111111-1111-4111-8111-111111111111';

const ROW: RoadReportRow = {
  id: 'aaaaaaaa-0000-4000-8000-000000000001', kind: 'crash', lat: 52.4862, lng: -1.8904, heading: 90,
  created_at: '2026-11-17T20:48:00Z', expires_at: '2026-11-17T22:48:00Z', confirm_count: 1, clear_count: 0, mine: false, my_vote: null,
};
const POLICE: RoadReportRow = { ...ROW, id: 'aaaaaaaa-0000-4000-8000-000000000002', kind: 'police' };
const CLOSURE: RoadClosureRow = {
  id: 'cccccccc-0000-4000-8000-000000000001', source: 'tfl', kind: 'road_closure', description: 'Road closed for works', road: 'A222 Elm Road',
  direction: 'Northbound', full_closure: true, lat: 51.4262, lng: 0.1009, path: [{ lat: 51.4265, lng: 0.1009 }, { lat: 51.4259, lng: 0.1009 }],
  starts_at: '2026-08-29T07:00:00Z', ends_at: '2026-11-26T18:00:00Z',
};

function mockClient(answers: Record<string, unknown>) {
  const calls: [string, Record<string, unknown>][] = [];
  const client = {
    rpc: jest.fn((name: string, args: Record<string, unknown>) => {
      calls.push([name, args]);
      const a = answers[name];
      if (a instanceof Error) return Promise.resolve({ data: null, error: { message: a.message } });
      return Promise.resolve({ data: a ?? null, error: null });
    }),
    channel: jest.fn(() => {
      const ch: { on: jest.Mock; subscribe: jest.Mock } = { on: jest.fn(), subscribe: jest.fn() };
      ch.on.mockReturnValue(ch);
      ch.subscribe.mockReturnValue(ch);
      return ch;
    }),
    removeChannel: jest.fn(() => Promise.resolve('ok')),
  };
  return { client, calls };
}

describe('rows', () => {
  it('maps a report row', () => {
    expect(reportFromRow(ROW)).toMatchObject({ id: ROW.id, kind: 'crash', at: { lat: 52.4862, lng: -1.8904 }, heading: 90, confirmCount: 1, source: 'user', mine: false });
  });

  it('maps an open-data closure, credited, as a Closure; lanes only as Roadworks', () => {
    const c = closureFromRow(CLOSURE, NOW)!;
    expect(c).toMatchObject({ id: `oc:${CLOSURE.id}`, kind: 'closure', source: 'tfl', fullClosure: true, road: 'A222 Elm Road', direction: 'Northbound' });
    expect(c.path).toHaveLength(2);
    expect(closureFromRow({ ...CLOSURE, full_closure: false }, NOW)!.kind).toBe('roadworks');
    expect(closureFromRow({ ...CLOSURE, source: 'somewhere' }, NOW)).toBeNull();
    expect(closureFromRow({ ...CLOSURE, ends_at: null }, NOW)!.expiresAt).toBe('2026-11-18T21:00:00.000Z');
  });
});

describe('the RPCs', () => {
  it('asks for the map without police, and filters any that come back', async () => {
    const { client, calls } = mockClient({ road_reports_near: [ROW, POLICE], road_closures_near: [CLOSURE] });
    const roads = createRemoteRoads(client as never, () => NOW);
    const got = await roads.near({ lat: 52.48, lng: -1.89 }, 10, 'map');
    expect(calls).toContainEqual(['road_reports_near', { p_lat: 52.48, p_lng: -1.89, p_radius_mi: 10, p_context: 'map' }]);
    expect(got.map((r) => r.kind)).toEqual(['crash', 'closure']);
  });

  it('asks for the driving view with the driving context (police included)', async () => {
    const { client, calls } = mockClient({ road_reports_near: [ROW, POLICE], road_closures_near: [] });
    const got = await createRemoteRoads(client as never, () => NOW).near({ lat: 52.48, lng: -1.89 }, 15, 'driving');
    expect(calls[0][1].p_context).toBe('driving');
    expect(got.map((r) => r.kind)).toEqual(['crash', 'police']);
  });

  it('still shows reports when the closures call fails', async () => {
    const { client } = mockClient({ road_reports_near: [ROW], road_closures_near: new Error('boom') });
    expect(await createRemoteRoads(client as never, () => NOW).near({ lat: 52.48, lng: -1.89 }, 10, 'map')).toHaveLength(1);
  });

  it('reports with where you are, and answers with the server\'s sentence on refusal', async () => {
    const { client, calls } = mockClient({ report_road: { id: ROW.id, merged: false }, vote_road_report: new Error('You can\'t confirm your own report.') });
    const roads = createRemoteRoads(client as never, () => NOW);
    expect(await roads.report('police', { lat: 52.49, lng: -1.89 }, 270, { lat: 52.4901, lng: -1.8901 })).toEqual({ id: ROW.id, merged: false, rep: 0 });
    expect(calls[0]).toEqual(['report_road', { p_kind: 'police', p_lat: 52.49, p_lng: -1.89, p_heading: 270, p_from_lat: 52.4901, p_from_lng: -1.8901 }]);
    await expect(roads.answer(ROW.id, 'still_there', { lat: 52.49, lng: -1.89 })).rejects.toThrow("You can't confirm your own report.");
    expect(calls[1]).toEqual(['vote_road_report', { p_report_id: ROW.id, p_vote: 'still_there', p_lat: 52.49, p_lng: -1.89 }]);
  });

  it('says offline when the request never got there', async () => {
    const client = { rpc: jest.fn(() => Promise.reject(new TypeError('Network request failed'))) };
    await expect(createRemoteRoads(client as never).answer(ROW.id, 'gone', null)).rejects.toThrow(OFFLINE);
  });

  it('reads rep for real accounts only', async () => {
    const { client, calls } = mockClient({ road_rep_for: [{ user_id: UID, reports_confirmed: 2, reports_checked: 3, reported_rep: 20, checked_rep: 6, rep: 26 }] });
    const rep = await createRemoteRoads(client as never).rep([UID, 'demo-user', UID]);
    expect(calls[0]).toEqual(['road_rep_for', { p_user_ids: [UID] }]);
    expect(rep[UID]).toMatchObject({ reportsConfirmed: 2, reportedRep: 20, reportsChecked: 3, checkedRep: 6, postedRep: 0, navigationRep: 0 });
  });

  it('listens to road_reports on Realtime and unsubscribes', () => {
    const { client } = mockClient({});
    const stop = createRemoteRoads(client as never).watch(() => {});
    const ch = client.channel.mock.results[0].value;
    expect(ch.on).toHaveBeenCalledWith('postgres_changes', { event: '*', schema: 'public', table: 'road_reports' }, expect.any(Function));
    stop();
    expect(client.removeChannel).toHaveBeenCalledWith(ch);
  });
});
