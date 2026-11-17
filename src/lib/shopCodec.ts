import type { LatLng } from './types';

/**
 * Compact encoding for the bundled shop dataset (src/data/shops.ts), from
 * OpenStreetMap. Shops are grouped into 1° × 1° tiles so the app only decodes
 * the tiles on screen. In a tile, records are joined by "~"; each is
 *
 *   3 chars  latitude offset inside the tile, in 1e-5 degrees (about 1 m)
 *   3 chars  longitude offset inside the tile, in 1e-5 degrees
 *   2 chars  categories, a bitmask (shopCategories.ts)
 *   then     name|brand|hours|website|phone, trailing empty fields left off
 *
 * A field starting with "^" is a reference into the dataset's shared strings
 * (chain names, brands and common opening hours), as a base-64 number.
 * Websites are stored without "https://"; phone numbers as digits with a
 * leading 0 for +44.
 *
 * Self-contained (type imports only): scripts/fetch-shops.mjs imports it with Node.
 */

export const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
const VAL: Record<string, number> = {};
for (let i = 0; i < B64.length; i++) VAL[B64[i]] = i;

export const RECORD_SEP = '~';
export const FIELD_SEP = '|';
export const REF = '^';

export interface ShopRecord {
  at: LatLng;
  /** Category bitmask (shopCategories.ts). */
  mask: number;
  name: string;
  brand?: string;
  hours?: string;
  website?: string;
  phone?: string;
}

export interface DecodedShop extends ShopRecord {
  /** Stable for one dataset: tile key and position in the tile. */
  id: string;
}

/** The bundled dataset as written by scripts/fetch-shops.mjs. */
export interface ShopDataset {
  /** Day the data was read (YYYY-MM-DD). */
  generated: string;
  count: number;
  /** Shops per category (a shop in two categories counts in both). */
  counts: Record<string, number>;
  /** Shared strings, referenced from records as "^" + base-64 index. */
  dict: string[];
  /** Tile key -> encoded shops (see the top of this file). */
  tiles: Record<string, string>;
}

export function tileKey(p: LatLng): string {
  return `${Math.floor(p.lat)}_${Math.floor(p.lng)}`;
}

function tileOrigin(key: string): LatLng {
  const [lat, lng] = key.split('_').map(Number);
  return { lat, lng };
}

function put(n: number, chars: number): string {
  let out = '';
  for (let i = chars - 1; i >= 0; i--) out += B64[(n >> (6 * i)) & 63];
  return out;
}

function get(s: string, at: number, chars: number): number {
  let n = 0;
  for (let i = 0; i < chars; i++) n = (n << 6) | (VAL[s[at + i]] ?? 0);
  return n;
}

function num(s: string): number {
  let n = 0;
  for (const ch of s) n = n * 64 + (VAL[ch] ?? 0);
  return n;
}

function b64(n: number): string {
  let out = '';
  do {
    out = B64[n % 64] + out;
    n = Math.floor(n / 64);
  } while (n > 0);
  return out;
}

/** Strip the separators and the reference mark from free text. */
export function clean(s: string | undefined): string {
  if (!s) return '';
  return s
    .replace(/[|~]/g, '/')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .replace(/^\^+/, '');
}

