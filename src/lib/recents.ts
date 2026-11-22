import { samePlace, type Destination } from './whereTo';

/**
 * Recent places and recent searches: the quick way back on Search when nothing is typed.
 *
 * PRIVACY: these live in this phone's settings only. They are never sent to the server (settings
 * aren't), never logged, and never part of anything another person can see. "Reset the demo"
 * clears them, and "Clear recent" does too.
 */
export interface RecentPlace {
  /** `spot:<id>` for a place from Slipstream, else the position, so one place is listed once. */
  id: string;
  name: string;
  /** The small line (street, town). May be empty. */
  address: string;
  at: { lat: number; lng: number };
  /** Set when it is a Slipstream place (a road or photo spot): opens its page, not Go here. */
  spotId?: string;
}

export interface Recents {
  /** Newest first, at most MAX_RECENTS. */
  places: RecentPlace[];
  /** Newest first, at most MAX_RECENTS. */
  searches: string[];
}

export const MAX_RECENTS = 5;
export const MAX_SEARCH_LENGTH = 60;
export const NO_RECENTS: Recents = { places: [], searches: [] };

/** The one line of privacy copy, shown where recents are cleared (same tone as the favourites line). */
export const RECENTS_PRIVACY = 'Kept on this phone only. Never sent to Slipstream or shown to anyone.';

const idOf = (at: { lat: number; lng: number }) => `${at.lat.toFixed(5)},${at.lng.toFixed(5)}`;

function isPlace(p: unknown): p is RecentPlace {
  const x = p as RecentPlace;
  return !!x && typeof x.id === 'string' && typeof x.name === 'string' && !!x.at && Number.isFinite(x.at.lat) && Number.isFinite(x.at.lng);
}

/** Recents from settings (older saves have none). Anything malformed is dropped. */
export function recentsOf(saved: Partial<Recents> | undefined | null): Recents {
  return {
    places: Array.isArray(saved?.places) ? saved!.places.filter(isPlace).slice(0, MAX_RECENTS) : [],
    searches: Array.isArray(saved?.searches) ? saved!.searches.filter((s): s is string => typeof s === 'string' && !!s.trim()).slice(0, MAX_RECENTS) : [],
  };
}

export const isEmptyRecents = (r: Recents) => r.places.length === 0 && r.searches.length === 0;

const asDestination = (p: RecentPlace): Destination => ({ at: p.at, name: p.name, address: p.address });

/** The same remembered place: same Slipstream place, or the same address spot. */
function same(a: RecentPlace, b: RecentPlace): boolean {
  if (a.spotId || b.spotId) return a.spotId === b.spotId;
  return samePlace(asDestination(a), asDestination(b));
}

/** Put a place at the top (once), keeping at most MAX_RECENTS. */
export function rememberPlace(recents: Recents, place: { name: string; address?: string; at: { lat: number; lng: number }; spotId?: string }): Recents {
  const entry: RecentPlace = {
    id: place.spotId ? `spot:${place.spotId}` : idOf(place.at),
    name: place.name,
    address: place.address ?? '',
    at: { lat: place.at.lat, lng: place.at.lng },
    ...(place.spotId ? { spotId: place.spotId } : {}),
  };
  return { ...recents, places: [entry, ...recents.places.filter((p) => !same(p, entry))].slice(0, MAX_RECENTS) };
}

/** What counts as the same search: no case, no extra spaces. */
export const searchKey = (q: string) => q.replace(/\s+/g, ' ').trim().toLowerCase();

/** Put a search at the top (once). Too short (under two letters) is not worth remembering. */
export function rememberSearch(recents: Recents, raw: string): Recents {
  const q = raw.replace(/\s+/g, ' ').trim().slice(0, MAX_SEARCH_LENGTH);
  if (searchKey(q).length < 2) return recents;
  return { ...recents, searches: [q, ...recents.searches.filter((s) => searchKey(s) !== searchKey(q))].slice(0, MAX_RECENTS) };
}

export const removePlace = (recents: Recents, id: string): Recents => ({ ...recents, places: recents.places.filter((p) => p.id !== id) });
export const removeSearch = (recents: Recents, q: string): Recents => ({ ...recents, searches: recents.searches.filter((s) => searchKey(s) !== searchKey(q)) });
export const clearRecents = (): Recents => ({ places: [], searches: [] });

/**
 * The places to show: a place that is also a favourite shows once, under Favourites; a Slipstream
 * place that has gone is dropped. Still newest first, at most MAX_RECENTS.
 */
export function visibleRecentPlaces(recents: Recents, favourites: readonly Destination[], spotIds?: ReadonlySet<string>): RecentPlace[] {
  return recents.places
    .filter((p) => (p.spotId ? !spotIds || spotIds.has(p.spotId) : !favourites.some((f) => samePlace(f, asDestination(p)))))
    .slice(0, MAX_RECENTS);
}
