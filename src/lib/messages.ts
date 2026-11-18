import { formatWhen } from './format';
import type { NightEvent, Spot, Build } from './types';
import { classOf } from './classes';
import { powerText } from './dyno';
import { modCount } from './modGroups';

/**
 * Messages (Community › Messages): 1-to-1 and group chats between connected
 * people only. Mirrors start_direct(), create_group(), send_message(),
 * my_conversations() and friends on the server.
 */

export const MAX_GROUP = 50;
export const MESSAGE_MAX = 2000;
export const GROUP_NAME_MAX = 40;

export type ShareKind = 'event' | 'place' | 'build';

/** A shared event, place or build, shown as a card. Never carries a stop or a home. */
export interface ShareCard {
  kind: ShareKind;
  id: string;
  title: string;
  subtitle: string;
}

export interface Message {
  id: string;
  conversationId: string;
  /** Null for lines the app writes ("@dan added @kez"). */
  senderId: string | null;
  body: string;
  /** Photo ref: a stored name on the phone, a signed URL from the server. */
  photo?: string;
  share?: ShareCard;
  system?: boolean;
  createdAt: string;
  /** Still on its way (signed in). */
  pending?: boolean;
  sample?: boolean;
}

export interface Conversation {
  id: string;
  kind: 'direct' | 'group';
  name?: string;
  memberIds: string[];
  adminIds: string[];
  lastMessageAt: string;
  unread: number;
  /** The last line, for the list. */
  last?: { body: string; senderId: string | null; kind: 'text' | 'photo' | 'share' | 'system' };
  /** False when you're no longer connected (1-to-1) or blocked. */
  canSend: boolean;
  /** Each member's "read up to" time, for Seen. */
  readUpTo?: Record<string, string>;
  sample?: boolean;
}

/** The other person in a 1-to-1. */
export function otherMember(c: Conversation, me: string): string | undefined {
  return c.kind === 'direct' ? c.memberIds.find((m) => m !== me) : undefined;
}

/** "@dan_r" for a 1-to-1, the name for a group. */
export function conversationTitle(c: Conversation, me: string, handleOf: (id: string) => string | undefined): string {
  if (c.kind === 'group') return c.name ?? 'Group';
  const other = otherMember(c, me);
  const h = other ? handleOf(other) : undefined;
  return h ? `@${h}` : 'Someone who left';
}

/** The list's preview line. */
export function previewLine(c: Conversation, me: string, handleOf: (id: string) => string | undefined): string {
  const l = c.last;
  if (!l) return c.kind === 'group' ? 'New group' : 'Say hello';
  const what = l.kind === 'photo' ? 'Photo' : l.kind === 'share' ? 'Shared a card' : l.body;
  if (l.kind === 'system' || !l.senderId) return what;
  if (l.senderId === me) return `You: ${what}`;
  if (c.kind === 'group') return `@${handleOf(l.senderId) ?? 'someone'}: ${what}`;
  return what;
}

export function totalUnread(cs: Conversation[]): number {
  return cs.reduce((n, c) => n + (c.unread > 0 ? c.unread : 0), 0);
}

/**
 * "Seen" under your last message: in a 1-to-1, "Seen" once the other person
 * has read up to it; in a group, "Seen by 3". Null when nobody has yet, or the
 * last message isn't yours.
 */
export function seenLabel(c: Conversation, messages: Message[], me: string): string | null {
  const last = [...messages].reverse().find((m) => !m.system);
  if (!last || last.senderId !== me || last.pending || !c.readUpTo) return null;
  const readers = c.memberIds.filter((id) => id !== me && c.readUpTo?.[id] && c.readUpTo[id] >= last.createdAt);
  if (!readers.length) return null;
  return c.kind === 'direct' ? 'Seen' : `Seen by ${readers.length}`;
}

export function messageProblem(body: string, photo?: string, share?: ShareCard): string | null {
  const b = body.trim();
  if (!b && !photo && !share) return 'Write a message first.';
  if (b.length > MESSAGE_MAX) return 'Keep it to 2,000 characters or fewer.';
  return null;
}

export function groupProblem(name: string, memberIds: string[]): string | null {
  const n = name.trim();
  if (!n) return 'Give the group a name.';
  if (n.length > GROUP_NAME_MAX) return 'Keep the name to 40 characters or fewer.';
  if (memberIds.length === 0) return 'Add at least one person.';
  if (memberIds.length + 1 > MAX_GROUP) return 'Groups can have up to 50 people.';
  return null;
}

/** Group by day for the chat screen: a label line before each new day. */
export function dayLabel(iso: string, now: Date): string {
  const d = new Date(iso);
  const same = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (same(d, now)) return 'Today';
  const y = new Date(now.getTime() - 86_400_000);
  if (same(d, y)) return 'Yesterday';
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

// ---------------------------------------------------------------------------
// Sharing cards
// ---------------------------------------------------------------------------

const TYPE_NAMES: Record<NightEvent['type'], string> = { cruise: 'Cruise', rolling: 'Rolling meet', meet: 'Meet', show: 'Show', trackday: 'Track day' };

/** An event: title, type, time and rough area only. Opening it follows the event's own rules. */
export function shareEvent(e: NightEvent, now: Date): ShareCard {
  return { kind: 'event', id: e.id, title: e.title.slice(0, 120), subtitle: `${TYPE_NAMES[e.type]} · ${formatWhen(e.startsAt, now)} · ${e.areaName}`.slice(0, 160) };
}

const PLACE_NAMES: Record<Spot['kind'], string> = { drive: 'Drive', photo: 'Photo spot', track: 'Track', venue: 'Meet spot' };

export function sharePlace(s: Spot): ShareCard {
  return { kind: 'place', id: s.id, title: s.name.slice(0, 120), subtitle: `${PLACE_NAMES[s.kind]}${s.region ? ` · ${s.region}` : ''}`.slice(0, 160) };
}

export function shareBuild(b: Build): ShareCard {
  const title = `${b.make} ${b.model}`.slice(0, 120);
  return { kind: 'build', id: b.id, title, subtitle: `Class ${classOf(b)} · ${powerText(b)} · ${modCount(b.mods)} mods` };
}

/** Where a card opens. */
export function shareHref(c: ShareCard): string {
  if (c.kind === 'event') return `/event/${c.id}`;
  if (c.kind === 'build') return `/build/${c.id}`;
  return `/spot/${c.id}`;
}
