import { autoVoiceId, bestVoice, languageLabel, newNaturalVoice, sortVoices, speechRate, spokenContentStep, voiceDetail, voiceGuideSteps, voiceReadyMessage, voiceToUse, type VoiceInfo } from '../src/lib/voices';

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
  test('the guide is one step per line, ending on the Premium download', () => {
    const steps = voiceGuideSteps('ios', '26.1');
    expect(steps).toEqual(['Open the Settings app.', 'Accessibility.', 'Read & Speak.', 'Voices.', 'English.', 'English (UK).', 'Tap a voice marked Premium (e.g. Jamie or Serena) to download it.']);
  });
});

describe('the Read & Speak step follows the iOS version', () => {
  test('iOS 26 and later: Read & Speak', () => {
    expect(spokenContentStep('ios', '26.0')).toBe('Read & Speak');
    expect(spokenContentStep('ios', '27.2.1')).toBe('Read & Speak');
  });
  test('before iOS 26: Spoken Content', () => {
    expect(spokenContentStep('ios', '18.6')).toBe('Spoken Content');
    expect(spokenContentStep('ios', '17.0')).toBe('Spoken Content');
    expect(voiceGuideSteps('ios', '18.6')[2]).toBe('Spoken Content.');
  });
  test('unknown (web, Android, odd version): the current name first, the old one after', () => {
    expect(spokenContentStep('web', undefined)).toBe('Read & Speak (on older iOS: Spoken Content)');
    expect(spokenContentStep('android', 34)).toBe('Read & Speak (on older iOS: Spoken Content)');
    expect(spokenContentStep('ios', '')).toBe('Read & Speak (on older iOS: Spoken Content)');
  });
});

describe('a voice downloaded in the Settings app', () => {
  const jamie = v('jamie', 'en-GB', 'premium', 'Jamie');
  test('a new British Premium voice is found', () => {
    expect(newNaturalVoice([daniel], [daniel, jamie])?.identifier).toBe('jamie');
    expect(voiceReadyMessage(jamie)).toBe('Jamie (Premium) is ready');
  });
  test('a new Enhanced voice counts too, and Premium wins when both arrive', () => {
    expect(newNaturalVoice([daniel], [daniel, danielPlus])?.identifier).toBe('daniel-enh');
    expect(newNaturalVoice([daniel], [daniel, danielPlus, jamie])?.identifier).toBe('jamie');
  });
  test('nothing new, a Basic voice, or another accent: nothing to say', () => {
    expect(newNaturalVoice([daniel, serena], [daniel, serena])).toBeNull();
    expect(newNaturalVoice([], [daniel])).toBeNull();
    expect(newNaturalVoice([daniel], [daniel, ava, moira])).toBeNull();
  });
  test('the list before was never read: no claim that anything is new', () => {
    expect(newNaturalVoice(null, [daniel, jamie])).toBeNull();
  });
});
