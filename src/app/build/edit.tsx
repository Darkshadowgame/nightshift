import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import { Button, ClassBadge, ConfirmSheet, DsText, ErrorState, Icon, Press, Section, SegmentedControl } from '../../components/ds';
import { ClassUpMoment } from '../../components/motion';
import { s as ui } from '../../components/ui';
import { ModPicker } from '../../components/ModPicker';
import { SearchSelect } from '../../components/SearchSelect';
import { VehiclePicker } from '../../components/VehiclePicker';
import { allEngines, allVariants } from '../../data/vehicles';
import { classOf, classUp, effectivePower } from '../../lib/classes';
import { chassisWeight, isSwapMod, swapFromMods, swapProblem, swapSpecs, withSwapMod } from '../../lib/swap';
import { restage, stageFromMods, withStage, type StageEngine } from '../../lib/tune';
import { findDonor, findVariant, guessVariant, searchDonors, specFill, yearsLabel, type Aspiration, type Variant } from '../../lib/vehicles';
import { PhotoManager } from '../../components/PhotoManager';
import { plateRedactorAvailable } from '../../lib/photos';
import { newId, useStore } from '../../lib/store';
import type { Build, ClassLetter, EngineSwap, Mod, TuneStage, VehicleKind } from '../../lib/types';
import { SCREEN_TITLES, title } from '../../lib/glossary';
import { duplicateBuild } from '../../lib/rep';
import { COLOR, RADII, SPACING } from '../../theme';

/** Paint colours for the build's card: the owner's choice, from the paint palette (not layer or state colours). */
const COLOURS: readonly string[] = COLOR.paint;

