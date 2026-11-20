import { router, Stack, useLocalSearchParams } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { NotFoundState } from '../../components/Detail';
import { ActionBar, DsText, HeaderTextAction, LocationLine, PAGE_WITH_BAR } from '../../components/ds';
import { useShareLink } from '../../components/ShareLink';
import { EventEntityCard } from '../../components/TonightCards';
import { useNow } from '../../lib/clock';
import { isPublicType } from '../../lib/events';
import { viewEvent } from '../../lib/eventView';
import { openCreated } from '../../lib/openCreated';
import { SAMPLE_REF } from '../../lib/photoSource';
import { eventSharePayload } from '../../lib/share';
import { useStore } from '../../lib/store';
import { useDistanceOrigin } from '../../lib/useDistanceOrigin';
import { clock, whenLabel } from '../../lib/when';
import { COLOR, SPACING } from '../../theme';

/** The night meet photo (the sign-in hero) when your meet has no build photo or stand-in. */
const NIGHT_MEET_ART = `${SAMPLE_REF}hero-night-meet`;

/**
 * "It's up" (Redesign 2, 3.6, after posting): the meet as people will see it on Tonight (its
 * PhotoCard, the host's build photo, K3), then Share first so people come. No back arrow (Review 19
 * #46: back to the form, or to Tonight?): the header's Done closes it, Share and Open the meet are
 * the two ways on.
 */
export default function Posted() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const now = useNow();
  const { events, me, crews, users, builds } = useStore();
  const origin = useDistanceOrigin();
  // Share (X, Review 11): the share sheet, else "Link copied", else the link to copy (src/lib/share.ts).
  const sharer = useShareLink();
  const event = events.find((e) => e.id === id);
  function done() {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }
  const header = <Stack.Screen options={{ headerRight: () => <HeaderTextAction label="Done" onPress={done} /> }} />;
  if (!event) {
    return (
      <View style={{ flex: 1, backgroundColor: COLOR.surface.bg }}>
        {header}
        <NotFoundState what="meet" />
      </View>
    );
  }
  const revealAt = new Date(new Date(event.startsAt).getTime() - event.revealMinutesBefore * 60_000);
  const openMeet = () => openCreated({ pathname: '/event/[id]', params: { id: event.id } });
  return (
    <View style={{ flex: 1, backgroundColor: COLOR.surface.bg }}>
      {header}
      <ScrollView contentContainerStyle={PAGE_WITH_BAR}>
        <View style={{ gap: SPACING.xs }}>
          <DsText v="titleLg" accessibilityRole="header">
            It's up. Share it so people come.
          </DsText>
          {isPublicType(event.type) ? null : <LocationLine state="host" time={clock(revealAt)} leadMinutes={event.revealMinutesBefore} />}
        </View>
        {/* A real picture, never the drawn placeholder (Review 20 #34, owner decision 2): your build's photo,
            else its stand-in (credited as similar), else the night meet art. A little wider than Tonight's
            card so the whole card, meta line and all, sits above the ActionBar at 1.3x text (Review 20 #35). */}
        <EventEntityCard
          view={viewEvent(event, me, crews, users, builds, now)}
          now={now}
          origin={origin}
          builds={builds}
          demo
          fallbackRef={NIGHT_MEET_ART}
          aspect={2}
          onPress={openMeet}
        />
      </ScrollView>
      <ActionBar primary={{ label: 'Share', icon: 'share', onPress: () => sharer.share(eventSharePayload(event, whenLabel(event.startsAt, now))) }} secondary={{ label: 'Open the meet', onPress: openMeet }} />
      {sharer.sheet}
    </View>
  );
}
