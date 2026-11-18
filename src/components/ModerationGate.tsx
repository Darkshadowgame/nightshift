import { useEffect, useState } from 'react';
import { View } from 'react-native';
import type { ModerationStatus, Warning } from '../lib/communityService';
import { useCommunity, useCommunityQuery } from '../lib/communityStore';
import { banMessage } from '../lib/moderation';
import { COLOR, RADII, SPACING } from '../theme';
import { setStaffNow } from './Community';
import { Button, DsText, Sheet, useToast } from './ds';

/**
 * Mounted once, signed in: learns whether this person is staff (for the
 * "Moderate" menu option) and shows any moderator warning they haven't
 * acknowledged yet. A warning can't be swiped away: "I understand" records it.
 */
export function ModerationGate() {
  const community = useCommunity();
  const status = useCommunityQuery((s) => s.moderationStatus(), []);
  const warnings = useCommunityQuery((s) => s.myWarnings(), []);
  const [done, setDone] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setStaffNow(!!status.data?.isStaff);
  }, [status.data?.isStaff]);

  const w: Warning | undefined = (warnings.data ?? []).find((x) => !done.includes(x.id));
  if (!w) return null;
  const ack = async () => {
    setBusy(true);
    try {
      await community.run((s) => s.acknowledgeWarning(w.id));
    } catch {
      // Shown again next time the app opens.
    } finally {
      setDone((d) => [...d, w.id]);
      setBusy(false);
    }
  };
  return (
    <Sheet visible title="Moderator warning" onClose={() => {}}>
      <View style={{ gap: SPACING.md, paddingBottom: SPACING.md }}>
        <DsText v="bodyStrong">A moderator warned you: {w.reason}</DsText>
        {w.note ? <DsText v="secondary">{w.note}</DsText> : null}
        <DsText v="caption">Keep to the community rules. More problems can mean a ban from posting.</DsText>
        <Button label="I understand" busy={busy} onPress={ack} />
      </View>
    </Sheet>
  );
}

/** Your own ban, with when it ends: on the Community screens. Nothing when you're not banned. */
export function BanBanner({ status }: { status: ModerationStatus | null | undefined }) {
  if (!status?.suspended) return null;
  const text = status.message ?? banMessage(status.scope ?? 'full', status.until, status.reason ?? null);
  return (
    <View
      accessibilityRole="alert"
      style={{ borderColor: COLOR.state.warning, borderWidth: 1, borderRadius: RADII.card, padding: SPACING.md, gap: SPACING.xxs, backgroundColor: COLOR.surface.card }}
    >
      <DsText v="bodyStrong" tone="warning">
        {status.scope === 'community' ? 'Community ban' : 'Account suspended'}
      </DsText>
      <DsText v="secondary">{text}</DsText>
      {status.scope === 'community' ? <DsText v="caption">You can still read, use the map, events and your garage, and message your connections.</DsText> : null}
    </View>
  );
}

/**
 * "Bex accepted your request. You can message now." as a toast when it happens (REVIEW-9 decision 15).
 * The same line lands under the bell (communityStore). Mounted inside the ToastProvider.
 */
export function ConnectionToasts() {
  const { accepted } = useCommunity();
  const toast = useToast();
  useEffect(() => {
    if (accepted) toast({ message: accepted.text });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accepted?.n]);
  return null;
}
