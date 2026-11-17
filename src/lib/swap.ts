import type { Build, EngineSwap, Mod } from './types';

/**
 * Engine swaps. The chassis (base vehicle) gives the name, year and weight; the
 * donor engine gives stock bhp and torque. The swap is also kept as an engine
 * mod, so it counts towards "modified" and survives a sync that only knows mods.
 */

export interface ChassisSpecs {
  stockBhp: number;
  weightKg: number;
  torqueLbFt?: number;
}

/** The build's specs with the swap applied: donor power and torque, chassis weight plus the change. */
export function swapSpecs(chassis: ChassisSpecs, swap: EngineSwap | undefined): ChassisSpecs {
  if (!swap) return chassis;
  const weightKg = Math.max(1, Math.round(chassis.weightKg + (swap.weightDeltaKg ?? 0)));
  return { stockBhp: swap.bhp, torqueLbFt: swap.torqueLbFt, weightKg };
}

/** The chassis weight behind a saved build (the saved weight already includes the swap's change). */
export function chassisWeight(build: Pick<Build, 'weightKg' | 'engineSwap'>): number {
  return Math.round(build.weightKg - (build.engineSwap?.weightDeltaKg ?? 0));
}

/** Short name for cards: "Bandit 1200 swap". */
export function swapLabel(swap: Pick<EngineSwap, 'donorModel'>): string {
  return `${swap.donorModel.trim()} swap`;
}

const SWAP_MOD = / engine swap$/i;

export function swapModName(swap: Pick<EngineSwap, 'donorMake' | 'donorModel'>): string {
  const make = swap.donorMake.trim();
  const model = swap.donorModel.trim();
  const name = model.toLowerCase().startsWith(make.toLowerCase()) || !make ? model : `${make} ${model}`;
  const suffix = ' engine swap';
  return `${name.slice(0, 60 - suffix.length).trim()}${suffix}`;
}

export function isSwapMod(m: Pick<Mod, 'name'>): boolean {
  return SWAP_MOD.test(m.name.trim());
}

/** Mods with the swap mod added, renamed or taken off. It goes first after any stage mod. */
export function withSwapMod(mods: Mod[], swap: EngineSwap | undefined, newId: () => string): Mod[] {
  const old = mods.find(isSwapMod);
  const rest = mods.filter((m) => !isSwapMod(m));
  if (!swap || !swap.donorModel.trim()) return rest;
  return [{ id: old?.id ?? newId(), category: 'engine', name: swapModName(swap) }, ...rest];
}

/**
 * What a card shows under the name, e.g. "Bandit 1200 swap". Falls back to the
 * swap mod for builds synced without the swap details.
 */
export function swapTag(build: Pick<Build, 'engineSwap' | 'mods'>): string | null {
  if (build.engineSwap?.donorModel.trim()) return swapLabel(build.engineSwap);
  const m = build.mods.find(isSwapMod);
  return m ? m.name.trim().replace(SWAP_MOD, ' swap') : null;
}

/** A swap is only saved once it has a donor name and power. */
export function swapProblem(swap: EngineSwap | undefined): string | null {
  if (!swap) return null;
  if (!swap.donorModel.trim()) return 'Pick or type the donor engine for the swap.';
  if (!(swap.bhp > 0)) return "Add the donor engine's standard bhp.";
  return null;
}

/**
 * A swap rebuilt from its mod, for builds that came back from a sync without
 * the swap details: the build's stock figures are already the donor's.
 */
export function swapFromMods(build: Pick<Build, 'mods' | 'stockBhp' | 'torqueLbFt'>): EngineSwap | undefined {
  const m = build.mods.find(isSwapMod);
  if (!m) return undefined;
  return { donorMake: '', donorModel: m.name.trim().replace(SWAP_MOD, ''), bhp: build.stockBhp, torqueLbFt: build.torqueLbFt };
}
