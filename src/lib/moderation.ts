/**
 * Public text rules for the Community tab (forum, posts, comments, group
 * names), the same as the server's private.text_problem() in
 * supabase/migrations/20261117220000_community.sql. The phone checks first
 * for a quick answer; the server checks again and has the last word.
 *
 * 1. A short word list (slurs and the strongest swearing), matched on whole
 *    words after undoing the usual letter swaps ("f.u.c.k", "c0ck"…).
 * 2. No police spotting: where police or speed checks are belongs nowhere
 *    but the driving view's road reports (SPEC "Road reports").
 * 3. No organising or timing racing on public roads (App Store 1.4.4).
 *
 * Talking about the police ("pulled by police at a meet") is fine.
 */

/** Kept in step with private.banned_terms (a Jest test checks the migration has every one). */
export const BANNED_TERMS: readonly string[] = [
  'nigger', 'niggers', 'nigga', 'niggas', 'paki', 'pakis', 'chink', 'chinks',
  'gook', 'gooks', 'spic', 'spics', 'kike', 'kikes', 'wog', 'wogs', 'coon', 'coons',
  'raghead', 'ragheads', 'towelhead', 'towelheads', 'gypo', 'gyppo', 'pikey', 'pikeys',
  'faggot', 'faggots', 'dyke', 'dykes',
  'whore', 'whores', 'slut', 'sluts',
];

export const TEXT_PROBLEMS = {
  words: "Keep it friendly: that has a word Nightshift doesn't allow.",
  police: "Posts about where police or speed checks are aren't allowed on Nightshift.",
  racing: "Nightshift doesn't allow organising or timing racing on public roads. Track days are fine.",
} as const;

