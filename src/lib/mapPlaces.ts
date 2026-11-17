import { inBox, viewBox } from './cameras';
import { milesBetween } from './geo';
import type { LatLng, Spot, SpotKind } from './types';

/**
 * Which bundled and suggested places the map draws for the view, so it never
 * draws hundreds of markers at once (each marker is a live view on iPhone):
 *
 * * Zoomed in: only places inside the view plus a margin, at most
 *   MAX_PER_KIND of each kind, nearest the centre first.
 * * Zoomed out (span above CLUSTER_SPAN): places of a kind that share a grid
 *   cell become one count pin ("14"), which zooms in when tapped.
 * * Drive lines only when zoomed in (or for the drive you've selected).
 *
 * Pure: the screen passes the region; the result is the same for the same input.
 */

/** Above this span (degrees of latitude shown), places are grouped into count pins. */
export const CLUSTER_SPAN = 1.0;
/** Grid cells across the view's height when grouping; cells are square-ish on the ground. */
export const CLUSTER_CELLS = 5;
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
  /** The span to zoom to when it's tapped. */
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

/** Where each kind's count pin sits in its cell (fractions of the cell: up/down, left/right). */
const KIND_OFFSET: Record<SpotKind, [number, number]> = { drive: [0.2, -0.2], photo: [0.2, 0.2], track: [-0.2, -0.2], venue: [-0.2, 0.2] };

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
    const cells = new Map<string, Spot[]>();
    for (const s of inView) {
      if (s.id === selectedId) continue;
      const key = `${s.kind}:${Math.floor(s.at.lat / size)}_${Math.floor(s.at.lng / (size * 1.6))}`;
      const list = cells.get(key);
      if (list) list.push(s);
      else cells.set(key, [s]);
    }
    const places: Spot[] = inView.filter((s) => s.id === selectedId);
    const clusters: PlaceCluster[] = [];
    for (const [key, list] of cells) {
      if (list.length === 1) {
        places.push(list[0]);
        continue;
      }
      // At the cell's centre, nudged by kind, so a cell's drives, photo spots, tracks and venues sit side by side, not on top of each other.
      const [row, col] = key.slice(key.indexOf(':') + 1).split('_').map(Number);
      const [dy, dx] = KIND_OFFSET[list[0].kind];
      const at = { lat: (row + 0.5 + dy) * size, lng: (col + 0.5 + dx) * size * 1.6 };
      clusters.push({ id: `cl:${key}`, kind: list[0].kind, at, count: list.length, zoomSpan: Math.max(0.3, span / 3) });
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
