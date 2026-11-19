import { canVote, categoriesFor, votingCloses, type Vote } from './awards';
import { broughtBuild } from './bringing';
import { classOf } from './classes';
import { canSeeStop, checkInOpensAt, checkInWindowOpen, endTime, hasRequested, isHost, isPublicType, phaseOf, revealTime } from './events';
import type { Role } from './eventView';
import { countdown } from './hud';
import { formatTime, formatWhen, plural } from './format';
import { aroundArea, locationSentence, NOT_OPEN } from './glossary';
import { classRange } from './invites';
import { clock, clockWithCountdown, dayWord, whenLabel } from './when';
import type { Build, ClassLetter, Crew, InviteFilter, NightEvent, User } from './types';

/**
 * The event page's state (Redesign 2, 3.5). Every state has one place line (where, in the 4.11
 * words only), at most one status note (the next step; the only place a countdown appears) and
 * one ActionBar shape (Review 14, 4.11: the place line says only where):
 *
 * | kind        | place line                                   | status note                          | ActionBar                    |
 * |-------------|----------------------------------------------|--------------------------------------|------------------------------|
 * | join        | "Location shows at 21:30 to people going."   |                                      | I'm going                    |
 * | join+request| "Location shows at 21:30 to people going."   | (own row: "Open to Class A and up. Ask a host to let you in.") | Ask to go |
 * | requested   | "You asked to go. A host will say yes or no."|                                      | nothing                      |
 * | waiting     | "Location shows at 21:30 (in 20 min)."       |                                      | Remind me (or Can't make it) |
 * | navigate    | "Leisure park car park, Tamworth."           | "Check-in opens at 21:00 (in 20 min)." | Navigate                   |
 * | checkin     | "Leisure park car park, Tamworth."           | ("You're 2 mi away." with a fix)     | Check in + Navigate          |
 * | checkedIn   | "Leisure park car park, Tamworth."           | "Voting opens at 20:30." (if early)  | Navigate / Add a photo       |
 * | vote        | "Leisure park car park, Tamworth."           | "Voting closes tomorrow 23:00." (demo: none) | Vote + Add a photo |
 * | voted       | "Leisure park car park, Tamworth."           | "Results tomorrow 23:00." (demo: none; the results show) | Add a photo + Vote (trophies left) |
 * | ended       | "Leisure park car park, Tamworth." / "Around Tamworth." | "Results tomorrow 23:00." (until then) | See photos (secondary) |
 * | cancelled   | "Cancelled by the host."                     |                                      | nothing                      |
 *
 * "Check-in is open" is never said: the ActionBar's Check in says it. Each fact once (C5): being
 * going or checked in is the hero's status tag (`myEventStatus`) and the toast, never the place
 * line too. Once the meet point is shown it stays named, checked in or not.
 */
/** Results out (or, in the demo, as soon as you've voted). The winners themselves are on the cover. */
export const RESULTS_IN = 'Results are in.';

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

/**
 * "tomorrow 23:00", "tonight 23:00", "Sat 23:00": a later time in the 4.10 form (`whenLabel`), for
 * the middle of a sentence (the day word in lower case).
 */
