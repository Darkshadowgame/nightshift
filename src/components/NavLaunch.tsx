import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, Share, View } from 'react-native';
import { appLabel, directionsUrls, shareLocationText, type DirectionsApp } from '../lib/directions';
import { menuPath, NAVIGATE } from '../lib/glossary';
import { targetParams, type NavTarget } from '../lib/navPlan';
import { useStore } from '../lib/store';
import type { LatLng } from '../lib/types';
import { SPACING } from '../theme';
import { Button, DsText, ErrorState, Sheet, SheetOption, SwitchRow } from './ds';

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

function choices(toName?: string): { id: DirectionsApp | 'other'; label: string; note: string }[] {
  return [
    { id: 'nightshift', label: 'Nightshift', note: 'Turn by turn here, with camera alerts' },
    { id: 'apple', label: 'Apple Maps', note: toName ? `To ${toName}` : 'Straight there' },
    { id: 'google', label: 'Google Maps', note: 'The app, or the website without it' },
    { id: 'waze', label: 'Waze', note: 'The app, or the website without it' },
    { id: 'other', label: 'Other app…', note: 'Share the spot with any app' },
  ];
}

/**
 * "Navigate": Nightshift's own driving view by default, with a sheet to open Apple Maps, Google
 * Maps, Waze or the share sheet instead. "Always use this" remembers the choice
 * (Me › Settings › Navigation changes it back). `to` is where other apps are sent (one point: for a
 * rolling meet, the meet point it's at now, the one Check in names), `toName` what it's called and
 * `otherAppsNote` the line under the choices.
 * `kind`: secondary unless navigating is the main thing the screen is for (one primary per screen).
 * `disabled` + `hint` keep the button's shape and say why ("Location shows at 21:30").
 */
export function NavLaunch({
  target,
  to,
  toName,
  otherAppsNote,
  label = NAVIGATE,
  kind = 'secondary',
  disabled,
  hint,
}: {
  target: NavTarget;
  to: LatLng;
  toName?: string;
  otherAppsNote?: string;
  label?: string;
  kind?: 'primary' | 'secondary' | 'ghost' | 'danger';
  disabled?: boolean;
  hint?: string;
}) {
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
    <View style={{ gap: SPACING.xs }}>
      <Button
        label={preferred === 'nightshift' ? label : `Directions in ${appLabel(preferred)}`}
        tier={kind === 'primary' ? 'primary' : 'secondary'}
        size={kind === 'primary' ? 'lg' : 'md'}
        block
        disabled={disabled}
        hint={hint}
        onPress={() => go(preferred)}
        accessibilityHint={preferred === 'nightshift' ? 'Opens turn-by-turn navigation in Nightshift' : undefined}
      />
      {disabled ? null : (
        <View style={{ alignItems: 'center' }}>
          <Button
            tier="tertiary"
            size="sm"
            label="Open in another app ›"
            accessibilityLabel="Open directions in another app"
            onPress={() => {
              setAlways(false);
              setChoosing(true);
            }}
          />
        </View>
      )}
      {error ? <ErrorState title={error} /> : null}

      <Sheet visible={choosing} title="Get directions with" onClose={() => setChoosing(false)}>
        <View>
          {choices(toName).map((c) => (
            <SheetOption key={c.id} label={c.id === preferred ? `${c.label} · now` : c.label} detail={c.note} onPress={() => choose(c.id)} />
          ))}
        </View>
        <SwitchRow label="Always use this" value={always} onValueChange={setAlways} />
        <DsText v="caption">{`${otherAppsNote ?? (toName ? `Other apps get ${toName} only.` : 'Other apps go straight there.')} Change it any time in ${menuPath('Me', 'Settings', 'Navigation')}.`}</DsText>
      </Sheet>
    </View>
  );
}
