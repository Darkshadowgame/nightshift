import { lineMetres, metresBetween } from './polyline';
import type { LatLng } from './types';

/**
 * Picking a circuit's outline from OpenStreetMap ways (highway=raceway, or
 * leisure=track for motorsport) near the venue. Circuits are drawn as many
 * ways that meet at junctions, one per stretch, with every layout sharing
 * some of them. The ways become a small graph; the outline is the loop round
 * it (a cycle) whose length is closest to the main layout's published length,
 * or the longest loop when that isn't known. Hill climbs and sprints have no
 * loop: they get the longest line instead.
 *
 * Pure, and used by scripts/fetch-circuits.mjs at build time.
 */

export interface OsmWay {
  id: number;
  nodes: number[];
  geometry: LatLng[];
  tags?: Record<string, string>;
}

export interface Outline {
  path: LatLng[];
  closed: boolean;
  metres: number;
  /** OSM way ids used, for the record. */
  ways: number[];
  /** How many different loops the venue's ways make. Many, with no published length to aim for, means a guess. */
  loops: number;
}

/**
 * Pit lanes, paddock roads, disused bits and (except at a kart venue) kart
 * tracks aren't part of a circuit layout. Corners named after them are
 * ("Paddock Hill", "National Pit Straight").
 */
export function isLayoutWay(w: OsmWay, karting = false): boolean {
  const t = w.tags ?? {};
  const name = (t.name ?? '').toLowerCase();
  if (/pit/.test(`${t.raceway ?? ''} ${t.service ?? ''}`.toLowerCase())) return false;
  if (/pit ?lane|pit road|pit (exit|entry)|(^|[^a-z])pit$|circuitpit|^paddock( road| area)?$|access road|service road/.test(name)) return false;
  if (t.disused === 'yes' || t.abandoned === 'yes' || t.area === 'yes') return false;
  if (!karting && /kart/.test(`${name} ${t.sport ?? ''}`)) return false;
  return w.geometry.length >= 2 && w.nodes.length === w.geometry.length;
}

/** Rallycross, motocross and other loose-surface stages: only used when a venue has nothing else. */
export function isLooseSurface(w: OsmWay): boolean {
  const t = w.tags ?? {};
  return /rallycross|motocross|off_road|autograss/.test(t.sport ?? '') || /dirt|unpaved|gravel|grass|ground/.test(t.surface ?? '');
}

interface Edge {
  a: number;
  b: number;
  coords: LatLng[];
  metres: number;
  way: number;
}

/** Split ways at shared nodes so each edge runs junction to junction. */
export function buildEdges(ways: OsmWay[]): Edge[] {
  const uses = new Map<number, number>();
  for (const w of ways) {
    w.nodes.forEach((n, i) => {
      const end = i === 0 || i === w.nodes.length - 1;
      uses.set(n, (uses.get(n) ?? 0) + (end ? 2 : 1));
    });
  }
  const edges: Edge[] = [];
  for (const w of ways) {
    let start = 0;
    for (let i = 1; i < w.nodes.length; i++) {
      const junction = i === w.nodes.length - 1 || (uses.get(w.nodes[i]) ?? 0) >= 2;
      if (!junction) continue;
      const coords = w.geometry.slice(start, i + 1);
      edges.push({ a: w.nodes[start], b: w.nodes[i], coords, metres: lineMetres(coords), way: w.id });
      start = i;
    }
  }
  return edges;
}

/**
 * Simple cycles (mode "cycles") or maximal simple paths (mode "paths"), by
 * bounded depth-first search. Circuit graphs are small: a few dozen edges.
 */
