import { useState } from 'react';
import { TextInput, View } from 'react-native';
import { fuzz } from '../lib/geo';
import { REGIONS, regionCentre, type ProfileDraft } from '../lib/profile';
import type { LatLng } from '../lib/types';
import { C } from '../theme';
import { NightMap } from './NightMap';
import { Button, Card, Chip, Row, Section, Txt, s as ui } from './ui';

/** Handle, name, region and rough home area. Used on first run and on Me. */
export function ProfileForm({
  initial,
  submitLabel,
  onSubmit,
}: {
  initial: ProfileDraft;
  submitLabel: string;
  /** Throw with a readable message if the draft can't be saved. */
  onSubmit: (draft: ProfileDraft) => void;
}) {
  const [handle, setHandle] = useState(initial.handle);
  const [name, setName] = useState(initial.name);
  const [region, setRegion] = useState(initial.region);
  const [home, setHome] = useState<LatLng | null>(initial.home);
  const [centre, setCentre] = useState<LatLng>(initial.home ?? regionCentre(initial.region));
  const [error, setError] = useState<string | null>(null);

  function pickRegion(r: string) {
    setRegion(r);
    setCentre(regionCentre(r));
  }

  function submit() {
    setError(null);
    try {
      onSubmit({ handle, name, region, home });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save.');
    }
  }

  return (
    <View style={{ gap: 20 }}>
      <Section title="Handle">
        <TextInput
          value={handle}
          onChangeText={setHandle}
          placeholder="e.g. night_owl"
          placeholderTextColor={C.fog}
          autoCapitalize="none"
          autoCorrect={false}
          style={ui.input}
          accessibilityLabel="Handle"
        />
        <Txt v="muted">What people see on the map, in chat and on trophies. Letters, numbers, dots and underscores.</Txt>
      </Section>

      <Section title="Display name">
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="First name or nickname"
          placeholderTextColor={C.fog}
          style={ui.input}
          accessibilityLabel="Display name"
        />
      </Section>

      <Section title="Region">
        <Row gap={6}>
          {REGIONS.map((r) => (
            <Chip key={r.name} label={r.name} on={region === r.name} onPress={() => pickRegion(r.name)} />
          ))}
        </Row>
      </Section>

      <Section title="Rough home area">
        <Txt v="muted">Long-press the map near home. It's saved to about 1 km, only used to work out invites, and never shown to anyone.</Txt>
        <View style={{ height: 240, borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: home ? C.neon : C.kerb }}>
          <NightMap key={`${centre.lat},${centre.lng}`} pins={[]} centre={centre} span={0.8} picked={home} onLongPress={(at) => setHome(fuzz(at))} />
        </View>
        <Txt v="mono" style={{ color: home ? C.lime : C.fog }}>{home ? 'HOME AREA SET' : 'NOT SET YET'}</Txt>
      </Section>

      {error ? (
        <Card accent={C.alert}>
          <Txt>{error}</Txt>
        </Card>
      ) : null}
      <Button label={submitLabel} onPress={submit} />
    </View>
  );
}
