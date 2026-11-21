import type { Ref } from 'react';
import type { LatLng } from '../lib/types';
import type { Glyph } from './Pin';

export interface MapPin {
  id: string;
  at: LatLng;
  glyph: Glyph;
  colour: string;
  title: string;
  size?: number;
  /** Pulses: the event is on now. */
  live?: boolean;
  /** A group of places (zoomed out): drawn with a count badge. */
  count?: number;
  /** A short label badge, e.g. "P" for partners. */
  badge?: string;
  /** A place you've done: drawn quieter with a tick. Its title already says "done" for screen readers. */
  done?: boolean;
  /** Drawn faint: the Time check says this meet isn't on at the chosen time (never the only signal: the sheet says how many are). */
  faded?: boolean;
}

/** A filled outline, e.g. a borough-wide ban zone. */
export interface MapPolygon {
  id: string;
  coords: LatLng[];
  colour: string;
}

export interface MapPath {
  id: string;
  coords: LatLng[];
  colour: string;
  dashed?: boolean;
  /** Line width in points (default 4). */
  width?: number;
}

/** Where the map is looking: its centre and span (degrees of latitude shown). */
export interface MapRegion {
  centre: LatLng;
  span: number;
}

export interface MapCircle {
  id: string;
  centre: LatLng;
  radiusMiles: number;
  colour: string;
  /** A soft glow (busy meets): a quiet fill with no outline. */
  glow?: boolean;
}

/** Imperative handle: move the map without changing its props (e.g. the locate-me button). */
export interface NightMapHandle {
  animateTo: (centre: LatLng, span?: number) => void;
  /** Where the map is looking right now (its centre is under a picker's crosshair). */
  region: () => MapRegion;
}

export interface NightMapProps {
  ref?: Ref<NightMapHandle>;
  /** Day (light) or night (dark, the default) map: Tonight's map follows the Auto / Day / Night choice. */
  appearance?: 'light' | 'dark';
  pins: MapPin[];
  paths?: MapPath[];
  circles?: MapCircle[];
  polygons?: MapPolygon[];
  centre: LatLng;
  /** Rough span shown, in degrees of latitude. */
  span?: number;
  onSelect?: (id: string) => void;
  onLongPress?: (at: LatLng) => void;
  showsUser?: boolean;
  /**
   * Where you are: both maps draw the "you" dot here (YouDot, testID you-marker).
   * Review 21 problem 5: Show where I am moved the map but drew nothing.
   */
  you?: LatLng | null;
  /** Draggable "picker" pin used when choosing a place for a stop. */
  picked?: LatLng | null;
  /** Move the map when `centre` or `span` change (otherwise they only set where it opens). */
  follow?: boolean;
  /** Change this number to move the map back to `centre` and `span` (e.g. a "fit everything" button). */
  recentreKey?: number;
  /** A tap on the map itself, not on a pin, with where it was tapped. */
  onPressMap?: (at: LatLng) => void;
  /** Called when the person pans or zooms, with the new centre. */
  onMoved?: (centre: LatLng) => void;
  /** Called when the person pans or zooms (and once at the start), with the centre and span. */
  onRegion?: (region: MapRegion) => void;
  /**
   * Show Apple Maps' compass when the map is rotated (tap it for north up),
   * moved this far from its usual top-right spot (iOS only).
   */
  compass?: { x: number; y: number };
  /**
   * Draw the map's own place labels and road shields (default true). Small map cards (the event
   * page, Host step 2, onboarding) pass false: a label or shield cut by a small card's edge shows
   * as a sliver (Review 21 problem 1). On web they get a label-free base map; on iPhone, Apple's
   * points of interest are off (Apple keeps its own labels inside the view).
   */
  labels?: boolean;
  /** Small credit line in the map's bottom corner, e.g. for OpenStreetMap data drawn on it. */
  credit?: string;
  /**
   * What covers the map's edges, in points (Tonight's sheet over its bottom). Every region the map
   * is asked to show (`centre` and `span`, `animateTo`) is fitted into the part left uncovered, so
   * pins are never framed under the sheet.
   */
  padding?: MapPadding;
}

export interface MapPadding {
  top?: number;
  bottom?: number;
}

/**
 * The whole-map region that puts `region` in the middle of the uncovered part of a map `height`
 * tall, with `region.span` filling that part's height. Pure: both maps use it.
 */
export function paddedRegion(region: MapRegion, height: number, padding?: MapPadding): MapRegion {
  const top = padding?.top ?? 0;
  const bottom = padding?.bottom ?? 0;
  const open = height - top - bottom;
  if (!(height > 0) || (!top && !bottom) || open < 40) return region;
  const span = (region.span * height) / open;
  // The uncovered part's middle is (top - bottom) / 2 below the map's middle: north is up.
  const lat = region.centre.lat + (((top - bottom) / 2) * span) / height;
  return { centre: { lat, lng: region.centre.lng }, span };
}

/**
 * Room kept round the route preview's fit (Review 19): the map buttons down the right (58 pt plus
 * their margin) and the credit chip, so the route and its destination never sit under either.
 */
export const OVERVIEW_PADDING = { top: 48, right: 84, bottom: 48, left: 40 } as const;

/** Half the "You" marker (50 pt), the biggest marker on the route preview: a fitted point needs this much more room. */
export const OVERVIEW_MARKER_HALF = 25;
/** The map buttons down the right of the driving view: 58 pt wide, 8 pt in from the edge. */
export const OVERVIEW_BUTTONS = 58 + 8;
