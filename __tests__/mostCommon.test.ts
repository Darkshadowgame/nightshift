import { allVariants } from '../src/data/vehicles';
import { groupByModel, isMostCommon, MOST_COMMON, searchVariants } from '../src/lib/vehicles';

describe('"Most common" version (Review 19 #3)', () => {
  const all = allVariants();

  test('every listed version exists in the data, exactly once', () => {
    for (const [key, gen] of Object.entries(MOST_COMMON)) {
      const [make, model] = key.split('|');
      expect({ key, n: all.filter((v) => v.make === make && v.model === model && v.gen === gen).length }).toEqual({ key, n: 1 });
    }
  });

  test('"fiesta st" puts the Mk7 ST180 first in its group', () => {
    const [first] = groupByModel(searchVariants(all, 'car', 'fiesta st', 8), 'fiesta st');
    expect(first.model).toBe('Fiesta ST');
    expect(first.variants[0].gen).toBe('Mk7 ST180');
    expect(isMostCommon(first.variants[0])).toBe(true);
    expect(first.variants.filter(isMostCommon)).toHaveLength(1);
  });
});
