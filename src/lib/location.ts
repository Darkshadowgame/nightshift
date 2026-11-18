import * as Location from 'expo-location';
import { Platform } from 'react-native';
import { placeSearchAvailable, resolvePlace, searchPlaces as appleSuggestions, type PlaceSuggestion } from '../../modules/nav-directions';
import { inUk, MIN_QUERY, placeLabel, searchQuery, tidyHits, townLabel, type PlaceHit } from './placeNames';
import type { LatLng } from './types';
import { destinationLabel, tidyDestinations, whereQueries, type Destination } from './whereTo';

/**
 * Thin layer over expo-location: the person's position, and place search and
 * names from the phone's own geocoder (Apple's on iOS). Nothing goes to any
 * other web service. Pure logic lives in placeNames.ts.
 */

/** The phone's geocoder only exists in the iPhone (and Android) app, not the web preview. */
export const geocoderAvailable = Platform.OS === 'ios' || Platform.OS === 'android';

/** Said, not shown as an error, where the web preview has no geocoder (REVIEW-7 decision 9). */
export const ADDRESS_SEARCH_IN_APP = 'Address search works in the iPhone app.';

export type Position = { ok: true; at: LatLng } | { ok: false; reason: 'denied' | 'unavailable' };

/** Ask for when-in-use location if needed, then read where the phone is. */
export async function currentPosition(ask = true): Promise<Position> {
  try {
    let perm = await Location.getForegroundPermissionsAsync();
    if (!perm.granted && ask && perm.canAskAgain !== false) perm = await Location.requestForegroundPermissionsAsync();
    if (!perm.granted) return { ok: false, reason: 'denied' };
    // A recent fix is good enough to centre a map; fall back to a fresh one.
    const last = await Location.getLastKnownPositionAsync({ maxAge: 120_000, requiredAccuracy: 200 }).catch(() => null);
    const p = last ?? (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
    return { ok: true, at: { lat: p.coords.latitude, lng: p.coords.longitude } };
  } catch {
    return { ok: false, reason: 'unavailable' };
  }
}

/** A precise fix for check-ins and photo spot visits (never stored). */
export async function preciseFix(): Promise<Position> {
  try {
    const perm = await Location.requestForegroundPermissionsAsync();
    if (!perm.granted) return { ok: false, reason: 'denied' };
    const p = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    return { ok: true, at: { lat: p.coords.latitude, lng: p.coords.longitude } };
  } catch {
    return { ok: false, reason: 'unavailable' };
  }
}

export class SearchError extends Error {}

/**
 * Postcode, town or place name to up to five UK places, each with a short name.
 * Empty when nothing matched. Throws SearchError when the lookup itself failed.
 */
export async function searchPlaces(raw: string): Promise<PlaceHit[]> {
  const q = searchQuery(raw);
  if (!q) return [];
  if (!geocoderAvailable) throw new SearchError('Place search needs the iPhone app. Move or tap the map instead.');
  let found: Location.LocationGeocodedLocation[];
  try {
    found = await Location.geocodeAsync(q);
  } catch {
    throw new SearchError("Couldn't search just now. Check your signal and try again.");
  }
  const candidates = tidyHits(
    found.map((f) => ({ at: { lat: f.latitude, lng: f.longitude }, label: '' })),
    5,
  );
  // Name each hit (one at a time: the geocoder dislikes bursts). A failed name falls back to what was typed.
  const typed = raw.trim();
  const out: PlaceHit[] = [];
  for (const c of candidates) {
    const label = (await nameForPlace(c.at)) ?? typed;
    out.push({ at: c.at, label });
  }
  return out;
}

/**
 * "Where to?": any address, postcode or place, UK first, then anywhere if the
 * UK has nothing. Up to five, each with two readable lines from the reverse
 * geocoder. Only Apple's geocoder sees what was typed; nothing is logged.
 * Empty when nothing matched; throws SearchError when the lookup failed.
 */
export async function searchDestinations(raw: string, limit = 5): Promise<Destination[]> {
  const q = whereQueries(raw);
  if (!q) return [];
  if (!geocoderAvailable) throw new SearchError('Search needs the iPhone app.');
  const geocode = async (text: string) => {
    try {
      return (await Location.geocodeAsync(text)).map((f) => ({ at: { lat: f.latitude, lng: f.longitude } }));
    } catch {
      throw new SearchError("Couldn't search just now. Check your signal and try again.");
    }
  };
  let found = (await geocode(q.uk)).filter((h) => inUk(h.at));
  if (found.length === 0 && q.anywhere) found = await geocode(q.anywhere);
  const typed = raw.trim();
  const out: Destination[] = [];
  // One at a time: the geocoder dislikes bursts. A failed name falls back to what was typed.
  for (const c of tidyDestinations(found, limit)) {
    let parts: Location.LocationGeocodedAddress | null = null;
    try {
      [parts] = await Location.reverseGeocodeAsync({ latitude: c.at.lat, longitude: c.at.lng });
    } catch {
      parts = null;
    }
    out.push({ at: c.at, ...destinationLabel(parts, typed) });
  }
  return out;
}

/** The street at a point, for the driving view's road name off the route. Null if unknown or offline. */
export async function streetAt(at: LatLng): Promise<string | null> {
  if (!geocoderAvailable) return null;
  try {
    const [a] = await Location.reverseGeocodeAsync({ latitude: at.lat, longitude: at.lng });
    return a?.street?.trim() || null;
  } catch {
    return null;
  }
}

/** "Where to?" can suggest shops and businesses as you type (build 11 on); older builds use the geocoder. */
export const liveSearchAvailable = placeSearchAvailable;

export type { PlaceSuggestion };

/**
 * Apple's live suggestions (addresses, shops, businesses), biased to where you
 * are or else the UK. Null when this build hasn't got them: use
 * searchDestinations(). Throws SearchError when the lookup failed.
 */
export async function suggestDestinations(raw: string, near?: LatLng | null): Promise<PlaceSuggestion[] | null> {
  const q = raw.trim().replace(/\s+/g, ' ');
  if (!placeSearchAvailable) return null;
  if (q.length < MIN_QUERY) return [];
  try {
    return (await appleSuggestions(q, near ?? null)) ?? null;
  } catch {
    throw new SearchError("Couldn't search just now. Check your signal and try again.");
  }
}

/** A suggestion's position and two readable lines. Throws SearchError if Apple can't find it now. */
export async function resolveSuggestion(s: PlaceSuggestion): Promise<Destination> {
  let r: Awaited<ReturnType<typeof resolvePlace>> = null;
  try {
    r = await resolvePlace(s.id);
  } catch (e) {
    const stale = (e as { code?: string } | null)?.code === 'ERR_PLACE_STALE';
    throw new SearchError(stale ? 'That result has gone. Search again.' : "Couldn't find that place. Try another result.");
  }
  if (!r || !Number.isFinite(r.lat) || !Number.isFinite(r.lng)) throw new SearchError("Couldn't find that place. Try another result.");
  return { at: { lat: r.lat, lng: r.lng }, ...destinationLabel(r, s.title) };
}

/** A short name for a point, e.g. "Ventura Park Rd, Tamworth". Null if unknown or offline. */
export async function nameForPlace(at: LatLng): Promise<string | null> {
  if (!geocoderAvailable) return null;
  try {
    const [a] = await Location.reverseGeocodeAsync({ latitude: at.lat, longitude: at.lng });
    return a ? placeLabel(a) : null;
  } catch {
    return null;
  }
}

/** Town-level name for a point (for rough areas). Null if unknown or offline. */
export async function townForPlace(at: LatLng): Promise<string | null> {
  if (!geocoderAvailable) return null;
  try {
    const [a] = await Location.reverseGeocodeAsync({ latitude: at.lat, longitude: at.lng });
    return a ? townLabel(a) : null;
  } catch {
    return null;
  }
}
