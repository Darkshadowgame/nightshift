import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { supabase } from './backend/client';
import { AUTH_REDIRECT } from './backend/config';
import { LEGACY_KEY, sliceKey } from './persist';
import { authMessage, emailProblem, isReviewEmail, parseAuthLink, type AuthLink } from './authLink';

export { authMessage, emailProblem, isReviewEmail };

/**
 * Who's using the app:
 * - `signedOut`: first run (or after signing out). The sign-in screen, with
 *   "Try the demo without an account".
 * - `demo`: the sample scene on the phone (src/lib/localRepository.ts). Phones
 *   that used the app before accounts existed stay here, with their data.
 * - `signedIn`: a Supabase session (email one-time code or sign-in link),
 *   kept in AsyncStorage and refreshed by supabase-js.
 *
 * A signed-in person can also try the demo (Settings › Demo › Try the demo): the status is
 * `demo` and the store runs on the phone only, but the session stays on the phone untouched
 * (`accountWaiting`), so "Back to my account" needs no sign-in.
 */
export type AuthStatus = 'loading' | 'signedOut' | 'demo' | 'signedIn';

/** What the person picked last time: the demo, or an account. */
const MODE_KEY = 'nightshift.mode';
/** Set while a signed-in person is trying the demo: their session is still on the phone. */
const ACCOUNT_WAITING_KEY = 'nightshift.mode.accountWaiting';
/** Read once by the demo store as it loads: start the demo with Busy night on (store.tsx). */
export const DEMO_BUSY_ON_START_KEY = 'nightshift.demo.busyOnStart';

interface Auth {
  status: AuthStatus;
  userId: string | null;
  email: string | null;
  /** Email a sign-in code (and link). Rejects with a readable reason. */
  sendCode(email: string): Promise<void>;
  /** The 6-digit code from the email. */
  verifyCode(email: string, code: string): Promise<void>;
  /** App Review's account only (isReviewEmail): an email and password the owner set up. */
  signInWithPassword(email: string, password: string): Promise<void>;
  /** A sign-in link (opened from the email, or pasted). Resolves false if it isn't one. */
  openLink(url: string): Promise<boolean>;
  startDemo(): Promise<void>;
  /** Back to the sign-in screen. The demo's data stays on the phone. */
  leaveDemo(): Promise<void>;
  /** In the demo with a signed-in account behind it (tryDemo): "Back to my account" applies. */
  accountWaiting: boolean;
  /**
   * Signed in: switch to the demo without signing out. The session stays on the phone, the
   * account's data and cache are untouched, and the demo keeps its own data on the phone.
   * `busy`: start the demo with Busy night on.
   */
  tryDemo(opts?: { busy?: boolean }): Promise<void>;
  /** From tryDemo: back to the signed-in account. Signed out instead if the session has gone. */
  backToAccount(): Promise<void>;
  signOut(): Promise<void>;
}

const Ctx = createContext<Auth | null>(null);

