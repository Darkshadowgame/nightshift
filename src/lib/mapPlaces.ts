import { inBox, viewBox } from './cameras';
import { fitRegion, milesBetween } from './geo';
import { landmassOf } from './landmass';
import type { LatLng, Spot, SpotKind } from './types';

/**
 * Which bundled and suggested places the map draws for the view, so it never
 * draws hundreds of markers at once (each marker is a live view on iPhone):
 *
 * * Zoomed in: only places inside the view plus a margin, at most
 *   MAX_PER_KIND of each kind, nearest the centre first.
 * * Zoomed out (span above CLUSTER_SPAN): places of a kind that share a grid
 *   cell, the same piece of land (landmass.ts) and lie within
 *   maxClusterKm(span) of each other become one count pin ("14"), which zooms
 *   in to fit them when tapped. The pin sits on the group's medoid (the member
 *   nearest the members' centre), never the centre itself: the centre of pins
 *   in Norfolk and Kent is in the Thames estuary; the medoid is on land.
 * * Drive lines only when zoomed in (or for the drive you've selected).
 *
 * Pure: the screen passes the region; the result is the same for the same input.
 */

/** Above this span (degrees of latitude shown), places are grouped into count pins. */
export const CLUSTER_SPAN = 1.0;
/**
 * Above this span (about the size of Wales), groups mix every kind of place
 * into one count ("23 places"), so the whole UK reads as a few dozen regional
 * counts instead of four coloured pins per region.
 */
export const MIXED_SPAN = 2;
/** Grid cells across the view's height when grouping; cells are square-ish on the ground. */
export const CLUSTER_CELLS = 4;
/** At most this many pins of one kind when zoomed in. */
export const MAX_PER_KIND = 40;
/** Drive lines are drawn at or below this span. */
export const DRIVE_LINE_SPAN = 0.6;
/** Margin round the view, as a multiple of the span (pins don't pop in at the edges). */
const MARGIN = 1.5;

export interface PlaceCluster {
  /** Stable for the same cell and kind, e.g. "cl:drive:12_-3". */
  id: string;
  kind: SpotKind;
  at: LatLng;
  count: number;
  /** Mixed kinds (zoomed far out): `kind` is then the most common one. */
  mixed?: boolean;
  /** Where to zoom to when it's tapped: fits every member. */
  zoomCentre: LatLng;
  zoomSpan: number;
}

export interface PlacesView {
  places: Spot[];
  clusters: PlaceCluster[];
  /** Drives whose line to draw. */
  lines: Spot[];
}

/**
 * Snap a region to a coarse grid so tiny pans don't recompute the pins:
 * the centre to a quarter of the span, the span to steps of about 40%.
 */
export function regionKey(centre: LatLng, span: number): { centre: LatLng; span: number; key: string } {
  const level = Math.round(Math.log2(Math.max(0.002, span)) * 2) / 2;
  const s = 2 ** level;
  const step = s / 4;
  const c = { lat: Math.round(centre.lat / step) * step, lng: Math.round(centre.lng / step) * step };
  return { centre: c, span: s, key: `${c.lat.toFixed(4)},${c.lng.toFixed(4)},${level}` };
}

/**
 * The furthest a group's members may be from its pin, in km, at this span:
 * about a quarter of the view's height, between 5 and 120 km. Keeps groups
 * tight, so a group never bridges a big bay or estuary, and from right out
 * the UK reads as a few dozen regional counts.
 */
export function maxClusterKm(span: number): number {
  return Math.min(120, Math.max(5, (span * 111) / 4));
}

const KM_PER_MILE = 1.609344;
function km(a: LatLng, b: LatLng): number {
  return milesBetween(a, b) * KM_PER_MILE;
}

/** The member nearest the members' centre (longitude scaled for latitude). Ties go to the lower id, so it's stable. */
export function medoid<T extends { id: string; at: LatLng }>(list: readonly T[]): T {
  const lat = list.reduce((n, s) => n + s.at.lat, 0) / list.length;
  const lng = list.reduce((n, s) => n + s.at.lng, 0) / list.length;
  const k = Math.cos((lat * Math.PI) / 180);
  let best = list[0];
  let bestD = Infinity;
  for (const s of list) {
    const d = (s.at.lat - lat) ** 2 + ((s.at.lng - lng) * k) ** 2;
    if (d < bestD || (d === bestD && s.id < best.id)) {
      best = s;
      bestD = d;
    }
  }
  return best;
}

