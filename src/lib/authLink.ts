import { isNetworkError, OFFLINE } from './backend/outbox';

/**
 * Sign-in links. Pure, so it's unit-tested (__tests__/authLink.test.ts).
 *
 * Until custom SMTP is set up, Supabase's built-in sender mails a sign-in LINK
 * (not the 6-digit code) to the project team only. That link goes to
 * https://<project>.supabase.co/auth/v1/verify?token=<hash>&type=magiclink&redirect_to=nightshift://
 * which signs you in and sends the phone to
 *   nightshift://#access_token=…&refresh_token=…&type=magiclink
 * (or `?code=…` with PKCE). The app also takes the verify link itself, pasted
 * in, and checks its token hash directly.
 */
export type AuthLink =
  | { kind: 'session'; accessToken: string; refreshToken: string }
  | { kind: 'code'; code: string }
  | { kind: 'tokenHash'; tokenHash: string; type: 'magiclink' | 'signup' | 'email' | 'invite' }
  | { kind: 'error'; message: string };

/** A query or fragment as a map. Hand-rolled: React Native's URLSearchParams can't be relied on to parse strings. */
function params(part: string): Map<string, string> {
  const out = new Map<string, string>();
  for (const pair of part.replace(/^[#?]/, '').split('&')) {
    if (!pair) continue;
    const at = pair.indexOf('=');
    const key = at >= 0 ? pair.slice(0, at) : pair;
    const value = at >= 0 ? pair.slice(at + 1) : '';
    try {
      out.set(decodeURIComponent(key), decodeURIComponent(value.replace(/\+/g, ' ')));
    } catch {
      out.set(key, value);
    }
  }
  return out;
}

export function parseAuthLink(url: string): AuthLink | null {
  const text = url.trim();
  if (!text) return null;
  const hashAt = text.indexOf('#');
  const queryAt = text.indexOf('?');
  const hash = hashAt >= 0 ? params(text.slice(hashAt)) : new Map<string, string>();
  const query = queryAt >= 0 && (hashAt < 0 || queryAt < hashAt) ? params(text.slice(queryAt, hashAt > queryAt ? hashAt : undefined)) : new Map<string, string>();
  const get = (k: string) => hash.get(k) ?? query.get(k) ?? null;

  const err = get('error_description') ?? get('error');
  if (err) {
    const code = get('error_code') ?? '';
    return { kind: 'error', message: /expired/i.test(`${err} ${code}`) ? 'That sign-in link has expired. Ask for a new one.' : err };
  }
  const access = get('access_token');
  const refresh = get('refresh_token');
  if (access && refresh) return { kind: 'session', accessToken: access, refreshToken: refresh };
  const code = query.get('code') ?? null;
  if (code && !/\/auth\/v1\/verify/.test(text)) return { kind: 'code', code };
  // The verify link from the email, pasted in: its `token` is the token hash.
  const hashToken = get('token_hash') ?? (/\/auth\/v1\/verify/.test(text) ? (query.get('token') ?? null) : null);
  if (hashToken) {
    const t = get('type');
    const type = t === 'signup' || t === 'email' || t === 'invite' ? t : 'magiclink';
    return { kind: 'tokenHash', tokenHash: hashToken, type };
  }
  return null;
}

/** Normalise and sanity-check an email address. */
export function emailProblem(raw: string): string | null {
  const email = raw.trim();
  if (!email) return 'Add your email address.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "That doesn't look like an email address.";
  return null;
}

/** Supabase's answers, in the app's words. */
export function authMessage(e: unknown): string {
  if (isNetworkError(e)) return OFFLINE;
  const msg = e instanceof Error ? e.message : typeof e === 'object' && e && 'message' in e ? String((e as { message: unknown }).message) : String(e);
  if (/expired|invalid.*(otp|token)|token.*(invalid|expired)|otp_expired/i.test(msg)) return 'That code is wrong or has expired. Ask for a new one.';
  if (/rate limit|too many|security purposes|after \d+ seconds/i.test(msg)) return 'Too many tries. Wait a minute, then ask for a new code.';
  if (/signups? not allowed/i.test(msg)) return 'New accounts are closed right now.';
  if (/error sending|smtp|email.*(address|recipient).*not authorized/i.test(msg))
    return "The sign-in email couldn't be sent to that address yet. Until Nightshift's own email is set up, only the project team can sign in. Try the demo for now.";
  return msg || 'Something went wrong. Try again.';
}

