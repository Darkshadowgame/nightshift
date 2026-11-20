// Emails the team when someone sends feedback (docs/FEEDBACK.md, docs/BACKEND.md
// section 7e).
//
// Called by the AFTER INSERT trigger on public.feedback through pg_net with
// {"id": "<feedback id>"}. The gateway's JWT check is off (the database calls
// it with no key), so the call itself proves nothing: the function reads the
// row with the service role and claims it (notified_at, only if unset and the
// report is under a day old). A forged call can at most send a real report's
// email once, a few seconds early.
//
// Secrets (Management API or `npx supabase secrets set`, never committed):
//   FEEDBACK_NOTIFY_EMAIL  who gets it (comma-separated for more than one)
//   BREVO_SENDER_EMAIL     the sender verified in Brevo
//   BREVO_SMTP_HOST, BREVO_SMTP_PORT, BREVO_SMTP_USER, BREVO_SMTP_KEY
// Without them it logs "not configured" and does nothing (the report is kept
// and stays unclaimed).
import { adminClient, json } from '../_shared/admin.ts';
import { feedbackEmail, type FeedbackRow, isTestReport, screenshotPaths } from './message.ts';
import { sendMail, tlsPort } from './smtp.ts';

const LINK_SECONDS = 7 * 24 * 3600;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const COLUMNS = 'id,created_at,user_id,kind,message,screen,app_version,update_id,device,photo_path,photo_paths,context,lat,lng';

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);
  let id: unknown;
  try {
    ({ id } = await req.json());
  } catch {
    return json({ error: 'bad body' }, 400);
  }
  if (typeof id !== 'string' || !UUID.test(id)) return json({ error: 'bad id' }, 400);

  const env = (k: string) => Deno.env.get(k)?.trim() || '';
  const needed = ['FEEDBACK_NOTIFY_EMAIL', 'BREVO_SENDER_EMAIL', 'BREVO_SMTP_HOST', 'BREVO_SMTP_USER', 'BREVO_SMTP_KEY'];
  const missing = needed.filter((k) => !env(k));
  if (missing.length) {
    console.log(`feedback-notify: not configured (missing ${missing.join(', ')}); feedback ${id} kept, no email`);
    return json({ skipped: 'not configured' });
  }

  const db = adminClient();
  const since = new Date(Date.now() - 24 * 3600_000).toISOString();
  const { data, error } = await db
    .from('feedback')
    .update({ notified_at: new Date().toISOString() })
    .eq('id', id)
    .is('notified_at', null)
    .gt('created_at', since)
    .select(COLUMNS);
  if (error) {
    console.error(`feedback-notify: claim failed: ${error.message}`);
    return json({ error: 'claim failed' }, 500);
  }
  const row = (data?.[0] ?? null) as FeedbackRow | null;
  if (!row) return json({ skipped: 'unknown, old or already sent' });
  if (isTestReport(row)) {
    console.log(`feedback-notify: ${id} is a test report, no email`);
    return json({ skipped: 'test report' });
  }

  const paths = screenshotPaths(row);
  let links: string[] = [];
  if (paths.length) {
    const { data: signed } = await db.storage.from('feedback').createSignedUrls(paths, LINK_SECONDS);
    links = (signed ?? []).map((s) => s.signedUrl).filter((u): u is string => !!u);
  }

  const { subject, text } = feedbackEmail(row, links);
  try {
    await sendMail(
      { host: env('BREVO_SMTP_HOST'), port: tlsPort(env('BREVO_SMTP_PORT')), user: env('BREVO_SMTP_USER'), pass: env('BREVO_SMTP_KEY') },
      {
        from: env('BREVO_SENDER_EMAIL'),
        fromName: 'Slipstream feedback',
        to: env('FEEDBACK_NOTIFY_EMAIL').split(',').map((s) => s.trim()).filter(Boolean),
        subject,
        text,
      },
    );
  } catch (e) {
    // Unclaim so a later call (or the inbox script) can try again.
    await db.from('feedback').update({ notified_at: null }).eq('id', id);
    console.error(`feedback-notify: email for ${id} failed: ${e instanceof Error ? e.message : String(e)}`);
    return json({ error: 'email failed' }, 502);
  }
  console.log(`feedback-notify: emailed ${id}`);
  return json({ sent: true });
});