/**
 * Split one cell's places into tight groups: take the medoid of what's left,
 * everything within `maxKm` of it is a group, repeat. Each group is then
 * placed at its own medoid.
 */
function tightGroups<T extends { id: string; at: LatLng }>(list: readonly T[], maxKm: number): T[][] {
  const groups: T[][] = [];
  let rest = [...list].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  while (rest.length) {
    const m = medoid(rest);
    const near = rest.filter((s) => km(m.at, s.at) <= maxKm);
    groups.push(near);
    rest = rest.filter((s) => !near.includes(s));
  }
  return groups;
}

function cellSize(span: number): number {
  return span / CLUSTER_CELLS;
}

export function placesForView(all: readonly Spot[], centre: LatLng, span: number, selectedId?: string | null): PlacesView {
  const box = viewBox(centre, span * MARGIN);
  const inView = all.filter((s) => inBox(s.at, box) || s.id === selectedId);
  const lines = span <= DRIVE_LINE_SPAN
    ? inView.filter((s) => s.kind === 'drive' && s.path)
    : all.filter((s) => s.id === selectedId && s.path);

  if (span > CLUSTER_SPAN) {
    const size = cellSize(span);
    const maxKm = maxClusterKm(span);
    const mixed = span > MIXED_SPAN;
    const cells = new Map<string, Spot[]>();
    for (const s of inView) {
      if (s.id === selectedId) continue;
      // Kind, island and grid cell: Northern Ireland, the Isle of Wight and the other islands never share a group with the mainland.
      const key = `${mixed ? 'all' : s.kind}:${landmassOf(s.at)}:${Math.floor(s.at.lat / size)}_${Math.floor(s.at.lng / (size * 1.6))}`;
      const list = cells.get(key);
      if (list) list.push(s);
      else cells.set(key, [s]);
    }
    const places: Spot[] = inView.filter((s) => s.id === selectedId);
    const clusters: PlaceCluster[] = [];
    for (const [key, list] of cells) {
      for (const group of tightGroups(list, maxKm)) {
        if (group.length === 1) {
          places.push(group[0]);
          continue;
        }
        const at = medoid(group);
        const fit = fitRegion(group.map((s) => s.at))!;
        const kinds = new Map<SpotKind, number>();
        for (const s of group) kinds.set(s.kind, (kinds.get(s.kind) ?? 0) + 1);
        const kind = [...kinds.entries()].sort((a, b) => b[1] - a[1])[0][0];
        clusters.push({
          id: `cl:${key}:${at.id}`,
          kind,
          ...(mixed && kinds.size > 1 ? { mixed: true } : {}),
          at: at.at,
          count: group.length,
          zoomCentre: fit.centre,
          // Fit the group, but always zoom in at least a step, and far enough that it opens up.
          zoomSpan: Math.min(span / 2, Math.max(CLUSTER_SPAN * 0.9, fit.span)),
        });
      }
    }
    return { places, clusters, lines };
  }

  // Zoomed in: the nearest of each kind, capped.
  const byKind = new Map<SpotKind, Spot[]>();
  for (const s of inView) {
    const list = byKind.get(s.kind);
    if (list) list.push(s);
    else byKind.set(s.kind, [s]);
  }
  const places: Spot[] = [];
  for (const list of byKind.values()) {
    const kept = list.length <= MAX_PER_KIND
      ? list
      : [...list].sort((a, b) => milesBetween(centre, a.at) - milesBetween(centre, b.at)).slice(0, MAX_PER_KIND);
    places.push(...kept);
    const sel = list.find((s) => s.id === selectedId);
    if (sel && !kept.includes(sel)) places.push(sel);
  }
  return { places, clusters: [], lines };
}

/** "Show everything": the region to fit, from the nearest `limit` points to `from` (not the whole UK). */
export function nearestPoints(points: readonly LatLng[], from: LatLng, limit = 60): LatLng[] {
  if (points.length <= limit) return [...points];
  return [...points].sort((a, b) => milesBetween(from, a) - milesBetween(from, b)).slice(0, limit);
}
