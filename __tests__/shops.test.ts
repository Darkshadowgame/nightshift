import { markLegacyShopRefs } from '../src/lib/feedbackQueue';
import { categoriesFromTags, fromMask, isMeetFriendly, shopFilterNote, toMask, ALL_CATEGORIES } from '../src/lib/shopCategories';
import { buildDict, decodeTile, encodeDataset, packPhone, packWebsite, unpackWebsite, type ShopRecord } from '../src/lib/shopCodec';
import {
  directionsLinks,
  formatPhone,
  matchesShopFilter,
  MAX_SHOP_PINS,
  phoneLink,
  safeWebLink,
  SHOP_MAX_SPAN,
  ShopIndex,
  shopsForView,
  toggleCategory,
  websiteLabel,
  DEFAULT_SHOP_FILTER,
} from '../src/lib/shops';
import { demoPartners, partnerBadge, partnerFromRow, type Partner } from '../src/lib/partners';
import { DEMO_PARTNERS, PARTNERS } from '../src/data/partners';
import { makeSuggestion } from '../src/lib/feedbackQueue';
import { DEFAULT_SETTINGS, upgradeSettings } from '../src/lib/settings';

describe('categories from OpenStreetMap tags', () => {
  test('everyday garages, parts, tyres and dealers', () => {
    expect(categoriesFromTags({ shop: 'car_repair', name: 'Smith Motors' })).toEqual(['garage']);
    expect(categoriesFromTags({ amenity: 'vehicle_inspection', name: 'Town MOT Centre' })).toEqual(['garage']);
    expect(categoriesFromTags({ shop: 'car_parts', name: 'Euro Car Parts' })).toEqual(['parts']);
    expect(categoriesFromTags({ shop: 'tyres', name: 'National Tyres' })).toEqual(['tyres']);
    expect(categoriesFromTags({ shop: 'car', name: 'Arnold Clark' })).toEqual(['dealer']);
    expect(categoriesFromTags({ shop: 'car_repair', name: 'Fast Fit', 'service:vehicle:tyres': 'yes' })).toEqual(['tyres', 'garage']);
  });

  test('tuning from tags or from the name', () => {
    expect(categoriesFromTags({ shop: 'car_repair', name: 'Bob’s', 'service:vehicle:tuning': 'yes' })).toEqual(['tuning', 'garage']);
    expect(categoriesFromTags({ shop: 'car_repair', name: 'Black Magic Performance Centre' })).toEqual(['tuning', 'garage']);
    expect(categoriesFromTags({ shop: 'car_parts', name: 'K-Tec Racing' })).toEqual(['tuning', 'parts']);
    expect(categoriesFromTags({ shop: 'car_repair', description: 'Defender rebuilds', 'service:vehicle:custom_modification': 'yes' })).toContain('tuning');
  });

  test('dyno and rolling road by name, as the tag is rare', () => {
    expect(categoriesFromTags({ shop: 'motorcycle_repair', name: 'Sussex Rolling Road' })).toEqual(['dyno', 'garage']);
    expect(categoriesFromTags({ shop: 'car_repair', name: 'Fred’s', description: 'Dyno days every month' })).toContain('dyno');
    expect(categoriesFromTags({ leisure: 'dyno', name: 'Power Cell' })).toEqual(['dyno']);
    // Not a vehicle business: a "Dyno-Rod" drain van or a gym doesn't count.
    expect(categoriesFromTags({ shop: 'hardware', name: 'Dyno Rod' })).toEqual([]);
  });

  test('bike dealers, and bike kit shops', () => {
    expect(categoriesFromTags({ shop: 'motorcycle', name: 'Southampton Harley-Davidson', 'motorcycle:clothes': 'yes' })).toEqual(['dealer', 'gear']);
    expect(categoriesFromTags({ shop: 'motorcycle', name: 'Helmet City' })).toEqual(['gear']);
    expect(categoriesFromTags({ shop: 'motorcycle', name: 'Two Wheels' })).toEqual(['dealer']);
    expect(categoriesFromTags({ shop: 'clothes', clothes: 'motorcycle', name: 'Gearbox' })).toEqual(['gear']);
    expect(categoriesFromTags({ shop: 'clothes', name: 'Next' })).toEqual([]);
    expect(categoriesFromTags({ shop: 'bicycle', name: 'Halfords Cycles' })).toEqual([]);
  });

  test('detailing, wraps and tints; plain hand car washes stay off', () => {
    expect(categoriesFromTags({ amenity: 'car_wash', name: 'Gemclean Detailing' })).toEqual(['detailing']);
    expect(categoriesFromTags({ amenity: 'car_wash', name: 'Hand Car Wash' })).toEqual([]);
    expect(categoriesFromTags({ shop: 'car_repair', name: 'Explosive Wraps' })).toEqual(['detailing', 'garage']);
    expect(categoriesFromTags({ craft: 'window_tinting', name: 'On Point Tint' })).toEqual(['detailing']);
  });

  test('cafés only when they say they’re for bikers or drivers', () => {
    expect(isMeetFriendly({ amenity: 'cafe', name: 'The Bikers Loft' })).toBe(true);
    expect(isMeetFriendly({ amenity: 'cafe', name: 'Loomies Moto Café' })).toBe(true);
    expect(isMeetFriendly({ amenity: 'cafe', name: 'Village Tea Room', biker: 'yes' })).toBe(true);
    expect(isMeetFriendly({ amenity: 'cafe', name: 'Pit Stop Cafe' })).toBe(true);
    expect(isMeetFriendly({ amenity: 'cafe', name: 'Cartland Truck Stop Cafe' })).toBe(true);
    expect(isMeetFriendly({ amenity: 'cafe', name: 'Refuel Cafe (Motorcycle World)' })).toBe(true);
    // Not enough on its own.
    expect(isMeetFriendly({ amenity: 'cafe', name: 'Bike Shed Coffee' })).toBe(false);
    expect(isMeetFriendly({ amenity: 'restaurant', name: 'Moto' })).toBe(false);
    expect(isMeetFriendly({ amenity: 'restaurant', name: 'Sushi Moto' })).toBe(false);
    expect(isMeetFriendly({ amenity: 'restaurant', name: 'Pit Stop Pizza' })).toBe(false);
    expect(isMeetFriendly({ amenity: 'cafe', name: 'Pedallers Pit Stop - Cycle Cafe' })).toBe(false);
    expect(isMeetFriendly({ amenity: 'restaurant', name: 'Golden Cap Pizzeria', description: 'The perfect pitstop on your walk' })).toBe(false);
    expect(isMeetFriendly({ shop: 'bakery', name: 'Biker Buns' })).toBe(false);
    expect(categoriesFromTags({ amenity: 'cafe', name: 'Ace Cafe' })).toEqual(['coffee']);
  });

  test('masks round-trip, main category first', () => {
    const cats = categoriesFromTags({ shop: 'car_parts', name: 'K-Tec Racing' });
    expect(fromMask(toMask(cats))).toEqual(cats);
    expect(fromMask(toMask(['garage', 'dealer']))).toEqual(['dealer', 'garage']);
    expect(fromMask(toMask(ALL_CATEGORIES))).toHaveLength(9);
  });
});

