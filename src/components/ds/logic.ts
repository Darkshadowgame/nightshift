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
