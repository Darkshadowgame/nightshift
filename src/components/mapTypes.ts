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
}

/** Imperative handle: move the map without changing its props (e.g. the locate-me button). */
export interface NightMapHandle {
  animateTo: (centre: LatLng, span?: number) => void;
}

export interface NightMapProps {
  ref?: Ref<NightMapHandle>;
  pins: MapPin[];
  paths?: MapPath[];
  circles?: MapCircle[];
  centre: LatLng;
  /** Rough span shown, in degrees of latitude. */
  span?: number;
  onSelect?: (id: string) => void;
  onLongPress?: (at: LatLng) => void;
  showsUser?: boolean;
  /** Draggable "picker" pin used when choosing a place for a stop. */
  picked?: LatLng | null;
  /** Move the map when `centre` or `span` change (otherwise they only set where it opens). */
  follow?: boolean;
  /** Change this number to move the map back to `centre` and `span` (e.g. a "fit everything" button). */
  recentreKey?: number;
  /** A tap on the map itself, not on a pin. */
  onPressMap?: () => void;
  /** Called when the person pans or zooms, with the new centre. */
  onMoved?: (centre: LatLng) => void;
  /** Called when the person pans or zooms (and once at the start), with the centre and span. */
  onRegion?: (region: MapRegion) => void;
  /** Small credit line in the map's bottom corner, e.g. for OpenStreetMap data drawn on it. */
  credit?: string;
}
