// Shared helpers for Nightshift Edge Functions (Deno).
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected by the Edge Runtime;
// never hard-code them and never ship the service role key in the app.
import { createClient, type SupabaseClient } from 'jsr:@supabase/supabase-js@2';

export function adminClient(): SupabaseClient {
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

/**
 * These functions are only for the scheduler (pg_cron + pg_net). It sends a
 * shared secret in the x-cron-secret header (CRON_SECRET, set with
 * `npx supabase secrets set` and stored in Vault for the cron job). This works
 * the same with legacy JWT keys and the new sb_secret_ keys, so the gateway's
 * JWT check is off for these functions (verify_jwt = false in config.toml).
 */
export function requireCronSecret(req: Request): Response | null {
  const expected = Deno.env.get('CRON_SECRET');
  const given = req.headers.get('x-cron-secret');
  if (expected && given && timingSafeEqual(given, expected)) return null;
  return new Response(JSON.stringify({ error: 'forbidden' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}
