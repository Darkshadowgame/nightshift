import { EventForm } from '../../components/EventForm';
import { useToast } from '../../components/ds';
import { isPublicType } from '../../lib/events';
import { sentToast } from '../../lib/format';
import { askPermission } from '../../lib/notify';
import { openCreated } from '../../lib/openCreated';
import { useStore } from '../../lib/store';

export default function NewEvent() {
  const { saveEvent, settings } = useStore();
  const toast = useToast();
  return (
    <EventForm
      submitLabel="Send invites"
      onSubmit={async (event, sent) => {
        const id = await saveEvent(event);
        if (settings.reminders) askPermission().catch(() => {});
        // Said once, as you arrive on the event: the same count the form showed.
        toast({ message: sentToast(sent.invited, isPublicType(event.type)) });
        openCreated({ pathname: '/event/[id]', params: { id } });
      }}
    />
  );
}
