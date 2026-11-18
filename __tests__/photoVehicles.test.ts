/**
 * Photo spots' Cars / Bikes filter (owner, 18 Nov 2026): bikes can be pushed to backdrops a car
 * can't reach (a pier, a prom). Nothing selected = every spot; the default follows the garage.
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  BIKE_ONLY_BADGE, defaultVehicleFilter, isBikeOnly, passesVehicleFilter, spotVehicles, VEHICLE_CHIPS, vehicleFilter,
} from '../src/lib/photoVehicles';
import type { Spot, VehicleKind } from '../src/lib/types';

type S = Pick<Spot, 'kind' | 'vehicles'>;
const both: S = { kind: 'photo', vehicles: ['car', 'bike'] };
const bikeOnly: S = { kind: 'photo', vehicles: ['bike'] };
const carOnly: S = { kind: 'photo', vehicles: ['car'] };
const suggested: S = { kind: 'photo' };
const drive: S = { kind: 'drive' };
const car = { kind: 'car' as VehicleKind };
const bike = { kind: 'bike' as VehicleKind };

describe('the Cars / Bikes chips', () => {
  test('two chips, Cars then Bikes', () => {
    expect(VEHICLE_CHIPS).toEqual([{ key: 'car', label: 'Cars' }, { key: 'bike', label: 'Bikes' }]);
  });

  test('nothing selected = every photo spot, bike-only ones too', () => {
    for (const s of [both, bikeOnly, carOnly, suggested]) expect(passesVehicleFilter(s, [])).toBe(true);
  });

  test('Bikes shows spots a bike suits; Cars hides bike-only ones', () => {
    expect(passesVehicleFilter(bikeOnly, ['bike'])).toBe(true);
    expect(passesVehicleFilter(both, ['bike'])).toBe(true);
    expect(passesVehicleFilter(carOnly, ['bike'])).toBe(false);
    expect(passesVehicleFilter(bikeOnly, ['car'])).toBe(false);
    expect(passesVehicleFilter(both, ['car'])).toBe(true);
    expect(passesVehicleFilter(bikeOnly, ['car', 'bike'])).toBe(true);
  });

  test("people's suggested spots say nothing and suit both", () => {
    expect(spotVehicles(suggested)).toEqual(['car', 'bike']);
    expect(passesVehicleFilter(suggested, ['car'])).toBe(true);
    expect(passesVehicleFilter(suggested, ['bike'])).toBe(true);
  });

  test('only photo spots are filtered: drives and tracks always pass', () => {
    expect(passesVehicleFilter(drive, ['bike'])).toBe(true);
    expect(passesVehicleFilter({ kind: 'track' }, ['car'])).toBe(true);
  });
});

describe('the default comes from the garage', () => {
  test('only bikes → Bikes', () => {
    expect(defaultVehicleFilter([bike])).toEqual(['bike']);
    expect(defaultVehicleFilter([bike, bike])).toEqual(['bike']);
  });

  test('only cars, both, or an empty garage → all (bike-only spots still shown, marked)', () => {
    expect(defaultVehicleFilter([car])).toEqual([]);
    expect(defaultVehicleFilter([car, bike])).toEqual([]);
    expect(defaultVehicleFilter([])).toEqual([]);
    expect(passesVehicleFilter(bikeOnly, defaultVehicleFilter([car]))).toBe(true);
  });

  test("a saved choice wins over the garage, even an empty one (the person cleared it)", () => {
    expect(vehicleFilter(undefined, [bike])).toEqual(['bike']);
    expect(vehicleFilter([], [bike])).toEqual([]);
    expect(vehicleFilter(['car'], [bike])).toEqual(['car']);
    expect(vehicleFilter(['car', 'boat' as VehicleKind], [])).toEqual(['car']);
  });
});

describe('bike-only marking', () => {
  test('only a photo spot whose one vehicle is a bike', () => {
    expect(isBikeOnly(bikeOnly)).toBe(true);
    expect(isBikeOnly(both)).toBe(false);
    expect(isBikeOnly(carOnly)).toBe(false);
    expect(isBikeOnly(suggested)).toBe(false);
    expect(isBikeOnly({ kind: 'drive', vehicles: ['bike'] })).toBe(false);
    expect(BIKE_ONLY_BADGE).toHaveLength(1);
  });

  test('the map pins, the Layers panel and Search use the filter and the mark', () => {
    const read = (p: string) => readFileSync(join(__dirname, '..', p), 'utf8');
    const tonight = read('src/app/(tabs)/index.tsx');
    expect(tonight).toMatch(/passesVehicleFilter\(s, photoFor\)/);
    expect(tonight).toMatch(/badge: BIKE_ONLY_BADGE/);
    expect(read('src/components/LayersPanel.tsx')).toMatch(/<ChipGroup<VehicleKind>[^>]*options=\{VEHICLE_CHIPS\}/);
    const search = read('src/app/search.tsx');
    expect(search).toMatch(/<ChipGroup<VehicleKind>[^>]*options=\{VEHICLE_CHIPS\}/);
    expect(search).toMatch(/isBikeOnly\(s\) \? <Tag label=\{BIKE_ONLY_LABEL\}/);
  });
});
