import { router } from 'expo-router';
import { EventForm } from '../../components/EventForm';
import { useStore } from '../../lib/store';

export default function NewEvent() {
  const { saveEvent } = useStore();
  return (
    <EventForm
      submitLabel="Send invites"
      onSubmit={(event) => {
        saveEvent(event);
        router.replace({ pathname: '/event/[id]', params: { id: event.id } });
      }}
    />
  );
}
