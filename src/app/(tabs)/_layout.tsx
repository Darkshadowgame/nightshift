import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { screenHeader, TAB_BAR_HEIGHT } from '../../components/ds';
import { Pin, type Glyph } from '../../components/Pin';
import { tabLabelStyle } from '../../lib/tabLabel';
import { useCommunity } from '../../lib/communityStore';
import { COLOR, TYPE_SCALE } from '../../theme';

/** Tab icons have their own glyphs: none is a map layer's (REVIEW-5 M12). */
function icon(glyph: Glyph) {
  return ({ color }: { color: unknown }) => <Pin glyph={glyph} colour={typeof color === 'string' ? color : COLOR.text.secondary} size={26} />;
}

/**
 * Four tabs (docs/SPEC.md, "What's on tonight near me, and go with my car"):
 * Tonight (the map and the list of what's on), Community, Garage and Me.
 * One header on every tab (Redesign 2, 4.1): caps title on the left; on the right "+" (only on
 * Tonight, Community and Garage) then the bell, always in that order, never a text action.
 * Screens add their "+" with `screenHeader({ add })` / `HeaderActions add`. The one number badge
 * is on Community (unread messages plus requests), red (`COLOR.badge`), never sodium (4.8).
 * Tab names read out in the same case ("Community, 5 new").
 */
export default function TabsLayout() {
  // Unread messages and connection requests waiting for you.
  const { badge } = useCommunity();
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: COLOR.surface.bg },
        headerTintColor: COLOR.text.primary,
        // The same size as the stack headers (_layout.tsx).
        headerTitleStyle: { fontFamily: TYPE_SCALE.heading.fontFamily, fontSize: TYPE_SCALE.heading.fontSize, textTransform: 'uppercase' },
        headerTitleAllowFontScaling: false,
        headerShadowVisible: false,
        tabBarStyle: { backgroundColor: COLOR.surface.bg, borderTopColor: COLOR.surface.border, height: TAB_BAR_HEIGHT + insets.bottom },
        tabBarActiveTintColor: COLOR.action.selected,
        tabBarInactiveTintColor: COLOR.text.secondary,
        // Like the iOS tab bar, the labels keep their size at large text (the screens above them grow),
        // and the bar is TAB_BAR_HEIGHT (54) so the label line has room even at 1.3x (Review 14).
        tabBarAllowFontScaling: false,
        // The bar gives the label 10 pt under a 28 pt icon box; capitals at 11 pt need 12. The icons are 26 pt,
        // so the box shrinks to fit them and the line is set to 12 (no descenders in capitals): nothing clipped (B6).
        tabBarLabelStyle: tabLabelStyle(),
        tabBarIconStyle: { height: 26 },
        sceneStyle: { backgroundColor: COLOR.surface.bg },
      }}
    >
      {/* Tonight draws its own header (search, map or list, + and the bell). */}
      <Tabs.Screen name="index" options={{ title: 'Tonight', headerShown: false, tabBarIcon: icon('map'), tabBarAccessibilityLabel: 'Tonight' }} />
      <Tabs.Screen
        name="community"
        options={{
          ...screenHeader({ title: 'Community', bell: true }),
          tabBarIcon: icon('community'),
          tabBarAccessibilityLabel: badge > 0 ? `Community, ${badge} new` : 'Community',
          tabBarBadge: badge > 0 ? (badge > 99 ? '99+' : badge) : undefined,
          tabBarBadgeStyle: { backgroundColor: COLOR.badge.bg, color: COLOR.badge.fg, fontFamily: TYPE_SCALE.tag.fontFamily },
        }}
      />
      <Tabs.Screen name="garage" options={{ ...screenHeader({ title: 'Garage', bell: true }), tabBarIcon: icon('car'), tabBarAccessibilityLabel: 'Garage' }} />
      <Tabs.Screen name="me" options={{ ...screenHeader({ title: 'Me', bell: true }), tabBarIcon: icon('me'), tabBarAccessibilityLabel: 'Me' }} />
    </Tabs>
  );
}
