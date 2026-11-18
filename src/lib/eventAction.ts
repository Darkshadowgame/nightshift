import { canVote, categoriesFor } from './awards';
import { broughtBuild } from './bringing';
import { classOf } from './classes';
import { canSeeStop, checkInOpensAt, checkInWindowOpen, endTime, hasRequested, isHost, phaseOf, revealTime } from './events';
import type { Role } from './eventView';
import { countdown } from './hud';
import { formatTime, formatWhen, plural } from './format';
import { LOCATION } from './glossary';
import type { Build, ClassLetter, Crew, NightEvent } from './types';

/**
 * The one primary action on an event page, by state. The core loop reads top to bottom:
 * "I'm going" (with your build) → Navigate → Check in (when it opens) → Vote (after).
 */
export type EventPrimary =
  /** Not going yet. `request`: the invite doesn't cover you, so a host has to say yes. */
  | { kind: 'join'; request: boolean }
  | { kind: 'requested' }
  | { kind: 'declined' }
  /**
   * Going, the location isn't shown to you yet: no button, a state line ("Location shows at 21:30")
   * and a secondary Remind me. `at` is when it shows (ISO).
   */
  | { kind: 'waiting'; at: string; line: string; detail: string }
  /** Going, the meet point is shown, before check-in opens. `hint` says when check-in opens. */
  | { kind: 'navigate'; hint: string }
  /** Going, check-in is open and the current stop is visible. */
  | { kind: 'checkin'; stopIndex: number }
  /** Checked in at the current stop, nothing to vote on yet. */
  | { kind: 'checkedIn'; stopIndex: number }
  /** Checked in and voting is open. */
  | { kind: 'vote' }
  /** Cancelled, or over and nothing left to do. */
  | { kind: 'none' };

export function eventPrimary(event: NightEvent, me: string, role: Role, crews: Crew[], builds: Build[], now: Date): EventPrimary {
  const phase = phaseOf(event, now);
  if (phase === 'cancelled') return { kind: 'none' };
  const host = isHost(event, me, crews);
  const going = event.going.includes(me);
  if (!host && !going) {
    if (phase === 'over') return { kind: 'none' };
    if (hasRequested(event, me)) return { kind: 'requested' };
    if (event.declined?.includes(me)) return { kind: 'declined' };
    return { kind: 'join', request: !(role === 'invited' || role === 'public') };
  }
  const current = event.type === 'rolling' ? event.currentStop : 0;
  const stop = event.stops[current];
  const checkedInHere = !!stop && (event.checkIns[me] ?? []).includes(stop.id);
  const voteOpen = canVote(event, me, now).ok && categoriesFor(event, builds).length > 0;
  if (voteOpen && (phase === 'over' || checkedInHere)) return { kind: 'vote' };
  if (phase === 'over') return { kind: 'none' };
  const visible = canSeeStop(event, current, me, crews, now);
  if (checkedInHere) return { kind: 'checkedIn', stopIndex: current };
  if (visible && checkInWindowOpen(event, now)) return { kind: 'checkin', stopIndex: current };
  if (!visible || !stop?.at) {
    const at = revealTime(event);
    if (!stop?.at || at.getTime() <= now.getTime()) {
      return { kind: 'waiting', at: at.toISOString(), line: 'The host is still placing the meet point', detail: "You'll see it here once it's placed." };
    }
    return {
      kind: 'waiting',
      at: at.toISOString(),
      line: LOCATION.showsAt(formatTime(at.toISOString())),
      detail: `In ${countdown(at, now)}. ${LOCATION.toGoing}, ${LOCATION.lead(event.revealMinutesBefore).replace(/^Location shows /, '')}. Until then you see the area.`,
    };
  }
  return { kind: 'navigate', hint: `Check-in opens in ${countdown(checkInOpensAt(event), now)}, 30 minutes before the start.` };
}

/**
 * When, relative and absolute: "Starts in 2h 10m · Tonight 22:30", "Live · ends in 3h · 01:00",
 * "Finished · Sun 19:00–22:00".
 */
export function whenLine(event: NightEvent, now: Date): { relative: string; absolute: string } {
  const phase = phaseOf(event, now);
  const start = new Date(event.startsAt);
  const ends = event.endsAt ? `–${formatTime(event.endsAt)}` : '';
  if (phase === 'live') return { relative: `Live now, ends in ${countdown(endTime(event), now)}`, absolute: `${formatTime(event.startsAt)}${ends}` };
  if (phase === 'cancelled') return { relative: 'Cancelled', absolute: `${absoluteWhen(start, now)}${ends}` };
  if (phase === 'over') return { relative: 'Finished', absolute: `${absoluteWhen(start, now)}${ends}` };
  return { relative: `Starts in ${countdown(start, now)}`, absolute: `${formatWhen(event.startsAt, now)}${ends}` };
}

/** formatWhen() says "Started 19:00" for anything in the last day; a finished event wants its day. */
function absoluteWhen(start: Date, now: Date): string {
  if (start.getTime() < now.getTime()) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return `${days[start.getDay()]} ${start.getDate()} ${start.toLocaleString('en-GB', { month: 'short' })} ${formatTime(start.toISOString())}`;
  }
  return formatWhen(start.toISOString(), now);
}

/**
 * Who's going in plain words: "6 cars, 1 bike, mostly A class", "4 bikes", "" when nobody's
 * bringing anything. Replaces the "Cars 2S 4A · Bikes 1S" code.
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
  // "mostly" only when one class is at least half and there's more than one build.
  const mostly = brought.length > 1 && top[1] * 2 >= brought.length ? `mostly ${top[0]} class` : null;
  return [kinds, mostly].filter(Boolean).join(', ');
}
