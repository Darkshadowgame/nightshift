import { autoVoiceId, bestVoice, VOICE_HOW_TO, languageLabel, sortVoices, speechRate, voiceDetail, voiceToUse, type VoiceInfo } from '../src/lib/voices';

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
  test('British first, then best quality first', () => {
    expect(sortVoices([ava, moira, daniel, serena]).map((x) => x.identifier)).toEqual(['serena', 'daniel', 'ava', 'moira']);
  });
  test('readable detail', () => {
    expect(voiceDetail(danielPlus)).toBe('English (UK) · Enhanced');
    expect(voiceDetail(daniel)).toBe('English (UK) · Basic');
    expect(languageLabel('en-ZA')).toBe('English (South Africa)');
    expect(languageLabel('en')).toBe('English');
  });
  test('speech rates', () => {
    expect(speechRate(undefined)).toBe(0.5);
    expect(speechRate('slower')).toBeLessThan(0.5);
    expect(speechRate('faster')).toBeGreaterThan(0.5);
  });
});

describe('automatic voice', () => {
  test('premium beats enhanced beats basic, British first', () => {
    expect(autoVoiceId([daniel, danielPlus, serena, ava], null)).toBe('serena');
    expect(autoVoiceId([daniel, danielPlus], undefined)).toBe('daniel-enh');
  });
  test('only basic voices: the phone picks its own default British voice', () => {
    expect(autoVoiceId([daniel, ava], null)).toBeNull();
  });
  test('your pick wins while it is installed, and before the list has loaded', () => {
    expect(autoVoiceId([daniel, serena], 'daniel')).toBe('daniel');
    expect(autoVoiceId([daniel, serena], 'gone')).toBe('serena');
    expect(autoVoiceId([], 'daniel')).toBe('daniel');
  });
  test('labels say Premium, Enhanced or Basic, and gender when known', () => {
    expect(voiceDetail(serena)).toBe('English (UK) · Premium');
    expect(voiceDetail({ ...serena, gender: 'female' })).toBe('English (UK) · Premium · Female');
    expect(voiceDetail({ ...daniel, gender: 'unspecified' })).toBe('English (UK) · Basic');
  });
  test('the how-to names the iOS 26 path and the older one', () => {
    expect(VOICE_HOW_TO).toMatch(/Accessibility › Read & Speak › Voices › English › English \(UK\)/);
    expect(VOICE_HOW_TO).toMatch(/Spoken Content/);
  });
});
