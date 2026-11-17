import { BIKE_DATA } from '../src/data/vehicles.bikes';
import { CAR_DATA } from '../src/data/vehicles.cars';
import { allEngines, allVariants } from '../src/data/vehicles';
import { searchDonors, searchVariants } from '../src/lib/vehicles';

/** Sanity checks on the bundled dataset: every line parses and every figure is plausible. */

function variantLines(text: string): number {
  const body = text.split('@@ENGINES')[0];
  return body.split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#') && !l.startsWith('@') && !l.startsWith('=')).length;
}
function engineLines(text: string): number {
  const at = text.indexOf('@@ENGINES');
  if (at < 0) return 0;
  return text.slice(at + 9).split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#')).length;
}

const variants = allVariants();
const engines = allEngines();
const cars = variants.filter((v) => v.kind === 'car');
const bikes = variants.filter((v) => v.kind === 'bike');

describe('vehicle dataset', () => {
  test('every line parses (nothing silently dropped)', () => {
    expect(cars).toHaveLength(variantLines(CAR_DATA));
    expect(bikes).toHaveLength(variantLines(BIKE_DATA));
    expect(engines).toHaveLength(engineLines(CAR_DATA) + engineLines(BIKE_DATA));
  });
  test('ids are unique', () => {
    expect(new Set(variants.map((v) => v.id)).size).toBe(variants.length);
    expect(new Set(engines.map((e) => e.id)).size).toBe(engines.length);
  });
  test('figures are plausible', () => {
    for (const v of cars) {
      expect([v.id, v.bhp >= 40 && v.bhp <= 900]).toEqual([v.id, true]);
      expect([v.id, v.weightKg >= 450 && v.weightKg <= 3200]).toEqual([v.id, true]);
      if (v.torqueLbFt) expect([v.id, v.torqueLbFt >= 40 && v.torqueLbFt <= 800]).toEqual([v.id, true]);
    }
    for (const v of bikes) {
      expect([v.id, v.bhp >= 8 && v.bhp <= 350]).toEqual([v.id, true]);
      expect([v.id, v.weightKg >= 90 && v.weightKg <= 420]).toEqual([v.id, true]);
    }
    for (const v of variants) {
      expect([v.id, v.from >= 1970 && v.from <= 2026 && (v.to === undefined || v.to >= v.from)]).toEqual([v.id, true]);
      for (const bhp of Object.values(v.stages ?? {})) expect([v.id, bhp! > v.bhp && bhp! < v.bhp * 2.5]).toEqual([v.id, true]);
    }
    for (const e of engines) expect([e.id, e.bhp >= 8 && e.bhp <= 1000]).toEqual([e.id, true]);
  });
  test('the vehicles owners asked about are there', () => {
    expect(searchVariants(variants, 'bike', 'gsx750f').length).toBeGreaterThan(0);
    expect(searchVariants(variants, 'bike', 'bandit 1200').length).toBeGreaterThan(0);
    expect(searchVariants(variants, 'car', 'golf r').length).toBeGreaterThan(0);
    expect(searchDonors(engines, variants, 'bike', 'bandit 1200').length).toBeGreaterThan(0);
  });
});
