import { APP_SCHEME } from './events';
import { formatDistance, metresBetween, pointAlong, snapToRoute, type NavRoute } from './nav';
import type { LatLng } from './types';

/**
 * Group drive, live (docs/REDESIGN-2.md section 9, "Group drive with everyone on the map"): the pure
 * rules. Opt-in, short-lived, group only. The server keeps each member's latest position and nothing
 * else (supabase/migrations/20261122180000_group_drive.sql); the app sends its own position at most
 * every 5 seconds and reads the group's every 5 seconds.
 */

export const GROUP_MAX = 30;
export const GROUP_HOURS = 6;
export const GROUP_MS = GROUP_HOURS * 3_600_000;
/** A member's dot is dimmed when their position is older than this. */
export const STALE_MS = 60_000;
/** Sending: never more often than this, and only when moved this far or this long has passed. */
export const POST_MIN_MS = 5_000;
export const POST_MOVE_METRES = 15;
export const POST_MAX_MS = 15_000;
/** Reading the group. */
export const POLL_MS = 5_000;
/** Closer than this along or across is "alongside". */
export const ALONGSIDE_METRES = 30;
/** Both of you within this of the route: compare along the route; else a straight line. */
export const ON_ROUTE_METRES = 120;

/** The one-screen consent, shown the first time you start or join (words fixed by the owner's brief). */
export const GROUP_CONSENT = {
  title: 'Share your live location?',
  body: 'Share your live location with this group until the drive ends. Only people in the group can see it. Nothing is kept afterwards.',
  start: 'Start and share my location',
  join: 'Share my location and join',
} as const;

export interface GroupInfo {
  id: string;
  code: string;
  title: string;
  targetKind: 'event' | 'spot' | 'none';
  targetId: string | null;
  leaderId: string;
  startedAt: number;
  expiresAt: number;
  memberCount: number;
  /** The demo's made-up group: nothing is sent anywhere. */
  demo?: boolean;
}

export interface GroupMember {
  id: string;
  handle: string;
  name: string;
  avatarRef?: string | null;
  isLeader: boolean;
  at: LatLng | null;
  heading: number | null;
  speed: number | null;
  /** ms since 1970; null: no position yet. */
  updatedAt: number | null;
  demo?: boolean;
}

// --- Sending ---------------------------------------------------------------

export interface SentPosition {
  at: LatLng;
  /** ms. */
  t: number;
}

/**
 * Should this fix go to the server now? At most every 5 s, and only if you moved more than about
 * 15 m or 15 s have passed since the last one sent.
 */
export function shouldPostPosition(last: SentPosition | null, now: SentPosition): boolean {
  if (!last) return true;
  const dt = now.t - last.t;
  if (dt < POST_MIN_MS) return false;
  if (dt >= POST_MAX_MS) return true;
  return metresBetween(last.at, now.at) > POST_MOVE_METRES;
}

// --- Stale and expiry ------------------------------------------------------

export function isStale(updatedAt: number | null, nowMs: number): boolean {
  return updatedAt === null || nowMs - updatedAt > STALE_MS;
}

export function expiryOf(startedAt: number): number {
  return startedAt + GROUP_MS;
}

export function groupExpired(g: Pick<GroupInfo, 'expiresAt'>, nowMs: number): boolean {
  return nowMs >= g.expiresAt;
}

/** "Last updated": "just now", "20 s ago", "3 min ago", or "No position yet". */
export function lastUpdatedText(updatedAt: number | null, nowMs: number): string {
  if (updatedAt === null) return 'No position yet';
  const s = Math.max(0, Math.round((nowMs - updatedAt) / 1000));
  if (s < 10) return 'Just now';
  if (s < 60) return `${Math.round(s / 5) * 5} s ago`;
  return `${Math.round(s / 60)} min ago`;
}

// --- Where they are compared with you -------------------------------------

export type Relation =
  | { kind: 'ahead'; metres: number }
  | { kind: 'behind'; metres: number }
  | { kind: 'alongside'; metres: number }
  | { kind: 'away'; metres: number }
  | { kind: 'unknown' };

/**
 * How far ahead or behind a member is along your route when you both are on it, else the straight-line
 * distance. No position: unknown.
 */
export function relationTo(me: LatLng | null, them: LatLng | null, route: NavRoute | null): Relation {
  if (!me || !them) return { kind: 'unknown' };
  if (route && route.coords.length > 1) {
    const a = snapToRoute(route, me);
    const b = snapToRoute(route, them);
    if (a.off <= ON_ROUTE_METRES && b.off <= ON_ROUTE_METRES) {
      const d = b.along - a.along;
      if (Math.abs(d) < ALONGSIDE_METRES) return { kind: 'alongside', metres: Math.abs(d) };
      return { kind: d > 0 ? 'ahead' : 'behind', metres: Math.abs(d) };
    }
  }
  const m = metresBetween(me, them);
  return m < ALONGSIDE_METRES ? { kind: 'alongside', metres: m } : { kind: 'away', metres: m };
}

