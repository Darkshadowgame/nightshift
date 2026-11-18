import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { EventForm } from '../../components/EventForm';
import { NotFoundState } from '../../components/Detail';
import { EmptyState } from '../../components/ds';
import { canEditEvent, isHost } from '../../lib/events';
import { useStore } from '../../lib/store';
import { useNow } from '../../lib/clock';
import { COLOR, SPACING } from '../../theme';

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

  if (!event) return <NotFoundState what="Event" />;
  if (!allowed.ok) {
    return (
      <View style={{ flex: 1, padding: SPACING.screen, backgroundColor: COLOR.surface.bg }}>
        <EmptyState title="Can't edit this event" body={allowed.reason} action={{ label: 'Open the meet', onPress: () => router.replace({ pathname: '/event/[id]', params: { id: event.id } }) }} />
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
