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
}

export interface MapCircle {
  id: string;
  centre: LatLng;
  radiusMiles: number;
  colour: string;
}

export interface NightMapProps {
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
}
