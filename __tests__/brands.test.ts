import { allVariants } from '../src/data/vehicles';
import { brandOptions, commonMakes } from '../src/lib/brands';
import { makesFor } from '../src/lib/vehicles';

const all = { car: makesFor(allVariants(), 'car'), bike: makesFor(allVariants(), 'bike') };

describe('invite brands (REVIEW-9 decision 5)', () => {
  test('common makes first, and every common make is in the vehicle data', () => {
    for (const m of commonMakes([])) expect([...all.car, ...all.bike]).toContain(m);
    expect(brandOptions(all, ['car'], '', [])).toEqual(expect.arrayContaining(['Hyundai', 'Kia', 'Mazda', 'Mini', 'Peugeot', 'Renault', 'SEAT', 'Cupra', 'Skoda', 'Porsche', 'Citroen']));
    expect(brandOptions(all, ['car'], '', [])).not.toContain('Ducati');
  });
  test('search finds any make in the data, accents and case ignored', () => {
    expect(brandOptions(all, [], 'hyun', [])).toEqual(['Hyundai']);
    expect(brandOptions(all, ['car'], 'citroën', [])).toEqual(['Citroen']);
    expect(brandOptions(all, ['car'], 'cater', [])).toEqual(['Caterham']);
    expect(brandOptions(all, ['bike'], 'royal', [])).toEqual(['Royal Enfield']);
  });
  test('picked makes are not offered again', () => {
    expect(brandOptions(all, ['car'], '', ['Hyundai'])).not.toContain('Hyundai');
  });
});
