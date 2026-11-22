import { router } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { View } from 'react-native';
import { groupShare, groupChipText, GROUP_CONSENT, type GroupInfo } from '../lib/groupLive';
import { useGroupDrive, useGroupPoll } from '../lib/groupDriveStore';
import type { NavTarget } from '../lib/navPlan';
import { useStore } from '../lib/store';
import { SPACING } from '../theme';
import { Button, DsText, ErrorState, ListRow, Sheet, useToast } from './ds';
import { useShareLink } from './ShareLink';

/** The consent, said once and plainly. */
export function GroupConsentText() {
  return (
    <View style={{ gap: SPACING.sm }}>
      <DsText v="body">{GROUP_CONSENT.body}</DsText>
      <DsText v="caption">You can leave the group from the map at any time, and it is no longer shared straight away.</DsText>
    </View>
  );
}

/**
 * Starting a group drive: the first time a sheet with the consent and one primary action, after that
 * straight away. Then the join link goes to the share sheet, to send into any chat.
 *
 *   const together = useStartGroupDrive(target, 'Sunday cruise');
 *   <ListRow onPress={together.start} … />   {together.sheet}
 */
export function useStartGroupDrive(target: NavTarget | null, title: string): { start: () => void; busy: boolean; sheet: ReactNode } {
  const drive = useGroupDrive();
  const { settings, setSettings } = useStore();
  const toast = useToast();
  const sharer = useShareLink('group drive');
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const g = await drive.start(target, title);
      setSettings({ groupDriveAgreed: true });
      setAsking(false);
      toast({ message: 'Group drive started' });
      await sharer.share(groupShare(g));
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Couldn’t start the group drive.';
      setError(message);
      if (!asking) toast({ message, tone: 'danger' });
    } finally {
      setBusy(false);
    }
  }

  const sheet = (
    <>
      {sharer.sheet}
      <Sheet visible={asking} title={GROUP_CONSENT.title} onClose={() => setAsking(false)}>
        <GroupConsentText />
        {error ? <ErrorState title={error} /> : null}
        <Button block label={GROUP_CONSENT.start} busy={busy} onPress={() => void run()} />
      </Sheet>
    </>
  );
  return { start: () => (settings.groupDriveAgreed ? void run() : setAsking(true)), busy, sheet };
}

/**
 * The one row on a drive's page or a meet's page: "Drive together" (start), "Join the group drive" (a
 * group for this meet already exists), or "Group drive on" (you are in it: share the link again).
 * Not drawn when the server hasn't got group drives yet.
 */
export function GroupDriveRow({ kind, target, title }: { kind: 'drive' | 'meet'; target: NavTarget; title: string }) {
  const drive = useGroupDrive();
  useGroupPoll(false);
  const together = useStartGroupDrive(target, title);
  const sharer = useShareLink('group drive');
  const [open, setOpen] = useState<(GroupInfo & { joined: boolean }) | null>(null);
  const eventId = target.kind === 'event' ? target.id : null;
  const myGroup = drive.group?.id;
  const { forEvent } = drive;
  useEffect(() => {
    if (!eventId || drive.available === false) return;
    let live = true;
    forEvent(eventId).then((g) => live && setOpen(g)).catch(() => live && setOpen(null));
    return () => {
      live = false;
    };
  }, [eventId, drive.available, myGroup, forEvent]);

  if (drive.available === false) return null;

  if (drive.group && (!eventId || drive.group.targetId === eventId || !open)) {
    const g = drive.group;
    return (
      <>
        <ListRow
          leading={{ icon: 'pin' }}
          title="Group drive on"
          subtitle={`${groupChipText(g.memberCount)} · share the link again`}
          onPress={() => void sharer.share(groupShare(g))}
        />
        {sharer.sheet}
      </>
    );
  }
  if (open && !open.joined) {
    return <ListRow leading={{ icon: 'pin' }} title="Join the group drive" subtitle={`${groupChipText(open.memberCount)} · see each other on the map`} onPress={() => router.push(`/group/${open.code}`)} />;
  }
  return (
    <>
      <ListRow
        leading={{ icon: 'pin' }}
        title={kind === 'meet' ? 'Drive there together' : 'Drive together'}
        subtitle="Everyone in the group sees each other while driving"
        onPress={together.start}
      />
      {together.sheet}
    </>
  );
}
