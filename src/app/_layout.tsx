import { Barlow_400Regular, Barlow_500Medium, Barlow_600SemiBold } from '@expo-google-fonts/barlow';
import { BarlowCondensed_600SemiBold, BarlowCondensed_700Bold } from '@expo-google-fonts/barlow-condensed';
import { ChakraPetch_600SemiBold, ChakraPetch_700Bold } from '@expo-google-fonts/chakra-petch';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { StoreProvider, useStore } from '../lib/store';
import { C, F } from '../theme';

function Gate() {
  const { ready, onboarded } = useStore();
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
        <Stack.Screen name="event/new" options={{ title: 'Host an event', presentation: 'modal' }} />
        <Stack.Screen name="event/edit" options={{ title: 'Edit event', presentation: 'modal' }} />
        <Stack.Screen name="event/plan" options={{ title: 'Change the plan' }} />
        <Stack.Screen name="build/[id]" options={{ title: '' }} />
        <Stack.Screen name="build/edit" options={{ title: 'Build', presentation: 'modal' }} />
        <Stack.Screen name="user/[id]" options={{ title: '' }} />
        <Stack.Screen name="profile" options={{ title: 'Your profile', presentation: 'modal' }} />
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
  });
  if (!loaded) return <View style={{ flex: 1, backgroundColor: C.asphalt }} />;
  return (
    <StoreProvider>
      <StatusBar style="light" />
      <Gate />
    </StoreProvider>
  );
}
