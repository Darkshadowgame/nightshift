import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, TextInput } from 'react-native';
import { Button, Card, InlineError, Section, Txt, s as ui } from '../../components/ui';
import { crewHostLoss, crewProblem, normaliseTag } from '../../lib/crews';
import { useStore } from '../../lib/store';
import { useNow } from '../../lib/clock';
import { C, STATE } from '../../theme';

export default function NewCrew() {
  const store = useStore();
  const { crews, users, me, createCrew, events } = store;
  const now = useNow();
  const [name, setName] = useState('');
  const [tag, setTag] = useState('');
  const [error, setError] = useState<string | null>(null);
  const current = crews.find((c) => c.id === users.find((u) => u.id === me)?.crewId);
  const losing = crewHostLoss(me, { crews, users }, events, now);
  const [confirmed, setConfirmed] = useState(false);

  async function submit() {
    setError(null);
    const problem = crewProblem(name, tag, crews);
    if (problem) return setError(problem);
    // Losing host rights on crew events: say so first, and start only on a second tap.
    if (losing.length && !confirmed) {
      setConfirmed(true);
      return;
    }
    try {
      const id = await createCrew(name, tag);
      router.replace({ pathname: '/crew/[id]', params: { id } });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start the crew.');
    }
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 18, paddingBottom: 60 }} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive" automaticallyAdjustKeyboardInsets>
      <Section title="Crew name">
        <TextInput value={name} onChangeText={setName} placeholder="e.g. NightRunners" placeholderTextColor={C.fog} style={ui.input} maxLength={30} />
      </Section>
      <Section title="Tag" right={<Txt v="mono" style={{ color: C.chalk }}>{normaliseTag(tag) ? `[${normaliseTag(tag)}]` : ''}</Txt>}>
        <TextInput
          value={tag}
          onChangeText={(t) => setTag(normaliseTag(t).slice(0, 4))}
          placeholder="2 to 4 letters, e.g. NR"
          placeholderTextColor={C.fog}
          style={ui.input}
          autoCapitalize="characters"
          maxLength={4}
        />
      </Section>
      {current ? (
        <Card>
          <Txt v="muted">Starting a crew means leaving {current.name}.</Txt>
          {losing.length ? (
            <Txt style={{ color: STATE.warning }}>
              You'll stop hosting {losing.map((e) => e.title).join(', ')}: you host {losing.length === 1 ? 'it' : 'them'} as a{' '}
              {current.name} host, not a named host. Events that name you as a host stay yours.
            </Txt>
          ) : null}
        </Card>
      ) : null}
      <Button label={confirmed ? 'Start it and leave' : 'Start crew'} onPress={submit} />
      <InlineError message={error} />
      <Txt v="caption">
        You'll be the owner and pick the crew's hosts.{store.backend === 'local' ? ' In the demo, Invite members on the crew page brings sample people in.' : ''}
      </Txt>
    </ScrollView>
  );
}
