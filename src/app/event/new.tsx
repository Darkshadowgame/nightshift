import { router } from 'expo-router';
import { EventForm } from '../../components/EventForm';
import { askPermission } from '../../lib/notify';
import { useStore } from '../../lib/store';

export default function NewEvent() {
  const { saveEvent, settings } = useStore();
  return (
    <EventForm
      submitLabel="Send invites"
      onSubmit={async (event) => {
        const id = await saveEvent(event);
        if (settings.reminders) askPermission().catch(() => {});
        router.replace({ pathname: '/event/[id]', params: { id } });
      }}
    />
  );
}
