import type { SupabaseClient } from '@supabase/supabase-js';
import { isUuid, type PendingFeedback } from '../feedbackQueue';
import { isNetworkError } from './outbox';

export interface AppInfo {
  app_version: string | null;
  update_id: string | null;
  device: string | null;
}

export interface SendOptions {
  /** Signed in: the sender's id, so screenshots go in their own folder of the feedback bucket. */
  uid?: string | null;
  /** Read a stored photo's bytes (photos.ts photoUri + fetch). */
  readPhoto?: (ref: string) => Promise<ArrayBuffer>;
  /** After a report with photos is sent: the phone's copies can go. */
  dropPhotos?: (refs: string[]) => void;
}

/** Where a report's screenshot goes: {uid}/{feedback id}/{n}.jpg in the private `feedback` bucket. */
export const feedbackPhotoPath = (uid: string, id: string, n: number) => `${uid}/${id}/${n + 1}.jpg`;

/**
 * Send the queued feedback to the `feedback` table, oldest first. Insert only,
 * without .select() (signed out can't read it back). The phone's UUID goes as
 * the id, so a report that reached the server before the connection dropped is
 * "already there" (23505) on the retry, not a duplicate. Screenshots are
 * uploaded first, signed in only (signed out, a report goes without them).
 * Stops at the first network error or flood-guard refusal (those are kept for
 * next time); anything else the server refuses is dropped. Resolves with the
 * ids that are done with.
 */
export async function sendPendingFeedback(
  client: SupabaseClient,
  items: PendingFeedback[],
  info: AppInfo,
  opts: SendOptions = {},
): Promise<{ done: string[]; offline: boolean }> {
  const done: string[] = [];
  for (const f of items) {
    let error: { message: string; code?: string } | null = null;
    const photos = opts.uid && opts.readPhoto && isUuid(f.id) ? (f.photos ?? []) : [];
    try {
      const paths: string[] = [];
      for (const [n, ref] of photos.entries()) {
        const path = feedbackPhotoPath(opts.uid!, f.id, n);
        const body = await opts.readPhoto!(ref);
        const up = await client.storage.from('feedback').upload(path, body, { contentType: 'image/jpeg', upsert: false });
        // Already there from an earlier try that didn't finish: fine.
        if (up.error && !/exists|duplicate/i.test(up.error.message)) {
          if (isNetworkError(up.error)) return { done, offline: true };
          continue;
        }
        paths.push(path);
      }
      const row: Record<string, unknown> = { kind: f.kind, message: f.message, screen: f.screen, ...info };
      if (isUuid(f.id)) row.id = f.id;
      if (paths.length) row.photo_paths = paths;
      if (f.context) row.context = f.context;
      if (f.location) {
        row.lat = f.location.lat;
        row.lng = f.location.lng;
      }
      ({ error } = await client.from('feedback').insert(row));
    } catch (e) {
      if (isNetworkError(e)) return { done, offline: true };
      error = { message: e instanceof Error ? e.message : String(e) };
    }
    if (!error || error.code === '23505' || /duplicate key/i.test(error.message)) {
      done.push(f.id);
      if (photos.length) opts.dropPhotos?.(photos);
      continue;
    }
    if (isNetworkError(error)) return { done, offline: true };
    if (/a lot of feedback|Lots of feedback/i.test(error.message)) break;
    done.push(f.id);
  }
  return { done, offline: false };
}

export interface FeedbackStatusRow {
  id: string;
  kind?: string;
  status: string;
  fixed_in: string | null;
  created_at?: string;
  message?: string;
}

/**
 * The server's status for this phone's reports (feedback_status(), by id, works
 * signed out), plus, signed in, the person's own reports from other phones.
 */
export async function fetchFeedbackStatus(client: SupabaseClient, ids: string[], signedIn: boolean): Promise<FeedbackStatusRow[]> {
  const out = new Map<string, FeedbackStatusRow>();
  const known = ids.filter(isUuid).slice(0, 100);
  if (known.length) {
    const { data, error } = await client.rpc('feedback_status', { p_ids: known });
    if (error) throw new Error(error.message);
    for (const r of (data ?? []) as FeedbackStatusRow[]) out.set(r.id, r);
  }
  if (signedIn) {
    const { data, error } = await client
      .from('feedback')
      .select('id,created_at,kind,message,status,fixed_in')
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    for (const r of (data ?? []) as FeedbackStatusRow[]) out.set(r.id, { ...out.get(r.id), ...r });
  }
  return [...out.values()];
}
