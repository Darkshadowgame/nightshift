import { BIKE_DATA } from '../src/data/vehicles.bikes';
import { CAR_DATA } from '../src/data/vehicles.cars';
import { CAR_EVERYDAY_DATA } from '../src/data/vehicles.everyday';
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
    expect(cars).toHaveLength(variantLines(CAR_DATA) + variantLines(CAR_EVERYDAY_DATA));
    expect(bikes).toHaveLength(variantLines(BIKE_DATA));
    expect(engines).toHaveLength(engineLines(CAR_DATA) + engineLines(CAR_EVERYDAY_DATA) + engineLines(BIKE_DATA));
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
  test('batch 2 coverage: JDM, classics, vans, EVs, learner and big bikes, donors', () => {
    for (const q of ['silvia s14', 'stagea', 'aristo', 'integra dc2', 'accord euro r', 'corrado vr6', 'clio williams', 'mg zr 160', '190e 2.5-16',
      'transporter t4', 'vito w447', 'trafic', 'ioniq 5 n', 'formentor vz5', 'alpine a110']) {
      expect([q, searchVariants(variants, 'car', q).length > 0]).toEqual([q, true]);
    }
    for (const q of ['yzf-r125 2008', 'cbr125r', 'interceptor 650', 'zx-6r 2009', 'hornet 600', 'ducati 916', 'daytona 955i', 'k1300s']) {
      expect([q, searchVariants(variants, 'bike', q).length > 0]).toEqual([q, true]);
    }
    for (const q of ['c20xe', 'sr20ve', 'k24', 'ej255', 'm52b28']) {
      expect([q, searchDonors(engines, variants, 'car', q).some((d) => d.id.startsWith('engine:'))]).toEqual([q, true]);
    }
  });
  test('batch 3 coverage: gaps, everyday cars, learner/scooter/SM/ADV bikes, bike tuner stages', () => {
    for (const q of ['integra db8', 'prelude ba8', 'forester sf5', 'impreza version iv', 'silvia autech', 'polo gti edition 25', 'rover 25 gti',
      'vivaro a', 'transit custom ms-rt', 'ford ka', 'focus mk1', 'corsa b', 'astra g', 'micra k12', 'jazz', 'picanto', 'i30 mk2',
      'octavia mk2', 'ibiza 6j', 'a4 b8', '330d e90', 'a-class w177', 'c-class w205', 'mini one', 'id.3 pro', 'mg4', 'ioniq 5']) {
      expect([q, searchVariants(variants, 'car', q).length > 0]).toEqual([q, true]);
    }
    for (const q of ['cbf125', 'hornet s', 'tzr125', 'street triple 660', 'hypermotard 939', 'diavel 1260', 'k1200s', 'r ninet scrambler',
      'brutale 910', 'rsv mille', 'pcx125 2018', 'xmax 300', 'gts 300', 'dr-z400sm', '690 smc r', '701 supermoto', 'africa twin', 'tenere 700']) {
      expect([q, searchVariants(variants, 'bike', q).length > 0]).toEqual([q, true]);
    }
    // Every JDM catalogue line now has a torque figure (kg·m converted).
    expect(cars.filter((v) => /JDM/.test(v.gen) && !v.torqueLbFt)).toEqual([]);
    expect(bikes.filter((v) => v.stages).length).toBeGreaterThanOrEqual(80);
    const polestar = cars.find((v) => v.make === 'Polestar' && /Long Range Dual Motor/.test(v.gen))!;
    expect(polestar).toMatchObject({ asp: 'e', stages: { stage1: 469 } });
  });
  test('batch 4 coverage: UK scene bikes, JDM/track/EV cars, swap engine families', () => {
    for (const q of ['gsx-r1100', 'b-king', 'gsx-s950', 'gsx-8r', 'katana 2019', 'gpz900r', 'zx-7r', 'z1000sx', 'z h2', 'cbr400rr nc29',
      'vfr400r', 'fzr1000', 'thunderace', 'yzf-r9', 'monkey 125', 'speed 400', 'rocket 3', 'supersport 950', 'rc8 r', 'm1000r', 'r1200gs lc', 'g310r']) {
      expect([q, searchVariants(variants, 'bike', q).length > 0]).toEqual([q, true]);
    }
    for (const q of ['nsx nc1', 's660', 'swift sport zc33s', 'cappuccino', 'az-1', 'evo i jdm', 'leaf e+', 'kona electric', '130i', '135i e82',
      'm3 sport evolution', 'z3 m', 'i8', 'rs2', 'r8 v10', 'polo r wrc', '911 993 turbo', 'amg gt s', 'vx220 turbo', 'twingo rs', 'a290',
      'abarth 500e', '124 spider', 'emira', 'atom 4', 'nomad', 'plus six', 'seven r500', 'cyberster']) {
      expect([q, searchVariants(variants, 'car', q).length > 0]).toEqual([q, true]);
    }
    for (const q of ['k20c1 fl5', 'k24a1', '1jz-ge', '1uz', 'rb26dett r32', 'ls6', 'lsa', 'l83', 'coyote gen3', 'godzilla', 'ea888 gen4 gti',
      'ea888 gen1', 'b58 supra', 's55', 's54 csl', 's85', '4g63t evo iii', 'ej257 us', 'duratec v6 3.0', 'adu']) {
      expect([q, searchDonors(engines, variants, 'car', q).some((d) => d.id.startsWith('engine:'))]).toEqual([q, true]);
    }
  });
  test('search edge cases from batch 4', () => {
    // A one-letter model ("Honda e") is still found, and both trims come back.
    expect(searchVariants(variants, 'car', 'honda e').filter((v) => v.make === 'Honda' && v.model === 'e')).toHaveLength(2);
    // "Z H2" (the supercharged naked) and "H2" are separate models; "z h2" ranks the naked first.
    expect(searchVariants(variants, 'bike', 'z h2')[0]).toMatchObject({ model: 'Z H2', asp: 's' });
    // Bike engines are offered for bike-engined cars (a car chassis), after the car engines.
    const busa = searchDonors(engines, variants, 'car', 'hayabusa');
    expect(busa.some((d) => d.kind === 'bike' && d.id.startsWith('engine:'))).toBe(true);
    // A model split across two make blocks (Lancer Evolution, Seven, M3) keeps one family in the picker.
    for (const [make, model] of [['Mitsubishi', 'Lancer Evolution'], ['Caterham', 'Seven'], ['BMW', 'M3']]) {
      const fams = [...new Set(cars.filter((v) => v.make === make).map((v) => v.model))];
      expect(fams.filter((f) => f === model)).toHaveLength(1);
      expect(cars.filter((v) => v.make === make && v.model === model).length).toBeGreaterThan(1);
    }
    // Same chassis, two batteries: distinct ids, both listed.
    expect(cars.filter((v) => v.make === 'Hyundai' && v.model === 'Kona Electric').map((v) => v.bhp).sort()).toEqual([134, 201]);
  });
  test('EVs are marked e and hybrids h, never as a combustion engine', () => {
    for (const v of variants.filter((x) => /electric|kwh/i.test(x.engine) && !/hybrid|phev/i.test(x.engine))) {
      expect([v.id, v.asp]).toEqual([v.id, 'e']);
    }
    for (const v of variants.filter((x) => /hybrid|phev/i.test(x.engine))) {
      expect([v.id, v.asp === 'h' || /mild hybrid/i.test(v.engine)]).toEqual([v.id, true]);
    }
    // Every e line says it is electric, so a typo can't turn a petrol car into an EV.
    for (const v of variants.filter((x) => x.asp === 'e')) expect([v.id, /electric|kwh/i.test(v.engine)]).toEqual([v.id, true]);
    expect(variants.filter((v) => v.asp === 'e').length).toBeGreaterThanOrEqual(15);
  });
  test('bundled vehicle source stays small (lazy-parsed text, under ~250 KB in all)', () => {
    // The data strings are what ships in the bundle (comments are stripped). Each file
    // stays well under 250 KB, and the total is kept small for OTA updates.
    for (const text of [CAR_DATA, CAR_EVERYDAY_DATA, BIKE_DATA]) expect(text.length).toBeLessThan(150_000);
    expect(CAR_DATA.length + CAR_EVERYDAY_DATA.length + BIKE_DATA.length).toBeLessThan(250_000);
  });
});
