import { bestVoice, languageLabel, sortVoices, speechRate, voiceDetail, voiceToUse, type VoiceInfo } from '../src/lib/voices';

const v = (identifier: string, language: string, quality: VoiceInfo['quality'], name = identifier): VoiceInfo => ({ identifier, name, language, quality });
const daniel = v('daniel', 'en-GB', 'default', 'Daniel');
const danielPlus = v('daniel-enh', 'en-GB', 'enhanced', 'Daniel');
const serena = v('serena', 'en-GB', 'premium', 'Serena');
const ava = v('ava', 'en-US', 'premium', 'Ava');
const moira = v('moira', 'en-IE', 'enhanced', 'Moira');

describe('best voice', () => {
  test('British first, best quality', () => {
    expect(bestVoice([daniel, danielPlus, ava])?.identifier).toBe('daniel-enh');
    expect(bestVoice([daniel, serena, danielPlus, ava])?.identifier).toBe('serena');
  });
  test('a standard British voice still beats a premium American one', () => {
    expect(bestVoice([daniel, ava])?.identifier).toBe('daniel');
  });
  test('no British voice: the best other English', () => {
    expect(bestVoice([moira, ava])?.identifier).toBe('ava');
  });
  test('nothing English: null', () => {
    expect(bestVoice([v('x', 'fr-FR', 'premium')])).toBeNull();
    expect(bestVoice([])).toBeNull();
  });
});

describe('voice to use', () => {
  test('the picked one while it is installed, else the best', () => {
    expect(voiceToUse([daniel, ava], 'ava')?.identifier).toBe('ava');
    expect(voiceToUse([daniel, danielPlus], 'gone')?.identifier).toBe('daniel-enh');
    expect(voiceToUse([daniel], null)?.identifier).toBe('daniel');
  });
});

describe('labels and order', () => {
  test('British first, then by language, best first', () => {
    expect(sortVoices([ava, moira, daniel, serena]).map((x) => x.identifier)).toEqual(['serena', 'daniel', 'moira', 'ava']);
  });
  test('readable detail', () => {
    expect(voiceDetail(danielPlus)).toBe('English (UK) · Enhanced');
    expect(voiceDetail(daniel)).toBe('English (UK) · Standard');
    expect(languageLabel('en-ZA')).toBe('English (South Africa)');
    expect(languageLabel('en')).toBe('English');
  });
  test('speech rates', () => {
    expect(speechRate(undefined)).toBe(0.5);
    expect(speechRate('slower')).toBeLessThan(0.5);
    expect(speechRate('faster')).toBeGreaterThan(0.5);
  });
});
