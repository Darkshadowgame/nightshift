/**
 * The hosted Supabase project (eu-west-1, Ireland). Both values are PUBLIC by
 * design: the publishable key only gets the `anon` / `authenticated` roles,
 * and Row Level Security plus the RPCs decide everything (docs/BACKEND.md).
 * Supabase: publishable keys are "safe to expose online: web page, mobile or
 * desktop app, GitHub actions, CLIs, source code"
 * (https://supabase.com/docs/guides/api/api-keys). Never put a secret or
 * service role key here.
 *
 * They live in code rather than app.json `extra` on purpose: app.json is part
 * of the runtime fingerprint, so changing it would stop over-the-air updates
 * reaching the installed build. EXPO_PUBLIC_SUPABASE_URL /
 * EXPO_PUBLIC_SUPABASE_KEY override them (e.g. a local stack).
 */
export const SUPABASE_URL: string = process.env.EXPO_PUBLIC_SUPABASE_URL || "https://vuftzeianmqjboivqmws.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY: string = process.env.EXPO_PUBLIC_SUPABASE_KEY || "sb_publishable_kPgQ5RlGYnzWxDxp_c7Mtg_FIDMRjGN";

/** Where sign-in links send people back to (allowed in the project's redirect URLs). */
export const AUTH_REDIRECT = 'nightshift://';
