import { milesBetween } from './geo';
import type { LatLng } from './types';

/**
 * Pure helpers for place search and naming. The phone's own geocoder (Apple's
 * on iOS, via expo-location) does the lookups in location.ts; nothing here
 * talks to any service.
 */

/** Rough box round the UK (with Northern Ireland, Shetland and the Scillies). */
const UK = { south: 49.8, north: 60.95, west: -8.75, east: 1.85 };

export function inUk(p: LatLng): boolean {
  return p.lat >= UK.south && p.lat <= UK.north && p.lng >= UK.west && p.lng <= UK.east;
}

/** Full or outward-only UK postcode, e.g. "B79 7ND", "b797nd" or "B79". */
export function looksLikePostcode(text: string): boolean {
  const t = text.trim().toUpperCase().replace(/\s+/g, '');
  return /^[A-Z]{1,2}[0-9][A-Z0-9]?([0-9][A-Z]{2})?$/.test(t);
}

/** Tidy a postcode for the geocoder: "b797nd" -> "B79 7ND". */
export function tidyPostcode(text: string): string {
  const t = text.trim().toUpperCase().replace(/\s+/g, '');
  return t.length > 4 && /[0-9][A-Z]{2}$/.test(t) ? `${t.slice(0, -3)} ${t.slice(-3)}` : t;
}

export const MIN_QUERY = 2;

/**
 * What to send to the geocoder for what someone typed, or null if it's too
 * short. Searches are kept to the UK, so ", UK" is added unless it's there.
 */
export function searchQuery(raw: string): string | null {
  const t = raw.trim().replace(/\s+/g, ' ');
  if (t.length < MIN_QUERY) return null;
  const q = looksLikePostcode(t) ? tidyPostcode(t) : t;
  return /\b(uk|united kingdom|england|scotland|wales|northern ireland)\b/i.test(q) ? q : `${q}, UK`;
}

/** The fields we use from expo-location's LocationGeocodedAddress (all may be null). */
export interface AddressParts {
  name?: string | null;
  street?: string | null;
  streetNumber?: string | null;
  district?: string | null;
  city?: string | null;
  subregion?: string | null;
  region?: string | null;
  postalCode?: string | null;
  isoCountryCode?: string | null;
}

const clean = (s?: string | null) => (s ?? '').trim();

/** Apple's `name` is often the house number and street: that's too exact to use as a name. */
function isAddressLine(name: string, a: AddressParts): boolean {
  const street = clean(a.street);
  if (/^\d/.test(name)) return true;
  if (street && name.includes(street) && clean(a.streetNumber) && name.includes(clean(a.streetNumber))) return true;
  return looksLikePostcode(name);
}

/**
 * A short, human name for a dropped stop or spot, e.g. "Ventura Park Rd, Tamworth".
 * Never a house number or a full postcode. Null if there's nothing useful.
 */
export function placeLabel(a: AddressParts, max = 40): string | null {
  const town = clean(a.city) || clean(a.district) || clean(a.subregion);
  const name = clean(a.name);
  const street = clean(a.street);
  let first = '';
  if (name && !isAddressLine(name, a) && name !== town) first = name;
  else if (street) first = street;
  const parts = [first, town].filter((x, i, xs) => x && xs.indexOf(x) === i);
  if (parts.length === 0) {
    const wider = clean(a.subregion) || clean(a.region);
    return wider ? wider.slice(0, max) : null;
  }
  const label = parts.join(', ');
  if (label.length <= max) return label;
  return (first.length <= max ? first : first.slice(0, max - 1).trimEnd() + '…');
}

/** Town-level name only, e.g. for an event's rough area. Never a street. */
export function townLabel(a: AddressParts): string | null {
  return clean(a.city) || clean(a.district) || clean(a.subregion) || clean(a.region) || null;
}

export interface PlaceHit {
  at: LatLng;
  label: string;
}

/** Keep UK results, drop near-duplicates (within ~300 m), at most `limit`. */
export function tidyHits(hits: PlaceHit[], limit = 5): PlaceHit[] {
  const out: PlaceHit[] = [];
  for (const h of hits) {
    if (!inUk(h.at)) continue;
    if (out.some((o) => milesBetween(o.at, h.at) < 0.2)) continue;
    out.push(h);
    if (out.length >= limit) break;
  }
  return out;
}

/** Key for caching names of a place: rounded to ~100 m so tiny nudges reuse it. */
export function placeKey(p: LatLng): string {
  return `${p.lat.toFixed(3)},${p.lng.toFixed(3)}`;
}

/**
 * Should a dropped stop take the geocoder's name? Only when the name box is
 * empty or still holds the last automatic name (the host hasn't typed their own).
 */
export function shouldAutoName(current: string, lastAuto: string | undefined): boolean {
  const c = current.trim();
  return c === '' || (!!lastAuto && c === lastAuto.trim());
}
