import { textProblem } from './moderation';
import { inGroup } from './forumGroups';
import { REGIONS } from './profile';

/**
 * The forum (Community › Forum): boards, threads, replies, "Helpful" and one
 * reply marked Solved by the thread's author. Mirrors create_thread(),
 * reply_thread(), mark_helpful(), mark_solved() and forum_rep_for() on the
 * server (supabase/migrations/20261117220000_community.sql).
 */

export type BoardKey = 'advice' | 'builds' | 'cars' | 'bikes' | 'detailing' | 'meets' | 'for_sale' | 'local';

/**
 * One name per board, the same on the chips, the board list, tags and cards. `title` and `body`
 * are the composer's placeholders for that board.
 */
export const BOARDS: readonly { key: BoardKey; label: string; hint: string; title: string; body: string }[] = [
  { key: 'advice', label: 'Advice and help', hint: 'Ask anything: tuning, faults, insurance, MOTs.', title: 'e.g. Clutch slipping after a remap', body: "What's the car or bike, what have you tried, what do you want to know?" },
  { key: 'builds', label: 'Builds and projects', hint: 'Progress threads and plans.', title: 'e.g. FK8 build: stock to Stage 2', body: "What you've done so far, what's next, and what it cost in time and money." },
  { key: 'cars', label: 'Cars', hint: 'Anything on four wheels.', title: 'e.g. GR Yaris or Type R as a daily?', body: 'Say what you think and why. Pictures welcome.' },
  { key: 'bikes', label: 'Bikes', hint: 'Anything on two wheels.', title: 'e.g. First winter with an R1', body: 'Say what you think and why. Pictures welcome.' },
  { key: 'detailing', label: 'Detailing', hint: 'Washing, polishing, wraps and tints.', title: 'e.g. Ceramic coat or wax on a daily?', body: 'Paint, colour, how it lives (garaged or outside), and what you use now.' },
  { key: 'meets', label: 'Meets', hint: 'Talk about meets and shows. Never where police are.', title: 'e.g. Parking tips for Sunday’s show', body: 'Which meet, and what you want to know or share. Nothing about where police are.' },
  { key: 'for_sale', label: 'For sale and wanted', hint: 'Posts only: no payments through Slipstream.', title: 'e.g. FK8 rear wing, Championship White', body: 'Condition, mileage or age, part numbers, what it fits, where you are…' },
  { key: 'local', label: 'Local', hint: 'Your region.', title: 'e.g. Cafes that welcome a few cars?', body: 'Where roughly, and what you have in mind.' },
];

export function boardLabel(key: BoardKey): string {
  return BOARDS.find((b) => b.key === key)?.label ?? key;
}

export interface ForumThread {
  id: string;
  board: BoardKey;
  /** Set: the thread is Local (for people in this region). Unset: Everyone. The Local board always has one. */
  region?: string;
  /** A make or model group it was posted in (forumGroups.ts). */
  groupKey?: string;
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
  /** For sale and wanted only. */
  listing?: Listing;
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
  /** Set: Local to this region. Unset: Everyone. */
  region?: string;
  groupKey?: string;
  title: string;
  body: string;
  photos: string[];
  buildId?: string;
  /** For sale and wanted only; ignored on other boards. */
  listing?: ListingDraft;
}

// ---------------------------------------------------------------------------
// Listings (For sale and wanted): mirrors forum_threads' listing columns and
// create_thread() / set_listing_sold() (20261118230000_forum_listings.sql)
// ---------------------------------------------------------------------------

export type ListingKind = 'sale' | 'wanted';
export type ListingCondition = 'new' | 'like_new' | 'good' | 'fair' | 'parts';
export type Handover = 'collection' | 'postage' | 'either';

export interface Listing {
  kind: ListingKind;
  /** Price (for sale) or budget (wanted), in pence. None: "Offers" / "Any budget". */
  pricePence?: number;
  /** "Or nearest offer". Only with a price. */
  ono?: boolean;
  /** For sale only. */
  condition?: ListingCondition;
  handover?: Handover;
  /** When it was marked sold (or found, when wanted). */
  soldAt?: string;
}

export type ListingDraft = Omit<Listing, 'soldAt'>;

export const LISTING_KINDS: readonly { key: ListingKind; label: string }[] = [
  { key: 'sale', label: 'For sale' },
  { key: 'wanted', label: 'Wanted' },
];

export const CONDITIONS: readonly { key: ListingCondition; label: string }[] = [
  { key: 'new', label: 'New' },
  { key: 'like_new', label: 'Used: like new' },
  { key: 'good', label: 'Used: good' },
  { key: 'fair', label: 'Used: fair' },
  { key: 'parts', label: 'For parts' },
];

export const HANDOVERS: readonly { key: Handover; label: string }[] = [
  { key: 'collection', label: 'Collection only' },
  { key: 'postage', label: 'Postage only' },
  { key: 'either', label: 'Collection or postage' },
];

/** The most a price can be: £1,000,000. */
export const MAX_PRICE_PENCE = 100_000_000;

/** "250 ono", "£250 ONO", "250 o.n.o.": the seller typed "or nearest offer" with the price. */
export function typedOno(typed: string): boolean {
  return /\b(o\.?n\.?o\.?|or nearest offer)\s*$/i.test(typed.trim());
}

