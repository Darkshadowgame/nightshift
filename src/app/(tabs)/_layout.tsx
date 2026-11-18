import { Tabs } from 'expo-router';
import { screenHeader } from '../../components/ds';
import { Pin, type Glyph } from '../../components/Pin';
import { useCommunity } from '../../lib/communityStore';
import { COLOR, TYPE_SCALE } from '../../theme';

/** Tab icons have their own glyphs: none is a map layer's (REVIEW-5 M12). */
function icon(glyph: Glyph) {
  return ({ color }: { color: unknown }) => <Pin glyph={glyph} colour={typeof color === 'string' ? color : COLOR.text.secondary} size={26} />;
}

/**
 * Four tabs (docs/SPEC.md, "What's on tonight near me, and go with my car"):
 * Tonight (the map and the list of what's on), Community, Garage and Me.
 * The bell is on Tonight and Community only.
 */
export default function TabsLayout() {
  // Unread messages and connection requests waiting for you.
  const { badge } = useCommunity();
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: COLOR.surface.bg },
        headerTintColor: COLOR.text.primary,
        // The same size as the stack headers (_layout.tsx).
        headerTitleStyle: { fontFamily: TYPE_SCALE.heading.fontFamily, fontSize: TYPE_SCALE.heading.fontSize, textTransform: 'uppercase' },
        headerTitleAllowFontScaling: false,
        headerShadowVisible: false,
        tabBarStyle: { backgroundColor: COLOR.surface.bg, borderTopColor: COLOR.surface.border },
        tabBarActiveTintColor: COLOR.action.selected,
        tabBarInactiveTintColor: COLOR.text.secondary,
        tabBarAllowFontScaling: true,
        // The bar gives the label 10 pt under a 28 pt icon box; capitals at 11 pt need 12. The icons are 26 pt,
        // so the box shrinks to fit them and the line is set to 12 (no descenders in capitals): nothing clipped (B6).
        tabBarLabelStyle: { fontFamily: TYPE_SCALE.tag.fontFamily, fontSize: 11, lineHeight: 12, letterSpacing: 1, textTransform: 'uppercase' },
        tabBarIconStyle: { height: 26 },
        sceneStyle: { backgroundColor: COLOR.surface.bg },
      }}
    >
      {/* Tonight draws its own header (search, map or list, + and the bell). */}
      <Tabs.Screen name="index" options={{ title: 'Tonight', headerShown: false, tabBarIcon: icon('map') }} />
      <Tabs.Screen
        name="community"
        options={{
          ...screenHeader({ title: 'Community', bell: true }),
          tabBarIcon: icon('community'),
          tabBarBadge: badge > 0 ? (badge > 99 ? '99+' : badge) : undefined,
          tabBarBadgeStyle: { backgroundColor: COLOR.action.primary, color: COLOR.action.onPrimary, fontFamily: TYPE_SCALE.tag.fontFamily },
        }}
      />
      <Tabs.Screen name="garage" options={{ title: 'Garage', tabBarIcon: icon('car') }} />
      <Tabs.Screen name="me" options={{ ...screenHeader({ title: 'Me' }), tabBarIcon: icon('me') }} />
    </Tabs>
  );
}
