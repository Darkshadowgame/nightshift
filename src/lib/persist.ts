/**
 * How the store's state is saved on the phone (AsyncStorage), as a few
 * separate keys, one per slice, so a change only rewrites the slice it touched
 * (ticking a map layer rewrites the settings, not every event and chat line).
 * Pure helpers: the store does the reading and writing, debounced.
 */

/** Bump when the saved shape changes; older saves then go through the store's migrate(). */
export const SCHEMA_VERSION = 3;

/** Saves from before slices: one blob with everything in it (bundled places included). */
export const LEGACY_KEY = 'nightshift.v1';

export const SLICE_NAMES = ['meta', 'settings', 'builds', 'events', 'places', 'people'] as const;
export type SliceName = (typeof SLICE_NAMES)[number];

/** Which state fields live in which slice. Anything not listed goes in `meta`. */
const FIELDS: Record<Exclude<SliceName, 'meta'>, readonly string[]> = {
  settings: ['settings'],
  builds: ['builds'],
  events: ['events', 'chat', 'votes', 'unlockSeen', 'notices', 'nearby'],
  places: ['spots', 'placeProgress'],
  people: ['users', 'crews'],
};

const SLICE_OF = new Map<string, SliceName>(
  (Object.entries(FIELDS) as [SliceName, readonly string[]][]).flatMap(([slice, fields]) => fields.map((f) => [f, slice] as [string, SliceName])),
);

export function sliceKey(name: SliceName): string {
  return `nightshift.v2.${name}`;
}

export const SLICE_KEYS: string[] = SLICE_NAMES.map(sliceKey);

export function sliceOf(field: string): SliceName {
  return SLICE_OF.get(field) ?? 'meta';
}

/** The state split into its slices (each a plain object of some of its fields). */
export function splitState(state: object): Record<SliceName, Record<string, unknown>> {
  const out = Object.fromEntries(SLICE_NAMES.map((n) => [n, {}])) as Record<SliceName, Record<string, unknown>>;
  for (const [k, v] of Object.entries(state)) out[sliceOf(k)][k] = v;
  return out;
}

/**
 * Slices with a field that changed since the last save. State updates are
 * immutable, so comparing references is enough. Everything, with no last save.
 */
export function changedSlices(prev: object | null, next: object): SliceName[] {
  if (!prev) return [...SLICE_NAMES];
  const a = prev as Record<string, unknown>;
  const b = next as Record<string, unknown>;
  const changed = new Set<SliceName>();
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) if (a[k] !== b[k]) changed.add(sliceOf(k));
  return SLICE_NAMES.filter((n) => changed.has(n));
}

/** Put the saved slices back together. Null when there's no saved state (no `meta` slice) or a slice is unreadable. */
export function joinSlices(raw: readonly (readonly [string, string | null])[]): Record<string, unknown> | null {
  const byKey = new Map(raw);
  if (!byKey.get(sliceKey('meta'))) return null;
  const out: Record<string, unknown> = {};
  for (const n of SLICE_NAMES) {
    const text = byKey.get(sliceKey(n));
    if (!text) continue;
    try {
      Object.assign(out, JSON.parse(text));
    } catch {
      return null;
    }
  }
  return out;
}

/** Older than the current shape (a slice-less save has no version): needs migrate(). */
export function needsMigration(saved: { schemaVersion?: number }): boolean {
  return (saved.schemaVersion ?? 1) < SCHEMA_VERSION;
}
