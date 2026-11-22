import { broughtBuild } from './bringing';
import { endTime, isHost, phaseOf } from './events';
import { milesBetween } from './geo';
import type { Build, Crew, NightEvent } from './types';

/**
 * Meet page extras (level-up, meets): the after-meet album window, the arrival board, "Seen at",
 * one-tap status, meet history, house rules, capacity and waitlist, co-hosts and the host dashboard.
 * Pure rules; the screens and both repositories call these. Nothing here reads or reveals a meet
 * point: it only counts people and vehicles the viewer could already see on the meet page.
 */

// ---------------------------------------------------------------------------
// After-meet album
// ---------------------------------------------------------------------------

/** Photos from a meet are pooled for this long after it ends; then the album stays but takes no more. */
export const ALBUM_HOURS = 48;
const HOUR = 3_600_000;

export interface AlbumState {
  /** Photos taken from 30 minutes before the start count towards the album. */
  from: Date;
  /** When the album closes to new photos. */
  closesAt: Date;
  /** Closed to new photos (the meet ended more than 48 hours ago). */
  closed: boolean;
}

export function albumState(event: NightEvent, now: Date): AlbumState {
  const closesAt = new Date(endTime(event).getTime() + ALBUM_HOURS * HOUR);
  return { from: new Date(new Date(event.startsAt).getTime() - 30 * 60_000), closesAt, closed: now.getTime() >= closesAt.getTime() };
}

/** Who can add a photo: someone who checked in (or a host) while the meet is on and for 48 hours after. */
export function canPostToAlbum(event: NightEvent, me: string, crews: Crew[], now: Date): boolean {
  if (event.cancelled) return false;
  if (albumState(event, now).closed) return false;
  if (now.getTime() < new Date(event.startsAt).getTime() - 30 * 60_000) return false;
  return (event.checkIns[me] ?? []).length > 0 || isHost(event, me, crews);
}

/** Is a photo taken at this time part of the album? */
export function inAlbum(event: NightEvent, takenAt: string): boolean {
  const a = albumState(event, new Date(0));
  const t = new Date(takenAt).getTime();
  return t >= a.from.getTime() && t <= a.closesAt.getTime();
}

// ---------------------------------------------------------------------------
// Arrival board and "Seen at"
// ---------------------------------------------------------------------------

export interface Arrival {
  userId: string;
  build?: Build;
  /** ISO time of the first check-in, when known. */
  at?: string;
}

/** Everyone checked in, most recent arrival first. Those with no recorded time come last, in a stable order. */
export function arrivalBoard(event: NightEvent, builds: readonly Build[]): Arrival[] {
  const ids = Object.entries(event.checkIns).filter(([, s]) => s.length > 0).map(([u]) => u);
  const at = (u: string) => event.arrivals?.[u];
  return ids
    .map((userId, i) => ({ userId, build: broughtBuild(event, userId, builds as Build[]) ?? undefined, at: at(userId), i }))
    .sort((a, b) => (a.at && b.at ? b.at.localeCompare(a.at) : a.at ? -1 : b.at ? 1 : b.i - a.i))
    .map(({ i: _i, ...rest }) => rest);
}

/** Who may see the wall: people going and hosts, or anyone for a public show or track day. */
export function canSeeArrivals(event: NightEvent, me: string, crews: Crew[], publicEvent: boolean): boolean {
  return publicEvent || event.going.includes(me) || isHost(event, me, crews) || (event.checkIns[me] ?? []).length > 0;
}

/** "Seen at": the vehicles that were there, one entry each, so you can open the builds you liked. */
export function seenAt(event: NightEvent, builds: readonly Build[]): Build[] {
  const seen = new Map<string, Build>();
  for (const a of arrivalBoard(event, builds)) if (a.build && !seen.has(a.build.id)) seen.set(a.build.id, a.build);
  return [...seen.values()];
}

// ---------------------------------------------------------------------------
// One-tap status
// ---------------------------------------------------------------------------

export type MeetStatus = 'late' | 'left';

