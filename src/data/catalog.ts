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

/**
 * The invite filter's common makes, shown first; search finds every make in the vehicle data
 * (brands.ts). Spelt as the vehicle data spells them, so they match people's builds.
 */
export const COMMON_CAR_MAKES = [
  'Volkswagen', 'Ford', 'BMW', 'Audi', 'Vauxhall', 'Honda', 'Toyota', 'Mercedes', 'Nissan', 'Hyundai', 'Kia', 'Mazda',
  'Mini', 'Peugeot', 'Renault', 'SEAT', 'Cupra', 'Skoda', 'Subaru', 'Porsche', 'Citroen',
];
export const COMMON_BIKE_MAKES = ['Yamaha', 'Honda', 'Kawasaki', 'Suzuki', 'Triumph', 'Ducati', 'BMW', 'KTM', 'Aprilia'];

// ---------------------------------------------------------------------------
// Quick-pick mods
// ---------------------------------------------------------------------------

/**
 * Groups the quick-pick chips are shown in. Finer than the saved ModCategory
 * (which the backend's mod_category enum mirrors), so fuel and cooling save as
 * engine, aero as body and bike controls as other.
 */
export type ModGroup =
  | 'engine' | 'intake' | 'exhaust' | 'turbo' | 'fuel' | 'cooling' | 'suspension' | 'brakes'
  | 'wheels' | 'body' | 'aero' | 'interior' | 'controls' | 'lighting' | 'audio';

export const MOD_GROUPS: { key: ModGroup; label: string; category: ModCategory }[] = [
  { key: 'engine', label: 'Engine', category: 'engine' },
  { key: 'intake', label: 'Intake', category: 'intake' },
  { key: 'exhaust', label: 'Exhaust', category: 'exhaust' },
  { key: 'turbo', label: 'Turbo', category: 'turbo' },
  { key: 'fuel', label: 'Fuel', category: 'engine' },
  { key: 'cooling', label: 'Cooling', category: 'engine' },
  { key: 'suspension', label: 'Suspension', category: 'suspension' },
  { key: 'brakes', label: 'Brakes', category: 'brakes' },
  { key: 'wheels', label: 'Wheels and tyres', category: 'wheels' },
  { key: 'body', label: 'Body', category: 'body' },
  { key: 'aero', label: 'Aero', category: 'body' },
  { key: 'interior', label: 'Interior', category: 'interior' },
  { key: 'controls', label: 'Controls', category: 'other' },
  { key: 'lighting', label: 'Lighting', category: 'lighting' },
  { key: 'audio', label: 'Audio', category: 'audio' },
];

export interface QuickMod {
  key: string;
  name: string;
  group: ModGroup;
  /** Which vehicles it's offered for. */
  for: 'car' | 'bike' | 'both';
  /**
   * Typical gain as a fraction of stock power on its own (no tune stage set).
   * Deliberately conservative. Undefined: no power gain.
   */
  gain?: number;
  /** Only offered for turbo or supercharged engines. */
  forced?: boolean;
  /**
   * False: illegal on the road or an MOT failure (removing a catalyst,
   * de-restricting, pops-and-bangs or anti-lag maps). Shown with a "Not road
   * legal — track/off-road only" tag, never added by "Add typical parts", and
   * worth no rep. People can still log them: they do own them.
   */
  roadLegal?: false;
}

const q = (key: string, name: string, group: ModGroup, vfor: QuickMod['for'], gain?: number, forced?: boolean): QuickMod =>
  ({ key, name, group, for: vfor, gain, forced });
/** A part that's illegal on the road or fails the MOT (see QuickMod.roadLegal). */
const offRoad = (m: QuickMod): QuickMod => ({ ...m, roadLegal: false });

