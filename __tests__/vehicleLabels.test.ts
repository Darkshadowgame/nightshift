import { allVariants } from '../src/data/vehicles';
import { isYearsGen, matchScore, modelLabel, tidyModel, variantLine } from '../src/lib/vehicles';

describe('year-only generations (bikes)', () => {
  test('labels leave out a generation that is only years; real generations stay', () => {
    expect(isYearsGen('2017-2020')).toBe(true);
    expect(isYearsGen('2021-on')).toBe(true);
    expect(isYearsGen('2020-')).toBe(true);
    expect(isYearsGen('Mk7.5')).toBe(false);
    expect(modelLabel({ model: 'YZF-R6', gen: '2017-2020' })).toBe('YZF-R6');
    expect(modelLabel({ model: 'Golf R', gen: 'Mk7.5' })).toBe('Golf R Mk7.5');
    expect(tidyModel('YZF-R6 2017-2020')).toBe('YZF-R6');
    expect(tidyModel('Golf R Mk7.5')).toBe('Golf R Mk7.5');
    expect(modelLabel({ model: 'Fireblade', gen: 'CBR900RR 1998-1999' })).toBe('Fireblade CBR900RR');
  });

  test('no picker line shows the years twice', () => {
    for (const v of allVariants().filter((x) => x.kind === 'bike')) {
      const line = variantLine(v);
      const years = line.match(/(19|20)\d{2}/g) ?? [];
      expect(new Set(years).size).toBe(years.length);
    }
  });
});

describe('vehicle search', () => {
  test('"r6 2017" finds the R6, not a CBR650F ("r6" inside "cbr650f")', () => {
    expect(matchScore('Honda CBR650F 2014-2018', 'r6 2017')).toBe(0);
    expect(matchScore('Yamaha YZF-R6 2017-2020', 'r6')).toBeGreaterThan(0);
    expect(matchScore('Volkswagen Golf R Mk7', 'mk 7')).toBeGreaterThan(0);
  });
});
