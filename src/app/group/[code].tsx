import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { GroupConsentText } from '../../components/GroupDrive';
import { ActionBar, Card, DsText, ErrorState, PAGE_WITH_BAR, useToast } from '../../components/ds';
import { appNow } from '../../lib/appClock';
import { groupChipText, GROUP_CONSENT, normaliseCode } from '../../lib/groupLive';
import { useGroupDrive, type GroupPreview } from '../../lib/groupDriveStore';
import { planForEvent, planForSpot, targetParams } from '../../lib/navPlan';
import { useStore } from '../../lib/store';
import { COLOR, SPACING } from '../../theme';

/**
 * A group drive's join link (nightshift://group/<code>): who started it, how many are in, the
 * consent, and one action. Joining shares your live location with the group until the drive ends.
 */
export default function JoinGroupDrive() {
  const { code: raw } = useLocalSearchParams<{ code: string }>();
  const code = normaliseCode(raw);
  const drive = useGroupDrive();
  const { events, spots, me, crews, setSettings } = useStore();
  const toast = useToast();
  const [preview, setPreview] = useState<GroupPreview | null>(null);
  const [error, setError] = useState<string | null>(code ? null : 'That group drive link isn’t right.');
  const [busy, setBusy] = useState(false);
  const { preview: load } = drive;

  useEffect(() => {
    if (!code) return;
    let live = true;
    load(code)
      .then((p) => live && setPreview(p))
      .catch((e) => live && setError(e instanceof Error ? e.message : 'Couldn’t open that group drive.'));
    return () => {
      live = false;
    };
  }, [code, load]);

  async function join() {
    if (!code || busy) return;
    setBusy(true);
    setError(null);
    try {
      const g = await drive.join(code);
      setSettings({ groupDriveAgreed: true });
      toast({ message: 'You’re in the group drive' });
      const ev = g.targetKind === 'event' ? events.find((e) => e.id === g.targetId) : null;
      const spot = g.targetKind === 'spot' ? spots.find((s) => s.id === g.targetId) : null;
      const canDrive = (ev && planForEvent(ev, me, crews, appNow())) || (spot && planForSpot(spot));
      if (canDrive) router.replace({ pathname: '/drive', params: targetParams({ kind: ev ? 'event' : 'spot', id: g.targetId! }) });
      else router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Couldn’t join that group drive.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLOR.surface.bg }}>
      <ScrollView contentContainerStyle={PAGE_WITH_BAR}>
        <DsText v="titleLg" accessibilityRole="header">
          Join the group drive
        </DsText>
        {preview ? (
          <Card>
            <DsText v="title">{preview.title}</DsText>
            <DsText v="secondary">{`${preview.leaderHandle ? `Started by ${preview.leaderHandle} · ` : ''}${groupChipText(preview.memberCount)}`}</DsText>
          </Card>
        ) : null}
        <View style={{ gap: SPACING.sm }}>
          <DsText v="heading">{GROUP_CONSENT.title}</DsText>
          <GroupConsentText />
        </View>
        {error ? <ErrorState title={error} /> : null}
      </ScrollView>
      <ActionBar primary={error && !preview ? { label: 'Back', onPress: () => router.back() } : { label: GROUP_CONSENT.join, onPress: () => void join(), busy, haptic: 'success' }} />
    </View>
  );
}
