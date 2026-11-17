import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { EventForm } from '../../components/EventForm';
import { Card, Txt } from '../../components/ui';
import { canEditEvent, isHost } from '../../lib/events';
import { useStore } from '../../lib/store';
import { useNow } from '../../lib/clock';
import { C } from '../../theme';

export default function EditEvent() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { events, editEvent, me, crews } = useStore();
  const now = useNow();
  const event = events.find((e) => e.id === id);
  const allowed = !event
    ? { ok: false as const, reason: 'This event no longer exists.' }
    : !isHost(event, me, crews)
      ? { ok: false as const, reason: 'Only hosts can edit this event.' }
      : canEditEvent(event, now);

  if (!event || !allowed.ok) {
    return (
      <View style={{ flex: 1, padding: 16 }}>
        <Card accent={C.alert}>
          <Txt>{allowed.ok ? '' : allowed.reason}</Txt>
        </Card>
      </View>
    );
  }

  return (
    <EventForm
      initial={event}
      submitLabel="Save changes"
      onSubmit={async (edited) => {
        await editEvent(edited);
        router.back();
      }}
    />
  );
}
