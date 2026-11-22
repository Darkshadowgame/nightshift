import { Platform, Share } from 'react-native';
import { APP_SCHEME, eventLink, EVENT_LABELS } from './events';
import { aroundArea } from './glossary';
import type { NightEvent } from './types';

/**
 * Sharing, the one way (Review 11). Never a bare error with no next step:
 *
 * 1. iPhone: the share sheet (React Native's `Share`, no new native module).
 * 2. Web: `navigator.share` where the browser has it (phones), else the link goes on the
 *    clipboard (`navigator.clipboard`) and the screen shows "Link copied".
 * 3. If that fails too: `manual`, and the screen shows a sheet with the link to copy by hand
 *    (`useShareLink` in components/ShareLink.tsx does 2 and 3).
 *
 * Cancelling the share sheet is `dismissed`: nothing to say.
 */
export type ShareResult = 'shared' | 'copied' | 'dismissed' | 'manual';

export interface SharePayload {
  title: string;
  /** The message without the link ("Sunday coffee and cars · Meet · Sun 10:00 · Around Tamworth"). */
  text: string;
  url: string;
}

/** What the phone or browser can do. Injected in tests. */
export interface ShareEnv {
  os: string;
  nativeShare?: (p: { message: string; title: string; url?: string }) => Promise<{ action?: string } | void>;
  webShare?: (p: { title: string; text: string; url: string }) => Promise<void>;
  copy?: (text: string) => Promise<void>;
}

type WebNavigator = {
  share?: (p: { title: string; text: string; url: string }) => Promise<void>;
  clipboard?: { writeText?: (t: string) => Promise<void> };
};

function webNavigator(): WebNavigator | null {
  return typeof navigator === 'undefined' ? null : (navigator as unknown as WebNavigator);
}

export function shareEnv(): ShareEnv {
  if (Platform.OS !== 'web') {
    return { os: Platform.OS, nativeShare: (p) => Share.share(p) as Promise<{ action?: string }> };
  }
  const nav = webNavigator();
  return {
    os: 'web',
    webShare: nav?.share ? (p) => nav.share!(p) : undefined,
    copy: nav?.clipboard?.writeText ? (t) => nav.clipboard!.writeText!(t) : undefined,
  };
}

/** The message with the link, for anywhere that takes one string. */
export function shareMessage(p: SharePayload): string {
  return `${p.text} ${p.url}`;
}

/** A user cancelling the browser's share sheet, not a failure. */
function isAbort(e: unknown): boolean {
  return !!e && typeof e === 'object' && (e as { name?: string }).name === 'AbortError';
}

export async function shareLink(p: SharePayload, env: ShareEnv = shareEnv()): Promise<ShareResult> {
  if (env.nativeShare) {
    try {
      const r = await env.nativeShare({ message: shareMessage(p), title: p.title });
      return r && r.action === 'dismissedAction' ? 'dismissed' : 'shared';
    } catch {
      return 'manual';
    }
  }
  if (env.webShare) {
    try {
      await env.webShare({ title: p.title, text: p.text, url: p.url });
      return 'shared';
    } catch (e) {
      if (isAbort(e)) return 'dismissed';
      // Not allowed here (no user gesture, an iframe): fall through to the clipboard.
    }
  }
  if (env.copy) {
    try {
      await env.copy(p.url);
      return 'copied';
    } catch {
      return 'manual';
    }
  }
  return 'manual';
}

/** The page's own address on the web preview, else null. */
function webOrigin(): string | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  return window.location?.origin || null;
}

/**
 * An event's link: on the web preview its page on this site (opens in any browser); in the app
 * the `nightshift://` link (eventLink). `origin` is for tests.
 */
export function eventShareUrl(eventId: string, origin: string | null = webOrigin()): string {
  return origin ? `${origin.replace(/\/$/, '')}/event/${encodeURIComponent(eventId)}` : eventLink(eventId);
}

/** What sharing an event sends: its name, kind, time and area (never the meet point), and its link. */
export function eventSharePayload(event: Pick<NightEvent, 'id' | 'title' | 'type' | 'areaName'>, when: string, origin?: string | null): SharePayload {
  return {
    title: event.title,
    text: `${event.title} · ${EVENT_LABELS[event.type]} · ${when} · ${aroundArea(event.areaName)}`,
    url: origin === undefined ? eventShareUrl(event.id) : eventShareUrl(event.id, origin),
  };
}

/** A build's link: its page on the web preview, else the `nightshift://` link. `origin` is for tests. */
export function buildShareUrl(buildId: string, origin: string | null = webOrigin()): string {
  return origin ? `${origin.replace(/\/$/, '')}/build/${encodeURIComponent(buildId)}` : `${APP_SCHEME}://build/${buildId}`;
}

/** What sharing a build sends: the words you give it (spec card or timeline) and its link. Never a plate: builds have none. */
export function buildSharePayload(build: { id: string; make: string; model: string }, text: string, origin?: string | null): SharePayload {
  return { title: `${build.make} ${build.model}`, text, url: origin === undefined ? buildShareUrl(build.id) : buildShareUrl(build.id, origin) };
}
