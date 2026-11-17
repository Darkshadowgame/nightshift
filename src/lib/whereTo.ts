import { milesBetween } from './geo';
import { inUk, looksLikePostcode, searchQuery, type AddressParts } from './placeNames';
import type { LatLng } from './types';

/**
 * "Where to?": search any address, postcode or place and drive there with
 * Nightshift's own navigation. Pure helpers; the lookups are in location.ts
 * (Apple's geocoder on iOS, nothing else) and the screen is src/app/where.tsx.
 *
 * What you search for stays on this phone: recent places and Home and Work are
 * kept in the phone's settings, never sent to the server, and never logged.
 */

export interface Destination {
  at: LatLng;
  /** The big line: a place's name, or the house number and street. */
  name: string;
  /** The small line: street, town, postcode (and the country outside the UK). May be empty. */
  address: string;
}

export interface SavedPlaces {
  /** Newest first, at most MAX_RECENT. */
  recent: Destination[];
  home?: Destination;
  work?: Destination;
}

export const MAX_RECENT = 10;
export const NO_PLACES: SavedPlaces = { recent: [] };

/** Saved places from settings (older saves have none). */
export function savedPlaces(saved: Partial<SavedPlaces> | undefined | null): SavedPlaces {
  return {
    ...(saved ?? {}),
    recent: Array.isArray(saved?.recent) ? saved!.recent.filter(isDestination).slice(0, MAX_RECENT) : [],
  };
}

function isDestination(d: unknown): d is Destination {
  const x = d as Destination;
  return !!x && typeof x.name === 'string' && !!x.at && Number.isFinite(x.at.lat) && Number.isFinite(x.at.lng);
}

/**
 * What to ask the geocoder. UK first (", UK" added, postcodes tidied); then,
 * if that finds nothing in the UK, what was typed as it is, so an address
 * abroad still works. Null when it's too short to search.
 */
export function whereQueries(raw: string): { uk: string; anywhere: string | null } | null {
  const uk = searchQuery(raw);
  if (!uk) return null;
  const typed = raw.trim().replace(/\s+/g, ' ');
  // A UK postcode, or a search that already names the UK, has nowhere else to look.
  const anywhere = looksLikePostcode(typed) || uk === typed ? null : typed;
  return { uk, anywhere };
}

const clean = (s?: string | null) => (s ?? '').trim();

/** Apple's `name` is the house number and street for an address; for a place it's the place's name. */
function isAddressName(name: string, a: AddressParts): boolean {
  const street = clean(a.street);
  return /^\d/.test(name) || (!!street && name.includes(street)) || looksLikePostcode(name) || name === clean(a.postalCode);
}

/**
 * Two readable lines for a search result from the reverse geocoder: e.g.
 * "Caffeine and Machine" / "Ettington, CV37 7PN", or "12 High Street" /
 * "Tamworth, B79 7ND". Falls back to what was typed.
 */
export function destinationLabel(a: (AddressParts & { country?: string | null }) | null | undefined, typed: string): { name: string; address: string } {
  const fallback = typed.trim() || 'Destination';
  if (!a) return { name: fallback, address: '' };
  const name = clean(a.name);
  const streetLine = [clean(a.streetNumber), clean(a.street)].filter(Boolean).join(' ');
  const town = clean(a.city) || clean(a.district) || clean(a.subregion);
  const postcode = clean(a.postalCode);
  const abroad = !!a.isoCountryCode && a.isoCountryCode.toUpperCase() !== 'GB' ? clean(a.country) || a.isoCountryCode.toUpperCase() : '';
  const placeName = name && !isAddressName(name, a) && name !== town ? name : '';
  const title = placeName || streetLine || name || town || fallback;
  const rest = [placeName && streetLine ? streetLine : '', title === town ? '' : town, postcode, abroad];
  const address = rest.filter((x, i, xs) => x && x !== title && xs.indexOf(x) === i).join(', ');
  return { name: title, address };
}

/** Drop near-duplicates (within ~100 m), UK results first, at most `limit`. */
export function tidyDestinations<T extends { at: LatLng }>(hits: T[], limit = 5): T[] {
  const ordered = [...hits.filter((h) => inUk(h.at)), ...hits.filter((h) => !inUk(h.at))];
  const out: T[] = [];
  for (const h of ordered) {
    if (!Number.isFinite(h.at.lat) || !Number.isFinite(h.at.lng)) continue;
    if (out.some((o) => milesBetween(o.at, h.at) < 0.06)) continue;
    out.push(h);
    if (out.length >= limit) break;
  }
  return out;
}

/** The same place: within ~50 m, or the same two lines. */
export function samePlace(a: Destination, b: Destination): boolean {
  return milesBetween(a.at, b.at) < 0.03 || (a.name === b.name && a.address === b.address);
}

/** Put a place at the top of the recent list (once), keeping at most MAX_RECENT. */
export function rememberRecent(places: SavedPlaces, d: Destination, max = MAX_RECENT): SavedPlaces {
  const entry: Destination = { at: { lat: d.at.lat, lng: d.at.lng }, name: d.name, address: d.address };
  return { ...places, recent: [entry, ...places.recent.filter((r) => !samePlace(r, entry))].slice(0, max) };
}

export function clearRecent(places: SavedPlaces): SavedPlaces {
  return { ...places, recent: [] };
}

export type SavedSlot = 'home' | 'work';
export const SLOT_LABELS: Record<SavedSlot, string> = { home: 'Home', work: 'Work' };

/** Save a place as Home or Work (null forgets it). */
export function setSlot(places: SavedPlaces, slot: SavedSlot, d: Destination | null): SavedPlaces {
  const next = { ...places };
  if (d) next[slot] = { at: { lat: d.at.lat, lng: d.at.lng }, name: d.name, address: d.address };
  else delete next[slot];
  return next;
}

/** "2.4 mi away", from where you are (null when we don't know). */
export function distanceNote(from: LatLng | null | undefined, to: LatLng): string | null {
  if (!from) return null;
  const mi = milesBetween(from, to);
  if (mi < 0.1) return 'Here';
  return `${mi < 10 ? mi.toFixed(1) : Math.round(mi).toLocaleString('en-GB')} mi away`;
}