describe('the Shops pill note and filter', () => {
  test('no note when everything shows', () => {
    expect(shopFilterNote(ALL_CATEGORIES, false)).toBeUndefined();
  });
  test('names one kind, counts more, and says partners (it fits the pill)', () => {
    expect(shopFilterNote(['dyno'], false)).toBe('Dyno');
    expect(shopFilterNote(['tuning', 'dyno'], false)).toBe('2 kinds');
    expect(shopFilterNote(ALL_CATEGORIES, true)).toBe('Partners');
    expect(shopFilterNote(['coffee'], true)).toBe('Partners');
    for (const c of ALL_CATEGORIES) expect(shopFilterNote([c], false)!.length).toBeLessThanOrEqual(10);
  });
  test('toggling never leaves nothing on', () => {
    expect(toggleCategory(['tuning'], 'tuning')).toEqual(['tuning']);
    expect(toggleCategory(['tuning'], 'garage')).toEqual(['tuning', 'garage']);
    expect(toggleCategory(['tuning', 'garage'], 'tuning')).toEqual(['garage']);
  });
  test('a shop shows when any of its kinds is on; never with partners only', () => {
    expect(matchesShopFilter(['dealer', 'gear'], { categories: ['gear'], partnersOnly: false })).toBe(true);
    expect(matchesShopFilter(['garage'], { categories: ['gear'], partnersOnly: false })).toBe(false);
    expect(matchesShopFilter(['gear'], { categories: ['gear'], partnersOnly: true })).toBe(false);
  });
  test('settings: off by default with every kind, and old saves gain them', () => {
    expect(DEFAULT_SETTINGS.shops).toBe(false);
    expect(DEFAULT_SETTINGS.shopCategories).toEqual(ALL_CATEGORIES);
    const old = upgradeSettings({ cameras: false } as never, true);
    expect(old.shopCategories).toEqual(ALL_CATEGORIES);
    expect(old.shopPartnersOnly).toBe(false);
  });
});

