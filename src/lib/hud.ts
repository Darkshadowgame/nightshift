import { endTime, revealTime } from './events';
import type { EventView } from './eventView';

/**
 * Small pieces of "game HUD" logic for the map and the event hero: countdowns,
 * the next thing worth heading to, and which pins sit on top.
 */

/** "2h 14m", "45m", "3d 4h". Never negative: anything past is "now". */
export function countdown(toIso: string | Date, now: Date): string {
  const ms = new Date(toIso).getTime() - now.getTime();
  if (ms <= 0) return 'now';
  const mins = Math.ceil(ms / 60_000);
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  if (h < 48) {
    const m = mins % 60;
    return m === 0 ? `${h}h` : `${h}h ${m}m`;
  }
  const d = Math.floor(h / 24);
  const rh = h % 24;
  return rh === 0 ? `${d}d` : `${d}d ${rh}h`;
}

/** One line for the event hero and the map card: where this event is in its night. */
export function eventClock(view: EventView, now: Date): { label: string; value: string; live: boolean } {
  const e = view.event;
  switch (view.phase) {
    case 'live':
      return { label: 'Live · ends in', value: countdown(endTime(e), now), live: true };
    case 'over':
      return { label: 'Finished', value: '', live: false };
    case 'cancelled':
      return { label: 'Cancelled', value: '', live: false };
    default:
      return { label: 'Starts in', value: countdown(e.startsAt, now), live: false };
  }
}

/**
 * When the place unlocks for this person, if it's still hidden from them and
 * they'd see it at the reveal (going, or invited and could go). Null otherwise.
 */
export function unlocksIn(view: EventView, now: Date): string | null {
  if (view.shownStop >= 0) return null;
  // Invited people see it too: it's when they'd get the place if they go.
  if (view.role !== 'going' && view.role !== 'invited') return null;
  const at = revealTime(view.event);
  if (at.getTime() <= now.getTime()) return null;
  return countdown(at, now);
}

const NEXT_ROLES = new Set(['host', 'going', 'invited', 'requested']);

/**
 * The map's bottom card: what's live (that you're part of, or public), and the
 * next event you're hosting, going to or invited to. Public shows and track
 * days count as "next" only when nothing of your own is coming.
 */
export function mapHud(views: EventView[], now: Date): { live: EventView[]; next: EventView | null; tonight: number } {
  const active = views.filter((v) => v.phase !== 'over' && v.phase !== 'cancelled' && v.role !== 'declined');
  const live = active.filter((v) => v.phase === 'live');
  const upcoming = active
    .filter((v) => v.phase !== 'live')
    .sort((a, b) => new Date(a.event.startsAt).getTime() - new Date(b.event.startsAt).getTime());
  const next = upcoming.find((v) => NEXT_ROLES.has(v.role)) ?? upcoming[0] ?? null;
  const horizon = now.getTime() + 12 * 3_600_000;
  const tonight = active.filter((v) => v.phase === 'live' || new Date(v.event.startsAt).getTime() <= horizon).length;
  return { live, next, tonight };
}

/**
 * Draw order for map pins, last on top: spots, then locked areas, then places
 * you can see, then live events. Otherwise a locked circle pin can sit over a
 * live meet and steal the tap.
 */
type Layered = { glyph: string; live?: boolean };

export function pinLayer(p: Layered): number {
  if (p.live) return 4;
  // Speed cameras are background information: everything else sits on top.
  if (p.glyph === 'camera' || p.glyph === 'average') return 0;
  if (p.glyph === 'locked') return 2;
  if (p.glyph === 'photo' || p.glyph === 'drive' || p.glyph === 'track' || p.glyph === 'venue') return 1;
  return 3;
}

export function orderPins<T extends Layered>(pins: T[]): T[] {
  return pins
    .map((p, i) => ({ p, i }))
    .sort((a, b) => pinLayer(a.p) - pinLayer(b.p) || a.i - b.i)
    .map((x) => x.p);
}
