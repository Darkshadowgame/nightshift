import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../lib/store';
import { C, F } from '../theme';
import { Txt } from './ui';

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
      style={{ position: 'absolute', top: insets.top + 4, left: 0, right: 0, alignItems: 'center' }}
      accessibilityLiveRegion="polite"
      accessibilityLabel={`Offline. Showing saved data.${pendingWrites ? ` ${pendingWrites} changes waiting to send.` : ''}`}
    >
      <View style={{ backgroundColor: C.kerb, borderColor: C.alert, borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4 }}>
        <Txt style={{ fontFamily: F.display, fontSize: 12, color: C.chalk }}>
          OFFLINE{pendingWrites ? ` · ${pendingWrites} WAITING` : ''}
        </Txt>
      </View>
    </View>
  );
}
