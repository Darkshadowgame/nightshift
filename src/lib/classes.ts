import { CLASS } from '../theme';
import { modCount } from './modGroups';
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

/** Typical drivetrain loss, for a crank estimate from a wheels run (dyno.ts uses the same). */
export const WHEEL_LOSS = { car: 0.15, bike: 0.1 } as const;
/** A build's power must match its sheet run within this to count (and for the badge). */
export const DYNO_MATCH = 0.02;

type PowerInput = Pick<Build, 'stockBhp' | 'dynoBhp' | 'mods'> & Partial<Pick<Build, 'kind' | 'dynoRuns'>>;

/** Claimed power: stock (or the donor engine's) plus the claimed mod gains. */
export function claimedPower(build: Pick<Build, 'stockBhp' | 'mods'>): number {
  const gains = build.mods.reduce((sum, m) => sum + (m.bhpGain && m.bhpGain > 0 ? m.bhpGain : 0), 0);
  return build.stockBhp + gains;
}

/**
 * The run that may feed Class (REVIEW-10 #3, owner rule): the newest run with a photo of its sheet
 * that staff haven't taken the badge off. A typed figure with no sheet never changes Class.
 */
export function sheetRun(build: Pick<Build, 'dynoRuns'>) {
  return [...(build.dynoRuns ?? [])]
    .map((r, i) => ({ r, i }))
    .sort((a, b) => b.r.date.localeCompare(a.r.date) || b.i - a.i)
    .map((x) => x.r)
    .find((r) => !!r.photo && !r.badgeRemoved);
}

/** The crank figure (bhp) a sheet run gives, or undefined: a wheels run plus typical loss. */
export function sheetCrank(build: PowerInput): number | undefined {
  const run = sheetRun(build);
  if (!run) return undefined;
  return run.at === 'crank' ? Math.round(run.powerBhp) : Math.round(run.powerBhp / (1 - WHEEL_LOSS[build.kind ?? 'car']));
}

/**
 * Power used for classing and every headline figure: the build's dyno figure only when a sheet
 * run backs it (within 2%), else the claimed power (stock plus claimed mod gains). Mirrored by
 * private.build_class() on the server.
 */
export function effectivePower(build: PowerInput): number {
  const crank = sheetCrank(build);
  if (build.dynoBhp && build.dynoBhp > 0 && crank && Math.abs(build.dynoBhp - crank) <= crank * DYNO_MATCH) return build.dynoBhp;
  return claimedPower(build);
}

/** True when the headline bhp is worked out from a wheels run ("est."). */
export function powerIsEstimate(build: PowerInput): boolean {
  return effectivePower(build) !== claimedPower(build) && sheetRun(build)?.at === 'wheels';
}

/**
 * The number the class letter comes from.
 * Cars: bhp scaled by sqrt(1450 kg / weight). Bikes: bhp per tonne.
 */
export function performanceFigure(build: PowerInput & Pick<Build, 'kind' | 'weightKg'>): number {
  const bhp = effectivePower(build);
  const kg = build.weightKg > 0 ? build.weightKg : build.kind === 'bike' ? 200 : CAR_REFERENCE_KG;
  if (build.kind === 'bike') return (bhp / kg) * 1000;
  return bhp * Math.sqrt(CAR_REFERENCE_KG / kg);
}

export function classOf(build: PowerInput & Pick<Build, 'kind' | 'weightKg'>): ClassLetter {
  const figure = performanceFigure(build);
  const table = build.kind === 'bike' ? BIKE_THRESHOLDS : CAR_THRESHOLDS;
  for (const [letter, min] of table) if (figure >= min) return letter;
  return 'D';
}

export function isModified(build: Pick<Build, 'mods'>): boolean {
  return modCount(build.mods) >= MODIFIED_MIN_MODS;
}

/** 0–1 position inside the whole scale, for game-style stat bars. */
export function powerBar(build: PowerInput & Pick<Build, 'kind' | 'weightKg'>): number {
  const figure = performanceFigure(build);
  const top = build.kind === 'bike' ? 1100 : 600;
  return Math.max(0.04, Math.min(1, figure / top));
}

/** Class letter colours: their own ladder in theme.ts, never a map layer or state colour. */
export const CLASS_COLOURS: Record<ClassLetter, string> = CLASS;

/** S is the top class (4), D the bottom (0). */
export function classRank(letter: ClassLetter): number {
  return ['D', 'C', 'B', 'A', 'S'].indexOf(letter);
}

/** The class change worth celebrating after an edit, or null if it didn't go up. */
export function classUp(before: ClassLetter | null, after: ClassLetter): { from: ClassLetter; to: ClassLetter } | null {
  if (!before || classRank(after) <= classRank(before)) return null;
  return { from: before, to: after };
}

/** bhp per tonne from the same headline bhp (effectivePower) over the stated weight. */
export function bhpPerTonne(build: PowerInput & Pick<Build, 'weightKg'>): number {
  if (!build.weightKg || build.weightKg <= 0) return 0;
  return Math.round((effectivePower(build) / build.weightKg) * 1000);
}
