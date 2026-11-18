import { canVote, categoriesFor, results, votingCloses, categoryInfo, type Vote } from './awards';
import { broughtBuild } from './bringing';
import { classOf } from './classes';
import { canSeeStop, checkInOpensAt, checkInWindowOpen, endTime, hasRequested, isHost, isPublicType, phaseOf, revealTime } from './events';
import type { Role } from './eventView';
import { countdown } from './hud';
import { formatTime, formatWhen, plural } from './format';
import { locationSentence, NOT_OPEN } from './glossary';
import { classRange } from './invites';
import { clock, clockWithCountdown, dayWord } from './when';
import type { Build, ClassLetter, Crew, InviteFilter, NightEvent, User } from './types';

/**
 * The event page's state (Redesign 2, 3.5). Every state has one status line (the only place a
 * countdown appears) and one ActionBar shape:
 *
 * | kind        | status line                                              | ActionBar                           |
 * |-------------|----------------------------------------------------------|-------------------------------------|
 * | join        | "Location shows at 21:30 to people going."               | I'm going                           |
 * | join+request| "Open to Class A and up. Ask a host to let you in."      | Ask to go                           |
 * | requested   | "You asked to go. A host will say yes or no."            | status "Waiting for a host"         |
 * | waiting     | "Location shows at 21:30 (in 20 min)."                   | status "Location at 21:30" + Remind |
 * | navigate    | "Leisure park car park, Tamworth. Check-in opens at …"   | Navigate                            |
 * | checkin     | "Leisure park car park, Tamworth. Check-in is open."     | Check in + Navigate                 |
 * | checkedIn   | "You're checked in. Voting opens at 20:30."              | status "Checked in" + Navigate      |
 * | vote        | "You're checked in. Voting is open until 23:00 tomorrow."| Vote for best in show + Add a photo |
 * | voted       | "You voted. Results at 23:00 tomorrow."                  | Add a photo                         |
 * | ended       | "Ended. Best in show: @dan_r's BMW M4."                  | See photos (secondary)              |
 * | cancelled   | "Cancelled by the host."                                 | nothing                             |
 */
export type EventPrimary =
  /** Not going yet. `request`: not open to you, so a host has to say yes ("Ask to go"). */
  | { kind: 'join'; request: boolean }
  | { kind: 'requested' }
  | { kind: 'declined' }
  /** Going, the location isn't shown to you yet. `at`: when it shows (ISO). `placing`: the host hasn't placed it. */
  | { kind: 'waiting'; at: string; placing?: boolean }
  /** Going, the meet point is shown, before check-in opens (at `opensAt`). */
  | { kind: 'navigate'; opensAt: string }
  /** Going, check-in is open at the current meet point. */
  | { kind: 'checkin'; stopIndex: number }
  /** Checked in, nothing to vote on yet. */
  | { kind: 'checkedIn'; stopIndex: number }
  /** Checked in and voting is open; you haven't voted yet. */
  | { kind: 'vote' }
  /** You voted; results when voting closes. */
  | { kind: 'voted' }
  /** It's over (and nothing left for you to do). */
  | { kind: 'ended' }
  | { kind: 'cancelled' };

/** @deprecated name kept for older callers: the state is `EventPrimary`. */
export type EventState = EventPrimary;

export function eventPrimary(event: NightEvent, me: string, role: Role, crews: Crew[], builds: Build[], now: Date, votes: Vote[] = []): EventPrimary {
  const phase = phaseOf(event, now);
  if (phase === 'cancelled') return { kind: 'cancelled' };
  const host = isHost(event, me, crews);
  const going = event.going.includes(me);
  const current = event.type === 'rolling' ? event.currentStop : 0;
  const stop = event.stops[current];
  const checkedInHere = !!stop && (event.checkIns[me] ?? []).includes(stop.id);
  const voteOpen = canVote(event, me, now).ok && categoriesFor(event, builds).length > 0;
  const votedAny = votes.some((v) => v.eventId === event.id && v.voterId === me);
  if (voteOpen && (phase === 'over' || checkedInHere)) return votedAny ? { kind: 'voted' } : { kind: 'vote' };
  if (phase === 'over') return { kind: 'ended' };
  if (!host && !going) {
    if (hasRequested(event, me)) return { kind: 'requested' };
    if (event.declined?.includes(me)) return { kind: 'declined' };
    return { kind: 'join', request: !(role === 'invited' || role === 'public') };
  }
  const visible = canSeeStop(event, current, me, crews, now);
  if (checkedInHere) return { kind: 'checkedIn', stopIndex: current };
  if (visible && stop?.at && checkInWindowOpen(event, now)) return { kind: 'checkin', stopIndex: current };
  if (!visible || !stop?.at) {
    const at = revealTime(event);
    return { kind: 'waiting', at: at.toISOString(), ...(!stop?.at || at.getTime() <= now.getTime() ? { placing: true } : {}) };
  }
  return { kind: 'navigate', opensAt: checkInOpensAt(event).toISOString() };
}

