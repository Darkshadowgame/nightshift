import { endTime, EVENT_LABELS, isPublicType, phaseOf } from './events';
import { canJoinDirectly, viewEvent, type EventView } from './eventView';
import { formatWhen } from './format';
import { milesBetween } from './geo';
import { eventUrl, type Reminder } from './reminders';
import type { Build, Crew, EventType, InviteFilter, LatLng, NightEvent, User } from './types';

/**
 * Finding events near you: how far you'd travel, how you hear about new
 * events, and the "Find events" search. Pure, so it's tested and mirrored on
 * the server (supabase/migrations/*_discovery.sql).
 *
 * Every signed-in person can see that an event exists (title, type, time,
 * rough area, invite filter). Exact stops stay hidden by the reveal rules in
 * events.ts: nothing here ever reads a stop the person can't see.
 */

// ---------------------------------------------------------------------------
// Willing to travel, and new-event alerts (both private to you)
// ---------------------------------------------------------------------------

export type AlertMode = 'notify' | 'search' | 'off';

export const TRAVEL_CHOICES = [5, 10, 25, 50, 100] as const;
export const DEFAULT_TRAVEL_MILES = 25;
export const MAX_TRAVEL_MILES = 300;
export const DEFAULT_ALERTS: AlertMode = 'notify';

export const ALERT_LABELS: Record<AlertMode, string> = {
  notify: 'Notify me',
  search: "I'll search",
  off: 'Off',
};

export const ALERT_HINTS: Record<AlertMode, string> = {
  notify: "We'll tell you when someone posts an event you can go to within your distance.",
  search: "No notifications. New ones get a NEW tag in Find events, so you can browse when you like.",
  off: 'Nothing at all. You can still use Find events.',
};

/** The first thing wrong with a travel distance, or null. Whole miles, 1 to 300. */
export function travelProblem(miles: number | null | undefined): string | null {
  if (miles === null || miles === undefined || !Number.isFinite(miles)) return "Pick how far you'd travel.";
  if (!Number.isInteger(miles)) return 'Use a whole number of miles.';
  if (miles < 1 || miles > MAX_TRAVEL_MILES) return `Pick how far you'd travel: 1 to ${MAX_TRAVEL_MILES} miles.`;
  return null;
}

/** "40", " 40 mi " -> 40. Anything else -> null. */
export function parseMiles(text: string): number | null {
  const m = text.trim().toLowerCase().match(/^(\d{1,4})\s*(mi|miles?)?$/);
  return m ? Number(m[1]) : null;
}

export function alertProblem(mode: string | null | undefined): string | null {
  return mode === 'notify' || mode === 'search' || mode === 'off' ? null : 'Pick how you hear about new events.';
}

/** Your own travel settings, with the defaults for anyone who hasn't picked yet. */
export function travelOf(user: Pick<User, 'travelMiles' | 'alerts'> | undefined): { miles: number; alerts: AlertMode } {
  return {
    miles: user?.travelMiles && !travelProblem(user.travelMiles) ? user.travelMiles : DEFAULT_TRAVEL_MILES,
    alerts: user?.alerts && !alertProblem(user.alerts) ? user.alerts : DEFAULT_ALERTS,
  };
}

// ---------------------------------------------------------------------------
// Distance and "I can go"
// ---------------------------------------------------------------------------

/**
 * Miles from a point to the event's rough area. Never to a stop: the area is
 * what everyone may see, so the distance can't give a hidden place away.
 */
export function milesTo(event: NightEvent, from: LatLng): number {
  return milesBetween(from, event.area);
}

/** "about 12 mi", "under 1 mi". */
export function describeDistance(miles: number): string {
  if (miles < 1) return 'under 1 mi';
  return `about ${Math.round(miles)} mi`;
}

/**
 * You can go: you'd be straight in if you tapped Going. That's hosting or
 * going already, a public show or track day, or matching the invite (a build
 * fits the filter and you live inside the host's radius; "everyone welcome"
 * skips the build check). The same as private.event_role() on the server.
 */
export function canGo(view: EventView): boolean {
  return canJoinDirectly(view.role);
}

/** Does the event welcome cars (or bikes)? Shows and "everyone welcome" take both. */
export function welcomes(filter: InviteFilter, vehicles: Vehicles): boolean {
  if (vehicles === 'any' || filter.everyone) return true;
  return vehicles === 'cars' ? filter.cars : filter.bikes;
}

