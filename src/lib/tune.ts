import { MOD_GROUPS, QUICK_MODS, type QuickMod } from '../data/catalog';
import { isElectric, type Aspiration, type StageFigures } from './vehicles';
import type { Mod, ModCategory, TuneStage, VehicleKind } from './types';

/**
 * Tune stages and quick-pick mods. The stage is saved on the build and also as
 * a "Stage N tune" engine mod carrying the estimated gain, so the class maths,
 * older saves and the backend (which only knows mods) all see it.
 */

export const TUNE_STAGES: TuneStage[] = ['stock', 'stage1', 'stage2', 'stage2plus', 'stage3', 'stage4', 'custom'];

export function stageLabel(stage: TuneStage): string {
  switch (stage) {
    case 'stock': return 'Stock';
    case 'stage1': return 'Stage 1';
    case 'stage2': return 'Stage 2';
    case 'stage2plus': return 'Stage 2+';
    case 'stage3': return 'Stage 3';
    case 'stage4': return 'Stage 4';
    default: return 'Custom';
  }
}

interface StageInfo {
  includes: string;
  /** Quick-mod keys the "add typical parts" button adds. Road-legal parts only. */
  parts: string[];
  /** Parts often fitted at this stage that aren't road legal: shown as optional, with the tag, never added for you. */
  offRoad?: string[];
}

const CAR_TURBO: Record<TuneStage, StageInfo> = {
  stock: { includes: 'As it left the factory.', parts: [] },
  stage1: { includes: 'ECU remap on the standard hardware. Often with a panel filter.', parts: ['remap', 'air-filter'] },
  stage2: { includes: 'Remap plus intake, a downpipe with a sports cat and an uprated intercooler.', parts: ['remap', 'induction', 'downpipe', 'intercooler'], offRoad: ['decat', 'pops'] },
  stage2plus: { includes: 'Stage 2 plus turbo inlet, boost pipes and fuelling (HPFP).', parts: ['remap', 'induction', 'downpipe', 'intercooler', 'turbo-inlet', 'boost-pipes', 'hpfp'] },
  stage3: { includes: 'Hybrid or bigger turbo with fuelling, full exhaust and a custom map.', parts: ['dyno-map', 'hybrid-turbo', 'turbo-back', 'intercooler', 'hpfp', 'injectors', 'clutch'], offRoad: ['decat', 'antilag'] },
  stage4: { includes: 'Big turbo, built engine (forged internals), full fuel system.', parts: ['dyno-map', 'big-turbo', 'forged', 'injectors', 'lpfp', 'hpfp', 'clutch'] },
  custom: { includes: 'Your own spec. Add the gain yourself.', parts: [] },
};

const CAR_DIESEL: Record<TuneStage, StageInfo> = {
  ...CAR_TURBO,
  stage1: { includes: 'ECU remap on the standard hardware.', parts: ['remap'] },
  stage2: { includes: 'Remap plus intake, a downpipe with a sports cat and an uprated intercooler.', parts: ['remap', 'induction', 'downpipe', 'intercooler'], offRoad: ['decat'] },
  stage2plus: { includes: 'Stage 2 plus a uprated clutch or flywheel to hold the torque.', parts: ['remap', 'induction', 'downpipe', 'intercooler', 'clutch'] },
  stage3: { includes: 'Hybrid turbo, bigger injectors and a custom map.', parts: ['dyno-map', 'hybrid-turbo', 'injectors', 'intercooler', 'clutch'] },
};

const CAR_NA: Record<TuneStage, StageInfo> = {
  stock: CAR_TURBO.stock,
  stage1: { includes: 'Remap with an induction kit. Small gains on a non-turbo engine.', parts: ['remap', 'induction'] },
  stage2: { includes: 'Intake, manifold and exhaust with a map to suit.', parts: ['remap', 'induction', 'manifold', 'full-exhaust'] },
  stage2plus: { includes: 'Stage 2 plus a big throttle body and a custom dyno map.', parts: ['dyno-map', 'induction', 'manifold', 'full-exhaust', 'throttle-body'] },
  stage3: { includes: 'Cams and head work, with a custom map.', parts: ['dyno-map', 'cams', 'induction', 'manifold', 'full-exhaust', 'throttle-body'] },
  stage4: { includes: 'Forced induction (turbo or supercharger kit) on a built engine.', parts: ['dyno-map', 'turbo-kit', 'forged', 'injectors', 'clutch'] },
  custom: CAR_TURBO.custom,
};