export const STATUS_WORDS: Record<MeetStatus, { row: string; hint: string; tag: string; undo: string }> = {
  late: { row: 'Running late', hint: 'Tell the host and everyone going', tag: 'Running late', undo: 'Tap to say you are on time' },
  left: { row: 'I have left', hint: 'Tell the host and everyone going', tag: 'Left', undo: 'Tap to undo' },
};

/**
 * The one status row to show you: "Running late" before you have checked in, "I have left" after you
 * have. Null when you are not going, or it is over or cancelled.
 */
export function statusRow(event: NightEvent, me: string, now: Date): { offer: MeetStatus; set: boolean } | null {
  if (!event.going.includes(me)) return null;
  const phase = phaseOf(event, now);
  if (phase === 'over' || phase === 'cancelled') return null;
  const arrived = (event.checkIns[me] ?? []).length > 0;
  const current = event.status?.[me];
  if (arrived) return { offer: 'left', set: current === 'left' };
  return { offer: 'late', set: current === 'late' };
}

export function withStatus(event: NightEvent, me: string, status: MeetStatus | null): NightEvent {
  if (!event.going.includes(me)) throw new Error('Say you are going first.');
  const next = { ...(event.status ?? {}) };
  if (status) next[me] = status;
  else delete next[me];
  return { ...event, status: next };
}

/** "2 running late, 1 left" for people going and hosts; empty when nobody has said anything. */
export function statusSummary(event: NightEvent): string {
  const all = Object.entries(event.status ?? {}).filter(([u]) => event.going.includes(u));
  const late = all.filter(([, s]) => s === 'late').length;
  const left = all.filter(([, s]) => s === 'left').length;
  return [late ? `${late} running late` : null, left ? `${left} on the way` : null].filter(Boolean).join(', ');
}

// ---------------------------------------------------------------------------
// House rules
// ---------------------------------------------------------------------------

export const RULES: { id: string; label: string }[] = [
  { id: 'no-revving', label: 'No revving or loud exhausts' },
  { id: 'no-burnouts', label: 'No burnouts or racing' },
  { id: 'litter', label: 'Take your litter home' },
  { id: 'quiet-arrival', label: 'Arrive and leave quietly' },
  { id: 'no-drinking', label: 'No drinking if you are driving' },
  { id: 'respect-venue', label: 'Respect the venue and its neighbours' },
  { id: 'park-nicely', label: 'Park where you are shown' },
  { id: 'kids-dogs', label: 'Keep children and dogs close' },
  { id: 'no-drones', label: 'No drones' },
  { id: 'ask-photos', label: 'Ask before photographing people' },
];

export function rulesOf(event: Pick<NightEvent, 'rules'>): string[] {
  const known = new Map(RULES.map((r) => [r.id, r.label]));
  return (event.rules ?? []).flatMap((id) => (known.has(id) ? [known.get(id)!] : []));
}

/** Only ids on the standard list, in list order, no repeats. */
export function cleanRules(ids: readonly string[]): string[] {
  return RULES.filter((r) => ids.includes(r.id)).map((r) => r.id);
}

// ---------------------------------------------------------------------------
// Capacity and waitlist
// ---------------------------------------------------------------------------

export const MAX_CAPACITY = 500;

/** Hosts do not take a place. */
export function placesTaken(event: NightEvent, hostIds: readonly string[] = event.hostIds): number {
  return event.going.filter((u) => !hostIds.includes(u)).length;
}

export function isFull(event: NightEvent): boolean {
  return event.capacity != null && placesTaken(event) >= event.capacity;
}

export function placesLeft(event: NightEvent): number | null {
  return event.capacity == null ? null : Math.max(0, event.capacity - placesTaken(event));
}

export function capacityProblem(value: string | number | null | undefined): string | null {
  if (value == null || value === '') return null;
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isInteger(n) || n < 1 || n > MAX_CAPACITY) return `Pick a number from 1 to ${MAX_CAPACITY}, or leave it empty for no limit.`;
  return null;
}

