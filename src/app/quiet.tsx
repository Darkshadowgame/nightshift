import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Callout } from '../components/Detail';
import { ActionBar, Card, DsText, ErrorState, PAGE_WITH_BAR } from '../components/ds';
import { useQuietAlert } from '../lib/useTrust';
import { useStore } from '../lib/store';
import { COLOR, SPACING } from '../theme';

/**
 * "This is getting out of hand": a quiet way to tell the host and Slipstream's team that a meet
 * has gone wrong. Built on the report system: staff get it as a report on the meet, the host gets a
 * notice. Nobody else at the meet is told, and the host's notice never says who sent it.
 */
export default function Quiet() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { events } = useStore();
  const event = events.find((e) => e.id === id);
  const quiet = useQuietAlert(id ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send() {
    setBusy(true);
    setError(null);
    try {
      await quiet.send();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't send that. If someone is in danger, call 999.");
    } finally {
      setBusy(false);
    }
  }

  if (quiet.sent) {
    return (
      <View style={{ flex: 1, backgroundColor: COLOR.surface.bg }}>
        <View style={{ flex: 1, padding: SPACING.screen, gap: SPACING.lg }}>
          <Callout tone="success" title="Alert sent">
            <DsText v="body">The host and the Slipstream team have it. Nobody else at the meet knows it was you.</DsText>
            <DsText v="caption">If anyone is in danger, call 999. You can also leave the meet from the menu.</DsText>
          </Callout>
        </View>
        <ActionBar primary={{ label: 'Done', onPress: () => router.back() }} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLOR.surface.bg }}>
      <ScrollView contentContainerStyle={PAGE_WITH_BAR}>
        <DsText v="titleLg" accessibilityRole="header">
          This is getting out of hand
        </DsText>
        {event ? <DsText v="secondary">{event.title}</DsText> : null}
        <Card>
          <DsText v="body">This tells the host and the Slipstream team that the meet needs looking at.</DsText>
          <DsText v="caption">Nobody else going is told, and the host is not told it was you. If anyone is in danger, call 999.</DsText>
        </Card>
        {!quiet.live ? <ErrorState title="Quiet alerts aren't switched on yet. Report the meet from the menu instead." /> : null}
        {error ? <ErrorState title={error} /> : null}
      </ScrollView>
      <ActionBar primary={quiet.live ? { label: 'Send alert', onPress: () => void send(), busy, haptic: 'success' } : { label: 'Back', onPress: () => router.back() }} />
    </View>
  );
}
