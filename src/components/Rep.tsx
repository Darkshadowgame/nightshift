import { useMemo, useRef } from 'react';
import { allAwards } from '../lib/awards';
import { addTripFix, judgeTrip, NEW_TRIP, repToast, type NavTrip } from '../lib/navRep';
import { levelFor, repLedger, type LevelInfo, type RepLedger } from '../lib/rep';
import { useRoads } from '../lib/roadStore';
import { useCommunity } from '../lib/communityStore';
import { useStore } from '../lib/store';
import { useNow } from '../lib/clock';
import type { LatLng } from '../lib/types';
import { useToast } from './ds';

/** Everyone's rep, worked out from the store. */
export function useRepFor(): (userId: string) => { ledger: RepLedger; level: LevelInfo } {
  const { events, spots, builds, votes, crews, placeRep } = useStore();
  const { rep: roadRep } = useRoads();
  const { forumRep } = useCommunity();
  const now = useNow();
  return useMemo(() => {
    const awards = allAwards(votes, events, builds, now);
    const cache = new Map<string, { ledger: RepLedger; level: LevelInfo }>();
    return (userId: string) => {
      let hit = cache.get(userId);
      if (!hit) {
        const ledger = repLedger(userId, { events, spots, builds, awards, now, crews, roadRep: roadRep[userId], placeRep: placeRep?.[userId], forumRep: forumRep[userId] });
        hit = { ledger, level: levelFor(ledger.total) };
        cache.set(userId, hit);
      }
      return hit;
    };
  }, [events, spots, builds, votes, now, crews, roadRep, placeRep, forumRep]);
}

export function useRep(userId: string) {
  return useRepFor()(userId);
}

/**
 * The driving view's rep moments (owner decision, 19 Nov 2026): the trip is followed while
 * navigating (in memory only), and a small toast says what it paid: "+5 rep · Drive complete" on
 * arrival, "+2 rep · Thanks for the report". A moment like check-in (Redesign 2, 4.12 exception).
 * Nothing is said when nothing was paid (too short, over the daily cap, or not counting).
 */
export function useDriveRep() {
  const roads = useRoads();
  const roadsRef = useRef(roads);
  roadsRef.current = roads;
  const toast = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;
  const trip = useRef<NavTrip>(NEW_TRIP);
  const done = useRef(false);
  return useMemo(
    () => ({
      /** A fix while navigating (after Start). */
      fix(at: LatLng, t: number, accuracy: number | null) {
        if (!done.current) trip.current = addTripFix(trip.current, at, t, accuracy);
      },
      /** Reached the destination or the last stop: once per drive. */
      arrived() {
        if (done.current) return;
        done.current = true;
        const verdict = judgeTrip(trip.current);
        if (!verdict.ok) return;
        roadsRef.current
          .navigated(verdict.trip)
          .then((res) => {
            const message = repToast(res.rep, 'navigation');
            if (message) toastRef.current({ message });
          })
          .catch(() => undefined);
      },
      /** A report went: what it paid. */
      reported(rep: number) {
        const message = repToast(rep, 'report');
        if (message) toastRef.current({ message });
      },
    }),
    [],
  );
}
