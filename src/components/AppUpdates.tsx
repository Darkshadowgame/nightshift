import Constants from 'expo-constants';
import * as Updates from 'expo-updates';
import { useState } from 'react';
import { Platform } from 'react-native';
import { C } from '../theme';
import { Button, Card, Row, Txt } from './ui';

/** Short, readable version line: app version · update id · when it was published. */
export function versionLine(): string {
  const version = Constants.expoConfig?.version ?? '1.0.0';
  const id = Updates.updateId ? Updates.updateId.slice(0, 8) : null;
  return id ? `Nightshift ${version} · update ${id}` : `Nightshift ${version} · built-in`;
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
