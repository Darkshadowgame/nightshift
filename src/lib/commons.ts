import { milesBetween } from './geo';
import type { LatLng } from './types';

/**
 * Public photos near a place from Wikimedia Commons (free geosearch API), for
 * the photo spot, drive and track screens. Pure helpers: the request URL, the
 * response parser and filter, and the cache rules. The fetch itself is in
 * commonsClient.ts.
 *
 * Only the coordinates of a public place are sent (no user data), to
 * commons.wikimedia.org only. Every photo keeps its author and licence, shown
 * under it, and opens its Commons page when tapped.
 */

export const COMMONS_API = 'https://commons.wikimedia.org/w/api.php';

export interface CommonsPhoto {
  title: string;
  /** Small image for the strip. */
  thumb: string;
  width: number;
  height: number;
  /** The file's page on Commons: credit, licence and the full image. */
  page: string;
  /** Plain text, e.g. "Jane Smith". */
  author: string;
  /** e.g. "CC BY-SA 4.0". */
  licence: string;
  licenceUrl?: string;
  at?: LatLng;
  /** From the place searched, in miles. */
  miles?: number;
}

/** Thumbnail width asked for. Commons rounds it to one of its standard sizes. */
export const THUMB_WIDTH = 360;
/** Commons allows up to 10 km. */
export const MAX_RADIUS_M = 10_000;

/** One request: geosearch for files near the point, with thumbnail, author and licence. */
export function commonsUrl(at: LatLng, radiusM: number, limit = 24): string {
  const params: [string, string][] = [
    ['action', 'query'],
    ['format', 'json'],
    ['formatversion', '2'],
    ['origin', '*'],
    ['generator', 'geosearch'],
    ['ggsnamespace', '6'],
    ['ggscoord', `${at.lat.toFixed(5)}|${at.lng.toFixed(5)}`],
    ['ggsradius', String(Math.round(Math.min(MAX_RADIUS_M, Math.max(10, radiusM))))],
    ['ggslimit', String(limit)],
    ['prop', 'imageinfo|coordinates'],
    ['iiprop', 'url|extmetadata|mime|size'],
    ['iiurlwidth', String(THUMB_WIDTH)],
    ['iiextmetadatafilter', 'Artist|LicenseShortName|LicenseUrl|ObjectName'],
  ];
  return `${COMMONS_API}?${params.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&')}`;
}

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', '#39': "'" };

/** HTML from Commons metadata to plain text: tags dropped, entities decoded, spaces tidied. */
export function plainText(html: string | undefined): string {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&(#\d+|#x[0-9a-f]+|[a-z]+);/gi, (m, e: string) => {
      if (ENTITIES[e.toLowerCase()]) return ENTITIES[e.toLowerCase()];
      if (e[0] === '#') {
        const n = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
        return Number.isFinite(n) ? String.fromCodePoint(n) : m;
      }
      return m;
    })
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Obviously not a photo of the place: maps, diagrams, logos, flags, scanned
 * pages, and anything that isn't a JPEG, PNG or WebP photo or is tiny.
 */
export function isIrrelevant(title: string, mime: string | undefined, width: number): boolean {
  if (mime && !/^image\/(jpeg|png|webp)$/.test(mime)) return true;
  if (width > 0 && width < 400) return true;
  const t = title.toLowerCase();
  return /\b(map|maps|plan|diagram|logo|coat of arms|flag|locator|location|chart|graph|scan|page \d|document|blank|icon|svg|route ?map|layout|timetable|leaflet|poster)\b/.test(t);
}

interface RawPage {
  title?: string;
  coordinates?: { lat: number; lon: number }[];
  imageinfo?: {
    thumburl?: string;
    thumbwidth?: number;
    thumbheight?: number;
    descriptionurl?: string;
    mime?: string;
    width?: number;
    extmetadata?: Record<string, { value?: string } | undefined>;
  }[];
}

/**
 * The photos in a Commons answer, nearest first, with irrelevant ones left
 * out. Photos whose title names the place (e.g. "Snetterton") come first.
 * Never throws: a broken answer gives an empty list.
 */
export function parseCommons(json: unknown, at: LatLng, placeName = ''): CommonsPhoto[] {
  const pages = (json as { query?: { pages?: RawPage[] | Record<string, RawPage> } } | null)?.query?.pages;
  if (!pages) return [];
  const list: RawPage[] = Array.isArray(pages) ? pages : Object.values(pages);
  const words = placeName
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 4 && !['park', 'road', 'circuit', 'pass', 'hill', 'view', 'point', 'lane', 'motor', 'race', 'track'].includes(w));
  const out: (CommonsPhoto & { named: boolean })[] = [];
  for (const p of list) {
    const info = p.imageinfo?.[0];
    if (!p.title || !info?.thumburl || !info.descriptionurl) continue;
    if (isIrrelevant(p.title, info.mime, info.width ?? 0)) continue;
    const meta = info.extmetadata ?? {};
    const c = p.coordinates?.[0];
    const where = c ? { lat: c.lat, lng: c.lon } : undefined;
    const title = plainText(meta.ObjectName?.value) || p.title.replace(/^File:/, '').replace(/\.[a-z0-9]+$/i, '');
    out.push({
      title,
      thumb: info.thumburl,
      width: info.thumbwidth ?? THUMB_WIDTH,
      height: info.thumbheight ?? Math.round(THUMB_WIDTH * 0.75),
      page: info.descriptionurl,
      author: plainText(meta.Artist?.value) || 'Unknown author',
      licence: plainText(meta.LicenseShortName?.value) || 'See the file page',
      ...(meta.LicenseUrl?.value ? { licenceUrl: plainText(meta.LicenseUrl.value) } : {}),
      ...(where ? { at: where, miles: milesBetween(at, where) } : {}),
      named: words.some((w) => title.toLowerCase().includes(w)),
    });
  }
  out.sort((a, b) => Number(b.named) - Number(a.named) || (a.miles ?? Infinity) - (b.miles ?? Infinity));
  return out.map(({ named: _named, ...photo }) => photo);
}

/** How far to look round each kind of place. */
export function radiusFor(kind: 'photo' | 'drive' | 'track' | 'venue', spanMiles = 0): number {
  if (kind === 'photo' || kind === 'venue') return 800;
  if (kind === 'track') return 1500;
  // A drive: round its middle, wide enough to catch some of the road.
  return Math.min(MAX_RADIUS_M, Math.max(2000, (spanMiles * 1609.34) / 2));
}

/** Cache key: the point to ~100 m and the radius, so the same place reuses its answer. */
export function cacheKey(at: LatLng, radiusM: number): string {
  return `${at.lat.toFixed(3)},${at.lng.toFixed(3)},${Math.round(radiusM)}`;
}

/** Answers are kept for a week, so the screen works offline and Commons isn't asked again and again. */
export const CACHE_TTL_MS = 7 * 24 * 3600_000;

export function isFresh(savedAt: number, now: number): boolean {
  return now - savedAt >= 0 && now - savedAt < CACHE_TTL_MS;
}
