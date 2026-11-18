import {
  familyFor,
  findDonor,
  guessVariant,
  isElectric,
  makesFor,
  matchScore,
  modelLabel,
  modelsFor,
  parseEngines,
  parseVehicles,
  searchDonors,
  searchVariants,
  specFill,
  toBhp,
  toLbFt,
  variantsFor,
  yearsLabel,
} from '../src/lib/vehicles';

const CARS = `
# comment
@Volkswagen
=Golf GTI
Mk7|2.0 TSI|2013-2017|220p|1351|350n|t|1:290p,2:320p
Mk5|2.0 TFSI|2004-2009|200p|1336|280n|t
=Golf R
Mk7.5|2.0 TSI|2017-2020|310p|1450|400n|t
Mk8|2.0 TSI|2021-|320p|1551|420n|t
bad line without enough fields
Mk9|2.0|20xx|300p|1500|400n|t
@Skoda
=Octavia vRS
Mk3|2.0 TDI 184|2013-2020|184p|1400|380n|d
@@ENGINES
Honda|K20A|2.0 i-VTEC (Civic Type R FN2)|201p|193n|n
Toyota|2JZ-GTE|3.0 twin-turbo (Supra Mk4 UK)|326b|441n|t
broken|line
`;

const BIKES = `
@Suzuki
=GSX750F
Katana|749cc|1998-2006|92b|226d|73n|n
=Bandit 1200
GSF1200|1157cc|1996-2006|98b|235|91n|n
@Yamaha
=YZF-R1
2015-2019|998cc crossplane|2015-2019|200p|199|112.4n|n
=YZF-R125
2019-2022|125cc VVA|2019-2022|15k|142|11.5n|n
@@ENGINES
Suzuki|GSF1200|1157cc air/oil-cooled (Bandit 1200)|98b|91n|n
`;

const cars = parseVehicles(CARS, 'car');
const bikes = parseVehicles(BIKES, 'bike');
const all = [...cars, ...bikes];
const engines = [...parseEngines(CARS, 'car'), ...parseEngines(BIKES, 'bike')];

describe('units', () => {
  test('PS, kW and bhp convert to whole bhp (PS x 0.986)', () => {
    expect(toBhp('220p')).toBe(217);
    expect(toBhp('310p')).toBe(306);
    expect(toBhp('147k')).toBe(197);
    expect(toBhp('326b')).toBe(326);
    expect(toBhp('326')).toBe(326);
    expect(toBhp('abc')).toBeUndefined();
    expect(toBhp('0p')).toBeUndefined();
  });
  test('Nm converts to lb-ft', () => {
    expect(toLbFt('350n')).toBe(258);
    expect(toLbFt('258l')).toBe(258);
    expect(toLbFt('x')).toBeUndefined();
  });
  test('JDM kg·m converts to lb-ft (x7.233)', () => {
    expect(toLbFt('37k')).toBe(268);
    expect(toLbFt('16k')).toBe(116);
    expect(toLbFt('16.0K')).toBe(116);
  });
});

describe('electric', () => {
  test('e parses as fully electric; h stays hybrid', () => {
    const list = parseVehicles('@Polestar\n=2\nLR|Dual-motor electric 78 kWh|2020-2023|408p|2113|660n|e|1:476p\n@VW\n=Golf GTE\nMk8|1.4 TSI eHybrid|2020-2024|245p|1549|400n|h', 'car');
    expect(list.map((v) => v.asp)).toEqual(['e', 'h']);
    expect(isElectric(list[0].asp)).toBe(true);
    expect(isElectric(list[1].asp)).toBe(false);
    expect(list[0].stages).toEqual({ stage1: 469 });
  });
});

describe('parsing', () => {
  test('reads variants and skips bad lines', () => {
    expect(cars).toHaveLength(5);
    const gti = cars.find((v) => v.gen === 'Mk7' && v.model === 'Golf GTI')!;
    expect(gti).toMatchObject({ make: 'Volkswagen', engine: '2.0 TSI', from: 2013, to: 2017, bhp: 217, weightKg: 1351, torqueLbFt: 258, asp: 't' });
    expect(gti.stages).toEqual({ stage1: 286, stage2: 316 });
    expect(cars.find((v) => v.gen === 'Mk8')!.to).toBeUndefined();
  });
  test('dry weights get an allowance and are marked approximate', () => {
    const katana = bikes.find((v) => v.model === 'GSX750F')!;
    expect(katana.weightKg).toBe(246);
    expect(katana.weightApprox).toBe(true);
    expect(bikes.find((v) => v.model === 'Bandit 1200')!.weightApprox).toBeUndefined();
  });
  test('ids are stable and unique', () => {
    expect(new Set(all.map((v) => v.id)).size).toBe(all.length);
    expect(cars[0].id).toBe('car:volkswagen:golf-gti:mk7:2-0-tsi');
  });
  test('engines section', () => {
    expect(engines.map((e) => e.code)).toEqual(['K20A', '2JZ-GTE', 'GSF1200']);
    expect(engines[0]).toMatchObject({ kind: 'car', make: 'Honda', bhp: 198, asp: 'n' });
    expect(engines[2].kind).toBe('bike');
  });
});

describe('make, model, variant', () => {
  test('makes per kind, sorted and searchable', () => {
    expect(makesFor(all, 'car')).toEqual(['Skoda', 'Volkswagen']);
    expect(makesFor(all, 'bike')).toEqual(['Suzuki', 'Yamaha']);
    expect(makesFor(all, 'car', 'volks')).toEqual(['Volkswagen']);
    expect(makesFor(all, 'car', 'škoda')).toEqual(['Skoda']);
  });
  test('models for a make, case-insensitive', () => {
    expect(modelsFor(all, 'car', 'volkswagen')).toEqual(['Golf GTI', 'Golf R']);
    expect(modelsFor(all, 'car', 'Volkswagen', 'r')[0]).toBe('Golf R');
  });
  test('variants newest first', () => {
    expect(variantsFor(all, 'car', 'Volkswagen', 'Golf GTI').map((v) => v.gen)).toEqual(['Mk7', 'Mk5']);
  });
});

