import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useSyncExternalStore } from 'react';
import { type LogState, type ModNote, type WishItem, addWish, removeWish, setModNote } from './buildLog';
import { deletePhotos } from './photos';

/**
 * The build story on the phone (buildLog.ts): dates, before and after photos, costs and the
 * wishlist. Its own AsyncStorage key, never part of the synced store and never sent anywhere,
 * so a price can't leak with a build.
 */

const KEY = 'nightshift.buildlog.v1';

let state: LogState = { builds: {}, hideCosts: false };
let loaded = false;
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function persist() {
  AsyncStorage.setItem(KEY, JSON.stringify(state)).catch(() => {});
}

/** What a saved value must look like; anything else is dropped rather than trusted. */
function readable(raw: unknown): LogState | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Partial<LogState>;
  if (!r.builds || typeof r.builds !== 'object') return null;
  return { builds: r.builds, hideCosts: r.hideCosts === true };
}

function load(): Promise<void> {
  if (loaded) return Promise.resolve();
  loading ??= AsyncStorage.getItem(KEY)
    .then((raw) => {
      const parsed = raw ? readable(JSON.parse(raw)) : null;
      if (parsed) state = parsed;
    })
    .catch(() => {})
    .finally(() => {
      loaded = true;
      emit();
    });
  return loading;
}

function update(next: LogState) {
  state = next;
  persist();
  emit();
}

export function noteMod(buildId: string, name: string, patch: { [K in keyof ModNote]?: ModNote[K] | null }) {
  // A photo that is replaced or cleared is deleted from the phone.
  const old = state.builds[buildId]?.mods[name.trim().toLowerCase().replace(/\s+/g, ' ')];
  if (old) deletePhotos([patch.before !== undefined && patch.before !== old.before ? old.before : '', patch.after !== undefined && patch.after !== old.after ? old.after : ''].filter(Boolean) as string[]);
  update(setModNote(state, buildId, name, patch));
}

export function wish(buildId: string, item: WishItem) {
  update(addWish(state, buildId, item));
}

export function unwish(buildId: string, wishId: string) {
  update(removeWish(state, buildId, wishId));
}

export function setHideCosts(hide: boolean) {
  update({ ...state, hideCosts: hide });
}

/** Demo reset: forget the whole story on this phone. */
export function clearBuildLog() {
  const refs = Object.values(state.builds).flatMap((b) => Object.values(b.mods).flatMap((n) => [n.before, n.after].filter(Boolean) as string[]));
  deletePhotos(refs);
  update({ builds: {}, hideCosts: state.hideCosts });
}

export function useBuildLog(): { log: LogState; ready: boolean } {
  useEffect(() => {
    load();
  }, []);
  const snapshot = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
    () => state,
  );
  return { log: snapshot, ready: loaded };
}
