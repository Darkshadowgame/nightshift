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

/** Builds eligible for awards: every build owned by someone who checked in. */
export function candidates(event: NightEvent, builds: Build[]): Build[] {
  const people = new Set(attendeeIds(event));
  return builds.filter((b) => people.has(b.ownerId));
}

/** Which categories this event has, given who turned up. */
export function categoriesFor(event: NightEvent, builds: Build[]): AwardCategory[] {
  const cands = candidates(event, builds);
  const cats: AwardCategory[] = ['best-in-show'];
  const cars = cands.filter((b) => b.kind === 'car').length;
  const bikes = cands.filter((b) => b.kind === 'bike').length;
  if (cars >= 2 && bikes >= 1) cats.push('best-car');
  if (bikes >= 2 && cars >= 1) cats.push('best-bike');
  if (attendeeIds(event).length >= CLASS_AWARDS_MIN_ATTENDEES) {
    for (const letter of ['S', 'A', 'B', 'C', 'D'] as ClassLetter[]) {
      if (cands.filter((b) => classOf(b) === letter).length >= 2) cats.push(`class-${letter}`);
    }
  }
  cats.push(...STYLE.map((s) => s.key));
  return cats;
}

/** Builds that can win a category. */
export function eligibleFor(category: AwardCategory, event: NightEvent, builds: Build[]): Build[] {
  const cands = candidates(event, builds);
  if (category === 'best-car') return cands.filter((b) => b.kind === 'car');
  if (category === 'best-bike') return cands.filter((b) => b.kind === 'bike');
  if (category.startsWith('class-')) return cands.filter((b) => classOf(b) === category.slice(6));
  return cands;
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
  return categoriesFor(event, builds).flatMap((category) => {
    const w = winner(votes, event, category);
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
