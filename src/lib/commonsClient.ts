import AsyncStorage from '@react-native-async-storage/async-storage';
import { cacheKey, commonsUrl, isFresh, parseCommons, type CommonsPhoto } from './commons';
import type { LatLng } from './types';

/**
 * Fetches nearby Commons photos with a cache: in memory for this session and on
 * the phone for a week, so a place opened before shows its photos offline.
 * Sends only the place's coordinates, to commons.wikimedia.org only.
 */

const STORE_KEY = 'nightshift.commons.v1';
const MAX_SAVED = 40;
const TIMEOUT_MS = 10_000;

type Saved = Record<string, { at: number; photos: CommonsPhoto[] }>;

const memory = new Map<string, CommonsPhoto[]>();
let saved: Saved | null = null;

async function load(): Promise<Saved> {
  if (saved) return saved;
  try {
    const raw = await AsyncStorage.getItem(STORE_KEY);
    saved = raw ? (JSON.parse(raw) as Saved) : {};
  } catch {
    saved = {};
  }
  return saved;
}

async function save(key: string, photos: CommonsPhoto[]): Promise<void> {
  const all = await load();
  all[key] = { at: Date.now(), photos };
  // Keep the newest few places only.
  const keys = Object.keys(all).sort((a, b) => all[b].at - all[a].at);
  for (const k of keys.slice(MAX_SAVED)) delete all[k];
  AsyncStorage.setItem(STORE_KEY, JSON.stringify(all)).catch(() => {});
}

export type CommonsResult =
  | { status: 'ok'; photos: CommonsPhoto[]; cached: boolean }
  /** No connection (or Commons didn't answer) and nothing saved for this place. */
  | { status: 'offline'; photos: [] };

export async function nearbyCommonsPhotos(at: LatLng, radiusM: number, placeName: string): Promise<CommonsResult> {
  const key = cacheKey(at, radiusM);
  const inMemory = memory.get(key);
  if (inMemory) return { status: 'ok', photos: inMemory, cached: true };
  const stored = (await load())[key];
  if (stored && isFresh(stored.at, Date.now())) {
    memory.set(key, stored.photos);
    return { status: 'ok', photos: stored.photos, cached: true };
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(commonsUrl(at, radiusM), {
      signal: controller.signal,
      // Wikimedia asks apps to say who they are. No contact details or user data.
      headers: { 'Api-User-Agent': 'Nightshift-app/1.0' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const photos = parseCommons(await res.json(), at, placeName);
    memory.set(key, photos);
    save(key, photos).catch(() => {});
    return { status: 'ok', photos, cached: false };
  } catch {
    // Offline: an older saved answer is better than nothing.
    if (stored) return { status: 'ok', photos: stored.photos, cached: true };
    return { status: 'offline', photos: [] };
  } finally {
    clearTimeout(timer);
  }
}
