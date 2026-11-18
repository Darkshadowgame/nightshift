import type { DirectionsApp } from './directions';
import { DEFAULT_LAYERS, savedLayers, type SavedLayers } from './mapLayers';
import { ALL_CATEGORIES, type ShopCategory } from './shopCategories';
import type { MapOrientation, NavIcon } from './driveView';
import type { SpeechRate } from './voices';
import type { SavedPlaces } from './whereTo';

/** App settings, kept on the phone. */
export interface Settings {
  /**
   * Demo: skip the GPS check at check-ins and photo spots, and simulate drives.
   * Off by default: the app uses your real location.
   */
  simulateGps: boolean;
  cruiseMode: boolean;
  hideHomeZone: boolean;
  pttStrangers: boolean;
  /** Local reminders at the reveal and 30 min before the start. */
  reminders: boolean;
  /**
   * Speed cameras on the map (fixed cameras and average-speed zones from
   * OpenStreetMap), under the map's "More" menu. Off by default; they only show once you zoom in to
   * driving distance (see CAMERA_MAX_SPAN in cameras.ts).
   */
  cameras: boolean;
  /** Map: which tracks to show by what runs there (Tracks ▾ menu). Never empty. */
  trackVehicles: ('car' | 'bike')[];
  /** Map: the Shops layer (OpenStreetMap listings and partners). Off by default. */
  shops: boolean;
  /** Map: which kinds of shop to show (Shops ▾ menu). Never empty. */
  shopCategories: ShopCategory[];
  /** Map: only partners on the Shops layer. */
  shopPartnersOnly: boolean;
  /** Map: show spectator venues (speedway, oval stock cars, closed-road races) on the Tracks layer. Off by default. */
  spectatorTracks?: boolean;
  /** Set once Shops and Speed cameras moved under "More" and went off by default (Nov 2026). */
  moreLayersOff?: boolean;
  /** Set once Tonight's map went to Events only by default (REVIEW-9, 18 Nov 2026). */
  eventsOnlyMap?: boolean;
  /** Where "Start navigation" goes. Nightshift's own driving view unless you chose "Always use" another app. */
  directionsApp: DirectionsApp;
  /** Driving view: spoken instructions. */
  navVoice: boolean;
  /** Driving view: the map turns with you ('heading', the default) or keeps north at the top. */
  navMap?: MapOrientation;
  /** Driving view: your icon on the map (an arrow by default). */
  navIcon?: NavIcon;
  /** Driving view: the installed voice picked in Settings (build 11 on). Unset: the best installed British voice. */
  navVoiceId?: string | null;
  /** Driving view: how fast the voice talks. Normal by default. */
  navVoiceRate?: SpeechRate;
  /** Driving view: speed camera and average-speed zone alerts on the route (OpenStreetMap data). */
  navCameraAlerts: boolean;
  /**
   * Map: the Road reports layer (drivers' reports and open-data closures, under the layers
   * button). Off by default. Never shows police reports: those are only in the driving view.
   */
  roadReports?: boolean;
  /** Map: Community posts that have a place (the Posts layer). Off by default. */
  postsLayer?: boolean;
  /**
   * Map: the layer bar's layers (Events, Photos, Drives, Tracks) and Meet spots, saved like
   * the others so they come back the same after a restart (mapLayers.ts). All on by default.
   */
  mapLayers: SavedLayers;
  /**
   * "Where to?": recent searches (at most 10) and Home and Work. Only on this phone: never
   * sent to the server (settings aren't) and never logged (whereTo.ts).
   */
  places?: SavedPlaces;
  /** The one-time "how the map works" hint has been dismissed. */
  mapHintSeen?: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  simulateGps: false, cruiseMode: false, hideHomeZone: true, pttStrangers: false, reminders: true, cameras: false, trackVehicles: ['car', 'bike'],
  shops: false, shopCategories: [...ALL_CATEGORIES], shopPartnersOnly: false, moreLayersOff: true, eventsOnlyMap: true,
  directionsApp: 'nightshift', navVoice: true, navCameraAlerts: true, mapLayers: { ...DEFAULT_LAYERS },
};

/**
 * Settings from a save. Saves from before real GPS was the default had
 * "simulate GPS" on by default: turn it off once (`upgraded` false), then
 * leave the person's own choice alone.
 */
export function upgradeSettings(saved: Partial<Settings> | undefined, upgraded: boolean): Settings {
  let next: Settings = { ...DEFAULT_SETTINGS, ...saved };
  // Kart circuits were taken out: Karts goes from the Tracks choice (never left empty).
  const kinds = (next.trackVehicles as string[]).filter((v): v is 'car' | 'bike' => v === 'car' || v === 'bike');
  next = { ...next, trackVehicles: kinds.length ? kinds : ['car', 'bike'] };
  // Shops and Speed cameras moved under "More" and start off: turned off once for older installs.
  if (!saved?.moreLayersOff) next = { ...next, cameras: false, shops: false, moreLayersOff: true };
  // The core layers were only in screen state before Nov 2026: fill any that a save doesn't have.
  next = { ...next, mapLayers: savedLayers(saved?.mapLayers) };
  // Tonight's map went to Events only (REVIEW-9): once, every other layer off; Events and your Posts layer stay as they were.
  if (!saved?.eventsOnlyMap) {
    next = { ...next, mapLayers: { ...DEFAULT_LAYERS, events: next.mapLayers.events }, shops: false, cameras: false, eventsOnlyMap: true };
  }
  return upgraded ? next : { ...next, simulateGps: false };
}
