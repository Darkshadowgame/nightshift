/**
 * Shop categories for the map's Shops layer, and how OpenStreetMap tags map
 * onto them. Pure and self-contained (no imports), so the build script
 * (scripts/fetch-shops.mjs) uses exactly the same rules as the app.
 *
 * A shop can be in more than one category (a bike dealer that sells gear is
 * both); the first one in CATEGORY_ORDER that applies is its main one, which
 * picks the pin's glyph.
 */

export type ShopCategory = 'tuning' | 'parts' | 'gear' | 'dealer' | 'tyres' | 'detailing' | 'dyno' | 'garage' | 'coffee';

/** Priority for a shop's main category, which picks its pin (the most "scene" first; a dealer that also sells parts and kit is a dealer). */
export const CATEGORY_ORDER: ShopCategory[] = ['tuning', 'dyno', 'dealer', 'detailing', 'tyres', 'parts', 'gear', 'garage', 'coffee'];

/** Menu order (as the owner listed them). */
export const MENU_ORDER: ShopCategory[] = ['tuning', 'parts', 'gear', 'dealer', 'tyres', 'detailing', 'dyno', 'garage', 'coffee'];

export const CATEGORY_LABELS: Record<ShopCategory, string> = {
  tuning: 'Tuning and modifications',
  parts: 'Parts and accessories',
  gear: 'Bike gear',
  dealer: 'Dealers',
  tyres: 'Tyres and wheels',
  detailing: 'Detailing, wraps and tints',
  dyno: 'Dyno and rolling road',
  garage: 'Garages and MOT',
  coffee: 'Cafés and meet spots',
};

/** Short names for the pill's filter note and the peek card. */
export const CATEGORY_SHORT: Record<ShopCategory, string> = {
  tuning: 'Tuning',
  parts: 'Parts',
  gear: 'Gear',
  dealer: 'Dealers',
  tyres: 'Tyres',
  detailing: 'Detailing',
  dyno: 'Dyno',
  garage: 'Garages',
  coffee: 'Cafés',
};

/** A line under each menu entry, so it's clear what's in it. */
export const CATEGORY_HINTS: Record<ShopCategory, string> = {
  tuning: 'Tuners, remaps, performance and custom shops',
  parts: 'Car and bike parts and accessories',
  gear: 'Helmets, leathers and riding kit',
  dealer: 'Car and bike dealers',
  tyres: 'Tyre fitters and wheel refurbishers',
  detailing: 'Detailers, valeting, wraps and tints',
  dyno: 'Dyno days and rolling roads',
  garage: 'Repairs, servicing and MOT',
  coffee: 'Biker and car cafés, and meet spots',
};

export const ALL_CATEGORIES: ShopCategory[] = [...MENU_ORDER];

// ---------------------------------------------------------------------------
// Bitmask (the compact encoding stores a shop's categories as one number)
// ---------------------------------------------------------------------------

const BIT: Record<ShopCategory, number> = {
  tuning: 1,
  parts: 2,
  gear: 4,
  dealer: 8,
  tyres: 16,
  detailing: 32,
  dyno: 64,
  garage: 128,
  coffee: 256,
};

export function toMask(cats: readonly ShopCategory[]): number {
  let m = 0;
  for (const c of cats) m |= BIT[c];
  return m;
}

/** Categories in a mask, main one first (CATEGORY_ORDER). */
export function fromMask(mask: number): ShopCategory[] {
  return CATEGORY_ORDER.filter((c) => (mask & BIT[c]) !== 0);
}

// ---------------------------------------------------------------------------
// OpenStreetMap tags -> categories
// ---------------------------------------------------------------------------

export type Tags = Record<string, string | undefined>;

const YES = new Set(['yes', 'only', 'designated', 'true', '1']);
const yes = (v: string | undefined) => !!v && YES.has(v.trim().toLowerCase());

/** Name and description, lower case, for the keyword rules. */
function words(t: Tags): string {
  return [t.name, t.brand, t.description, t.operator, t['name:en']].filter(Boolean).join(' ').toLowerCase();
}

const DYNO = /\bdyno\b|\bdynos\b|dynamometer|rolling road|\bdyno ?(?:centre|center|day|tuning|cell)/;
const TUNING =
  /\btun(?:ing|ed|er|ers)\b|\bremaps?\b|\bremapping\b|\becu\b|performance|motorsport|\bracing\b|\brace\b|\bmods?\b|modif|\bcustoms?\b|fabricat|\bturbo|\bstance\b|\bsuspension\b|\bdrift|\bmotorsports\b|\bspeed shop\b/;