const SWAPS: Record<string, string> = { '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '9': 'g', '@': 'a', $: 's', '!': 'i' };

/** Lower case, letter swaps undone, dots, stars, dashes and underscores between letters dropped. */
export function normaliseForWords(text: string): string {
  const swapped = text.toLowerCase().replace(/[0134579@$!]/g, (c) => SWAPS[c] ?? c);
  return swapped.replace(/([a-z])[.*_-]+(?=[a-z])/g, '$1');
}

const COPS = '(police|cops|feds|old bill|plod|unmarked|speed traps?|speed checks?|speed guns?|camera vans?|laser guns?|traffic cops|rozzers)';

/** The same patterns as the SQL (\b here is \y there). */
export const POLICE_PATTERNS: readonly RegExp[] = [
  new RegExp(`\\b${COPS}\\s+(spotted|sat|parked|waiting|hiding|out|about|everywhere|lurking)\\b`),
  new RegExp(`\\b(spotted|watch out for|beware of|beware|heads up)\\s+(the\\s+|a\\s+|an\\s+)?${COPS}\\b`),
  new RegExp(`\\b${COPS}\\s+(at|on|near)\\s+(the\\s+)?(a|b|m)[0-9]+\\b`),
];

export const RACING_PATTERNS: readonly RegExp[] = [
  /\b(street|road|illegal)\s+rac(e|es|ing)\b/,
  /\b(race|racing|timed run|time trial)\s+(on|down|along|up)\s+(the\s+)?(a|b|m)[0-9]+\b/,
  /\b(drag|top speed|roll)\s+(race|races|racing|run|runs)\s+(on|down|along)\s+(the\s+)?(road|roads|street|streets|motorway|dual carriageway|bypass|a[0-9]+|b[0-9]+|m[0-9]+)\b/,
];

/** The sentence to show, or null when the text is fine. */
export function textProblem(text: string): string | null {
  const words = normaliseForWords(text);
  if (BANNED_TERMS.some((t) => new RegExp(`\\b${t}\\b`).test(words))) return TEXT_PROBLEMS.words;
  const plain = text.toLowerCase();
  if (POLICE_PATTERNS.some((p) => p.test(plain))) return TEXT_PROBLEMS.police;
  if (RACING_PATTERNS.some((p) => p.test(plain))) return TEXT_PROBLEMS.racing;
  return null;
}

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------

/** `chat`: an event chat line; `spot`: a suggested drive or photo spot. */
export type ReportTarget = 'thread' | 'reply' | 'message' | 'post' | 'comment' | 'profile' | 'build' | 'chat' | 'event' | 'crew' | 'spot';
export type ReportReason =
  | 'spam'
  | 'harassment'
  | 'hate'
  | 'sexual'
  | 'violence'
  | 'dangerous_driving'
  | 'police'
  | 'personal_info'
  | 'scam'
  | 'underage'
  | 'other'
  /** Builds only: the dyno sheet behind the "Dyno proven" badge looks fake or edited. */
  | 'fake_dyno'
  /** A readable number plate: videos can't be blurred (20261121110000_number_plate_reason.sql). */
  | 'number_plate'
  /** Only raised by Nightshift itself: someone whose posts are nearly all selling. */
  | 'sell_only';

/** In the order the report screen lists them. */
export const REPORT_REASONS: readonly { key: ReportReason; label: string }[] = [
  { key: 'harassment', label: 'Bullying or harassment' },
  { key: 'hate', label: 'Hate or slurs' },
  { key: 'dangerous_driving', label: 'Street racing or dangerous driving' },
  { key: 'police', label: 'Says where police or speed checks are' },
  { key: 'personal_info', label: "Shares someone's details or where they live" },
  { key: 'sexual', label: 'Sexual content' },
  { key: 'violence', label: 'Violence or threats' },
  { key: 'scam', label: 'Scam or fraud' },
  { key: 'spam', label: 'Spam' },
  { key: 'underage', label: 'Someone under 18' },
  { key: 'number_plate', label: 'Shows a number plate' },
  { key: 'fake_dyno', label: 'Fake or edited dyno sheet' },
  { key: 'other', label: 'Something else' },
];

/** Labels for staff, the automatic reason too. */
export function reportReasonLabel(k: string): string {
  if (k === 'sell_only') return 'Only here to sell (automatic)';
  return REPORT_REASONS.find((r) => r.key === k)?.label ?? k;
}

export const REPORT_WHAT: Record<ReportTarget, string> = {
  thread: 'thread',
  reply: 'reply',
  message: 'message',
  post: 'post',
  comment: 'comment',
  profile: 'profile',
  build: 'build',
  chat: 'chat message',
  event: 'event',
  crew: 'crew',
  spot: 'place',
};

export function reportProblem(reason: ReportReason | null, note: string): string | null {
  if (!reason) return 'Pick a reason.';
  if (reason === 'other' && note.trim().length < 3) return "Say a little about what's wrong.";
  if (note.length > 500) return 'Keep the note to 500 characters or fewer.';
  return null;
}

// ---------------------------------------------------------------------------
// Spam and selling (supabase/migrations/20261118180000_spam_selling_member_moderation.sql).
// The server decides; these give the same answer first, for a friendly message.
// ---------------------------------------------------------------------------

export const SPAM_PROBLEMS = {
  duplicate: "You've already posted that. Spamming the same message isn't allowed.",
  selling: "You've posted a lot of selling lately. Put things for sale on the For sale & wanted board instead.",
  forSaleCap: "That's 5 listings on For sale & wanted this week, the most for 7 days. Try again in a few days.",
} as const;

/** A gentle note in a composer, never a refusal: occasional selling is fine. */
export const SELLING_HINT = 'Selling something? The For sale & wanted board is the place for it. The odd sale elsewhere is fine.';

/** Same numbers as the SQL. */
export const SPAM_LIMITS = {
  /** Shorter (normalised) texts never count as duplicates: "nice one", "see you there". */
  minLength: 15,
  /** Near copies are only compared over this length; shorter ones must match exactly. */
  nearLength: 20,
  similarity: 0.9,
  /** Copies allowed in 24 hours (public), or different private chats. */
  copies: 2,
  windowHours: 24,
} as const;

export const SELLING_LIMITS = {
  minPosts: 5,
  share: 0.6,
  perWeek: 3,
  forSalePerWeek: 5,
  sellOnlyShare: 0.9,
} as const;

/** Lower case; only a-z, 0-9 and spaces kept; runs of space become one. Same as private.spam_normalise(). */
export function normaliseForSpam(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9 \t\n\r]+/g, '')
    .replace(/[ \t\n\r]+/g, ' ')
    .trim();
}

function pairs(s: string): Set<string> {
  const out = new Set<string>();
  for (let i = 0; i < s.length - 1; i++) out.add(s.slice(i, i + 2));
  return out;
}

/** Dice coefficient on the sets of 2-character pieces (0 to 1). Same as private.text_similarity(). */
export function similarity(a: string, b: string): number {
  if (a === b) return 1;
  const ga = pairs(a);
  const gb = pairs(b);
  if (ga.size + gb.size === 0) return 0;
  let shared = 0;
  ga.forEach((g) => {
    if (gb.has(g)) shared++;
  });
  return (2 * shared) / (ga.size + gb.size);
}

