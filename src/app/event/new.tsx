import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { EventForm } from '../../components/EventForm';
import { ActionBar, Card, DsText, Hero, LocationLine, PAGE_WITH_BAR, useToast } from '../../components/ds';
import { NightMap } from '../../components/NightMap';
import { useNow } from '../../lib/clock';
import { EVENT_LABELS, isPublicType } from '../../lib/events';
import { eventSharePayload } from '../../lib/share';
import { useShareLink } from '../../components/ShareLink';
import { sentToast } from '../../lib/format';
import { aroundArea } from '../../lib/glossary';
import { clearHostDraft, draftSummary, loadHostDraft, type HostDraft } from '../../lib/hostDraft';
import { askPermission } from '../../lib/notify';
import { openCreated } from '../../lib/openCreated';
import { useStore } from '../../lib/store';
import type { NightEvent } from '../../lib/types';
import { clock, timeRange, whenLabel } from '../../lib/when';
import { COLOR, EVENT_COLOURS, SPACING } from '../../theme';

/** The host flow has four steps (EventForm). */
const STEP_COUNT = 4;

/**
 * Host a meet (Redesign 2, 3.6). A draft saved last time is offered first ("Carry on with your
 * draft", REVIEW-10 decision 2). After posting, a success page in the detail shape: "It's up.
 * Share it so people come." with Share (primary) and Open the meet.
 */
export default function NewEvent() {
  const { saveEvent, settings, me } = useStore();
  const toast = useToast();
  const [draft, setDraft] = useState<HostDraft | null | undefined>(undefined);
  const [chosen, setChosen] = useState<'draft' | 'new' | null>(null);
  const [posted, setPosted] = useState<NightEvent | null>(null);
  useEffect(() => {
    let live = true;
    loadHostDraft(me).then((d) => live && setDraft(d));
    return () => {
      live = false;
    };
  }, [me]);

  if (posted) return <Posted event={posted} />;
  if (draft === undefined) return <View style={{ flex: 1, backgroundColor: COLOR.surface.bg }} />;
  if (draft && !chosen) {
    return (
      <View style={{ flex: 1, backgroundColor: COLOR.surface.bg }}>
        <ScrollView contentContainerStyle={PAGE_WITH_BAR}>
          <Card>
            <View style={{ gap: SPACING.xs }}>
              <DsText v="label">Your draft</DsText>
              <DsText v="title">{draft.title.trim() || 'A meet with no name yet'}</DsText>
              <DsText v="meta">{draftSummary(draft, STEP_COUNT)}</DsText>
            </View>
          </Card>
          <DsText v="caption">Drafts stay on this phone until you post them or start a new one.</DsText>
        </ScrollView>
        <ActionBar
          primary={{ label: 'Carry on with your draft', onPress: () => setChosen('draft') }}
          secondary={{
            label: 'Start a new one',
            onPress: () => {
              clearHostDraft(me);
              setChosen('new');
            },
          }}
        />
      </View>
    );
  }
  return (
    <EventForm
      key={chosen ?? 'new'}
      draft={chosen === 'draft' ? draft : null}
      onSubmit={async (event, sent) => {
        await saveEvent(event);
        if (settings.reminders) askPermission().catch(() => {});
        toast({ message: sentToast(sent.invited, isPublicType(event.type), event.filter.everyone) });
        setPosted(event);
      }}
    />
  );
}

/** "It's up": the meet as people will see it, Share first so people come. */
function Posted({ event }: { event: NightEvent }) {
  const now = useNow();
  // Share (X, Review 11): the share sheet, else "Link copied", else the link to copy (src/lib/share.ts).
  const sharer = useShareLink();
  const colour = EVENT_COLOURS[event.type];
  const radius = event.areaRadiusMiles ?? 3;
  const revealAt = new Date(new Date(event.startsAt).getTime() - event.revealMinutesBefore * 60_000);
  function share() {
    return sharer.share(eventSharePayload(event, whenLabel(event.startsAt, now)));
  }
  return (
    <View style={{ flex: 1, backgroundColor: COLOR.surface.bg }}>
      <Stack.Screen options={{ title: '' }} />
      <ScrollView contentContainerStyle={PAGE_WITH_BAR}>
        <Hero
          media={
            // The map fills the Hero's whole 16:9 box: no blank band under it (Review 14). The toast
            // gets its own room above the ActionBar, so the map no longer has to be cut short for it.
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
              <NightMap pins={[]} circles={[{ id: 'area', centre: event.area, radiusMiles: radius, colour: COLOR.text.secondary }]} centre={event.area} span={Math.max(0.08, radius / 15)} />
            </View>
          }
          // A wide, short box so the location line stays in view above the toast at 1.3x text.
          aspect={4}
          eyebrow={EVENT_LABELS[event.type]}
          layerColour={colour}
          title={event.title}
          meta={`${timeRange(event.startsAt, event.endsAt, now)} · ${aroundArea(event.areaName)}`}
          tag={{ label: 'Hosting', tone: 'success' }}
        />
        <View style={{ gap: SPACING.xs }}>
          <DsText v="title">It's up. Share it so people come.</DsText>
          {isPublicType(event.type) ? null : <LocationLine state="host" time={clock(revealAt)} leadMinutes={event.revealMinutesBefore} />}
        </View>
      </ScrollView>
      <ActionBar
        primary={{ label: 'Share', icon: 'share', onPress: share }}
        secondary={{ label: 'Open the meet', onPress: () => openCreated({ pathname: '/event/[id]', params: { id: event.id } }) }}
      />
      {sharer.sheet}
    </View>
  );
}
