import { openCreated } from '../../lib/openCreated';
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView } from 'react-native';
import { Callout, Field, PAGE, TextField } from '../../components/Detail';
import { Button, DsText, ErrorState } from '../../components/ds';
import { useNow } from '../../lib/clock';
import { crewHostLoss, crewProblem, normaliseTag } from '../../lib/crews';
import { useStore } from '../../lib/store';
import { COLOR } from '../../theme';

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
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError(null);
    const problem = crewProblem(name, tag, crews);
    if (problem) return setError(problem);
    // Losing host rights on crew events: say so first, and start only on a second tap.
    if (losing.length && !confirmed) {
      setConfirmed(true);
      return;
    }
    setBusy(true);
    try {
      const id = await createCrew(name, tag);
      openCreated({ pathname: '/crew/[id]', params: { id } });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't start the crew.");
    } finally {
      setBusy(false);
    }
  }

  const shownTag = normaliseTag(tag);
  return (
    <ScrollView style={{ backgroundColor: COLOR.surface.bg }} contentContainerStyle={PAGE} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive" automaticallyAdjustKeyboardInsets>
      <Field label="Crew name">
        <TextField value={name} onChangeText={setName} placeholder="e.g. NightRunners" maxLength={30} accessibilityLabel="Crew name" />
      </Field>
      <Field label="Tag" hint={shownTag ? `Shown as ${shownTag}` : '2 to 4 letters, shown next to the crew name.'}>
        <TextField value={tag} onChangeText={(t) => setTag(normaliseTag(t).slice(0, 4))} placeholder="e.g. NR" autoCapitalize="characters" maxLength={4} accessibilityLabel="Tag" />
      </Field>
      {current ? (
        <Callout tone={losing.length ? 'warning' : 'neutral'} title={`Starting a crew means leaving ${current.name}.`}>
          {losing.length
            ? `You'll no longer host ${losing.map((e) => e.title).join(', ')}: you host ${losing.length === 1 ? 'it' : 'them'} as a ${current.name} host, not a named host. Events that name you as a host stay yours.`
            : undefined}
        </Callout>
      ) : null}
      <Button label={confirmed ? 'Start it and leave' : 'Start crew'} size="lg" block busy={busy} haptic="success" onPress={submit} />
      {error ? <ErrorState title={error} /> : null}
      <DsText v="caption">
        You'll be the owner and pick the crew's hosts.{store.backend === 'local' ? ' In the demo, Invite members on the crew page brings sample people in.' : ''}
      </DsText>
    </ScrollView>
  );
}
