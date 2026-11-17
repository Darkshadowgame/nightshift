import type { Build } from '../types';

/**
 * Offline. A request that never reached the server (no signal, server down) is
 * a network error; anything the server answered is not.
 */
export function isNetworkError(e: unknown): boolean {
  if (!e) return false;
  const msg = e instanceof Error ? e.message : typeof e === 'object' && 'message' in e ? String((e as { message: unknown }).message) : String(e);
  return /network request failed|failed to fetch|fetch failed|networkerror|load failed|network error|timed? ?out|aborted|ECONNREFUSED|ENOTFOUND|EAI_AGAIN/i.test(msg);
}

export const OFFLINE = "You're offline. Try again when you have a signal.";

/**
 * Writes made while offline that are safe to send later (docs/BACKEND.md,
 * "Offline cache plan"): plain data only. Anything with a time-and-place rule
 * (check in, move on, vote, finish a drive, change the plan) fails with
 * OFFLINE instead, because replaying it later would be wrong.
 */
export type OutboxItem =
  | { id: string; kind: 'chat'; eventId: string; text: string; at: string }
  /** `drop`: Storage paths the edit took off the build, removed once it's saved. */
  | { id: string; kind: 'saveBuild'; build: Build; drop?: string[] }
  | { id: string; kind: 'deleteBuild'; buildId: string }
  | { id: string; kind: 'markRead' };

/** Add a write. A newer save of the same build replaces an older one; deleting a build drops its queued saves. */
export function enqueue(items: OutboxItem[], item: OutboxItem): OutboxItem[] {
  let rest = items;
  if (item.kind === 'saveBuild') {
    const id = item.build.id;
    // Files an earlier queued edit took off still need removing.
    const earlier = rest.flatMap((x) => (x.kind === 'saveBuild' && x.build.id === id ? x.drop ?? [] : []));
    if (earlier.length) item = { ...item, drop: Array.from(new Set([...earlier, ...(item.drop ?? [])])) };
    rest = rest.filter((x) => !(x.kind === 'saveBuild' && x.build.id === id));
  }
  if (item.kind === 'deleteBuild') rest = rest.filter((x) => !(x.kind === 'saveBuild' && x.build.id === item.buildId));
  if (item.kind === 'markRead') rest = rest.filter((x) => x.kind !== 'markRead');
  return [...rest, item].slice(-200);
}

/**
 * Send the queue in order. Stops at the first network error (still offline)
 * and keeps the rest; drops anything the server refused, and reports why.
 */
export async function flushOutbox(
  items: OutboxItem[],
  send: (item: OutboxItem) => Promise<void>,
): Promise<{ left: OutboxItem[]; sent: OutboxItem[]; refused: { item: OutboxItem; reason: string }[] }> {
  const sent: OutboxItem[] = [];
  const refused: { item: OutboxItem; reason: string }[] = [];
  for (let i = 0; i < items.length; i++) {
    try {
      await send(items[i]);
      sent.push(items[i]);
    } catch (e) {
      if (isNetworkError(e)) return { left: items.slice(i), sent, refused };
      refused.push({ item: items[i], reason: e instanceof Error ? e.message : String(e) });
    }
  }
  return { left: [], sent, refused };
}