export function untilText(d: Date, now: Date): string {
  const label = whenLabel(d, now);
  return ['Tonight', 'Today', 'Tomorrow'].includes(dayWord(d, now)) ? label.charAt(0).toLowerCase() + label.slice(1) : label;
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
 * The event page's place line and status note (Redesign 2, 3.5 item 3; wording from 4.10 and 4.11).
 * `text` is the place line: where, and nothing else, once the meet point shows (Review 14). `note`
 * is the one next step, said once; the only place a countdown appears. `milesAway`: from your GPS
 * fix, when there is one. `resultsIn` (the demo): you've voted, so voting is closed for you and the
 * results show now.
 */
export function statusLine(
  event: NightEvent,
  state: EventPrimary,
  ctx: { me: string; crews: Crew[]; builds: Build[]; users: User[]; votes: Vote[]; now: Date; milesAway?: number | null; resultsIn?: boolean; demo?: boolean; trophies?: number },
): { text: string; note?: string; done?: boolean; /** Who can come, when it isn't you yet: its own row, never in the place line (4.11, Review 19). */ eligibility?: string } {
  const { now } = ctx;
  const current = event.type === 'rolling' ? event.currentStop : 0;
  const stop = event.stops[current];
  const town = townOf(event);
  const reveal = revealTime(event);
  const shownSentence = () =>
    event.type === 'rolling' && current > 0
      ? locationSentence({ state: 'rolling', point: stop?.name })
      : // 4.11: "{Meet point name}, {Town}.", the town left off when the name already says it (Review 19).
        locationSentence({ state: 'shown', point: event.type === 'cruise' ? event.stops[0]?.name : stop?.name, town });
  const minsTo = (d: Date) => (d.getTime() - now.getTime()) / 60_000;
  const host = isHost(event, ctx.me, ctx.crews);
  switch (state.kind) {
    case 'cancelled':
      return { text: 'Cancelled by the host.' };
    case 'join': {
      // A connection invited you (eventInvites.ts): who, as the one next-step note.
      const by = event.invitedBy?.[ctx.me];
      const handle = by ? ctx.users.find((u) => u.id === by)?.handle : undefined;
      const invited = handle ? { note: `Invited by @${handle}.` } : {};
      // The place line only ever talks about the place (4.11, Review 19): who can come is its own row.
      const eligibility = state.request ? { eligibility: `${openToLine(event.filter)} Ask a host to let you in.` } : {};
      if (isPublicType(event.type)) return { text: shownSentence(), ...invited, ...eligibility };
      // Already shown to people going (a live meet): no time to give. The 4.11 words either way.
      return { text: locationSentence({ state: 'notGoing', time: reveal.getTime() > now.getTime() ? clock(reveal) : undefined }), ...invited, ...eligibility };
    }
    case 'requested':
      return { text: 'You asked to go. A host will say yes or no.' };
    case 'declined':
      return { text: 'A host said no to this one.' };
    case 'waiting':
      if (host && !state.placing) return { text: locationSentence({ state: 'host', time: clock(reveal), leadMinutes: event.revealMinutesBefore }) };
      if (state.placing) return { text: event.type === 'rolling' && current > 0 ? 'Next location when the host moves on.' : 'The host is still placing the meet point.' };
      return { text: locationSentence({ state: 'hidden', time: clock(reveal), minutesTo: minsTo(reveal) }) };
    case 'navigate':
      // The host, before people going can see it: when they will (4.11 host view), not check-in yet.
      if (host && now < reveal) return { text: shownSentence(), note: locationSentence({ state: 'host', time: clock(reveal), leadMinutes: event.revealMinutesBefore }) };
      return { text: shownSentence(), note: `Check-in opens at ${clockWithCountdown(new Date(state.opensAt), now)}.` };
    case 'checkin':
      // "Check-in is open" is the ActionBar's Check in; only the distance is new.
      return { text: shownSentence(), note: ctx.milesAway != null ? `You're ${ctx.milesAway < 1 ? 'under 1 mi' : `${Math.round(ctx.milesAway)} mi`} away.` : undefined };
    case 'checkedIn': {
      // Checked in never hides the place (Review 12): the meet point stays, then what's next.
      const place = event.type === 'rolling' && (current > 0 || event.stops[current + 1]) ? locationSentence({ state: 'rolling', point: stop?.name }) : shownSentence();
      return { text: place, note: now < new Date(event.startsAt) ? `Voting opens at ${clock(event.startsAt)}.` : undefined };
    }
    case 'vote':
      // The demo never promises a time it won't keep (Review 15 decision 2), and the ActionBar's Vote
      // says what to do: no grey line under the place that reads as if it were about the place (Review 19).
      if (ctx.demo) return { text: shownSentence() };
      return { text: shownSentence(), note: `Voting closes ${untilText(votingCloses(event), now)}.` };
    case 'voted':
      // The demo (owner decision, Review 19): each vote's result shows under "Demo: how Best car
      // went" straight away, with "2 more to vote" there. That section says it, so no line here.
      if (ctx.demo) return { text: shownSentence() };
      return { text: shownSentence(), note: ctx.resultsIn ? RESULTS_IN : `Results ${untilText(votingCloses(event), now)}.` };
    case 'ended': {
      // The place line is still the place (4.11, Review 17): the meet point to people who could see it,
      // else "Around {Area}.". The results are the trophies below, said once.
      const place = canSeeStop(event, current, ctx.me, ctx.crews, now) && stop?.at ? shownSentence() : `${aroundArea(event.areaName)}.`;
      if (now < votingCloses(event)) return { text: place, note: `Results ${untilText(votingCloses(event), now)}.` };
      return { text: place };
    }
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
