/**
 * The driving view's voice: which installed voice to use, how to label it in
 * Settings, and how fast it talks. Pure; the list comes from the native module
 * (modules/nav-directions voices(), build 11 on).
 */

export type VoiceQuality = 'default' | 'enhanced' | 'premium';

export interface VoiceInfo {
  identifier: string;
  name: string;
  language: string;
  quality: VoiceQuality;
  /** Build 15 on: the voice's gender as iOS reports it. */
  gender?: 'male' | 'female' | 'unspecified';
}

export const NAV_LANGUAGE = 'en-GB';

const QUALITY_RANK: Record<VoiceQuality, number> = { premium: 2, enhanced: 1, default: 0 };

export const QUALITY_LABELS: Record<VoiceQuality, string> = { premium: 'Premium', enhanced: 'Enhanced', default: 'Basic' };

const sameLanguage = (a: string, b: string) => a.replace('_', '-').toLowerCase() === b.replace('_', '-').toLowerCase();

/**
 * The best installed voice: British voices if there are any, else any English;
 * premium over enhanced over standard, then by name. Null with no voices.
 */
export function bestVoice<V extends VoiceInfo>(voices: V[], language = NAV_LANGUAGE): V | null {
  const english = voices.filter((v) => v.language.toLowerCase().startsWith('en'));
  const same = english.filter((v) => sameLanguage(v.language, language));
  const pool = same.length ? same : english;
  return [...pool].sort(byQuality)[0] ?? null;
}

function byQuality(a: VoiceInfo, b: VoiceInfo): number {
  return QUALITY_RANK[b.quality] - QUALITY_RANK[a.quality] || a.name.localeCompare(b.name, 'en-GB');
}

/** For the picker: British first, then other English; best quality first within each (Premium, Enhanced, Basic), then by name. */
export function sortVoices<V extends VoiceInfo>(voices: V[], language = NAV_LANGUAGE): V[] {
  return [...voices].sort((a, b) => Number(sameLanguage(b.language, language)) - Number(sameLanguage(a.language, language)) || byQuality(a, b) || a.language.localeCompare(b.language));
}

/**
 * The voice id to ask the phone for. Picked and still installed: that one. Not picked: the best
 * installed British voice when it's Enhanced or Premium (a downloaded voice beats the built-in
 * one); otherwise null, so the phone uses its own default British voice.
 */
export function autoVoiceId(voices: VoiceInfo[], picked: string | null | undefined, language = NAV_LANGUAGE): string | null {
  // Before the list has loaded (or on builds that can't list voices) the pick is trusted as it is.
  if (picked && (voices.length === 0 || voices.some((v) => v.identifier === picked))) return picked;
  const best = bestVoice(voices, language);
  return best && best.quality !== 'default' ? best.identifier : null;
}

/** The voice to use: the one picked, if it's still installed, else the best one. */
export function voiceToUse<V extends VoiceInfo>(voices: V[], picked: string | null | undefined, language = NAV_LANGUAGE): V | null {
  return (picked ? voices.find((v) => v.identifier === picked) : undefined) ?? bestVoice(voices, language);
}

const REGIONS: Record<string, string> = {
  GB: 'UK',
  US: 'US',
  AU: 'Australia',
  IE: 'Ireland',
  IN: 'India',
  ZA: 'South Africa',
  NZ: 'New Zealand',
  CA: 'Canada',
  SG: 'Singapore',
  SC: 'Scotland',
};

/** "English (UK)", "English (Ireland)". */
export function languageLabel(language: string): string {
  const region = language.replace('_', '-').split('-')[1]?.toUpperCase();
  return region ? `English (${REGIONS[region] ?? region})` : 'English';
}

const GENDERS = { male: 'Male', female: 'Female' } as const;

/** "English (UK) · Enhanced", with "· Female" when the phone says. */
export function voiceDetail(v: VoiceInfo): string {
  const g = v.gender === 'male' || v.gender === 'female' ? ` · ${GENDERS[v.gender]}` : '';
  return `${languageLabel(v.language)} · ${QUALITY_LABELS[v.quality]}${g}`;
}

/**
 * iOS 26 renamed Spoken Content to Read & Speak. `version` is Platform.Version ("26.1" on iOS).
 * Off iOS (web, Android) we can't tell, so both names, the current one first.
 */
export function spokenContentStep(os: string, version: string | number | undefined): string {
  const major = os === 'ios' ? parseInt(String(version ?? ''), 10) : NaN;
  if (Number.isNaN(major)) return 'Read & Speak (on older iOS: Spoken Content)';
  return major >= 26 ? 'Read & Speak' : 'Spoken Content';
}

/**
 * The "Get a natural voice" guide, one step per line. Apps can only open their own page in the
 * Settings app (the Accessibility deep links are private and get apps rejected), so the user walks it.
 */
export function voiceGuideSteps(os: string, version: string | number | undefined): string[] {
  return [
    'Open the Settings app.',
    'Accessibility.',
    `${spokenContentStep(os, version)}.`,
    'Voices.',
    'English.',
    'English (UK).',
    'Tap a voice marked Premium (e.g. Jamie or Serena) to download it.',
  ];
}

/**
 * After coming back from the Settings app: the best British Premium or Enhanced voice that wasn't
 * installed before. Null when nothing new (or the list before wasn't known, so we can't tell).
 */
export function newNaturalVoice<V extends VoiceInfo>(before: V[] | null, after: V[], language = NAV_LANGUAGE): V | null {
  if (!before) return null;
  const had = new Set(before.map((v) => v.identifier));
  const fresh = after.filter((v) => !had.has(v.identifier) && v.quality !== 'default' && sameLanguage(v.language, language));
  return [...fresh].sort(byQuality)[0] ?? null;
}

/** "Jamie (Premium) is ready". */
export function voiceReadyMessage(v: VoiceInfo): string {
  return `${v.name} (${QUALITY_LABELS[v.quality]}) is ready`;
}

/** Speech rates (AVSpeechUtterance, 0–1; 0.5 is the system's normal). */
export type SpeechRate = 'slower' | 'normal' | 'faster';
export const SPEECH_RATES: Record<SpeechRate, number> = { slower: 0.44, normal: 0.5, faster: 0.56 };
export const SPEECH_RATE_LABELS: Record<SpeechRate, string> = { slower: 'Slower', normal: 'Normal', faster: 'Faster' };

export function speechRate(choice: SpeechRate | null | undefined): number {
  return SPEECH_RATES[choice ?? 'normal'] ?? SPEECH_RATES.normal;
}

/** What "Play sample" says. */
export const VOICE_SAMPLE = 'In a quarter of a mile, take the second exit at the roundabout, onto the A5.';
