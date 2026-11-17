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
}

export const NAV_LANGUAGE = 'en-GB';

const QUALITY_RANK: Record<VoiceQuality, number> = { premium: 2, enhanced: 1, default: 0 };

export const QUALITY_LABELS: Record<VoiceQuality, string> = { premium: 'Premium', enhanced: 'Enhanced', default: 'Standard' };

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

/** For the picker: British first, then other English; best quality first within each. */
export function sortVoices<V extends VoiceInfo>(voices: V[], language = NAV_LANGUAGE): V[] {
  return [...voices].sort((a, b) => Number(sameLanguage(b.language, language)) - Number(sameLanguage(a.language, language)) || a.language.localeCompare(b.language) || byQuality(a, b));
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

/** "English (UK) · Enhanced". */
export function voiceDetail(v: VoiceInfo): string {
  return `${languageLabel(v.language)} · ${QUALITY_LABELS[v.quality]}`;
}

/** Speech rates (AVSpeechUtterance, 0–1; 0.5 is the system's normal). */
export type SpeechRate = 'slower' | 'normal' | 'faster';
export const SPEECH_RATES: Record<SpeechRate, number> = { slower: 0.44, normal: 0.5, faster: 0.56 };
export const SPEECH_RATE_LABELS: Record<SpeechRate, string> = { slower: 'Slower', normal: 'Normal', faster: 'Faster' };

export function speechRate(choice: SpeechRate | null | undefined): number {
  return SPEECH_RATES[choice ?? 'normal'] ?? SPEECH_RATES.normal;
}

/** What "Play sample" says. */
export const VOICE_SAMPLE = 'In a quarter of a mile, turn left onto the High Street. Speed camera ahead, 30 miles per hour.';
