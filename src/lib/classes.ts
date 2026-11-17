import type { Build, ClassLetter } from './types';

/** A build counts as modified with this many logged mods. */
export const MODIFIED_MIN_MODS = 3;

const CAR_REFERENCE_KG = 1450;

const CAR_THRESHOLDS: [ClassLetter, number][] = [
  ['S', 420],
  ['A', 290],
  ['B', 190],
  ['C', 125],
];

// 600 cc supersports (~610-660 bhp/t) sit in A with fast hot hatches; litre bikes are S.
const BIKE_THRESHOLDS: [ClassLetter, number][] = [
  ['S', 850],
  ['A', 580],
  ['B', 380],
  ['C', 200],
];

/** Power used for classing: dyno figure first, else stock plus claimed mod gains. */
export function effectivePower(build: Pick<Build, 'stockBhp' | 'dynoBhp' | 'mods'>): number {
  if (build.dynoBhp && build.dynoBhp > 0) return build.dynoBhp;
  const gains = build.mods.reduce((sum, m) => sum + (m.bhpGain && m.bhpGain > 0 ? m.bhpGain : 0), 0);
  return build.stockBhp + gains;
}

/**
 * The number the class letter comes from.
 * Cars: bhp scaled by sqrt(1450 kg / weight). Bikes: bhp per tonne.
 */
export function performanceFigure(build: Pick<Build, 'kind' | 'stockBhp' | 'dynoBhp' | 'mods' | 'weightKg'>): number {
  const bhp = effectivePower(build);
  const kg = build.weightKg > 0 ? build.weightKg : build.kind === 'bike' ? 200 : CAR_REFERENCE_KG;
  if (build.kind === 'bike') return (bhp / kg) * 1000;
  return bhp * Math.sqrt(CAR_REFERENCE_KG / kg);
}

export function classOf(build: Pick<Build, 'kind' | 'stockBhp' | 'dynoBhp' | 'mods' | 'weightKg'>): ClassLetter {
  const figure = performanceFigure(build);
  const table = build.kind === 'bike' ? BIKE_THRESHOLDS : CAR_THRESHOLDS;
  for (const [letter, min] of table) if (figure >= min) return letter;
  return 'D';
}

export function isModified(build: Pick<Build, 'mods'>): boolean {
  return build.mods.length >= MODIFIED_MIN_MODS;
}

/** 0–1 position inside the whole scale, for game-style stat bars. */
export function powerBar(build: Pick<Build, 'kind' | 'stockBhp' | 'dynoBhp' | 'mods' | 'weightKg'>): number {
  const figure = performanceFigure(build);
  const top = build.kind === 'bike' ? 1100 : 600;
  return Math.max(0.04, Math.min(1, figure / top));
}

export const CLASS_COLOURS: Record<ClassLetter, string> = {
  S: '#ff4d4d',
  A: '#ff9a2e',
  B: '#ffd166',
  C: '#3fd6ff',
  D: '#9dfa5a',
};

/** S is the top class (4), D the bottom (0). */
export function classRank(letter: ClassLetter): number {
  return ['D', 'C', 'B', 'A', 'S'].indexOf(letter);
}

/** The class change worth celebrating after an edit, or null if it didn't go up. */
export function classUp(before: ClassLetter | null, after: ClassLetter): { from: ClassLetter; to: ClassLetter } | null {
  if (!before || classRank(after) <= classRank(before)) return null;
  return { from: before, to: after };
}

/** Plain bhp per tonne (effective bhp over the stated weight), for the build readouts. */
export function bhpPerTonne(build: Pick<Build, 'stockBhp' | 'dynoBhp' | 'mods' | 'weightKg'>): number {
  if (!build.weightKg || build.weightKg <= 0) return 0;
  return Math.round((effectivePower(build) / build.weightKg) * 1000);
}
