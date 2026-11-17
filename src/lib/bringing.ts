import { classOf } from './classes';
import { isHost, isPublicType } from './events';
import { buildMatches, invitees } from './invites';
import { milesBetween } from './geo';
import { swapTag } from './swap';
import { stageFromMods, stageLabel } from './tune';
import type { Build, ClassLetter, Crew, NightEvent, User } from './types';
import { CLASS_LETTERS } from './types';

/**
 * Which car or bike someone is bringing to an event. Stored per person per
 * event in `event.vehicles` (going and asked to go), and on the server in
 * event_going.build_id / event_requests.build_id
 * (supabase/migrations/20261117130000_event_vehicles.sql mirrors these rules).
 *
 * - Everything that shows who's coming uses the brought build, not "their first build".
 * - Award candidates are the builds people who checked in brought. Old data
 *   with no choice falls back to all of that person's builds.
 * - Invite matching for alerts and search still looks at any of their builds:
 *   that's about whether they could go at all.
 */

export function ownBuilds(userId: string, builds: Build[]): Build[] {
  return builds.filter((b) => b.ownerId === userId);
}

/** Does the invite cover this build? Public events and "everyone welcome" cover every build. */
export function fitsInvite(event: NightEvent, build: Build): boolean {
  return isPublicType(event.type) || event.filter.everyone || buildMatches(build, event.filter);
}

/**
 * Would this person go straight in bringing this build (else it's a request)?
 * Hosts and public events always; otherwise a home inside the invite radius
 * and a build the invite covers. With no build, the old any-build rule.
 */
export function canGoWith(event: NightEvent, userId: string, crews: Crew[], users: User[], builds: Build[], build?: Build): boolean {
  if (isHost(event, userId, crews) || isPublicType(event.type)) return true;
  const user = users.find((u) => u.id === userId);
  if (!user) return false;
  if (!build) return invitees([user], builds, event.filter, event.area).userIds.includes(userId);
  if (milesBetween(user.home, event.area) > event.filter.radiusMiles) return false;
  return fitsInvite(event, build);
}

/** The build this person picked for this event, if it still exists and is theirs. */
export function chosenBuild(event: NightEvent, userId: string, builds: Build[]): Build | undefined {
  const id = event.vehicles?.[userId];
  return id ? builds.find((b) => b.id === id && b.ownerId === userId) : undefined;
}

/** The build they brought most recently to another event they were going to. */
export function lastBrought(events: NightEvent[], userId: string, builds: Build[], exceptEventId?: string): Build | undefined {
  const past = events
    .filter((e) => e.id !== exceptEventId && e.going.includes(userId) && e.vehicles?.[userId])
    .sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime());
  for (const e of past) {
    const b = chosenBuild(e, userId, builds);
    if (b) return b;
  }
  return undefined;
}

/**
 * Which build the picker starts on: the one already picked for this event;
 * else the last one they brought, if the invite covers it; else the first
 * the invite covers; else the last brought; else their first build.
 */
export function defaultBuild(event: NightEvent, userId: string, builds: Build[], events: NightEvent[]): Build | undefined {
  const own = ownBuilds(userId, builds);
  if (own.length === 0) return undefined;
  const chosen = chosenBuild(event, userId, builds);
  if (chosen) return chosen;
  const last = lastBrought(events, userId, builds, event.id);
  if (last && fitsInvite(event, last)) return last;
  return own.find((b) => fitsInvite(event, b)) ?? last ?? own[0];
}

/**
 * The build to show for someone going (or asking to go): their pick, or for
 * old data without one, the first build the invite covers, else their first.
 */
export function broughtBuild(event: NightEvent, userId: string, builds: Build[]): Build | undefined {
  const chosen = chosenBuild(event, userId, builds);
  if (chosen) return chosen;
  const own = ownBuilds(userId, builds);
  return own.find((b) => fitsInvite(event, b)) ?? own[0];
}

/** Award candidates: what each person who checked in brought (all their builds only when there's no pick on record). */
export function awardBuilds(event: NightEvent, builds: Build[]): Build[] {
  const people = Object.entries(event.checkIns)
    .filter(([, stops]) => stops.length > 0)
    .map(([u]) => u);
  return people.flatMap((u) => {
    const chosen = chosenBuild(event, u, builds);
    return chosen ? [chosen] : ownBuilds(u, builds);
  });
}

/** Class counts of what people going are bringing, S first. Only classes with someone in. */
export function classMix(event: NightEvent, builds: Build[]): { letter: ClassLetter; count: number }[] {
  const counts = new Map<ClassLetter, number>();
  for (const u of event.going) {
    const b = broughtBuild(event, u, builds);
    if (b) counts.set(classOf(b), (counts.get(classOf(b)) ?? 0) + 1);
  }
  return CLASS_LETTERS.filter((l) => counts.has(l)).map((letter) => ({ letter, count: counts.get(letter)! }));
}

/** "2S 3A 1B": what people going are bringing, by class. '' when nobody's bringing anything. */
export function classMixText(event: NightEvent, builds: Build[]): string {
  return classMix(event, builds)
    .map((c) => `${c.count}${c.letter}`)
    .join(' ');
}

/** Short tag for the picker and lists: the engine swap and the tune stage, e.g. "K20 swap · Stage 2". */
export function buildTag(build: Build): string | null {
  const stage = build.tuneStage ?? stageFromMods(build.mods);
  const parts = [swapTag(build), stage !== 'stock' ? stageLabel(stage) : null].filter(Boolean);
  return parts.length ? parts.join(' · ') : null;
}

/** One line for lists: "BMW M4 Competition · Stage 1". */
export function buildLine(build: Build): string {
  const tag = buildTag(build);
  return `${build.make} ${build.model}${tag ? ` · ${tag}` : ''}`;
}