const BIKE: Record<TuneStage, StageInfo> = {
  stock: CAR_TURBO.stock,
  stage1: { includes: 'Slip-on or end can, air filter and an ECU flash or fuel map.', parts: ['slip-on', 'air-filter', 'flash'] },
  stage2: { includes: 'Full system exhaust (road-legal, with its cat), high-flow filter and a flash or dyno map.', parts: ['full-system', 'air-filter', 'flash'], offRoad: ['decat-bike', 'derestrict'] },
  stage2plus: { includes: 'Stage 2 plus intake or velocity stacks, quickshifter and auto-blipper set-up, race map.', parts: ['full-system', 'air-filter', 'dyno-map', 'stacks', 'quickshifter', 'autoblipper'] },
  stage3: { includes: 'Internal engine work: cams, head work, big bore.', parts: ['full-system', 'dyno-map', 'cams', 'big-bore'] },
  stage4: { includes: 'Race build or forced induction.', parts: ['full-system', 'dyno-map', 'turbo-kit', 'cams'] },
  custom: CAR_TURBO.custom,
};

/**
 * Fully electric cars: no engine to remap, so "stages" are the maker's own paid
 * power unlock (where one is sold) and then chassis work. No power gain is
 * assumed without a maker figure for the variant.
 */
const CAR_EV: Record<TuneStage, StageInfo> = {
  stock: CAR_TURBO.stock,
  stage1: { includes: 'The maker\'s own paid software upgrade or power unlock, where one is sold for this car. Otherwise no power change: an EV\'s power is set by its motor and battery software.', parts: [] },
  stage2: { includes: 'Handling, not power: performance tyres, coilovers or lowering springs and lighter wheels.', parts: ['tyres', 'coilovers', 'forged-wheels'] },
  stage2plus: { includes: 'Stage 2 plus anti-roll bars, poly bushes and uprated pads and discs.', parts: ['tyres', 'coilovers', 'forged-wheels', 'arb', 'bushes', 'pads-discs'] },
  stage3: { includes: 'Track set-up: semi-slicks, a big brake kit, adjustable arms and weight saving.', parts: ['semi-slicks', 'bbk', 'arms', 'buckets'] },
  stage4: { includes: 'Specialist motor, inverter or battery work. Rare: add your own figure.', parts: [] },
  custom: CAR_TURBO.custom,
};

const BIKE_EV: Record<TuneStage, StageInfo> = {
  stock: CAR_TURBO.stock,
  stage1: { includes: 'The maker\'s own paid software or ride-mode unlock, where one is sold for this bike. Otherwise no power change.', parts: [] },
  stage2: { includes: 'Handling, not power: tyres, fork springs or cartridges and a rear shock.', parts: ['tyres', 'fork-springs', 'rear-shock'] },
  stage2plus: { includes: 'Stage 2 plus brakes and a steering damper.', parts: ['tyres', 'fork-springs', 'rear-shock', 'pads-discs', 'braided', 'steering-damper'] },
  stage3: { includes: 'Gearing (sprockets), lighter wheels and race bodywork.', parts: ['sprockets', 'forged-wheels', 'fairings'] },
  stage4: { includes: 'Specialist controller or battery work. Rare: add your own figure.', parts: [] },
  custom: CAR_TURBO.custom,
};

function infoTable(kind: VehicleKind, asp: Aspiration | undefined): Record<TuneStage, StageInfo> {
  if (isElectric(asp)) return kind === 'bike' ? BIKE_EV : CAR_EV;
  if (kind === 'bike') return BIKE;
  if (asp === 'd') return CAR_DIESEL;
  if (asp === 'n' || asp === 'h') return CAR_NA;
  return CAR_TURBO;
}

