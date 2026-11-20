import { awardBuilds } from './bringing';
import { classOf } from './classes';
import { endTime } from './events';
import type { Build, ClassLetter, NightEvent } from './types';

/**
 * Post-meet voting and trophies.
 * - Only people who checked in at the event can vote, once per category, never for their own build.
 * - Voting opens when the event starts and closes 24 hours after it ends.
 * - A category needs at least MIN_VOTES votes to award a trophy.
 */

export const VOTING_HOURS_AFTER = 24;
export const MIN_VOTES = 3;
/** Per-class awards only at meets with at least this many people checked in. */
export const CLASS_AWARDS_MIN_ATTENDEES = 12;

export type AwardCategory =
  | 'best-in-show'
  | 'best-car'
  | 'best-bike'
  | `class-${ClassLetter}`
  | 'stance'
  | 'sound'
  | 'paint'
  | 'cleanest'
  | 'newcomer';

export interface CategoryInfo {
  key: AwardCategory;
  label: string;
  rep: number;
  /** Winners of these get a cover shoot. */
  cover: boolean;
  /** Winners of these get the map legend badge for a week. */
  legend: boolean;
}

const STYLE: CategoryInfo[] = [
  { key: 'stance', label: 'Best stance', rep: 150, cover: false, legend: false },
  { key: 'sound', label: 'Best sound', rep: 150, cover: false, legend: false },
  { key: 'paint', label: 'Best paint', rep: 150, cover: false, legend: false },
  { key: 'cleanest', label: 'Cleanest build', rep: 150, cover: false, legend: false },
  { key: 'newcomer', label: 'Best newcomer', rep: 150, cover: false, legend: false },
];

export function categoryInfo(key: AwardCategory): CategoryInfo {
  if (key === 'best-in-show') return { key, label: 'Best in show', rep: 500, cover: true, legend: true };
  if (key === 'best-car') return { key, label: 'Best car', rep: 300, cover: true, legend: false };
  if (key === 'best-bike') return { key, label: 'Best bike', rep: 300, cover: true, legend: false };
  if (key.startsWith('class-')) return { key, label: `Best ${key.slice(6)} class`, rep: 200, cover: false, legend: false };
  return STYLE.find((s) => s.key === key)!;
}

export interface Vote {
  eventId: string;
  voterId: string;
  category: AwardCategory;
  buildId: string;
  at: string;
}

export interface Award {
  eventId: string;
  category: AwardCategory;
  buildId: string;
  ownerId: string;
  votes: number;
  at: string;
}

export function attendeeIds(event: NightEvent): string[] {
  return Object.entries(event.checkIns)
    .filter(([, stops]) => stops.length > 0)
    .map(([u]) => u);
}

/**
 * Builds eligible for awards: the build each person who checked in brought.
 * Old data with no pick on record falls back to all of that person's builds.
 */
export function candidates(event: NightEvent, builds: Build[]): Build[] {
  return awardBuilds(event, builds);
}

/** At most three trophies per meet (Redesign 2). Kept for callers that cap the list. */
export const DEMO_TROPHIES = 3;

/** Trophies only one kind can win (REVIEW-10: a Ninja 400 up for Best stance): stance is a car thing. */
const CARS_ONLY: AwardCategory[] = ['stance'];

/**
 * Which trophies this event has, given who turned up (Redesign 2: three only), in the one order:
 * Best car, Best bike, Best in show. Best in show always; Best car and Best bike only when both cars
 * and bikes turned up. The other categories (per class,
 * stance, sound, paint, cleanest, newcomer) stay in the data but are never asked for or shown.
 * `max` keeps the first few, in this order.
 */
export function categoriesFor(event: NightEvent, builds: Build[], max?: number): AwardCategory[] {
  const cands = candidates(event, builds);
  const cars = cands.filter((b) => b.kind === 'car').length;
  const bikes = cands.filter((b) => b.kind === 'bike').length;
  // Best car, Best bike, then Best in show, everywhere (Review 16): the vote, the progress and the results.
  const cats: AwardCategory[] = [];
  if (cars >= 2 && bikes >= 1) cats.push('best-car');
  if (bikes >= 2 && cars >= 1) cats.push('best-bike');
  cats.push('best-in-show');
  return max ? cats.slice(0, max) : cats;
}

