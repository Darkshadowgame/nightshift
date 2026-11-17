// Each weight from its own subpath: the package roots require every weight (46 font files);
// the app uses these 9, so only these ship.
import { Barlow_400Regular } from '@expo-google-fonts/barlow/400Regular';
import { Barlow_500Medium } from '@expo-google-fonts/barlow/500Medium';
import { Barlow_600SemiBold } from '@expo-google-fonts/barlow/600SemiBold';
import { BarlowCondensed_600SemiBold } from '@expo-google-fonts/barlow-condensed/600SemiBold';
import { BarlowCondensed_700Bold } from '@expo-google-fonts/barlow-condensed/700Bold';
import { ChakraPetch_600SemiBold } from '@expo-google-fonts/chakra-petch/600SemiBold';
import { ChakraPetch_600SemiBold_Italic } from '@expo-google-fonts/chakra-petch/600SemiBold_Italic';
import { ChakraPetch_700Bold } from '@expo-google-fonts/chakra-petch/700Bold';
import { ChakraPetch_700Bold_Italic } from '@expo-google-fonts/chakra-petch/700Bold_Italic';
import { useFonts } from 'expo-font';
import { router, Stack, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { onNotificationTap } from '../lib/notify';
import { StoreProvider, useStore } from '../lib/store';
import { C, F } from '../theme';

function Gate() {
  const { ready, onboarded } = useStore();
  // Tapping a reminder opens its event (also when the tap launched the app).
  useEffect(() => {
    if (!ready || !onboarded) return;
    return onNotificationTap((url) => router.push(url as Href));
  }, [ready, onboarded]);
  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: C.asphalt, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={C.sodium} />
      </View>
    );
  }
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: C.asphalt },
        headerTintColor: C.chalk,
        // Titles are written in capitals, like the tab headers (native stack headers can't transform text).
        headerTitleStyle: { fontFamily: F.display, fontSize: 17 },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: C.asphalt },
        headerBackButtonDisplayMode: 'minimal',
      }}
    >
      <Stack.Protected guard={!onboarded}>
        <Stack.Screen name="welcome" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={onboarded}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="event/[id]" options={{ title: '' }} />
        <Stack.Screen name="event/new" options={{ title: 'HOST AN EVENT', presentation: 'modal' }} />
        <Stack.Screen name="event/edit" options={{ title: 'EDIT EVENT', presentation: 'modal' }} />
        <Stack.Screen name="event/plan" options={{ title: 'CHANGE THE PLAN' }} />
        <Stack.Screen name="build/[id]" options={{ title: '' }} />
        <Stack.Screen name="build/edit" options={{ title: 'BUILD', presentation: 'modal' }} />
        <Stack.Screen name="user/[id]" options={{ title: '' }} />
        <Stack.Screen name="profile" options={{ title: 'YOUR PROFILE', presentation: 'modal' }} />
        <Stack.Screen name="spot/[id]" options={{ title: '' }} />
        <Stack.Screen name="spot/new" options={{ title: 'SUGGEST A PLACE', presentation: 'modal' }} />
        <Stack.Screen name="shop/[id]" options={{ title: '' }} />
        <Stack.Screen name="crews" options={{ title: 'CREWS' }} />
        <Stack.Screen name="crew/[id]" options={{ title: '' }} />
        <Stack.Screen name="crew/new" options={{ title: 'START A CREW', presentation: 'modal' }} />
        <Stack.Screen name="notifications" options={{ title: 'NOTIFICATIONS' }} />
        <Stack.Screen name="find" options={{ title: 'FIND EVENTS' }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    Barlow_400Regular,
    Barlow_500Medium,
    Barlow_600SemiBold,
    BarlowCondensed_600SemiBold,
    BarlowCondensed_700Bold,
    ChakraPetch_600SemiBold,
    ChakraPetch_700Bold,
    ChakraPetch_600SemiBold_Italic,
    ChakraPetch_700Bold_Italic,
  });
  if (!loaded) return <View style={{ flex: 1, backgroundColor: C.asphalt }} />;
  return (
    <StoreProvider>
      <StatusBar style="light" />
      <Gate />
    </StoreProvider>
  );
}