/** "23:00 tomorrow", "23:00 tonight", "23:00 on Sat": a time later than now, for a sentence. */
export function untilText(d: Date, now: Date): string {
  const word = dayWord(d, now);
  const day = ['Tonight', 'Today', 'Tomorrow'].includes(word) ? word.toLowerCase() : `on ${word}`;
  return `${clock(d)} ${day}`;
}

/** "Open to Class A and up." / "Open to bikes only." / "Not open to your car." Why "Ask to go". */
export function openToLine(filter: InviteFilter): string {
  if (filter.everyone) return `${NOT_OPEN}.`;
  if (filter.classes.length > 0) {
    const order: ClassLetter[] = ['S', 'A', 'B', 'C', 'D'];
    const lowest = [...filter.classes].sort((a, b) => order.indexOf(b) - order.indexOf(a))[0];
    const upward = order.slice(0, order.indexOf(lowest) + 1).every((c) => filter.classes.includes(c));
    return upward ? (lowest === 'S' ? 'Open to Class S only.' : `Open to Class ${lowest} and up.`) : `Open to Class ${classRange(filter.classes)}.`;
  }
  if (filter.bikes && !filter.cars) return 'Open to bikes only.';
  if (filter.cars && !filter.bikes) return 'Open to cars only.';
  return `${NOT_OPEN}.`;
}

/** The town for the location line ("Tamworth"), from the event's area name. */
function townOf(event: NightEvent): string | undefined {
  return event.areaName || undefined;
}

/**
 * The event page's one status line (Redesign 2, 3.5 item 3; wording from 4.10 and 4.11). The only
 * place a countdown appears. `milesAway`: from your GPS fix, when there is one.
 */