// ---------------------------------------------------------------------------
// When
// ---------------------------------------------------------------------------

export type When = 'any' | 'tonight' | 'week' | 'weekend';
export type Vehicles = 'any' | 'cars' | 'bikes';

export const WHEN_LABELS: Record<When, string> = { any: 'Any time', tonight: 'Tonight', week: 'This week', weekend: 'Weekend' };

function atHour(day: Date, addDays: number, hour: number): Date {
  const d = new Date(day);
  d.setDate(d.getDate() + addDays);
  d.setHours(hour, 0, 0, 0);
  return d;
}

/**
 * The time window for a "when" chip, in the phone's local time (the server uses
 * Europe/London). Tonight runs to 5am. The weekend is Friday 5pm to Monday 5am;
 * during it, it runs from now. Null means any time.
 */
export function windowFor(when: When, now: Date): { from: Date; to: Date } | null {
  if (when === 'any') return null;
  if (when === 'tonight') return { from: now, to: atHour(now, now.getHours() < 5 ? 0 : 1, 5) };
  if (when === 'week') return { from: now, to: new Date(now.getTime() + 7 * 86_400_000) };
  // Monday 05:00 of this week (getDay: 0 Sunday … 6 Saturday).
  const sinceMonday = (now.getDay() + 6) % 7;
  const monday = atHour(now, -sinceMonday, 5);
  if (now.getTime() < monday.getTime()) {
    // Monday before 5am: still last weekend.
    return { from: now, to: monday };
  }
  const friday = atHour(monday, 4, 17);
  const end = atHour(monday, 7, 5);
  return { from: new Date(Math.max(now.getTime(), friday.getTime())), to: end };
}

/** Is any part of the event inside the window? (Live events count for tonight.) */
export function inWindow(event: NightEvent, window: { from: Date; to: Date } | null): boolean {
  if (!window) return true;
  return new Date(event.startsAt).getTime() < window.to.getTime() && endTime(event).getTime() > window.from.getTime();
}

// ---------------------------------------------------------------------------
// Find events
// ---------------------------------------------------------------------------

export const ALL_TYPES: EventType[] = ['cruise', 'rolling', 'meet', 'show', 'trackday'];

export interface SearchFilters {
  /** Null: any distance. */
  maxMiles: number | null;
  /** Empty: every type. */
  types: EventType[];
  when: When;
  /** Only events you'd be straight in to. */
  canGoOnly: boolean;
  vehicles: Vehicles;
}

export function defaultFilters(travelMiles: number): SearchFilters {
  return { maxMiles: travelMiles, types: [], when: 'any', canGoOnly: false, vehicles: 'any' };
}

export const VEHICLE_LABELS: Record<Vehicles, string> = { any: 'Cars and bikes', cars: 'Cars', bikes: 'Bikes' };

/**
 * One line for Find's collapsed filters: "25 mi from home · any time · cars and
 * bikes", plus anything else that's set ("meets, shows", "only ones I can go to").
 */
export function describeFilters(filters: SearchFilters, fromHere: boolean): string {
  const from = fromHere ? 'from where you are' : 'from home';
  const parts = [
    filters.maxMiles === null ? `any distance ${from}` : `${filters.maxMiles} mi ${from}`,
    WHEN_LABELS[filters.when].toLowerCase(),
    VEHICLE_LABELS[filters.vehicles].toLowerCase(),
  ];
  if (filters.types.length) parts.push(ALL_TYPES.filter((t) => filters.types.includes(t)).map((t) => EVENT_LABELS[t].toLowerCase()).join(', '));
  if (filters.canGoOnly) parts.push('only ones I can go to');
  return parts.join(' · ');
}

/** The note under a Find result: the distance, then whether you can go (glossary: Request to go, Requested). */
export function hitNote(hit: Pick<SearchHit, 'miles' | 'canGo'> & { view: Pick<EventView, 'role'> }, fromHere: boolean): string {
  const where = `${describeDistance(hit.miles)}${fromHere ? ' away' : ' from home'}`;
  // Hosting or going already says so: "you can go" on your own event read as if the invite covered your vehicle (B4).
  const role = hit.view.role;
  const status =
    role === 'host' ? "you're hosting"
    : role === 'going' ? "you're going"
    : hit.canGo ? 'you can go'
    : role === 'requested' ? 'requested'
    : role === 'declined' ? 'a host said no'
    : 'request to go';
  return `${where} · ${status}`;
}