const recs: ShopRecord[] = [
  { osm: 'n1001', at: { lat: 52.63721, lng: 1.29874 }, mask: toMask(['tuning', 'garage']), name: 'Norwich Performance', hours: 'Mo-Fr 08:00-17:30', website: 'norwichperf.example', phone: '01603123456' },
  { osm: 'n1002', at: { lat: 52.6301, lng: 1.2901 }, mask: toMask(['garage']), name: 'Kwik Fit', hours: 'Mo-Fr 08:00-17:30' },
  { osm: 'n1003', at: { lat: 52.6302, lng: 1.2902 }, mask: toMask(['garage']), name: 'Kwik Fit', hours: 'Mo-Fr 08:00-17:30' },
  { osm: 'n1004', at: { lat: 52.6303, lng: 1.2903 }, mask: toMask(['garage']), name: 'Kwik Fit', hours: 'Mo-Fr 08:00-17:30' },
  { osm: 'n1005', at: { lat: 52.6304, lng: 1.2904 }, mask: toMask(['garage']), name: 'Kwik Fit', brand: 'Kwik Fit Ltd' },
  { osm: 'n1006', at: { lat: 51.50735, lng: -0.12776 }, mask: toMask(['coffee']), name: 'Pipe | Tilde ~ Café' },
];

describe('shop encoding', () => {
  test('round-trips positions to about a metre, with shared strings', () => {
    const data = encodeDataset(recs, '2026-11-17', { garage: 5 });
    expect(data.dict).toEqual(expect.arrayContaining(['Kwik Fit', 'Mo-Fr 08:00-17:30']));
    expect(Object.keys(data.tiles).sort()).toEqual(['51_-1', '52_1']);
    const back = Object.entries(data.tiles).flatMap(([k, s]) => decodeTile(k, s, data.dict));
    expect(back).toHaveLength(6);
    const perf = back.find((s) => s.name === 'Norwich Performance')!;
    expect(perf.at.lat).toBeCloseTo(52.63721, 5);
    expect(perf.at.lng).toBeCloseTo(1.29874, 5);
    expect(fromMask(perf.mask)).toEqual(['tuning', 'garage']);
    expect(perf.hours).toBe('Mo-Fr 08:00-17:30');
    expect(perf.website).toBe('https://norwichperf.example');
    expect(perf.phone).toBe('01603123456');
    expect(back.filter((s) => s.name === 'Kwik Fit')).toHaveLength(4);
    expect(back.find((s) => s.brand)?.brand).toBe('Kwik Fit Ltd');
    // Separators in names can't break the encoding.
    expect(back.find((s) => s.at.lat < 52)!.name).toBe('Pipe / Tilde / Café');
    expect(back.find((s) => s.name === 'Kwik Fit' && !s.hours)?.website).toBeUndefined();
  });

  test('only strings that save space go in the shared table', () => {
    expect(buildDict(recs.slice(0, 2))).toEqual([]);
  });

  test('websites and phone numbers are packed small and safely', () => {
    expect(packWebsite('https://www.example.co.uk/')).toBe('www.example.co.uk');
    expect(packWebsite('example.co.uk')).toBe('example.co.uk');
    expect(packWebsite('http://old.example.com')).toBe('http://old.example.com');
    expect(packWebsite('not a site')).toBe('');
    expect(unpackWebsite('www.example.co.uk')).toBe('https://www.example.co.uk');
    expect(unpackWebsite('http://old.example.com')).toBe('http://old.example.com');
    expect(packPhone('+44 1603 123456')).toBe('01603123456');
    expect(packPhone('+44 (0)20 7946 0000')).toBe('02079460000');
    expect(packPhone('01603 123456; 07700 900123')).toBe('01603123456');
    expect(packPhone('call us')).toBe('');
  });
});