/** Two normalised texts are the same message. Same as private.near_duplicate(). */
export function isNearDuplicate(a: string, b: string): boolean {
  if (a.length < SPAM_LIMITS.minLength || b.length < SPAM_LIMITS.minLength) return false;
  if (a === b) return true;
  if (a.length <= SPAM_LIMITS.nearLength || b.length <= SPAM_LIMITS.nearLength) return false;
  if (Math.min(a.length, b.length) / Math.max(a.length, b.length) < 0.8) return false;
  return similarity(a, b) >= SPAM_LIMITS.similarity;
}

/** Something this person sent: `place` is the chat for private messages. */
export interface SentText {
  norm: string;
  message: boolean;
  place: string | null;
  at: number;
}

/**
 * The duplicate rule, as the server counts it: each public copy in the last 24
 * hours counts once, private copies once per different chat (not this one).
 * Two already means this one is refused.
 */
export function duplicateProblem(text: string, sent: readonly SentText[], o: { message: boolean; place?: string | null; now: number }): string | null {
  const norm = normaliseForSpam(text);
  if (norm.length < SPAM_LIMITS.minLength) return null;
  const since = o.now - SPAM_LIMITS.windowHours * 3600_000;
  let publicCopies = 0;
  const chats = new Set<string | null>();
  for (const s of sent) {
    if (s.at <= since) continue;
    if (s.message && o.message && s.place === (o.place ?? null)) continue;
    if (!isNearDuplicate(s.norm, norm)) continue;
    if (s.message) chats.add(s.place);
    else publicCopies++;
  }
  return publicCopies + chats.size >= SPAM_LIMITS.copies ? SPAM_PROBLEMS.duplicate : null;
}

/** Remember a sent text (kept for a day). Returns the new list. */
export function rememberSent(sent: readonly SentText[], text: string, o: { message: boolean; place?: string | null; now: number }): SentText[] {
  const norm = normaliseForSpam(text);
  const since = o.now - SPAM_LIMITS.windowHours * 3600_000;
  const kept = sent.filter((s) => s.at > since);
  if (norm.length < SPAM_LIMITS.minLength) return kept;
  return [...kept, { norm, message: o.message, place: o.place ?? null, at: o.now }].slice(-500);
}

/** The words that say it's selling. Same patterns as private.is_selling() (\b there is \y). */
const SELLING_STRONG: readonly RegExp[] = [
  /\b(for sale|fs|f\/s|wts|wtb|wtt|ono|ovno|selling)\b/,
  /\b(dm|pm|message|msg|inbox)( me)? (for|4) (a )?prices?\b/,
  /\b(collection only|price drop|price dropped|asking price|open to offers|offers welcome|no offers|no time ?wasters)\b/,
  /(ebay\.(co\.uk|com)|gumtree\.com|facebook\.com\/marketplace|fb\.com\/marketplace|vinted\.(co\.uk|com)|depop\.com|preloved\.co\.uk)/,
  /\b(listed|listing|up) on (ebay|gumtree|vinted|depop|marketplace|fb marketplace|facebook marketplace)\b/,
  /\b(use|using) (my )?code\b/,
  /\b(discount|promo|voucher|affiliate|referral) codes?\b/,
  /\b[0-9]{1,2}% off\b/,
];
const SELLING_PRICE: readonly RegExp[] = [/£ ?[0-9]/, /\b[0-9]+(\.[0-9]+)?k? ?(quid|gbp|pounds|squid)\b/];
const SELLING_CONTEXT = /\b(postage|posted|p&p|collection|collect|offers|swaps?|px|bnib|boxed|asking)\b/;

/**
 * Is this text selling something? A selling word, a marketplace link or a
 * discount code; or a price with a selling word near it ("£250 plus postage").
 * Talking about money ("spent £400 on coilovers") isn't.
 */
export function isSelling(text: string): boolean {
  const t = text.toLowerCase().replace(/(best|top|fast|biggest)[ -]selling|selling points?/g, ' ');
  if (SELLING_STRONG.some((r) => r.test(t))) return true;
  return SELLING_PRICE.some((r) => r.test(t)) && SELLING_CONTEXT.test(t);
}

/** The composer's note: selling outside For sale & wanted. */
export function sellingHint(text: string, board?: string | null): string | null {
  if (board === 'for_sale') return null;
  return isSelling(text) ? SELLING_HINT : null;
}

