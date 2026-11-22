import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { EventForm } from '../../components/EventForm';
import { ActionBar, Card, DsText, PAGE_WITH_BAR, useToast } from '../../components/ds';
import { isPublicType } from '../../lib/events';
import { sentToast } from '../../lib/format';
import { appNow } from '../../lib/appClock';
import { clearHostDraft, draftFromEvent, draftSummary, loadHostDraft, templateSource, type HostDraft } from '../../lib/hostDraft';
import { askPermission } from '../../lib/notify';
import { useStore } from '../../lib/store';
import { COLOR, SPACING } from '../../theme';

/** The host flow has four steps (EventForm). */
const STEP_COUNT = 4;

/**
 * Host a meet (Redesign 2, 3.6). A draft saved last time is offered first ("Carry on with your
 * draft", REVIEW-10 decision 2). After posting, the form gives way to "It's up" (event/posted).
 */
export default function NewEvent() {
  const { saveEvent, settings, me, events } = useStore();
  const toast = useToast();
  const [draft, setDraft] = useState<HostDraft | null | undefined>(undefined);
  const [chosen, setChosen] = useState<'draft' | 'new' | null>(null);
  /** "Same as last time": the previous meet copied into a draft at the last step. */
  const [template, setTemplate] = useState<HostDraft | null>(null);
  const last = templateSource(events, me, appNow());
  useEffect(() => {
    let live = true;
    loadHostDraft(me).then((d) => live && setDraft(d));
    return () => {
      live = false;
    };
  }, [me]);

  if (draft === undefined) return <View style={{ flex: 1, backgroundColor: COLOR.surface.bg }} />;
  // No draft, but you have hosted before: offer the same meet again (two taps: this, then Post).
  if (!draft && last && !chosen) {
    return (
      <View style={{ flex: 1, backgroundColor: COLOR.surface.bg }}>
        <ScrollView contentContainerStyle={PAGE_WITH_BAR}>
          <Card>
            <View style={{ gap: SPACING.xs }}>
              <DsText v="label">Your last meet</DsText>
              <DsText v="title">{last.title}</DsText>
              <DsText v="meta">Same name, place and rules, a week on. You check it, then post.</DsText>
            </View>
          </Card>
        </ScrollView>
        <ActionBar
          primary={{
            label: 'Same as last time',
            onPress: () => {
              setTemplate(draftFromEvent(last, me, appNow()));
              setChosen('draft');
            },
          }}
          secondary={{ label: 'Start a new one', onPress: () => setChosen('new') }}
        />
      </View>
    );
  }
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
      draft={chosen === 'draft' ? (template ?? draft) : null}
      onSubmit={async (event, sent) => {
        await saveEvent(event);
        if (settings.reminders) askPermission().catch(() => {});
        toast({ message: sentToast(sent.invited, isPublicType(event.type), event.filter.everyone) });
        // "It's up" is its own screen with no back (Review 19 #46): the form is done, not a step back.
        router.replace({ pathname: '/event/posted', params: { id: event.id } });
      }}
    />
  );
}