describe('what the Shops layer draws', () => {
  const data = encodeDataset(
    [
      ...Array.from({ length: 150 }, (_, i) => ({ osm: `n${i + 1}`, at: { lat: 52.5 + i * 0.0005, lng: -1.5 }, mask: toMask(['garage']), name: `Garage ${i}` })),
      { osm: 'w77', at: { lat: 52.51, lng: -1.51 }, mask: toMask(['tuning']), name: 'Boost Lab' },
      { osm: 'r78', at: { lat: 52.5001, lng: -1.5001 }, mask: toMask(['detailing']), name: 'Shiny Partner Detailing' },
    ],
    '2026-11-17',
    {},
  );
  const centre = { lat: 52.5, lng: -1.5 };
  const partner: Partner = { id: 'p1', name: 'Shiny Partner Detailing', at: { lat: 52.5, lng: -1.5 }, categories: ['detailing'], label: 'Partner' };

  test('nothing when zoomed out, and no tiles decoded', () => {
    const index = new ShopIndex(data);
    const v = shopsForView(index, centre, SHOP_MAX_SPAN + 0.1, DEFAULT_SHOP_FILTER, [partner]);
    expect(v).toEqual({ shops: [], partners: [], tooWide: true, more: false });
    expect(index.decodedTiles).toBe(0);
  });

  test('nearest first up to the cap, partner first and its OSM listing hidden', () => {
    const index = new ShopIndex(data);
    const v = shopsForView(index, centre, 0.2, DEFAULT_SHOP_FILTER, [partner]);
    expect(v.partners).toEqual([partner]);
    expect(v.shops).toHaveLength(MAX_SHOP_PINS - 1);
    expect(v.more).toBe(true);
    expect(v.shops.some((s) => s.name === 'Shiny Partner Detailing')).toBe(false);
    expect(v.shops[0].name).toBe('Garage 0');
    expect(index.decodedTiles).toBe(1);
  });

  test('the filter narrows it, and partners only shows only partners', () => {
    const index = new ShopIndex(data);
    expect(shopsForView(index, centre, 0.2, { categories: ['tuning'], partnersOnly: false }, [partner]).shops.map((s) => s.name)).toEqual(['Boost Lab']);
    const p = shopsForView(index, centre, 0.2, { categories: ['detailing'], partnersOnly: true }, [partner]);
    expect(p.shops).toEqual([]);
    expect(p.partners).toHaveLength(1);
    expect(shopsForView(index, centre, 0.2, { categories: ['tuning'], partnersOnly: true }, [partner]).partners).toEqual([]);
  });

  test('find by id, and odd ids are safe', () => {
    const index = new ShopIndex(data);
    const s = shopsForView(index, centre, 0.2, { categories: ['tuning'], partnersOnly: false }).shops[0];
    expect(index.find(s.id)?.name).toBe('Boost Lab');
    expect(index.find('partner:x')).toBeUndefined();
    expect(index.find('99_99:0')).toBeUndefined();
  });
});

describe('links on the shop screen', () => {
  test('directions in Apple Maps and Waze', () => {
    const l = directionsLinks({ lat: 52.123456, lng: -1.5 }, 'Boost & Co');
    expect(l.apple).toBe('https://maps.apple.com/?daddr=52.12346,-1.50000&q=Boost%20%26%20Co&dirflg=d');
    expect(l.waze).toBe('https://waze.com/ul?ll=52.12346,-1.50000&navigate=yes');
  });
  test('phone numbers', () => {
    expect(formatPhone('02079460000')).toBe('020 7946 0000');
    expect(formatPhone('01603123456')).toBe('01603 123456');
    expect(formatPhone('01214960000')).toBe('0121 496 0000');
    expect(formatPhone('07700900123')).toBe('07700 900123');
    expect(phoneLink('01603123456')).toBe('tel:+441603123456');
  });
  test('only web links open', () => {
    expect(safeWebLink('https://example.com/a')).toBe('https://example.com/a');
    expect(safeWebLink('javascript:alert(1)')).toBeUndefined();
    expect(safeWebLink('https://nodot')).toBeUndefined();
    expect(websiteLabel('https://www.example.co.uk/')).toBe('example.co.uk');
  });
  test('"Suggest an edit" goes to the feedback queue as an idea', () => {
    const f = makeSuggestion({ missing: 'Closed down', screen: 'shop', context: 'Boost Lab · 52_-2:4' }, 'fb', new Date('2026-11-17T20:00:00Z'));
    expect(f).toMatchObject({ kind: 'idea', screen: 'shop', message: 'Shop edit or missing shop: Closed down\nListing: Boost Lab · 52_-2:4' });
  });
});