export function stageIncludes(kind: VehicleKind, asp: Aspiration | undefined, stage: TuneStage): string {
  return infoTable(kind, asp)[stage].includes;
}

/** What "Add typical parts" adds: road-legal parts only, whatever the stage table says. */
export function typicalParts(kind: VehicleKind, asp: Aspiration | undefined, stage: TuneStage): QuickMod[] {
  const keys = infoTable(kind, asp)[stage].parts;
  return keys.flatMap((k) => QUICK_MODS.filter((m) => m.key === k && m.roadLegal !== false));
}

/** Parts often fitted at this stage that aren't road legal: offered as optional chips with the tag, never added for you. */
export function offRoadParts(kind: VehicleKind, asp: Aspiration | undefined, stage: TuneStage): QuickMod[] {
  const keys = infoTable(kind, asp)[stage].offRoad ?? [];
  return keys.flatMap((k) => QUICK_MODS.filter((m) => m.key === k && (m.for === kind || m.for === 'both')));
}

/**
 * Typical gain over stock for each stage, as a fraction. Conservative ends of
 * what UK tuners advertise: turbo petrol remaps make big gains, non-turbo
 * engines and bikes small ones. Hybrid and unknown engines get the cautious NA
 * figures. Fully electric vehicles get nothing without a maker figure.
 */
export const STAGE_GAINS: Record<'car-t' | 'car-d' | 'car-n' | 'car-s' | 'bike' | 'bike-s' | 'ev', Record<Exclude<TuneStage, 'stock' | 'custom'>, number>> = {
  'car-t': { stage1: 0.2, stage2: 0.3, stage2plus: 0.38, stage3: 0.55, stage4: 0.8 },
  'car-d': { stage1: 0.22, stage2: 0.3, stage2plus: 0.35, stage3: 0.45, stage4: 0.6 },
  'car-n': { stage1: 0.04, stage2: 0.08, stage2plus: 0.12, stage3: 0.22, stage4: 0.5 },
  'car-s': { stage1: 0.1, stage2: 0.18, stage2plus: 0.24, stage3: 0.35, stage4: 0.5 },
  bike: { stage1: 0.04, stage2: 0.08, stage2plus: 0.11, stage3: 0.18, stage4: 0.35 },
  'bike-s': { stage1: 0.06, stage2: 0.12, stage2plus: 0.16, stage3: 0.25, stage4: 0.4 },
  ev: { stage1: 0, stage2: 0, stage2plus: 0, stage3: 0, stage4: 0 },
};

function gainTable(kind: VehicleKind, asp: Aspiration | undefined) {
  if (isElectric(asp)) return STAGE_GAINS.ev;
  if (kind === 'bike') return STAGE_GAINS[asp === 's' || asp === 't' ? 'bike-s' : 'bike'];
  if (asp === 't') return STAGE_GAINS['car-t'];
  if (asp === 'd') return STAGE_GAINS['car-d'];
  if (asp === 's') return STAGE_GAINS['car-s'];
  return STAGE_GAINS['car-n'];
}

export interface StageEngine {
  kind: VehicleKind;
  /** Stock power of the engine being tuned (the donor's, after a swap). */
  bhp: number;
  /** Unknown (free-typed vehicle): treated like a turbo petrol for cars only if told so; defaults to cautious NA. */
  asp?: Aspiration;
  /** Tuner figures for this exact variant, when the dataset has them. */
  stages?: StageFigures;
}

export interface StageEstimate {
  /** Total bhp after the stage. */
  bhp: number;
  /** Gain over stock. */
  gain: number;
  /** "tuner" when it comes from a tuner's figure for this exact variant. */
  source: 'tuner' | 'typical';
}

const ORDER: Exclude<TuneStage, 'stock' | 'custom'>[] = ['stage1', 'stage2', 'stage2plus', 'stage3', 'stage4'];

/**
 * Typical power after a stage. Tuner figures for the variant win; otherwise a
 * percentage by engine type. Never lower than the stage below it. Stock and
 * custom return no estimate (custom is the user's own number). An EV with no
 * maker figure stays at stock power (+0): its stages are chassis work.
 */
