import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useSyncExternalStore } from 'react';
import type { AccessNote, ShotLike } from './placeExtras';

/**
 * What this phone keeps for the place extras: your own access notes (until the server takes
 * them), your likes on shots, and the rival you picked at each track. Separate from the main
 * store, like lapStore.ts. Nothing here is sent anywhere.
 */

const KEY = 'nightshift.placeextras.v1';

/** The best times last seen for you and your rival on one layout, to spot when either gets quicker. */
export interface SeenTimes {
  me?: number;
  them?: number;
}

export interface RivalPick {
  userId: string;
  /** Layout name -> times seen last visit. */
  seen: Record<string, SeenTimes>;
}

export interface Extras {
  notes: AccessNote[];
  likes: ShotLike[];
  /** Track id -> the person you're chasing there. */
  rivals: Record<string, RivalPick>;
}

const EMPTY: Extras = { notes: [], likes: [], rivals: {} };

let state: Extras = EMPTY;
let loaded = false;
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function persist() {
  AsyncStorage.setItem(KEY, JSON.stringify(state)).catch(() => {});
}

function set(next: Extras) {
  state = next;
  persist();
  emit();
}

/** A saved value that isn't the shape we expect is dropped, never trusted. */
export function readExtras(raw: unknown): Extras {
  if (!raw || typeof raw !== 'object') return EMPTY;
  const r = raw as Partial<Extras>;
  return {
    notes: Array.isArray(r.notes) ? r.notes.filter((n) => n && typeof n.id === 'string' && typeof n.spotId === 'string') : [],
    likes: Array.isArray(r.likes) ? r.likes.filter((l) => l && typeof l.ref === 'string' && typeof l.at === 'string') : [],
    rivals: r.rivals && typeof r.rivals === 'object' ? (r.rivals as Extras['rivals']) : {},
  };
}

function load(): Promise<void> {
  if (loaded) return Promise.resolve();
  loading ??= AsyncStorage.getItem(KEY)
    .then((raw) => {
      if (raw) state = readExtras(JSON.parse(raw));
    })
    .catch(() => {})
    .finally(() => {
      loaded = true;
      emit();
    });
  return loading;
}

export function addNote(note: AccessNote) {
  // One note per person per place: a new one replaces the old.
  set({ ...state, notes: [...state.notes.filter((n) => !(n.spotId === note.spotId && n.userId === note.userId)), note] });
}

export function removeNote(id: string) {
  set({ ...state, notes: state.notes.filter((n) => n.id !== id) });
}

/** Like a shot (once per person), or take the like back. */
export function toggleLike(ref: string, userId: string, atIso: string) {
  const has = state.likes.some((l) => l.ref === ref && l.userId === userId);
  set({ ...state, likes: has ? state.likes.filter((l) => !(l.ref === ref && l.userId === userId)) : [...state.likes, { ref, userId, at: atIso }] });
}

export function setRival(trackId: string, userId: string | null) {
  const rivals = { ...state.rivals };
  if (userId) rivals[trackId] = { userId, seen: {} };
  else delete rivals[trackId];
  set({ ...state, rivals });
}

export function setSeen(trackId: string, layout: string, times: SeenTimes) {
  const pick = state.rivals[trackId];
  if (!pick) return;
  const prev = pick.seen[layout];
  if (prev && prev.me === times.me && prev.them === times.them) return;
  set({ ...state, rivals: { ...state.rivals, [trackId]: { ...pick, seen: { ...pick.seen, [layout]: times } } } });
}

/** Reset demo data: forget everything kept here. */
export function clearExtras() {
  set(EMPTY);
}

/** Everything kept here, and whether it has been read from the phone yet. */
export function useExtras(): { extras: Extras; ready: boolean } {
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
  return { extras: snapshot, ready: loaded };
}
