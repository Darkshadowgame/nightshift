import { QUICK_MODS } from '../src/data/catalog';
import { effectivePower } from '../src/lib/classes';
import {
  addTypicalParts,
  hasQuickMod,
  isStageMod,
  quickModsFor,
  restage,
  stageEstimate,
  stageFromMods,
  stageIncludes,
  stageModName,
  suggestedGain,
  toggleQuickMod,
  TUNE_STAGES,
  typicalParts,
  withStage,
} from '../src/lib/tune';
import type { Mod } from '../src/lib/types';

let n = 0;
const id = () => `m${++n}`;
const quick = (key: string) => QUICK_MODS.find((m) => m.key === key)!;

describe('stage estimates: cars', () => {
  const gti = { kind: 'car' as const, bhp: 217, asp: 't' as const };
  test('turbo petrol uses the typical percentages', () => {
    expect(stageEstimate(gti, 'stage1')).toEqual({ bhp: 260, gain: 43, source: 'typical' });
    expect(stageEstimate(gti, 'stage2')!.bhp).toBe(282);
    expect(stageEstimate(gti, 'stage4')!.bhp).toBe(391);
  });
  test('diesel and non-turbo engines gain less', () => {
    expect(stageEstimate({ kind: 'car', bhp: 181, asp: 'd' }, 'stage1')!.gain).toBe(40);
    expect(stageEstimate({ kind: 'car', bhp: 237, asp: 'n' }, 'stage1')!.gain).toBe(9);
    expect(stageEstimate({ kind: 'car', bhp: 237, asp: 'n' }, 'stage4')!.gain).toBe(119);
  });
  test('unknown engine type is treated cautiously (non-turbo)', () => {
    expect(stageEstimate({ kind: 'car', bhp: 200 }, 'stage1')!.gain).toBe(8);
  });
  test('tuner figures for the variant win, and stages never go down', () => {
    const r = { kind: 'car' as const, bhp: 306, asp: 't' as const, stages: { stage1: 380, stage2: 420 } };
    expect(stageEstimate(r, 'stage1')).toEqual({ bhp: 380, gain: 74, source: 'tuner' });
    expect(stageEstimate(r, 'stage2')).toEqual({ bhp: 420, gain: 114, source: 'tuner' });
    // 2+ typical (306 x 1.38 = 422) sits just above stage 2's tuner figure
    expect(stageEstimate(r, 'stage2plus')!.bhp).toBe(422);
    const low = { kind: 'car' as const, bhp: 200, asp: 't' as const, stages: { stage1: 300 } };
    expect(stageEstimate(low, 'stage2')!.bhp).toBe(300); // typical 260 would be lower than stage 1
  });
  test('a tuner figure below stock is ignored', () => {
    expect(stageEstimate({ kind: 'car', bhp: 300, asp: 't', stages: { stage1: 250 } }, 'stage1')!.source).toBe('typical');
  });
  test('stock, custom and no power give no estimate', () => {
    expect(stageEstimate(gti, 'stock')).toBeNull();
    expect(stageEstimate(gti, 'custom')).toBeNull();
    expect(stageEstimate({ kind: 'car', bhp: 0, asp: 't' }, 'stage1')).toBeNull();
  });
});

describe('stage estimates: bikes', () => {
  const r6 = { kind: 'bike' as const, bhp: 116, asp: 'n' as const };
  test('bike stages are small, bike-specific percentages', () => {
    expect(stageEstimate(r6, 'stage1')!.bhp).toBe(121);
    expect(stageEstimate(r6, 'stage2')!.bhp).toBe(125);
    expect(stageEstimate(r6, 'stage2plus')!.bhp).toBe(129);
    expect(stageEstimate(r6, 'stage3')!.bhp).toBe(137);
    expect(stageEstimate(r6, 'stage4')!.bhp).toBe(157);
  });
  test('a swapped Bandit 1200 engine is estimated from the donor, not the 750', () => {
    expect(stageEstimate({ kind: 'bike', bhp: 98, asp: 'n' }, 'stage2')!.bhp).toBe(106);
  });
  test('supercharged bikes (H2) gain a bit more', () => {
    expect(stageEstimate({ kind: 'bike', bhp: 200, asp: 's' }, 'stage1')!.gain).toBe(12);
  });
  test('per-model figures win for bikes too', () => {
    expect(stageEstimate({ kind: 'bike', bhp: 197, asp: 'n', stages: { stage2: 211 } }, 'stage2')).toEqual({ bhp: 211, gain: 14, source: 'tuner' });
  });
  test('bike stages describe bike parts', () => {
    expect(stageIncludes('bike', 'n', 'stage1')).toMatch(/slip-on/i);
    expect(stageIncludes('bike', 'n', 'stage2')).toMatch(/full system/i);
    expect(typicalParts('bike', 'n', 'stage2').every((p) => p.for !== 'car')).toBe(true);
    expect(typicalParts('bike', 'n', 'stage2plus').map((p) => p.key)).toContain('quickshifter');
  });
});

