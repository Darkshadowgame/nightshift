import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useStore } from '../lib/store';
import { C, COLOR, RADII, SPACING, SURFACE } from '../theme';
import { DsText } from './ds/Text';

export function BellIcon({ colour = C.chalk, size = 22 }: { colour?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M6 17V11a6 6 0 0 1 12 0v6l1.5 2h-15z" fill="none" stroke={colour} strokeWidth={2} strokeLinejoin="round" />
      <Path d="M10 21h4" stroke={colour} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

/** Bell with an unread count (Redesign 2, 4.8: a chalk bell, a red badge, never sodium). Opens the notifications list. */
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
        boxed && { backgroundColor: SURFACE.glass, borderColor: C.kerb, borderWidth: 1, borderRadius: RADII.control },
        pressed && { opacity: 0.8 },
      ]}
    >
      <BellIcon colour={C.chalk} />
      {unread > 0 ? (
        <View
          style={{
            // Inside the bell's own box, so it never touches the screen edge (REVIEW-8, large text).
            position: 'absolute', top: boxed ? -5 : 2, right: boxed ? -6 : 2, minWidth: 18, height: 18, borderRadius: RADII.pill, paddingHorizontal: SPACING.xs,
            backgroundColor: COLOR.badge.bg, alignItems: 'center', justifyContent: 'center',
          }}
        >
          {/* A fixed mark, like an avatar: it doesn't grow with the text size. */}
          <DsText v="tag" style={{ letterSpacing: 0, color: COLOR.badge.fg }} allowFontScaling={false}>
            {unread > 9 ? '9+' : unread}
          </DsText>
        </View>
      ) : null}
    </Pressable>
  );
}
