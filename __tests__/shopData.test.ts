import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SHOP_DATA } from '../src/data/shops';
import { CATEGORY_ORDER, fromMask } from '../src/lib/shopCategories';
import { decodeTile } from '../src/lib/shopCodec';
import { shopIndex } from '../src/lib/shopData';
import { shopsForView, DEFAULT_SHOP_FILTER } from '../src/lib/shops';

describe('bundled shop data (OpenStreetMap)', () => {
  const all = Object.entries(SHOP_DATA.tiles).flatMap(([k, s]) => decodeTile(k, s, SHOP_DATA.dict));

  test('every record decodes, is named, in the UK and in a category', () => {
    expect(all.length).toBe(SHOP_DATA.count);
    expect(all.length).toBeGreaterThan(10_000);
    for (const s of all) {
      expect(s.name.length).toBeGreaterThan(0);
      expect(s.name).not.toMatch(/^\^/);
      expect(s.at.lat).toBeGreaterThan(49.8);
      expect(s.at.lat).toBeLessThan(61);
      expect(s.at.lng).toBeGreaterThan(-8.7);
      expect(s.at.lng).toBeLessThan(1.9);
      expect(fromMask(s.mask).length).toBeGreaterThan(0);
      if (s.website) expect(s.website).toMatch(/^https?:\/\/[^\s/]+\.[^\s]+$/);
      if (s.phone) expect(s.phone).toMatch(/^(0\d{9,10}|\+\d{7,15})$/);
    }
  });

  test('counts per category match the records', () => {
    for (const c of CATEGORY_ORDER) {
      const n = all.filter((s) => fromMask(s.mask).includes(c)).length;
      expect(SHOP_DATA.counts[c]).toBe(n);
    }
  });

  test('every kind is there nationwide', () => {
    for (const c of CATEGORY_ORDER) expect(SHOP_DATA.counts[c]).toBeGreaterThan(0);
  });

  test('stays small enough for an over-the-air update', () => {
    const bytes = readFileSync(join(__dirname, '../src/data/shops.ts')).length;
    expect(bytes).toBeLessThan(1_000_000);
  });

  test('loads lazily and finds shops in a town', () => {
    const index = shopIndex();
    expect(index.decodedTiles).toBe(0);
    const v = shopsForView(index, { lat: 52.48, lng: -1.9 }, 0.2, DEFAULT_SHOP_FILTER);
    expect(v.shops.length).toBeGreaterThan(20);
    expect(index.decodedTiles).toBeLessThanOrEqual(2);
  });
});
