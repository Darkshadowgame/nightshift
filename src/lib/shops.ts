import { inBox, tilesFor, viewBox } from './cameras';
import { milesBetween } from './geo';
import type { Partner } from './partners';
import { ALL_CATEGORIES, CATEGORY_LABELS, CATEGORY_SHORT, fromMask, toMask, type ShopCategory } from './shopCategories';
import { decodeTile, type DecodedShop, type ShopDataset } from './shopCodec';
import type { LatLng } from './types';

/**
 * The map's Shops layer: which shops to draw for the part of the map on
 * screen, the category filter, and the links on a shop's screen.
 *
 * Listings are OpenStreetMap's (ODbL), shipped as assets/data/shops.nsdata and
 * decoded one 1° tile at a time when a tile first comes into view. They stay a
 * separate dataset: nothing people type in the app is merged into it
 * (suggested edits go to the feedback queue for the team).
 */

/** Shops show once the map is zoomed in to town level: about 20 miles top to bottom or less. */
export const SHOP_MAX_SPAN = 0.3;
/** At most this many shop pins at once, nearest the middle of the map first. Partners come first. */
export const MAX_SHOP_PINS = 90;

export const SHOP_CREDIT = 'Shops © OpenStreetMap contributors (ODbL)';
export const SHOP_CAVEAT = 'Listing from OpenStreetMap, mapped by volunteers. It may be out of date: check with the business before you go. Not a Slipstream partner.';

export interface Shop {
  id: string;
  at: LatLng;
  categories: ShopCategory[];
  name: string;
  brand?: string;
  hours?: string;
  website?: string;
  phone?: string;
}

export interface ShopFilter {
  categories: ShopCategory[];
  partnersOnly: boolean;
}

export const DEFAULT_SHOP_FILTER: ShopFilter = { categories: [...ALL_CATEGORIES], partnersOnly: false };

function toShop(d: DecodedShop): Shop {
  const { mask, ...rest } = d;
  return { ...rest, categories: fromMask(mask) };
}

/** Decodes tiles on first use and keeps them. */
export class ShopIndex {
  private tiles = new Map<string, Shop[]>();
  constructor(private data: ShopDataset) {}

  get count(): number {
    return this.data.count;
  }

  get generated(): string {
    return this.data.generated;
  }

  get counts(): Record<string, number> {
    return this.data.counts;
  }

  tile(key: string): Shop[] {
    let t = this.tiles.get(key);
    if (!t) {
      const raw = this.data.tiles[key];
      t = raw ? decodeTile(key, raw, this.data.dict).map(toShop) : [];
      this.tiles.set(key, t);
    }
    return t;
  }

  /** How many tiles have been decoded so far (for tests). */
  get decodedTiles(): number {
    return this.tiles.size;
  }

  find(id: string): Shop | undefined {
    const key = id.slice(0, id.lastIndexOf(':'));
    if (!/^-?\d+_-?\d+$/.test(key)) return undefined;
    return this.tile(key).find((s) => s.id === id);
  }
}

/** Shown under this filter? Any one of its categories being on is enough. */
export function matchesShopFilter(categories: readonly ShopCategory[], f: ShopFilter): boolean {
  if (f.partnersOnly) return false;
  const on = toMask(f.categories);
  return (toMask(categories) & on) !== 0;
}

export function matchesPartnerFilter(p: Partner, f: ShopFilter): boolean {
  return p.categories.some((c) => f.categories.includes(c));
}

/** Turn one category on or off; never leaves none (that's what the layer toggle is for). */
export function toggleCategory(cats: readonly ShopCategory[], c: ShopCategory): ShopCategory[] {
  const next = cats.includes(c) ? cats.filter((x) => x !== c) : ALL_CATEGORIES.filter((x) => x === c || cats.includes(x));
  return next.length ? next : [...cats];
}

