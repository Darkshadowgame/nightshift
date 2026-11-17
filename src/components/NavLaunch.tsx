import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, Modal, Pressable, Share, Switch, View } from 'react-native';
import { appLabel, directionsUrls, shareLocationText, type DirectionsApp } from '../lib/directions';
import { targetParams, type NavTarget } from '../lib/navPlan';
import { useStore } from '../lib/store';
import type { LatLng } from '../lib/types';
import { C } from '../theme';
import { Button, Row, Txt } from './ui';

async function openFirst(urls: string[]): Promise<boolean> {
  for (const u of urls) {
    const isWeb = u.startsWith('https://');
    try {
      if (isWeb || (await Linking.canOpenURL(u))) {
        await Linking.openURL(u);
        return true;
      }
    } catch {
      // Try the next one.
    }
  }
  return false;
}

/** Opens directions in another app. False if nothing could open. */
export async function openDirections(app: Exclude<DirectionsApp, 'nightshift'>, to: LatLng): Promise<boolean> {
  return openFirst(directionsUrls(app, to));
}

const CHOICES: { id: DirectionsApp | 'other'; label: string; note: string }[] = [
  { id: 'nightshift', label: 'Nightshift', note: 'Turn by turn here, with camera alerts' },
  { id: 'apple', label: 'Apple Maps', note: 'To the first stop' },
  { id: 'google', label: 'Google Maps', note: 'The app, or the website without it' },
  { id: 'waze', label: 'Waze', note: 'The app, or the website without it' },
  { id: 'other', label: 'Other app…', note: 'Share the spot with any app' },
];

/**
 * "Start navigation": Nightshift's own driving view by default, with a small
 * chooser to open Apple Maps, Google Maps, Waze or the share sheet instead.
 * "Always use this" remembers the choice (Me > Navigation changes it back).
 * `to` is where other apps are sent: the first stop.
 */
export function NavLaunch({ target, to, label = 'Start navigation' }: { target: NavTarget; to: LatLng; label?: string }) {
  const { settings, setSettings } = useStore();
  const [choosing, setChoosing] = useState(false);
  const [always, setAlways] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const preferred = settings.directionsApp ?? 'nightshift';

  async function go(app: DirectionsApp | 'other') {
    setError(null);
    if (app === 'nightshift') {
      router.push({ pathname: '/drive', params: targetParams(target) });
      return;
    }
    if (app === 'other') {
      await Share.share({ message: shareLocationText(to) }).catch(() => undefined);
      return;
    }
    const ok = await openDirections(app, to);
    if (!ok) setError(`Couldn't open ${appLabel(app)}.`);
  }

  async function choose(app: DirectionsApp | 'other') {
    setChoosing(false);
    if (always && app !== 'other') setSettings({ directionsApp: app });
    await go(app);
  }

  return (
    <View style={{ gap: 6 }}>
      <Button
        label={preferred === 'nightshift' ? label : `Directions in ${appLabel(preferred)}`}
        kind="neon"
        onPress={() => go(preferred)}
        accessibilityHint={preferred === 'nightshift' ? 'Opens turn-by-turn navigation in Nightshift' : undefined}
      />
      <Pressable
        onPress={() => {
          setAlways(false);
          setChoosing(true);
        }}
        accessibilityRole="button"
        accessibilityLabel="Open directions in another app"
        hitSlop={8}
        style={{ alignSelf: 'center', paddingVertical: 4 }}
      >
        <Txt v="label" style={{ color: C.neon }}>Open in another app ›</Txt>
      </Pressable>
      {error ? <Txt v="muted" style={{ color: C.alert, textAlign: 'center' }}>{error}</Txt> : null}

      <Modal visible={choosing} transparent animationType="slide" onRequestClose={() => setChoosing(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' }} onPress={() => setChoosing(false)} accessibilityLabel="Close" />
        <View style={{ backgroundColor: C.tarmac, padding: 16, paddingBottom: 36, gap: 10, borderTopLeftRadius: 14, borderTopRightRadius: 14 }}>
          <Txt v="h3">Get directions with</Txt>
          {CHOICES.map((c) => (
            <Pressable
              key={c.id}
              onPress={() => choose(c.id)}
              accessibilityRole="button"
              accessibilityLabel={`${c.label}. ${c.note}`}
              style={({ pressed }) => [
                { borderWidth: 1, borderColor: c.id === preferred ? C.neon : C.kerbHi, borderRadius: 8, padding: 12 },
                pressed && { opacity: 0.7 },
              ]}
            >
              <Txt style={{ fontSize: 17 }}>{c.label}{c.id === preferred ? '  ·  now' : ''}</Txt>
              <Txt v="muted" style={{ fontSize: 12 }}>{c.note}</Txt>
            </Pressable>
          ))}
          <Row style={{ flexWrap: 'nowrap', justifyContent: 'space-between' }} gap={12}>
            <Txt style={{ flex: 1 }}>Always use this</Txt>
            <Switch value={always} onValueChange={setAlways} accessibilityLabel="Always use this app for directions" trackColor={{ true: C.neon, false: C.kerb }} />
          </Row>
          <Txt v="muted" style={{ fontSize: 12 }}>Other apps get the first stop's position only. Change it any time in Me &gt; Navigation.</Txt>
        </View>
      </Modal>
    </View>
  );
}
