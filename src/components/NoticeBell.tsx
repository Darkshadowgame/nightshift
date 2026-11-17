import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useStore } from '../lib/store';
import { C, F } from '../theme';

export function BellIcon({ colour = C.chalk, size = 22 }: { colour?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M6 17V11a6 6 0 0 1 12 0v6l1.5 2h-15z" fill="none" stroke={colour} strokeWidth={2} strokeLinejoin="round" />
      <Path d="M10 21h4" stroke={colour} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

/** Bell with an unread count. Opens the notifications list. */
export function NoticeBell({ boxed }: { boxed?: boolean }) {
  const { notices } = useStore();
  const unread = notices.filter((n) => !n.read).length;
  return (
    <Pressable
      onPress={() => router.push('/notifications')}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={unread > 0 ? `Notifications, ${unread} new` : 'Notifications'}
      style={({ pressed }) => [
        { width: 38, height: 34, alignItems: 'center', justifyContent: 'center' },
        boxed && { backgroundColor: 'rgba(11,15,23,0.88)', borderColor: C.kerb, borderWidth: 1, borderRadius: 6 },
        pressed && { opacity: 0.7 },
      ]}
    >
      <BellIcon colour={unread > 0 ? C.sodium : C.chalk} />
      {unread > 0 ? (
        <View
          style={{
            position: 'absolute', top: -5, right: -6, minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 4,
            backgroundColor: C.sodium, alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Text style={{ fontFamily: F.labelBold, fontSize: 11, color: C.ink }}>{unread > 9 ? '9+' : unread}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}
