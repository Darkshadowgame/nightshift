/**
 * Pure helpers behind the design-system components. No React Native imports, so
 * they're tested directly (__tests__/designSystem.test.ts).
 */

/**
 * Up to two initials for an avatar. Prefers the name ("Sam Patel" → "SP", "Ana" → "A"),
 * falls back to the handle ("@night_owl" → "N"), then "?". Letters only, uppercased,
 * so emoji and punctuation never end up in the tile.
 */
export function initials(name?: string | null, handle?: string | null): string {
  const letters = (s: string) =>
    s
      .split(/[\s._-]+/)
      .map((w) => Array.from(w).find((ch) => /\p{L}|\p{N}/u.test(ch)) ?? '')
      .filter(Boolean);
  // A name that is just the handle (the demo and sign-up set one from the other) reads like a handle:
  // one letter, so "ek_fk8" is "E" like everyone else's, not "EF" (REVIEW-7 inconsistency 7).
  const bare = (s: string) => s.trim().replace(/^@/, '').toLowerCase();
  if (name && handle && bare(name) === bare(handle)) name = null;
  const fromName = name ? letters(name.trim()) : [];
  if (fromName.length >= 2) return (fromName[0] + fromName[fromName.length - 1]).toUpperCase();
  if (fromName.length === 1) return fromName[0].toUpperCase();
  const fromHandle = handle ? letters(handle.replace(/^@/, '')) : [];
  if (fromHandle.length) return fromHandle[0].toUpperCase();
  return '?';
}

/** A handle as shown: always one leading "@", never uppercased. */
export function displayHandle(handle: string): string {
  return `@${handle.replace(/^@+/, '')}`;
}

/**
 * Filter chips are multi-select. Tapping toggles one key; order follows `order`
 * when given so the selection reads the same way as the chips.
 */
export function toggleSelection<K extends string>(selected: readonly K[], key: K, order?: readonly K[]): K[] {
  const next = selected.includes(key) ? selected.filter((k) => k !== key) : [...selected, key];
  if (!order) return next;
  return order.filter((k) => next.includes(k));
}

/**
 * The one rule for filter chips: **nothing selected means no filter** (show everything).
 * Selecting every option is the same as selecting none, so it collapses back to [].
 */
export function normaliseSelection<K extends string>(selected: readonly K[], all: readonly K[]): K[] {
  const valid = all.filter((k) => selected.includes(k));
  return valid.length === all.length ? [] : valid;
}

/** Does an item with `value` pass a chip filter? Empty selection lets everything through. */
export function passesFilter<K extends string>(selected: readonly K[], value: K | readonly K[]): boolean {
  if (selected.length === 0) return true;
  const values: readonly K[] = Array.isArray(value) ? (value as readonly K[]) : [value as K];
  return values.some((v) => selected.includes(v));
}

/** "All", "Cars", "Cars and bikes", "3 selected": what a filter row is set to, for its accessibility label and summary. */
export function selectionSummary(labels: readonly string[], allLabel = 'All'): string {
  if (labels.length === 0) return allLabel;
  if (labels.length === 1) return labels[0];
  if (labels.length === 2) return `${labels[0]} and ${labels[1].toLowerCase()}`;
  return `${labels.length} selected`;
}

/** A segment label with an optional count: "Mine 3". Zero is shown (it's information); undefined isn't. */
export function segmentLabel(label: string, count?: number): string {
  return count === undefined ? label : `${label} ${count}`;
}

/** Joins the parts of a meta line with " · ", skipping empties. */
export function metaLine(parts: readonly (string | number | null | undefined | false)[]): string {
  return parts.filter((p) => p !== null && p !== undefined && p !== false && `${p}`.trim() !== '').join(' · ');
}

export type EntityKind = 'person' | 'build' | 'event' | 'place';

/** The words read out for a card or row: kind, title, meta, detail, tags, in reading order. */
export function entityA11yLabel(v: {
  kind?: EntityKind;
  eyebrow?: string;
  title: string;
  meta?: string;
  detail?: string;
  tags?: readonly string[];
  sample?: boolean;
}): string {
  const kind = v.eyebrow ?? (v.kind ? v.kind[0].toUpperCase() + v.kind.slice(1) : undefined);
  const parts = [kind, v.title, v.meta, v.detail, ...(v.tags ?? []), v.sample ? 'Sample, for the demo' : undefined];
  return parts.filter((p): p is string => !!p && p.trim() !== '').join(', ');
}

/** A stat as read out: "Power 583 bhp". */
export function statA11yLabel(s: { label: string; value: string; unit?: string }): string {
  return [s.label, s.value, s.unit].filter(Boolean).join(' ');
}

/** How long a toast stays: longer when it has an action or a long message. */
export function toastDuration(message: string, hasAction: boolean, base = 3200): number {
  const extra = Math.max(0, message.length - 60) * 30;
  return Math.min(base + extra + (hasAction ? 2000 : 0), 8000);
}

/** "2026-11-18" for a date in local time (the date picker's value). */
export function localDay(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** A local "YYYY-MM-DD" back to a Date at local noon, or null if it isn't one. */
export function parseLocalDay(s: string | null | undefined): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s ?? '');
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12);
  return d.getMonth() === Number(m[2]) - 1 ? d : null;
}

/**
 * A month for the date picker: rows of seven local days, Monday first, with null for the
 * blanks before the 1st and after the last day.
 */
export function monthGrid(year: number, month: number): (string | null)[][] {
  const first = new Date(year, month, 1, 12);
  const lead = (first.getDay() + 6) % 7;
  const days = new Date(year, month + 1, 0, 12).getDate();
  const cells: (string | null)[] = [...Array(lead).fill(null)];
  for (let d = 1; d <= days; d++) cells.push(localDay(new Date(year, month, d, 12)));
  while (cells.length % 7) cells.push(null);
  const rows: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  return rows;
}