export function relationText(r: Relation): string {
  switch (r.kind) {
    case 'ahead':
      return `${formatDistance(r.metres)} ahead`;
    case 'behind':
      return `${formatDistance(r.metres)} behind`;
    case 'away':
      return `${formatDistance(r.metres)} away`;
    case 'alongside':
      return 'Alongside';
    default:
      return 'Not sharing yet';
  }
}

export function groupChipText(count: number): string {
  return `${count} in the group`;
}

// --- Links and codes -------------------------------------------------------

const CODE = /^[0-9a-f]{16}$/;

export function normaliseCode(raw: string | null | undefined): string | null {
  const c = (raw ?? '').trim().toLowerCase();
  return CODE.test(c) ? c : null;
}

export function groupLink(code: string): string {
  return `${APP_SCHEME}://group/${code}`;
}

export function groupShare(info: Pick<GroupInfo, 'code' | 'title'>): { title: string; text: string; url: string } {
  return {
    title: 'Group drive',
    text: `Join my group drive to ${info.title}. You will see each other on the map until it ends.`,
    url: groupLink(info.code),
  };
}

// --- Server rows -----------------------------------------------------------

type Json = Record<string, unknown>;
const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const time = (v: unknown): number | null => {
  if (typeof v !== 'string') return null;
  const t = Date.parse(v);
  return Number.isFinite(t) ? t : null;
};

export function groupFromRow(r: Json | null | undefined): GroupInfo | null {
  if (!r || typeof r.id !== 'string' || typeof r.code !== 'string') return null;
  const started = time(r.started_at) ?? 0;
  const kind = r.target_kind === 'event' || r.target_kind === 'spot' ? r.target_kind : 'none';
  return {
    id: r.id,
    code: r.code,
    title: typeof r.title === 'string' && r.title ? r.title : 'Group drive',
    targetKind: kind,
    targetId: typeof r.target_id === 'string' ? r.target_id : null,
    leaderId: typeof r.leader_id === 'string' ? r.leader_id : '',
    startedAt: started,
    expiresAt: time(r.expires_at) ?? expiryOf(started),
    memberCount: num(r.member_count) ?? 1,
  };
}

export function memberFromRow(r: Json): GroupMember | null {
  if (typeof r.user_id !== 'string') return null;
  const lat = num(r.lat);
  const lng = num(r.lng);
  const handle = typeof r.handle === 'string' ? r.handle : '';
  return {
    id: r.user_id,
    handle,
    name: typeof r.display_name === 'string' && r.display_name ? r.display_name : handle,
    avatarRef: typeof r.avatar_ref === 'string' ? r.avatar_ref : null,
    isLeader: r.is_leader === true,
    at: lat !== null && lng !== null ? { lat, lng } : null,
    heading: num(r.heading),
    speed: num(r.speed),
    updatedAt: time(r.updated_at),
  };
}

// --- Demo ------------------------------------------------------------------

const DEMO_PEOPLE: { id: string; handle: string; name: string; offset: number; stale?: boolean }[] = [
  { id: 'demo-gt-1', handle: 'demo.ellie', name: 'Ellie', offset: 380 },
  { id: 'demo-gt-2', handle: 'demo.marcus', name: 'Marcus', offset: -260 },
  { id: 'demo-gt-3', handle: 'demo.jo', name: 'Jo', offset: -900, stale: true },
];

/**
 * Made-up members for the demo, on the route itself (so always on land): one a little ahead, one just
 * behind, one a way back whose position is old. They drift a little over time.
 */
export function demoMembers(route: NavRoute | null, myAlong: number, nowMs: number): GroupMember[] {
  if (!route || route.coords.length < 2) return [];
  const total = route.cum[route.cum.length - 1] ?? 0;
  return DEMO_PEOPLE.map((p, i) => {
    const drift = 45 * Math.sin(nowMs / 9000 + i * 2.1);
    const along = Math.min(total, Math.max(0, myAlong + p.offset + drift));
    const here = pointAlong(route, along);
    return {
      id: p.id,
      handle: p.handle,
      name: p.name,
      isLeader: i === 0,
      at: here.at,
      heading: here.bearing,
      speed: 20,
      updatedAt: nowMs - (p.stale ? 95_000 : 2_000 + i * 1_500),
      demo: true,
    };
  });
}
