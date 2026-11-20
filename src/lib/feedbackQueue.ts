/**
 * Feedback queued on the phone until it's sent to the backend's feedback
 * table: the "Send feedback" form (any kind, screenshots, context, location
 * only when ticked), and the suggestions made in the pickers ("a car or mod is
 * missing") and on shop screens ("this listing is wrong", "a shop is missing").
 */

export type FeedbackScreen = 'vehicle-picker' | 'mod-picker' | 'shop';

export type FeedbackKind = 'bug' | 'idea' | 'looks_wrong' | 'other';

/** The form's choices, in order. */
export const FEEDBACK_KINDS: { kind: FeedbackKind; label: string; hint: string }[] = [
  { kind: 'bug', label: 'Bug', hint: 'Something broke or didn’t work.' },
  { kind: 'idea', label: 'Idea', hint: 'Something you’d like Slipstream to do.' },
  { kind: 'looks_wrong', label: 'Something’s wrong with a place or event', hint: 'A wrong pin, name, time or detail.' },
  { kind: 'other', label: 'Other', hint: 'Anything else.' },
];

export const kindLabel = (kind: string): string => FEEDBACK_KINDS.find((k) => k.kind === kind)?.label ?? 'Feedback';

/** Sent automatically with each report (no names, no location). */
export interface FeedbackContext {
  /** Runtime version of the native build. */
  runtime?: string | null;
  /** EAS Update channel. */
  channel?: string | null;
  /** Device model, e.g. "iPhone 15 Pro" (never the phone's own name). */
  model?: string | null;
  /** e.g. "ios 26.1". */
  os?: string | null;
  /** The screen the form was opened from, e.g. "/event/[id]". */
  route?: string | null;
  /** "demo", "signed-in" or "signed-out". */
  backend?: string | null;
  /** Set by the smoke test so the report isn't emailed. */
  test?: boolean;
}

/** The most screenshots or photos one report can carry (the backend's limit). */
export const FEEDBACK_PHOTOS_MAX = 4;

const WHAT: Record<FeedbackScreen, string> = { 'vehicle-picker': 'Missing vehicle', 'mod-picker': 'Missing mod', shop: 'Shop edit or missing shop' };
const CONTEXT: Record<FeedbackScreen, string> = { 'vehicle-picker': 'Picker', 'mod-picker': 'Picker', shop: 'Listing' };

export interface PendingFeedback {
  /** A UUID (the server keeps it, so a retry can't send it twice). Old queued items may have other ids. */
  id: string;
  kind: FeedbackKind;
  message: string;
  /** A picker or shop, or the route the form was opened from. */
  screen: FeedbackScreen | string;
  /** ISO time it was written. */
  at: string;
  /** Stored photo names (already through the plate check), uploaded when sent. Signed in only. */
  photos?: string[];
  context?: FeedbackContext;
  /** Only when the sender ticked "include my location". */
  location?: { lat: number; lng: number };
}

/** A report this phone sent (or is about to), for "Your feedback". */
export interface SentFeedback {
  id: string;
  kind: FeedbackKind;
  /** The start of the message, for the list. */
  summary: string;
  at: string;
  /** The server's answer, once known. */
  status?: FeedbackStatus;
  fixedIn?: string | null;
}

export type FeedbackStatus = 'new' | 'seen' | 'planned' | 'done' | 'wont_do';

/** What "Your feedback" shows for a report. */
export function statusLabel(f: Pick<SentFeedback, 'status' | 'fixedIn'>, waiting: boolean): string {
  if (waiting) return 'Waiting to send';
  switch (f.status) {
    case 'seen':
      return 'Seen';
    case 'planned':
      return 'Planned';
    case 'done':
      return f.fixedIn ? `Fixed in ${f.fixedIn}` : 'Fixed';
    case 'wont_do':
      return 'Not planned';
    default:
      return 'New';
  }
}

export function reportProblem(message: string): string | null {
  if (!message.trim()) return 'Say what happened first.';
  return null;
}

/** Build a report from the form. Throws with a readable reason when there's nothing to send. */
export function makeReport(
  input: { kind: FeedbackKind; message: string; screen: string; photos?: string[]; context?: FeedbackContext; location?: { lat: number; lng: number } | null },
  id: string,
  now: Date,
): PendingFeedback {
  const problem = reportProblem(input.message);
  if (problem) throw new Error(problem);
  const item: PendingFeedback = {
    id,
    kind: input.kind,
    message: input.message.trim().slice(0, FEEDBACK_MAX),
    screen: input.screen.slice(0, 200),
    at: now.toISOString(),
  };
  const photos = (input.photos ?? []).slice(0, FEEDBACK_PHOTOS_MAX);
  if (photos.length) item.photos = photos;
  if (input.context) item.context = input.context;
  if (input.location) item.location = { lat: Math.round(input.location.lat * 1e5) / 1e5, lng: Math.round(input.location.lng * 1e5) / 1e5 };
  return item;
}

/** The list entry for a queued report. */
export function sentEntry(f: PendingFeedback): SentFeedback {
  const flat = f.message.replace(/\s+/g, ' ').trim();
  return { id: f.id, kind: f.kind, summary: flat.length > 120 ? `${flat.slice(0, 119)}…` : flat, at: f.at };
}

/** Merge the server's statuses into the list (newest first, at most 50). */
export function mergeStatuses(list: SentFeedback[], rows: { id: string; status: string; fixed_in?: string | null }[]): SentFeedback[] {
  const by = new Map(rows.map((r) => [r.id, r]));
  return list
    .map((f) => {
      const r = by.get(f.id);
      return r ? { ...f, status: r.status as FeedbackStatus, fixedIn: r.fixed_in ?? null } : f;
    })
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 50);
}

/** A server id (the phone's UUID), not an old local one. */
export const isUuid = (id: string): boolean => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

/** The backend's message limit. */
export const FEEDBACK_MAX = 4000;

export function suggestionProblem(missing: string): string | null {
  return missing.trim() ? null : 'Say what’s missing first.';
}

/** Build the queued item. Throws with a readable reason when there's nothing to send. */
export function makeSuggestion(
  input: { missing: string; notes?: string; screen: FeedbackScreen; context?: string },
  id: string,
  now: Date,
): PendingFeedback {
  const problem = suggestionProblem(input.missing);
  if (problem) throw new Error(problem);
  const lines = [`${WHAT[input.screen]}: ${input.missing.trim()}`];
  if (input.notes?.trim()) lines.push(`Notes: ${input.notes.trim()}`);
  if (input.context?.trim()) lines.push(`${CONTEXT[input.screen]}: ${input.context.trim()}`);
  return { id, kind: 'idea', message: lines.join('\n').slice(0, FEEDBACK_MAX), screen: input.screen, at: now.toISOString() };
}

/**
 * Shop suggestions queued before shop ids were stable named the listing by its
 * position in a tile ("Kwik Fit · 52_-2:10"), which points at a different shop
 * after a data refresh. Mark those so the team doesn't trust the number; the
 * shop's name stays.
 */
export function markLegacyShopRefs(items: PendingFeedback[]): PendingFeedback[] {
  return items.map((f) =>
    f.screen === 'shop' && /(^|\s)-?\d+_-?\d+:\d+\b/.test(f.message)
      ? { ...f, message: f.message.replace(/((?:^|\s)-?\d+_-?\d+:\d+)\b/g, '$1 (old listing number from the 17 Nov 2026 data, not a stable id)') }
      : f,
  );
}