export const QUICK_MODS: QuickMod[] = [
  // Engine
  q('remap', 'ECU remap', 'engine', 'car', 0.1),
  q('flash', 'ECU flash', 'engine', 'bike', 0.04),
  q('fuel-map', 'Fuel controller / map', 'engine', 'bike', 0.02),
  offRoad(q('derestrict', 'De-restricted', 'engine', 'bike')),
  q('dyno-map', 'Custom dyno map', 'engine', 'both', 0.03),
  offRoad(q('pops', 'Pops and bangs map', 'engine', 'car')),
  q('launch', 'Launch control', 'engine', 'car'),
  offRoad(q('antilag', 'Anti-lag', 'engine', 'car', undefined, true)),
  q('cams', 'Fast road cams', 'engine', 'both', 0.05),
  q('forged', 'Forged internals', 'engine', 'car'),
  q('big-bore', 'Big bore kit', 'engine', 'bike', 0.08),
  q('flywheel', 'Lightweight flywheel', 'engine', 'car'),
  q('clutch', 'Uprated clutch', 'engine', 'both'),
  q('lsd', 'Limited-slip diff', 'engine', 'car'),
  q('engine-mounts', 'Uprated engine mounts', 'engine', 'car'),
  q('sprockets', 'Sprocket / chain kit', 'engine', 'bike'),
  // Intake
  q('air-filter', 'Panel air filter', 'intake', 'both', 0.01),
  q('induction', 'Induction kit', 'intake', 'car', 0.02),
  q('cai', 'Cold air intake', 'intake', 'car', 0.02),
  q('turbo-inlet', 'Turbo inlet', 'intake', 'car', 0.01, true),
  q('throttle-body', 'Big throttle body', 'intake', 'car', 0.02),
  q('stacks', 'Velocity stacks', 'intake', 'bike', 0.02),
  q('airbox', 'Airbox mod / ram air', 'intake', 'bike', 0.01),
  // Exhaust
  q('cat-back', 'Cat-back exhaust', 'exhaust', 'car', 0.02),
  q('turbo-back', 'Turbo-back exhaust', 'exhaust', 'car', 0.05, true),
  q('downpipe', 'Downpipe with sports cat', 'exhaust', 'car', 0.04, true),
  offRoad(q('decat', 'Decat / cat delete', 'exhaust', 'car', 0.01)),
  offRoad(q('straight-through', 'Straight-through (no cat)', 'exhaust', 'car', 0.01)),
  q('sports-cat', 'Sports cat', 'exhaust', 'car', 0.02),
  q('manifold', 'Exhaust manifold', 'exhaust', 'car', 0.03),
  q('full-exhaust', 'Full exhaust', 'exhaust', 'car', 0.04),
  q('valved', 'Valved exhaust', 'exhaust', 'car'),
  q('slip-on', 'Slip-on / end can', 'exhaust', 'bike', 0.02),
  q('full-system', 'Full system exhaust', 'exhaust', 'bike', 0.05),
  offRoad(q('decat-bike', 'De-cat link pipe', 'exhaust', 'bike', 0.02)),
  // Turbo / forced induction
  q('intercooler', 'Uprated intercooler', 'turbo', 'car', 0.03, true),
  q('hybrid-turbo', 'Hybrid turbo', 'turbo', 'car', 0.2, true),
  q('big-turbo', 'Big turbo conversion', 'turbo', 'car', 0.35, true),
  q('boost-pipes', 'Boost pipes', 'turbo', 'car', 0.01, true),
  q('dump-valve', 'Dump / blow-off valve', 'turbo', 'car', undefined, true),
  q('pulley', 'Supercharger pulley', 'turbo', 'car', 0.08),
  q('turbo-kit', 'Turbo / supercharger kit', 'turbo', 'both', 0.4),
  // Fuel
  q('hpfp', 'Uprated HPFP', 'fuel', 'car', undefined, true),
  q('lpfp', 'Uprated LPFP', 'fuel', 'car'),
  q('injectors', 'Bigger injectors', 'fuel', 'car'),
  q('e85', 'E85 / flex fuel', 'fuel', 'car', 0.08, true),
  q('meth', 'Water-meth injection', 'fuel', 'car', 0.05, true),
  q('fuel-reg', 'Fuel pressure regulator', 'fuel', 'car'),
  // Cooling
  q('oil-cooler', 'Oil cooler', 'cooling', 'both'),
  q('radiator', 'Alloy radiator', 'cooling', 'both'),
  q('silicone-hoses', 'Silicone hoses', 'cooling', 'both'),
  q('catch-can', 'Oil catch can', 'cooling', 'car'),
  // Suspension
  q('coilovers', 'Coilovers', 'suspension', 'car'),
  q('lowering-springs', 'Lowering springs', 'suspension', 'car'),
  q('air-ride', 'Air ride', 'suspension', 'car'),
  q('arb', 'Anti-roll bars', 'suspension', 'car'),
  q('strut-brace', 'Strut brace', 'suspension', 'car'),
  q('bushes', 'Poly bushes', 'suspension', 'car'),
  q('arms', 'Adjustable arms', 'suspension', 'car'),
  q('fork-springs', 'Fork springs / cartridges', 'suspension', 'bike'),
  q('rear-shock', 'Aftermarket rear shock', 'suspension', 'bike'),
  q('steering-damper', 'Steering damper', 'suspension', 'bike'),
  q('lowering-link', 'Lowering / raising link', 'suspension', 'bike'),
  // Brakes
  q('bbk', 'Big brake kit', 'brakes', 'car'),
  q('pads-discs', 'Uprated pads and discs', 'brakes', 'both'),
  q('braided', 'Braided lines', 'brakes', 'both'),
  q('master-cyl', 'Radial master cylinder', 'brakes', 'bike'),
  q('hydro-handbrake', 'Hydraulic handbrake', 'brakes', 'car'),
  // Wheels and tyres
  q('wheels', 'Aftermarket wheels', 'wheels', 'both'),
  q('forged-wheels', 'Forged wheels', 'wheels', 'both'),
  q('tyres', 'Performance tyres', 'wheels', 'both'),
  q('semi-slicks', 'Semi-slicks', 'wheels', 'car'),
  q('spacers', 'Wheel spacers', 'wheels', 'car'),
  q('studs', 'Stud conversion', 'wheels', 'car'),
  // Body
  q('wrap', 'Wrap', 'body', 'both'),
  q('respray', 'Respray', 'body', 'both'),
  q('tints', 'Window tints', 'body', 'car'),
  q('debadge', 'Debadged', 'body', 'car'),
  q('wide-arch', 'Wide arch kit', 'body', 'car'),
  q('bonnet', 'Carbon / vented bonnet', 'body', 'car'),
  q('mirrors', 'Carbon mirror caps', 'body', 'car'),
  q('tail-tidy', 'Tail tidy', 'body', 'bike'),
  q('fairings', 'Race fairings', 'body', 'bike'),
  q('screen', 'Double-bubble screen', 'body', 'bike'),
  q('frame-sliders', 'Crash bungs / frame sliders', 'body', 'bike'),
  // Aero
  q('splitter', 'Front splitter', 'aero', 'car'),
  q('side-skirts', 'Side skirts', 'aero', 'car'),
  q('diffuser', 'Rear diffuser', 'aero', 'car'),
  q('spoiler', 'Spoiler / wing', 'aero', 'car'),
  q('canards', 'Canards', 'aero', 'car'),
  q('winglets', 'Winglets', 'aero', 'bike'),
  // Interior
  q('buckets', 'Bucket seats', 'interior', 'car'),
  q('harnesses', 'Harnesses', 'interior', 'car'),
  q('cage', 'Roll cage', 'interior', 'car'),
  q('wheel', 'Aftermarket steering wheel', 'interior', 'car'),
  q('quick-release', 'Quick-release boss', 'interior', 'car'),
  q('short-shift', 'Short shifter', 'interior', 'car'),
  q('gauges', 'Boost / oil gauges', 'interior', 'car'),
  q('stripped', 'Stripped interior', 'interior', 'car'),
  // Bike controls
  q('quickshifter', 'Quickshifter', 'controls', 'bike'),
  q('autoblipper', 'Auto-blipper', 'controls', 'bike'),
  q('rearsets', 'Rearsets', 'controls', 'bike'),
  q('clip-ons', 'Clip-ons', 'controls', 'bike'),
  q('levers', 'Adjustable levers', 'controls', 'bike'),
  q('bar-ends', 'Bar-end mirrors', 'controls', 'bike'),
  q('dash', 'Aftermarket dash / datalogger', 'controls', 'bike'),
  // Lighting
  q('led', 'LED headlights', 'lighting', 'both'),
  q('hid', 'HID conversion', 'lighting', 'car'),
  q('light-bar', 'Light bar / spots', 'lighting', 'car'),
  q('indicators', 'LED indicators', 'lighting', 'bike'),
  q('underglow', 'Underglow', 'lighting', 'both'),
  // Audio
  q('head-unit', 'Head unit / CarPlay', 'audio', 'car'),
  q('sub', 'Subwoofer', 'audio', 'car'),
  q('amp', 'Amplifier', 'audio', 'car'),
  q('speakers', 'Speaker upgrade', 'audio', 'car'),
  q('bike-audio', 'Helmet comms / speakers', 'audio', 'bike'),
];
