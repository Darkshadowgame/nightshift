/**
 * Suggestions made in the pickers ("a car or mod is missing") and on shop
 * screens ("this listing is wrong", "a shop is missing"), queued on the phone
 * until they're sent to the backend's feedback table
 * (kind, message, screen, app_version, update_id, device).
 */

export type FeedbackScreen = 'vehicle-picker' | 'mod-picker' | 'shop';

const WHAT: Record<FeedbackScreen, string> = { 'vehicle-picker': 'Missing vehicle', 'mod-picker': 'Missing mod', shop: 'Shop edit or missing shop' };
const CONTEXT: Record<FeedbackScreen, string> = { 'vehicle-picker': 'Picker', 'mod-picker': 'Picker', shop: 'Listing' };

export interface PendingFeedback {
  id: string;
  kind: 'idea';
  message: string;
  screen: FeedbackScreen;
  /** ISO time it was written. */
  at: string;
}

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