/** Same business? Used to hide the OpenStreetMap listing under a partner's pin. */
function sameName(a: string, b: string): boolean {
  const n = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const x = n(a);
  const y = n(b);
  return !!x && !!y && (x === y || x.includes(y) || y.includes(x));
}

/**
 * What the Shops layer draws for this view: nothing when zoomed out too far
 * (`tooWide`), otherwise partners that match the filter, then the nearest
 * matching shops to the centre, up to the cap.
 */
export function shopsForView(
  index: ShopIndex,
  centre: LatLng,
  span: number,
  filter: ShopFilter,
  partners: readonly Partner[] = [],
  max = MAX_SHOP_PINS,
): { shops: Shop[]; partners: Partner[]; tooWide: boolean; more: boolean } {
  if (span > SHOP_MAX_SPAN) return { shops: [], partners: [], tooWide: true, more: false };
  const b = viewBox(centre, span);
  const ps = partners.filter((p) => inBox(p.at, b) && matchesPartnerFilter(p, filter));
  if (filter.partnersOnly) return { shops: [], partners: ps, tooWide: false, more: false };
  const room = Math.max(0, max - ps.length);
  const near = tilesFor(b)
    .flatMap((k) => index.tile(k))
    .filter((s) => inBox(s.at, b) && matchesShopFilter(s.categories, filter))
    // The partner's own pin replaces its OpenStreetMap listing.
    .filter((s) => !ps.some((p) => milesBetween(p.at, s.at) < 0.05 && sameName(p.name, s.name)))
    .map((s) => ({ s, d: milesBetween(centre, s.at) }))
    .sort((x, y) => x.d - y.d);
  return { shops: near.slice(0, room).map((x) => x.s), partners: ps, tooWide: false, more: near.length > room };
}

/** Shop pins stay small: a compact badge, a little bigger at street level. */
export function shopPinSize(span: number): number {
  return span <= 0.05 ? 20 : 16;
}

/** "Tuning · Parts" (the main category first). */
export function describeCategories(cats: readonly ShopCategory[], short = true): string {
  return cats.map((c) => (short ? CATEGORY_SHORT[c] : CATEGORY_LABELS[c])).join(' · ');
}

/** "01234 567890", "020 7946 0000", "07700 900123". Other numbers come back as they are. */
export function formatPhone(p: string): string {
  if (!/^0\d{9,10}$/.test(p)) return p;
  if (/^02/.test(p)) return `${p.slice(0, 3)} ${p.slice(3, 7)} ${p.slice(7)}`;
  if (/^0[3589]/.test(p) || /^07/.test(p)) return `${p.slice(0, 5)} ${p.slice(5)}`;
  if (/^01\d1/.test(p) || /^011/.test(p)) return `${p.slice(0, 4)} ${p.slice(4, 7)} ${p.slice(7)}`;
  return `${p.slice(0, 5)} ${p.slice(5)}`;
}

/** tel: link, in international form. */
export function phoneLink(p: string): string {
  const d = p.replace(/[^\d+]/g, '');
  return `tel:${d.startsWith('0') ? `+44${d.slice(1)}` : d}`;
}

/** "example.co.uk" for showing a website. */
export function websiteLabel(url: string): string {
  return url.replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/$/, '');
}

/** Only web links open from a listing (OSM text could hold anything). */
export function safeWebLink(url: string | undefined): string | undefined {
  if (!url) return undefined;
  return /^https?:\/\/[^\s/]+\.[^\s]+$/i.test(url) ? url : undefined;
}

/** Directions in Apple Maps and Waze (universal links: they open the app when it's installed). */
export function directionsLinks(at: LatLng, name: string): { apple: string; waze: string } {
  const ll = `${at.lat.toFixed(5)},${at.lng.toFixed(5)}`;
  return {
    apple: `https://maps.apple.com/?daddr=${ll}&q=${encodeURIComponent(name)}&dirflg=d`,
    waze: `https://waze.com/ul?ll=${ll}&navigate=yes`,
  };
}
