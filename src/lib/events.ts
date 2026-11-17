import { milesBetween } from './geo';
import type { BanZone, ChatMessage, Crew, EventType, LatLng, NightEvent, PlanChangeLog, Stop } from './types';

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
 * Host moves a rolling meet on to the next planned stop.
 * Every stop is planned (and checked against ban zones) before the event, so
 * nothing is decided in secret on the night; stops are only revealed one by one.
 */
export function moveOn(event: NightEvent, now: Date): NightEvent {
  if (event.type !== 'rolling') throw new Error('Only rolling meets move on.');
  const nextIndex = event.currentStop + 1;
  const planned = event.stops[nextIndex];
  if (!planned || !planned.at) throw new Error('This is the last planned stop.');
  const stops = [...event.stops];
  stops[nextIndex] = { ...planned, revealedAt: now.toISOString() };
  return { ...event, stops, currentStop: nextIndex };
}

/** Every stop needs a place before an event can be created. */
export function missingStops(stops: Stop[]): Stop[] {
  return stops.filter((s) => !s.at);
}

/** Who gets the "moved on" notification: people checked in at the stop being left. */
export function moveOnAudience(event: NightEvent, fromIndex: number): string[] {
  const from = event.stops[fromIndex];
  if (!from) return [];
  return Object.entries(event.checkIns)
    .filter(([, stops]) => stops.includes(from.id))
    .map(([userId]) => userId);
}

// ---------------------------------------------------------------------------
// Ban zones
// ---------------------------------------------------------------------------

/** The first ban zone this place falls inside, if any. */
export function banZoneAt(at: LatLng, zones: BanZone[]): BanZone | undefined {
  return zones.find((z) => milesBetween(z.centre, at) <= z.radiusMiles);
}

export function banZoneWarning(placeName: string, zone: BanZone): string {
  return `${placeName} is inside the ${zone.name} ban zone. Court orders here can ban organising or promoting late-night meets and cruises (often 3pm to 7am), and hosts have been taken to court. ${zone.note}`;
}

// ---------------------------------------------------------------------------
// Rolling meets: hosts changing the plan on the night
// ---------------------------------------------------------------------------

export type PlanChange =
  | { kind: 'rename'; stopId: string; name: string }
  | { kind: 'move'; stopId: string; at: LatLng }
  | { kind: 'remove'; stopId: string }
  | { kind: 'add'; name: string; at: LatLng };

export const PLAN_CHANGED_TEXT = 'Hosts changed the plan';

export type Permission = { ok: true } | { ok: false; reason: string };

function stopHasCheckIns(event: NightEvent, stopId: string): boolean {
  return Object.values(event.checkIns).some((ids) => ids.includes(stopId));
}

/** Can the hosts still change the plan of this rolling meet? */
export function canChangePlan(event: NightEvent, now: Date): Permission {
  if (event.type !== 'rolling') return { ok: false, reason: 'Only rolling meets can change stops on the night.' };
  const phase = phaseOf(event, now);
  if (phase === 'cancelled') return { ok: false, reason: 'This event was cancelled.' };
  if (phase === 'over') return { ok: false, reason: 'This event has finished.' };
  return { ok: true };
}

/** Can this stop be moved? Stops the meet has left, or with people checked in, are fixed. */
export function canMoveStop(event: NightEvent, stopIndex: number): Permission {
  const stop = event.stops[stopIndex];
  if (!stop) return { ok: false, reason: 'That stop no longer exists.' };
  if (stopIndex < event.currentStop) return { ok: false, reason: 'The meet has already left this stop.' };
  if (stopHasCheckIns(event, stop.id)) return { ok: false, reason: 'People have checked in here, so it can’t be moved.' };
  return { ok: true };
}

/** Only stops the meet hasn't reached yet can be removed. */
export function canRemoveStop(event: NightEvent, stopIndex: number): Permission {
  const stop = event.stops[stopIndex];
  if (!stop) return { ok: false, reason: 'That stop no longer exists.' };
  if (stopIndex <= event.currentStop) return { ok: false, reason: 'You can only remove stops the meet hasn’t reached. Move this one instead.' };
  return { ok: true };
}

export interface PlanChangeResult {
  event: NightEvent;
  log: PlanChangeLog;
  /** Ban-zone warning for the new place, if any. */
  warning?: string;
}

/**
 * Apply a host's change to a rolling meet. Throws with a readable reason when
 * the change isn't allowed. Stop reveal rules are untouched: added or moved
 * stops after the current one stay hidden until a host moves on, and only
 * people checked in at the current stop get them.
 */
