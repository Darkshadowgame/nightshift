/**
 * Long lists in a ScrollView render a page at a time ("Show 30 more ›"), so a
 * busy weekend (hundreds of events) or a long meet chat doesn't build every
 * card at once and on every keystroke. Pure, so the screens stay simple.
 */

/** How many a page adds. */
export const PAGE = 30;

/** The first `shown` items, and how many the next "Show more" adds (0: nothing left). */
export function firstPage<T>(list: readonly T[], shown: number): { items: readonly T[]; more: number } {
  if (list.length <= shown) return { items: list, more: 0 };
  return { items: list.slice(0, shown), more: Math.min(PAGE, list.length - shown) };
}

/** The last `shown` items (a chat's newest), and how many the next "Show earlier" adds (0: nothing left). */
export function lastPage<T>(list: readonly T[], shown: number): { items: readonly T[]; earlier: number } {
  if (list.length <= shown) return { items: list, earlier: 0 };
  return { items: list.slice(list.length - shown), earlier: Math.min(PAGE, list.length - shown) };
}
