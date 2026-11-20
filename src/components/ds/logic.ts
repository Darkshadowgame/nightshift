/**
 * Pure helpers behind the design-system components. No React Native imports, so
 * they're tested directly (__tests__/designSystem.test.ts).
 */
import { C } from '../../theme';

/**
 * A layer colour on content (a kind eyebrow, a list-row pin, a card's accent), never sodium
 * (Redesign 2, 5.4; Review 12 decision 5): the Events layer is sodium on the map, but off the map
 * sodium means "tap this" or "on", so a meet's kind line and pin go `fallback` (fog) instead.
 */
export function contentColour(colour: string | null | undefined, fallback: string): string {
  return !colour || colour.toLowerCase() === C.sodium.toLowerCase() ? fallback : colour;
}

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

/**
 * A line as drawn, so it wraps cleanly (Review 21 gaps 10, 13, 14):
 * - each " · " becomes " ·" + a no-break space: a line can break before a dot but never after one,
 *   so no line ends on "·" ("Triumph Street Triple RS ·" / "131 bhp") and "· 131 bhp" moves down whole;
 * - a number keeps its unit ("25 mi", "4 going", "131 bhp"): no unit alone on the next line.
 * DsText does this to every string it draws, so EventRow, BuildLine, post author lines and the
 * Tonight cards all wrap the same way. Labels read out are untouched.
 */
export function keepTogether(s: string): string {
  return s.replace(/[ \u00a0]·[ \u00a0]/g, ' ·\u00a0').replace(UNIT_AFTER_NUMBER, '$1\u00a0$2');
}
const UNIT_AFTER_NUMBER = /(\d) (mi|km|miles?|bhp|whp|hp|ps|cars?|bikes?|mins?|going)\b/g;

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

/**
 * How long a toast stays: 3.2 s, every toast, with or without Undo (Redesign 2, 4.7; Review 13
 * measured 5.5 s when this grew with the action and the length). The arguments stay so callers
 * don't change; the rule is one length.
 */
export function toastDuration(_message: string, _hasAction: boolean, base = 3200): number {
  return base;
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

/** A hex colour at an alpha, as rgba(): gradients over a build's paint colour. */
export function rgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const full = h.length === 3 || h.length === 4 ? h.slice(0, 3).split('').map((c) => c + c).join('') : h.slice(0, 6);
  const n = parseInt(full, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

/** Up to `max` faces for a GoingStrip, and how many more there are ("+3"). */
export function stripFaces<T>(people: readonly T[], max = 6): { shown: T[]; more: number } {
  const shown = people.slice(0, Math.max(0, max));
  return { shown, more: Math.max(0, people.length - shown.length) };
}

const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "Fri 20": a day chip's date line. */
export function shortDay(d: Date): string {
  return `${WEEKDAY_SHORT[d.getDay()]} ${d.getDate()}`;
}

/** "Fri 20 Nov". */
export function shortDate(d: Date): string {
  return `${WEEKDAY_SHORT[d.getDay()]} ${d.getDate()} ${MONTH_SHORT[d.getMonth()]}`;
}

/**
 * An end time said against its start (Redesign 2, 4.10): an end in the small hours (before 05:00)
 * of the day after the start is "01:00 (after midnight)", never "Tonight 01:00" next to a start
 * that is also "Tonight". Anything else is null: say it the usual way (`whenLabel`).
 */
export function afterMidnightLabel(end: Date, start: Date): string | null {
  const next = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1);
  const sameDayAsNext = end.getFullYear() === next.getFullYear() && end.getMonth() === next.getMonth() && end.getDate() === next.getDate();
  if (!sameDayAsNext || end.getHours() >= 5 || start.getHours() < 12) return null;
  return `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')} (after midnight)`;
}

/**
 * How far a photo's shape can be from its frame's (10%) and still fill it. Past this, filling
 * would cut off a real part of the picture (a portrait phone photo in a 4:3 card loses its top and
 * bottom), so the photo is shown whole instead.
 */
export const FIT_TOLERANCE = 0.1;

/**
 * How to draw a photo in a fixed frame (aspects are width / height):
 * - `cover` fills the frame, cropping a little, when the shapes are close (within `tolerance`);
 * - `contain` shows the whole photo, centred over a blurred copy of itself (FitImage), when they
 *   differ by more. A user's photo is never cropped in a way that loses the subject.
 * An unknown or broken aspect gives `cover` (nothing to compare).
 */
export function fitMode(photoAspect: number | null | undefined, frameAspect: number | null | undefined, tolerance = FIT_TOLERANCE): 'cover' | 'contain' {
  if (!photoAspect || !frameAspect || !Number.isFinite(photoAspect) || !Number.isFinite(frameAspect) || photoAspect <= 0 || frameAspect <= 0) return 'cover';
  const apart = Math.max(photoAspect, frameAspect) / Math.min(photoAspect, frameAspect) - 1;
  return apart > tolerance + 1e-9 ? 'contain' : 'cover';
}
