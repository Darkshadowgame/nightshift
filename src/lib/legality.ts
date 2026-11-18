import { QUICK_MODS } from '../data/catalog';
import { modUnit } from './modGroups';
import type { Mod } from './types';

/**
 * Road legality of mods, and which mods earn rep.
 *
 * Removing a catalyst, de-restricting, pops-and-bangs and anti-lag maps and
 * straight-through exhausts with no cat are illegal on UK roads or fail the
 * MOT. People can still log them (they do own them), but they're labelled,
 * never added for you, and earn no rep.
 */

export const OFF_ROAD_TAG = 'Not road legal — track/off-road only';

/** At most this many mods earn rep on one build. */
export const MAX_REWARDED_MODS = 10;

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');

const OFF_ROAD_NAMES = new Set(QUICK_MODS.filter((m) => m.roadLegal === false).map((m) => norm(m.name)));

/** Typed-in names that mean the same thing ("decat pipe", "cat delete", "crackle map", "de-restricted"). */
const OFF_ROAD_WORDS =
  /\b(de-?cat(ted)?|cat[- ]?(delete|less|removal|removed|bypass)|no cat|straight[- ]?through|test pipe|pops?\s*(and|&|n|'n')\s*bangs?|crackle (map|tune)|burble (map|tune)|anti-?lag|de-?restrict(ed|ion|or)?|restrictor removed)\b/i;

export function isRoadIllegal(mod: Pick<Mod, 'name'>): boolean {
  return OFF_ROAD_NAMES.has(norm(mod.name)) || OFF_ROAD_WORDS.test(mod.name);
}

/** The mods on one build that earn rep: road legal, each kind once (a group counts once: modGroups.ts), at most MAX_REWARDED_MODS. */
export function rewardedMods<T extends Pick<Mod, 'name'>>(mods: readonly T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const m of mods) {
    if (isRoadIllegal(m)) continue;
    const t = modUnit(m);
    if (seen.has(t)) continue;
    seen.add(t);
    out.push(m);
    if (out.length >= MAX_REWARDED_MODS) break;
  }
  return out;
}