export function stageEstimate(engine: StageEngine, stage: TuneStage): StageEstimate | null {
  if (stage === 'stock' || stage === 'custom' || !(engine.bhp > 0)) return null;
  const table = gainTable(engine.kind, engine.asp);
  let floor = engine.bhp;
  let result: StageEstimate | null = null;
  for (const st of ORDER) {
    const tuner = engine.stages?.[st];
    const typical = Math.round(engine.bhp * (1 + table[st]));
    const useTuner = !!tuner && tuner > engine.bhp;
    const bhp = Math.max(useTuner ? tuner! : typical, floor);
    result = { bhp, gain: bhp - engine.bhp, source: useTuner ? 'tuner' : 'typical' };
    floor = bhp;
    if (st === stage) return result;
  }
  return result;
}

// ---------------------------------------------------------------------------
// The stage as a mod
// ---------------------------------------------------------------------------

/** "Stage 1 tune" (the app's own), and what people type: "Stage 1 remap", "Stage 2 map", "Stage 2+ ECU remap" (REVIEW-7 bug 4). */
const STAGE_MOD = /^(stage ?(1|2|2\+|3|4)|custom)( ecu)? (tune|re-?map|map)$/i;

export function stageModName(stage: TuneStage): string | null {
  if (stage === 'stock') return null;
  return `${stageLabel(stage)} tune`;
}

export function isStageMod(m: Pick<Mod, 'name'>): boolean {
  return STAGE_MOD.test(m.name.trim());
}

/** The stage a list of mods says the build is at (for saves that only have the mod). */
export function stageFromMods(mods: Pick<Mod, 'name'>[]): TuneStage {
  const m = mods.find(isStageMod);
  if (!m) return 'stock';
  const name = m.name.trim().toLowerCase();
  if (name.startsWith('custom')) return 'custom';
  const n = /^stage ?(1|2\+|2|3|4)/.exec(name)?.[1];
  return n === '1' ? 'stage1' : n === '2' ? 'stage2' : n === '2+' ? 'stage2plus' : n === '3' ? 'stage3' : 'stage4';
}

/**
 * Mods with the stage set: the old stage mod goes, a new one (if not stock)
 * goes first with the gain. `gain` undefined keeps the old mod's gain when
 * staying on custom, so a typed figure isn't lost.
 */
export function withStage(mods: Mod[], stage: TuneStage, gain: number | undefined, newId: () => string): Mod[] {
  const old = mods.find(isStageMod);
  const rest = mods.filter((m) => !isStageMod(m));
  const name = stageModName(stage);
  if (!name) return rest;
  const keepGain = gain === undefined && stage === 'custom' && old && stageFromMods([old]) === 'custom' ? old.bhpGain : gain;
  const mod: Mod = { id: old?.id ?? newId(), category: 'engine', name, bhpGain: keepGain && keepGain > 0 ? Math.round(keepGain) : undefined };
  return [mod, ...rest];
}

// ---------------------------------------------------------------------------
// Quick-pick chips
// ---------------------------------------------------------------------------

/** Engine-group parts that still make sense without an engine. */
const EV_DRIVETRAIN = new Set(['lsd', 'sprockets']);
const EV_HIDDEN_GROUPS = new Set(['engine', 'intake', 'exhaust', 'turbo', 'fuel', 'cooling']);

/** Chips for this vehicle. Turbo-only parts need a forced-induction engine; an EV gets chassis parts only. */
export function quickModsFor(kind: VehicleKind, asp?: Aspiration): QuickMod[] {
  const forced = asp === 't' || asp === 'd' || asp === 's';
  return QUICK_MODS.filter((m) => {
    if (m.for !== 'both' && m.for !== kind) return false;
    if (isElectric(asp)) return !EV_HIDDEN_GROUPS.has(m.group) || EV_DRIVETRAIN.has(m.key);
    return !m.forced || forced || asp === undefined;
  });
}

