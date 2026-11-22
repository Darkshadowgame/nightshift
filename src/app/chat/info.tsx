import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import { at, OptionsSheet, openProfile, openReport, personMark, type SheetOption } from '../../components/Community';
import { Field, INPUT } from '../../components/ComposerParts';
import { Button, ChipGroup, ConfirmSheet, DsText, ErrorState, ListRow, RowDivider, Section, Tag } from '../../components/ds';
import { useCommunity } from '../../lib/communityStore';
import { idsIn } from '../../lib/connections';
import { GROUP_NAME_MAX, MAX_GROUP } from '../../lib/messages';
import { useStore } from '../../lib/store';
import { COLOR, SPACING } from '../../theme';
import { NotFoundState } from '../../components/Detail';

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
  if (!conv || conv.kind !== 'group') return <NotFoundState what="Group" message="You're not in this group any more." />;

  const me = community.me;
  const admin = conv.adminIds.includes(me);
  const handleOf = (uid: string) => users.find((u) => u.id === uid)?.handle ?? 'someone';
  const addable = idsIn(community.connections, 'connected').filter((u) => !conv.memberIds.includes(u) && !community.blocked.has(u));
  const act = (fn: () => Promise<unknown>) => {
    setError(null);
    return fn().catch((e) => setError(e instanceof Error ? e.message : "Couldn't do that."));
  };

  const memberMenu = (uid: string): SheetOption[] => {
    const out: SheetOption[] = [{ label: `View @${handleOf(uid)}`, onPress: () => openProfile(uid) }];
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
    <ScrollView contentContainerStyle={{ padding: SPACING.screen, gap: SPACING.section, paddingBottom: SPACING.xxxl }} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
      {admin ? (
        <Field label="Group name">
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
            <TextInput value={name} onChangeText={setName} maxLength={GROUP_NAME_MAX} accessibilityLabel="Group name" style={[INPUT, { flex: 1 }]} placeholderTextColor={COLOR.text.secondary} />
            <Button label="Save" size="sm" tier="secondary" haptic="success" disabled={!name.trim() || name.trim() === conv.name} onPress={() => act(() => community.run((s) => s.renameGroup(conv.id, name)))} />
          </View>
        </Field>
      ) : (
        <DsText v="titleLg" accessibilityRole="header">
          {conv.name}
        </DsText>
      )}

      <Section title={`Members (${conv.memberIds.length} of ${MAX_GROUP})`}>
        <View>
          {conv.memberIds.filter((uid) => !community.blocked.has(uid)).map((uid, i) => {
            const u = users.find((x) => x.id === uid);
            return (
              <View key={uid}>
                {i ? <RowDivider inset /> : null}
                <ListRow
                  leading={{ avatar: personMark(u) }}
                  title={uid === me ? 'You' : at(u)}
                  subtitle={u?.name}
                  trailing={conv.adminIds.includes(uid) ? <Tag label="Admin" /> : undefined}
                  onPress={() => setMenu(memberMenu(uid))}
                />
              </View>
            );
          })}
        </View>
      </Section>

      {admin ? (
        <Section title="Add people">
          {addable.length === 0 ? (
            <DsText v="secondary">Everyone you're connected with is already here. Only your connections can be added.</DsText>
          ) : (
            <>
              <ChipGroup<string> label="Your connections" allLabel="Nobody yet" raw options={addable.map((uid) => ({ key: uid, label: `@${handleOf(uid)}` }))} selected={adding} onChange={setAdding} />
              <Button label={adding.length ? `Add ${adding.length}` : 'Add'} tier="secondary" block disabled={!adding.length} hint="Pick people to add first" onPress={() => act(() => community.run((s) => s.addMembers(conv.id, adding)).then(() => setAdding([])))} />
            </>
          )}
        </Section>
      ) : null}

      {error ? <ErrorState title={error} /> : null}
      <Button label="Leave the group" tier="destructive" block onPress={() => setLeaving(true)} />
      <DsText v="caption">Anyone in the group can report a message: long press it.</DsText>
      <ConfirmSheet
        visible={leaving}
        title="Leave the group?"
        message={admin && conv.adminIds.length === 1 && conv.memberIds.length > 1 ? 'The longest-standing member becomes admin.' : 'You can only come back if an admin adds you.'}
        verb="Leave"
        onConfirm={() => {
          setLeaving(false);
          void act(() => community.run((s) => s.leave(conv.id)).then(() => router.replace({ pathname: '/community', params: { tab: 'messages' } })));
        }}
        onCancel={() => setLeaving(false)}
      />
      <OptionsSheet visible={!!menu} title="Member" options={menu ?? []} onClose={() => setMenu(null)} />
    </ScrollView>
  );
}
