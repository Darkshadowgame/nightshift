import { COMMON_BIKE_MAKES, COMMON_CAR_MAKES } from '../data/catalog';
import { fold } from './vehicles';

/**
 * The invite filter's brands (REVIEW-9 decision 5): every make in the app's vehicle data, with
 * search, common ones first. Pure, so it's tested.
 */

export type BrandKinds = readonly ('car' | 'bike')[];

/** The common makes for the vehicles picked (nothing picked: cars and bikes). */
export function commonMakes(kinds: BrandKinds): string[] {
  const cars = kinds.length === 0 || kinds.includes('car');
  const bikes = kinds.length === 0 || kinds.includes('bike');
  return Array.from(new Set([...(cars ? COMMON_CAR_MAKES : []), ...(bikes ? COMMON_BIKE_MAKES : [])]));
}

/**
 * The makes to offer: with no query, the common ones; with one, every make whose name contains it
 * (accents and case ignored), common ones first, then A to Z. Picked makes are left out (they show as on chips).
 */
export function brandOptions(all: { car: string[]; bike: string[] }, kinds: BrandKinds, query: string, selected: readonly string[], limit = 24): string[] {
  const picked = new Set(selected.map((b) => fold(b)));
  const common = commonMakes(kinds);
  const q = fold(query.trim());
  const pool = Array.from(
    new Set([
      ...(kinds.length === 0 || kinds.includes('car') ? all.car : []),
      ...(kinds.length === 0 || kinds.includes('bike') ? all.bike : []),
    ]),
  );
  const list = q
    ? [...pool.filter((m) => fold(m).includes(q))].sort((a, b) => {
        const ca = common.indexOf(a);
        const cb = common.indexOf(b);
        const starts = Number(!fold(a).startsWith(q)) - Number(!fold(b).startsWith(q));
        if (starts) return starts;
        if ((ca >= 0) !== (cb >= 0)) return ca >= 0 ? -1 : 1;
        return ca >= 0 ? ca - cb : a.localeCompare(b);
      })
    : common.filter((m) => pool.length === 0 || pool.includes(m));
  return list.filter((m) => !picked.has(fold(m))).slice(0, limit);
}
