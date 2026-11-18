import type { Spot, VehicleKind } from './types';

/**
 * Cars / Bikes on photo spots (owner, 18 Nov 2026: "some bikes can get some better areas as they
 * can be pushed up footpaths, for example on a pier"). Each bundled photo spot says which vehicles
 * it suits; most suit both, a few are bikes only (pushed, engine off, to a backdrop a car can't
 * reach). People's own suggested spots say nothing and suit both.
 *
 * The filter is a ChipGroup: nothing selected = every photo spot. It only ever narrows photo
 * spots; drives, tracks and the rest are untouched.
 */

export const VEHICLE_CHIPS: { key: VehicleKind; label: string }[] = [
  { key: 'car', label: 'Cars' },
  { key: 'bike', label: 'Bikes' },
];

const BOTH: readonly VehicleKind[] = ['car', 'bike'];

/** The vehicles a spot suits: its own list, or both. */
export function spotVehicles(s: Pick<Spot, 'kind' | 'vehicles'>): readonly VehicleKind[] {
  return s.vehicles?.length ? s.vehicles : BOTH;
}

/** A photo spot only a bike can get to (pushed, engine off): marked on its pin and row. */
export function isBikeOnly(s: Pick<Spot, 'kind' | 'vehicles'>): boolean {
  const v = spotVehicles(s);
  return s.kind === 'photo' && v.length === 1 && v[0] === 'bike';
}

/** Whether a place passes the Cars / Bikes filter. Nothing selected = everything; non-photo places always pass. */
export function passesVehicleFilter(s: Pick<Spot, 'kind' | 'vehicles'>, selected: readonly VehicleKind[]): boolean {
  if (s.kind !== 'photo' || !selected.length) return true;
  return spotVehicles(s).some((v) => selected.includes(v));
}

/**
 * Where the filter starts when the person hasn't picked: from their garage. Only bikes there →
 * Bikes; anything else (cars only, both, or nothing yet) → all, with bike-only spots still shown
 * and marked.
 */
export function defaultVehicleFilter(garage: readonly { kind: VehicleKind }[]): VehicleKind[] {
  return garage.length > 0 && garage.every((b) => b.kind === 'bike') ? ['bike'] : [];
}

/** The filter in use: the saved choice if there is one, else the garage default. */
export function vehicleFilter(saved: readonly VehicleKind[] | undefined, garage: readonly { kind: VehicleKind }[]): VehicleKind[] {
  if (saved) return saved.filter((v) => v === 'car' || v === 'bike');
  return defaultVehicleFilter(garage);
}

/** The short mark on a bike-only pin, and the words for its row and screen readers. */
export const BIKE_ONLY_BADGE = 'B';
export const BIKE_ONLY_LABEL = 'Bikes only';
