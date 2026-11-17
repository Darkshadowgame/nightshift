import { classOf, isModified } from '../src/lib/classes';
import { chassisWeight, swapFromMods, swapLabel, swapModName, swapProblem, swapSpecs, swapTag, withSwapMod } from '../src/lib/swap';
import type { Build, EngineSwap } from '../src/lib/types';

const bandit: EngineSwap = { donorMake: 'Suzuki', donorModel: 'Bandit 1200', donorVariant: 'GSF1200', bhp: 98, torqueLbFt: 67, weightDeltaKg: 12 };
let n = 0;
const id = () => `m${++n}`;

describe('engine swaps', () => {
  test('specs: donor power and torque, chassis weight plus the change', () => {
    expect(swapSpecs({ stockBhp: 92, weightKg: 246, torqueLbFt: 54 }, bandit)).toEqual({ stockBhp: 98, torqueLbFt: 67, weightKg: 258 });
    expect(swapSpecs({ stockBhp: 92, weightKg: 246 }, undefined)).toEqual({ stockBhp: 92, weightKg: 246 });
    expect(swapSpecs({ stockBhp: 92, weightKg: 246 }, { ...bandit, weightDeltaKg: -20 }).weightKg).toBe(226);
  });
  test('class comes from donor bhp over chassis weight +/- the change', () => {
    const chassis = { stockBhp: 92, weightKg: 246 };
    const base: Build = { id: 'b', ownerId: 'u', kind: 'bike', make: 'Suzuki', model: 'GSX750F', ...chassis, mods: [], photos: [] };
    const lighter = { ...bandit, weightDeltaKg: -10 };
    const swapped: Build = { ...base, ...swapSpecs(chassis, lighter), engineSwap: lighter };
    // 92/246 = 374 bhp/t (C); 98/236 = 415 bhp/t (B)
    expect(classOf(base)).toBe('C');
    expect(swapped.weightKg).toBe(236);
    expect(classOf(swapped)).toBe('B');
    // The same engine with +12 kg: 98/258 = 380 bhp/t, just under B.
    expect(classOf({ ...base, ...swapSpecs(chassis, bandit) })).toBe('C');
    const car: Build = { ...base, kind: 'car', make: 'Mazda', model: 'MX-5 NA', stockBhp: 114, weightKg: 960 };
    const ls: EngineSwap = { donorMake: 'GM', donorModel: 'LS3', bhp: 430, weightDeltaKg: 80 };
    expect(classOf({ ...car, ...swapSpecs({ stockBhp: 114, weightKg: 960 }, ls) })).toBe('S');
  });
  test('the chassis weight is recovered from a saved build', () => {
    expect(chassisWeight({ weightKg: 258, engineSwap: bandit })).toBe(246);
    expect(chassisWeight({ weightKg: 258 })).toBe(258);
  });
  test('labels', () => {
    expect(swapLabel(bandit)).toBe('Bandit 1200 swap');
    expect(swapModName(bandit)).toBe('Suzuki Bandit 1200 engine swap');
    expect(swapModName({ donorMake: 'Honda', donorModel: 'Honda K20A' })).toBe('Honda K20A engine swap');
    expect(swapModName({ donorMake: '', donorModel: 'x'.repeat(80) }).length).toBe(60);
  });
  test('the swap counts as an engine mod, once', () => {
    const mods = withSwapMod([{ id: 'a', category: 'wheels', name: 'Wheels' }], bandit, id);
    expect(mods[0]).toMatchObject({ category: 'engine', name: 'Suzuki Bandit 1200 engine swap' });
    const again = withSwapMod(mods, { ...bandit, donorModel: 'Bandit 1250' }, id);
    expect(again).toHaveLength(2);
    expect(again[0]).toMatchObject({ id: mods[0].id, name: 'Suzuki Bandit 1250 engine swap' });
    expect(withSwapMod(again, undefined, id)).toEqual([{ id: 'a', category: 'wheels', name: 'Wheels' }]);
    expect(isModified({ mods: [...mods, { id: 'c', category: 'body', name: 'Tail tidy' }] })).toBe(true);
  });
  test('cards show the swap, from the details or the mod alone', () => {
    expect(swapTag({ engineSwap: bandit, mods: [] })).toBe('Bandit 1200 swap');
    expect(swapTag({ mods: [{ id: 'a', category: 'engine', name: 'Suzuki Bandit 1200 engine swap' }] })).toBe('Suzuki Bandit 1200 swap');
    expect(swapTag({ mods: [] })).toBeNull();
  });
  test('a swap synced without its details comes back from the mod', () => {
    const b = { mods: [{ id: 'a', category: 'engine' as const, name: 'Suzuki Bandit 1200 engine swap' }], stockBhp: 98, torqueLbFt: 67 };
    expect(swapFromMods(b)).toEqual({ donorMake: '', donorModel: 'Suzuki Bandit 1200', bhp: 98, torqueLbFt: 67 });
    expect(swapFromMods({ mods: [], stockBhp: 1 })).toBeUndefined();
  });
  test('a swap needs a donor and power', () => {
    expect(swapProblem(undefined)).toBeNull();
    expect(swapProblem(bandit)).toBeNull();
    expect(swapProblem({ ...bandit, donorModel: ' ' })).toMatch(/donor/);
    expect(swapProblem({ ...bandit, bhp: 0 })).toMatch(/bhp/);
  });
});
