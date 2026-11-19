import { useMemo } from 'react';
import { distanceOrigin, type DistanceOrigin } from './format';
import { useLastFix } from './location';
import { useStore } from './store';
import type { LatLng } from './types';

/**
 * The one place every distance is measured from (format.ts `distanceOrigin`), the same on Tonight,
 * the event page, Search and Me (Review 18): your GPS fix within 30 mi of home, else home; in the
 * demo, its own start point. `here`: a fix the screen just read (else the latest one any screen read).
 */
export function useDistanceOrigin(here?: LatLng | null): DistanceOrigin | null {
  const { users, me, backend } = useStore();
  const home = users.find((u) => u.id === me)?.home;
  const last = useLastFix();
  const fix = here ?? last;
  const demo = backend === 'local';
  return useMemo(() => distanceOrigin(fix, home, demo), [fix, home, demo]);
}