export interface SearchHit {
  view: EventView;
  miles: number;
  canGo: boolean;
}

export interface Who {
  me: string;
  crews: Crew[];
  users: User[];
  builds: Build[];
}

/**
 * Upcoming and live events, nearest first (then soonest). Finished and
 * cancelled events are left out. Every event can be found; locked ones only
 * show their rough area (EventView.shownStop is -1).
 */
export function searchEvents(events: NightEvent[], who: Who, from: LatLng, filters: SearchFilters, now: Date): SearchHit[] {
  const window = windowFor(filters.when, now);
  const hits: SearchHit[] = [];
  for (const event of events) {
    const phase = phaseOf(event, now);
    if (phase === 'over' || phase === 'cancelled') continue;
    if (filters.types.length > 0 && !filters.types.includes(event.type)) continue;
    if (!welcomes(event.filter, filters.vehicles)) continue;
    if (!inWindow(event, window)) continue;
    const miles = milesTo(event, from);
    if (filters.maxMiles !== null && miles > filters.maxMiles) continue;
    const view = viewEvent(event, who.me, who.crews, who.users, who.builds, now);
    const go = canGo(view);
    if (filters.canGoOnly && !go) continue;
    hits.push({ view, miles, canGo: go });
  }
  return hits.sort((a, b) => a.miles - b.miles || new Date(a.view.event.startsAt).getTime() - new Date(b.view.event.startsAt).getTime());
}

// ---------------------------------------------------------------------------
// New events near you
// ---------------------------------------------------------------------------

/**
 * Should this person hear about this event as "new near you"? It hasn't
 * started, isn't cancelled, they aren't already in it (hosting, going, asked
 * or turned down), they can go, and its rough area is inside their travel distance.
 */
export function isNearbyMatch(event: NightEvent, who: Who, now: Date): boolean {
  const me = who.users.find((u) => u.id === who.me);
  if (!me) return false;
  if (event.cancelled || new Date(event.startsAt).getTime() <= now.getTime()) return false;
  const view = viewEvent(event, who.me, who.crews, who.users, who.builds, now);
  if (view.role !== 'invited' && view.role !== 'public') return false;
  return milesTo(event, me.home) <= travelOf(me).miles;
}

/**
 * Events that have appeared since the last look (`known` holds the ids already
 * seen, whatever happened to them) and the ones among them that are new near you.
 */
export function nearbyArrivals(events: NightEvent[], known: string[], who: Who, now: Date): { arrived: string[]; matches: NightEvent[] } {
  const seen = new Set(known);
  const fresh = events.filter((e) => !seen.has(e.id));
  return { arrived: fresh.map((e) => e.id), matches: fresh.filter((e) => isNearbyMatch(e, who, now)) };
}

export function nearbyKey(eventId: string): string {
  return `ns.${eventId}.nearby`;
}

/**
 * The "new near you" message. Lock screens are public, so it carries the
 * title, the time and the rough area's name: never a stop, a street or a distance from home.
 */
export function nearbyNotice(event: NightEvent, now: Date): Reminder {
  const label = EVENT_LABELS[event.type].toLowerCase();
  const title = `New ${label} near you`;
  const body = `${event.title} · ${formatWhen(event.startsAt, now)} · ${event.areaName}`;
  return {
    key: nearbyKey(event.id),
    scheduleId: `${nearbyKey(event.id)}.${now.getTime().toString(36)}`,
    eventId: event.id,
    kind: 'nearby',
    at: now,
    title,
    body,
    url: eventUrl(event.id),
  };
}

/** One phone notification for a batch: the event itself, or "3 new events near you" opening Find events. */
export function nearbyBatch(events: NightEvent[], now: Date): Reminder | null {
  if (events.length === 0) return null;
  if (events.length === 1) return nearbyNotice(events[0], now);
  const publicOnly = events.every((e) => isPublicType(e.type));
  return {
    key: `ns.nearby.batch.${now.getTime().toString(36)}`,
    scheduleId: `ns.nearby.batch.${now.getTime().toString(36)}`,
    eventId: '',
    kind: 'nearby',
    at: now,
    title: `${events.length} new ${publicOnly ? 'shows and track days' : 'events'} near you`,
    body: 'Open Find events to see them, nearest first.',
    url: '/find',
  };
}