function search(edges: Edge[], budget: number, mode: 'cycles' | 'paths'): number[][] {
  const adj = new Map<number, number[]>();
  edges.forEach((e, i) => {
    adj.set(e.a, [...(adj.get(e.a) ?? []), i]);
    if (e.b !== e.a) adj.set(e.b, [...(adj.get(e.b) ?? []), i]);
  });
  const cycles: number[][] = [];
  const paths: number[][] = [];
  const seen = new Set<string>();
  let steps = 0;
  const vertices = [...adj.keys()].sort((x, y) => x - y);
  for (const start of vertices) {
    const used = new Set<number>();
    const visited = new Set<number>([start]);
    const stack: number[] = [];
    const walk = (v: number) => {
      if (++steps > budget) return;
      let extended = false;
      for (const ei of adj.get(v) ?? []) {
        if (used.has(ei)) continue;
        const e = edges[ei];
        const to = e.a === v ? e.b : e.a;
        if (mode === 'cycles' && to === start && (stack.length > 0 || e.a === e.b)) {
          const cycle = [...stack, ei];
          const key = [...cycle].sort((x, y) => x - y).join(',');
          if (!seen.has(key)) {
            seen.add(key);
            cycles.push(cycle);
          }
          continue;
        }
        // Only start cycles from their smallest vertex, so each is found once.
        if (visited.has(to) || (mode === 'cycles' && to < start)) continue;
        extended = true;
        used.add(ei);
        visited.add(to);
        stack.push(ei);
        walk(to);
        stack.pop();
        visited.delete(to);
        used.delete(ei);
      }
      if (mode === 'paths' && !extended && stack.length) paths.push([...stack]);
    };
    walk(start);
  }
  return mode === 'cycles' ? cycles : paths;
}

/** Join edges (in order) into one line, turning each the right way round. */
export function stitch(edges: Edge[], order: number[]): LatLng[] {
  if (order.length === 0) return [];
  const first = edges[order[0]];
  let out: LatLng[];
  if (order.length === 1) out = first.coords.slice();
  else {
    const second = edges[order[1]];
    const joinsAtB = first.b === second.a || first.b === second.b;
    out = joinsAtB ? first.coords.slice() : first.coords.slice().reverse();
  }
  let end = order.length === 1 ? first.b : (() => {
    const second = edges[order[1]];
    return first.b === second.a || first.b === second.b ? first.b : first.a;
  })();
  for (let k = 1; k < order.length; k++) {
    const e = edges[order[k]];
    const forward = e.a === end;
    const pts = forward ? e.coords : e.coords.slice().reverse();
    out.push(...pts.slice(1));
    end = forward ? e.b : e.a;
  }
  return out;
}

const pathLength = (edges: Edge[], order: number[]) => order.reduce((s, i) => s + edges[i].metres, 0);

/**
 * The outline for one venue. `targetMetres` is the main layout's published
 * length, when known. Ways further than `maxMetres` from the venue are ignored.
 */
export function pickOutline(
  ways: OsmWay[],
  venue: LatLng,
  opts: { targetMetres?: number; maxMetres?: number; budget?: number; karting?: boolean } = {},
): Outline | null {
  const maxMetres = opts.maxMetres ?? 2500;
  const usable = ways.filter((w) => isLayoutWay(w, opts.karting) && w.geometry.some((p) => metresBetween(p, venue) <= maxMetres));
  // Paved track first; loose-surface stages only where that's all there is.
  const paved = usable.filter((w) => !isLooseSurface(w));
  const near = paved.length ? paved : usable;
  if (near.length === 0) return null;
  const edges = buildEdges(near);
  const budget = opts.budget ?? 200_000;
  const cycles = search(edges, budget, 'cycles');
  const target = opts.targetMetres;
  const score = (m: number) => (target ? Math.abs(m - target) : -m);
  const loops = cycles.map((c) => ({ c, m: pathLength(edges, c) })).filter((x) => x.m >= 300);
  if (loops.length) {
    loops.sort((x, y) => score(x.m) - score(y.m) || y.m - x.m);
    const best = loops[0];
    const path = stitch(edges, best.c);
    return { path, closed: true, metres: Math.round(lineMetres(path)), ways: [...new Set(best.c.map((i) => edges[i].way))], loops: loops.length };
  }
  const lines = search(edges, budget, 'paths').map((p) => ({ p, m: pathLength(edges, p) })).filter((x) => x.m >= 200);
  if (!lines.length) return null;
  lines.sort((x, y) => y.m - x.m);
  const path = stitch(edges, lines[0].p);
  return { path, closed: false, metres: Math.round(lineMetres(path)), ways: [...new Set(lines[0].p.map((i) => edges[i].way))], loops: 0 };
}

/** The published layout whose length matches an outline (within 6%), if any. */
export function matchLayout<T extends { name: string; km: number }>(metres: number, layouts: T[]): T | undefined {
  let best: T | undefined;
  let bestDiff = Infinity;
  for (const l of layouts) {
    const diff = Math.abs(l.km * 1000 - metres) / (l.km * 1000);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = l;
    }
  }
  return bestDiff <= 0.06 ? best : undefined;
}
