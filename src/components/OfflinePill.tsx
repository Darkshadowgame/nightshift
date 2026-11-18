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
export function OfflinePill() {
  const { backend, online, ready, pendingWrites } = useStore();
  const insets = useSafeAreaInsets();
  if (backend !== 'supabase' || !ready || online) return null;
  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', top: insets.top + SPACING.xs, left: 0, right: 0, alignItems: 'center' }}
      accessibilityLiveRegion="polite"
      accessibilityLabel={`Offline. Showing saved data.${pendingWrites ? ` ${pendingWrites} changes waiting to send.` : ''}`}
    >
      <View style={{ backgroundColor: COLOR.surface.raised, borderColor: COLOR.state.warning, borderWidth: 1, borderRadius: RADII.pill, paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs }}>
        <DsText v="tag" tone="primary">
          Offline{pendingWrites ? ` · ${pendingWrites} waiting` : ''}
        </DsText>
      </View>
    </View>
  );
}
