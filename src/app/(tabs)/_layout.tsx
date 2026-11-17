import { Tabs } from 'expo-router';
import { Pin, type Glyph } from '../../components/Pin';
import { BRAND, C, F } from '../../theme';

/** Tab icons have their own glyphs: none is a map layer's (REVIEW-5 M12). */
function icon(glyph: Glyph) {
  return ({ color }: { color: unknown }) => <Pin glyph={glyph} colour={typeof color === 'string' ? color : C.fog} size={26} />;
}

export default function TabsLayout() {
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
        tabBarLabelStyle: { fontFamily: F.label, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' },
        sceneStyle: { backgroundColor: C.asphalt },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Map', headerShown: false, tabBarIcon: icon('map') }} />
      <Tabs.Screen name="events" options={{ title: 'Events', tabBarIcon: icon('calendar') }} />
      <Tabs.Screen name="garage" options={{ title: 'Garage', tabBarIcon: icon('car') }} />
      <Tabs.Screen name="me" options={{ title: 'Me', tabBarIcon: icon('me') }} />
    </Tabs>
  );
}
