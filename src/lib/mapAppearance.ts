import { useStore } from './store';
import type { MapAppearance } from './sun';
import { useThemeMode } from './theme';
import type { LatLng } from './types';

/**
 * The maps' look on the iPhone (Apple, react-native-maps): Apple's muted style keeps the meet
 * pins and the route the brightest things on the map, with only the places a driver needs
 * (fuel, chargers, parking) as points of interest.
 */
export const MAP_TYPE = 'mutedStandard' as const;
export const MAP_POIS = ['gasStation', 'evCharger', 'parking'] as ('gasStation' | 'evCharger' | 'parking')[];

/**
 * Light or dark for the maps, from the Auto / Day / Night choice (the map's own Layers setting).
 * Auto, the default, follows the app's look (Settings › Appearance), so the map, the chrome and the
 * pins are always one theme. Day and Night force the map alone.
 */
export function useMapAppearance(_at?: LatLng | null): MapAppearance {
  const { settings } = useStore();
  const mode = useThemeMode();
  const choice = settings.mapStyle ?? 'auto';
  return choice === 'day' ? 'light' : choice === 'night' ? 'dark' : mode;
}
