import { parseEngines, parseVehicles, type DonorEngine, type Variant } from '../lib/vehicles';
import { BIKE_DATA } from './vehicles.bikes';
import { CAR_DATA } from './vehicles.cars';
import { CAR_EVERYDAY_DATA } from './vehicles.everyday';

/** Bump when the data changes. Shown in the picker footer. */
export const VEHICLES_VERSION = '2026-11-17.4';

let variants: Variant[] | null = null;
let engines: DonorEngine[] | null = null;

/**
 * Every car and bike variant. The text is bundled (about 100-150 KB in all) but only
 * parsed on first use, then kept. Cars are split over two files: enthusiast cars,
 * vans and EVs in vehicles.cars.ts, everyday base models in vehicles.everyday.ts.
 */
export function allVariants(): Variant[] {
  if (!variants) {
    variants = [...parseVehicles(CAR_DATA, 'car'), ...parseVehicles(CAR_EVERYDAY_DATA, 'car'), ...parseVehicles(BIKE_DATA, 'bike')];
  }
  return variants;
}

/** Engine-swap donors that aren't whole vehicles in the list. */
export function allEngines(): DonorEngine[] {
  if (!engines) {
    engines = [...parseEngines(CAR_DATA, 'car'), ...parseEngines(CAR_EVERYDAY_DATA, 'car'), ...parseEngines(BIKE_DATA, 'bike')];
  }
  return engines;
}
