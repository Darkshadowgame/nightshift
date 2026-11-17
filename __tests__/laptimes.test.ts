import {
  canTimeAt,
  keepLap,
  formatLapTime,
  lapProblem,
  layoutsWithTimes,
  leaderboard,
  makeLap,
  MAIN_LAYOUT,
  parseLapTime,
  recordMs,
  type LapDraft,
  type LapTime,
} from '../src/lib/laptimes';
import type { Build, Spot } from '../src/lib/types';

const NOW = new Date('2026-11-17T12:00:00Z');
const spot = (over: Partial<Spot>): Spot => ({
  id: 'tr-snetterton', kind: 'track', name: 'Snetterton', at: { lat: 52.46, lng: 0.94 }, description: '', status: 'approved',
  createdAt: NOW.toISOString(), completions: [], ratings: [], ...over,
});
const TRACK = spot({});
const golf: Build = { id: 'b1', ownerId: 'me', kind: 'car', make: 'VW', model: 'Golf R', stockBhp: 316, weightKg: 1500, mods: [], photos: [] };
const r1: Build = { id: 'b2', ownerId: 'me', kind: 'bike', make: 'Yamaha', model: 'R1', stockBhp: 197, weightKg: 201, mods: [], photos: [] };
const theirs: Build = { ...golf, id: 'b3', ownerId: 'someone' };
const ctx = {
  track: TRACK,
  layouts: ['Snetterton 300', 'Snetterton 200'],
  vehicles: ['car', 'bike'] as ('car' | 'bike')[],
  builds: [golf, r1, theirs],
  me: 'me',
  now: NOW,
  fastestMs: 99_933,
};
const draft = (over: Partial<LapDraft> = {}): LapDraft => ({
  trackId: TRACK.id, layout: 'Snetterton 300', on: '2026-11-01', time: '2:18.402', kind: 'car', buildId: 'b1', proof: 'ph-proof.jpg', ...over,
});

