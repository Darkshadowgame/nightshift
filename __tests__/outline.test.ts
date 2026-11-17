import { buildEdges, isLayoutWay, matchLayout, pickOutline, stitch, type OsmWay } from '../src/lib/outline';
import { lineMetres } from '../src/lib/polyline';

/*
 * A made-up circuit, ~111 m per 0.001° of latitude:
 *
 *   1 ---- 2 ---- 3        GP loop: 1-2-3-4-5-6-1 (outer)
 *   |      |      |        National: 1-2-7-5-6-1 (uses the cut-through 2-7-5)
 *   6 ---- 5 ---- 4
 *   pit lane 1-6 (inside), ignored
 */
const P: Record<number, { lat: number; lng: number }> = {
  1: { lat: 52.002, lng: 0.0 },
  2: { lat: 52.002, lng: 0.004 },
  3: { lat: 52.002, lng: 0.008 },
  4: { lat: 51.998, lng: 0.008 },
  5: { lat: 51.998, lng: 0.004 },
  6: { lat: 51.998, lng: 0.0 },
  7: { lat: 52.0, lng: 0.004 },
};
const way = (id: number, nodes: number[], tags: Record<string, string> = { highway: 'raceway' }): OsmWay => ({
  id,
  nodes,
  geometry: nodes.map((n) => P[n]),
  tags,
});
const WAYS = [
  way(10, [1, 2]),
  way(11, [2, 3, 4]),
  way(12, [4, 5]),
  way(13, [5, 6, 1]),
  way(14, [2, 7, 5]),
  way(15, [1, 6], { highway: 'raceway', service: 'pit_lane' }),
];
const VENUE = { lat: 52.0, lng: 0.004 };

describe('circuit outline from OSM ways', () => {
  test('pit lanes and kart tracks are not layouts (kart tracks are at a kart venue)', () => {
    expect(isLayoutWay(WAYS[5])).toBe(false);
    expect(isLayoutWay(way(1, [1, 2], { highway: 'raceway', sport: 'karting' }))).toBe(false);
    expect(isLayoutWay(way(1, [1, 2], { highway: 'raceway', sport: 'karting' }), true)).toBe(true);
    expect(isLayoutWay(way(1, [1, 2], { leisure: 'track', area: 'yes' }))).toBe(false);
    expect(isLayoutWay(WAYS[0])).toBe(true);
  });

  test('ways are split at junctions', () => {
    const edges = buildEdges(WAYS.slice(0, 5));
    // 1-2, 2-3-4, 4-5, 5-6-1, 2-7-5 (7 is not a junction)
    expect(edges).toHaveLength(5);
    expect(edges.map((e) => [e.a, e.b])).toContainEqual([2, 5]);
  });

  test('picks the loop closest to the published main-layout length', () => {
    const gp = pickOutline(WAYS, VENUE, { targetMetres: 2400 })!;
    expect(gp.closed).toBe(true);
    expect(gp.ways.sort()).toEqual([10, 11, 12, 13]);
    expect(gp.metres).toBeGreaterThan(1900);
    const national = pickOutline(WAYS, VENUE, { targetMetres: 1400 })!;
    expect(national.ways.sort()).toEqual([10, 13, 14]);
    // The stitched line really is a loop: it starts and ends at the same point and every step is short.
    expect(national.path[0]).toEqual(national.path[national.path.length - 1]);
    for (let i = 1; i < national.path.length; i++) expect(lineMetres([national.path[i - 1], national.path[i]])).toBeLessThan(450);
  });

  test('without a published length, the longest loop', () => {
    expect(pickOutline(WAYS, VENUE)!.ways.sort()).toEqual([10, 11, 12, 13]);
  });

  test('a hill climb has no loop: the longest line, stitched end to end', () => {
    const hill: OsmWay[] = [
      { id: 1, nodes: [100, 101], geometry: [{ lat: 52.0, lng: 0 }, { lat: 52.003, lng: 0 }] },
      { id: 2, nodes: [102, 101], geometry: [{ lat: 52.006, lng: 0.001 }, { lat: 52.003, lng: 0 }] },
      { id: 3, nodes: [102, 103], geometry: [{ lat: 52.006, lng: 0.001 }, { lat: 52.009, lng: 0.003 }] },
    ];
    const o = pickOutline(hill, { lat: 52.004, lng: 0 })!;
    expect(o.closed).toBe(false);
    expect(o.path).toHaveLength(4);
    expect(o.path[0].lat === 52.0 || o.path[0].lat === 52.009).toBe(true);
    expect(o.metres).toBeGreaterThan(1000);
  });

  test('nothing near the venue', () => {
    expect(pickOutline(WAYS, { lat: 53, lng: 0 })).toBeNull();
    expect(pickOutline([], VENUE)).toBeNull();
  });

  test('stitch turns edges the right way round', () => {
    const edges = buildEdges([way(1, [1, 2]), way(2, [3, 2])]);
    expect(stitch(edges, [0, 1])).toEqual([P[1], P[2], P[3]]);
    expect(stitch(edges, [1, 0])).toEqual([P[3], P[2], P[1]]);
  });

  test('matching an outline to a published layout by length', () => {
    const layouts = [
      { name: 'Grand Prix', km: 3.916 },
      { name: 'Indy', km: 1.944 },
    ];
    expect(matchLayout(3850, layouts)?.name).toBe('Grand Prix');
    expect(matchLayout(1990, layouts)?.name).toBe('Indy');
    expect(matchLayout(2900, layouts)).toBeUndefined();
    expect(matchLayout(2000, [])).toBeUndefined();
  });
});
