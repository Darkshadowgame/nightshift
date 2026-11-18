import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import { Avatar, OptionsSheet, openReport, type SheetOption } from '../../components/Community';
import { Button, Card, Chip, ConfirmBox, InlineError, ListRow, NotFound, Row, Section, Tag, Txt, s as ui } from '../../components/ui';
import { useCommunity } from '../../lib/communityStore';
import { idsIn } from '../../lib/connections';
import { GROUP_NAME_MAX, MAX_GROUP } from '../../lib/messages';
import { useStore } from '../../lib/store';
import { C } from '../../theme';

/** A group's info: name, members, admins, add and remove people, leave. */
export default function GroupInfo() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { users } = useStore();
  const community = useCommunity();
  const conv = community.conversations.find((c) => c.id === id);
  const [name, setName] = useState(conv?.name ?? '');
  const [adding, setAdding] = useState<string[]>([]);
  const [leaving, setLeaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [menu, setMenu] = useState<SheetOption[] | null>(null);
  if (!conv || conv.kind !== 'group') return <NotFound what="Group" message="You're not in this group any more." />;

  const me = community.me;
  const admin = conv.adminIds.includes(me);
  const handleOf = (uid: string) => users.find((u) => u.id === uid)?.handle ?? 'someone';
  const addable = idsIn(community.connections, 'connected').filter((u) => !conv.memberIds.includes(u) && !community.blocked.has(u));
  const act = (fn: () => Promise<unknown>) => {
    setError(null);
    return fn().catch((e) => setError(e instanceof Error ? e.message : 'Could not do that.'));
  };

  const memberMenu = (uid: string): SheetOption[] => {
    const out: SheetOption[] = [{ label: `View @${handleOf(uid)}`, onPress: () => router.push({ pathname: '/user/[id]', params: { id: uid } }) }];
    if (admin && uid !== me) {
      out.push(
        conv.adminIds.includes(uid)
          ? { label: 'Remove as admin', onPress: () => act(() => community.run((s) => s.setAdmin(conv.id, uid, false))) }
          : { label: 'Make admin', onPress: () => act(() => community.run((s) => s.setAdmin(conv.id, uid, true))) },
      );
      out.push({ label: 'Remove from the group', danger: true, onPress: () => act(() => community.run((s) => s.removeMember(conv.id, uid))) });
    }
    if (uid !== me) out.push({ label: 'Report', onPress: () => openReport('profile', uid, uid, 'profile') });
    return out;
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 20, paddingBottom: 60 }} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
      <Section title="Name">
        {admin ? (
          <Row style={{ flexWrap: 'nowrap' }}>
            <TextInput value={name} onChangeText={setName} maxLength={GROUP_NAME_MAX} accessibilityLabel="Group name" style={[ui.input, { flex: 1 }]} placeholderTextColor={C.fog} />
            <Button label="Save" size="sm" kind="secondary" disabled={!name.trim() || name.trim() === conv.name} onPress={() => act(() => community.run((s) => s.renameGroup(conv.id, name)))} />
          </Row>
        ) : (
          <Txt v="h2" style={{ textTransform: 'none' }}>{conv.name}</Txt>
        )}
      </Section>

      <Section title={`Members (${conv.memberIds.length} of ${MAX_GROUP})`}>
        {conv.memberIds.map((uid) => (
          <ListRow
            key={uid}
            title={`@${handleOf(uid)}${uid === me ? ' (you)' : ''}`}
            onPress={() => setMenu(memberMenu(uid))}
            right={
              <Row gap={6}>
                {conv.adminIds.includes(uid) ? <Tag label="Admin" tone="brand" /> : null}
                <Avatar user={users.find((u) => u.id === uid)} size={28} />
              </Row>
            }
          />
        ))}
      </Section>

      {admin ? (
        <Section title="Add people">
          {addable.length === 0 ? (
            <Txt v="muted">Everyone you're connected with is already here. Only your connections can be added.</Txt>
          ) : (
            <>
              <Row>
                {addable.map((uid) => (
                  <Chip key={uid} raw label={`@${handleOf(uid)}`} on={adding.includes(uid)} onPress={() => setAdding((a) => (a.includes(uid) ? a.filter((x) => x !== uid) : [...a, uid]))} />
                ))}
              </Row>
              <Button label={adding.length ? `Add ${adding.length}` : 'Pick people to add'} kind="secondary" disabled={!adding.length} onPress={() => act(() => community.run((s) => s.addMembers(conv.id, adding)).then(() => setAdding([])))} />
            </>
          )}
        </Section>
      ) : null}

      <InlineError message={error} />
      <View>
        {leaving ? (
          <ConfirmBox
            message={admin && conv.adminIds.length === 1 && conv.memberIds.length > 1 ? 'Leave the group? The longest-standing member becomes admin.' : 'Leave the group? You can only come back if an admin adds you.'}
            verb="Leave"
            onConfirm={() => act(() => community.run((s) => s.leave(conv.id)).then(() => router.replace({ pathname: '/community', params: { tab: 'messages' } })))}
            onCancel={() => setLeaving(false)}
          />
        ) : (
          <Button label="Leave the group" kind="danger" onPress={() => setLeaving(true)} />
        )}
      </View>
      <Card>
        <Txt v="caption">Anyone in the group can report a message: long press it.</Txt>
      </Card>
      <OptionsSheet visible={!!menu} options={menu ?? []} onClose={() => setMenu(null)} />
    </ScrollView>
  );
}
