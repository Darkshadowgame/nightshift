import { classOf } from './classes';
import { headlinePower, isoDay, runDay } from './dyno';
import { countedMods, modUnit } from './modGroups';
import type { Build, Mod, ModCategory } from './types';

/**
 * A build's own story, kept on the phone only (nothing here is sent to the server): the day each
 * mod went on, its before and after photos, what it cost, and the wishlist. The server's mods have no
 * dates, photos or prices, so this sits beside them, keyed by the mod's name (the server gives mods new
 * ids on every save, a name stays put). Pure functions; the phone-side store is buildLogStore.ts.
 */

/** What the phone knows about one fitted mod. */
export interface ModNote {
  /** The day it was fitted, YYYY-MM-DD. */
  on?: string;
  /** Photo refs (photos.ts), taken before and after. */
  before?: string;
  after?: string;
  /** What it cost, whole pounds. Private: never shown to anyone else, never shared. */
  cost?: number;
}

export interface WishItem {
  id: string;
  name: string;
  category: ModCategory;
}

export interface BuildLog {
  mods: Record<string, ModNote>;
  wishes: WishItem[];
}

export interface LogState {
  builds: Record<string, BuildLog>;
  /** Hide the cost total from yourself too (Cost screen). */
  hideCosts: boolean;
}

export const EMPTY_LOG: BuildLog = { mods: {}, wishes: [] };
export const MAX_COST = 1_000_000;
export const MAX_WISHES = 30;

export const modKey = (name: string) => name.trim().toLowerCase().replace(/\s+/g, ' ');

export function logOf(state: LogState, buildId: string): BuildLog {
  return state.builds[buildId] ?? EMPTY_LOG;
}

/** The note with empty fields removed. */
function tidy(n: ModNote): ModNote | null {
  const out: ModNote = {};
  if (n.on) out.on = n.on;
  if (n.before) out.before = n.before;
  if (n.after) out.after = n.after;
  if (n.cost !== undefined && n.cost > 0) out.cost = Math.min(MAX_COST, Math.round(n.cost));
  return Object.keys(out).length ? out : null;
}

/** Change one mod's note. A field set to `null` is cleared. */
export function setModNote(state: LogState, buildId: string, name: string, patch: { [K in keyof ModNote]?: ModNote[K] | null }): LogState {
  const log = logOf(state, buildId);
  const key = modKey(name);
  const merged: ModNote = { ...(log.mods[key] ?? {}) };
  for (const [k, v] of Object.entries(patch)) {
    if (v === null) delete (merged as Record<string, unknown>)[k];
    else if (v !== undefined) (merged as Record<string, unknown>)[k] = v;
  }
  const mods = { ...log.mods };
  const next = tidy(merged);
  if (next) mods[key] = next;
  else delete mods[key];
  return { ...state, builds: { ...state.builds, [buildId]: { ...log, mods } } };
}

export function addWish(state: LogState, buildId: string, wish: WishItem): LogState {
  const log = logOf(state, buildId);
  if (log.wishes.length >= MAX_WISHES || log.wishes.some((w) => modKey(w.name) === modKey(wish.name))) return state;
  return { ...state, builds: { ...state.builds, [buildId]: { ...log, wishes: [...log.wishes, wish] } } };
}

export function removeWish(state: LogState, buildId: string, wishId: string): LogState {
  const log = logOf(state, buildId);
  return { ...state, builds: { ...state.builds, [buildId]: { ...log, wishes: log.wishes.filter((w) => w.id !== wishId) } } };
}

// ---------------------------------------------------------------------------
// Demo: the sample builds' mods have dates too, so the timeline reads like a real one.
// ---------------------------------------------------------------------------

/** A sample build's mod ids look like "b-dan-0-m2" (seed.ts makeMods). Signed-in ids never do. */
const SEED_MOD = /^b-.+-m(\d+)$/;

/** Sample mods went on about every ten weeks, the last one a month ago. Null for a real build's mod. */
export function demoFittedOn(modId: string, modCount: number, today: Date): string | null {
  const m = SEED_MOD.exec(modId);
  if (!m) return null;
  const back = 30 + (modCount - 1 - Number(m[1])) * 70;
  const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - back);
  return isoDay(d);
}

/** The day a mod went on: the phone's note, else the demo's, else unknown. */
export function fittedOn(build: Pick<Build, 'mods'>, mod: Mod, log: BuildLog, today: Date): string | undefined {
  return log.mods[modKey(mod.name)]?.on ?? demoFittedOn(mod.id, build.mods.length, today) ?? undefined;
}

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------

export interface TimelineEntry {
  mod: Mod;
  /** YYYY-MM-DD, or undefined for a mod with no date yet. */
  on?: string;
  before?: string;
  after?: string;
}

