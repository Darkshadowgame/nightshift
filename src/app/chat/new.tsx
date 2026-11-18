import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import { Button, Chip, EmptyState, InlineError, ListRow, Section, Txt, s as ui } from '../../components/ui';
import { useCommunity } from '../../lib/communityStore';
import { idsIn } from '../../lib/connections';
import { GROUP_NAME_MAX, groupProblem, MAX_GROUP } from '../../lib/messages';
import { useStore } from '../../lib/store';
import { C } from '../../theme';

/** New chat: pick one connection for a 1-to-1, or several (and a name) for a group. */
export default function NewChat() {
  const { users } = useStore();
  const community = useCommunity();
  const people = idsIn(community.connections, 'connected')
    .filter((id) => !community.blocked.has(id))
    .map((id) => users.find((u) => u.id === id))
    .filter((u): u is NonNullable<typeof u> => !!u)
    .sort((a, b) => a.handle.localeCompare(b.handle));
  const [picked, setPicked] = useState<string[]>([]);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const group = picked.length > 1;

  async function start() {
    setError(null);
    if (!picked.length) return setError('Pick someone to message.');
    if (group) {
      const p = groupProblem(name, picked);
      if (p) return setError(p);
    }
    setBusy(true);
    try {
      const id = await community.run((s) => (group ? s.createGroup(name, picked) : s.startDirect(picked[0])));
      router.replace({ pathname: '/chat/[id]', params: { id } });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start the chat.');
    } finally {
      setBusy(false);
    }
  }

  if (!people.length) {
    return (
      <View style={{ flex: 1, backgroundColor: C.asphalt, padding: 16 }}>
        <EmptyState
          glyph="chat"
          title="No connections yet"
          body="You can message people once they've accepted your connection request. Find people near you in Community › People."
          action={{ label: 'Find people', onPress: () => router.replace({ pathname: '/community', params: { tab: 'people' } }) }}
        />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 18, paddingBottom: 60 }} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
      <Section title={`Your connections (${people.length})`}>
        <Txt v="caption">One person for a 1-to-1 chat, or more for a group (up to {MAX_GROUP}).</Txt>
        {people.map((u) => {
          const on = picked.includes(u.id);
          return (
            <ListRow
              key={u.id}
              title={`@${u.handle}`}
              subtitle={u.name}
              onPress={() => setPicked((p) => (on ? p.filter((x) => x !== u.id) : [...p, u.id].slice(0, MAX_GROUP - 1)))}
              accessibilityLabel={`${on ? 'Selected' : 'Select'} @${u.handle}`}
              right={<Chip label={on ? 'Added' : 'Add'} on={on} onPress={() => setPicked((p) => (on ? p.filter((x) => x !== u.id) : [...p, u.id]))} />}
            />
          );
        })}
      </Section>
      {group ? (
        <Section title="Group name">
          <TextInput value={name} onChangeText={setName} placeholder="e.g. Sunday run" placeholderTextColor={C.fog} maxLength={GROUP_NAME_MAX} accessibilityLabel="Group name" style={ui.input} />
        </Section>
      ) : null}
      <Button label={group ? `Start group of ${picked.length + 1}` : picked.length ? 'Start chat' : 'Pick someone'} onPress={start} busy={busy} disabled={!picked.length} />
      <InlineError message={error} />
    </ScrollView>
  );
}
