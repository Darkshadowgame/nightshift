import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { DEMO_HOME, DEMO_REGION } from '../data/seed';
import { DEFAULT_ALERTS, DEFAULT_TRAVEL_MILES, type AlertMode } from '../lib/discover';
import { fuzz } from '../lib/geo';
import { currentPosition, locationHelp } from '../lib/location';
import { nearestRegion, REGIONS, regionCentre, type ProfileDraft } from '../lib/profile';
import type { LatLng } from '../lib/types';
import { useStore } from '../lib/store';
import { COLOR, LAYER, RADII, SPACING } from '../theme';
import { MapPicker } from './MapPicker';
import { NightMap } from './NightMap';
import { PlaceSearch } from './PlaceSearch';
import { useDiscardGuard } from './ComposerParts';
import { ActionBar, Button, ChoiceGroup, DsText, ErrorState, ListRow, PAGE_WITH_BAR, Press, Section, Sheet, TextField, useToast } from './ds';

/**
 * Your profile (Settings → Handle, name and home area): handle, name, rough home area and region.
 * How far you'd travel and new-meet alerts live in Settings only (one setting, one place; Review 17).
 * Region has 11 options, so it's a row that opens a list sheet (4.4: pills up to 5, a list beyond). A T4 form (Redesign 2, 4.2 and 4.3; Review 14 decision 3): Save is the
 * ActionBar's primary, always in view; back with changes asks first ("Discard it" / "Keep
 * editing"); a save says "Saved" and goes back.
 */
export function ProfileForm({
  initial,
  submitLabel,
  onSubmit,
  onSaved,
}: {
  initial: ProfileDraft;
  submitLabel: string;
  /** May reject with a readable reason, shown under the form. */
  onSubmit: (draft: ProfileDraft) => void | Promise<void>;
  /** After a save: leave the form (the discard guard is off by then). */
  onSaved: () => void;
}) {
  const toast = useToast();
  const [handle, setHandle] = useState(initial.handle);
  const [name, setName] = useState(initial.name);
  const [region, setRegion] = useState(initial.region);
  const [home, setHome] = useState<LatLng | null>(initial.home);
  const [centre, setCentre] = useState<LatLng>(initial.home ?? regionCentre(initial.region));
  // Set in Settings; passed through unchanged so a save never resets them.
  const travelMiles = initial.travelMiles ?? DEFAULT_TRAVEL_MILES;
  const alerts: AlertMode = initial.alerts ?? DEFAULT_ALERTS;
  const [regionOpen, setRegionOpen] = useState(false);
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

  // Back with changes asks first (4.2).
  const snapshot = JSON.stringify([handle, name, region, home]);
  const [first] = useState(snapshot);
  const guard = useDiscardGuard(snapshot !== first, 'your changes');

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
    // Why, and how to turn it on (Review 14); the map always works instead.
    else setLocError(`${locationHelp(pos.reason)} Or move it on the map.`);
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
      toast({ message: 'Saved' });
      guard.leave(onSaved);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLOR.surface.bg }}>
    <ScrollView contentContainerStyle={PAGE_WITH_BAR} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive" automaticallyAdjustKeyboardInsets showsVerticalScrollIndicator={false}>
      <Section title="Handle">
        <TextField value={handle} onChangeText={setHandle} placeholder="e.g. night_owl" autoCapitalize="none" autoCorrect={false} accessibilityLabel="Handle" />
        <DsText v="caption">Shown on your profile, in chat and on trophies. Letters, numbers, dots and underscores.</DsText>
      </Section>

      <Section title="Display name">
        <TextField value={name} onChangeText={setName} placeholder="First name or nickname" accessibilityLabel="Display name" />
      </Section>

      <Section title="Home area">
        <DsText v="secondary">Only used to find meets near you. It's saved to about half a mile, never your exact address, and nobody sees it.</DsText>
        <Button label={locating ? 'Finding you…' : 'Use my current location'} tier="secondary" block onPress={useMyLocation} busy={locating} />
        {locError ? <ErrorState title={locError} /> : null}
        <PlaceSearch placeholder="Town or postcode" onPick={(h) => setHomeNear(h.at)} />
        <Button label={home ? 'Move it on the map' : 'Choose on the map'} tier="secondary" block onPress={() => setPicking(true)} />
        <Press
          onPress={() => setPicking(true)}
          label="Open the map to set your home area"
          style={{ height: 200, borderRadius: RADII.card, overflow: 'hidden', borderWidth: 1, borderColor: home ? COLOR.state.success : COLOR.surface.raisedHi }}
        >
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <NightMap key={`${centre.lat},${centre.lng}`} labels={false} pins={[]} centre={centre} span={home ? 0.3 : 0.8} picked={home} />
          </View>
        </Press>
        <DsText v="meta" tone={home ? 'success' : 'secondary'}>
          {isDemoHome ? 'Home area set: the demo area (Tamworth)' : home ? 'Home area set, to about half a mile' : 'Not set yet'}
        </DsText>
        {/* No demo note here (4.6, Review 14): the Demo night tag explains the demo. */}
        <DsText v="caption">Tap the map to fine-tune it.</DsText>
      </Section>

      <Section title="Region">
        <ListRow title={region || 'Choose your region'} subtitle="Set from your home area. Change it if it's wrong." onPress={() => setRegionOpen(true)} accessibilityHint="Opens the list of regions" />
      </Section>

      {devArea && !isDemoHome ? <Button label="Developer: use the demo area (Tamworth)" tier="secondary" block onPress={pickDemoArea} /> : null}

      {error ? <ErrorState title={error} /> : null}
    </ScrollView>
    <ActionBar primary={{ label: submitLabel, onPress: () => void submit(), busy: saving, haptic: 'success' }} />
    {guard.sheet}

      <Sheet visible={regionOpen} title="Region" onClose={() => setRegionOpen(false)}>
        <ChoiceGroup
          label=""
          layout="list"
          options={REGIONS.map((r) => ({ key: r.name, label: r.name }))}
          value={region}
          onChange={(r) => {
            pickRegion(r);
            setRegionOpen(false);
          }}
        />
      </Sheet>

      <MapPicker
        visible={picking}
        mode="point"
        title="Your home area"
        hint="Roughly where you live, not your address."
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