/** Builds that can win a category. */
export function eligibleFor(category: AwardCategory, event: NightEvent, builds: Build[]): Build[] {
  const cands = candidates(event, builds);
  if (category === 'best-car') return cands.filter((b) => b.kind === 'car');
  if (category === 'best-bike' || CARS_ONLY.includes(category)) return cands.filter((b) => b.kind === (category === 'best-bike' ? 'bike' : 'car'));
  if (category.startsWith('class-')) return cands.filter((b) => classOf(b) === category.slice(6));
  return cands;
}

/**
 * The builds shown first for one trophy (REVIEW-9 decision 8): a different few for each trophy, so
 * six trophies aren't the same three cards. Each trophy starts at its own place in the list; your
 * current vote is always shown. Everyone stays one tap away ("Show all").
 */
export function nominees<T extends { id: string }>(eligible: readonly T[], trophyIndex: number, count = 3, keep?: string): T[] {
  if (eligible.length <= count) return [...eligible];
  const start = (trophyIndex * count) % eligible.length;
  const picked = Array.from({ length: count }, (_, i) => eligible[(start + i) % eligible.length]);
  const kept = keep ? eligible.find((b) => b.id === keep) : undefined;
  if (kept && !picked.some((b) => b.id === kept.id)) picked[count - 1] = kept;
  return picked;
}

export function votingCloses(event: NightEvent): Date {
  return new Date(endTime(event).getTime() + VOTING_HOURS_AFTER * 3_600_000);
}

export type VoteCheck = { ok: true } | { ok: false; reason: string };

export function canVote(event: NightEvent, voterId: string, now: Date): VoteCheck {
  if (event.cancelled) return { ok: false, reason: 'This event was cancelled.' };
  if (now < new Date(event.startsAt)) return { ok: false, reason: 'Voting opens when the event starts.' };
  if (now >= votingCloses(event)) return { ok: false, reason: 'Voting has closed.' };
  if (!attendeeIds(event).includes(voterId)) return { ok: false, reason: 'Check in at the event to vote.' };
  return { ok: true };
}

/** Adds or replaces this voter's vote in a category. Throws on an invalid vote. */
export function castVote(
  votes: Vote[],
  event: NightEvent,
  builds: Build[],
  voterId: string,
  category: AwardCategory,
  buildId: string,
  now: Date,
): Vote[] {
  const check = canVote(event, voterId, now);
  if (!check.ok) throw new Error(check.reason);
  const build = eligibleFor(category, event, builds).find((b) => b.id === buildId);
  if (!build) throw new Error("That build can't win this award.");
  if (build.ownerId === voterId) throw new Error("You can't vote for your own build.");
  const rest = votes.filter((v) => !(v.eventId === event.id && v.voterId === voterId && v.category === category));
  return [...rest, { eventId: event.id, voterId, category, buildId, at: now.toISOString() }];
}

/** Winner of one category, or null. Ties go to the build that reached the top count first. */
export function winner(votes: Vote[], event: NightEvent, category: AwardCategory): { buildId: string; votes: number } | null {
  const mine = votes
    .filter((v) => v.eventId === event.id && v.category === category)
    .sort((a, b) => a.at.localeCompare(b.at));
  if (mine.length < MIN_VOTES) return null;
  const counts = new Map<string, number>();
  let best: { buildId: string; votes: number } | null = null;
  for (const v of mine) {
    const n = (counts.get(v.buildId) ?? 0) + 1;
    counts.set(v.buildId, n);
    if (!best || n > best.votes) best = { buildId: v.buildId, votes: n };
  }
  return best;
}

/** Final awards, once voting has closed. */
export function results(votes: Vote[], event: NightEvent, builds: Build[], now: Date): Award[] {
  if (now < votingCloses(event) || event.cancelled) return [];
  const at = votingCloses(event).toISOString();
  // Only votes for builds that are still candidates count (same as event_awards() on the server).
  const ids = new Set(candidates(event, builds).map((b) => b.id));
  const counted = votes.filter((v) => ids.has(v.buildId));
  return categoriesFor(event, builds).flatMap((category) => {
    const w = winner(counted, event, category);
    const build = w && builds.find((b) => b.id === w.buildId);
    return build ? [{ eventId: event.id, category, buildId: build.id, ownerId: build.ownerId, votes: w.votes, at }] : [];
  });
}

