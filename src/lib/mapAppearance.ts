import { useEffect, useState } from 'react';
import { appNow } from './appClock';
import { useStore } from './store';
import { mapAppearance, type MapAppearance } from './sun';
import type { LatLng } from './types';

/**
 * The maps' look on the iPhone (Apple, react-native-maps): Apple's muted style keeps the meet
 * pins and the route the brightest things on the map, with only the places a driver needs
 * (fuel, chargers, parking) as points of interest.
 */
export const MAP_TYPE = 'mutedStandard' as const;
export const MAP_POIS = ['gasStation', 'evCharger', 'parking'] as ('gasStation' | 'evCharger' | 'parking')[];

/**
 * Light or dark for the maps, from the Day / Night / Auto choice (Settings `mapStyle`). Auto
 * follows the sun where you are (or mid-England), on the app's clock, so the demo's Friday night
 * stays dark. Checked again every minute.
 */
export function useMapAppearance(at?: LatLng | null): MapAppearance {
  const { settings } = useStore();
  const choice = settings.mapStyle ?? 'auto';
  const lat = at ? Math.round(at.lat) : null;
  const lng = at ? Math.round(at.lng) : null;
  const work = () => mapAppearance(choice, appNow(), lat != null && lng != null ? { lat, lng } : null);
  const [look, setLook] = useState<MapAppearance>(work);
  useEffect(() => {
    setLook(work());
    if (choice !== 'auto') return;
    const t = setInterval(() => setLook(work()), 60_000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [choice, lat, lng]);
  return look;
}
