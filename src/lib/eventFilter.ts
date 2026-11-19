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
  /** Shown and inside When (Tonight: live or starting before 05:00): the count line's number. Yours outside it show but aren't counted. */
  shownInWhen: number;
}

/** The events to show, and how many each kind of filter hid. Keeps the input order. */
export function filterEvents(views: readonly EventView[], filter: EventFilter, eventsOn: boolean, now: Date): FilterResult {
  const ends = whenEnds(now);
  const shown: EventView[] = [];
  let hiddenByFilters = 0;
  let hiddenByCar = 0;
  let shownInWhen = 0;
  for (const v of views) {
    const start = new Date(v.event.startsAt).getTime();
    const live = v.phase === 'live';
    const inWhen = filter.when === 'all' || live || start < (filter.when === 'tonight' ? ends.tonight : ends.week);
    if (isMine(v)) {
      shown.push(v);
      if (inWhen) shownInWhen++;
      continue;
    }
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
    shownInWhen++;
  }
  return { shown, hiddenByFilters, hiddenByCar, shownInWhen };
}

/** Is anything narrowing the events (so the Layers button can say so)? */
export function filtering(filter: EventFilter, eventsOn: boolean): boolean {
  return !eventsOn || filter.when !== 'all' || filter.types.length > 0 || filter.canGoOnly;
}

export interface FilterLine {
  text: string;
  /** "Show" turns every filter off (and Events on); "Reset" puts the defaults back. */
  action: { label: string; clears: 'all' | 'reset' };
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** Every filter off and Events on: what "Show" sets. */
function allShown(filter: EventFilter, eventsOn: boolean): boolean {
  return eventsOn && filter.when === 'all' && filter.types.length === 0 && !filter.canGoOnly;
}

/**
 * The line over Tonight's sheet and list (owner decision, Review 19): "2 meets tonight · 4 hidden
 * by your filters · Show", or "· 1 not for your car" when only the car filter hid them, so it's
 * clear what hid them. Show turns every filter off; then "6 meets · Filters off · Reset", so there
 * is always a way back to the defaults. The count is only the meets inside When (a Sunday meet
 * you're going to shows, but isn't "tonight"). Null with the default filters and nothing hidden.
 */
export function filterLine(result: FilterResult, filter: EventFilter, eventsOn: boolean, hasCar: boolean): FilterLine | null {
  const { hiddenByCar: car, hiddenByFilters: other } = result;
  const when = filter.when === 'tonight' ? ' tonight' : filter.when === 'week' ? ' this week' : '';
  const count = `${plural(result.shownInWhen, 'meet', 'meets')}${when}`;
  if (car === 0 && other === 0) {
    const defaults = filter.when === DEFAULT_EVENT_FILTER.when && filter.types.length === 0 && filter.canGoOnly === DEFAULT_EVENT_FILTER.canGoOnly;
    return allShown(filter, eventsOn) && !defaults ? { text: `${count} · Filters off`, action: { label: 'Reset', clears: 'reset' } } : null;
  }
  const why = !eventsOn
    ? `${car + other} hidden, Events off`
    : other === 0
      ? hasCar
        ? `${car} not for your car`
        : `${car} need a car`
      : `${car + other} hidden by your filters`;
  return { text: `${count} · ${why}`, action: { label: 'Show', clears: 'all' } };
}
