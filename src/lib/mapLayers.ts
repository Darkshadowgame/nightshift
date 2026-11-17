/**
 * The map's layers and its top chrome, as pure logic (REVIEW-5 B3, M7).
 *
 * Core layers sit on the layer bar; the rest live under the layers button.
 * Every choice is saved in Settings, the same way for all of them.
 * The layer bar never scrolls sideways: `mapChrome()` works out whether the
 * pills can carry their labels at this width and text size, or go icon-only
 * (the labels stay in the accessibility label and in the map key).
 */

export type CoreLayer = 'events' | 'photo' | 'drive' | 'track';
/** Layers kept under the layers button. `venue` is "Meet spots" in the UI. */
export type MoreLayer = 'venue' | 'shops' | 'cameras' | 'roads';
export type Layer = CoreLayer | MoreLayer;

export const CORE_LAYERS: readonly CoreLayer[] = ['events', 'photo', 'drive', 'track'];
export const MORE_LAYERS: readonly MoreLayer[] = ['venue', 'shops', 'cameras', 'roads'];

/** Saved on/off for the layers that start on: the core four and meet spots. */
export type SavedLayers = Record<CoreLayer | 'venue', boolean>;
export const DEFAULT_LAYERS: SavedLayers = { events: true, photo: true, drive: true, track: true, venue: true };

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
}

/** A settings change for one layer (merged into Settings by the store). */
export interface LayerChange {
  mapLayers?: SavedLayers;
  shops?: boolean;
  cameras?: boolean;
  roadReports?: boolean;
}

/** Whether a layer is on, from the saved settings. */
export function layerOn(settings: LayerSettings, key: Layer): boolean {
  if (key === 'shops') return !!settings.shops;
  if (key === 'cameras') return !!settings.cameras;
  if (key === 'roads') return !!settings.roadReports;
  return savedLayers(settings.mapLayers)[key];
}

/** The settings change that turns a layer on or off. */
export function setLayer(settings: LayerSettings, key: Layer, on: boolean): LayerChange {
  if (key === 'shops') return { shops: on };
  if (key === 'cameras') return { cameras: on };
  if (key === 'roads') return { roadReports: on };
  return { mapLayers: { ...savedLayers(settings.mapLayers), [key]: on } };
}

export function toggleLayer(settings: LayerSettings, key: Layer): LayerChange {
  return setLayer(settings, key, !layerOn(settings, key));
}

/** Rough widths (pt at 100% text) of the map chrome, from the fonts in theme.ts. */
const HUD_PADDING = 14;
const PILL_GAP = 6;
/** A condensed capital at 12 pt with its letter spacing. */
const CAP_WIDTH = 6.6;
/** Pill padding, icon and the gap to the label. */
const PILL_FIXED = 8 + 18 + 5 + 6;
/** The ▾ on a pill with options. */
const CARET = 18;
/** An icon-only pill. */
export const ICON_PILL = 8 + 18 + 8;

export interface ChromeLayout {
  /** Layer pills with labels, or icons only. */
  pills: 'labels' | 'icons';
  /** The Find button in the top row: icon and "Find", or the icon only. */
  find: 'label' | 'icon';
}

/**
 * How the map's top chrome fits this screen. `fontScale` is the iOS text size
 * (useWindowDimensions().fontScale); chrome text is capped at `cap` (FONT_SCALE.chrome).
 */
export function mapChrome(
  width: number,
  fontScale: number,
  opts: { labels: string[]; withMenu?: number; live?: boolean; cap?: number },
): ChromeLayout {
  const scale = Math.min(Math.max(fontScale || 1, 1), opts.cap ?? 1.3);
  const room = width - HUD_PADDING * 2;
  const pillsNeed =
    opts.labels.reduce((sum, l) => sum + PILL_FIXED + l.length * CAP_WIDTH * scale, 0) +
    (opts.withMenu ?? 0) * CARET +
    PILL_GAP * (opts.labels.length - 1);
  const pills = pillsNeed <= room ? 'labels' : 'icons';
  // Top row: the wordmark (~118), the live pill (~74), Find (~72 with its label, 44 without) and the bell (44).
  const brand = 118 * scale;
  const live = opts.live ? 74 * scale + 8 : 0;
  const findLabelled = 72 * scale;
  const find = brand + live + findLabelled + 8 + 44 + 8 <= room ? 'label' : 'icon';
  return { pills, find };
}

