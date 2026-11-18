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
  'cunt', 'cunts', 'whore', 'whores', 'slut', 'sluts',
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
  | 'other';

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
  { key: 'other', label: 'Something else' },
];

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