export function applyPlanChange(
  event: NightEvent,
  change: PlanChange,
  by: string,
  now: Date,
  zones: BanZone[],
  makeId: () => string,
): PlanChangeResult {
  const allowed = canChangePlan(event, now);
  if (!allowed.ok) throw new Error(allowed.reason);
  const stops = [...event.stops];
  let text: string;
  let zone: BanZone | undefined;
  let placeName = '';

  if (change.kind === 'add') {
    const name = change.name.trim() || `Stop ${stops.length + 1}`;
    zone = banZoneAt(change.at, zones);
    placeName = name;
    stops.push({ id: makeId(), name, at: change.at });
    text = `Added ${name} as stop ${stops.length}.`;
  } else {
    const index = stops.findIndex((s) => s.id === change.stopId);
    if (index < 0) throw new Error('That stop no longer exists.');
    const stop = stops[index];
    if (change.kind === 'rename') {
      const name = change.name.trim();
      if (!name) throw new Error('Give the stop a name.');
      if (name === stop.name) throw new Error('That’s the same name.');
      stops[index] = { ...stop, name };
      text = `Renamed stop ${index + 1} from ${stop.name} to ${name}.`;
    } else if (change.kind === 'move') {
      const ok = canMoveStop(event, index);
      if (!ok.ok) throw new Error(ok.reason);
      zone = banZoneAt(change.at, zones);
      placeName = stop.name;
      const miles = stop.at ? milesBetween(stop.at, change.at) : 0;
      stops[index] = { ...stop, at: change.at };
      text = `Moved stop ${index + 1}, ${stop.name}${miles >= 0.1 ? `, by ${miles.toFixed(1)} mi` : ''}.`;
    } else {
      const ok = canRemoveStop(event, index);
      if (!ok.ok) throw new Error(ok.reason);
      stops.splice(index, 1);
      text = `Removed stop ${index + 1}, ${stop.name}.`;
    }
  }

  const log: PlanChangeLog = { id: makeId(), at: now.toISOString(), by, text, banZone: zone?.name };
  return {
    event: { ...event, stops, changes: [...(event.changes ?? []), log] },
    log,
    warning: zone ? banZoneWarning(placeName, zone) : undefined,
  };
}

/** The chat line everyone sees. It never says where. */
export function planChangedMessage(eventId: string, by: string, now: Date, id: string): ChatMessage {
  return { id, eventId, userId: by, text: PLAN_CHANGED_TEXT, at: now.toISOString(), system: true };
}

// ---------------------------------------------------------------------------
// Editing before the start, and sharing
// ---------------------------------------------------------------------------

/** Hosts can edit the whole event until it starts, as long as nobody has checked in. */
export function canEditEvent(event: NightEvent, now: Date): Permission {
  if (event.cancelled) return { ok: false, reason: 'This event was cancelled.' };
  if (now.getTime() >= new Date(event.startsAt).getTime())
    return {
      ok: false,
      reason: event.type === 'rolling' ? 'It has started. Use Change the plan to edit stops.' : 'It has started, so it can’t be edited.',
    };
  if (Object.values(event.checkIns).some((ids) => ids.length > 0))
    return { ok: false, reason: 'People have already checked in, so it can’t be edited.' };
  return { ok: true };
}

export interface DraftStop {
  /** An existing stop's id when editing, or any unique key for a new stop. */
  key: string;
  name: string;
  at?: LatLng;
}

/**
 * Turn the form's stops into event stops. Existing stops keep their id (so
 * RSVPs and reveal state still line up); new ones get fresh ids.
 */
export function stopsFromDraft(eventId: string, drafts: DraftStop[], existing: Stop[], label: (i: number, n: number) => string): Stop[] {
  const placed = drafts.filter((d) => d.at);
  const known = new Map(existing.map((s) => [s.id, s]));
  const used = new Set<string>();
  return placed.map((d, i) => {
    const old = known.get(d.key);
    let id = old ? old.id : `${eventId}-s${i}`;
    let n = i;
    while (!old && (used.has(id) || known.has(id))) id = `${eventId}-s${++n}`;
    used.add(id);
    return { ...(old ?? {}), id, name: d.name.trim() || label(i, placed.length), at: d.at };
  });
}

/** Apply an edit, keeping who's going, check-ins and the history. */
export function applyEventEdit(event: NightEvent, edited: NightEvent, by: string, now: Date, id: string): NightEvent {
  const log: PlanChangeLog = { id, at: now.toISOString(), by, text: 'Edited the event details.' };
  return {
    ...edited,
    id: event.id,
    going: event.going,
    checkIns: event.checkIns,
    currentStop: Math.min(event.currentStop, Math.max(0, edited.stops.length - 1)),
    cancelled: event.cancelled,
    changes: [...(event.changes ?? []), log],
  };
}

export const APP_SCHEME = 'nightshift';

export function eventLink(eventId: string): string {
  return `${APP_SCHEME}://event/${eventId}`;
}

/** Share text. Only the rough area, never a stop, so it's safe to post anywhere. */
export function shareText(event: NightEvent, when: string): string {
  return `${event.title}: ${EVENT_LABELS[event.type].toLowerCase()}, ${when}, ${event.areaName}. Open it in Nightshift: ${eventLink(event.id)}`;
}
