import { useEffect, useState } from 'react';
import { AppState, Pressable, View } from 'react-native';
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
import { BRAND, C, RADIUS } from '../theme';
import { Button, Chip, LinkText, Row, Txt } from './ui';

const RATES: SpeechRate[] = ['slower', 'normal', 'faster'];

/**
 * Settings › Navigation: which installed voice reads the directions, how fast,
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
    return <Txt v="caption">Choosing a voice needs the latest iPhone app (build 11 or later).</Txt>;
  }

  const sorted = sortVoices(list ?? []);
  const british = sorted.filter((v) => v.language.replace('_', '-').toLowerCase() === NAV_LANGUAGE.toLowerCase());
  const shown = showAll || british.length === 0 ? sorted : sorted.filter((v) => british.includes(v) || v.identifier === picked);
  const auto = bestVoice(sorted);
  const using = voiceToUse(sorted, picked);

  return (
    <View style={{ gap: 10 }}>
      <Txt>Voice</Txt>
      <VoiceRow
        title="Automatic"
        detail={auto ? `Best British voice installed: ${auto.name}, ${voiceDetail(auto)}` : 'Best British voice installed'}
        on={!picked || !sorted.some((v) => v.identifier === picked)}
        onPress={() => setSettings({ navVoiceId: null })}
      />
      {shown.map((v) => (
        <VoiceRow key={v.identifier} title={v.name} detail={voiceDetail(v)} on={picked === v.identifier} onPress={() => setSettings({ navVoiceId: v.identifier })} />
      ))}
      {!showAll && sorted.length > shown.length ? (
        <LinkText label={`Show other English voices (${sorted.length - shown.length}) ›`} onPress={() => setShowAll(true)} />
      ) : null}

      <Txt>Speed</Txt>
      <Row>
        {RATES.map((r) => (
          <Chip key={r} label={SPEECH_RATE_LABELS[r]} on={rate === r} onPress={() => setSettings({ navVoiceRate: r })} />
        ))}
      </Row>
      <Button
        label="Play sample"
        kind="secondary"
        size="sm"
        accessibilityHint={using ? `Plays ${using.name}` : undefined}
        onPress={() => speak(VOICE_SAMPLE, { voice: picked, rate: speechRate(rate) })}
      />
      <Txt v="caption">
        For a more natural voice, download one in iPhone Settings › {menuPath('Accessibility', 'Read & Speak', 'Voices', 'English')} (Spoken Content
        before iOS 26). Pick a UK voice, download its Enhanced or Premium version, then pick it here.
      </Txt>
    </View>
  );
}

function VoiceRow({ title, detail, on, onPress }: { title: string; detail: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: on }}
      accessibilityLabel={`${title}. ${detail}`}
      style={({ pressed }) => [
        { borderWidth: 1, borderColor: on ? BRAND : C.kerbHi, borderRadius: RADIUS.card, paddingVertical: 10, paddingHorizontal: 12, minHeight: 44 },
        pressed && { opacity: 0.7 },
      ]}
    >
      <Txt>{title}{on ? '  ·  now' : ''}</Txt>
      <Txt v="caption">{detail}</Txt>
    </Pressable>
  );
}
