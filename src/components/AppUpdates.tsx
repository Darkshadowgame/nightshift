import Constants from 'expo-constants';
import * as Updates from 'expo-updates';
import { useState } from 'react';
import { Platform } from 'react-native';
import { C } from '../theme';
import { Button, Card, Row, Txt } from './ui';

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
 * (copied from Caristini's Settings › App updates).
 */
export function AppUpdates() {
  const [state, setState] = useState<'idle' | 'checking' | 'none' | 'ready' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const enabled = Platform.OS !== 'web' && Updates.isEnabled;
  const when = Updates.createdAt ? Updates.createdAt.toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : null;

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

  return (
    <Card>
      <Txt>{versionLine()}</Txt>
      <Txt v="muted">{when ? `Running the update from ${when}` : 'Running the version built into this install'}</Txt>
      {enabled ? (
        <Txt v="muted" style={{ fontSize: 11 }} selectable>
          {runtimeLine(Updates.runtimeVersion, Updates.channel)}
        </Txt>
      ) : null}
      {state === 'ready' ? (
        <Button label="Restart to update" kind="neon" onPress={() => Updates.reloadAsync()} />
      ) : (
        <Row style={{ flexWrap: 'nowrap', justifyContent: 'space-between' }}>
          <Button
            label={state === 'checking' ? 'Checking…' : 'Check for updates'}
            kind="ghost"
            onPress={check}
            disabled={!enabled || state === 'checking'}
            style={{ flex: 1 }}
          />
          {state === 'none' ? <Txt v="label" style={{ color: C.lime, marginLeft: 12 }}>Up to date</Txt> : null}
          {state === 'error' ? <Txt v="label" style={{ color: C.alert, marginLeft: 12 }}>Couldn't check</Txt> : null}
        </Row>
      )}
      {error ? <Txt v="muted" style={{ fontSize: 12 }}>{error}</Txt> : null}
      <Txt v="muted" style={{ fontSize: 12 }}>
        {enabled
          ? 'New versions download by themselves when the app opens and apply the next time it starts. A free Apple ID install still needs signing again every 7 days.'
          : 'Updates work in the installed iPhone app, not in this preview.'}
      </Txt>
    </Card>
  );
}
