/**
 * Connections (owner decision, 17 Nov 2026): you send a request, the other
 * person accepts or declines. Private messages, 1-to-1 and groups, only
 * happen between connected people. Mirrors request_connection(),
 * answer_connection(), remove_connection(), my_connections() and
 * block_user() on the server; the demo runs these on the phone.
 *
 * A decline is never shown to the person who asked: it stays "Requested" for
 * them, and asking again does nothing for 30 days.
 */

export type ConnectionState = 'none' | 'outgoing' | 'incoming' | 'connected';

/** A row as the demo keeps it (the server's `connections` table). */
export interface ConnectionRow {
  from: string;
  to: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
  answeredAt?: string;
}

export const DECLINE_COOLDOWN_DAYS = 30;
export const CONNECT_PER_DAY = 20;

export const CONNECT = {
  connect: 'Connect',
  requested: 'Requested',
  connected: 'Connected',
  accept: 'Accept',
  decline: 'Decline',
  remove: 'Remove connection',
  cancel: 'Cancel request',
  message: 'Message',
  block: 'Block',
  unblock: 'Unblock',
} as const;

/** The button on a profile for each state. */
export function connectLabel(state: ConnectionState): string {
  switch (state) {
    case 'outgoing':
      return CONNECT.requested;
    case 'incoming':
      return CONNECT.accept;
    case 'connected':
      return CONNECT.connected;
    default:
      return CONNECT.connect;
  }
}

/** One sentence under the button. */
export function connectHint(state: ConnectionState, handle: string): string {
  switch (state) {
    case 'outgoing':
      return `Waiting for @${handle} to accept.`;
    case 'incoming':
      return `@${handle} wants to connect.`;
    case 'connected':
      return `You and @${handle} can message each other.`;
    default:
      return `Connect to message @${handle}. Until then, talk on the forum.`;
  }
}

/** Only connected people can message each other. */
export function canMessage(state: ConnectionState, blocked: boolean): boolean {
  return state === 'connected' && !blocked;
}

const DAY = 86_400_000;

function pairOf(rows: ConnectionRow[], a: string, b: string): ConnectionRow | undefined {
  return rows.find((r) => (r.from === a && r.to === b) || (r.from === b && r.to === a));
}

/** How `me` stands with `other` (my_connections()). */
export function stateWith(rows: ConnectionRow[], me: string, other: string, now: Date): ConnectionState {
  const r = pairOf(rows, me, other);
  if (!r) return 'none';
  if (r.status === 'accepted') return 'connected';
  if (r.status === 'pending') return r.from === me ? 'outgoing' : 'incoming';
  // Declined: the asker still sees Requested for 30 days; the one who declined sees nothing.
  if (r.from === me && r.answeredAt && now.getTime() - new Date(r.answeredAt).getTime() < DECLINE_COOLDOWN_DAYS * DAY) return 'outgoing';
  return 'none';
}

/** Everyone `me` has a connection or request with, by state. */
export function connectionsOf(rows: ConnectionRow[], me: string, now: Date): Record<string, ConnectionState> {
  const out: Record<string, ConnectionState> = {};
  for (const r of rows) {
    if (r.from !== me && r.to !== me) continue;
    const other = r.from === me ? r.to : r.from;
    const s = stateWith(rows, me, other, now);
    if (s !== 'none') out[other] = s;
  }
  return out;
}

export function idsIn(states: Record<string, ConnectionState>, state: ConnectionState): string[] {
  return Object.keys(states).filter((k) => states[k] === state);
}

/** request_connection(): the rows afterwards and what it came to. Throws the server's sentences. */
export function requestConnection(
  rows: ConnectionRow[],
  me: string,
  other: string,
  now: Date,
  opts: { blocked: boolean; sentToday: number },
): { rows: ConnectionRow[]; result: 'requested' | 'connected' } {
  if (other === me) throw new Error("You can't connect with yourself.");
  if (opts.blocked) throw new Error("You can't connect with this person.");
  const r = pairOf(rows, me, other);
  const iso = now.toISOString();
  if (r) {
    if (r.status === 'accepted') return { rows, result: 'connected' };
    if (r.status === 'pending' && r.from === me) return { rows, result: 'requested' };
    if (r.status === 'pending') {
      return { rows: rows.map((x) => (x === r ? { ...x, status: 'accepted', answeredAt: iso } : x)), result: 'connected' };
    }
    if (r.from === me && stateWith(rows, me, other, now) === 'outgoing') return { rows, result: 'requested' };
  }
  if (opts.sentToday >= CONNECT_PER_DAY) throw new Error("That's the most connection requests for one day. Try again tomorrow.");
  const rest = rows.filter((x) => x !== r);
  return { rows: [...rest, { from: me, to: other, status: 'pending', createdAt: iso }], result: 'requested' };
}

/** answer_connection() */
export function answerConnection(rows: ConnectionRow[], me: string, other: string, accept: boolean, now: Date): ConnectionRow[] {
  const r = rows.find((x) => x.from === other && x.to === me && x.status === 'pending');
  if (!r) throw new Error("That request isn't there any more.");
  return rows.map((x) => (x === r ? { ...x, status: accept ? 'accepted' : 'declined', answeredAt: now.toISOString() } : x));
}

/** remove_connection(): a connection, or your own pending request (a declined one keeps its 30 days). */
export function removeConnection(rows: ConnectionRow[], me: string, other: string): ConnectionRow[] {
  return rows.filter((x) => {
    const pair = (x.from === me && x.to === other) || (x.from === other && x.to === me);
    if (!pair) return true;
    return !(x.status === 'accepted' || (x.status === 'pending' && x.from === me));
  });
}

/** block_user() ends any connection or request between the two. */
export function dropPair(rows: ConnectionRow[], a: string, b: string): ConnectionRow[] {
  return rows.filter((x) => !((x.from === a && x.to === b) || (x.from === b && x.to === a)));
}
