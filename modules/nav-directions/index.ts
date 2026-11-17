import { requireOptionalNativeModule } from 'expo';

/** A point to route through. Only these coordinates are sent to Apple. */
export interface RoutePoint {
  lat: number;
  lng: number;
}

/** One manoeuvre from Apple's directions. */
export interface RawStep {
  /** e.g. "Turn right onto High Street". Empty for the start of a leg. */
  text: string;
  /** Extra notice from Apple (e.g. a toll), often empty. */
  notice: string;
  /** Metres from this manoeuvre to the next one. */
  distance: number;
  /** Where the manoeuvre is. */
  lat: number;
  lng: number;
  /** Index into the route's points where the manoeuvre is. */
  index: number;
  /** Which leg (0 = first point to the second). */
  leg: number;
}

export interface RawLeg {
  /** Index into the route's points where this leg ends. */
  endIndex: number;
  /** Metres. */
  distance: number;
  /** Seconds, Apple's estimate. */
  time: number;
}

export interface RawRoute {
  /** Flat [lat, lng, lat, lng, …] for the whole route, every leg joined. */
  coords: number[];
  distance: number;
  time: number;
  steps: RawStep[];
  legs: RawLeg[];
}

export interface RouteOptions {
  /** Legs asked for at once (1–4, default 2). Apple throttles bursts. */
  concurrency?: number;
  /** Tries per leg when Apple is busy or the network blips (default 5, with backoff). */
  maxAttempts?: number;
  /** Called as legs come back: done of total. */
  onProgress?: (done: number, total: number) => void;
}

export interface SpeakOptions {
  /** Voice language (default en-GB). */
  language?: string;
  /** AVSpeechUtterance rate, 0–1 (default 0.5, the normal rate). */
  rate?: number;
  /** True: stay quiet with the ring/silent switch on silent. False (default): speak anyway, ducking music. */
  respectSilentSwitch?: boolean;
}

interface Subscription {
  remove(): void;
}

interface Native {
  route(points: RoutePoint[], concurrency: number, maxAttempts: number): Promise<RawRoute>;
  speak(text: string, language: string, rate: number, respectSilentSwitch: boolean): Promise<boolean>;
  stopSpeaking(): Promise<boolean>;
  chime(): boolean;
  addListener?(event: 'onRouteProgress', fn: (e: { done: number; total: number }) => void): Subscription;
}

/** Null on web, in Expo Go, or in any build without the native module. */
const native = requireOptionalNativeModule<Native>('NavDirections');

export const navDirectionsAvailable = native != null;

/** Driving directions through the points in order. Null when the module isn't in this build. */
export async function route(points: RoutePoint[], options: RouteOptions = {}): Promise<RawRoute | null> {
  if (!native) return null;
  const clean = points.map((p) => ({ lat: p.lat, lng: p.lng }));
  let sub: Subscription | undefined;
  if (options.onProgress && typeof native.addListener === 'function') {
    const fn = options.onProgress;
    try {
      sub = native.addListener('onRouteProgress', (e) => fn(e.done, e.total));
    } catch {
      sub = undefined;
    }
  }
  try {
    return await native.route(clean, options.concurrency ?? 2, options.maxAttempts ?? 5);
  } finally {
    sub?.remove();
  }
}

/** Speak one instruction, replacing anything still being spoken. False when there's no voice in this build. */
export async function speak(text: string, options: SpeakOptions = {}): Promise<boolean> {
  if (!native) return false;
  try {
    return await native.speak(text, options.language ?? 'en-GB', options.rate ?? 0.5, options.respectSilentSwitch ?? false);
  } catch {
    return false;
  }
}

export async function stopSpeaking(): Promise<void> {
  if (!native) return;
  await native.stopSpeaking().catch(() => false);
}

/** A short, gentle system sound. Follows the ring/silent switch. */
export function chime(): void {
  try {
    native?.chime();
  } catch {
    // A missing sound should never break the driving view.
  }
}