describe('search', () => {
  test('free search finds variants however people type them', () => {
    expect(searchVariants(all, 'car', 'golf r mk7')[0].model).toBe('Golf R');
    expect(searchVariants(all, 'car', 'gti mk 5')[0].gen).toBe('Mk5');
    expect(searchVariants(all, 'bike', 'yzf r1')[0].model).toBe('YZF-R1');
    expect(searchVariants(all, 'bike', 'r1')[0].model).toBe('YZF-R1');
    expect(searchVariants(all, 'bike', 'katana')[0].model).toBe('GSX750F');
    expect(searchVariants(all, 'car', 'vrs tdi')[0].model).toBe('Octavia vRS');
  });
  test('kind is respected and nonsense finds nothing', () => {
    expect(searchVariants(all, 'car', 'bandit')).toEqual([]);
    expect(searchVariants(all, 'car', 'zzzz')).toEqual([]);
    expect(searchVariants(all, 'car', '  ')).toEqual([]);
  });
  test('exact word beats prefix', () => {
    expect(matchScore('Yamaha YZF-R1', 'r1')).toBeGreaterThan(matchScore('Yamaha YZF-R125', 'r1'));
  });
});

describe('spec fill', () => {
  const r = cars.find((v) => v.gen === 'Mk7.5')!;
  test('picking a variant fills make, model, specs and year', () => {
    expect(specFill(r)).toEqual({ make: 'Volkswagen', model: 'Golf R Mk7.5', year: 2017, stockBhp: 306, weightKg: 1450, torqueLbFt: 295 });
  });
  test('a year inside the range is kept, one outside is replaced', () => {
    expect(specFill(r, 2019).year).toBe(2019);
    expect(specFill(r, 2005).year).toBe(2017);
  });
  test('labels', () => {
    expect(modelLabel(r)).toBe('Golf R Mk7.5');
    expect(yearsLabel(r)).toBe('2017–2020');
    expect(yearsLabel({ from: 2021 })).toBe('2021–on');
  });
  test('saved builds find their variant again', () => {
    expect(guessVariant(all, 'car', 'volkswagen', 'golf r mk7.5')?.id).toBe(r.id);
    expect(guessVariant(all, 'car', 'Volkswagen', 'Golf R Mk7.5 stage 2')).toBeUndefined();
  });
  test('model family from a saved model', () => {
    expect(familyFor(all, 'car', 'Volkswagen', 'Golf R Mk7.5')).toBe('Golf R');
    expect(familyFor(all, 'car', 'Volkswagen', 'Golf GTI')).toBe('Golf GTI');
    expect(familyFor(all, 'car', 'Volkswagen', 'Corrado VR6')).toBeNull();
  });
});

describe('donors', () => {
  test('engines first, same kind first, and vehicles are donors too', () => {
    const none = searchDonors(engines, all, 'bike', '');
    expect(none[0].name).toBe('GSF1200');
    expect(none.every((d) => d.id.startsWith('engine:'))).toBe(true);
    expect(searchDonors(engines, all, 'bike', 'bandit 1200').map((d) => d.kind)).toEqual(['bike', 'bike']);
    expect(searchDonors(engines, all, 'car', 'k20')[0].name).toBe('K20A');
    const r1 = searchDonors(engines, all, 'car', 'r1 crossplane')[0];
    expect(r1).toMatchObject({ kind: 'bike', name: 'YZF-R1', bhp: 197 });
  });
  test('find a donor by id', () => {
    expect(findDonor(engines, all, engines[1].id)?.name).toBe('2JZ-GTE');
    expect(findDonor(engines, all, cars[0].id)?.stages?.stage1).toBe(286);
    expect(findDonor(engines, all, 'nope')).toBeUndefined();
  });
});

describe('search order matches the generation list (REVIEW-7 inconsistency 12)', () => {
  test('equal matches come newest first', () => {
    const { searchVariants } = require('../src/lib/vehicles');
    const v = (id: string, gen: string, from: number) => ({ id, kind: 'car', make: 'Honda', model: 'Civic Type R', gen, engine: '2.0', from, bhp: 300, weightKg: 1400 });
    const list = [v('ep3', 'EP3', 2001), v('fn2', 'FN2', 2007), v('fk2', 'FK2', 2015), v('fk8', 'FK8', 2017)];
    expect(searchVariants(list, 'car', 'civic type r', 10).map((x: { id: string }) => x.id)).toEqual(['fk8', 'fk2', 'fn2', 'ep3']);
  });
});

import { allVariants as allV } from '../src/data/vehicles';
import { groupByModel as groupModels, searchVariants as searchV } from '../src/lib/vehicles';

describe('groupByModel (Review 14 decision 4: the count matches the rows)', () => {
  it('keeps a Fiesta ST-Line out of the Fiesta ST group, ST group first', () => {
    const hits = searchV(allV(), 'car', 'Fiesta ST', 8);
    const groups = groupModels(hits, 'Fiesta ST');
    expect(groups[0].model).toBe('Fiesta ST');
    for (const g of groups) for (const v of g.variants) expect(v.model).toBe(g.model);
    expect(groups.reduce((n, g) => n + g.variants.length, 0)).toBe(hits.length);
  });
});
