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
import { router, Stack, usePathname, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { ConnectionToasts, ModerationGate } from '../components/ModerationGate';
import { OfflinePill } from '../components/OfflinePill';
import { IconButton, ToastProvider } from '../components/ds';
import { fallbackTab, NO_BACK } from '../lib/backFallback';
import { AuthProvider, useAuth } from '../lib/auth';
import { SCREEN_TITLES as T, title } from '../lib/glossary';
import { onNotificationTap } from '../lib/notify';
import { RoadsProvider } from '../lib/roadStore';
import { CommunityProvider } from '../lib/communityStore';
import { StoreProvider, useStore } from '../lib/store';
import { C, COLOR, TYPE_SCALE } from '../theme';

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
        <ActivityIndicator color={COLOR.text.secondary} />
      </View>
    );
  }
  const stack = (
    <Stack
      screenOptions={({ navigation, route }) => ({
        // Back is always there (REVIEW-8 problem 2): with nothing behind (a link, a notification,
        // the web address bar) it goes to the screen's tab. One button everywhere, however the
        // screen was reached (REVIEW-9 decision 12): the DS back arrow, labelled "Go back".
        ...(!NO_BACK.has(route.name)
          ? {
              headerLeft: () => (
                <IconButton
                  icon="back"
                  label="Go back"
                  colour={C.chalk}
                  onPress={() => (navigation.canGoBack() ? navigation.goBack() : router.replace(fallbackTab(route.name)))}
                />
              ),
            }
          : {}),
        headerBackTitle: 'Back',
        headerStyle: { backgroundColor: C.asphalt },
        headerTintColor: C.chalk,
        // One size for tab and stack headers. Titles come from title() in glossary.ts, in capitals
        // (native stack headers can't transform text). Detail screens are blank: their hero carries the title.
        headerTitleStyle: { fontFamily: TYPE_SCALE.heading.fontFamily, fontSize: TYPE_SCALE.heading.fontSize },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: C.asphalt },
        headerBackButtonDisplayMode: 'minimal',
      })}
    >
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
        {/* Who's going: a list to read, so a push (4.5), not a sheet. */}
        <Stack.Screen name="event/going" options={{ title: title(T.going) }} />
        <Stack.Screen name="build/[id]" options={{ title: '' }} />
        <Stack.Screen name="build/power" options={{ title: title('Power and dyno') }} />
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
        {/* One search for events, places, people and addresses. Find and Where to? are old names for it. */}
        <Stack.Screen name="search" options={{ title: title(T.search) }} />
        <Stack.Screen name="find" options={{ title: title(T.search) }} />
        <Stack.Screen name="where" options={{ title: title(T.search) }} />
        {/* The old Events tab: now Tonight's list. */}
        <Stack.Screen name="events" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ title: title(T.settings) }} />
        <Stack.Screen name="help" options={{ title: title(T.help) }} />
        <Stack.Screen name="post/[id]" options={{ title: '' }} />
        <Stack.Screen name="post/new" options={{ title: title(T.newPost), presentation: 'modal' }} />
        <Stack.Screen name="forum/index" options={{ title: title('Forum and for sale') }} />
        <Stack.Screen name="forum/[id]" options={{ title: '' }} />
        <Stack.Screen name="forum/new" options={{ title: title(T.newThread), presentation: 'modal' }} />
        <Stack.Screen name="chat/[id]" options={{ title: '' }} />
        <Stack.Screen name="chat/new" options={{ title: title(T.newChat), presentation: 'modal' }} />
        <Stack.Screen name="chat/info" options={{ title: title(T.groupInfo) }} />
        <Stack.Screen name="connections" options={{ title: title(T.connections) }} />
        <Stack.Screen name="report" options={{ title: title(T.report), presentation: 'modal' }} />
        <Stack.Screen name="rate" options={{ title: title(T.rateBuilds) }} />
        <Stack.Screen name="moderation" options={{ title: title(T.moderation) }} />
        <Stack.Screen name="member/[id]" options={{ title: title('Member moderation') }} />
        <Stack.Screen name="moderation-team" options={{ title: title('Team') }} />
        <Stack.Screen name="moderation-log" options={{ title: title('Audit log') }} />
        <Stack.Screen name="drive" options={{ headerShown: false, presentation: 'fullScreenModal', gestureEnabled: false }} />
        <Stack.Screen name="credits" options={{ title: title(T.credits) }} />
      </Stack.Protected>
      {/* The design system gallery: development builds only (it redirects home in release too). */}
      <Stack.Protected guard={onboarded && __DEV__}>
        <Stack.Screen name="dev/components" options={{ title: 'COMPONENTS' }} />
      </Stack.Protected>
      {/*
        Feedback works for everyone: signed out (the sign-in screen), the demo and signed in.
        Declared last, and every other route is declared above: when the screen on show becomes
        protected (Try the demo, signing in or out), the router opens the first route still
        allowed, which must be sign-in, welcome or the map, never a modal or Credits.
      */}
      <Stack.Screen name="feedback" options={{ title: title(T.feedback), presentation: 'modal' }} />
      {/* Unknown links: the app's own "This page doesn't exist" (REVIEW-9 decision 6). The sitemap is the same screen. */}
      <Stack.Screen name="+not-found" options={{ title: '' }} />
      <Stack.Screen name="_sitemap" options={{ title: '' }} />
    </Stack>
  );
  // Staff status and moderator warnings, once signed in (the Stack stays the same element).
  return (
    <>
      {stack}
      {onboarded ? <ModerationGate /> : null}
      {onboarded ? <ConnectionToasts /> : null}
    </>
  );
}

export default function RootLayout() {
  // A toast goes when the screen changes (Redesign 2, 4.7; Review 13).
  const pathname = usePathname();
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
            {/* Toasts sit just above the ActionBar when a screen has one, else above the tab bar (Redesign 2, 4.7). */}
            <ToastProvider screenKey={pathname}>
              <StatusBar style="light" />
              <Gate />
              <OfflinePill />
            </ToastProvider>
          </CommunityProvider>
        </RoadsProvider>
      </StoreProvider>
    </AuthProvider>
  );
}