export function waitPosition(event: NightEvent, me: string): number {
  const i = event.waitlist?.indexOf(me) ?? -1;
  return i < 0 ? 0 : i + 1;
}

export function joinWaitlist(event: NightEvent, me: string, buildId?: string): NightEvent {
  if (event.waitlist?.includes(me)) return event;
  const vehicles = buildId ? { ...event.vehicles, [me]: buildId } : event.vehicles;
  return { ...event, waitlist: [...(event.waitlist ?? []), me], vehicles };
}

/** Fill free places from the waitlist, first in line first. Returns who moved up. */
export function promoteWaitlist(event: NightEvent): { event: NightEvent; moved: string[] } {
  const list = event.waitlist ?? [];
  const free = event.capacity == null ? list.length : Math.max(0, event.capacity - placesTaken(event));
  const moved = list.slice(0, free);
  if (!moved.length) return { event, moved };
  return { event: { ...event, going: [...event.going, ...moved.filter((u) => !event.going.includes(u))], waitlist: list.slice(free) }, moved };
}

export const WAITLIST_WORDS = {
  full: 'This meet is full.',
  join: 'Join the waitlist',
  onList: (n: number) => `You are number ${n} on the waitlist. You move up if someone drops out.`,
  movedUp: "You're going. A place came up.",
} as const;

// ---------------------------------------------------------------------------
// Co-hosts
// ---------------------------------------------------------------------------

export const MAX_HOSTS = 5;

export function coHostProblem(event: NightEvent, by: string, crews: Crew[], userId: string): string | null {
  if (!isHost(event, by, crews)) return 'Only hosts can add a co-host.';
  if (event.hostIds.includes(userId)) return 'They already host this one.';
  if (event.hostIds.length >= MAX_HOSTS) return `A meet can have up to ${MAX_HOSTS} hosts.`;
  if (event.cancelled) return 'This event was cancelled.';
  return null;
}

export function withCoHost(event: NightEvent, by: string, crews: Crew[], userId: string): NightEvent {
  const problem = coHostProblem(event, by, crews, userId);
  if (problem) throw new Error(problem);
  return { ...event, hostIds: [...event.hostIds, userId], requests: (event.requests ?? []).filter((r) => r !== userId), waitlist: (event.waitlist ?? []).filter((r) => r !== userId) };
}

// ---------------------------------------------------------------------------
// Meet history and the host dashboard
// ---------------------------------------------------------------------------

/** Same meet again: same title (ignoring case) from a shared host, or the same crew, or within 0.2 mi. */
export function sameMeet(a: NightEvent, b: NightEvent): boolean {
  if (a.id === b.id) return false;
  const title = (e: NightEvent) => e.title.trim().toLowerCase();
  const shareHost = a.hostIds.some((h) => b.hostIds.includes(h)) || (!!a.crewId && a.crewId === b.crewId);
  if (title(a) === title(b) && shareHost) return true;
  const p = a.stops[0]?.at;
  const q = b.stops[0]?.at;
  return !!p && !!q && shareHost && milesBetween(p, q) < 0.2 && a.type === b.type;
}

export interface MeetHistory {
  /** Times it has run, this one not counted. */
  runs: number;
  /** Typical turnout: the middle number of people who turned up (checked in), else went. Null when none count. */
  typical: number | null;
}

/** People who turned up: checked in when anyone did, else those who said they were going. */
export function turnout(event: NightEvent): number {
  const checked = Object.values(event.checkIns).filter((s) => s.length > 0).length;
  return checked > 0 ? checked : event.going.length;
}

export function meetHistory(event: NightEvent, events: readonly NightEvent[], now: Date): MeetHistory {
  const past = events.filter((e) => !e.cancelled && phaseOf(e, now) === 'over' && sameMeet(event, e));
  const counts = past.map(turnout).filter((n) => n > 0).sort((a, b) => a - b);
  const typical = counts.length ? counts[Math.floor((counts.length - 1) / 2)] : null;
  return { runs: past.length, typical };
}

