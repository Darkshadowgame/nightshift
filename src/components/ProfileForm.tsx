import { useState } from 'react';
import { TextInput, View } from 'react-native';
import { DEMO_HOME, DEMO_REGION } from '../data/seed';
import { fuzz } from '../lib/geo';
import { currentPosition } from '../lib/location';
import { nearestRegion, REGIONS, regionCentre, type ProfileDraft } from '../lib/profile';
import type { LatLng } from '../lib/types';
import { C } from '../theme';
import { NightMap } from './NightMap';
import { PlaceSearch } from './PlaceSearch';
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
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);

  const isDemoHome = !!home && home.lat === DEMO_HOME.lat && home.lng === DEMO_HOME.lng;

  /** Every way of setting home ends here: saved fuzzed to about 1 km, never exact. */
  function setHomeNear(at: LatLng) {
    const rough = fuzz(at);
    setHome(rough);
    setCentre(rough);
    setRegion(nearestRegion(rough));
    setLocError(null);
  }

  async function useMyLocation() {
    setLocating(true);
    setLocError(null);
    const pos = await currentPosition(true);
    setLocating(false);
    if (pos.ok) setHomeNear(pos.at);
    else
      setLocError(
        pos.reason === 'denied'
          ? 'Location is off for Nightshift. Search for your town or postcode instead, or turn it on in Settings.'
          : "Couldn't find where you are. Search for your town or postcode instead.",
      );
  }

  function pickRegion(r: string) {
    if (r === region) return;
    setRegion(r);
    // Only move the map if there's no home yet: the region is just a label for your profile.
    if (!home) setCentre(regionCentre(r));
  }

  function pickDemoArea() {
    setRegion(DEMO_REGION);
    setHome(DEMO_HOME);
    setCentre(DEMO_HOME);
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

      <Section title="Rough home area">
        <Txt v="muted">
          Used to find meets and invites near you. It's saved to about 1 km, never your exact address, and never shown to anyone.
        </Txt>
        <Button label={locating ? 'Finding you…' : 'Use my current location'} kind="neon" onPress={useMyLocation} busy={locating} />
        {locError ? <Txt v="muted" style={{ color: C.alert }}>{locError}</Txt> : null}
        <PlaceSearch placeholder="Or search your town or postcode" onPick={(h) => setHomeNear(h.at)} />
        <View style={{ height: 220, borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: home ? C.neon : C.kerb }}>
          <NightMap key={`${centre.lat},${centre.lng}`} pins={[]} centre={centre} span={home ? 0.3 : 0.8} picked={home} onLongPress={setHomeNear} />
        </View>
        <Txt v="mono" style={{ color: home ? C.lime : C.fog }}>
          {isDemoHome ? 'HOME AREA SET: THE DEMO AREA (TAMWORTH)' : home ? 'HOME AREA SET, TO ABOUT 1 KM' : 'NOT SET YET'}
        </Txt>
        <Txt v="muted" style={{ fontSize: 12 }}>
          Long-press the map to nudge it. Until the app has a backend, sample people and events (marked Sample) are drawn round your
          home area so there's something to try.
        </Txt>
      </Section>

      <Section title="Region">
        <Txt v="muted" style={{ fontSize: 12 }}>Set from your home area. Change it if it's wrong.</Txt>
        <Row gap={6}>
          {REGIONS.map((r) => (
            <Chip key={r.name} label={r.name} on={region === r.name} onPress={() => pickRegion(r.name)} />
          ))}
        </Row>
      </Section>

      {!isDemoHome ? (
        <Button label="Testing: use the demo area (Tamworth)" kind="ghost" onPress={pickDemoArea} />
      ) : null}

      {error ? (
        <Card accent={C.alert}>
          <Txt>{error}</Txt>
        </Card>
      ) : null}
      <Button label={submitLabel} onPress={submit} />
    </View>
  );
}
