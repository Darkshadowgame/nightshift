/**
 * Tonight's map shows one thing at a time (owner, 21 Nov 2026: "separate things to do vs active
 * meets"): Meets (cruises and rolling meets too), or Things to do (drives, photo spots, tracks and the
 * optional place layers). One switch on the map, the sheet's count line and list follow it, and the
 * Layers sheet is split the same way. The choice is remembered (`settings.mapFocus`).
 *
 * Done marks (same decision): a drive or photo spot you have already done is drawn muted with a tick,
 * and its list row and page say "Done". The source is the place's own completions (place_progress /
 * `Spot.completions`), through `hasCompleted`.
 */

import type { Layer, LayerChange, LayerSettings } from './mapLayers';
import { savedLayers } from './mapLayers';
import { hasCompleted, isInfoOnly } from './spots';
import type { Spot, SpotKind } from './types';

export type MapFocus = 'meets' | 'places';

export const FOCUS_OPTIONS: { key: MapFocus; label: string }[] = [
  { key: 'meets', label: 'Meets' },
  { key: 'places', label: 'Things to do' },
];

/** Meets is the default; anything unknown falls back to it. */
export function mapFocus(saved: unknown): MapFocus {
  return saved === 'places' ? 'places' : 'meets';
}

/** The layers that belong to Things to do (the place layers). Events belong to Meets. */
export const PLACE_LAYER_KEYS: readonly Layer[] = ['drive', 'photo', 'track', 'posts', 'shops', 'cameras'];
/** The three that choose which places are listed. */
export const PLACE_KIND_LAYERS = ['drive', 'photo', 'track'] as const;

/**
 * The settings change made when someone first opens Things to do with none of its three place layers
 * on (the old layout started with them off): turn them on, so the view isn't empty. Anyone who already
 * chose layers in the combined layout keeps exactly those.
 */
export function openPlacesChange(settings: LayerSettings): LayerChange | null {
  const saved = savedLayers(settings.mapLayers);
  const any = PLACE_KIND_LAYERS.some((k) => saved[k]) || !!settings.postsLayer || !!settings.shops || !!settings.cameras;
  if (any) return null;
  return { mapLayers: { ...saved, drive: true, photo: true, track: true } };
}

/** Whether you've done a place: only drives and photo spots can be done (tracks and venues are information). */
export function placeDone(spot: Spot, me: string | null | undefined): boolean {
  return !!me && !isInfoOnly(spot.kind) && hasCompleted(spot, me);
}

/** The words a screen reader gets for a done place's title or row. */
export const DONE_WORD = 'Done';
export function withDone(title: string, done: boolean): string {
  return done ? `${title}, done` : title;
}

const KIND_COUNT: Partial<Record<SpotKind, { one: string; many: string }>> = {
  drive: { one: 'drive', many: 'drives' },
  photo: { one: 'photo spot', many: 'photo spots' },
  track: { one: 'track', many: 'tracks' },
};

/** "3 drives · 5 photo spots": what Things to do holds (the sheet's count line). */
export function placesCountLine(places: readonly Pick<Spot, 'kind'>[]): string {
  const parts: string[] = [];
  for (const kind of ['drive', 'photo', 'track'] as const) {
    const n = places.filter((s) => s.kind === kind).length;
    const name = KIND_COUNT[kind]!;
    if (n) parts.push(`${n} ${n === 1 ? name.one : name.many}`);
  }
  return parts.join(' · ');
}
