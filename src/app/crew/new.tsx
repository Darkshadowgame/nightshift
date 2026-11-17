import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, TextInput } from 'react-native';
import { Button, Card, Section, Txt, s as ui } from '../../components/ui';
import { crewProblem, normaliseTag } from '../../lib/crews';
import { useStore } from '../../lib/store';
import { C } from '../../theme';

export default function NewCrew() {
  const { crews, users, me, createCrew } = useStore();
  const [name, setName] = useState('');
  const [tag, setTag] = useState('');
  const [error, setError] = useState<string | null>(null);
  const current = crews.find((c) => c.id === users.find((u) => u.id === me)?.crewId);

  function submit() {
    setError(null);
    const problem = crewProblem(name, tag, crews);
    if (problem) return setError(problem);
    try {
      const id = createCrew(name, tag);
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
      <Section title="Tag" right={<Txt v="mono" style={{ color: C.neon }}>{normaliseTag(tag) ? `[${normaliseTag(tag)}]` : ''}</Txt>}>
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
        </Card>
      ) : null}
      {error ? (
        <Card accent={C.alert}>
          <Txt>{error}</Txt>
        </Card>
      ) : null}
      <Button label="Start crew" onPress={submit} />
    </ScrollView>
  );
}
