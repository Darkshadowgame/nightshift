import { useMemo } from 'react';
import { allAwards } from '../lib/awards';
import { levelFor, repLedger, type LevelInfo, type RepLedger } from '../lib/rep';
import { useRoads } from '../lib/roadStore';
import { useCommunity } from '../lib/communityStore';
import { useStore } from '../lib/store';
import { useNow } from '../lib/clock';

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
