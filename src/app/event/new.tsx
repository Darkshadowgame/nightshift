import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { EventForm } from '../../components/EventForm';
import { Button, Card, DsText, useToast } from '../../components/ds';
import { isPublicType } from '../../lib/events';
import { sentToast } from '../../lib/format';
import { clearHostDraft, draftSummary, loadHostDraft, type HostDraft } from '../../lib/hostDraft';
import { askPermission } from '../../lib/notify';
import { openCreated } from '../../lib/openCreated';
import { useStore } from '../../lib/store';
import { COLOR, SPACING } from '../../theme';

export default function NewEvent() {
  const { saveEvent, settings, me } = useStore();
  const toast = useToast();
  // REVIEW-10 decision 2: a draft saved last time is offered first ("Carry on with your draft").
  const [draft, setDraft] = useState<HostDraft | null | undefined>(undefined);
  const [chosen, setChosen] = useState<'draft' | 'new' | null>(null);
  useEffect(() => {
    let live = true;
    loadHostDraft(me).then((d) => live && setDraft(d));
    return () => {
      live = false;
    };
  }, [me]);

  if (draft === undefined) return <View style={{ flex: 1, backgroundColor: COLOR.surface.bg }} />;
  if (draft && !chosen) {
    return (
      <View style={{ flex: 1, padding: SPACING.screen, gap: SPACING.lg, backgroundColor: COLOR.surface.bg }}>
        <Card>
          <View style={{ gap: SPACING.md }}>
            <DsText v="label">Your draft</DsText>
            <DsText v="title">{draft.title.trim() || 'A meet with no name yet'}</DsText>
            <DsText v="meta">{draftSummary(draft, 5)}</DsText>
            <Button label="Carry on with your draft" block onPress={() => setChosen('draft')} />
            <Button
              label="Start a new one"
              tier="secondary"
              block
              onPress={() => {
                clearHostDraft(me);
                setChosen('new');
              }}
            />
          </View>
        </Card>
        <DsText v="caption">Drafts stay on this phone until you send the invites or discard them.</DsText>
      </View>
    );
  }
  return (
    <EventForm
      key={chosen ?? 'new'}
      draft={chosen === 'draft' ? draft : null}
      submitLabel="Send invites"
      onSubmit={async (event, sent) => {
        const id = await saveEvent(event);
        if (settings.reminders) askPermission().catch(() => {});
        // Said once, as you arrive on the event: the same count the form showed.
        toast({ message: sentToast(sent.invited, isPublicType(event.type), event.filter.everyone) });
        openCreated({ pathname: '/event/[id]', params: { id } });
      }}
    />
  );
}