/** The mods that count, in date order. Ones with no date come first ("Already on it"), in the order they were added. */
export function timeline(build: Pick<Build, 'mods'>, log: BuildLog, today: Date): TimelineEntry[] {
  const entries = countedMods(build.mods).map((mod, i) => {
    const note = log.mods[modKey(mod.name)];
    return { mod, on: fittedOn(build, mod, log, today), before: note?.before, after: note?.after, i };
  });
  entries.sort((a, b) => (a.on ?? '').localeCompare(b.on ?? '') || a.i - b.i);
  return entries.map(({ i: _i, ...e }) => e);
}

/** Whether a timeline is worth a page: a mod with a date, or (the owner) any mod at all. */
export function hasTimeline(build: Pick<Build, 'mods'>, log: BuildLog, today: Date, mine: boolean): boolean {
  const t = timeline(build, log, today);
  return mine ? t.length > 0 : t.some((e) => e.on);
}

/** The timeline as plain text for sharing: no costs, no numbers but the dates and power. */
export function timelineText(build: Pick<Build, 'make' | 'model' | 'mods'>, log: BuildLog, today: Date): string {
  const lines = timeline(build, log, today).map((e) => `${e.on ? runDay(e.on, today) : 'Earlier'}: ${e.mod.name}`);
  return [`${build.make} ${build.model}, build timeline`, ...lines].join('\n');
}

// ---------------------------------------------------------------------------
// Cost (private)
// ---------------------------------------------------------------------------

/** Whole pounds: "£1,250". */
export function poundsText(n: number): string {
  return `£${Math.round(n).toLocaleString('en-GB')}`;
}

/** Parse what was typed ("£1,250", "80"): whole pounds, or null when it isn't a sensible amount. */
export function parsePounds(s: string): number | null {
  const t = s.replace(/[£,\s]/g, '');
  if (!/^\d{1,7}$/.test(t)) return null;
  const n = Number(t);
  return n > 0 && n <= MAX_COST ? n : null;
}

/** What the build's current mods cost, and how many have a price. Gone mods don't count. */
export function costTotal(mods: readonly Pick<Mod, 'name'>[], log: BuildLog): { total: number; priced: number } {
  const seen = new Set<string>();
  let total = 0;
  let priced = 0;
  for (const m of mods) {
    const k = modKey(m.name);
    if (seen.has(k)) continue;
    seen.add(k);
    const c = log.mods[k]?.cost;
    if (c) {
      total += c;
      priced += 1;
    }
  }
  return { total, priced };
}

// ---------------------------------------------------------------------------
// Wishlist: who's fitted this?
// ---------------------------------------------------------------------------

/** Other people's builds with the same mod (same part, or the same job: any tune counts as a tune). Strongest first. */
export function whoFitted(wishName: string, builds: readonly Build[], me: string, limit = 8): Build[] {
  const unit = modUnit({ name: wishName });
  return builds
    .filter((b) => b.ownerId !== me && b.mods.some((m) => modUnit(m) === unit))
    .sort((a, b) => headlinePower(b).bhp - headlinePower(a).bhp)
    .slice(0, limit);
}

// ---------------------------------------------------------------------------
// Spec card
// ---------------------------------------------------------------------------

const KEY_ORDER: ModCategory[] = ['engine', 'turbo', 'intake', 'exhaust', 'suspension', 'brakes', 'wheels', 'body', 'interior', 'lighting', 'audio', 'other'];
export const SPEC_MODS = 5;

export interface SpecCard {
  title: string;
  /** "2021 · Car", with the nickname in front when there is one. */
  sub: string;
  bhp: number;
  est: boolean;
  letter: ReturnType<typeof classOf>;
  /** The mods that matter most, at most SPEC_MODS: biggest power gain first, then by kind of part. */
  keyMods: string[];
  /** How many mods are not on the card. */
  more: number;
}

/** The card's words. Never a number plate: the build has none to give. */
export function specCard(build: Build): SpecCard {
  const counted = countedMods(build.mods);
  const ranked = [...counted].sort((a, b) => (b.bhpGain ?? 0) - (a.bhpGain ?? 0) || KEY_ORDER.indexOf(a.category) - KEY_ORDER.indexOf(b.category));
  const p = headlinePower(build);
  const sub = [build.nickname, build.year ? String(build.year) : null, build.kind === 'bike' ? 'Bike' : 'Car'].filter(Boolean).join(' · ');
  return {
    title: `${build.make} ${build.model}`,
    sub,
    bhp: p.bhp,
    est: p.est,
    letter: classOf(build),
    keyMods: ranked.slice(0, SPEC_MODS).map((m) => m.name),
    more: Math.max(0, counted.length - SPEC_MODS),
  };
}

/** Share text for the card: the make, model, power and key mods, never a plate. */
export function specText(card: SpecCard): string {
  return [`${card.title}, ${card.bhp} bhp${card.est ? ' est.' : ''}`, card.keyMods.length ? card.keyMods.join(', ') : 'Standard', 'Built on Slipstream'].join('. ');
}
