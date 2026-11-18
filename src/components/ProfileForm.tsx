import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { DEMO_HOME, DEMO_REGION } from '../data/seed';
import { DEFAULT_ALERTS, DEFAULT_TRAVEL_MILES, type AlertMode } from '../lib/discover';
import { fuzz } from '../lib/geo';
import { currentPosition } from '../lib/location';
import { nearestRegion, REGIONS, regionCentre, type ProfileDraft } from '../lib/profile';
import type { LatLng } from '../lib/types';
import { useStore } from '../lib/store';
import { COLOR, LAYER, RADII, SPACING } from '../theme';
import { MapPicker } from './MapPicker';
import { NightMap } from './NightMap';
import { PlaceSearch } from './PlaceSearch';
import { TravelPrefs } from './TravelPrefs';
import { Button, ChoiceGroup, DsText, ErrorState, Press, Section, TextField } from './ds';

/** Handle, name, region, rough home area and how far you'd travel. Used on first run and on Me. */
export function ProfileForm({
  initial,
  submitLabel,
  onSubmit,
}: {
  initial: ProfileDraft;
  submitLabel: string;
  /** Throw with a readable message if the draft can't be saved. */
  /** May reject with a readable reason, shown under the form. */
  onSubmit: (draft: ProfileDraft) => void | Promise<void>;
}) {
  const [handle, setHandle] = useState(initial.handle);
  const [name, setName] = useState(initial.name);
  const [region, setRegion] = useState(initial.region);
  const [home, setHome] = useState<LatLng | null>(initial.home);
  const [centre, setCentre] = useState<LatLng>(initial.home ?? regionCentre(initial.region));
  const [travelMiles, setTravelMiles] = useState(initial.travelMiles ?? DEFAULT_TRAVEL_MILES);
  const [alerts, setAlerts] = useState<AlertMode>(initial.alerts ?? DEFAULT_ALERTS);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  /** The demo draws sample people round your home; signed in there are none, and the demo area isn't offered. */
  const { backend, settings } = useStore();
  const demo = backend === 'local';
  /** The fixed demo area is for testing only: development builds, or with the demo's GPS skip on. */
  const devArea = demo && (__DEV__ || !!settings.simulateGps);

  const isDemoHome = !!home && home.lat === DEMO_HOME.lat && home.lng === DEMO_HOME.lng;

  /** Every way of setting home ends here: saved fuzzed to about half a mile, never exact. */
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

  async function submit() {
    if (saving) return;
    setError(null);
    setSaving(true);
    try {
      await onSubmit({ handle, name, region, home, travelMiles, alerts });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={{ gap: SPACING.section }}>
      <Section title="Handle">
        <TextField value={handle} onChangeText={setHandle} placeholder="e.g. night_owl" autoCapitalize="none" autoCorrect={false} accessibilityLabel="Handle" />
        <DsText v="caption">Shown on your profile, in chat and on trophies. Letters, numbers, dots and underscores.</DsText>
      </Section>

      <Section title="Display name">
        <TextField value={name} onChangeText={setName} placeholder="First name or nickname" accessibilityLabel="Display name" />
      </Section>

      <Section title="Home area">
        <DsText v="secondary">Only used to find events near you. It's saved to about half a mile, never your exact address, and nobody sees it.</DsText>
        <Button label={locating ? 'Finding you…' : 'Use my current location'} tier="secondary" block onPress={useMyLocation} busy={locating} />
        {locError ? <ErrorState title={locError} /> : null}
        <PlaceSearch placeholder="Or search your town or postcode" onPick={(h) => setHomeNear(h.at)} />
        <Button label={home ? 'Move it on the map' : 'Choose on the map'} tier="secondary" block onPress={() => setPicking(true)} />
        <Press
          onPress={() => setPicking(true)}
          label="Open the map to set your home area"
          style={{ height: 200, borderRadius: RADII.card, overflow: 'hidden', borderWidth: 1, borderColor: home ? COLOR.state.success : COLOR.surface.raisedHi }}
        >
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <NightMap key={`${centre.lat},${centre.lng}`} pins={[]} centre={centre} span={home ? 0.3 : 0.8} picked={home} />
          </View>
        </Press>
        <DsText v="meta" tone={home ? 'success' : 'secondary'}>
          {isDemoHome ? 'Home area set: the demo area (Tamworth)' : home ? 'Home area set, to about half a mile' : 'Not set yet'}
        </DsText>
        <DsText v="caption">
          {demo
            ? "Tap the map to fine-tune it. In the demo, the people and meets you see are made up and placed round your home area, so there's something to try."
            : 'Tap the map to fine-tune it.'}
        </DsText>
      </Section>

      <Section title="Region">
        <ChoiceGroup
          label="Set from your home area. Change it if it's wrong."
          options={REGIONS.map((r) => ({ key: r.name, label: r.name }))}
          value={region}
          onChange={pickRegion}
        />
      </Section>

      <Section title="Events near you">
        <TravelPrefs
          miles={travelMiles}
          alerts={alerts}
          onChange={(next) => {
            if (next.travelMiles !== undefined) setTravelMiles(next.travelMiles);
            if (next.alerts) setAlerts(next.alerts);
          }}
        />
      </Section>

      {devArea && !isDemoHome ? <Button label="Developer: use the demo area (Tamworth)" tier="secondary" block onPress={pickDemoArea} /> : null}

      <Button label={submitLabel} block onPress={submit} busy={saving} haptic="success" />
      {error ? <ErrorState title={error} /> : null}

      <MapPicker
        visible={picking}
        mode="point"
        title="Your home area"
        hint="Put the crosshair roughly where you live. It's saved to about half a mile, never your exact address."
        confirmLabel="Set home area here"
        colour={LAYER.event}
        start={centre}
        span={home ? 0.1 : 0.8}
        initial={home ? [home] : []}
        onDone={([stop]) => {
          setPicking(false);
          if (stop) setHomeNear(stop.at);
        }}
        onCancel={() => setPicking(false)}
      />
    </View>
  );
}
