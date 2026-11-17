// PHASE 2 SKETCH: needs the paid Apple developer account (APNs key uploaded to
// Expo/EAS) before any push reaches an iPhone. Until then the phone keeps its
// local reminders (src/lib/notify.ts) and notices fill the in-app list.
//
// Every few minutes (pg_cron + pg_net, see docs/BACKEND.md):
//  1. public.queue_due_reminders() adds "location unlocked" and "starts in 30
//     min" notices for people going and hosts (move_on() already queues
//     "moved on" notices the moment a host taps Move on).
//  2. Unpushed notices from the last hour are sent through the Expo push
//     service to each person's devices, then marked pushed.
//
// Notice text never names a stop (lock screens are public), so it is safe to
// put in a push. Optional secret: EXPO_ACCESS_TOKEN (if "enhanced push
// security" is turned on in Expo).
import { adminClient, json, requireCronSecret } from '../_shared/admin.ts';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const BATCH = 100; // Expo accepts up to 100 messages per request.

interface NoticeRow {
  id: string;
  user_id: string;
  title: string;
  body: string;
  url: string | null;
}

interface ExpoTicket {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: { error?: string };
}

Deno.serve(async (req) => {
  const denied = requireCronSecret(req);
  if (denied) return denied;
  const db = adminClient();

  const { data: queued, error: queueError } = await db.rpc('queue_due_reminders');
  if (queueError) return json({ error: queueError.message }, 500);

  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { data: notices, error } = await db
    .from('notices')
    .select('id, user_id, title, body, url')
    .is('pushed_at', null)
    .gte('created_at', since)
    .order('created_at')
    .limit(1000);
  if (error) return json({ error: error.message }, 500);
  const rows = (notices ?? []) as NoticeRow[];
  if (rows.length === 0) return json({ queued, sent: 0 });

  const userIds = [...new Set(rows.map((n) => n.user_id))];
  const { data: tokens, error: tokenError } = await db.from('push_tokens').select('token, user_id').in('user_id', userIds);
  if (tokenError) return json({ error: tokenError.message }, 500);
  const byUser = new Map<string, string[]>();
  for (const t of tokens ?? []) byUser.set(t.user_id, [...(byUser.get(t.user_id) ?? []), t.token]);

  const messages = rows.flatMap((n) =>
    (byUser.get(n.user_id) ?? []).map((to) => ({
      to,
      title: n.title,
      body: n.body,
      sound: 'default',
      data: { url: n.url, noticeId: n.id },
    })),
  );

  const headers: Record<string, string> = { 'Content-Type': 'application/json', Accept: 'application/json' };
  const expoToken = Deno.env.get('EXPO_ACCESS_TOKEN');
  if (expoToken) headers.Authorization = `Bearer ${expoToken}`;

  const deadTokens: string[] = [];
  for (let i = 0; i < messages.length; i += BATCH) {
    const chunk = messages.slice(i, i + BATCH);
    const res = await fetch(EXPO_PUSH_URL, { method: 'POST', headers, body: JSON.stringify(chunk) });
    if (!res.ok) return json({ error: `Expo push failed: ${res.status}` }, 502);
    const { data } = (await res.json()) as { data: ExpoTicket[] };
    data.forEach((ticket, j) => {
      if (ticket.status === 'error' && ticket.details?.error === 'DeviceNotRegistered') deadTokens.push(chunk[j].to);
    });
    // TODO (Phase 2): keep ticket ids and check push receipts ~15 min later.
  }

  if (deadTokens.length) await db.from('push_tokens').delete().in('token', deadTokens);
  // People with no device still get the notice in the app list; mark all as handled.
  await db.from('notices').update({ pushed_at: new Date().toISOString() }).in('id', rows.map((n) => n.id));

  return json({ queued, sent: messages.length, notices: rows.length, removedTokens: deadTokens.length });
});
