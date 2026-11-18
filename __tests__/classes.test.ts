import { classOf, effectivePower, isModified, performanceFigure } from '../src/lib/classes';
import type { Build } from '../src/lib/types';

function car(stockBhp: number, weightKg: number, extra: Partial<Build> = {}): Build {
  return { id: 'x', ownerId: 'u', kind: 'car', make: 'X', model: 'Y', stockBhp, weightKg, mods: [], photos: [], ...extra };
}
function bike(stockBhp: number, weightKg: number, extra: Partial<Build> = {}): Build {
  return { ...car(stockBhp, weightKg, extra), kind: 'bike' };
}

describe('classes', () => {
  test('a litre superbike and an M4 Competition are both S class', () => {
    expect(classOf(bike(197, 201))).toBe('S'); // R1
    expect(classOf(bike(207, 197))).toBe('S'); // S1000RR
    expect(classOf(car(503, 1725))).toBe('S'); // M4 Competition
  });

  test('typical cars land in the expected class', () => {
    expect(classOf(car(316, 1380))).toBe('A'); // Civic Type R
    expect(classOf(car(395, 1575))).toBe('A'); // stock RS3
    expect(classOf(car(227, 1375))).toBe('B'); // Golf GTI
    expect(classOf(car(197, 1163))).toBe('B'); // Fiesta ST
    expect(classOf(car(144, 1065))).toBe('C'); // MX-5 NB
    expect(classOf(car(100, 935))).toBe('D'); // Saxo VTS
  });

  test('typical bikes land in the expected class', () => {
    expect(classOf(bike(148, 190))).toBe('A'); // GSX-R750
    expect(classOf(bike(128, 188))).toBe('A'); // Street Triple RS
    expect(classOf(bike(117, 190))).toBe('A'); // R6
    expect(classOf(bike(118, 194))).toBe('A'); // CBR600RR
    expect(classOf(bike(128, 196))).toBe('A'); // ZX-6R
    expect(classOf(bike(117, 189))).toBe('A'); // MT-09
    expect(classOf(bike(72, 184))).toBe('B'); // MT-07
    expect(classOf(bike(45, 168))).toBe('C'); // Ninja 400
    expect(classOf(bike(15, 140))).toBe('D'); // 125
  });

  test('a dyno figure backed by a sheet wins over stock plus mods; a bare figure does not', () => {
    const mods = [{ id: 'm', category: 'engine' as const, name: 'map', bhpGain: 20 }];
    const b = car(395, 1575, { dynoBhp: 470, mods, dynoRuns: [{ id: 'r', date: '2026-03-01', powerBhp: 470, at: 'crank', photo: 'p.jpg' }] });
    expect(effectivePower(b)).toBe(470);
    expect(classOf(b)).toBe('S');
    expect(effectivePower(car(395, 1575, { dynoBhp: 470, mods }))).toBe(415);
  });

  test('claimed mod gains raise the class without a dyno sheet', () => {
    const gti = car(227, 1375);
    expect(classOf(gti)).toBe('B');
    const mapped = { ...gti, mods: [{ id: 'm1', category: 'turbo' as const, name: 'IS38 swap', bhpGain: 110 }] };
    expect(effectivePower(mapped)).toBe(337);
    expect(classOf(mapped)).toBe('A');
  });

  test('negative or missing gains are ignored', () => {
    const b = car(200, 1450, { mods: [{ id: 'm', category: 'other', name: 'x', bhpGain: -50 }, { id: 'n', category: 'other', name: 'y' }] });
    expect(effectivePower(b)).toBe(200);
  });

  test('zero weight does not divide by zero', () => {
    expect(Number.isFinite(performanceFigure(car(200, 0)))).toBe(true);
    expect(Number.isFinite(performanceFigure(bike(100, 0)))).toBe(true);
  });

  test('modified means three or more mods', () => {
    const m = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `${i}`, category: 'other' as const, name: `m${i}` }));
    expect(isModified({ mods: m(2) })).toBe(false);
    expect(isModified({ mods: m(3) })).toBe(true);
    // REVIEW-10 #4: a Stage 1 tune and an ECU remap are one engine tune.
    expect(isModified({ mods: [{ id: 'a', category: 'engine', name: 'Stage 1 tune' }, { id: 'b', category: 'engine', name: 'ECU remap' }, { id: 'c', category: 'intake', name: 'Cold air intake' }] })).toBe(false);
  });
});

describe('bhp per tonne', () => {
  const { bhpPerTonne } = require('../src/lib/classes') as typeof import('../src/lib/classes');
  test('effective bhp over weight, and 0 with no weight', () => {
    expect(bhpPerTonne({ stockBhp: 300, mods: [], weightKg: 1500 })).toBe(200);
    expect(bhpPerTonne({ stockBhp: 300, dynoBhp: 450, mods: [], weightKg: 1500, dynoRuns: [{ id: 'r', date: '2026-03-01', powerBhp: 450, at: 'crank', photo: 'p.jpg' }] })).toBe(300);
    expect(bhpPerTonne({ stockBhp: 300, dynoBhp: 450, mods: [], weightKg: 1500 })).toBe(200);
    expect(bhpPerTonne({ stockBhp: 300, mods: [], weightKg: 0 })).toBe(0);
  });
});