describe('stage estimates: electric', () => {
  const ev = { kind: 'car' as const, bhp: 402, asp: 'e' as const };
  test('no maker figure: no power gain at any stage', () => {
    for (const st of ['stage1', 'stage2', 'stage2plus', 'stage3', 'stage4'] as const) {
      expect(stageEstimate(ev, st)).toEqual({ bhp: 402, gain: 0, source: 'typical' });
    }
  });
  test('a maker software unlock is used, and later stages keep it', () => {
    const unlock = { ...ev, stages: { stage1: 469 } };
    expect(stageEstimate(unlock, 'stage1')).toEqual({ bhp: 469, gain: 67, source: 'tuner' });
    expect(stageEstimate(unlock, 'stage3')!.bhp).toBe(469);
  });
  test('EV stages are software unlock then chassis work, never engine parts', () => {
    const engineWords = /remap|intake|induction|exhaust|turbo|downpipe|intercooler|flash|slip-on|cams|injector/i;
    for (const kind of ['car', 'bike'] as const) {
      for (const st of TUNE_STAGES) {
        expect([kind, st, engineWords.test(stageIncludes(kind, 'e', st))]).toEqual([kind, st, false]);
        const powerParts = typicalParts(kind, 'e', st).filter((p) => ['engine', 'intake', 'exhaust', 'turbo', 'fuel', 'cooling'].includes(p.group) && p.key !== 'sprockets');
        expect(powerParts).toEqual([]);
        expect(typicalParts(kind, 'e', st).every((p) => p.for === 'both' || p.for === kind)).toBe(true);
      }
    }
    expect(stageIncludes('car', 'e', 'stage1')).toMatch(/software|unlock/i);
    expect(stageIncludes('car', 'e', 'stage2')).toMatch(/tyres/i);
    expect(typicalParts('car', 'e', 'stage2').map((p) => p.key)).toEqual(expect.arrayContaining(['tyres', 'coilovers']));
  });
  test('hybrids still have an engine to tune', () => {
    expect(stageIncludes('car', 'h', 'stage1')).toMatch(/remap/i);
    expect(stageEstimate({ kind: 'car', bhp: 242, asp: 'h' }, 'stage1')!.gain).toBeGreaterThan(0);
  });
});

describe('stage as a mod', () => {
  test('names round-trip', () => {
    for (const st of TUNE_STAGES) {
      const name = stageModName(st);
      if (st === 'stock') expect(name).toBeNull();
      else expect(stageFromMods([{ name: name! }])).toBe(st);
    }
    // A typed "Stage 2 remap" is the stage too, so the build page never says Stock next to it (REVIEW-7 bug 4).
    expect(stageFromMods([{ name: 'Stage 2 remap' }])).toBe('stage2');
    expect(isStageMod({ name: 'stage 2+ tune' })).toBe(true);
  });
  test('setting a stage replaces the old one, first in the list, with the gain', () => {
    const base: Mod[] = [{ id: 'x', category: 'wheels', name: 'Wheels' }];
    const s1 = withStage(base, 'stage1', 43, id);
    expect(s1[0]).toMatchObject({ category: 'engine', name: 'Stage 1 tune', bhpGain: 43 });
    const s2 = withStage(s1, 'stage2', 65, id);
    expect(s2).toHaveLength(2);
    expect(s2[0]).toMatchObject({ id: s1[0].id, name: 'Stage 2 tune', bhpGain: 65 });
    expect(withStage(s2, 'stock', undefined, id)).toEqual(base);
    expect(effectivePower({ stockBhp: 217, mods: s2 })).toBe(282);
  });
  test('custom keeps a typed gain', () => {
    const c = withStage([], 'custom', undefined, id);
    const typed = [{ ...c[0], bhpGain: 77 }];
    expect(withStage(typed, 'custom', undefined, id)[0].bhpGain).toBe(77);
  });
  test('restage follows the engine unless the gain was edited', () => {
    const before = { kind: 'car' as const, bhp: 217, asp: 't' as const };
    const after = { kind: 'car' as const, bhp: 306, asp: 't' as const };
    const mods = withStage([], 'stage1', 43, id);
    expect(restage(mods, 'stage1', before, after)[0].bhpGain).toBe(61);
    const edited = [{ ...mods[0], bhpGain: 50 }];
    expect(restage(edited, 'stage1', before, after)[0].bhpGain).toBe(50);
    expect(restage(mods, 'custom', before, after)).toBe(mods);
  });
});