/**
 * Pence from what someone typed: "450", "£450", "1,250.50", "45.5", and with ONO after it
 * ("250 ono", "£250 ONO": see typedOno). Null when empty, NaN when it isn't a price.
 */
export function parsePrice(typed: string): number | null {
  const t = typed.trim().replace(/\s*(o\.?n\.?o\.?|or nearest offer)\s*$/i, '').replace(/^£/, '').replace(/,/g, '').trim();
  if (!t) return null;
  if (!/^\d+(\.\d{1,2})?$/.test(t)) return NaN;
  const [pounds, pence = ''] = t.split('.');
  return Number(pounds) * 100 + Number(pence.padEnd(2, '0'));
}

/** "£450", "£1,250.50", "£450 ONO"; "Offers" or "Any budget" with no price. */
export function priceLabel(l: Pick<Listing, 'kind' | 'pricePence' | 'ono'>): string {
  if (l.pricePence == null) return l.kind === 'wanted' ? 'Any budget' : 'Offers';
  const pounds = Math.floor(l.pricePence / 100);
  const pence = l.pricePence % 100;
  const money = `£${pounds.toLocaleString('en-GB')}${pence ? `.${String(pence).padStart(2, '0')}` : ''}`;
  return `${l.kind === 'wanted' ? 'Budget ' : ''}${money}${l.ono ? ' ONO' : ''}`;
}

export function conditionLabel(c: ListingCondition | undefined): string | null {
  return c ? (CONDITIONS.find((x) => x.key === c)?.label ?? null) : null;
}

export function handoverLabel(h: Handover | undefined): string | null {
  return h ? (HANDOVERS.find((x) => x.key === h)?.label ?? null) : null;
}

/** The facts line under a listing: condition and how it changes hands. */
export function listingFacts(l: Listing): string[] {
  return [l.kind === 'sale' ? conditionLabel(l.condition) : null, handoverLabel(l.handover)].filter((x): x is string => !!x);
}

/** What the server would refuse in a listing, in the same words. */
export function listingProblem(l: ListingDraft): string | null {
  if (l.kind !== 'sale' && l.kind !== 'wanted') return "Say whether it's for sale or wanted.";
  if (l.pricePence != null && (!Number.isInteger(l.pricePence) || l.pricePence < 0 || l.pricePence > MAX_PRICE_PENCE)) return 'Give a price between £0 and £1,000,000.';
  if (l.ono && l.pricePence == null) return 'Add a price to say "or nearest offer".';
  return null;
}

/** The listing as saved: wanted listings have no condition, and ONO needs a price. */
export function cleanListing(l: ListingDraft): ListingDraft {
  return {
    kind: l.kind,
    ...(l.pricePence != null ? { pricePence: l.pricePence } : {}),
    ...(l.ono && l.pricePence != null ? { ono: true } : {}),
    ...(l.kind === 'sale' && l.condition ? { condition: l.condition } : {}),
    ...(l.handover ? { handover: l.handover } : {}),
  };
}

export const LIMITS = { title: [4, 120], body: 5000, photos: 10 } as const;

export function threadProblem(d: ThreadDraft): string | null {
  const title = d.title.trim();
  if (title.length < LIMITS.title[0]) return 'Give it a title of at least 4 characters.';
  if (title.length > LIMITS.title[1]) return 'Keep the title to 120 characters or fewer.';
  if (d.body.trim().length > LIMITS.body) return 'Keep it to 5,000 characters or fewer.';
  if (d.board === 'local' && !d.region) return 'Pick a region for the Local board.';
  if (d.region && !REGIONS.some((r) => r.name === d.region)) return 'Pick a region from the list.';
  if (d.groupKey && !/^[a-z0-9-]{1,40}(:[a-z0-9-]{1,60})?$/.test(d.groupKey)) return 'Pick a group from the list.';
  if (d.photos.length > LIMITS.photos) return 'Up to 10 photos a post.';
  if (d.board === 'for_sale' && d.listing) {
    const l = listingProblem(d.listing);
    if (l) return l;
  }
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

/** Who a thread list is for: Everyone (the whole UK) or Local (your region). */
export type ForumScope = 'everyone' | 'local';

export const SCOPES: { key: ForumScope; label: string }[] = [
  { key: 'everyone', label: 'Everyone' },
  { key: 'local', label: 'Local' },
];

export function isScope(x: unknown): x is ForumScope {
  return x === 'everyone' || x === 'local';
}

/** Everyone is threads for the whole UK (no region). Local is threads for your region. */
export function inScope(t: Pick<ForumThread, 'region'>, scope: ForumScope, region: string | null): boolean {
  return scope === 'local' ? !!t.region && (!region || t.region === region) : !t.region;
}

/**
 * Threads for a board, scope and group. A group is a filtered forum: a make group takes its
 * models' threads too.
 */
export function threadsFor(
  threads: ForumThread[],
  board: BoardKey | 'all',
  region: string | null,
  scope: ForumScope = 'everyone',
  group?: string | null,
): ForumThread[] {
  return threads.filter((t) => (board === 'all' ? true : t.board === board) && inScope(t, scope, region) && (!group || inGroup(t.groupKey, group)));
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
