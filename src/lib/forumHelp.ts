import type { ForumThread, Listing } from './forum';
import { parseFaultCode } from './faultCodes';
import { inGroup, makeKeyOf } from './forumGroups';

/**
 * Forum help: ranking for search, the "Common problems" guide, "Fits your <model>" and the
 * "recently sold for" range. Pure functions over threads, so the demo and the server share them.
 */

/** Keys for the groups of a garage, model groups first (suggestedGroups' order). */
export interface GarageGroup {
  key: string;
  label: string;
}

/**
 * How well a thread answers a search, higher is better. Solved is the biggest lift (someone has
 * already fixed it), then being in a group for your own vehicle (your model beats your make), then
 * a fault code in the title. Search results keep their order among equals.
 */
export function searchScore(t: ForumThread, query: string, garage: GarageGroup[]): number {
  let score = 0;
  if (t.solvedReplyId) score += 4;
  if (t.groupKey) {
    const exact = garage.some((g) => g.key === t.groupKey);
    const same = garage.some((g) => inGroup(t.groupKey, g.key) || (g.key.includes(':') && makeKeyOf(g.key) === t.groupKey));
    if (exact) score += 3;
    else if (same) score += 1;
  }
  const code = parseFaultCode(query);
  if (code && t.title.toUpperCase().includes(code)) score += 2;
  return score;
}

/** Search results best first: solved, then your vehicle's group, then the order they came in. */
export function rankSearch(threads: ForumThread[], query: string, garage: GarageGroup[]): ForumThread[] {
  if (!query.trim()) return threads;
  return threads
    .map((t, i) => ({ t, i, s: searchScore(t, query, garage) }))
    .sort((a, b) => b.s - a.s || a.i - b.i)
    .map((x) => x.t);
}

/** A solved thread with how many people found its fixing reply helpful. */
export interface SolvedProblem {
  thread: ForumThread;
  helpful: number;
}

/**
 * "Common problems" for a group: its solved threads (a make group takes its models'), the ones
 * whose fixing reply helped most first, then the busiest. Hidden threads never count.
 */
export function commonProblems(threads: ForumThread[], helpfulByReply: Record<string, number>, group: string, limit = 5): SolvedProblem[] {
  return threads
    .filter((t) => t.solvedReplyId && !t.hidden && !t.listing && inGroup(t.groupKey, group))
    .map((thread) => ({ thread, helpful: helpfulByReply[thread.solvedReplyId!] ?? 0 }))
    .sort((a, b) => b.helpful - a.helpful || b.thread.replyCount - a.thread.replyCount || b.thread.lastActivityAt.localeCompare(a.thread.lastActivityAt))
    .slice(0, limit);
}

/**
 * "Fits your SEAT Leon": a For sale listing (not sold, not wanted) tagged with a group that is in
 * your garage. Your model beats your make. Null when it doesn't fit.
 */
export function fitsLabel(t: Pick<ForumThread, 'listing' | 'groupKey'>, garage: GarageGroup[]): string | null {
  const l = t.listing;
  if (!l || l.kind !== 'sale' || l.soldAt || !t.groupKey) return null;
  const hit = garage.find((g) => g.key === t.groupKey) ?? garage.find((g) => !g.key.includes(':') && inGroup(t.groupKey, g.key));
  return hit ? `Fits your ${hit.label}` : null;
}

/** What parts sold for: the lowest and highest, with how many sales it comes from. */
export interface SoldRange {
  low: number;
  high: number;
  count: number;
}

/** A range needs at least this many sales, so one seller's price is never shown as "the" price. */
export const MIN_SOLD_SAMPLE = 3;

export function soldRange(prices: number[]): SoldRange | null {
  const p = prices.filter((x) => Number.isInteger(x) && x >= 0);
  if (p.length < MIN_SOLD_SAMPLE) return null;
  return { low: Math.min(...p), high: Math.max(...p), count: p.length };
}

function pounds(pence: number): string {
  const p = pence % 100;
  return `£${Math.floor(pence / 100).toLocaleString('en-GB')}${p ? `.${String(p).padStart(2, '0')}` : ''}`;
}

/** "Recently sold for £35 to £55 (3 sales)", or a single figure when they all matched. */
export function soldRangeLabel(r: SoldRange): string {
  const range = r.low === r.high ? pounds(r.low) : `${pounds(r.low)} to ${pounds(r.high)}`;
  return `Recently sold for ${range} (${r.count} sales)`;
}

/** Sold sale listings' prices, newest sale first, only those that recorded one, within a group and a search. */
export function soldPricesOf(threads: ForumThread[], opts: { group?: string | null; query?: string; sinceIso?: string }): number[] {
  const words = (opts.query ?? '').toLowerCase().split(/\s+/).filter(Boolean);
  return threads
    .filter((t) => {
      const l: Listing | undefined = t.listing;
      if (!l || l.kind !== 'sale' || !l.soldAt || l.soldPricePence == null || t.hidden) return false;
      if (opts.sinceIso && l.soldAt < opts.sinceIso) return false;
      if (opts.group && !inGroup(t.groupKey, opts.group)) return false;
      const text = `${t.title} ${t.body}`.toLowerCase();
      return words.every((w) => text.includes(w));
    })
    .sort((a, b) => b.listing!.soldAt!.localeCompare(a.listing!.soldAt!))
    .map((t) => t.listing!.soldPricePence!);
}

/** Sales older than this are left out of "recently sold for". */
export const SOLD_WINDOW_DAYS = 180;
