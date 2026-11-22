import { useEffect, useMemo } from 'react';
import { Platform } from 'react-native';
import { nativeLiveActivity, type NavActivityState } from '../../modules/nav-live-activity';
import { realNowMs } from './appClock';
import { formatDistance, type Manoeuvre } from './nav';

/**
 * Turn-by-turn directions on the lock screen and in the Dynamic Island (an iOS Live Activity).
 * Started when navigation starts, updated as the next manoeuvre changes, ended on arrival or when you stop.
 * Local only (no push notifications, no App Group). Where there is nothing to show it on (web, Android,
 * the demo, a build without the native side, Live Activities off in iOS Settings) every call does nothing.
 * The look is the widget extension in targets/nav-activity; the words are made here.
 */

/** True on an iPhone build that has the native side. The Settings switch only shows then. */
export const liveActivityAvailable = Platform.OS === 'ios' && nativeLiveActivity != null;

/** The lock screen keeps the arrival for this long (seconds), then goes. */
export const ARRIVED_LINGER_S = 30;
/** Updates are no closer than this (ms). */
export const MIN_UPDATE_GAP_MS = 1000;

export interface LiveActivityInput {
  phase: 'locating' | 'routing' | 'preview' | 'driving' | 'arrived' | 'error';
  /** The driving view's top banner: next manoeuvre, metres to it, the road or instruction. */
  banner: { kind: Manoeuvre; distance: number; title: string } | null;
  /** The bottom bar: arrival time and distance left, already worded. */
  trip: { eta: string; distance: string } | null;
  /** The destination's name as the driving view shows it. */
  destination: string;
}

/**
 * What the activity says for this moment of the drive. Null means there is no activity: not driving or
 * arrived yet. Only the manoeuvre, the road, the distances, the arrival time and the destination's name:
 * nothing else about you.
 */
export function liveActivityContent(i: LiveActivityInput): NavActivityState | null {
  if (i.phase === 'arrived') {
    return { arrow: 'arrive', distance: '', road: "You've arrived", remaining: '', eta: '', destination: i.destination };
  }
  if (i.phase !== 'driving') return null;
  const tail = { remaining: i.trip?.distance ?? '', eta: i.trip?.eta ?? '', destination: i.destination };
  if (i.banner) {
    return { arrow: i.banner.kind, distance: i.banner.kind === 'arrive' ? '' : formatDistance(i.banner.distance), road: i.banner.title, ...tail };
  }
  if (i.trip) return { arrow: 'straight', distance: '', road: 'Follow the route', ...tail };
  return null;
}

/** Two contents say the same thing: no update needed. */
export function sameContent(a: NavActivityState | null, b: NavActivityState | null): boolean {
  if (!a || !b) return a === b;
  return a.arrow === b.arrow && a.distance === b.distance && a.road === b.road && a.remaining === b.remaining && a.eta === b.eta && a.destination === b.destination;
}

// ---------------------------------------------------------------------------
// One activity at a time. Every native call goes through one queue, so a start is never overtaken.
// ---------------------------------------------------------------------------

let queue: Promise<unknown> = Promise.resolve();
let running = false;
/** Start was refused (Live Activities off in iOS Settings): don't ask again until navigation ends. */
let refused = false;
let shown: NavActivityState | null = null;
let lastSentAt = 0;
let timer: ReturnType<typeof setTimeout> | null = null;
let latest: NavActivityState | null = null;

function enqueue(job: () => Promise<unknown>): void {
  queue = queue.then(job).catch(() => undefined);
}

function clearTimer(): void {
  if (timer) clearTimeout(timer);
  timer = null;
}

function send(content: NavActivityState, now: number): void {
  const native = nativeLiveActivity;
  if (!native) return;
  lastSentAt = now;
  shown = content;
  if (!running) {
    running = true;
    enqueue(async () => {
      const ok = await native.start(content);
      if (!ok) {
        running = false;
        refused = true;
        shown = null;
      }
    });
  } else {
    enqueue(() => native.update(content));
  }
}

/** Shows `content` (null ends the activity; `final` shows it for a moment, then ends: the arrival). Called on every change; sends only real changes, at most once a second. */
export function pushNavActivity(content: NavActivityState | null, final = false, now: number = realNowMs()): void {
  const native = nativeLiveActivity;
  if (!native || Platform.OS !== 'ios') return;
  latest = content;
  if (!content) {
    clearTimer();
    refused = false;
    if (running) {
      running = false;
      shown = null;
      enqueue(() => native.end(null, 0));
    }
    return;
  }
  if (final) {
    // Arrival: show it for a moment, then let it go.
    clearTimer();
    if (running) {
      running = false;
      shown = null;
      enqueue(() => native.end(content, ARRIVED_LINGER_S));
    }
    return;
  }
  if (refused || sameContent(shown, content)) return;
  const wait = lastSentAt + MIN_UPDATE_GAP_MS - now;
  if (running && wait > 0) {
    // Too soon: send the latest one when the second is up.
    if (!timer) {
      timer = setTimeout(() => {
        timer = null;
        if (latest && !sameContent(shown, latest)) send(latest, realNowMs());
      }, wait);
    }
    return;
  }
  clearTimer();
  send(content, now);
}

/** Ends the activity at once (leaving the driving view). */
export function endNavActivity(): void {
  pushNavActivity(null);
}

/**
 * The driving view's one hook: keeps the lock screen activity in step with the drive.
 * `enabled` is the Settings switch, false in the demo.
 */
export function useNavLiveActivity(enabled: boolean, input: LiveActivityInput): void {
  const { phase, banner, trip, destination } = input;
  const content = useMemo(
    () => (enabled ? liveActivityContent({ phase, banner, trip, destination }) : null),
    // The words, not the objects they came from, decide when to update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [enabled, phase, banner?.kind, banner?.distance, banner?.title, trip?.eta, trip?.distance, destination],
  );
  const key = content ? `${content.arrow}|${content.distance}|${content.road}|${content.remaining}|${content.eta}|${content.destination}` : '';
  useEffect(() => {
    pushNavActivity(content, phase === 'arrived');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  useEffect(() => endNavActivity, []);
}
