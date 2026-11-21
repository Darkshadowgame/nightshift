import type { Destination } from './whereTo';
import { samePlace } from './whereTo';

/**
 * Favourite places (Home, Work, a friend's): one tap in Search's Places to drive there.
 *
 * PRIVACY: favourites live in this phone's settings only. They are never sent to the server
 * (settings aren't), never logged, and never part of anything another person can see.
 */
export interface Favourite {
  /** From its position, so the same place can't be saved twice. */
  id: string;
  /** What the person calls it ("Home", "Sam's"). Starts as the place's name. */
  label: string;
  name: string;
  address: string;
  at: { lat: number; lng: number };
}

export const MAX_FAVOURITES = 20;
export const MAX_LABEL = 30;

/** The one line of privacy copy, shown where favourites are managed. */
export const FAVOURITES_PRIVACY = 'Saved on this phone only. Never sent to Slipstream or shown to anyone.';

const idOf = (at: { lat: number; lng: number }) => `${at.lat.toFixed(5)},${at.lng.toFixed(5)}`;

function isFavourite(f: unknown): f is Favourite {
  const x = f as Favourite;
  return !!x && typeof x.id === 'string' && typeof x.label === 'string' && !!x.at && Number.isFinite(x.at.lat) && Number.isFinite(x.at.lng);
}

/** Made-up places for the demo (town centres, no real addresses). */
export const DEMO_FAVOURITES: readonly Favourite[] = [
  { id: 'demo-home', label: 'Home', name: 'Demo home', address: 'Made-up place', at: { lat: 52.634, lng: -1.691 } },
  { id: 'demo-work', label: 'Work', name: 'Demo workplace', address: 'Made-up place', at: { lat: 52.683, lng: -1.826 } },
  { id: 'demo-friend', label: "Sam's place", name: "Demo friend's place", address: 'Made-up place', at: { lat: 52.577, lng: -1.553 } },
];

/** Favourites from settings. Nothing saved yet: the demo starts with made-up ones, a real account with none. */
export function favouritesOf(saved: readonly Favourite[] | undefined | null, demo: boolean): Favourite[] {
  if (!Array.isArray(saved)) return demo ? DEMO_FAVOURITES.map((f) => ({ ...f })) : [];
  return saved.filter(isFavourite).slice(0, MAX_FAVOURITES);
}

export function asDestination(f: Favourite): Destination {
  return { at: f.at, name: f.name, address: f.address };
}

export function findFavourite(list: readonly Favourite[], d: Destination): Favourite | undefined {
  return list.find((f) => samePlace(asDestination(f), d));
}

export function cleanLabel(raw: string, fallback: string): string {
  const t = raw.replace(/\s+/g, ' ').trim().slice(0, MAX_LABEL);
  return t || fallback.slice(0, MAX_LABEL);
}

/** Add a place (newest first). Already there: unchanged. Full: the oldest goes. */
export function addFavourite(list: readonly Favourite[], d: Destination, label?: string): Favourite[] {
  if (findFavourite(list, d)) return [...list];
  const fav: Favourite = { id: idOf(d.at), label: cleanLabel(label ?? '', d.name), name: d.name, address: d.address, at: { lat: d.at.lat, lng: d.at.lng } };
  return [fav, ...list].slice(0, MAX_FAVOURITES);
}

export function removeFavourite(list: readonly Favourite[], id: string): Favourite[] {
  return list.filter((f) => f.id !== id);
}

export function renameFavourite(list: readonly Favourite[], id: string, label: string): Favourite[] {
  return list.map((f) => (f.id === id ? { ...f, label: cleanLabel(label, f.name) } : f));
}

/** The star: saved becomes removed, not saved becomes saved. */
export function toggleFavourite(list: readonly Favourite[], d: Destination): Favourite[] {
  const hit = findFavourite(list, d);
  return hit ? removeFavourite(list, hit.id) : addFavourite(list, d);
}