const DETAILING = /\bdetail(?:ing|er|ers|ed)?\b|\bvalet(?:ing)?\b|\bceramic\b|\bppf\b|paint protection|\bwraps?\b|\bwrapping\b|\btint(?:s|ing)?\b|\bvinyl\b|\bpolish(?:ing)?\b|\bsmart repair\b/;
const TYRES = /\btyres?\b|\btires?\b|\bwheels?\b|\balloys?\b|\bwheel refurb/;
const GEAR = /\bhelmets?\b|\bleathers?\b|\briding gear\b|\bbike gear\b|\bmoto(?:rcycle)? (?:gear|clothing|apparel|kit)\b|\bbiker (?:gear|clothing|kit)\b|\bclothing\b|\bapparel\b/;
const BIKE = /\bmotorcycles?\b|\bmotorbikes?\b|\bbikers?\b|\bmoto\b|\bscooters?\b|harley|triumph|ducati|kawasaki|yamaha|suzuki|ktm|husqvarna|royal enfield|bmw motorrad|aprilia/;
/**
 * Cafés and pubs for bikers or drivers. "Bike" alone is usually a bicycle café, and "Moto" alone is
 * the motorway services chain or a sushi bar, so neither is enough.
 */
const MEET_STRONG =
  /\bbikers?\b|\bmotorcycl|\bmotorbik|\bmotorists?\b|petrolhead|caffeine (?:&|and) machine|\bace caf|\bmoto (?:caf|coffee|bites|bar|diner|kitchen)|\btruck ?stop\b|\btransport caf|\bcar ?meets?\b/;
/** Roadside names that count for a café only ("Pit Stop Café", "Route 66 Diner"), never a pizza or sushi place. */
const MEET_ROADSIDE = /\bpit ?stop\b|\broute \d+\b|\bdrive[- ]?in\b/;
const NOT_MEET = /\bcycl|\bbicycl|pedal|pizz|sushi|ramen|kebab|curry|noodle|bento|chinese|indian|thai\b|burger king|mcdonald/;

/** True when a café, restaurant or pub is tagged or named as biker- or motorist-friendly. */
export function isMeetFriendly(t: Tags): boolean {
  const amenity = t.amenity;
  if (amenity !== 'cafe' && amenity !== 'restaurant' && amenity !== 'pub' && amenity !== 'fast_food') return false;
  for (const k of ['biker', 'bikers', 'biker_friendly', 'motorcycle_friendly', 'motorcycle:friendly', 'bikers_welcome', 'motorbike_friendly', 'motorcycle:meeting_point'])
    if (yes(t[k])) return true;
  if (t.meeting_point && /motor|biker|car meet/.test(t.meeting_point.toLowerCase())) return true;
  const name = [t.name, t.brand, t['name:en']].filter(Boolean).join(' ').toLowerCase();
  if (NOT_MEET.test(name)) return false;
  if (MEET_STRONG.test(words(t))) return true;
  return amenity === 'cafe' && MEET_ROADSIDE.test(name);
}

/**
 * Which Shops-layer categories an OpenStreetMap feature belongs to, main one
 * first. Empty when it isn't one of ours (bicycle shops, car hire, plain cafés…).
 */
