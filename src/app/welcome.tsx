import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ActionBar, Button, DsText, ErrorState, Field, IconButton, SegmentedControl, StepHeading, TextField, useToast } from '../components/ds';
import { MapEdgeFade } from '../components/MapEdgeFade';
import { MapPicker } from '../components/MapPicker';
import { NightMap } from '../components/NightMap';
import { VehiclePicker } from '../components/VehiclePicker';
import { DEMO_HOME } from '../data/seed';
import { allVariants } from '../data/vehicles';
import { useAuth } from '../lib/auth';
import { markJustOnboarded } from '../lib/firstRun';
import { fuzz, milesBetween } from '../lib/geo';
import { newId } from '../lib/ids';
import { currentPosition } from '../lib/location';
import { areaNameNear, nearestRegion, regionCentre, suggestHandle } from '../lib/profile';
import { sameHome, SCENE_NEAR_MILES } from '../lib/scene';
import { useStore } from '../lib/store';
import type { Build, LatLng, VehicleKind } from '../lib/types';
import { findVariant, specFill, type Variant } from '../lib/vehicles';
import { COLOR, LAYER, RADII, SPACING } from '../theme';

/** Where the map starts before a home is set: the middle of England, zoomed out. */
const UK_MIDDLE = regionCentre('Midlands');
/** The home circle on the map: saved to about half a mile. */
const HOME_RADIUS_MILES = 0.6;

/**
 * Onboarding (Redesign 2, 3.2): two steps, under a minute, then Tonight.
 * 1. What do you drive? Car or bike, one search, tap yours: the picked card (class badge and bhp)
 *    replaces the results. "Can't find it? Enter it yourself" opens make and model. Skip for now.
 * 2. Where's home? A real map with the area circle (the demo starts on the sample area), and a
 *    handle, pre-filled with a suggestion. Home is saved to about half a mile (4.9: miles) and sets the region.
 * Travel distance and notifications start at sensible defaults (25 mi, notify) and live in
 * Settings. The 18+ and terms box is at sign-in. The guard in _layout moves on once the profile
 * is saved. Onboarding draws its own header: back, then GET STARTED (and Sign out when signed in);
 * the step is the body's StepHeading, as in the host flow. Back on step 1 of the demo goes back
 * to sign-in (it leaves the demo), so the header never says "Sign in instead" in the middle of the
 * demo. Never a back button at the bottom.
 */
