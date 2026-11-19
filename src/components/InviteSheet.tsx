import { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { useNow } from '../lib/clock';
import { useCommunity } from '../lib/communityStore';
import { idsIn } from '../lib/connections';
import { canInvite, INVITE_CAP, INVITE_WORDS, inviteChoices, invitedByMe, invitedToast } from '../lib/eventInvites';
import { shareEvent } from '../lib/messages';
import { useStore } from '../lib/store';
import type { NightEvent } from '../lib/types';
import { COLOR, SPACING } from '../theme';
import { at, personMark } from './Community';
import { Button, DsText, ErrorState, Icon, ListRow, RowDivider, SearchField, Sheet, useToast } from './ds';

/**
 * Bring your mates (eventInvites.ts): after I'm going, and from ··· › Invite connections. Your
 * connections first (search, pick several, Invite), then "Share another way", the phone's own
 * share sheet with the event's link (never the meet point). When you can't invite here (no
 * connections, the host turned invites off, or invites aren't on the server yet) the share row is
 * the only option.
 */
export function InviteSheet({ event, visible, onClose, onShareOther }: { event: NightEvent; visible: boolean; onClose: () => void; onShareOther: () => void }) {
  const store = useStore();
  const { me, users, crews } = store;
  const community = useCommunity();
  const toast = useToast();
  const now = useNow();
  const [q, setQ] = useState('');
  const [picked, setPicked] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!visible) {
      setPicked([]);
      setQ('');
      setError(null);
    }
  }, [visible]);

  const live = store.backend === 'local' || !!store.remote?.invitesLive();
  const allowed = live && canInvite(event, me, crews, now);
  const connected = useMemo(() => idsIn(community.connections, 'connected'), [community.connections]);
  const all = useMemo(() => (allowed ? inviteChoices(event, me, users, connected, community.blocked, crews) : []), [allowed, event, me, users, connected, community.blocked, crews]);
  const shown = useMemo(() => (q ? inviteChoices(event, me, users, connected, community.blocked, crews, q) : all), [q, all, event, me, users, connected, community.blocked, crews]);
  const left = INVITE_CAP - invitedByMe(event, me).length;

  const toggle = (id: string, on: boolean) => setPicked((p) => (on ? p.filter((x) => x !== id) : p.length < left ? [...p, id] : p));

  async function invite() {
    setError(null);
    if (!picked.length) return setError(INVITE_WORDS.none);
    setBusy(true);
    try {
      const fresh = await store.inviteConnections(event.id, picked, { connected, blocked: community.blocked });
      if (store.backend === 'local') {
        // The demo's chats live on the phone: the card goes into each 1-to-1 here (the server does it signed in).
        const card = shareEvent(event, now);
        for (const id of fresh) await community.run(async (s) => s.send(await s.startDirect(id), { body: '', share: card }));
      } else {
        await community.refresh().catch(() => {});
      }
      toast({ message: invitedToast(fresh.map((id) => users.find((u) => u.id === id)?.handle ?? 'someone')) });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't invite them.");
    } finally {
      setBusy(false);
    }
  }

  const why = !allowed
    ? event.allowInvites === false
      ? INVITE_WORDS.off
      : null
    : all.length === 0
      ? 'Connect with people to invite them here. Until then, share the link.'
      : null;

  return (
    <Sheet visible={visible} title={INVITE_WORDS.title} onClose={onClose}>
      {allowed && all.length > 0 ? (
        <View style={{ gap: SPACING.sm }}>
          <DsText v="secondary">They see the event and can ask to go. The meet point stays hidden until it's shown to people going.</DsText>
          {all.length > 6 ? <SearchField value={q} onChangeText={setQ} placeholder="Search your connections" accessibilityLabel="Search your connections" /> : null}
          <View>
            {shown.map((c, i) => {
              const on = picked.includes(c.user.id);
              const done = c.going || c.sent;
              return (
                <View key={c.user.id}>
                  {i ? <RowDivider inset /> : null}
                  <ListRow
                    leading={{ avatar: personMark(c.user) }}
                    title={at(c.user)}
                    subtitle={c.user.name}
                    meta={c.going ? 'Going' : c.sent ? 'Sent' : undefined}
                    chevron={false}
                    disabled={done}
                    trailing={on ? <Icon name="check" size={22} colour={COLOR.state.success} /> : undefined}
                    onPress={done ? undefined : () => toggle(c.user.id, on)}
                    accessibilityLabel={`${at(c.user)}, ${c.going ? 'going' : c.sent ? 'invite sent' : on ? 'picked' : 'not picked'}`}
                    accessibilityHint={done ? undefined : on ? 'Tap to take them out' : 'Tap to pick them'}
                  />
                </View>
              );
            })}
            {shown.length === 0 ? <DsText v="secondary">Nobody by that name.</DsText> : null}
          </View>
          {left <= 0 ? <DsText v="caption">{INVITE_WORDS.cap}</DsText> : null}
        </View>
      ) : why ? (
        <DsText v="secondary">{why}</DsText>
      ) : null}
      {error ? <ErrorState title={error} /> : null}
      <View>
        {allowed && all.length > 0 ? <RowDivider /> : null}
        <ListRow
          leading={{ icon: 'share' }}
          title={INVITE_WORDS.shareOther}
          subtitle="Send the event's link. It never shows the meet point."
          chevron={false}
          onPress={() => {
            onClose();
            onShareOther();
          }}
        />
      </View>
      {allowed && all.length > 0 ? (
        <Button block label={picked.length ? `Invite ${picked.length}` : 'Invite'} busy={busy} disabled={!picked.length} onPress={() => void invite()} accessibilityLabel={picked.length ? `Invite ${picked.length} ${picked.length === 1 ? 'person' : 'people'}` : 'Invite: pick someone first'} />
      ) : null}
    </Sheet>
  );
}