function num(s: string): number | undefined {
  const n = Number(s.replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

/** A signed whole number ("-15", "+20"), or undefined. */
function signed(s: string): number | undefined {
  const n = Number(s.replace(/[^0-9.+-]/g, ''));
  return Number.isFinite(n) && n !== 0 ? Math.round(n) : undefined;
}

const str = (n: number | undefined) => (n ? String(n) : '');
const mid = () => newId('m');

export default function EditBuild() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const store = useStore();
  const existing = id ? store.builds.find((b) => b.id === id) : undefined;

  const variants = allVariants();
  const engines = allEngines();
  const initialVariant = existing
    ? findVariant(variants, existing.vehicleId) ?? guessVariant(variants, existing.kind, existing.make, existing.model, existing.engineSwap ? undefined : existing.stockBhp)
    : undefined;
  const swap0 = existing ? existing.engineSwap ?? swapFromMods(existing) : undefined;

  const [kind, setKind] = useState<VehicleKind>(existing?.kind ?? 'car');
  const [make, setMake] = useState(existing?.make ?? '');
  const [model, setModel] = useState(existing?.model ?? '');
  const [vehicleId, setVehicleId] = useState<string | undefined>(initialVariant?.id);
  const [year, setYear] = useState(existing?.year ? String(existing.year) : '');
  const [nickname, setNickname] = useState(existing?.nickname ?? '');
  // Chassis (base vehicle) figures. After a swap the build's stock bhp and torque are the donor's.
  const [stockBhp, setStockBhp] = useState(existing ? (swap0 ? str(initialVariant?.bhp) : String(existing.stockBhp)) : '');
  const [weight, setWeight] = useState(existing ? String(chassisWeight(existing)) : '');
  const [torque, setTorque] = useState(existing ? (swap0 ? str(initialVariant?.torqueLbFt) : str(existing.torqueLbFt)) : '');
  const [dyno, setDyno] = useState(existing?.dynoBhp ? String(existing.dynoBhp) : '');
  const [colour, setColour] = useState(existing?.colour ?? COLOURS[0]);
  const [mods, setMods] = useState<Mod[]>((existing?.mods ?? []).filter((m) => !isSwapMod(m)));
  const [stage, setStage] = useState<TuneStage>(existing?.tuneStage ?? stageFromMods(existing?.mods ?? []));
  const [aspGuess, setAspGuess] = useState<Aspiration | undefined>(undefined);
  const [swapOn, setSwapOn] = useState(!!swap0);
  const [donorId, setDonorId] = useState<string | undefined>(swap0?.donorId);
  const [donorMake, setDonorMake] = useState(swap0?.donorMake ?? '');
  const [donorModel, setDonorModel] = useState(swap0?.donorModel ?? '');
  const [donorVariant, setDonorVariant] = useState(swap0?.donorVariant ?? '');
  const [swapBhp, setSwapBhp] = useState(str(swap0?.bhp));
  const [swapTorque, setSwapTorque] = useState(str(swap0?.torqueLbFt));
  const [weightDelta, setWeightDelta] = useState(swap0?.weightDeltaKg ? String(swap0.weightDeltaKg) : '');
  const [photos, setPhotos] = useState<string[]>(existing?.photos ?? []);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [celebrate, setCelebrate] = useState<{ from: ClassLetter; to: ClassLetter } | null>(null);

  const variant = findVariant(variants, vehicleId);
  const donor = findDonor(engines, variants, donorId);
  const swap: EngineSwap | undefined = swapOn
    ? {
        donorMake: donorMake.trim(),
        donorModel: donorModel.trim(),
        donorVariant: donorVariant.trim() || undefined,
        donorId,
        bhp: num(swapBhp) ?? 0,
        torqueLbFt: num(swapTorque),
        weightDeltaKg: signed(weightDelta),
      }
    : undefined;
  const specs = swapSpecs(
    { stockBhp: num(stockBhp) ?? 0, weightKg: num(weight) ?? (kind === 'car' ? 1400 : 190), torqueLbFt: num(torque) },
    swap,
  );

  // The engine the tune stage applies to: the donor's after a swap.
  const engine: StageEngine | null = useMemo(() => {
    if (swapOn) {
      const bhp = num(swapBhp) ?? 0;
      return bhp > 0 ? { kind, bhp, asp: donor?.asp ?? aspGuess ?? (kind === 'bike' ? 'n' : undefined), stages: donor?.stages } : null;
    }
    const bhp = num(stockBhp) ?? 0;
    return bhp > 0 ? { kind, bhp, asp: variant?.asp ?? aspGuess ?? (kind === 'bike' ? 'n' : undefined), stages: variant?.stages } : null;
  }, [swapOn, swapBhp, stockBhp, kind, donor, variant, aspGuess]);
  const aspKnown = swapOn ? !!donor : !!variant;

  // When the engine changes, an untouched stage estimate follows it.
  const engineKey = engine ? `${engine.bhp}|${engine.asp ?? ''}|${JSON.stringify(engine.stages ?? {})}` : '';
  const lastEngine = useRef(engine);
  useEffect(() => {
    const before = lastEngine.current;
    lastEngine.current = engine;
    if (before !== engine) setMods((m) => restage(m, stage, before, engine));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engineKey]);

  // One id for a new build, made once: a fresh id each render made a second save add a second copy (B10).
  const [newBuildId] = useState(() => newId('b'));
  const draft: Build = {
    id: existing?.id ?? newBuildId,
    ownerId: store.me,
    kind,
    make: make.trim(),
    model: model.trim(),
    year: num(year),
    nickname: nickname.trim() || undefined,
    stockBhp: specs.stockBhp,
    weightKg: specs.weightKg,
    torqueLbFt: specs.torqueLbFt,
    dynoBhp: num(dyno),
    mods,
    photos,
    colour,
    vehicleId,
    tuneStage: stage === 'stock' ? undefined : stage,
    engineSwap: swap,
  };
  const ready = draft.make && draft.model && draft.stockBhp > 0;
  /** The same vehicle already in your garage (B3): saving adds a second one, so say so. */
  const twin = draft.make && draft.model ? duplicateBuild(draft, store.builds) : undefined;
  /** Close the form: back where you came from, or the Garage when it was opened by a link (no history). */
  const close = () => (router.canGoBack() ? router.back() : router.replace('/garage'));

  function pickVariant(v: Variant) {
    const fill = specFill(v, num(year));
    setMake(fill.make);
    setModel(fill.model);
    setYear(String(fill.year));
    setStockBhp(String(fill.stockBhp));
    setWeight(String(fill.weightKg));
    setTorque(str(fill.torqueLbFt));
    setVehicleId(v.id);
  }

  function changeKind(k: VehicleKind) {
    if (k === kind) return;
    setKind(k);
    setVehicleId(undefined);
    setDonorId(undefined);
  }

  async function save() {
    if (saving) return;
    if (!draft.make || !draft.model) return setError('Add the make and model.');
    const swapIssue = swapProblem(swap);
    if (swapIssue) return setError(swapIssue);
    if (!draft.stockBhp) return setError('Add the standard power (bhp) so the app can work out the class.');
    // The stage and the swap are also kept as engine mods (see tune.ts and swap.ts).
    const staged = stage === 'stock' ? withStage(mods, 'stock', undefined, mid) : mods;
    const final: Build = { ...draft, mods: withSwapMod(staged, swap, mid) };
    setError(null);
    setSaving(true);
    try {
      await store.saveBuild(final);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save the build.");
      return;
    } finally {
      setSaving(false);
    }
    // An edit that lifts the class gets its moment before closing.
    const up = classUp(existing ? classOf(existing) : null, classOf(final));
    if (up) setCelebrate(up);
    else close();
  }

  // A colour saved before the paint palette stays selectable, first.
  const swatches = existing?.colour && !COLOURS.includes(existing.colour) ? [existing.colour, ...COLOURS] : COLOURS;
  const twinName = twin ? [twin.year, twin.make, twin.model].filter(Boolean).join(' ') : '';

  return (
    <>
      <Stack.Screen options={{ title: title(existing ? SCREEN_TITLES.editBuild : SCREEN_TITLES.addBuild) }} />
      {celebrate ? <ClassUpMoment from={celebrate.from} to={celebrate.to} onDone={close} /> : null}
      <ScrollView
        contentContainerStyle={{ padding: SPACING.screen, gap: SPACING.section, paddingBottom: SPACING.xxxl }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        automaticallyAdjustKeyboardInsets
      >
        <Section title="1 · Car or bike">
          <SegmentedControl<VehicleKind>
            value={kind}
            onChange={changeKind}
            accessibilityLabel="Car or bike"
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
          <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
            <Field label="Year" value={year} onChange={setYear} flex={1} />
            <Field label="Nickname (optional)" value={nickname} onChange={setNickname} flex={2} text />
          </View>
          {variant ? <DsText v="caption">This version was sold {yearsLabel(variant)}.</DsText> : null}
        </Section>

        <Section title="2 · Power and weight">
          <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
            <Field label={swapOn ? 'Original bhp' : 'Standard bhp'} value={stockBhp} onChange={setStockBhp} />
            <Field label={kind === 'car' ? 'Kerb weight kg' : 'Wet weight kg'} value={weight} onChange={setWeight} />
          </View>
          <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
            <Field label={swapOn ? 'Original torque lb-ft' : 'Torque lb-ft'} value={torque} onChange={setTorque} />
            <Field label="Dyno bhp (optional)" value={dyno} onChange={setDyno} />
          </View>
          {ready ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.md }}>
              <ClassBadge letter={classOf(draft)} size="md" />
              <DsText v="secondary" style={{ flex: 1 }} accessibilityLiveRegion="polite">
                Class {classOf(draft)} at {Math.round(effectivePower(draft))} bhp{draft.dynoBhp ? ' (dyno)' : swapOn ? ' (donor engine plus mods)' : ' (standard plus mods)'}
                {swapOn ? ` and ${draft.weightKg} kg` : ''}.
              </DsText>
            </View>
          ) : (
            <DsText v="caption">Pick your car or bike above, or type its standard bhp, to see its class.</DsText>
          )}
        </Section>

        <Section title={`3 · Engine and mods (${mods.length + (swapOn && donorModel.trim() ? 1 : 0)})`}>
          <SegmentedControl<'original' | 'swapped'>
            value={swapOn ? 'swapped' : 'original'}
            onChange={(v) => setSwapOn(v === 'swapped')}
            accessibilityLabel="Engine"
            options={[
              { key: 'original', label: 'Original engine' },
              { key: 'swapped', label: 'Engine swap' },
            ]}
          />
          {swapOn ? (
            <View style={{ gap: SPACING.md }}>
              <SearchSelect
                label="Donor engine"
                value={donorModel ? `${donorMake} ${donorModel}`.trim() : ''}
                placeholder="Search engines and vehicles, e.g. K20 or Bandit 1200"
                search={(q) => searchDonors(engines, variants, kind, q, 40).map((d) => ({ key: d.id, title: `${d.make} ${d.name}`, detail: `${d.detail} · ${d.bhp} bhp` }))}
                onPick={(o) => {
                  const d = findDonor(engines, variants, o.key);
                  if (!d) return;
                  setDonorId(d.id);
                  setDonorMake(d.make);
                  setDonorModel(d.name);
                  setDonorVariant(d.detail);
                  setSwapBhp(String(d.bhp));
                  setSwapTorque(str(d.torqueLbFt));
                }}
                onFree={(t) => {
                  setDonorId(undefined);
                  setDonorMake('');
                  setDonorModel(t);
                  setDonorVariant('');
                }}
                freeLabel="Use my own:"
              />
              <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
                <Field label="Donor bhp" value={swapBhp} onChange={setSwapBhp} />
                <Field label="Donor torque lb-ft" value={swapTorque} onChange={setSwapTorque} />
              </View>
              <Field label="Weight change kg (+ or −, optional)" value={weightDelta} onChange={setWeightDelta} signed placeholder="e.g. +25 or -10" a11y="Weight change from the swap in kg" />
              <DsText v="caption">
                Class uses the donor engine's bhp with the {kind === 'car' ? 'car' : 'bike'}'s weight{signed(weightDelta) ? ` ${signed(weightDelta)! > 0 ? '+' : '−'} ${Math.abs(signed(weightDelta)!)} kg` : ''}. The tune stage below applies to the donor engine.
              </DsText>
            </View>
          ) : null}
          <ModPicker
            kind={kind}
            engine={engine}
            aspKnown={aspKnown}
            onAsp={setAspGuess}
            stage={stage}
            mods={mods}
            swapped={swapOn}
            onChange={(m, st) => {
              setMods(m);
              setStage(st);
            }}
          />
        </Section>

        <Section title="4 · Photos and colour">
          <PhotoManager photos={photos} onChange={setPhotos} onError={setError} saveLater />
          <DsText v="caption">
            Crop as you add, then tap a photo to crop it again, set the cover (first photo) or move it. Number plates are blurred on your phone before a photo is saved, and location data is removed.
            {plateRedactorAvailable ? '' : ' (Automatic plate detection only works in the iPhone app.)'}
          </DsText>
          <DsText v="label">Card colour</DsText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md }} accessibilityRole="radiogroup" accessibilityLabel="Card colour">
            {swatches.map((c, i) => (
              <Press
                key={c}
                onPress={() => setColour(c)}
                haptic="select"
                role="radio"
                label={`Colour ${i + 1} of ${swatches.length}`}
                state={{ checked: colour === c }}
                hitSlop={6}
                style={{ width: 32, height: 32, borderRadius: RADII.pill, backgroundColor: c, borderWidth: colour === c ? 3 : 1, borderColor: colour === c ? COLOR.action.selected : COLOR.surface.borderStrong }}
              >
                <View />
              </Press>
            ))}
          </View>
        </Section>

        <View style={{ gap: SPACING.md }}>
          {twin && !existing ? (
            <View style={{ flexDirection: 'row', gap: SPACING.sm, alignItems: 'flex-start' }} accessibilityRole="alert">
              <Icon name="alert" size={20} colour={COLOR.state.warning} />
              <DsText v="secondary" tone="warning" style={{ flex: 1 }}>
                {`You already have this ${twinName} in your garage. Saving adds a second one; its mods don't earn rep twice.`}
              </DsText>
            </View>
          ) : null}
          <Button label="Save build" size="lg" block haptic="success" onPress={save} busy={saving} />
          {error && !confirmDelete ? <ErrorState title={error} /> : null}
          {existing ? <Button label="Delete build" tier="destructive" block onPress={() => setConfirmDelete(true)} /> : null}
        </View>
      </ScrollView>
      {existing ? (
        <ConfirmSheet
          visible={confirmDelete}
          title="Delete build"
          message={`Delete ${existing.make} ${existing.model} from your garage? This can't be undone.${error ? `\n\n${error}` : ''}`}
          verb="Delete"
          onConfirm={() => {
            setError(null);
            store.deleteBuild(existing.id).then(() => router.dismissAll()).catch((e) => setError(e instanceof Error ? e.message : "Couldn't delete the build."));
          }}
          onCancel={() => setConfirmDelete(false)}
        />
      ) : null}
    </>
  );
}

/** A labelled number field (or text with `text`). Label above, as typed into the field. */
function Field({
  label,
  value,
  onChange,
  flex = 1,
  text,
  signed: allowSign,
  placeholder,
  a11y,
}: {
  label: string;
  value: string;
  onChange: (s: string) => void;
  flex?: number;
  text?: boolean;
  signed?: boolean;
  placeholder?: string;
  a11y?: string;
}) {
  return (
    <View style={{ flex, minWidth: 0, gap: SPACING.xs }}>
      <DsText v="label" numberOfLines={2}>
        {label}
      </DsText>
      <TextInput
        value={value}
        onChangeText={onChange}
        keyboardType={text ? 'default' : allowSign ? 'numbers-and-punctuation' : 'number-pad'}
        placeholder={placeholder}
        placeholderTextColor={COLOR.text.secondary}
        style={ui.input}
        accessibilityLabel={a11y ?? label}
      />
    </View>
  );
}
