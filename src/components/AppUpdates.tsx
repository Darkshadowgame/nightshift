import Constants from 'expo-constants';
import * as Updates from 'expo-updates';
import { useState } from 'react';
import { Platform, View } from 'react-native';
import { VEHICLES_VERSION } from '../data/vehicles';
import { SPACING } from '../theme';
import { Button, ErrorState, Tag } from './ds';

/**
 * Version line, e.g. "Nightshift v1.0.08". The number is set by the OTA workflow
 * (one per published update); the version built into an install shows its build number.
 */
export function versionLine(): string {
  const update = process.env.EXPO_PUBLIC_APP_VERSION;
  const build = process.env.EXPO_PUBLIC_BUILD_NUMBER;
  if (Updates.updateId && update) return `Nightshift ${update}`;
  if (build) return `Nightshift build ${build} (built-in)`;
  return `Nightshift ${Constants.expoConfig?.version ?? '1.0.0'} (preview)`;
}

/**
 * "Runtime 1a2b3c4d · production": the native fingerprint this install runs and
 * the channel it asks. Updates only reach installs with the same runtime: if
 * the OTA job prints a different one, a new IPA is needed (README, "Updates").
 */
export function runtimeLine(runtime: string | null | undefined, channel: string | null | undefined): string {
  return `Runtime ${runtime ? runtime.slice(0, 8) : 'unknown'} · ${channel || 'production'} channel`;
}

/**
 * New versions arrive over the air: checked when the app opens, and here on demand
 * (Settings › About and legal). The runtime and data versions are in Settings › Developer.
 */
export function AppUpdates() {
  const [state, setState] = useState<'idle' | 'checking' | 'none' | 'ready' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const enabled = Platform.OS !== 'web' && Updates.isEnabled;

  async function check() {
    setState('checking');
    setError(null);
    try {
      const r = await Updates.checkForUpdateAsync();
      if (!r.isAvailable) {
        setState('none');
        return;
      }
      await Updates.fetchUpdateAsync();
      setState('ready');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setState('error');
    }
  }

  if (state === 'ready') return <Button label="Restart to update" block onPress={() => Updates.reloadAsync()} />;
  return (
    <View style={{ gap: SPACING.xs }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
        <Button label="Check for updates" tier="secondary" size="sm" busy={state === 'checking'} disabled={!enabled} hint="Updates work in the installed iPhone app, not in this preview." onPress={check} />
        {state === 'none' ? <Tag label="Up to date" tone="success" /> : null}
      </View>
      {state === 'error' ? <ErrorState title={`Couldn't check: ${error ?? 'try again later'}`} onRetry={check} /> : null}
    </View>
  );
}

/** For Settings › Developer: when this update was made, the runtime and channel, and the car and bike list. */
export function updateDetails(): string[] {
  const when = Updates.createdAt ? Updates.createdAt.toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : null;
  return [
    when ? `Running the update from ${when}` : 'Running the version built into this install',
    runtimeLine(Updates.runtimeVersion, Updates.channel),
    `Car and bike list ${VEHICLES_VERSION}`,
  ];
}