export function groupCategory(m: QuickMod): ModCategory {
  return MOD_GROUPS.find((g) => g.key === m.group)?.category ?? 'other';
}

const POWER_GROUPS = new Set(['engine', 'intake', 'exhaust', 'turbo', 'fuel']);

/**
 * The bhp gain a chip starts with. With a tune stage set, power parts start at
 * zero because the stage estimate already counts them.
 */
export function suggestedGain(m: QuickMod, stockBhp: number, stage: TuneStage): number | undefined {
  if (!m.gain || !(stockBhp > 0)) return undefined;
  if (stage !== 'stock' && POWER_GROUPS.has(m.group)) return undefined;
  return Math.max(1, Math.round(stockBhp * m.gain));
}

function same(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

export function hasQuickMod(mods: Pick<Mod, 'name'>[], m: QuickMod): boolean {
  return mods.some((x) => same(x.name, m.name));
}

/** Tap a chip: add it (with its suggested gain) or take it off. */
export function toggleQuickMod(mods: Mod[], m: QuickMod, gain: number | undefined, newId: () => string): Mod[] {
  if (hasQuickMod(mods, m)) return mods.filter((x) => !same(x.name, m.name));
  return [...mods, { id: newId(), category: groupCategory(m), name: m.name, bhpGain: gain }];
}

/** "Add typical parts": every part the stage usually includes that isn't there yet, with no gain of its own. */
export function addTypicalParts(mods: Mod[], parts: QuickMod[], newId: () => string): Mod[] {
  const add = parts.filter((p) => !hasQuickMod(mods, p)).map((p) => ({ id: newId(), category: groupCategory(p), name: p.name }));
  return [...mods, ...add];
}

/**
 * The engine changed (new variant, donor, bhp or engine type): move the stage
 * mod's gain to the new estimate, but only if it still holds the old estimate,
 * so a gain the person typed in is kept.
 */
export function restage(mods: Mod[], stage: TuneStage, before: StageEngine | null, after: StageEngine | null): Mod[] {
  if (stage === 'stock' || stage === 'custom') return mods;
  const mod = mods.find(isStageMod);
  if (!mod) return mods;
  const old = before ? stageEstimate(before, stage)?.gain : undefined;
  const next = after ? stageEstimate(after, stage)?.gain : undefined;
  if ((mod.bhpGain ?? undefined) !== (old && old > 0 ? old : undefined)) return mods;
  return mods.map((m) => (m === mod ? { ...m, bhpGain: next && next > 0 ? next : undefined } : m));
}

const STAGE_ORDER: TuneStage[] = ['stock', 'stage1', 'stage2', 'stage2plus', 'stage3', 'stage4'];

/** Mod names that mean a tune, and the stage they usually go with. */
const STAGE_SIGNS: { stage: TuneStage; re: RegExp }[] = [
  { stage: 'stage3', re: /\b(hybrid|big)\s+turbo\b|\bforged\b|\banti-?lag\b/i },
  { stage: 'stage2', re: /\bde-?cat\b|\bcat delete\b|\bdownpipe\b|\bintercooler\b|\bpops\b|\bderestrict/i },
  { stage: 'stage1', re: /\bremap\b|\becu\b|\bflash\b|\b(dyno|custom|fuel) map\b/i },
];

/**
 * After adding mods that mean a tune (a remap, a decat, a hybrid turbo…) with the tune stage
 * still lower: the stage they usually go with, to suggest (REVIEW-9). Null when the stage
 * already covers them, or it's Custom.
 */
export function stageHint(mods: readonly Pick<Mod, 'name'>[], stage: TuneStage): TuneStage | null {
  if (stage === 'custom') return null;
  let best: TuneStage | null = null;
  for (const m of mods) {
    if (isStageMod(m)) continue;
    const hit = STAGE_SIGNS.find((s) => s.re.test(m.name));
    if (hit && (!best || STAGE_ORDER.indexOf(hit.stage) > STAGE_ORDER.indexOf(best))) best = hit.stage;
  }
  return best && STAGE_ORDER.indexOf(best) > STAGE_ORDER.indexOf(stage) ? best : null;
}
