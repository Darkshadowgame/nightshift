import type { DirectionsApp } from './directions';
import { DEFAULT_EVENT_FILTER, savedEventFilter, type EventFilter } from './eventFilter';
import { DEFAULT_LAYERS, savedLayers, type SavedLayers } from './mapLayers';
import { ALL_CATEGORIES, type ShopCategory } from './shopCategories';
import type { MapOrientation, NavIcon } from './driveView';
import type { MapStyleChoice } from './sun';
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
  /** Shops and Speed cameras came back as optional layers (18 Nov 2026): reset to off once (owner: shops off by default). */
  layersBackOff?: boolean;
  /** Where "Start navigation" goes. Slipstream's own driving view unless you chose "Always use" another app. */
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
  /**
   * Maps (Tonight and the driving view): light or dark. Auto (the default) goes by sunrise and
   * sunset where you are (sun.ts). Set in Tonight's Layers and the driving view's ··· menu.
   */
  mapStyle?: MapStyleChoice;
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
   * Photo spots: the Cars / Bikes filter (photoVehicles.ts), on the map's Layers and in Search. Not
   * set until the person picks: until then it follows the garage (only bikes → Bikes, else all).
   */
  photoVehicles?: ('car' | 'bike')[];
  /**
   * "Where to?": recent searches (at most 10) and Home and Work. Only on this phone: never
   * sent to the server (settings aren't) and never logged (whereTo.ts).
   */
  places?: SavedPlaces;
  /** The one-time "how the map works" hint has been dismissed. */
  mapHintSeen?: boolean;
  /**
   * Demo only (Settings › Demo › Busy night): a much fuller made-up scene on top of the demo night
   * (src/data/busyNight.ts). Off by default, so the normal demo stays as it is. Never sent anywhere.
   */
  busyNight?: boolean;
  /**
   * Tonight's map and list: which events show (Layers › Events, eventFilter.ts). Tonight only, and
   * only ones your garage can go to, by default.
   */
  eventFilter: EventFilter;
  /** Set once the event filters arrived (18 Nov 2026): When = Tonight and Only ones I can go to on, once. */
  eventFilterOnce?: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  simulateGps: false, cruiseMode: false, hideHomeZone: true, pttStrangers: false, reminders: true, cameras: false, trackVehicles: ['car', 'bike'],
  shops: false, shopCategories: [...ALL_CATEGORIES], shopPartnersOnly: false, moreLayersOff: true, eventsOnlyMap: true, layersBackOff: true,
  directionsApp: 'nightshift', navVoice: true, navCameraAlerts: true, mapLayers: { ...DEFAULT_LAYERS },
  eventFilter: { ...DEFAULT_EVENT_FILTER }, eventFilterOnce: true,
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
  // Shops and Speed cameras returned as optional layers: once, both off, whatever an older save said.
  if (!saved?.layersBackOff) next = { ...next, shops: false, cameras: false, layersBackOff: true };
  // Event filters (owner, 18 Nov 2026): once, Tonight and Only ones I can go to; after that, the saved choice.
  next = { ...next, eventFilter: saved?.eventFilterOnce ? savedEventFilter(saved.eventFilter) : { ...DEFAULT_EVENT_FILTER }, eventFilterOnce: true };
  return upgraded ? next : { ...next, simulateGps: false };
}
