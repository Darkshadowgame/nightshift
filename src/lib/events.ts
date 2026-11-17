import { milesBetween } from './geo';
import type { Crew, EventType, LatLng, NightEvent, Stop } from './types';

export const CHECK_IN_RADIUS_MILES = 0.5;
/** Events stay "on" this long after the start when no end time is set. */
const DEFAULT_LENGTH_MS = 4 * 60 * 60 * 1000;

export const EVENT_LABELS: Record<EventType, string> = {
  cruise: 'Cruise',
  rolling: 'Rolling meet',
  meet: 'Meet',
  show: 'Show',
  trackday: 'Track day',
};

export function isPublicType(type: EventType): boolean {
  return type === 'show' || type === 'trackday';
}

export function isHost(event: NightEvent, userId: string, crews: Crew[]): boolean {
  if (event.hostIds.includes(userId)) return true;
  if (event.crewId) {
    const crew = crews.find((c) => c.id === event.crewId);
    if (crew?.memberIds.includes(userId)) return true;
  }
  return false;
}

export function revealTime(event: NightEvent): Date {
  return new Date(new Date(event.startsAt).getTime() - event.revealMinutesBefore * 60_000);
}

export function endTime(event: NightEvent): Date {
  return event.endsAt ? new Date(event.endsAt) : new Date(new Date(event.startsAt).getTime() + DEFAULT_LENGTH_MS);
}

export type Phase = 'upcoming' | 'revealed' | 'live' | 'over' | 'cancelled';

export function phaseOf(event: NightEvent, now: Date): Phase {
  if (event.cancelled) return 'cancelled';
  const t = now.getTime();
  if (t >= endTime(event).getTime()) return 'over';
  if (t >= new Date(event.startsAt).getTime()) return 'live';
  if (t >= revealTime(event).getTime()) return 'revealed';
  return 'upcoming';
}

/**
 * Can this user see where this stop is?
 * - Hosts see everything.
 * - Shows and track days are public.
 * - Others must be going and past the reveal time.
 * - Rolling meets: stop 0 like a meet; later stops only once the host has moved on to them,
 *   and only for people checked in at the stop before.
 */
export function canSeeStop(event: NightEvent, stopIndex: number, userId: string, crews: Crew[], now: Date): boolean {
  const stop = event.stops[stopIndex];
  if (!stop || !stop.at) return false;
  if (isHost(event, userId, crews)) return true;
  if (isPublicType(event.type)) return true;
  if (event.cancelled) return false;
  if (!event.going.includes(userId)) return false;
  if (now.getTime() < revealTime(event).getTime()) return false;
  if (event.type !== 'rolling') return true;
  if (stopIndex === 0) return true;
  if (stopIndex > event.currentStop) return false;
  const previous = event.stops[stopIndex - 1];
  return (event.checkIns[userId] ?? []).includes(previous.id);
}

/** The stop people should head to now (or the start, before it begins). */
export function activeStopIndex(event: NightEvent): number {
  return event.type === 'rolling' ? event.currentStop : 0;
}

export type CheckInResult = { ok: true } | { ok: false; reason: string };

export function canCheckIn(
  event: NightEvent,
  stopIndex: number,
  userId: string,
  crews: Crew[],
  now: Date,
  position: LatLng | null,
  skipDistance = false,
): CheckInResult {
  const phase = phaseOf(event, now);
  if (phase === 'cancelled') return { ok: false, reason: 'This event was cancelled.' };
  if (phase === 'over') return { ok: false, reason: 'This event has finished.' };
  const opensAt = new Date(new Date(event.startsAt).getTime() - 30 * 60_000);
  if (now < opensAt) return { ok: false, reason: 'Check-in opens 30 minutes before the start.' };
  if (!event.going.includes(userId) && !isHost(event, userId, crews))
    return { ok: false, reason: "Tap Going first, then check in." };
  if (!canSeeStop(event, stopIndex, userId, crews, now)) return { ok: false, reason: "You can't see this stop yet." };
  if (event.type === 'rolling' && stopIndex !== event.currentStop)
    return { ok: false, reason: 'The meet has moved on. Check in at the current stop.' };
  const stop = event.stops[stopIndex];
  if (!skipDistance) {
    if (!position) return { ok: false, reason: 'Turn on location so the app can see you are at the stop.' };
    if (stop.at && milesBetween(position, stop.at) > CHECK_IN_RADIUS_MILES)
      return { ok: false, reason: `You need to be within ${CHECK_IN_RADIUS_MILES} mi of ${stop.name}.` };
  }
  return { ok: true };
}

export function checkIn(event: NightEvent, stopIndex: number, userId: string): NightEvent {
  const stop = event.stops[stopIndex];
  const done = event.checkIns[userId] ?? [];
  if (done.includes(stop.id)) return event;
  return { ...event, checkIns: { ...event.checkIns, [userId]: [...done, stop.id] } };
}

/**
 * Host moves a rolling meet on. Uses the next planned stop, or adds `newStop`
 * when the host picks the spot on the night.
 */
export function moveOn(event: NightEvent, now: Date, newStop?: Omit<Stop, 'id' | 'revealedAt'>): NightEvent {
  if (event.type !== 'rolling') throw new Error('Only rolling meets move on.');
  const nextIndex = event.currentStop + 1;
  const stops = [...event.stops];
  if (newStop) {
    const stop: Stop = { ...newStop, id: `${event.id}-s${Date.now().toString(36)}`, revealedAt: now.toISOString() };
    if (stops[nextIndex] && !stops[nextIndex].at) stops[nextIndex] = { ...stops[nextIndex], ...stop };
    else stops.splice(nextIndex, 0, stop);
  } else {
    const planned = stops[nextIndex];
    if (!planned || !planned.at) throw new Error('Pick where the meet is moving to.');
    stops[nextIndex] = { ...planned, revealedAt: now.toISOString() };
  }
  return { ...event, stops, currentStop: nextIndex };
}

/** Who gets the "moved on" notification: people checked in at the stop being left. */
export function moveOnAudience(event: NightEvent, fromIndex: number): string[] {
  const from = event.stops[fromIndex];
  if (!from) return [];
  return Object.entries(event.checkIns)
    .filter(([, stops]) => stops.includes(from.id))
    .map(([userId]) => userId);
}

export function hasMoreStops(event: NightEvent): boolean {
  return event.type === 'rolling';
}
