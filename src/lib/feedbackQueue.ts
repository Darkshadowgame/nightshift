/**
 * Suggestions made in the pickers ("a car or mod is missing"), queued on the
 * phone until they're sent to the backend's feedback table
 * (kind, message, screen, app_version, update_id, device).
 */

export type FeedbackScreen = 'vehicle-picker' | 'mod-picker';

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
  const what = input.screen === 'vehicle-picker' ? 'Missing vehicle' : 'Missing mod';
  const lines = [`${what}: ${input.missing.trim()}`];
  if (input.notes?.trim()) lines.push(`Notes: ${input.notes.trim()}`);
  if (input.context?.trim()) lines.push(`Picker: ${input.context.trim()}`);
  return { id, kind: 'idea', message: lines.join('\n').slice(0, FEEDBACK_MAX), screen: input.screen, at: now.toISOString() };
}