export function categoriesFromTags(t: Tags): ShopCategory[] {
  const shop = t.shop?.toLowerCase();
  const craft = t.craft?.toLowerCase();
  const amenity = t.amenity?.toLowerCase();
  const text = words(t);
  const svc = (k: string) => yes(t[`service:vehicle:${k}`]);
  const out = new Set<ShopCategory>();

  const vehicleBusiness =
    shop === 'car_repair' ||
    shop === 'car_parts' ||
    shop === 'car' ||
    shop === 'motorcycle' ||
    shop === 'motorcycle_repair' ||
    shop === 'motorcycle_parts' ||
    shop === 'tyres' ||
    shop === 'tuning' ||
    shop === 'car_tuning' ||
    shop === 'car_detailing' ||
    shop === 'detailing' ||
    shop === 'car_wash' ||
    shop === 'vehicle_wrap' ||
    shop === 'window_tinting' ||
    shop === 'car_accessories' ||
    shop === 'wheels' ||
    amenity === 'car_wash' ||
    amenity === 'vehicle_inspection' ||
    craft === 'car_painter' ||
    craft === 'vehicle_wrap' ||
    craft === 'car_repair' ||
    craft === 'window_tinting' ||
    t.leisure === 'dyno';

  if (vehicleBusiness) {
    // Dyno: rare as a tag, so names and descriptions count too.
    if (t.leisure === 'dyno' || svc('dyno') || svc('rolling_road') || DYNO.test(text)) out.add('dyno');
    // Tuning and modifications.
    if (shop === 'tuning' || shop === 'car_tuning' || svc('tuning') || svc('performance') || svc('chiptuning') || svc('custom_modification') || t.car_repair === 'tuning') out.add('tuning');
    else if ((shop === 'car_repair' || shop === 'car_parts' || shop === 'motorcycle_repair' || shop === 'motorcycle_parts' || shop === 'motorcycle' || craft === 'car_repair') && TUNING.test(text)) out.add('tuning');
    // Parts.
    if (shop === 'car_parts' || shop === 'motorcycle_parts' || shop === 'car_accessories' || svc('car_parts') || yes(t['motorcycle:parts'])) out.add('parts');
    // Bike gear (helmets, leathers).
    if (yes(t['motorcycle:clothes']) || yes(t['motorcycle:clothing']) || ((shop === 'motorcycle' || shop === 'motorcycle_parts') && GEAR.test(text))) out.add('gear');
    // Detailing, wraps and tints.
    if (
      shop === 'car_detailing' || shop === 'detailing' || shop === 'vehicle_wrap' || shop === 'window_tinting' ||
      craft === 'vehicle_wrap' || craft === 'window_tinting' || svc('detailing') || svc('wrapping') || svc('window_tinting') || svc('valeting')
    )
      out.add('detailing');
    else if ((amenity === 'car_wash' || shop === 'car_wash') && DETAILING.test(text)) out.add('detailing');
    else if ((shop === 'car_repair' || craft === 'car_painter' || craft === 'car_repair') && DETAILING.test(text)) out.add('detailing');
    // Tyres and wheels.
    if (shop === 'tyres' || shop === 'wheels' || svc('tyres')) out.add('tyres');
    else if ((shop === 'car_repair' || shop === 'car_parts') && TYRES.test(text) && !/\bwheel ?chair/.test(text)) out.add('tyres');
    // Dealers: car and bike sales.
    if (shop === 'car') out.add('dealer');
    if (shop === 'motorcycle') {
      // A bike shop is a dealer unless it's plainly a kit shop ("Helmet City") or says it doesn't sell bikes.
      const kitOnly = out.has('gear') && !yes(t['motorcycle:sales']) && !t.brand && !BIKE.test(text);
      if (!kitOnly && t['motorcycle:sales'] !== 'no') out.add('dealer');
      if (!out.size) out.add(yes(t['motorcycle:repair']) ? 'garage' : 'parts');
    }
    // Garages and MOT: the everyday workshop.
    if (shop === 'car_repair' || shop === 'motorcycle_repair' || amenity === 'vehicle_inspection' || craft === 'car_repair' || svc('mot')) out.add('garage');
    if (craft === 'car_painter' && !out.size) out.add('garage');
  }

  // Bike kit sold by clothes shops.
  if (shop === 'clothes' || shop === 'sports' || shop === 'outdoor') {
    const clothes = (t.clothes ?? '').toLowerCase();
    if (/motorcycle|motorbike|biker/.test(clothes) || yes(t['motorcycle:clothes']) || (BIKE.test(text) && GEAR.test(text))) out.add('gear');
  }

  if (isMeetFriendly(t)) out.add('coffee');

  // Hand car washes with no detailing in the name stay off: there are thousands and they aren't the scene.
  return CATEGORY_ORDER.filter((c) => out.has(c));
}

// ---------------------------------------------------------------------------
// The pill's filter note
// ---------------------------------------------------------------------------

/**
 * The second line on the Shops pill when the filter is narrowed (it has room
 * for about ten letters): one kind by name ("Tuning"), else "3 kinds", and
 * "Partners" for partners only. Undefined when it shows everything.
 */
export function shopFilterNote(cats: readonly ShopCategory[], partnersOnly: boolean): string | undefined {
  if (partnersOnly) return 'Partners';
  if (cats.length >= ALL_CATEGORIES.length) return undefined;
  return cats.length === 1 ? CATEGORY_SHORT[cats[0]] : `${cats.length} kinds`;
}
