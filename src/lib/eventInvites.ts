import { isHost, phaseOf } from './events';
import type { Crew, NightEvent, User } from './types';

/**
 * Bring your mates (owner request, 19 Nov 2026): once you're going, invite your connections.
 * Mirrors invite_connections() on the server (20261121090000_event_invites.sql):
 *
 * - only hosts and people going invite, and only while the event hasn't finished or been cancelled;
 * - the host's "Let people invite their connections" (`allowInvites`, on unless set false);
 * - only accepted connections, never anyone blocked either way;
 * - at most 20 per event per person.
 *
 * An invited person sees the event even when the invite rules leave them out. The meet point
 * follows the usual rules (going, then the reveal time): an invite never shows it early. When
 * the rules leave them out, I'm going becomes Ask to go and a host answers, seeing who invited them.
 */
export const INVITE_CAP = 20;

export const INVITE_WORDS = {
  open: 'Invite connections',
  title: 'Invite connections',
  shareOther: 'Share another way',
  hostToggle: 'Let people invite their connections',
  hostToggleHint: "People going can invite their connections, even ones your invite rules leave out. They still ask to go, and the meet point stays hidden until it's shown.",
  off: 'The host has turned off invites for this one.',
  notConnected: "You can only invite people you're connected with.",
  goFirst: "Say you're going first, then invite your connections.",
  cap: `You can invite up to ${INVITE_CAP} people to one event.`,
  none: 'Pick someone to invite.',
  /** Invite tapped with nobody picked (Invite is never disabled, 4.3). */
  pickFirst: 'Pick someone first',
} as const;

export function invitesAllowed(event: Pick<NightEvent, 'allowInvites'>): boolean {
  return event.allowInvites !== false;
}

/** Can `me` invite people to this event now? */
export function canInvite(event: NightEvent, me: string, crews: Crew[], now: Date): boolean {
  const phase = phaseOf(event, now);
  if (phase === 'over' || phase === 'cancelled') return false;
  if (!invitesAllowed(event)) return false;
  return isHost(event, me, crews) || event.going.includes(me);
}

/** How many people `me` has invited to this event (as far as the phone knows). */
export function invitedByMe(event: NightEvent, me: string): string[] {
  return Object.entries(event.invitedBy ?? {})
    .filter(([, by]) => by === me)
    .map(([who]) => who);
}

/** Who invited this person ("Asked to go · @dan_r sent it" on a request), when the phone knows. */
export function inviterOf(event: NightEvent, userId: string): string | undefined {
  return event.invitedBy?.[userId];
}

export interface InviteChoice {
  user: User;
  /** Already going or hosting: nothing to invite them to. */
  going: boolean;
  /** You invited them already (the invite is sent). */
  sent: boolean;
}

/**
 * The people the sheet lists: your connections (not blocked), in name order, with whether each is
 * going already or you've invited them. `query` matches the name or handle.
 */
export function inviteChoices(
  event: NightEvent,
  me: string,
  users: User[],
  connected: readonly string[],
  blocked: ReadonlySet<string>,
  crews: Crew[],
  query = '',
): InviteChoice[] {
  const term = query.trim().toLowerCase().replace(/^@/, '');
  const mine = new Set(invitedByMe(event, me));
  return connected
    .filter((id) => id !== me && !blocked.has(id))
    .map((id) => users.find((u) => u.id === id))
    .filter((u): u is User => !!u)
    .filter((u) => !term || u.name.toLowerCase().includes(term) || u.handle.toLowerCase().includes(term))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((user) => ({ user, going: event.going.includes(user.id) || isHost(event, user.id, crews), sent: mine.has(user.id) }));
}

/** The server's sentence for why these invites can't go, or null when they can. */
export function inviteProblem(
  event: NightEvent,
  me: string,
  userIds: readonly string[],
  connected: readonly string[],
  blocked: ReadonlySet<string>,
  crews: Crew[],
  now: Date,
): string | null {
  const phase = phaseOf(event, now);
  if (phase === 'cancelled') return 'This event was cancelled.';
  if (phase === 'over') return 'This event has finished.';
  if (!invitesAllowed(event)) return INVITE_WORDS.off;
  if (!(isHost(event, me, crews) || event.going.includes(me))) return INVITE_WORDS.goFirst;
  const ids = Array.from(new Set(userIds));
  if (ids.length === 0) return INVITE_WORDS.none;
  if (ids.some((id) => id === me || !connected.includes(id) || blocked.has(id))) return INVITE_WORDS.notConnected;
  const fresh = newInvitees(event, me, ids, crews);
  if (invitedByMe(event, me).length + fresh.length > INVITE_CAP) return INVITE_WORDS.cap;
  return null;
}

/** The ones that are new: not invited by you already, not hosting or going. */
export function newInvitees(event: NightEvent, me: string, userIds: readonly string[], crews: Crew[]): string[] {
  const mine = new Set(invitedByMe(event, me));
  return Array.from(new Set(userIds)).filter((id) => !mine.has(id) && !event.going.includes(id) && !isHost(event, id, crews));
}

/** The event with these invites recorded (the first inviter stays the one shown). */
export function withInvites(event: NightEvent, me: string, userIds: readonly string[]): NightEvent {
  const invitedBy = { ...(event.invitedBy ?? {}) };
  for (const id of userIds) if (!invitedBy[id]) invitedBy[id] = me;
  return { ...event, invitedBy };
}

/** "Sent to @mo.rs3 and @aimee.r1" / "Sent to 3 people": the toast after inviting (never "Invited", a banned word, 4.12). */
export function invitedToast(handles: readonly string[]): string {
  if (handles.length === 0) return 'Nobody new to invite';
  if (handles.length === 1) return `Sent to @${handles[0]}`;
  if (handles.length === 2) return `Sent to @${handles[0]} and @${handles[1]}`;
  return `Sent to ${handles.length} people`;
}
