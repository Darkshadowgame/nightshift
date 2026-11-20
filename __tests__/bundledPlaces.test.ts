/**
 * Slipstream's own drives and photo spots on the server (REVIEW-5 M4): the
 * seed SQL generated from src/data/places.ts, reading the rows back as
 * progress on the bundled places, the signed-in join, and rep from the
 * server's counts so it's the same on every phone.
 */
import { PLACES, ROAD_LIMIT_MPH } from '../src/data/places';
import { bundledSeedSql, lit, seedProblem, type SeedPlace } from '../src/lib/backend/bundledSeed';
import { placeRepFromRows, splitBundledRows, spotFromRow, type SpotRow } from '../src/lib/backend/mapping';
import { BUNDLED_IDS, bundledSpots, joinServerSpots } from '../src/lib/placeStore';
import { repLedger, REP } from '../src/lib/rep';
import type { Spot } from '../src/lib/types';

const ME = '11111111-1111-4111-8111-111111111111';

describe('the seed SQL', () => {
  const sql = bundledSeedSql(PLACES, ROAD_LIMIT_MPH);
  const drives = PLACES.filter((p) => p.kind === 'drive');
  const photos = PLACES.filter((p) => p.kind === 'photo');

  it('has every bundled drive and photo spot by its stable id, and no tracks or meet spots', () => {
    for (const p of [...drives, ...photos]) expect(sql).toContain(`(${lit(p.id)}, ${lit(p.kind)}, `);
    for (const p of PLACES.filter((x) => x.kind === 'track' || x.kind === 'venue')) expect(sql).not.toContain(lit(p.id));
    expect(sql).toContain(`${drives.length} drives and ${photos.length} photo spots`);
  });

  it('is an upsert on bundled_id, with no author', () => {
    expect(sql).toMatch(/on conflict \(bundled_id\) do update set/);
    expect(sql).toMatch(/author_id = null, status = 'approved'/);
  });

  it("carries drives' lines (lng lat) and the roads' own limits", () => {
    const snake = drives.find((p) => p.id === 'dr-snake-pass')!;
    expect(sql).toContain(`LINESTRING(${snake.path!.map((p) => `${p.lng} ${p.lat}`).join(', ')})`);
    const limited = Object.keys(ROAD_LIMIT_MPH)[0];
    expect(sql).toMatch(new RegExp(`\\('${limited}', 'drive', .*, ${ROAD_LIMIT_MPH[limited]}, `));
  });

  it("quotes text safely and refuses a list the database wouldn't take", () => {
    expect(lit("Devil's Elbow")).toBe("'Devil''s Elbow'");
    const p: SeedPlace = { id: 'ph-a', kind: 'photo', name: 'Somewhere', region: 'R', description: '', at: { lat: 53, lng: -1 } };
    expect(seedProblem([p, { ...p, id: 'ph-b' }])).toMatch(/Duplicate name/);
    expect(seedProblem([{ ...p, id: 'Bad Id' }])).toMatch(/Bad id/);
    expect(seedProblem([{ ...p, kind: 'drive' }])).toMatch(/without a line/);
    expect(seedProblem([{ ...p, name: 'x'.repeat(61) }])).toMatch(/3 to 60/);
    expect(() => bundledSeedSql([p, { ...p, id: 'ph-b' }])).toThrow(/Duplicate name/);
  });
});

describe('reading the rows back', () => {
  const base: Omit<SpotRow, 'id' | 'kind' | 'name'> = {
    description: '', lat: 53, lng: -1.9, path: null, miles: null, author_id: null, status: 'approved', created_at: 't', ban_zone: null,
    warnings: null, region: null,
  };

  it("a bundled row becomes progress on the bundled place; others (and ids this app doesn't know) stay places", () => {
    const rows: SpotRow[] = [
      { ...base, id: 'u1', kind: 'drive', name: 'Snake Pass (A57)', bundled_id: 'dr-snake-pass', limit_mph: 60 },
      { ...base, id: 'u2', kind: 'photo', name: 'New one', bundled_id: 'ph-from-a-later-update' },
      { ...base, id: 'u3', kind: 'photo', name: 'Suggested', author_id: 'someone' },
    ];
    const mapped = rows.map((row) => ({ row, spot: spotFromRow(row, { me: ME, stats: row.id === 'u1' ? { spot_id: 'u1', people: 2, rating_average: 3, rating_count: 1, completed_by_me: false } : undefined }) }));
    expect(mapped[0].spot.limitMph).toBe(60);
    const { own, ids, progress } = splitBundledRows(mapped, BUNDLED_IDS);
    expect(own.map((s) => s.id)).toEqual(['u2', 'u3']);
    expect(ids).toEqual({ 'dr-snake-pass': 'u1' });
    expect(progress['dr-snake-pass'].completions).toHaveLength(2);
    expect(progress['dr-snake-pass'].ratings).toEqual([{ userId: 'someone:u1:0', stars: 3 }]);
  });

  it('place_rep_for rows by user', () => {
    expect(placeRepFromRows([{ user_id: ME, drives: 2, drives_rep: 275, photo_spots: 1 }])).toEqual({ [ME]: { drives: 2, drivesRep: 275, photoSpots: 1 } });
  });
});

describe('signed in: the join', () => {
  const snake = bundledSpots().find((s) => s.id === 'dr-snake-pass')!;

  it("uses the server's progress, and only marks what this phone kept before", () => {
    const server = { 'dr-snake-pass': { completions: [{ userId: 'someone:u1:0', on: '' }], ratings: [] } };
    const phone = { 'dr-snake-pass': { completions: [{ userId: ME, on: '2026-11-01' }, { userId: ME, on: '2026-11-02' }], ratings: [{ userId: ME, stars: 5 }] } };
    const spots = joinServerSpots(bundledSpots(), server, phone, [], ME);
    const s = spots.find((x) => x.id === snake.id)!;
    expect(s.completions).toEqual(server['dr-snake-pass'].completions);
    expect(s.ratings).toEqual([]);
    expect(s.phoneOnly).toEqual({ completions: 2, stars: 5 });
  });

  it('no mark once the server has you there', () => {
    const server = { 'dr-snake-pass': { completions: [{ userId: ME, on: '2026-11-17' }], ratings: [] } };
    const phone = { 'dr-snake-pass': { completions: [{ userId: ME, on: '2026-11-01' }], ratings: [] } };
    const s = joinServerSpots(bundledSpots(), server, phone, [], ME).find((x) => x.id === snake.id)!;
    expect(s.phoneOnly).toBeUndefined();
  });

  it("the phone's old progress never counts in rep", () => {
    const phone = { 'dr-snake-pass': { completions: [{ userId: ME, on: '2026-11-01' }], ratings: [] } };
    const spots = joinServerSpots(bundledSpots(), {}, phone, [], ME);
    const ledger = repLedger(ME, { now: new Date(), events: [], spots, builds: [], awards: [] });
    expect(ledger.lines.find((l) => l.source === 'drives')).toMatchObject({ count: 0, rep: 0 });
  });
});

describe('rep from the server counts', () => {
  it('is the same for anyone, whatever this phone can see', () => {
    const spots: Spot[] = [];
    const ledger = repLedger('dan', { now: new Date(), events: [], spots, builds: [], awards: [], placeRep: { drives: 3, drivesRep: 425, photoSpots: 2 } });
    expect(ledger.lines.find((l) => l.source === 'drives')).toMatchObject({ count: 3, rep: 425 });
    expect(ledger.lines.find((l) => l.source === 'spots')).toMatchObject({ count: 2, rep: 2 * REP.photoSpot });
  });
});
