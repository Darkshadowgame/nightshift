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

/** One of Apple's routes when alternatives were asked for (build 15 on). */
export interface RawRouteOption extends RawRoute {
  /** Apple's name for it, usually the main road ("A5"). */
  name: string;
  /** Apple's notices for the route (tolls, restrictions). */
  advisoryNotices: string[];
  hasTolls: boolean;
  hasHighways: boolean;
}

/** A route with its alternatives: the old shape (the first route) plus `routes`, all of them. */
export interface RawRouteWithOptions extends RawRoute {
  routes: RawRouteOption[];
}

export interface RouteOptions {
  /** Legs asked for at once (1–4, default 2). Apple throttles bursts. */
  concurrency?: number;
  /** Tries per leg when Apple is busy or the network blips (default 5, with backoff). */
  maxAttempts?: number;
  /** Called as legs come back: done of total. */
  onProgress?: (done: number, total: number) => void;
  /**
   * Ask Apple for up to three routes (two points only, build 15 on: check supportsAlternatives()).
   * The answer then has `routes`. Ignored on older builds and for more than two points.
   */
  alternatives?: boolean;
}

export interface SpeakOptions {
  /** Voice language (default en-GB). */
  language?: string;
  /** AVSpeechUtterance rate, 0–1 (default 0.5, the normal rate). */
  rate?: number;
  /** True: stay quiet with the ring/silent switch on silent. False (default): speak anyway, ducking music. */
  respectSilentSwitch?: boolean;
  /** An installed voice's identifier (from voices()). Unset or gone: the best installed en-GB voice. Ignored by older builds. */
  voice?: string | null;
}

export type VoiceQuality = 'default' | 'enhanced' | 'premium';

/** An installed English voice. */
export interface Voice {
  identifier: string;
  /** e.g. "Daniel". */
  name: string;
  /** BCP 47, e.g. "en-GB". */
  language: string;
  quality: VoiceQuality;
  /** Build 15 on. */
  gender?: 'male' | 'female' | 'unspecified';
}

/** A "Where to?" suggestion from Apple's autocomplete. Resolve it to get its position. */
export interface PlaceSuggestion {
  id: string;
  /** e.g. "Tesco Extra" or "12 High Street". */
  title: string;
  /** e.g. "Ventura Park Road, Tamworth, England". */
  subtitle: string;
}

/** A resolved suggestion: its position and address parts (any may be empty). */
export interface ResolvedPlace {
  lat: number;
  lng: number;
  name: string;
  street: string;
  streetNumber: string;
  district: string;
  city: string;
  subregion: string;
  region: string;
  postalCode: string;
  isoCountryCode: string;
  country: string;
}

interface Subscription {
  remove(): void;
}

interface Native {
  route(points: RoutePoint[], concurrency: number, maxAttempts: number): Promise<RawRoute>;
  /** Builds before 11 take four arguments: no voice. */
  speak(text: string, language: string, rate: number, respectSilentSwitch: boolean, voice?: string | null): Promise<boolean>;
  /** Build 11 on. */
  voices?(): Promise<Voice[]>;
  /** Build 15 on: up to three routes from a to b, leaving now. */
  routeAlternatives?(points: RoutePoint[], maxAttempts: number): Promise<RawRouteWithOptions>;
  searchPlaces?(query: string, near: RoutePoint | null): Promise<PlaceSuggestion[]>;
  resolvePlace?(id: string): Promise<ResolvedPlace>;
  stopSpeaking(): Promise<boolean>;
  /** Build 12 on: the text in a photo, lines top to bottom (Apple Vision, on the phone). */
  recognizeText?(uri: string): Promise<string>;
  chime(): boolean;
  addListener?(event: 'onRouteProgress', fn: (e: { done: number; total: number }) => void): Subscription;
}

/** Null on web, in Expo Go, or in any build without the native module. */
const native = requireOptionalNativeModule<Native>('NavDirections');

export const navDirectionsAvailable = native != null;

/** The voice picker needs build 11 or later (older builds have no voices()). */
export const voicePickerAvailable = typeof native?.voices === 'function';

/** Apple's place autocomplete needs build 11 or later; before that "Where to?" uses the geocoder. */
export const placeSearchAvailable = typeof native?.searchPlaces === 'function' && typeof native?.resolvePlace === 'function';

/** Route alternatives and traffic-aware times (build 15 on). OTA JavaScript on older builds falls back to one route. */
export function supportsAlternatives(): boolean {
  return typeof native?.routeAlternatives === 'function';
}

/**
 * Driving directions through the points in order. Null when the module isn't in this build.
 * With `alternatives` (two points, build 15 on) the answer also has `routes`.
 */
export async function route(points: RoutePoint[], options: RouteOptions = {}): Promise<RawRoute | RawRouteWithOptions | null> {
  if (!native) return null;
  const clean = points.map((p) => ({ lat: p.lat, lng: p.lng }));
  if (options.alternatives && clean.length === 2 && native.routeAlternatives) {
    const out = await native.routeAlternatives(clean, options.maxAttempts ?? 5);
    options.onProgress?.(1, 1);
    return out;
  }
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
    const language = options.language ?? 'en-GB';
    const rate = options.rate ?? 0.5;
    const quiet = options.respectSilentSwitch ?? false;
    // Older builds' speak() takes exactly four arguments: a fifth would be refused.
    return voicePickerAvailable
      ? await native.speak(text, language, rate, quiet, options.voice || null)
      : await native.speak(text, language, rate, quiet);
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

/** Installed English voices. Empty on older builds, the web, or if the list can't be read. */
export async function voices(): Promise<Voice[]> {
  if (!native?.voices) return [];
  try {
    const list = await native.voices();
    return Array.isArray(list) ? list.filter((v) => v && typeof v.identifier === 'string') : [];
  } catch {
    return [];
  }
}

/**
 * Apple's live suggestions for what's typed (addresses, shops, businesses), biased to
 * `near` (else the UK). Null when this build doesn't have it (use the geocoder instead).
 * A newer search answers an older one with an empty list. Throws when the lookup failed.
 */
export async function searchPlaces(query: string, near?: RoutePoint | null): Promise<PlaceSuggestion[] | null> {
  if (!native?.searchPlaces || !placeSearchAvailable) return null;
  return native.searchPlaces(query, near ? { lat: near.lat, lng: near.lng } : null);
}

/** A suggestion's position and address. Null on builds without it. Throws if it can't be found. */
export async function resolvePlace(id: string): Promise<ResolvedPlace | null> {
  if (!native?.resolvePlace) return null;
  return native.resolvePlace(id);
}

/** Text recognition needs build 12 or later (src/lib/ocr.ts uses it for dyno sheets). */
export const textRecognitionAvailable = typeof native?.recognizeText === 'function';
