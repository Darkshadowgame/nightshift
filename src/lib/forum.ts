import { textProblem } from './moderation';
import { REGIONS } from './profile';

/**
 * The forum (Community › Forum): boards, threads, replies, "Helpful" and one
 * reply marked Solved by the thread's author. Mirrors create_thread(),
 * reply_thread(), mark_helpful(), mark_solved() and forum_rep_for() on the
 * server (supabase/migrations/20261117220000_community.sql).
 */

export type BoardKey = 'advice' | 'builds' | 'cars' | 'bikes' | 'detailing' | 'meets' | 'for_sale' | 'local';

export const BOARDS: readonly { key: BoardKey; label: string; short: string; hint: string }[] = [
  { key: 'advice', label: 'Advice and help', short: 'Advice', hint: 'Ask anything: tuning, faults, insurance, MOTs.' },
  { key: 'builds', label: 'Builds and projects', short: 'Builds', hint: 'Progress threads and plans.' },
  { key: 'cars', label: 'Cars', short: 'Cars', hint: 'Anything on four wheels.' },
  { key: 'bikes', label: 'Bikes', short: 'Bikes', hint: 'Anything on two wheels.' },
  { key: 'detailing', label: 'Detailing', short: 'Detailing', hint: 'Washing, polishing, wraps and tints.' },
  { key: 'meets', label: 'Meets and events chat', short: 'Events', hint: 'Talk about events. Never where police are.' },
  { key: 'for_sale', label: 'For sale and wanted', short: 'For sale', hint: 'Posts only: no payments through Nightshift.' },
  { key: 'local', label: 'Local', short: 'Local', hint: 'Your region.' },
];

export function boardLabel(key: BoardKey): string {
  return BOARDS.find((b) => b.key === key)?.label ?? key;
}

export interface ForumThread {
  id: string;
  board: BoardKey;
  /** Local board only. */
  region?: string;
  authorId: string;
  title: string;
  body: string;
  /** Photo refs: stored photo names on the phone, signed URLs from the server. */
  photos: string[];
  buildId?: string;
  createdAt: string;
  lastActivityAt: string;
  replyCount: number;
  solvedReplyId?: string;
  /** Hidden after reports: only the author sees it, with a note. */
  hidden?: boolean;
  /** Demo sample. */
  sample?: boolean;
}

export interface ForumReply {
  id: string;
  threadId: string;
  authorId: string;
  body: string;
  photos: string[];
  buildId?: string;
  createdAt: string;
  helpfulCount: number;
  helpfulByMe: boolean;
  hidden?: boolean;
  sample?: boolean;
}

export interface ThreadDraft {
  board: BoardKey;
  region?: string;
  title: string;
  body: string;
  photos: string[];
  buildId?: string;
}

export const LIMITS = { title: [4, 120], body: 5000, photos: 4 } as const;

export function threadProblem(d: ThreadDraft): string | null {
  const title = d.title.trim();
  if (title.length < LIMITS.title[0]) return 'Give it a title of at least 4 characters.';
  if (title.length > LIMITS.title[1]) return 'Keep the title to 120 characters or fewer.';
  if (d.body.trim().length > LIMITS.body) return 'Keep it to 5,000 characters or fewer.';
  if (d.board === 'local' && !REGIONS.some((r) => r.name === d.region)) return 'Pick a region for the Local board.';
  if (d.photos.length > LIMITS.photos) return 'Up to 4 photos a post.';
  return textProblem(`${title}\n${d.body}`);
}

export function replyProblem(body: string): string | null {
  const b = body.trim();
  if (!b) return 'Write a reply first.';
  if (b.length > LIMITS.body) return 'Keep it to 5,000 characters or fewer.';
  return textProblem(b);
}

export type ThreadSort = 'active' | 'new';

/** Newest activity first, or newest threads first. */
export function sortThreads(threads: ForumThread[], sort: ThreadSort): ForumThread[] {
  const key = (t: ForumThread) => (sort === 'new' ? t.createdAt : t.lastActivityAt);
  return [...threads].sort((a, b) => key(b).localeCompare(key(a)) || b.id.localeCompare(a.id));
}

/** Search by title: every word must appear, any order, any case. */
export function searchThreads(threads: ForumThread[], query: string): ForumThread[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return threads;
  return threads.filter((t) => {
    const title = t.title.toLowerCase();
    return words.every((w) => title.includes(w));
  });
}

/** Escape a search for PostgREST's ilike (the server's own search). */
export function ilikePattern(query: string): string {
  return `%${query.trim().replace(/[\\%_]/g, (c) => `\\${c}`).replace(/\s+/g, '%')}%`;
}

export function threadsFor(threads: ForumThread[], board: BoardKey | 'all', region: string | null): ForumThread[] {
  return threads.filter((t) => (board === 'all' ? true : t.board === board) && (board !== 'local' || !region || t.region === region));
}

// ---------------------------------------------------------------------------
// Solved rep (mark_solved())
// ---------------------------------------------------------------------------

export const SOLVED_REP = 25;
export const SOLVED_PER_DAY = 3;

export interface SolvedRecord {
  threadId: string;
  /** The reply's author: who earns it. */
  userId: string;
  /** The thread's author, who marked it. */
  markedBy: string;
  rep: number;
  /** UK day, YYYY-MM-DD. */
  day: string;
  at: string;
}

export interface ForumRep {
  solved: number;
  rep: number;
}

export const NO_FORUM_REP: ForumRep = { solved: 0, rep: 0 };

/**
 * The record a Solved mark adds, or null (your own reply, or the thread
 * already paid). Over a cap it's kept with 0 rep, so the count is right: at
 * most 3 paid a day, and one a week from the same thread author.
 */
export function solvedRecord(
  records: SolvedRecord[],
  thread: Pick<ForumThread, 'id' | 'authorId'>,
  reply: Pick<ForumReply, 'authorId'>,
  now: Date,
  ukDay: string,
): SolvedRecord | null {
  if (reply.authorId === thread.authorId) return null;
  if (records.some((r) => r.threadId === thread.id)) return null;
  const paidToday = records.filter((r) => r.userId === reply.authorId && r.day === ukDay && r.rep > 0).length;
  const sameMarker = records.some(
    (r) => r.userId === reply.authorId && r.markedBy === thread.authorId && r.rep > 0 && now.getTime() - new Date(r.at).getTime() < 7 * 86_400_000,
  );
  const rep = paidToday >= SOLVED_PER_DAY || sameMarker ? 0 : SOLVED_REP;
  return { threadId: thread.id, userId: reply.authorId, markedBy: thread.authorId, rep, day: ukDay, at: now.toISOString() };
}

export function forumRepOf(records: SolvedRecord[], userId: string): ForumRep {
  const mine = records.filter((r) => r.userId === userId);
  return { solved: mine.length, rep: mine.reduce((s, r) => s + r.rep, 0) };
}

/** The day for the daily caps: the phone's own day (the server uses Europe/London). */
export function ukDay(now: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`;
}
