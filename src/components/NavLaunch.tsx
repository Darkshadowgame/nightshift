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

export interface NavLaunchOptions {
  target: NavTarget;
  /** Where other apps are sent (one point). */
  to: LatLng;
  toName?: string;
  otherAppsNote?: string;
}

/**
 * Navigate without its own button, for an `ActionBar` primary or secondary (Redesign 2: the
 * screen's one primary lives in the bar). `label` is what the button should say ("Navigate", or
 * "Directions in Waze" when another app is the saved choice), `open()` goes, `openOther()` opens
 * the choice of apps, and `sheet` (render it anywhere on the screen) is that choice, with its error.
 *
 *   const nav = useNavLaunch({ target, to, toName });
 *   <ActionBar primary={{ label: nav.label, onPress: nav.open }} />
 *   {nav.sheet}
 */
export function useNavLaunch({ target, to, toName, otherAppsNote }: NavLaunchOptions, label: string = NAVIGATE) {
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

  const sheet = (
    <>
      {error ? <ErrorState title={error} /> : null}
      <Sheet visible={choosing} title="Get directions with" onClose={() => setChoosing(false)}>
        <View>
          {choices(toName).map((c) => (
            <SheetOption key={c.id} label={c.id === preferred ? `${c.label} · now` : c.label} detail={c.note} onPress={() => choose(c.id)} />
          ))}
        </View>
        <SwitchRow label="Always use this" value={always} onValueChange={setAlways} />
        <DsText v="caption">{`${otherAppsNote ?? (toName ? `Other apps get ${toName} only.` : 'Other apps go straight there.')} Change it any time in ${menuPath('Me', 'Settings', 'Directions')}.`}</DsText>
      </Sheet>
    </>
  );

  return {
    label: preferred === 'nightshift' ? label : `Directions in ${appLabel(preferred)}`,
    /** Opens the saved choice (Nightshift's driving view by default). */
    open: () => go(preferred),
    /** The choice of apps, as a Sheet. */
    openOther: () => {
      setAlways(false);
      setChoosing(true);
    },
    sheet,
    error,
  };
}

/**
 * "Navigate" as a button on the page: Nightshift's own driving view by default, with a link to
 * open Apple Maps, Google Maps, Waze or the share sheet instead (useNavLaunch). On detail screens
 * prefer `useNavLaunch` with the ActionBar.
 * `kind`: secondary unless navigating is the main thing the screen is for (one primary per screen).
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
}: NavLaunchOptions & {
  label?: string;
  kind?: 'primary' | 'secondary' | 'ghost' | 'danger';
  disabled?: boolean;
  hint?: string;
}) {
  const nav = useNavLaunch({ target, to, toName, otherAppsNote }, label);
  const preferred = useStore().settings.directionsApp ?? 'nightshift';
  return (
    <View style={{ gap: SPACING.xs }}>
      <Button
        label={nav.label}
        tier={kind === 'primary' ? 'primary' : 'secondary'}
        size={kind === 'primary' ? 'lg' : 'md'}
        block
        disabled={disabled}
        hint={hint}
        onPress={nav.open}
        accessibilityHint={preferred === 'nightshift' ? 'Opens turn-by-turn navigation in Nightshift' : undefined}
      />
      {disabled ? null : (
        <View style={{ alignItems: 'center' }}>
          <Button tier="tertiary" size="sm" label="Open in another app ›" accessibilityLabel="Open directions in another app" onPress={nav.openOther} />
        </View>
      )}
      {nav.sheet}
    </View>
  );
}
