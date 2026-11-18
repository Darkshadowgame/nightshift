/**
 * The map's layers, as pure logic (REVIEW-5 M7, MAP-REDESIGN.md).
 *
 * Every layer is a tile in the layers panel (the layers button on the map).
 * Only Events starts on (REVIEW-9 decision 13: Tonight is about tonight's meets);
 * the rest start off and stay in the panel. Shops and Speed cameras are optional
 * layers on Tonight, off by default (owner decision 18 Nov 2026; cameras only show
 * zoomed in). Road reports are for the drive view only. Every choice is saved in
 * Settings, the same way for all of them.
 */

import type { Glyph } from '../components/Pin';
import type { EventFilter } from './eventFilter';
import { LAYER, POST_COLOUR, ROAD_COLOUR, SHOP_COLOUR } from '../theme';
import { PLACE_NAMES } from './glossary';

export type CoreLayer = 'events' | 'photo' | 'drive' | 'track';
/** Layers kept under the layers button. `venue` is "Meet spots" in the UI. */
export type MoreLayer = 'venue' | 'shops' | 'cameras' | 'roads' | 'posts';
export type Layer = CoreLayer | MoreLayer;

export const CORE_LAYERS: readonly CoreLayer[] = ['events', 'photo', 'drive', 'track'];
export const MORE_LAYERS: readonly MoreLayer[] = ['venue', 'shops', 'cameras', 'roads', 'posts'];

/** Every layer, in the order the layers panel shows them. */
export const ALL_LAYERS: readonly Layer[] = [...CORE_LAYERS, ...MORE_LAYERS];

/** Layers that only belong in the drive view, never on Tonight's map (the drive view keeps its own camera alerts too). */
export const DRIVE_ONLY_LAYERS: readonly Layer[] = ['roads'];

/** The layers Tonight's map and its layers panel offer. */
export const TONIGHT_LAYERS: readonly Layer[] = ALL_LAYERS.filter((k) => !DRIVE_ONLY_LAYERS.includes(k));

/**
 * How each layer looks in the layers panel and the map key. A new layer (e.g.
 * Posts) goes in the types and lists above, here, and in layerOn / setLayer.
 */
export const LAYER_INFO: Record<Layer, { label: string; glyph: Glyph; colour: string; hint?: string }> = {
  events: { label: 'Events', glyph: 'meet', colour: LAYER.event, hint: 'Meets, cruises, shows and track days' },
  photo: { label: 'Photos', glyph: 'photo', colour: LAYER.photo, hint: 'Photo spots' },
  drive: { label: PLACE_NAMES.drive.many, glyph: 'drive', colour: LAYER.drive, hint: 'Great roads, never timed' },
  track: { label: PLACE_NAMES.track.many, glyph: 'track', colour: LAYER.track, hint: 'Circuits and track-day venues' },
  venue: { label: PLACE_NAMES.venue.many, glyph: 'venue', colour: LAYER.venue, hint: 'Cafés and museums that welcome meets' },
  shops: { label: 'Shops', glyph: 'shop', colour: SHOP_COLOUR, hint: 'From OpenStreetMap, and partners' },
  cameras: { label: 'Speed cameras', glyph: 'camera', colour: LAYER.camera, hint: 'Show when zoomed in' },
  roads: { label: 'Road reports', glyph: 'hazard', colour: ROAD_COLOUR, hint: 'Closures and drivers\' reports' },
  posts: { label: 'Posts', glyph: 'post', colour: POST_COLOUR, hint: 'Community posts with a place, last 30 days' },
};

/** Saved on/off for the core four and meet spots. Only Events starts on. */
export type SavedLayers = Record<CoreLayer | 'venue', boolean>;
export const DEFAULT_LAYERS: SavedLayers = { events: true, photo: false, drive: false, track: false, venue: false };

/** The saved layer choices with anything missing filled from the defaults (older saves had none). */
export function savedLayers(saved: Partial<SavedLayers> | undefined): SavedLayers {
  const out = { ...DEFAULT_LAYERS };
  for (const k of Object.keys(DEFAULT_LAYERS) as (keyof SavedLayers)[]) {
    if (typeof saved?.[k] === 'boolean') out[k] = saved[k] as boolean;
  }
  return out;
}

/** The settings that hold each layer's state. */
export interface LayerSettings {
  mapLayers?: Partial<SavedLayers>;
  shops?: boolean;
  cameras?: boolean;
  roadReports?: boolean;
  /** Community posts with a place (off by default). */
  postsLayer?: boolean;
  /** Which events show when the Events layer is on (eventFilter.ts). */
  eventFilter?: EventFilter;
}

/** A settings change for one layer (merged into Settings by the store). */
export interface LayerChange {
  mapLayers?: SavedLayers;
  shops?: boolean;
  cameras?: boolean;
  roadReports?: boolean;
  postsLayer?: boolean;
  eventFilter?: EventFilter;
}

/** Whether a layer is on, from the saved settings. */
export function layerOn(settings: LayerSettings, key: Layer): boolean {
  if (key === 'shops') return !!settings.shops;
  if (key === 'cameras') return !!settings.cameras;
  if (key === 'roads') return !!settings.roadReports;
  if (key === 'posts') return !!settings.postsLayer;
  return savedLayers(settings.mapLayers)[key];
}

/** The settings change that turns a layer on or off. */
export function setLayer(settings: LayerSettings, key: Layer, on: boolean): LayerChange {
  if (key === 'shops') return { shops: on };
  if (key === 'cameras') return { cameras: on };
  if (key === 'roads') return { roadReports: on };
  if (key === 'posts') return { postsLayer: on };
  return { mapLayers: { ...savedLayers(settings.mapLayers), [key]: on } };
}

export function toggleLayer(settings: LayerSettings, key: Layer): LayerChange {
  return setLayer(settings, key, !layerOn(settings, key));
}
