import type { ModCategory } from '../lib/types';

export const CAR_MAKES = [
  'Abarth', 'Alfa Romeo', 'Audi', 'BMW', 'Citroën', 'Cupra', 'Ford', 'Honda', 'Hyundai', 'Kia',
  'Lexus', 'Mazda', 'Mercedes', 'Mini', 'Mitsubishi', 'Nissan', 'Peugeot', 'Porsche', 'Renault',
  'SEAT', 'Škoda', 'Subaru', 'Toyota', 'Vauxhall', 'Volkswagen', 'Volvo',
];

export const BIKE_MAKES = [
  'Aprilia', 'BMW', 'Ducati', 'Harley-Davidson', 'Honda', 'Kawasaki', 'KTM', 'MV Agusta',
  'Royal Enfield', 'Suzuki', 'Triumph', 'Yamaha',
];

export const MOD_CATEGORIES: { key: ModCategory; label: string; short: string }[] = [
  { key: 'engine', label: 'Engine and remap', short: 'ENGINE' },
  { key: 'turbo', label: 'Turbo and forced induction', short: 'TURBO' },
  { key: 'intake', label: 'Intake', short: 'INTAKE' },
  { key: 'exhaust', label: 'Exhaust', short: 'EXHAUST' },
  { key: 'suspension', label: 'Suspension', short: 'SUSP.' },
  { key: 'brakes', label: 'Brakes', short: 'BRAKES' },
  { key: 'wheels', label: 'Wheels and tyres', short: 'WHEELS' },
  { key: 'body', label: 'Body and aero', short: 'BODY' },
  { key: 'interior', label: 'Interior', short: 'INTERIOR' },
  { key: 'lighting', label: 'Lighting', short: 'LIGHTS' },
  { key: 'audio', label: 'Audio', short: 'AUDIO' },
  { key: 'other', label: 'Other', short: 'OTHER' },
];

export function modCategoryShort(key: ModCategory): string {
  return MOD_CATEGORIES.find((c) => c.key === key)?.short ?? 'OTHER';
}

/** Brands offered as quick picks in the invite filter. */
export const FILTER_BRANDS = [
  'Volkswagen', 'Audi', 'BMW', 'Ford', 'Honda', 'Toyota', 'Nissan', 'Subaru', 'Mercedes', 'Vauxhall',
  'Yamaha', 'Kawasaki', 'Suzuki', 'Ducati', 'Triumph',
];
