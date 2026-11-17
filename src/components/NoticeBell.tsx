import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useStore } from '../lib/store';
import { BRAND, C, F, FONT_SCALE, RADIUS, SURFACE, TYPE } from '../theme';

export function BellIcon({ colour = C.chalk, size = 22 }: { colour?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M6 17V11a6 6 0 0 1 12 0v6l1.5 2h-15z" fill="none" stroke={colour} strokeWidth={2} strokeLinejoin="round" />
      <Path d="M10 21h4" stroke={colour} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

/** Bell with an unread count. Opens the notifications list. */
export function NoticeBell({ boxed, size = 44 }: { boxed?: boolean; size?: number }) {
  const { notices } = useStore();
  const unread = notices.filter((n) => !n.read).length;
  return (
    <Pressable
      onPress={() => router.push('/notifications')}
      hitSlop={4}
      accessibilityRole="button"
      accessibilityLabel={unread > 0 ? `Notifications, ${unread} new` : 'Notifications'}
      style={({ pressed }) => [
        { width: size, height: size, alignItems: 'center', justifyContent: 'center' },
        // On the map: the same 44 pt rounded square as every map button.
        boxed && { backgroundColor: SURFACE.glass, borderColor: C.kerb, borderWidth: 1, borderRadius: RADIUS.card },
        pressed && { opacity: 0.8 },
      ]}
    >
      <BellIcon colour={unread > 0 ? BRAND : C.chalk} />
      {unread > 0 ? (
        <View
          style={{
            position: 'absolute', top: boxed ? -5 : 2, right: boxed ? -6 : 0, minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 4,
            backgroundColor: BRAND, alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Text maxFontSizeMultiplier={FONT_SCALE.chrome} style={{ fontFamily: F.labelBold, fontSize: TYPE.micro, color: C.ink }}>{unread > 9 ? '9+' : unread}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}