export default function Welcome() {
  const { saveProfile, saveBuild, backend, me } = useStore();
  const auth = useAuth();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const demo = backend === 'local';
  const [step, setStep] = useState<1 | 2>(1);
  // Each step starts at the top.
  const scroller = useRef<ComponentRef<typeof ScrollView>>(null);
  useEffect(() => {
    scroller.current?.scrollTo({ y: 0, animated: false });
  }, [step]);

  // Step 1: the car or bike.
  const [kind, setKind] = useState<VehicleKind>('car');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [vehicleId, setVehicleId] = useState<string | undefined>();
  const variant = findVariant(allVariants(), vehicleId);
  const [pickError, setPickError] = useState<string | null>(null);

  // Step 2: home and handle (also the display name to start with; change it on your profile).
  const [handleSeed] = useState(() => 1000 + Math.floor(Math.random() * 9000));
  const [handle, setHandle] = useState('');
  // The demo starts on the sample area, so step 2 needs nothing; tapping the map moves it.
  const [home, setHome] = useState<LatLng | null>(demo ? DEMO_HOME : null);
  const { height: screenH, fontScale } = useWindowDimensions();
  const small = screenH < 740;
  const [picking, setPicking] = useState(false);
  /** Home came from the phone's location: say so, and offer only Move it (Review 19 #4). */
  const [fromFix, setFromFix] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  /** Home is still the demo's own (no location, or a phone far from the sample meets). */
  const demoHome = demo && !!home && sameHome(DEMO_HOME, home);

  // Step 2: when location is already allowed (no prompt), home starts where you are, named after your
  // real nearest town (Review 20, owner decision 1). The demo keeps its own home (Tamworth, said
  // "Demo home: Tamworth") only for a phone far from its sample meets.
  useEffect(() => {
    if (step !== 2 || fromFix) return;
    let live = true;
    currentPosition(false).then((pos) => {
      if (!live || !pos.ok) return;
      if (demo && milesBetween(pos.at, DEMO_HOME) > SCENE_NEAR_MILES) return;
      setHome(fuzz(pos.at));
      setFromFix(true);
    });
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  function pickVariant(v: Variant) {
    setVehicleId(v.id);
    setMake(v.make);
    setModel(v.model);
    setPickError(null);
  }

  function toStep2(keepCar: boolean) {
    if (!keepCar) setVehicleId(undefined);
    // The handle starts as a suggestion from the car (change it here or on your profile later).
    if (!handle.trim()) setHandle(suggestHandle(keepCar ? variant?.model : undefined, handleSeed));
    setStep(2);
  }

  async function useMyLocation() {
    setLocating(true);
    setLocError(null);
    const pos = await currentPosition(true);
    setLocating(false);
    if (pos.ok) {
      setHome(fuzz(pos.at));
      setFromFix(true);
    } else setLocError(pos.reason === 'denied' ? 'Location is off for Nightshift. Tap the map to choose home instead.' : "Couldn't find where you are. Tap the map to choose home instead.");
  }

  async function finish() {
    if (saving) return;
    if (!home) return setError('Choose home on the map, or use your location.');
    const h = handle.trim().replace(/^@+/, '');
    if (h.length < 3) return setError('Your handle needs at least 3 letters or numbers.');
    setError(null);
    setSaving(true);
    const build: Build | null = variant
      ? { id: newId('b'), ownerId: me, kind: variant.kind, ...specFill(variant), mods: [], photos: [], colour: COLOR.paint[3], vehicleId: variant.id }
      : null;
    try {
      // Tonight reads this as it opens (the profile saving is what opens it).
      markJustOnboarded(build?.id);
      await saveProfile({ handle: h, name: h, region: nearestRegion(home), home });
      if (build) await saveBuild(build).catch((e) => toast({ message: e instanceof Error ? e.message : "Couldn't save your car. Add it in the Garage.", tone: 'danger' }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save that.");
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: COLOR.surface.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[st.header, { paddingTop: insets.top + SPACING.xs }]}>
        {step === 2 ? (
          <IconButton icon="back" label="Go back" colour={COLOR.text.primary} onPress={() => setStep(1)} />
        ) : demo && auth.accountWaiting ? (
          <IconButton icon="back" label="Back to my account" colour={COLOR.text.primary} onPress={() => auth.backToAccount()} />
        ) : demo ? (
          <IconButton icon="back" label="Back to sign-in" colour={COLOR.text.primary} onPress={() => auth.leaveDemo()} />
        ) : (
          <View style={{ width: SPACING.sm }} />
        )}
        <DsText v="heading" accessibilityRole="header" style={{ flex: 1 }}>
          GET STARTED
        </DsText>
        {demo ? null : <Button label="Sign out" tier="tertiary" size="sm" onPress={() => auth.signOut()} />}
      </View>
      <ScrollView ref={scroller} contentContainerStyle={st.page} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive">
        {step === 1 ? (
          <>
            <StepHeading step={1} of={2} title="What do you drive?" hint="It's what you bring to meets." />
            <SegmentedControl
              accessibilityLabel="Car or bike"
              value={kind}
              onChange={(k) => {
                setKind(k);
                setMake('');
                setModel('');
                setVehicleId(undefined);
              }}
              options={[
                { key: 'car', label: 'Car' },
                { key: 'bike', label: 'Bike' },
              ]}
            />
            <VehiclePicker
              kind={kind}
              make={make}
              model={model}
              vehicleId={vehicleId}
              onMakeModel={(mk, md) => {
                setMake(mk);
                setModel(md);
                setVehicleId(undefined);
              }}
              onPickVariant={pickVariant}
            />
            {pickError ? <ErrorState title={pickError} /> : null}
          </>
        ) : (
          <>
            <StepHeading step={2} of={2} title="Where's home?" hint="So Tonight shows what's on near you." />
            <Pressable
              onPress={() => setPicking(true)}
              accessibilityRole="button"
              accessibilityLabel={home ? 'Home area set. Move it on the map' : 'Choose your home area on the map'}
              // Shorter on a small phone or at large text, so the handle's hint is above the bar (Review 19 #6).
              style={[st.map, { height: fontScale > 1.15 ? 130 : small ? 150 : 220 }]}
            >
              {/* zIndex 0 keeps the web map's own layers inside this box, under the edge fade. */}
              <View style={[StyleSheet.absoluteFill, { zIndex: 0 }]} pointerEvents="none">
                <NightMap
                  labels={false}
                  key={home ? `${home.lat},${home.lng}` : 'none'}
                  pins={[]}
                  circles={home ? [{ id: 'home', centre: home, radiusMiles: HOME_RADIUS_MILES, colour: LAYER.event }] : []}
                  centre={home ?? UK_MIDDLE}
                  span={home ? 0.12 : 4}
                />
              </View>
              <MapEdgeFade />
              {!home ? (
                <View pointerEvents="none" style={[StyleSheet.absoluteFill, st.mapPrompt]}>
                  <DsText v="buttonSm">Tap to choose on the map</DsText>
                </View>
              ) : null}
            </Pressable>
            {/* Where home is, and the one way to change it, on one line: "Around Lichfield · Move it". The
                demo's own home says that it is one, once: "Demo home: Tamworth" (Review 20, owner decision 1). */}
            <View style={{ gap: SPACING.xxs }}>
              {home ? (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', columnGap: SPACING.sm }}>
                  <DsText v="bodyStrong" style={{ flexShrink: 1 }}>{demoHome ? `Demo home: ${areaNameNear(home)}` : `Around ${areaNameNear(home)}`}</DsText>
                  <Button label="Move it" tier="tertiary" size="sm" accessibilityLabel="Move your home area on the map" onPress={() => setPicking(true)} />
                </View>
              ) : null}
              <DsText v="secondary">
                {fromFix ? 'From your location. Saved roughly, never your address.' : demoHome ? "The demo's sample meets are round here." : 'Saved roughly, never your address.'}
              </DsText>
            </View>
            {fromFix ? null : <Button label={home ? 'Use my location instead' : 'Use my location'} tier="tertiary" size="sm" busy={locating} onPress={useMyLocation} style={{ alignSelf: 'flex-start' }} />}
            {locError ? <ErrorState title={locError} /> : null}
            {__DEV__ && demo && home !== DEMO_HOME ? <Button label="Developer: use the demo area" tier="tertiary" size="sm" onPress={() => setHome(DEMO_HOME)} /> : null}

            <Field label="Your handle" hint="Shown on your profile and in chat. Change it any time.">
              <TextField
                value={handle}
                onChangeText={setHandle}
                placeholder="e.g. night_owl"
                autoCapitalize="none"
                autoCorrect={false}
                accessibilityLabel="Your handle"
              />
            </Field>
          </>
        )}

        <MapPicker
          visible={picking}
          mode="point"
          title="Your home area"
          hint="Roughly where you live, not your address."
          confirmLabel="Set home area here"
          colour={LAYER.event}
          start={home ?? UK_MIDDLE}
          span={home ? 0.1 : 3}
          locateOnOpen={!home}
          initial={home ? [home] : []}
          onDone={([spot]) => {
            setPicking(false);
            if (spot) {
              setHome(fuzz(spot.at));
              setFromFix(false);
              setLocError(null);
              setError(null);
            }
          }}
          onCancel={() => setPicking(false)}
        />
      </ScrollView>
      {step === 2 && error ? (
        <View style={{ paddingHorizontal: SPACING.screen, paddingBottom: SPACING.sm }}>
          <ErrorState title={error} />
        </View>
      ) : null}
      {step === 1 ? (
        <ActionBar
          primary={{
            label: 'Next',
            onPress: () => (variant ? toStep2(true) : setPickError('Pick yours from the list, or skip for now.')),
          }}
          secondary={{ label: 'Skip for now', onPress: () => toStep2(false), accessibilityHint: 'You can add it later in the Garage' }}
        />
      ) : (
        <ActionBar primary={{ label: 'Show me tonight', onPress: finish, busy: saving, haptic: 'success' }} />
      )}
    </KeyboardAvoidingView>
  );
}

const st = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, paddingHorizontal: SPACING.xs, paddingBottom: SPACING.xs },
  page: { paddingHorizontal: SPACING.screen, paddingTop: SPACING.sm, paddingBottom: SPACING.xl, gap: SPACING.md },
  map: { borderRadius: RADII.card, overflow: 'hidden', borderWidth: 1, borderColor: COLOR.surface.borderStrong },
  mapPrompt: { alignItems: 'center', justifyContent: 'center', backgroundColor: COLOR.surface.scrim },
});
