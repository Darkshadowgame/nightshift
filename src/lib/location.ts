import * as Location from 'expo-location';
import { Platform } from 'react-native';
import { placeLabel, searchQuery, tidyHits, townLabel, type PlaceHit } from './placeNames';
import type { LatLng } from './types';

/**
 * Thin layer over expo-location: the person's position, and place search and
 * names from the phone's own geocoder (Apple's on iOS). Nothing goes to any
 * other web service. Pure logic lives in placeNames.ts.
 */

/** The phone's geocoder only exists in the iPhone (and Android) app, not the web preview. */
export const geocoderAvailable = Platform.OS === 'ios' || Platform.OS === 'android';

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