export function statusLine(
  event: NightEvent,
  state: EventPrimary,
  ctx: { me: string; crews: Crew[]; builds: Build[]; users: User[]; votes: Vote[]; now: Date; milesAway?: number | null },
): { text: string; done?: boolean } {
  const { now } = ctx;
  const current = event.type === 'rolling' ? event.currentStop : 0;
  const stop = event.stops[current];
  const town = townOf(event);
  const reveal = revealTime(event);
  const shownSentence = () =>
    event.type === 'rolling' && current > 0
      ? locationSentence({ state: 'rolling', point: stop?.name })
      : locationSentence({ state: 'shown', point: event.type === 'cruise' ? event.stops[0]?.name : stop?.name, town: stop?.name?.includes(town ?? '\u0000') ? undefined : town });
  const minsTo = (d: Date) => (d.getTime() - now.getTime()) / 60_000;
  const host = isHost(event, ctx.me, ctx.crews);
  switch (state.kind) {
    case 'cancelled':
      return { text: 'Cancelled by the host.' };
    case 'join': {
      if (state.request) return { text: `${openToLine(event.filter)} Ask a host to let you in.` };
      if (isPublicType(event.type)) return { text: shownSentence() };
      if (reveal.getTime() > now.getTime()) return { text: locationSentence({ state: 'notGoing', time: clock(reveal) }) };
      // The area is in the page's meta line already ("Around Tamworth"): said once.
      return { text: 'The meet point shows to people going.' };
    }
    case 'requested':
      return { text: 'You asked to go. A host will say yes or no.' };
    case 'declined':
      return { text: 'A host said no to this one.' };
    case 'waiting':
      if (host && !state.placing) return { text: locationSentence({ state: 'host', time: clock(reveal), leadMinutes: event.revealMinutesBefore }) };
      if (state.placing) return { text: event.type === 'rolling' && current > 0 ? 'Next location when the host moves on.' : 'The host is still placing the meet point.' };
      return { text: locationSentence({ state: 'hidden', time: clock(reveal), minutesTo: minsTo(reveal) }) };
    case 'navigate': {
      const opens = new Date(state.opensAt);
      return { text: `${shownSentence()} Check-in opens at ${clockWithCountdown(opens, now)}.` };
    }
    case 'checkin':
      return { text: `${shownSentence()} ${ctx.milesAway != null ? `You're ${ctx.milesAway < 1 ? 'under 1 mi' : `${Math.round(ctx.milesAway)} mi`} away.` : 'Check-in is open.'}` };
    case 'checkedIn':
      return { text: now < new Date(event.startsAt) ? `You're checked in. Voting opens at ${clock(event.startsAt)}.` : event.type === 'rolling' && event.stops[current + 1] ? `You're checked in. ${locationSentence({ state: 'rolling', point: stop?.name })}` : "You're checked in.", done: true };
    case 'vote':
      return { text: `You're checked in. Voting is open until ${untilText(votingCloses(event), now)}.`, done: true };
    case 'voted':
      return { text: `You voted. Results at ${untilText(votingCloses(event), now)}.`, done: true };
    case 'ended': {
      if (now < votingCloses(event)) return { text: `Ended. Results at ${untilText(votingCloses(event), now)}.` };
      const best = results(ctx.votes, event, ctx.builds, now).find((a) => a.category === 'best-in-show');
      if (!best) return { text: 'Ended.' };
      const b = ctx.builds.find((x) => x.id === best.buildId);
      const who = best.ownerId === ctx.me ? 'you' : `@${ctx.users.find((u) => u.id === best.ownerId)?.handle ?? 'someone'}`;
      return { text: `Ended. ${categoryInfo('best-in-show').label}: ${who === 'you' ? 'your' : `${who}'s`} ${b ? `${b.make} ${b.model}` : 'build'}.` };
    }
  }
}

/** The ActionBar's status pill when there's no primary yet ("Location at 21:30"). */
export function statusPill(state: EventPrimary): string | null {
  switch (state.kind) {
    case 'waiting':
      return state.placing ? 'Meet point to come' : `Location at ${formatTime(state.at)}`;
    case 'requested':
      return 'Waiting for a host';
    case 'declined':
      return 'The host said no';
    case 'checkedIn':
      return 'Checked in';
    default:
      return null;
  }
}

/**
 * When, relative and absolute: "Starts in 2h 10m · Tonight 22:30", "Live · ends in 3h · 01:00",
 * "Finished · Sun 19:00–22:00". Used by the crew page.
 */
export function whenLine(event: NightEvent, now: Date): { relative: string; absolute: string } {
  const phase = phaseOf(event, now);
  const start = new Date(event.startsAt);
  const ends = event.endsAt ? `–${formatTime(event.endsAt)}` : '';
  if (phase === 'live') return { relative: `Live now, ends in ${legacyCountdown(endTime(event), now)}`, absolute: `${formatTime(event.startsAt)}${ends}` };
  if (phase === 'cancelled') return { relative: 'Cancelled', absolute: `${absoluteWhen(start, now)}${ends}` };
  if (phase === 'over') return { relative: 'Finished', absolute: `${absoluteWhen(start, now)}${ends}` };
  return { relative: `Starts in ${legacyCountdown(start, now)}`, absolute: `${formatWhen(event.startsAt, now)}${ends}` };
}

function legacyCountdown(at: Date, now: Date): string {
  return countdown(at, now);
}

/** formatWhen() says "Started 19:00" for anything in the last day; a finished event wants its day. */
function absoluteWhen(start: Date, now: Date): string {
  if (start.getTime() < now.getTime()) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return `${days[start.getDay()]} ${start.getDate()} ${start.toLocaleString('en-GB', { month: 'short' })} ${formatTime(start.toISOString())}`;
  }
  return formatWhen(start.toISOString(), now);
}

/** Cars and bikes going: "7 cars, 2 bikes" counts for goingSummary (no class codes). */
export function goingMix(event: NightEvent, builds: Build[]): { cars: number; bikes: number } {
  const brought = event.going.map((u) => broughtBuild(event, u, builds)).filter((b): b is Build => !!b);
  const cars = brought.filter((b) => b.kind === 'car').length;
  return { cars, bikes: brought.length - cars };
}

/**
 * Who's going in plain words: "6 cars, 1 bike, mostly A class", "4 bikes", "" when nobody's
 * bringing anything. Kept for older callers; the event page uses goingSummary().
 */
export function mixLine(event: NightEvent, builds: Build[]): string {
  const brought = event.going.map((u) => broughtBuild(event, u, builds)).filter((b): b is Build => !!b);
  if (!brought.length) return '';
  const cars = brought.filter((b) => b.kind === 'car').length;
  const bikes = brought.length - cars;
  const counts = new Map<ClassLetter, number>();
  for (const b of brought) counts.set(classOf(b), (counts.get(classOf(b)) ?? 0) + 1);
  const [top] = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const kinds = [cars ? plural(cars, 'car') : null, bikes ? plural(bikes, 'bike') : null].filter(Boolean).join(', ');
  const mostly = brought.length > 1 && top[1] * 2 >= brought.length ? `mostly ${top[0]} class` : null;
  return [kinds, mostly].filter(Boolean).join(', ');
}