/** "https://www.example.co.uk/" -> "www.example.co.uk". http:// is kept, so it's never wrongly upgraded. */
export function packWebsite(raw: string | undefined): string {
  if (!raw) return '';
  let w = raw.split(';')[0].trim();
  if (!w) return '';
  if (!/^https?:\/\//i.test(w)) w = `https://${w}`;
  if (!/^https?:\/\/[^\s/]+\.[^\s/]+/i.test(w)) return '';
  w = w.replace(/^https:\/\//i, '').replace(/\/+$/, '');
  return clean(w);
}

export function unpackWebsite(w: string | undefined): string | undefined {
  if (!w) return undefined;
  return /^http:\/\//i.test(w) ? w : `https://${w}`;
}

/** "+44 1234 567890" -> "01234567890". Numbers that don't look like phone numbers are dropped. */
export function packPhone(raw: string | undefined): string {
  if (!raw) return '';
  const first = raw.split(/[;,/]/)[0];
  let d = first.replace(/[^\d+]/g, '');
  if (d.startsWith('+44')) d = `0${d.slice(3).replace(/^0/, '')}`;
  else if (d.startsWith('0044')) d = `0${d.slice(4).replace(/^0/, '')}`;
  else if (d.startsWith('+')) return d.length >= 8 && d.length <= 16 ? d : '';
  d = d.replace(/\+/g, '');
  return /^0\d{9,10}$/.test(d) ? d : '';
}

/** Builds the shared-strings table from every field value used at least `min` times. */
export function buildDict(records: ShopRecord[], min = 4): string[] {
  const seen = new Map<string, number>();
  for (const r of records)
    for (const v of [r.name, r.brand, r.hours])
      if (v && v.length > 3) seen.set(v, (seen.get(v) ?? 0) + 1);
  // Most used first, so they get the shortest references.
  return [...seen.entries()]
    .filter(([v, n]) => n >= min && (n - 1) * (v.length - 3) > v.length)
    .sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))
    .map(([v]) => v);
}

export function encodeRecord(r: ShopRecord, key: string, dict: Map<string, number>): string {
  const o = tileOrigin(key);
  const dLat = Math.min(99_999, Math.max(0, Math.round((r.at.lat - o.lat) * 1e5)));
  const dLng = Math.min(99_999, Math.max(0, Math.round((r.at.lng - o.lng) * 1e5)));
  const ref = (v: string | undefined) => {
    const c = clean(v);
    const i = dict.get(c);
    return i === undefined ? c : REF + b64(i);
  };
  const fields = [ref(r.name), ref(r.brand), ref(r.hours), clean(r.website), clean(r.phone)];
  while (fields.length > 1 && !fields[fields.length - 1]) fields.pop();
  return put(dLat, 3) + put(dLng, 3) + put(r.mask & 4095, 2) + fields.join(FIELD_SEP);
}

/** Group records into tiles and build the dataset. Sorted, so a rebuild with the same data gives the same file. */
export function encodeDataset(records: ShopRecord[], generated: string, counts: Record<string, number>): ShopDataset {
  const dict = buildDict(records);
  const index = new Map(dict.map((v, i) => [v, i]));
  const byTile = new Map<string, string[]>();
  for (const r of records) {
    const key = tileKey(r.at);
    const list = byTile.get(key) ?? [];
    list.push(encodeRecord(r, key, index));
    byTile.set(key, list);
  }
  const tiles: Record<string, string> = {};
  for (const key of [...byTile.keys()].sort()) tiles[key] = byTile.get(key)!.sort().join(RECORD_SEP);
  return { generated, count: records.length, counts, dict, tiles };
}

export function decodeTile(key: string, s: string, dict: readonly string[]): DecodedShop[] {
  if (!s) return [];
  const o = tileOrigin(key);
  const deref = (v: string | undefined) => (!v ? undefined : v[0] === REF ? dict[num(v.slice(1))] : v);
  return s.split(RECORD_SEP).map((rec, i) => {
    const [name, brand, hours, website, phone] = rec.slice(8).split(FIELD_SEP);
    const b = deref(brand);
    const h = deref(hours);
    return {
      id: `${key}:${i}`,
      at: { lat: Math.round((o.lat + get(rec, 0, 3) / 1e5) * 1e5) / 1e5, lng: Math.round((o.lng + get(rec, 3, 3) / 1e5) * 1e5) / 1e5 },
      mask: get(rec, 6, 2),
      name: deref(name) ?? '',
      ...(b ? { brand: b } : {}),
      ...(h ? { hours: h } : {}),
      ...(website ? { website: unpackWebsite(website) } : {}),
      ...(phone ? { phone } : {}),
    };
  });
}
