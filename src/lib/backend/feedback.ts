import type { SupabaseClient } from '@supabase/supabase-js';
import type { PendingFeedback } from '../feedbackQueue';
import { isNetworkError } from './outbox';

export interface AppInfo {
  app_version: string | null;
  update_id: string | null;
  device: string | null;
}

/**
 * Send the queued suggestions (vehicle and mod pickers, shop screens) to the
 * `feedback` table, oldest first. Insert only, without .select(): senders
 * can't read feedback back (docs/BACKEND.md section 3, "Feedback"). Works
 * signed in or not. Stops at the first network error or flood-guard refusal
 * (those are kept for next time); anything else the server refuses is dropped.
 * Resolves with the ids that are done with.
 */
export async function sendPendingFeedback(client: SupabaseClient, items: PendingFeedback[], info: AppInfo): Promise<{ done: string[]; offline: boolean }> {
  const done: string[] = [];
  for (const f of items) {
    let error: { message: string } | null = null;
    try {
      ({ error } = await client.from('feedback').insert({ kind: f.kind, message: f.message, screen: f.screen, ...info }));
    } catch (e) {
      if (isNetworkError(e)) return { done, offline: true };
      error = { message: e instanceof Error ? e.message : String(e) };
    }
    if (!error) {
      done.push(f.id);
      continue;
    }
    if (isNetworkError(error)) return { done, offline: true };
    if (/a lot of feedback|Lots of feedback/i.test(error.message)) break;
    done.push(f.id);
  }
  return { done, offline: false };
}