export function awardRep(awards: Award[], userId: string): number {
  return awards.filter((a) => a.ownerId === userId).reduce((sum, a) => sum + categoryInfo(a.category).rep, 0);
}

/** The map legend badge lasts a week after voting closes. */
export function hasLegend(awards: Award[], userId: string, now: Date): boolean {
  return awards.some(
    (a) => a.ownerId === userId && categoryInfo(a.category).legend && now.getTime() - new Date(a.at).getTime() < 7 * 86_400_000,
  );
}

/** Every trophy handed out so far, across all events. */
export function allAwards(votes: Vote[], events: NightEvent[], builds: Build[], now: Date): Award[] {
  return events.flatMap((e) => results(votes, e, builds, now));
}

/** One build's share of a demo trophy's votes. */
export interface TallyRow {
  buildId: string;
  votes: number;
  /** Your vote went to this build. */
  yours: boolean;
}

/** A small stable hash, so the demo's sample votes are the same on every run (12:30 and 20:30). */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/**
 * The demo's vote split for one trophy (Review 21 problem 4): the rest of the room's votes are
 * sample votes, spread over the builds in a fixed, made-up order of favour (about 40 / 30 / 20 /
 * 10%), plus yours. The winner is whoever has most, so your pick wins only when it's one of the
 * room's favourites; a tie goes to the room's favourite (it got there first). Sorted most first.
 * Never your own build. Demo only.
 */
export function previewTally(votes: Vote[], event: NightEvent, builds: Build[], me: string, category: AwardCategory): TallyRow[] {
  const options = eligibleFor(category, event, builds).filter((b) => b.ownerId !== me);
  if (!options.length) return [];
  const room = Math.max(MIN_VOTES, Math.round(attendeeIds(event).length / 2));
  const others = room - 1;
  const order = [...options].sort((a, b) => hash(`${event.id}:${category}:${a.id}`) - hash(`${event.id}:${category}:${b.id}`));
  const counts = new Map<string, number>();
  let left = others;
  for (const [i, b] of order.entries()) {
    // The favourite always leads the sample votes outright; the rest share what's left.
    const n = i === order.length - 1 ? left : i === 0 ? Math.min(left, Math.ceil(left * 0.4)) : Math.min(left, Math.max(1, Math.floor(left * 0.5)));
    counts.set(b.id, n);
    left -= n;
  }
  const mine = votes.find((v) => v.eventId === event.id && v.voterId === me && v.category === category)?.buildId;
  if (mine && counts.has(mine)) counts.set(mine, (counts.get(mine) ?? 0) + 1);
  return order
    .map((b, i) => ({ row: { buildId: b.id, votes: counts.get(b.id) ?? 0, yours: b.id === mine }, i }))
    .filter((x) => x.row.votes > 0)
    .sort((a, b) => b.row.votes - a.row.votes || a.i - b.i)
    .map((x) => x.row);
}

/**
 * The demo's trophy moment (Review 12, L4): the results as they'd look if voting closed now, so a
 * newcomer sees the trophy reveal straight after voting instead of "tomorrow 23:00". Each winner
 * comes from the room's sample votes plus yours (`previewTally`, Review 21 problem 4), so your pick
 * doesn't always win. `votes` on each award is the winner's own count. Never your own build. Demo only.
 */
export function previewResults(votes: Vote[], event: NightEvent, builds: Build[], me: string, at: Date): Award[] {
  return categoriesFor(event, builds).flatMap((category) => {
    const top = previewTally(votes, event, builds, me, category)[0];
    const build = top && builds.find((b) => b.id === top.buildId);
    return build ? [{ eventId: event.id, category, buildId: build.id, ownerId: build.ownerId, votes: top.votes, at: at.toISOString() }] : [];
  });
}
