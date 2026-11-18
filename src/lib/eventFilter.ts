/**
 * Which events Tonight's map and list show (owner report, 18 Nov 2026: on a busy night there are too
 * many meets on the map and no way to narrow them). Pure logic; the controls are EventFilters.tsx in
 * the Layers sheet, and the choices are saved in Settings (`eventFilter`, plus `mapLayers.events`).
 *
 * - **Events** on or off (the `events` map layer).
 * - **When**: Tonight (live now, plus starting before 05:00), This week (to Sunday night) or All.
 * - **Type** chips: Meets, Cruises, Rolling meets. Nothing picked means every type.
 * - **Only ones I can go to** (on by default): hides meets your garage doesn't fit (vehicle, class,
 *   brands, min mods, radius), from the same invite matching as the event page (`canJoinDirectly`).
 *   With no car, meets open to everyone still show.
 *
 * Meets you're going to or hosting always show, whatever the filters. Nothing disappears silently:
 * `filterLine` says how many are hidden and why, with a way to show them.
 */

import { windowFor } from './discover';
import { canJoinDirectly, type EventView } from './eventView';
import type { EventType } from './types';

export type EventWhen = 'tonight' | 'week' | 'all';
export type EventKind = Extract<EventType, 'meet' | 'cruise' | 'rolling'>;

export interface EventFilter {
  when: EventWhen;
  /** Type chips. Empty means every type (shows and track days too). */
  types: EventKind[];
  /** Hide meets your garage can't go to. On by default (owner, 18 Nov 2026). */
  canGoOnly: boolean;
}

export const DEFAULT_EVENT_FILTER: EventFilter = { when: 'tonight', types: [], canGoOnly: true };
/** Everything: what "Show all" sets. */
export const NO_EVENT_FILTER: EventFilter = { when: 'all', types: [], canGoOnly: false };

export const WHEN_OPTIONS: { key: EventWhen; label: string }[] = [
  { key: 'tonight', label: 'Tonight' },
  { key: 'week', label: 'This week' },
  { key: 'all', label: 'All' },
];
export const KIND_OPTIONS: { key: EventKind; label: string }[] = [
  { key: 'meet', label: 'Meets' },
  { key: 'cruise', label: 'Cruises' },
  { key: 'rolling', label: 'Rolling meets' },
];
const KINDS = KIND_OPTIONS.map((o) => o.key);

/** A saved filter with anything missing or odd filled from the defaults. */
export function savedEventFilter(saved: Partial<EventFilter> | undefined): EventFilter {
  const when = WHEN_OPTIONS.some((o) => o.key === saved?.when) ? (saved!.when as EventWhen) : DEFAULT_EVENT_FILTER.when;
  const raw = Array.isArray(saved?.types) ? saved!.types : [];
  const picked = KINDS.filter((k) => raw.includes(k));
  // Every type picked is the same as none (nothing picked means all).
  const types = picked.length === KINDS.length ? [] : picked;
  const canGoOnly = typeof saved?.canGoOnly === 'boolean' ? saved.canGoOnly : DEFAULT_EVENT_FILTER.canGoOnly;
  return { when, types, canGoOnly };
}

/**
 * Where Tonight and This week end, in ms. Tonight runs to 05:00; this week to Sunday night (05:00
 * Monday), the same as Tonight's list sections.
 */
export function whenEnds(now: Date): { tonight: number; week: number } {
  const tonight = windowFor('tonight', now)!.to.getTime();
  const sunday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + ((7 - now.getDay()) % 7) + 1, 5, 0, 0, 0);
  return { tonight, week: Math.max(tonight, sunday.getTime()) };
}

/** Going or hosting: always shown. */
export function isMine(v: Pick<EventView, 'role'>): boolean {
  return v.role === 'host' || v.role === 'going';
}

export interface FilterResult {
  shown: EventView[];
  /** Hidden by Events off, When or Type. */
  hiddenByFilters: number;
  /** Passed the other filters but not open to your car (Only ones I can go to). */
  hiddenByCar: number;
}

/** The events to show, and how many each kind of filter hid. Keeps the input order. */
export function filterEvents(views: readonly EventView[], filter: EventFilter, eventsOn: boolean, now: Date): FilterResult {
  const ends = whenEnds(now);
  const shown: EventView[] = [];
  let hiddenByFilters = 0;
  let hiddenByCar = 0;
  for (const v of views) {
    if (isMine(v)) {
      shown.push(v);
      continue;
    }
    const start = new Date(v.event.startsAt).getTime();
    const live = v.phase === 'live';
    const inWhen = filter.when === 'all' || live || start < (filter.when === 'tonight' ? ends.tonight : ends.week);
    const inType = filter.types.length === 0 || (filter.types as EventType[]).includes(v.event.type);
    if (!eventsOn || !inWhen || !inType) {
      hiddenByFilters++;
      continue;
    }
    // Asked to go and waiting for the host: still yours to see.
    if (filter.canGoOnly && !canJoinDirectly(v.role) && v.role !== 'requested') {
      hiddenByCar++;
      continue;
    }
    shown.push(v);
  }
  return { shown, hiddenByFilters, hiddenByCar };
}

/** Is anything narrowing the events (so the Layers button can say so)? */
export function filtering(filter: EventFilter, eventsOn: boolean): boolean {
  return !eventsOn || filter.when !== 'all' || filter.types.length > 0 || filter.canGoOnly;
}

export interface FilterLine {
  text: string;
  /** "Show all" clears every filter; "Show" only turns Only ones I can go to off. */
  action: { label: string; clears: 'all' | 'car' };
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/**
 * The line over Tonight's sheet and list: "12 meets tonight · 18 hidden by filters · Show all", or
 * "9 meets tonight · 4 not open to your car · Show". Null when nothing is hidden.
 */
export function filterLine(result: FilterResult, filter: EventFilter, eventsOn: boolean, hasCar: boolean): FilterLine | null {
  const { hiddenByCar: car, hiddenByFilters: other } = result;
  if (car === 0 && other === 0) return null;
  const when = filter.when === 'tonight' ? ' tonight' : filter.when === 'week' ? ' this week' : '';
  const parts = [`${plural(result.shown.length, 'meet', 'meets')}${when}`];
  if (car > 0) parts.push(hasCar ? `${car} not open to your car` : `${car} need a car`);
  if (other > 0) parts.push(eventsOn ? `${other} hidden by filters` : `${other} hidden, Events off`);
  return { text: parts.join(' · '), action: other > 0 ? { label: 'Show all', clears: 'all' } : { label: 'Show', clears: 'car' } };
}
