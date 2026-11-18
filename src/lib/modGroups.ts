import { QUICK_MODS } from '../data/catalog';
import type { Mod } from './types';

/**
 * Counting mods (REVIEW-10 #4, owner rule): parts that are the same job count once. A Stage 1
 * tune and an ECU remap are one "engine tune"; an induction kit and a panel filter are one air
 * intake. Used by rep, invites' "minimum mods", "modified" and every mods count on screen.
 * Mirrored on the server in private.mod_unit() (migration 20261120090000_mod_groups); keep the
 * lists in step.
 */

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');

/** Quick-pick keys that count as one, by group. */
export const COUNT_GROUPS: { key: string; label: string; quick: string[] }[] = [
  { key: 'tune', label: 'Engine tune', quick: ['remap', 'flash', 'fuel-map', 'dyno-map', 'pops', 'antilag', 'derestrict'] },
  { key: 'intake', label: 'Air intake', quick: ['air-filter', 'induction', 'cai'] },
  { key: 'exhaust', label: 'Exhaust system', quick: ['cat-back', 'turbo-back', 'full-exhaust', 'slip-on', 'full-system', 'straight-through'] },
  { key: 'turbo', label: 'Turbo upgrade', quick: ['hybrid-turbo', 'big-turbo', 'turbo-kit'] },
  { key: 'lowering', label: 'Lowering', quick: ['coilovers', 'lowering-springs', 'air-ride'] },
  { key: 'wheels', label: 'Wheels', quick: ['wheels', 'forged-wheels'] },
];

const GROUP_OF_NAME = new Map<string, string>();
for (const g of COUNT_GROUPS) for (const k of g.quick) {
  const q = QUICK_MODS.find((m) => m.key === k);
  if (q) GROUP_OF_NAME.set(norm(q.name), g.key);
}

/** "Stage 1 tune", "Stage 2+ ECU remap", "Custom map" (tune.ts STAGE_MOD) and a typed "remap" / "ECU tune". */
const TUNE_WORDS = /^((stage ?(1|2|2\+|3|4)|custom)( ecu)? (tune|re-?map|map)|(ecu )?(re-?map|flash|tune))$/;

/** What a mod counts as: a group key ("g:tune") or its own name. */
export function modUnit(m: Pick<Mod, 'name'>): string {
  const n = norm(m.name);
  if (TUNE_WORDS.test(n)) return 'g:tune';
  const g = GROUP_OF_NAME.get(n);
  return g ? `g:${g}` : `n:${n}`;
}

/** The mods that count: the first of each group or name, in order. */
export function countedMods<T extends Pick<Mod, 'name'>>(mods: readonly T[]): T[] {
  const seen = new Set<string>();
  return mods.filter((m) => {
    const u = modUnit(m);
    if (seen.has(u)) return false;
    seen.add(u);
    return true;
  });
}

/** How many mods a build has, each group once ("Mods (2)" for Stage 1 + ECU remap + intake). */
export function modCount(mods: readonly Pick<Mod, 'name'>[]): number {
  return countedMods(mods).length;
}

/** The group's name when a mod shares it with another on the build ("Engine tune"), else null. */
export function sharedGroupLabel(m: Pick<Mod, 'name'>, mods: readonly Pick<Mod, 'name'>[]): string | null {
  const u = modUnit(m);
  if (!u.startsWith('g:') || mods.filter((x) => modUnit(x) === u).length < 2) return null;
  return COUNT_GROUPS.find((g) => `g:${g.key}` === u)?.label ?? null;
}
