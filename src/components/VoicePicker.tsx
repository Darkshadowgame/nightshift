import { useEffect, useState } from 'react';
import { AppState, View } from 'react-native';
import { speak, voicePickerAvailable, voices as installedVoices, type Voice } from '../../modules/nav-directions';
import { menuPath } from '../lib/glossary';
import { useStore } from '../lib/store';
import {
  bestVoice,
  NAV_LANGUAGE,
  SPEECH_RATE_LABELS,
  sortVoices,
  speechRate,
  voiceDetail,
  VOICE_SAMPLE,
  voiceToUse,
  type SpeechRate,
} from '../lib/voices';
import { SPACING } from '../theme';
import { Button, ChoiceGroup, DsText } from './ds';

const RATES: SpeechRate[] = ['slower', 'normal', 'faster'];

/**
 * Settings › Navigation and voice: which installed voice reads the directions, how fast,
 * and a sample. Builds before 11 can't list voices: they say so instead.
 */
export function VoicePicker() {
  const { settings, setSettings } = useStore();
  const [list, setList] = useState<Voice[] | null>(null);
  const [showAll, setShowAll] = useState(false);
  const picked = settings.navVoiceId ?? null;
  const rate = settings.navVoiceRate ?? 'normal';

  // Read the list again when coming back from the iPhone Settings app (a voice may have just downloaded).
  useEffect(() => {
    if (!voicePickerAvailable) return;
    const load = () => installedVoices().then(setList);
    load();
    const sub = AppState.addEventListener('change', (s) => s === 'active' && load());
    return () => sub.remove();
  }, []);

  if (!voicePickerAvailable) {
    return <DsText v="caption">Choosing a voice needs the latest iPhone app (build 11 or later).</DsText>;
  }

  const sorted = sortVoices(list ?? []);
  const british = sorted.filter((v) => v.language.replace('_', '-').toLowerCase() === NAV_LANGUAGE.toLowerCase());
  const shown = showAll || british.length === 0 ? sorted : sorted.filter((v) => british.includes(v) || v.identifier === picked);
  const auto = bestVoice(sorted);
  const using = voiceToUse(sorted, picked);
  const current = picked && sorted.some((v) => v.identifier === picked) ? picked : 'auto';

  return (
    <View style={{ gap: SPACING.md }}>
      <ChoiceGroup
        label="Voice"
        layout="list"
        value={current}
        onChange={(k) => setSettings({ navVoiceId: k === 'auto' ? null : k })}
        options={[
          { key: 'auto', label: 'Automatic', hint: auto ? `Best British voice installed: ${auto.name}, ${voiceDetail(auto)}` : 'Best British voice installed' },
          ...shown.map((v) => ({ key: v.identifier, label: v.name, hint: voiceDetail(v) })),
        ]}
      />
      {!showAll && sorted.length > shown.length ? (
        <Button label={`Show other English voices (${sorted.length - shown.length})`} tier="tertiary" size="sm" onPress={() => setShowAll(true)} />
      ) : null}
      <ChoiceGroup label="Speed" value={rate} onChange={(r) => setSettings({ navVoiceRate: r })} options={RATES.map((r) => ({ key: r, label: SPEECH_RATE_LABELS[r] }))} />
      <Button
        label="Play sample"
        tier="secondary"
        size="sm"
        accessibilityHint={using ? `Plays ${using.name}` : undefined}
        onPress={() => speak(VOICE_SAMPLE, { voice: picked, rate: speechRate(rate) })}
      />
      <DsText v="caption">
        For a more natural voice, download one in iPhone Settings › {menuPath('Accessibility', 'Read & Speak', 'Voices', 'English')} (Spoken Content
        before iOS 26). Pick a UK voice, download its Enhanced or Premium version, then pick it here.
      </DsText>
    </View>
  );
}
