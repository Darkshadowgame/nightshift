import { pinLayer } from './hud';

/**
 * How a map pin is built from native markers (iPhone map).
 *
 * A live pin used to be ONE marker with the pulse drawn inside it and `tracksViewChanges` on, so
 * Apple Maps re-drew the marker's view every frame under a 2.2x box, and presses on it were lost.
 * Now the pin is always a plain static marker (the thing that is tapped), and a live pin gets a
 * second marker that only draws the pulse, behind every pin. `tappable` is Google-only (Apple
 * Maps ignores it), so the pulse marker also sits below all pins and forwards a press to the
 * same pin if one ever lands on it.
 */
export interface MarkerPlan {
  role: 'pin' | 'pulse';
  tracksViewChanges: boolean;
  tappable: boolean;
  zIndex: number;
}

/** Below every pin layer (cameras and shops are 0). */
export const PULSE_Z = -1;

export function markerPlan(pin: { glyph: string; live?: boolean }): MarkerPlan[] {
  const pinMarker: MarkerPlan = { role: 'pin', tracksViewChanges: false, tappable: true, zIndex: pinLayer(pin) };
  return pin.live ? [{ role: 'pulse', tracksViewChanges: true, tappable: false, zIndex: PULSE_Z }, pinMarker] : [pinMarker];
}
