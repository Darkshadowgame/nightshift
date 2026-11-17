import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useSyncExternalStore } from 'react';
import type { LapTime } from './laptimes';

/**
 * Track times saved on the phone. Separate from the main store on purpose: on
 * the backend they become their own table, checked against the proof photo
 * before they're verified. Until then every time here is "unverified".
 */

const KEY = 'nightshift.laps.v1';

let laps: LapTime[] = [];
let loaded = false;
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function persist() {
  AsyncStorage.setItem(KEY, JSON.stringify(laps)).catch(() => {});
}

function load(): Promise<void> {
  if (loaded) return Promise.resolve();
  loading ??= AsyncStorage.getItem(KEY)
    .then((raw) => {
      const parsed = raw ? (JSON.parse(raw) as unknown) : [];
      if (Array.isArray(parsed)) laps = parsed as LapTime[];
    })
    .catch(() => {})
    .finally(() => {
      loaded = true;
      emit();
    });
  return loading;
}

export function addLap(lap: LapTime) {
  laps = [...laps, lap];
  persist();
  emit();
}

export function removeLap(id: string) {
  laps = laps.filter((l) => l.id !== id);
  persist();
  emit();
}

/** Reset demo data: forget every time on this phone. */
export function clearLaps() {
  laps = [];
  persist();
  emit();
}

/** Every saved track time, and whether they've been read from the phone yet. */
export function useLaps(): { laps: LapTime[]; ready: boolean } {
  useEffect(() => {
    load();
  }, []);
  const snapshot = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => laps,
    () => laps,
  );
  return { laps: snapshot, ready: loaded };
}