async function hasDemoSave(): Promise<boolean> {
  try {
    const [meta, legacy] = await Promise.all([AsyncStorage.getItem(sliceKey('meta')), AsyncStorage.getItem(LEGACY_KEY)]);
    return !!(meta || legacy);
  } catch {
    return false;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [session, setSession] = useState<Session | null>(null);
  const [accountWaiting, setAccountWaiting] = useState(false);
  const mode = useRef<string | null>(null);

  const applyLink = useCallback(async (link: AuthLink): Promise<void> => {
    const auth = supabase().auth;
    if (link.kind === 'error') throw new Error(link.message);
    if (link.kind === 'session') {
      const { error } = await auth.setSession({ access_token: link.accessToken, refresh_token: link.refreshToken });
      if (error) throw error;
    } else if (link.kind === 'code') {
      const { error } = await auth.exchangeCodeForSession(link.code);
      if (error) throw error;
    } else {
      const { error } = await auth.verifyOtp({ token_hash: link.tokenHash, type: link.type });
      if (error) throw error;
    }
  }, []);

  const signedIn = useCallback(async (s: Session) => {
    mode.current = 'account';
    await AsyncStorage.setItem(MODE_KEY, 'account').catch(() => {});
    setSession(s);
    setStatus('signedIn');
  }, []);

  useEffect(() => {
    let live = true;
    (async () => {
      const saved = await AsyncStorage.getItem(MODE_KEY).catch(() => null);
      mode.current = saved;
      // A session on the phone wins (it refreshes itself), unless they chose the demo.
      if (saved !== 'demo') {
        const hasSession = !!(await AsyncStorage.getItem('nightshift.auth').catch(() => null));
        if (hasSession) {
          const { data } = await supabase().auth.getSession();
          if (data.session && live) return signedIn(data.session);
        }
      }
      if (!live) return;
      if (saved === 'demo') {
        const [waiting, hasSession] = await Promise.all([
          AsyncStorage.getItem(ACCOUNT_WAITING_KEY).catch(() => null),
          AsyncStorage.getItem('nightshift.auth').catch(() => null),
        ]);
        if (!live) return;
        setAccountWaiting(!!waiting && !!hasSession);
        return setStatus('demo');
      }
      // Phones that used Slipstream before accounts existed keep their demo.
      if (!saved && (await hasDemoSave())) {
        await AsyncStorage.setItem(MODE_KEY, 'demo').catch(() => {});
        mode.current = 'demo';
        return live ? setStatus('demo') : undefined;
      }
      if (live) setStatus('signedOut');
    })();
    return () => {
      live = false;
    };
  }, [signedIn]);

  // Sign-in links: nightshift://#access_token=… (or ?code= / ?token_hash=), when the app opens or while it's open.
  useEffect(() => {
    const handle = (url: string | null) => {
      const link = url ? parseAuthLink(url) : null;
      if (!link) return;
      applyLink(link).catch(() => {});
    };
    Linking.getInitialURL().then(handle).catch(() => {});
    const sub = Linking.addEventListener('url', ({ url }) => handle(url));
    return () => sub.remove();
  }, [applyLink]);

  // Session changes (sign-in from a link, refresh, sign-out elsewhere). Only once the client exists.
  useEffect(() => {
    if (status === 'loading' || status === 'demo') return;
    const { data } = supabase().auth.onAuthStateChange((event, s) => {
      if (s && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION' || event === 'USER_UPDATED')) {
        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') void signedIn(s);
        else setSession(s);
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setStatus('signedOut');
      }
    });
    return () => data.subscription.unsubscribe();
  }, [status, signedIn]);

  const value = useMemo<Auth>(
    () => ({
      status,
      userId: session?.user.id ?? null,
      email: session?.user.email ?? null,
      async sendCode(raw) {
        const problem = emailProblem(raw);
        if (problem) throw new Error(problem);
        try {
          const { error } = await supabase().auth.signInWithOtp({
            email: raw.trim().toLowerCase(),
            options: { shouldCreateUser: true, emailRedirectTo: AUTH_REDIRECT },
          });
          if (error) throw error;
        } catch (e) {
          throw new Error(authMessage(e));
        }
      },
      async verifyCode(raw, code) {
        const token = code.replace(/\D/g, '');
        if (token.length !== 6) throw new Error('Enter the 6-digit code from the email.');
        try {
          const { data, error } = await supabase().auth.verifyOtp({ email: raw.trim().toLowerCase(), token, type: 'email' });
          if (error) throw error;
          if (data.session) await signedIn(data.session);
        } catch (e) {
          throw new Error(authMessage(e));
        }
      },
      async signInWithPassword(raw, password) {
        const problem = emailProblem(raw);
        if (problem) throw new Error(problem);
        if (!password) throw new Error('Add the password.');
        try {
          const { data, error } = await supabase().auth.signInWithPassword({ email: raw.trim().toLowerCase(), password });
          if (error) throw error;
          if (data.session) await signedIn(data.session);
        } catch (e) {
          throw new Error(authMessage(e));
        }
      },
      async openLink(url) {
        const link = parseAuthLink(url);
        if (!link) return false;
        try {
          await applyLink(link);
          const { data } = await supabase().auth.getSession();
          if (data.session) await signedIn(data.session);
        } catch (e) {
          throw new Error(authMessage(e));
        }
        return true;
      },
      async startDemo() {
        mode.current = 'demo';
        await AsyncStorage.setItem(MODE_KEY, 'demo').catch(() => {});
        setStatus('demo');
      },
      async leaveDemo() {
        mode.current = null;
        await AsyncStorage.multiRemove([MODE_KEY, ACCOUNT_WAITING_KEY]).catch(() => {});
        setAccountWaiting(false);
        setStatus('signedOut');
      },
      accountWaiting: status === 'demo' && accountWaiting,
      async tryDemo(opts) {
        if (status !== 'signedIn') return;
        mode.current = 'demo';
        // Only the mode changes: the session, its cache and its outbox stay as they are.
        await AsyncStorage.multiSet([
          [MODE_KEY, 'demo'],
          [ACCOUNT_WAITING_KEY, '1'],
          ...(opts?.busy ? ([[DEMO_BUSY_ON_START_KEY, '1']] as [string, string][]) : []),
        ]).catch(() => {});
        setAccountWaiting(true);
        setStatus('demo');
      },
      async backToAccount() {
        let s: Session | null = null;
        try {
          s = (await supabase().auth.getSession()).data.session;
        } catch {
          s = null;
        }
        await AsyncStorage.removeItem(ACCOUNT_WAITING_KEY).catch(() => {});
        setAccountWaiting(false);
        if (s) return signedIn(s);
        // The session ran out while in the demo: sign in again.
        mode.current = null;
        await AsyncStorage.removeItem(MODE_KEY).catch(() => {});
        setSession(null);
        setStatus('signedOut');
      },
      async signOut() {
        const uid = session?.user.id;
        try {
          await supabase().auth.signOut({ scope: 'local' });
        } catch {
          // Signed out on the phone either way.
        }
        if (uid) await clearAccountCache(uid);
        mode.current = null;
        await AsyncStorage.multiRemove([MODE_KEY, ACCOUNT_WAITING_KEY, 'nightshift.auth']).catch(() => {});
        setAccountWaiting(false);
        setSession(null);
        setStatus('signedOut');
      },
    }),
    [status, session, accountWaiting, applyLink, signedIn],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** Where a signed-in person's cached server data and queued writes live on the phone. */
export function accountKey(uid: string, part: 'state' | 'outbox'): string {
  return `nightshift.sb.${uid}.${part}`;
}

/** The cache never outlives the session (docs/BACKEND.md, offline cache plan). */
export async function clearAccountCache(uid: string): Promise<void> {
  await AsyncStorage.multiRemove([accountKey(uid, 'state'), accountKey(uid, 'outbox')]).catch(() => {});
}

export function useAuth(): Auth {
  const a = useContext(Ctx);
  if (!a) throw new Error('useAuth outside AuthProvider');
  return a;
}
