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
import { OfflinePill } from '../components/OfflinePill';
import { AuthProvider, useAuth } from '../lib/auth';
import { SCREEN_TITLES as T, title } from '../lib/glossary';
import { onNotificationTap } from '../lib/notify';
import { RoadsProvider } from '../lib/roadStore';
import { CommunityProvider } from '../lib/communityStore';
import { StoreProvider, useStore } from '../lib/store';
import { C, F } from '../theme';

function Gate() {
  const auth = useAuth();
  const { ready, onboarded: profileDone } = useStore();
  const signedOut = auth.status === 'signedOut';
  // Signed out: only the sign-in screen. Then the profile on first run, then the app.
  const onboarded = !signedOut && profileDone;
  // Tapping a reminder opens its event (also when the tap launched the app).
  useEffect(() => {
    if (!ready || !onboarded) return;
    return onNotificationTap((url) => router.push(url as Href));
  }, [ready, onboarded]);
  if (auth.status === 'loading' || !ready) {
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
        // One size for tab and stack headers. Titles come from title() in glossary.ts, in capitals
        // (native stack headers can't transform text). Detail screens are blank: their hero carries the title.
        headerTitleStyle: { fontFamily: F.display, fontSize: 17 },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: C.asphalt },
        headerBackButtonDisplayMode: 'minimal',
      }}
    >
      {/* Feedback works for everyone: signed out (the sign-in screen), the demo and signed in. */}
      <Stack.Screen name="feedback" options={{ title: title(T.feedback), presentation: 'modal' }} />
      <Stack.Protected guard={signedOut}>
        <Stack.Screen name="signin" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={!signedOut && !onboarded}>
        <Stack.Screen name="welcome" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={onboarded}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="event/[id]" options={{ title: '' }} />
        <Stack.Screen name="event/new" options={{ title: title(T.hostEvent), presentation: 'modal' }} />
        <Stack.Screen name="event/edit" options={{ title: title(T.editEvent), presentation: 'modal' }} />
        <Stack.Screen name="event/plan" options={{ title: title(T.changePlan) }} />
        <Stack.Screen name="build/[id]" options={{ title: '' }} />
        {/* build/edit sets "Edit build" itself when it opens an existing build. */}
        <Stack.Screen name="build/edit" options={{ title: title(T.addBuild), presentation: 'modal' }} />
        <Stack.Screen name="user/[id]" options={{ title: '' }} />
        <Stack.Screen name="profile" options={{ title: title(T.profile), presentation: 'modal' }} />
        <Stack.Screen name="spot/[id]" options={{ title: '' }} />
        <Stack.Screen name="spot/new" options={{ title: title(T.suggest), presentation: 'modal' }} />
        <Stack.Screen name="shop/[id]" options={{ title: '' }} />
        <Stack.Screen name="zone/[id]" options={{ title: '' }} />
        <Stack.Screen name="crews" options={{ title: title(T.crews) }} />
        <Stack.Screen name="crew/[id]" options={{ title: '' }} />
        <Stack.Screen name="crew/new" options={{ title: title(T.newCrew), presentation: 'modal' }} />
        <Stack.Screen name="notifications" options={{ title: title(T.notifications) }} />
        <Stack.Screen name="find" options={{ title: title(T.find) }} />
        <Stack.Screen name="where" options={{ title: title(T.whereTo) }} />
        <Stack.Screen name="settings" options={{ title: title(T.settings) }} />
        <Stack.Screen name="post/[id]" options={{ title: '' }} />
        <Stack.Screen name="post/new" options={{ title: title(T.newPost), presentation: 'modal' }} />
        <Stack.Screen name="forum/[id]" options={{ title: '' }} />
        <Stack.Screen name="forum/new" options={{ title: title(T.newThread), presentation: 'modal' }} />
        <Stack.Screen name="chat/[id]" options={{ title: '' }} />
        <Stack.Screen name="chat/new" options={{ title: title(T.newChat), presentation: 'modal' }} />
        <Stack.Screen name="chat/info" options={{ title: title(T.groupInfo) }} />
        <Stack.Screen name="connections" options={{ title: title(T.connections) }} />
        <Stack.Screen name="report" options={{ title: title(T.report), presentation: 'modal' }} />
        <Stack.Screen name="rate" options={{ title: title(T.rateBuilds) }} />
        <Stack.Screen name="moderation" options={{ title: title(T.moderation) }} />
        <Stack.Screen name="drive" options={{ headerShown: false, presentation: 'fullScreenModal', gestureEnabled: false }} />
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
    <AuthProvider>
      <StoreProvider>
        <RoadsProvider>
          <CommunityProvider>
            <StatusBar style="light" />
            <Gate />
            <OfflinePill />
          </CommunityProvider>
        </RoadsProvider>
      </StoreProvider>
    </AuthProvider>
  );
}