// ---------------------------------------------------------------------------
// Bans, warnings and staff roles (docs/MODERATION.md)
// ---------------------------------------------------------------------------

export type BanScope = 'community' | 'full';
export type StaffRole = 'owner' | 'admin' | 'moderator';

const ukWhen = (iso: string) =>
  new Date(iso)
    .toLocaleString('en-GB', { timeZone: 'Europe/London', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })
    .replace(' at ', ', ');

/** The sentence a banned person sees. Same as private.ban_message(). */
export function banMessage(scope: BanScope, until: string | null, reason: string | null): string {
  if (scope === 'full') return "Your account is suspended, so you can't post or message right now. You can still read and report.";
  const why = reason?.trim().replace(/\.+$/, '');
  return `You can't post in Community until ${until ? ukWhen(until) : 'a moderator lifts it'}${why ? `: ${why}` : ''}.`;
}

/** The ban lengths staff pick from; null is until lifted. */
export const BAN_CHOICES: readonly { label: string; days: number | null }[] = [
  { label: '24 hours', days: 1 },
  { label: '3 days', days: 3 },
  { label: '7 days', days: 7 },
  { label: '30 days', days: 30 },
  { label: 'Until lifted', days: null },
];

/** Reasons staff warn or ban for (they can write their own). */
export const WARN_REASONS: readonly string[] = [
  'Spamming the same message',
  'Only posting to sell',
  'Bullying or harassment',
  'Hate or slurs',
  'Street racing or dangerous driving',
  'Police spotting',
  "Sharing someone's details",
  'Sexual content',
];

export function roleRank(role: StaffRole | null | undefined): number {
  return role === 'owner' ? 3 : role === 'admin' ? 2 : role === 'moderator' ? 1 : 0;
}

export const ROLE_LABEL: Record<StaffRole, string> = { owner: 'Owner', admin: 'Admin', moderator: 'Moderator' };

/** Can someone with this role act on that person at all? (never themselves, never the same or a higher role) */
export function canActOn(actor: StaffRole | null, target: StaffRole | null, self: boolean): boolean {
  return roleRank(actor) > 0 && !self && roleRank(target) < roleRank(actor);
}

/** Moderators: Community bans of 1 to 7 days. Admins and the owner: any. Same as private.check_ban_power(). */
export function canBan(actor: StaffRole | null, scope: BanScope, days: number | null): boolean {
  const r = roleRank(actor);
  if (r === 0) return false;
  if (r >= 2) return true;
  return scope === 'community' && days !== null && days >= 1 && days <= 7;
}

/** Role changes the actor may make to someone who has `current`. Same as set_staff_role(). */
export function roleChoices(actor: StaffRole | null, current: StaffRole | null, self: boolean): (StaffRole | null)[] {
  const mine = roleRank(actor);
  if (mine < 2 || self || roleRank(current) >= mine) return [];
  const out: (StaffRole | null)[] = [];
  for (const r of ['admin', 'moderator', null] as (StaffRole | null)[]) {
    if (roleRank(r) < mine && r !== current) out.push(r);
  }
  return out;
}

const ACTION_LABEL: Record<string, string> = {
  warn: 'Warned',
  hide: 'Hid content',
  unhide: 'Restored content',
  ban: 'Community ban',
  suspend: 'Full suspension',
  lift: 'Lifted ban',
  promote: 'Promoted',
  demote: 'Demoted',
  dismiss: 'Dismissed report',
  auto_report: 'Automatic report',
  cooldown: 'Automatic 24-hour cooldown',
  remove_dyno: 'Removed a Dyno badge',
};

/** One line of the moderation log: what, how long, by whom (and their role then). */
export function actionLine(a: { action: string; actorHandle: string | null; actorRole: string; days: number | null; newRole: string | null }): string {
  const who = a.actorHandle ?? (a.actorRole === 'system' ? 'Nightshift' : 'Staff');
  const len = a.action === 'ban' || a.action === 'suspend' ? (a.days ? ` · ${a.days} day${a.days === 1 ? '' : 's'}` : ' · until lifted') : '';
  const role = a.action === 'promote' || a.action === 'demote' ? ` · ${a.newRole ? ROLE_LABEL[a.newRole as StaffRole] ?? a.newRole : 'no role'}` : '';
  return `${ACTION_LABEL[a.action] ?? a.action}${len}${role} · by ${who} (${a.actorRole})`;
}
