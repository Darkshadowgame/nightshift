import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, AppState, Linking, Platform, View } from 'react-native';
import { speak, voicePickerAvailable, voices as installedVoices, type Voice } from '../../modules/nav-directions';
import { useStore } from '../lib/store';
import {
  bestVoice,
  NAV_LANGUAGE,
  newNaturalVoice,
  SPEECH_RATE_LABELS,
  sortVoices,
  speechRate,
  voiceDetail,
  VOICE_SAMPLE,
  voiceGuideSteps,
  voiceReadyMessage,
  voiceToUse,
  type SpeechRate,
} from '../lib/voices';
import { MOTION, SPACING } from '../theme';
import { Button, ChoiceGroup, DsText, ToastView } from './ds';

const RATES: SpeechRate[] = ['slower', 'normal', 'faster'];

/**
 * Settings › Navigation and voice: which installed voice reads the directions, how fast,
 * and a sample. Builds before 11 can't list voices: they say so instead.
 */
export function VoicePicker() {
  const { settings, setSettings } = useStore();
  const [list, setList] = useState<Voice[] | null>(null);
  const [showAll, setShowAll] = useState(false);
  /** The guide to a Premium voice; open from the start while only Basic voices are installed. */
  const [guideOpen, setGuideOpen] = useState(false);
  /** A voice that arrived while the user was in the Settings app ("Jamie (Premium) is ready"). */
  const [ready, setReady] = useState<Voice | null>(null);
  const picked = settings.navVoiceId ?? null;
  const rate = settings.navVoiceRate ?? 'normal';
  const pickedRef = useRef(picked);
  pickedRef.current = picked;
  const setSettingsRef = useRef(setSettings);
  setSettingsRef.current = setSettings;

  // Read the list again when coming back from the iPhone Settings app: a voice may have just
  // downloaded. A new Premium or Enhanced British voice is announced, and used if none was picked.
  useEffect(() => {
    if (!voicePickerAvailable) return;
    let before: Voice[] | null = null;
    const load = () =>
      installedVoices()
        .then((next) => {
          const fresh = newNaturalVoice(before, next);
          before = next;
          setList(next);
          if (!fresh) return;
          if (!pickedRef.current) setSettingsRef.current({ navVoiceId: fresh.identifier });
          setReady(fresh);
          setGuideOpen(false);
          AccessibilityInfo.announceForAccessibility(voiceReadyMessage(fresh));
        })
        .catch(() => undefined);
    load();
    const sub = AppState.addEventListener('change', (s) => s === 'active' && load());
    return () => sub.remove();
  }, []);

  // The "is ready" toast goes after the usual 3.2 s.
  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => setReady(null), MOTION.toast);
    return () => clearTimeout(t);
  }, [ready]);

  if (!voicePickerAvailable) {
    return (
      <View style={{ gap: SPACING.md }}>
        <DsText v="caption">Choosing a voice needs the latest version of the iPhone app.</DsText>
        <VoiceGuide />
      </View>
    );
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
        onChange={(k) => {
          setSettings({ navVoiceId: k === 'auto' ? null : k });
          // Hear it straight away.
          speak(VOICE_SAMPLE, { voice: k === 'auto' ? (auto?.identifier ?? null) : k, rate: speechRate(rate) });
        }}
        options={[
          { key: 'auto', label: 'Automatic', hint: auto ? `Best British voice installed: ${auto.name}, ${voiceDetail(auto)}` : 'Best British voice installed' },
          // Best first: Premium, Enhanced, then Basic (voices.ts sortVoices). Tapping one plays a sample.
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
        onPress={() => speak(VOICE_SAMPLE, { voice: using?.identifier ?? picked, rate: speechRate(rate) })}
      />
      {ready ? (
        // Shown here, not through the app's toast host: this picker lives in the Driving options
        // sheet, which would cover a toast at the root. Same pill, same 3.2 s.
        <ToastView
          message={voiceReadyMessage(ready)}
          action={{ label: 'Play sample', onPress: () => speak(VOICE_SAMPLE, { voice: ready.identifier, rate: speechRate(rate) }) }}
          onDismiss={() => setReady(null)}
        />
      ) : guideOpen || !auto || auto.quality === 'default' ? (
        // Only Basic voices installed: the steps show straight away.
        <VoiceGuide comeBack />
      ) : (
        <Button label="Get a natural voice" tier="tertiary" size="sm" onPress={() => setGuideOpen(true)} />
      )}
    </View>
  );
}

/**
 * "Get a natural voice": the path to a Premium voice in the Settings app, one step per line (the
 * Read & Speak step named for this iPhone's iOS). Apps may only open their own page in the Settings
 * app, so the button says where it lands and how to get from there to step 2.
 */
function VoiceGuide({ comeBack }: { comeBack?: boolean }) {
  const steps = voiceGuideSteps(Platform.OS, Platform.Version);
  return (
    <View style={{ gap: SPACING.sm }}>
      <DsText v="label" accessibilityRole="header">
        Get a natural voice
      </DsText>
      <View accessibilityRole="list" style={{ gap: SPACING.xs }}>
        {steps.map((step, i) => (
          <View key={step} style={{ flexDirection: 'row', gap: SPACING.sm }} accessible accessibilityLabel={`Step ${i + 1}: ${step}`}>
            <DsText v="body" tone="secondary" style={{ minWidth: 20 }}>
              {`${i + 1}.`}
            </DsText>
            <DsText v="body" style={{ flex: 1 }}>
              {step}
            </DsText>
          </View>
        ))}
      </View>
      {comeBack ? <DsText v="caption">Then come back to Nightshift: the new voice shows in the list above.</DsText> : null}
      {Platform.OS === 'ios' ? (
        <View style={{ gap: SPACING.xs }}>
          <Button label="Open the Settings app" tier="secondary" size="sm" onPress={() => Linking.openSettings().catch(() => undefined)} />
          <DsText v="caption">It opens on Nightshift&apos;s page. Tap back at the top left until you see the main list, then go from step 2.</DsText>
        </View>
      ) : null}
    </View>
  );
}
