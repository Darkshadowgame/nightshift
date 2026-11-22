import { useMemo } from 'react';
import { allVariants } from '../data/vehicles';
import { suggestedGroups } from './forumGroups';
import type { GarageGroup } from './forumHelp';
import { useStore } from './store';
import { findVariant } from './vehicles';

/** The make and model groups of the vehicles in your garage, model first (for "Fits your ..." and search ranking). */
export function useGarageGroups(): GarageGroup[] {
  const { builds, me } = useStore();
  return useMemo(() => {
    const list = allVariants();
    const variants = builds.filter((b) => b.ownerId === me).map((b) => findVariant(list, b.vehicleId)).filter((v): v is NonNullable<typeof v> => !!v);
    return suggestedGroups(list, variants).map((g) => ({ key: g.key, label: g.label }));
  }, [builds, me]);
}