describe('lap times', () => {
  test('parse and format', () => {
    expect(parseLapTime('1:23.456')).toBe(83_456);
    expect(parseLapTime(' 1:23.4 ')).toBe(83_400);
    expect(parseLapTime('1.23.456')).toBe(83_456);
    expect(parseLapTime('58.96')).toBe(58_960);
    expect(parseLapTime('34')).toBe(34_000);
    expect(parseLapTime('1:75.000')).toBeNull();
    expect(parseLapTime('fast')).toBeNull();
    expect(parseLapTime('')).toBeNull();
    expect(formatLapTime(83_456)).toBe('1:23.456');
    expect(formatLapTime(58_960)).toBe('58.960');
    expect(formatLapTime(61_005)).toBe('1:01.005');
    expect(recordMs('1:39.933')).toBe(99_933);
    expect(recordMs('0:58.596')).toBe(58_596);
    expect(recordMs('34.60')).toBe(34_600);
  });

  test('never at a drive, photo spot, venue, suggested place or spectator stadium', () => {
    for (const kind of ['drive', 'photo', 'venue'] as const) {
      const s = spot({ kind });
      expect(canTimeAt(s).ok).toBe(false);
      expect(lapProblem(draft(), { ...ctx, track: s })).toMatch(/never timed/);
    }
    expect(canTimeAt(spot({ authorId: 'someone' })).ok).toBe(false);
    expect(canTimeAt(undefined).ok).toBe(false);
    expect(canTimeAt(TRACK).ok).toBe(true);
  });

  test('fails closed: spectator and public-road venues, and tracks with no details, take no times', () => {
    // North West 200: racing on closed public roads, spectators only.
    expect(lapProblem(draft(), { ...ctx, track: spot({ id: 'sni-t-nw200' }) })).toMatch(/spectator venue/);
    expect(canTimeAt(spot({ id: 'ne-t-olivers-mount' })).ok).toBe(false);
    expect(canTimeAt(spot({ id: 'tr-no-such-track' })).ok).toBe(false);
    expect(canTimeAt(spot({ id: 'tr-bishopscourt' })).ok).toBe(true);
  });

  test('checks layout, date, time, vehicle type, build and proof', () => {
    expect(lapProblem(draft(), ctx)).toBeNull();
    expect(lapProblem(draft({ layout: 'Nürburgring' }), ctx)).toMatch(/layout/);
    expect(lapProblem(draft({ layout: MAIN_LAYOUT }), { ...ctx, layouts: [] })).toBeNull();
    expect(lapProblem(draft({ on: '2026-11-18' }), ctx)).toMatch(/hasn't happened/);
    expect(lapProblem(draft({ on: '2026-02-30' }), ctx)).toMatch(/YYYY-MM-DD/);
    expect(lapProblem(draft({ on: '2023-01-01' }), ctx)).toMatch(/two years/);
    expect(lapProblem(draft({ time: 'quick' }), ctx)).toMatch(/minutes:seconds/);
    expect(lapProblem(draft({ time: '5.2' }), ctx)).toMatch(/outside/);
    expect(lapProblem(draft({ time: '1:30.000' }), ctx)).toMatch(/outright record/);
    expect(lapProblem(draft({ buildId: 'b3' }), ctx)).toMatch(/from your garage/);
    expect(lapProblem(draft({ buildId: 'b2' }), ctx)).toMatch(/is a bike, not a car/);
    expect(lapProblem(draft({ kind: 'bike', buildId: 'b2' }), ctx)).toBeNull();
    expect(lapProblem(draft({ kind: 'bike', buildId: 'b2' }), { ...ctx, vehicles: ['car'] })).toMatch(/Bikes don't run here/);
    expect(lapProblem(draft({ proof: undefined }), ctx)).toMatch(/proof/);
  });

  test('kart times were dropped with the kart circuits', () => {
    expect(keepLap({ kind: 'car' })).toBe(true);
    expect(keepLap({ kind: 'bike' })).toBe(true);
    expect(keepLap({ kind: 'kart' })).toBe(false);
  });

  test('a saved time takes the build, its class and the day, and starts unverified', () => {
    const lap = makeLap(draft(), ctx, 'lap1');
    expect(lap).toMatchObject({ id: 'lap1', ms: 138_402, vehicle: 'VW Golf R', kind: 'car', cls: 'A', status: 'unverified', on: '2026-11-01' });
    expect(() => makeLap(draft({ proof: undefined }), ctx, 'x')).toThrow(/proof/);
  });
});

describe('leaderboard', () => {
  const lap = (over: Partial<LapTime>): LapTime => ({
    id: Math.random().toString(36), trackId: 'tr-snetterton', layout: 'Snetterton 300', on: '2026-11-01', ms: 140_000, userId: 'me',
    buildId: 'b1', vehicle: 'VW Golf R', kind: 'car', cls: 'A', proof: 'p.jpg', status: 'unverified', submittedAt: '2026-11-01T18:00:00Z', ...over,
  });
  const laps = [
    lap({ userId: 'a', ms: 141_000 }),
    lap({ userId: 'a', ms: 139_500 }), // a's best counts once
    lap({ userId: 'b', ms: 140_200 }),
    lap({ userId: 'c', ms: 130_000, status: 'rejected' }),
    lap({ userId: 'd', ms: 120_000, cls: 'S' }),
    lap({ userId: 'e', ms: 125_000, kind: 'bike', cls: 'S' }),
    lap({ userId: 'g', ms: 110_000, layout: 'Snetterton 200' }),
    lap({ userId: 'h', ms: 100_000, trackId: 'tr-brands-hatch' }),
  ];

  test('per track, layout, vehicle type and class, best per person, quickest first', () => {
    const groups = leaderboard(laps, 'tr-snetterton', 'Snetterton 300');
    expect(groups.map((g) => g.key)).toEqual(['car-S', 'car-A', 'bike-S']);
    const a = groups.find((g) => g.key === 'car-A')!;
    expect(a.entries.map((l) => [l.userId, l.ms])).toEqual([
      ['a', 139_500],
      ['b', 140_200],
    ]);
    expect(leaderboard(laps, 'tr-snetterton', 'Snetterton 200').map((g) => g.entries[0].userId)).toEqual(['g']);
  });

  test('filtered by vehicle type', () => {
    expect(leaderboard(laps, 'tr-snetterton', 'Snetterton 300', ['bike']).map((g) => g.key)).toEqual(['bike-S']);
    expect(leaderboard(laps, 'tr-snetterton', 'Snetterton 300', ['car']).map((g) => g.key)).toEqual(['car-S', 'car-A']);
  });

  test('layouts to pick from: published ones, then any with times', () => {
    expect(layoutsWithTimes(laps, 'tr-snetterton', ['Snetterton 300'])).toEqual(['Snetterton 300', 'Snetterton 200']);
    expect(layoutsWithTimes([], 'tr-x', [])).toEqual([MAIN_LAYOUT]);
  });
});
