import { Tabs } from 'expo-router';
import { Pin, type Glyph } from '../../components/Pin';
import { C, F } from '../../theme';

function icon(glyph: Glyph) {
  return ({ color }: { color: unknown }) => <Pin glyph={glyph} colour={typeof color === "string" ? color : C.fog} size={26} />;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: C.asphalt },
        headerTintColor: C.chalk,
        headerTitleStyle: { fontFamily: F.display, fontSize: 18, textTransform: 'uppercase' },
        headerShadowVisible: false,
        tabBarStyle: { backgroundColor: C.asphalt, borderTopColor: C.kerb },
        tabBarActiveTintColor: C.sodium,
        tabBarInactiveTintColor: C.fog,
        tabBarLabelStyle: { fontFamily: F.label, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' },
        sceneStyle: { backgroundColor: C.asphalt },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Map', headerShown: false, tabBarIcon: icon('you') }} />
      <Tabs.Screen
        name="events"
        options={{ title: 'Events', tabBarIcon: icon('meet') }}
      />
      <Tabs.Screen name="garage" options={{ title: 'Garage', tabBarIcon: icon('track') }} />
      <Tabs.Screen name="me" options={{ title: 'Me', tabBarIcon: icon('area') }} />
    </Tabs>
  );
}
