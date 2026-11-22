import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../lib/store';
import { COLOR, RADII, SPACING } from '../theme';
import { DsText } from './ds';

/**
 * Signed in and the server can't be reached: a small pill at the top. The app
 * keeps showing what it last saw; chat, garage edits and "mark read" queue up
 * and are sent when the connection's back. Never shown in the demo.
 */
/** The one calm line for no signal. Meets, saved drives and favourites open from what the phone already holds. */
export const OFFLINE_LINE = "You're offline. Showing what's saved on this phone.";

export function OfflinePill() {
  const { backend, online, ready, pendingWrites } = useStore();
  const insets = useSafeAreaInsets();
  if (backend !== 'supabase' || !ready || online) return null;
  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', top: insets.top + SPACING.xs, left: 0, right: 0, alignItems: 'center' }}
      accessibilityLiveRegion="polite"
      accessibilityLabel={`${OFFLINE_LINE}${pendingWrites ? ` ${pendingWrites} changes waiting to send.` : ''}`}
    >
      <View style={{ marginHorizontal: SPACING.screen, backgroundColor: COLOR.surface.raised, borderColor: COLOR.state.warning, borderWidth: 1, borderRadius: RADII.card, paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs }}>
        <DsText v="tag" tone="primary" style={{ textAlign: "center" }}>
          {OFFLINE_LINE}
          {pendingWrites ? ` ${pendingWrites} waiting to send.` : ''}
        </DsText>
      </View>
    </View>
  );
}