describe('quick-pick mods', () => {
  test('vehicle-type aware', () => {
    const car = quickModsFor('car', 't').map((m) => m.key);
    const bike = quickModsFor('bike', 'n').map((m) => m.key);
    expect(car).toEqual(expect.arrayContaining(['remap', 'downpipe', 'coilovers', 'splitter']));
    expect(car).not.toContain('slip-on');
    expect(bike).toEqual(expect.arrayContaining(['flash', 'slip-on', 'quickshifter', 'rearsets', 'tail-tidy', 'steering-damper']));
    expect(bike).not.toContain('coilovers');
  });
  test('an EV gets chassis chips only (plus a diff)', () => {
    const ev = quickModsFor('car', 'e').map((m) => m.key);
    expect(ev).toEqual(expect.arrayContaining(['coilovers', 'tyres', 'bbk', 'splitter', 'wrap', 'lsd']));
    for (const k of ['remap', 'induction', 'downpipe', 'intercooler', 'hpfp', 'e85', 'clutch', 'oil-cooler', 'cat-back']) expect(ev).not.toContain(k);
    const bike = quickModsFor('bike', 'e').map((m) => m.key);
    expect(bike).toEqual(expect.arrayContaining(['sprockets', 'fork-springs', 'rearsets']));
    expect(bike).not.toContain('slip-on');
    expect(bike).not.toContain('flash');
  });
  test('turbo-only parts are hidden for non-turbo engines', () => {
    expect(quickModsFor('car', 'n').map((m) => m.key)).not.toContain('intercooler');
    expect(quickModsFor('car', undefined).map((m) => m.key)).toContain('intercooler');
  });
  test('keys and names are unique and fit the backend', () => {
    expect(new Set(QUICK_MODS.map((m) => m.key)).size).toBe(QUICK_MODS.length);
    expect(new Set(QUICK_MODS.map((m) => m.name.toLowerCase())).size).toBe(QUICK_MODS.length);
    expect(QUICK_MODS.every((m) => m.name.length <= 60)).toBe(true);
  });
  test('tap adds with a suggested gain, tap again removes', () => {
    const cai = quick('cai');
    const on = toggleQuickMod([], cai, suggestedGain(cai, 217, 'stock'), id);
    expect(on[0]).toMatchObject({ category: 'intake', name: 'Cold air intake', bhpGain: 4 });
    expect(toggleQuickMod(on, cai, undefined, id)).toEqual([]);
  });
  test('groups save as backend categories', () => {
    expect(toggleQuickMod([], quick('hpfp'), undefined, id)[0].category).toBe('engine');
    expect(toggleQuickMod([], quick('splitter'), undefined, id)[0].category).toBe('body');
    expect(toggleQuickMod([], quick('quickshifter'), undefined, id)[0].category).toBe('other');
  });
  test('power parts start at zero with a stage set; looks parts never have a gain', () => {
    expect(suggestedGain(quick('downpipe'), 217, 'stage2')).toBeUndefined();
    expect(suggestedGain(quick('downpipe'), 217, 'stock')).toBe(9);
    expect(suggestedGain(quick('wrap'), 217, 'stock')).toBeUndefined();
  });
  test('add typical parts skips what is there and adds no gain', () => {
    const have: Mod[] = [{ id: 'a', category: 'engine', name: 'ECU remap', bhpGain: 30 }];
    const out = addTypicalParts(have, typicalParts('car', 't', 'stage2'), id);
    expect(out.map((m) => m.name)).toEqual(['ECU remap', 'Induction kit', 'Downpipe with sports cat', 'Uprated intercooler']);
    expect(out.slice(1).every((m) => m.bhpGain === undefined)).toBe(true);
    expect(hasQuickMod(out, quick('intercooler'))).toBe(true);
  });
});

describe('a typed remap counts as the stage (REVIEW-7 bug 4)', () => {
  test('"Stage 1 remap" is Stage 1, not Stock', () => {
    expect(stageFromMods([{ name: 'Stage 1 remap' }])).toBe('stage1');
    expect(stageFromMods([{ name: 'Stage 2 map' }])).toBe('stage2');
    expect(stageFromMods([{ name: 'Stage 2+ ECU remap' }])).toBe('stage2plus');
    expect(stageFromMods([{ name: 'Stage 3 tune' }])).toBe('stage3');
    expect(stageFromMods([{ name: 'Cat-back' }, { name: 'Remap pending' }])).toBe('stock');
  });
});
