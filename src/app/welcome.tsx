import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, DsText, ErrorState, SegmentedControl, Tag, typeStyle, useToast } from '../components/ds';
import { MapPicker } from '../components/MapPicker';
import { NightMap } from '../components/NightMap';
import { VehiclePicker } from '../components/VehiclePicker';
import { Wordmark } from '../components/Wordmark';
import { DEMO_HOME } from '../data/seed';
import { allVariants } from '../data/vehicles';
import { useAuth } from '../lib/auth';
import { markJustOnboarded } from '../lib/firstRun';
import { fuzz } from '../lib/geo';
import { newId } from '../lib/ids';
import { currentPosition } from '../lib/location';
import { nearestRegion, regionCentre, suggestHandle } from '../lib/profile';
import { useStore } from '../lib/store';
import type { Build, LatLng, VehicleKind } from '../lib/types';
import { findVariant, specFill, type Variant } from '../lib/vehicles';
import { COLOR, FONT_SCALE, LAYER, RADII, SPACING } from '../theme';

/** Where the map starts before a home is set: the middle of England, zoomed out. */
const UK_MIDDLE = regionCentre('Midlands');

/**
 * The first 30 seconds (docs/SPEC.md). Two questions, then Tonight:
 * 1. What do you drive? The vehicle quick search; one tap fills in the stock specs. Skip for now.
 * 2. Where's home, and what should people call you? Home is saved to about 1 km and sets the region.
 * Then Tonight opens with tonight's pick and "I'm going" with the car you just added.
 * Travel distance and notifications start at sensible defaults (25 mi, notify) and live in Settings.
 * The 18+ and terms box is at sign-in. The guard in _layout moves on once the profile is saved.
 */
