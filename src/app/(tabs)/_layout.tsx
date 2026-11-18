import { Tabs } from 'expo-router';
import { Pin, type Glyph } from '../../components/Pin';
import { useCommunity } from '../../lib/communityStore';
import { BRAND, C, F } from '../../theme';

/** Tab icons have their own glyphs: none is a map layer's (REVIEW-5 M12). */
function icon(glyph: Glyph) {
  return ({ color }: { color: unknown }) => <Pin glyph={glyph} colour={typeof color === 'string' ? color : C.fog} size={26} />;
}

export default function TabsLayout() {
  // Unread messages and connection requests waiting for you.
  const { badge } = useCommunity();
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: C.asphalt },
        headerTintColor: C.chalk,
        // The same size as the stack headers (_layout.tsx).
        headerTitleStyle: { fontFamily: F.display, fontSize: 17, textTransform: 'uppercase' },
        headerTitleAllowFontScaling: false,
        headerShadowVisible: false,
        tabBarStyle: { backgroundColor: C.asphalt, borderTopColor: C.kerb },
        tabBarActiveTintColor: BRAND,
        tabBarInactiveTintColor: C.fog,
        tabBarAllowFontScaling: true,
        // The bar gives the label 10 pt under a 28 pt icon box; capitals at 11 pt need 12. The icons are 26 pt,
        // so the box shrinks to fit them and the line is set to 12 (no descenders in capitals): nothing clipped (B6).
        tabBarLabelStyle: { fontFamily: F.label, fontSize: 11, lineHeight: 12, letterSpacing: 1, textTransform: 'uppercase' },
        tabBarIconStyle: { height: 26 },
        sceneStyle: { backgroundColor: C.asphalt },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Map', headerShown: false, tabBarIcon: icon('map') }} />
      <Tabs.Screen name="events" options={{ title: 'Events', tabBarIcon: icon('calendar') }} />
      <Tabs.Screen name="community" options={{ title: 'Community', tabBarIcon: icon('community'), tabBarBadge: badge > 0 ? (badge > 99 ? '99+' : badge) : undefined, tabBarBadgeStyle: { backgroundColor: BRAND, color: C.ink, fontFamily: F.labelBold } }} />
      <Tabs.Screen name="garage" options={{ title: 'Garage', tabBarIcon: icon('car') }} />
      <Tabs.Screen name="me" options={{ title: 'Me', tabBarIcon: icon('me') }} />
    </Tabs>
  );
}
