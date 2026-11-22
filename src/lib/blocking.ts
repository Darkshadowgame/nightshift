import type { Conversation } from './messages';

/**
 * Blocking, one rule for every list: a blocked person is gone. Their rows, counts and names never reach the
 * screen. (The server hides you from them too: see migration 20261122160000_lvl_people.)
 */

/** Everything except what a blocked person owns. */
export function withoutBlocked<T>(items: readonly T[], idOf: (item: T) => string | null | undefined, blocked: ReadonlySet<string>): T[] {
  if (blocked.size === 0) return [...items];
  return items.filter((x) => {
    const id = idOf(x);
    return !id || !blocked.has(id);
  });
}

/** Ids with the blocked ones taken out. */
export function idsWithoutBlocked(ids: readonly string[], blocked: ReadonlySet<string>): string[] {
  return withoutBlocked(ids, (x) => x, blocked);
}

/**
 * The chat list: a 1-to-1 with someone you blocked is hidden, and a group's preview never quotes a blocked
 * sender's last line.
 */
export function visibleConversations(list: readonly Conversation[], me: string, blocked: ReadonlySet<string>): Conversation[] {
  if (blocked.size === 0) return [...list];
  const out: Conversation[] = [];
  for (const c of list) {
    if (c.kind === 'direct') {
      const other = c.memberIds.find((m) => m !== me);
      if (other && blocked.has(other)) continue;
      out.push(c);
    } else if (c.last?.senderId && blocked.has(c.last.senderId)) {
      out.push({ ...c, last: undefined, unread: 0 });
    } else {
      out.push(c);
    }
  }
  return out;
}
