import { useMemo } from 'react';
import { useNow } from './clock';
import { DEMO_EXTRAS, monthLine, passportLine, passportOf, recapOf, visitsOf, withDemoHistory, type Recap, type Stamp, type Visit } from './passport';
import { nearestRegion } from './profile';
import { useStore } from './store';

/**
 * The passport, the quiet streak and the recap for you, from the meets and places the phone knows
 * (src/lib/passport.ts). The demo adds a short made-up earlier season so none of it is empty.
 */
export function useVisits(): { visits: Visit[]; stamps: Stamp[]; passport: string; streak: string | null; recap: Recap } {
  const { events, spots, me, backend } = useStore();
  const now = useNow();
  return useMemo(() => {
    const real = visitsOf(events, me, nearestRegion);
    const visits = backend === 'local' ? withDemoHistory(real, now) : real;
    const year = String(now.getFullYear());
    let drives = backend === 'local' ? DEMO_EXTRAS.drives : 0;
    let photoSpots = backend === 'local' ? DEMO_EXTRAS.photoSpots : 0;
    for (const s of spots) {
      const n = s.completions.filter((c) => c.userId === me && c.on.startsWith(year)).length;
      if (s.kind === 'drive') drives += n;
      else if (s.kind === 'photo') photoSpots += n;
    }
    const stamps = passportOf(visits);
    return { visits, stamps, passport: passportLine(stamps), streak: monthLine(visits, now), recap: recapOf(visits, { drives, photoSpots }, now) };
  }, [events, spots, me, backend, now]);
}