export default function Welcome() {
  const { saveProfile, saveBuild, backend, me, settings } = useStore();
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

  // Step 2: home and handle (also the display name to start with; change it on your profile).
  const [handle, setHandle] = useState('');
  /** The demo needs no handle typed: one is made up, changeable on your profile (REVIEW-9). */
  const [handleSeed] = useState(() => 1000 + Math.floor(Math.random() * 9000));
  const [home, setHome] = useState<LatLng | null>(null);
  const [picking, setPicking] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function pickVariant(v: Variant) {
    setVehicleId(v.id);
    setMake(v.make);
    setModel(v.model);
  }

  async function useMyLocation() {
    setLocating(true);
    setLocError(null);
    const pos = await currentPosition(true);
    setLocating(false);
    if (pos.ok) setHome(fuzz(pos.at));
    else setLocError(pos.reason === 'denied' ? 'Location is off for Nightshift. Choose home on the map instead.' : "Couldn't find where you are. Choose home on the map instead.");
  }

  async function finish() {
    if (saving || !home) return;
    setError(null);
    setSaving(true);
    const build: Build | null = variant
      ? { id: newId('b'), ownerId: me, kind: variant.kind, ...specFill(variant), mods: [], photos: [], colour: COLOR.paint[3], vehicleId: variant.id }
      : null;
    try {
      // Tonight reads this as it opens (the profile saving is what opens it).
      markJustOnboarded(build?.id);
      const h = handle.trim().replace(/^@+/, '') || (demo ? suggested : '');
      await saveProfile({ handle: h, name: h, region: nearestRegion(home), home });
      if (build) await saveBuild(build).catch((e) => toast({ message: e instanceof Error ? e.message : "Couldn't save your car. Add it in the Garage.", tone: 'danger' }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save that.");
      setSaving(false);
    }
  }

  const suggested = suggestHandle(variant?.model, handleSeed);
  // The fixed demo area is for testing only: development builds, or with the demo's GPS skip on.
  const devArea = demo && (__DEV__ || settings.simulateGps);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        ref={scroller}
        contentContainerStyle={[st.page, { paddingTop: insets.top + SPACING.xl, paddingBottom: SPACING.xl }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        <View style={{ gap: SPACING.sm }}>
          <Wordmark compact />
          <View style={st.who}>
            <DsText v="caption" style={{ flexShrink: 1 }}>
              {demo ? 'Demo: sample people and events, nothing leaves this phone.' : `Signed in${auth.email ? ` as ${auth.email}` : ''}.`}
            </DsText>
            <Button label={demo ? 'Sign in instead' : 'Not you? Sign out'} tier="tertiary" size="sm" onPress={() => (demo ? auth.leaveDemo() : auth.signOut())} />
          </View>
        </View>

        {step === 1 ? (
          <View style={{ gap: SPACING.lg }}>
            <View style={{ gap: SPACING.xs }}>
              <DsText v="eyebrow" tone="action">
                Step 1 of 2
              </DsText>
              <DsText v="heading" accessibilityRole="header">
                What do you drive?
              </DsText>
              <DsText v="secondary">It's what you bring to meets, and it decides which invites you get. Search, then tap yours.</DsText>
            </View>
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
              searchFirst
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
          </View>
        ) : (
          <View style={{ gap: SPACING.lg }}>
            <View style={{ gap: SPACING.xs }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <DsText v="eyebrow" tone="action">
                  Step 2 of 2
                </DsText>
                <Button label="Back" icon="back" tier="tertiary" size="sm" accessibilityLabel="Back to step 1" onPress={() => setStep(1)} />
              </View>
              <DsText v="heading" accessibilityRole="header">
                Where's home?
              </DsText>
              <DsText v="secondary">So Tonight shows what's on near you. It's saved to about 1 km, never your exact address, and nobody else sees it.</DsText>
            </View>
            <Pressable
              onPress={() => setPicking(true)}
              accessibilityRole="button"
              accessibilityLabel={home ? 'Home area set. Move it on the map' : 'Choose your home area on the map'}
              style={[st.map, home && { borderColor: COLOR.action.selected }]}
            >
              <View style={StyleSheet.absoluteFill} pointerEvents="none">
                <NightMap key={home ? `${home.lat},${home.lng}` : 'none'} pins={[]} centre={home ?? UK_MIDDLE} span={home ? 0.3 : 4} picked={home} />
              </View>
            </Pressable>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
              {home ? <Tag label="Home area set" tone="success" /> : <Tag label="Not set yet" />}
              {home ? <DsText v="caption">{nearestRegion(home)}, to about 1 km</DsText> : null}
            </View>
            <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
              <Button label={home ? 'Move it' : 'Choose on map'} tier="secondary" onPress={() => setPicking(true)} style={{ flex: 1 }} block />
              <Button label="Use my location" tier="secondary" busy={locating} onPress={useMyLocation} style={{ flex: 1 }} block />
            </View>
            {locError ? <ErrorState title={locError} /> : null}
            {devArea ? <Button label="Developer: use the demo area (Tamworth)" tier="tertiary" size="sm" onPress={() => setHome(DEMO_HOME)} /> : null}

            <View style={{ gap: SPACING.xs }}>
              <DsText v="label">Your handle</DsText>
              <TextInput
                value={handle}
                onChangeText={setHandle}
                placeholder={demo ? suggested : 'e.g. night_owl'}
                placeholderTextColor={COLOR.text.secondary}
                autoCapitalize="none"
                autoCorrect={false}
                maxFontSizeMultiplier={FONT_SCALE.chrome}
                style={[typeStyle('input'), st.input]}
                accessibilityLabel="Your handle"
              />
              <DsText v="caption">
                {demo
                  ? `Shown on your profile, in chat and on trophies. Leave it empty in the demo to be @${suggested}; change it any time on your profile.`
                  : 'Shown on your profile, in chat and on trophies. Letters, numbers, dots and underscores.'}
              </DsText>
            </View>

            {variant ? <DsText v="caption">{`Bringing: ${variant.make} ${variant.model} ${variant.gen}. Add mods later in the Garage.`}</DsText> : null}
          </View>
        )}

        <MapPicker
          visible={picking}
          mode="point"
          title="Your rough home area"
          hint="Put the crosshair roughly where you live. It's saved to about 1 km, never your exact address."
          confirmLabel="Set home area here"
          colour={LAYER.event}
          start={home ?? UK_MIDDLE}
          span={home ? 0.1 : 3}
          locateOnOpen={!home}
          initial={home ? [home] : []}
          onDone={([stop]) => {
            setPicking(false);
            if (stop) {
              setHome(fuzz(stop.at));
              // The "Location is off" line is answered once home is set on the map (REVIEW-9).
              setLocError(null);
            }
          }}
          onCancel={() => setPicking(false)}
        />
      </ScrollView>
      {/* The step's main button stays on screen (as in the host form), so picking a car never hides Next. */}
      <View style={[st.footer, { paddingBottom: Math.max(insets.bottom, SPACING.lg) }]}>
        {step === 1 ? (
          <>
            <Button label="Next" size="lg" block disabled={!variant} hint="Pick yours from the list, or skip for now" onPress={() => setStep(2)} />
            <Button
              label="Skip for now"
              tier="tertiary"
              size="sm"
              onPress={() => {
                setVehicleId(undefined);
                setStep(2);
              }}
              style={{ alignSelf: 'center' }}
              accessibilityHint="You can add it later in the Garage"
            />
          </>
        ) : (
          <>
            {error ? <ErrorState title={error} /> : null}
            <Button
              label="Show me tonight"
              size="lg"
              block
              busy={saving}
              haptic="success"
              disabled={!home || (handle.trim().length < 3 && !(demo && handle.trim().length === 0))}
              hint={!home ? 'Set your home area first' : 'Add a handle first'}
              onPress={finish}
            />
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const st = StyleSheet.create({
  page: { paddingHorizontal: SPACING.screen, gap: SPACING.xl },
  who: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: SPACING.sm },
  map: { height: 200, borderRadius: RADII.card, overflow: 'hidden', borderWidth: 1, borderColor: COLOR.surface.borderStrong },
  footer: { paddingHorizontal: SPACING.screen, paddingTop: SPACING.md, gap: SPACING.xs, borderTopWidth: 1, borderTopColor: COLOR.surface.border, backgroundColor: COLOR.surface.bg },
  input: { minHeight: 48, paddingHorizontal: SPACING.md, borderRadius: RADII.control, borderWidth: 1, borderColor: COLOR.surface.borderStrong, backgroundColor: COLOR.surface.card },
});