/** An honest one-liner, or null when there is nothing to say yet (a first run says nothing). */
export function historyLine(h: MeetHistory | null | undefined): string | null {
  if (!h || h.runs < 1) return null;
  const ran = h.runs === 1 ? 'Has run once before' : `Has run ${h.runs} times before`;
  return h.typical ? `${ran}. Usually about ${h.typical} people turn up.` : `${ran}.`;
}

export interface HostStats {
  going: number;
  arrived: number;
  /** Arrivals in hourly buckets from the first, oldest first. Empty when no times are known. */
  arrivalsByHour: { label: string; count: number }[];
  /** People who went to an earlier run of this meet. */
  regulars: number;
  newcomers: number;
}

export function hostStats(event: NightEvent, events: readonly NightEvent[], now: Date, regularsOverride?: { regulars: number; newcomers: number }): HostStats {
  const arrivedIds = Object.entries(event.checkIns).filter(([, s]) => s.length > 0).map(([u]) => u);
  const people = arrivedIds.length ? arrivedIds : event.going;
  const earlier = events.filter((e) => !e.cancelled && phaseOf(e, now) === 'over' && sameMeet(event, e));
  const before = new Set(earlier.flatMap((e) => [...e.going, ...Object.keys(e.checkIns).filter((u) => (e.checkIns[u] ?? []).length > 0)]));
  const others = people.filter((u) => !event.hostIds.includes(u));
  const regulars = regularsOverride?.regulars ?? others.filter((u) => before.has(u)).length;
  const newcomers = regularsOverride?.newcomers ?? others.length - regulars;
  const times = arrivedIds.map((u) => event.arrivals?.[u]).filter((t): t is string => !!t).sort();
  const buckets: { label: string; count: number }[] = [];
  if (times.length) {
    const start = new Date(times[0]);
    start.setMinutes(0, 0, 0);
    const hours = Math.min(12, Math.floor((new Date(times[times.length - 1]).getTime() - start.getTime()) / HOUR) + 1);
    for (let i = 0; i < hours; i++) {
      const lo = start.getTime() + i * HOUR;
      const d = new Date(lo);
      buckets.push({ label: `${String(d.getHours()).padStart(2, '0')}:00`, count: times.filter((t) => new Date(t).getTime() >= lo && new Date(t).getTime() < lo + HOUR).length });
    }
  }
  return { going: placesTaken(event) , arrived: arrivedIds.length, arrivalsByHour: buckets, regulars, newcomers };
}

// ---------------------------------------------------------------------------
// "Same as last time"
// ---------------------------------------------------------------------------

/** The host's most recent earlier meet (not cancelled), to copy. */
export function lastMeet(events: readonly NightEvent[], me: string, now: Date): NightEvent | null {
  const mine = events.filter((e) => !e.cancelled && e.hostIds[0] === me && new Date(e.startsAt).getTime() < now.getTime());
  return mine.sort((a, b) => b.startsAt.localeCompare(a.startsAt))[0] ?? null;
}

/**
 * The same meet one week on (keeping the time of day), with nobody going, no check-ins and no history.
 * The title, text, place, rules, capacity and invite rules carry over; the host reviews and posts.
 */
export function copyOf(source: NightEvent, newId: string, now: Date): NightEvent {
  const week = 7 * 24 * HOUR;
  let shift = week;
  while (new Date(source.startsAt).getTime() + shift <= now.getTime()) shift += week;
  const move = (iso: string) => new Date(new Date(iso).getTime() + shift).toISOString();
  const stops = source.stops.map((s, i) => ({ ...s, id: `${newId}-s${i}`, revealedAt: undefined }));
  return {
    ...source,
    id: newId,
    startsAt: move(source.startsAt),
    endsAt: source.endsAt ? move(source.endsAt) : undefined,
    stops,
    currentStop: 0,
    going: [],
    checkIns: {},
    requests: [],
    declined: [],
    vehicles: {},
    changes: [],
    cancelled: undefined,
    invitedBy: undefined,
    waitlist: [],
    status: {},
    arrivals: {},
    gallery: undefined,
  };
}
