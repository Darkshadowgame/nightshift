import { ALL_CATEGORIES, type ShopCategory } from './shopCategories';

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
   * OpenStreetMap). On by default; they only show once you zoom in to
   * driving distance (see CAMERA_MAX_SPAN in cameras.ts).
   */
  cameras: boolean;
  /** Map: which tracks to show by what runs there (Tracks ▾ menu). Never empty. */
  trackVehicles: ('car' | 'bike' | 'kart')[];
  /** Map: the Shops layer (OpenStreetMap listings and partners). Off by default. */
  shops: boolean;
  /** Map: which kinds of shop to show (Shops ▾ menu). Never empty. */
  shopCategories: ShopCategory[];
  /** Map: only partners on the Shops layer. */
  shopPartnersOnly: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  simulateGps: false, cruiseMode: false, hideHomeZone: true, pttStrangers: false, reminders: true, cameras: true, trackVehicles: ['car', 'bike', 'kart'],
  shops: false, shopCategories: [...ALL_CATEGORIES], shopPartnersOnly: false,
};

/**
 * Settings from a save. Saves from before real GPS was the default had
 * "simulate GPS" on by default: turn it off once (`upgraded` false), then
 * leave the person's own choice alone.
 */
export function upgradeSettings(saved: Partial<Settings> | undefined, upgraded: boolean): Settings {
  const next = { ...DEFAULT_SETTINGS, ...saved };
  return upgraded ? next : { ...next, simulateGps: false };
}
