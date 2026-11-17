import { parseEngines, parseVehicles, type DonorEngine, type Variant } from '../lib/vehicles';
import { BIKE_DATA } from './vehicles.bikes';
import { CAR_DATA } from './vehicles.cars';

/** Bump when the data changes. Shown in the picker footer. */
export const VEHICLES_VERSION = '2026-11-17';

let variants: Variant[] | null = null;
let engines: DonorEngine[] | null = null;

/** Every car and bike variant. Parsed on first use, then kept. */
export function allVariants(): Variant[] {
  if (!variants) variants = [...parseVehicles(CAR_DATA, 'car'), ...parseVehicles(BIKE_DATA, 'bike')];
  return variants;
}

/** Engine-swap donors that aren't whole vehicles in the list. */
export function allEngines(): DonorEngine[] {
  if (!engines) engines = [...parseEngines(CAR_DATA, 'car'), ...parseEngines(BIKE_DATA, 'bike')];
  return engines;
}
