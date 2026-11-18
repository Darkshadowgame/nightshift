import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import { at, MEET_ACTION, personMark } from '../../components/Community';
import { Field, INPUT } from '../../components/ComposerParts';
import { Button, DsText, EmptyState, ErrorState, Icon, ListRow, RowDivider, Section } from '../../components/ds';
import { useCommunity } from '../../lib/communityStore';
import { idsIn } from '../../lib/connections';
import { GROUP_NAME_MAX, groupProblem, MAX_GROUP } from '../../lib/messages';
import { useStore } from '../../lib/store';
import { COLOR, SPACING } from '../../theme';

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
      setError(e instanceof Error ? e.message : "Couldn't start the chat.");
    } finally {
      setBusy(false);
    }
  }

  if (!people.length) {
    return (
      <View style={{ flex: 1, backgroundColor: COLOR.surface.bg, padding: SPACING.screen }}>
        <EmptyState glyph="chat" title="No connections yet" body="You can message people once they've accepted your connection request. Meet them at an event, then connect from their profile." action={MEET_ACTION} />
      </View>
    );
  }

  const toggle = (id: string, on: boolean) => setPicked((p) => (on ? p.filter((x) => x !== id) : [...p, id].slice(0, MAX_GROUP - 1)));

  return (
    <ScrollView contentContainerStyle={{ padding: SPACING.screen, gap: SPACING.section, paddingBottom: SPACING.xxxl }} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
      <Section title={`Your connections (${people.length})`}>
        <DsText v="secondary">One person for a 1-to-1 chat, or more for a group (up to {MAX_GROUP}).</DsText>
        <View>
          {people.map((u, i) => {
            const on = picked.includes(u.id);
            return (
              <View key={u.id}>
                {i ? <RowDivider inset /> : null}
                <ListRow
                  leading={{ avatar: personMark(u) }}
                  title={at(u)}
                  subtitle={u.name}
                  chevron={false}
                  trailing={on ? <Icon name="check" size={22} colour={COLOR.action.selected} /> : undefined}
                  onPress={() => toggle(u.id, on)}
                  accessibilityLabel={`${at(u)}, ${on ? 'added' : 'not added'}`}
                  accessibilityHint={on ? 'Tap to take them out' : 'Tap to add them'}
                />
              </View>
            );
          })}
        </View>
      </Section>
      {group ? (
        <Field label="Group name">
          <TextInput value={name} onChangeText={setName} placeholder="e.g. Sunday run" placeholderTextColor={COLOR.text.secondary} maxLength={GROUP_NAME_MAX} accessibilityLabel="Group name" style={INPUT} />
        </Field>
      ) : null}
      <View style={{ gap: SPACING.sm }}>
        <Button label={group ? `Start group of ${picked.length + 1}` : 'Start chat'} size="lg" block onPress={start} busy={busy} disabled={!picked.length} hint="Pick someone first" />
        {error ? <ErrorState title={error} /> : null}
      </View>
    </ScrollView>
  );
}