describe('partners', () => {
  const row = {
    id: 'u1', name: ' Boost Lab ', description: null, lat: 52.5, lng: -1.5, address: '1 High St', website: 'https://boost.example',
    partner_label: 'Partner', active: true, offer: '10% off', categories: ['tuning', 'nonsense'], phone: null,
  };
  test('a backend row maps to a labelled partner', () => {
    expect(partnerFromRow(row)).toEqual({
      id: 'u1', name: 'Boost Lab', at: { lat: 52.5, lng: -1.5 }, categories: ['tuning'], label: 'Partner',
      offer: '10% off', link: 'https://boost.example', address: '1 High St',
    });
  });
  test('inactive or unlabelled rows never show', () => {
    expect(partnerFromRow({ ...row, active: false })).toBeNull();
    expect(partnerFromRow({ ...row, partner_label: '  ' })).toBeNull();
    expect(partnerFromRow({ ...row, lat: NaN })).toBeNull();
  });
  test('the badge always says partner', () => {
    expect(partnerBadge({ ...partnerFromRow(row)!, label: 'Featured' })).toBe('Featured · Partner');
    expect(partnerBadge({ ...partnerFromRow(row)!, label: 'Sample partner' })).toBe('Sample partner');
  });
  test('production has no partners yet; demo samples are labelled and placed near home', () => {
    expect(PARTNERS).toEqual([]);
    expect(demoPartners(DEMO_PARTNERS, undefined)).toEqual([]);
    const home = { lat: 52.63, lng: 1.3 };
    const demo = demoPartners(DEMO_PARTNERS, home);
    expect(demo.length).toBeGreaterThan(0);
    for (const p of demo) {
      expect(p.demo).toBe(true);
      expect(p.label).toMatch(/sample partner/i);
      expect(p.name).toMatch(/^Sample /);
      expect(Math.abs(p.at.lat - home.lat)).toBeLessThan(0.1);
    }
  });
});

describe('stable shop ids (OpenStreetMap element)', () => {
  test("adding a shop to a tile doesn't change the other shops' ids", () => {
    const base = recs.slice(0, 4);
    const before = Object.entries(encodeDataset(base, 'x', {}).tiles).flatMap(([k, t]) => decodeTile(k, t, encodeDataset(base, 'x', {}).dict));
    const more = [...base, { osm: 'n1', at: { lat: 52.6, lng: 1.2 }, mask: toMask(['garage']), name: 'AAA First' }];
    const d2 = encodeDataset(more, 'x', {});
    const after = Object.entries(d2.tiles).flatMap(([k, t]) => decodeTile(k, t, d2.dict));
    for (const s of before) expect(after.find((x) => x.id === s.id)?.name).toBe(s.name);
    expect(before.map((s) => s.id)).toContain('52_1:n1001');
  });

  test('queued suggestions with an old listing number are marked, names kept', () => {
    const [f] = markLegacyShopRefs([{ id: 'f', kind: 'idea', screen: 'shop', at: '', message: 'Shop edit or missing shop: closed\nListing: Kwik Fit · 52_-2:10' }]);
    expect(f.message).toMatch(/Kwik Fit · 52_-2:10 \(old listing number/);
    const [g] = markLegacyShopRefs([{ id: 'g', kind: 'idea', screen: 'shop', at: '', message: 'Listing: Kwik Fit · 52_-2:n123' }]);
    expect(g.message).toBe('Listing: Kwik Fit · 52_-2:n123');
  });
});
