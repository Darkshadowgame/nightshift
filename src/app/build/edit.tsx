import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { ClassUpMoment } from '../../components/motion';
import { Button, Card, Chip, ClassBadge, ConfirmBox, InlineError, Row, Section, Txt, s as ui } from '../../components/ui';
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
import { BRAND, C } from '../../theme';

/** Paint colours for the build's card: the owner's choice, not theme roles. */
const COLOURS = ['#ff9a2e', '#3fd6ff', '#ff4fa3', '#9dfa5a', '#ff4d4d', '#3f6fff', '#9b5de5', '#e9edf4', '#7a7f8c'];

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

  const draft: Build = {
    id: existing?.id ?? newId('b'),
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
      setError(e instanceof Error ? e.message : 'Could not save the build.');
      return;
    } finally {
      setSaving(false);
    }
    // An edit that lifts the class gets its moment before closing.
    const up = classUp(existing ? classOf(existing) : null, classOf(final));
    if (up) setCelebrate(up);
    else router.back();
  }

  return (
    <>
    <Stack.Screen options={{ title: title(existing ? SCREEN_TITLES.editBuild : SCREEN_TITLES.addBuild) }} />
    {celebrate ? <ClassUpMoment from={celebrate.from} to={celebrate.to} onDone={() => router.back()} /> : null}
    <ScrollView
      contentContainerStyle={{ padding: 16, gap: 20, paddingBottom: 60 }}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
      automaticallyAdjustKeyboardInsets
    >
      <Section title="Car or bike">
        <Row gap={6}>
          <Chip label="Car" on={kind === 'car'} onPress={() => changeKind('car')} />
          <Chip label="Bike" on={kind === 'bike'} onPress={() => changeKind('bike')} />
        </Row>
      </Section>

      <Section title="Make and model">
        <VehiclePicker
          kind={kind}
          make={make}
          model={model}
          vehicleId={vehicleId}
          onMakeModel={(mk, md) => { setMake(mk); setModel(md); setVehicleId(undefined); }}
          onPickVariant={pickVariant}
        />
        <Row style={{ flexWrap: 'nowrap' }}>
          <TextInput value={year} onChangeText={setYear} placeholder="Year" keyboardType="number-pad" placeholderTextColor={C.fog} style={[ui.input, { flex: 1, minWidth: 0 }]} accessibilityLabel="Year" />
          <TextInput value={nickname} onChangeText={setNickname} placeholder="Nickname (optional)" placeholderTextColor={C.fog} style={[ui.input, { flex: 2, minWidth: 0 }]} accessibilityLabel="Nickname" />
        </Row>
        {variant ? <Txt v="caption">This version was sold {yearsLabel(variant)}.</Txt> : null}
      </Section>

      <Section title="Engine swap">
        <Row gap={6}>
          <Chip label="Original engine" on={!swapOn} onPress={() => setSwapOn(false)} />
          <Chip label="Engine swapped" on={swapOn} onPress={() => setSwapOn(true)} />
        </Row>
        {swapOn ? (
          <Card accent={BRAND}>
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
              onFree={(t) => { setDonorId(undefined); setDonorMake(''); setDonorModel(t); setDonorVariant(''); }}
              freeLabel="Use my own:"
            />
            <Row style={{ flexWrap: 'nowrap' }}>
              <Field label="Donor bhp" value={swapBhp} onChange={(t) => setSwapBhp(t)} />
              <Field label="Donor torque lb-ft" value={swapTorque} onChange={setSwapTorque} />
            </Row>
            <View style={{ gap: 4 }}>
              <Txt v="label">Weight change kg (+ or −, optional)</Txt>
              <TextInput value={weightDelta} onChangeText={setWeightDelta} keyboardType="numbers-and-punctuation" placeholder="e.g. +25 or -10" placeholderTextColor={C.fog} style={ui.input} accessibilityLabel="Weight change from the swap in kg" />
            </View>
            <Txt v="caption">
              Class uses the donor engine's bhp with the {kind === 'car' ? 'car' : 'bike'}'s weight{signed(weightDelta) ? ` ${signed(weightDelta)! > 0 ? '+' : '−'} ${Math.abs(signed(weightDelta)!)} kg` : ''}. The tune stage below applies to the donor engine.
            </Txt>
          </Card>
        ) : null}
      </Section>

      <Section title="Specs">
        <Row style={{ flexWrap: 'nowrap' }}>
          <Field label={swapOn ? 'Original bhp' : 'Standard bhp'} value={stockBhp} onChange={setStockBhp} />
          <Field label={kind === 'car' ? 'Kerb weight kg' : 'Wet weight kg'} value={weight} onChange={setWeight} />
        </Row>
        <Row style={{ flexWrap: 'nowrap' }}>
          <Field label={swapOn ? 'Original torque lb-ft' : 'Torque lb-ft'} value={torque} onChange={setTorque} />
          <Field label="Dyno bhp (if you have a sheet)" value={dyno} onChange={setDyno} />
        </Row>
        {ready ? (
          <Card accent={BRAND}>
            <Row style={{ flexWrap: 'nowrap' }} gap={12}>
              <ClassBadge letter={classOf(draft)} size="md" />
              <Txt v="muted" style={{ flex: 1 }} accessibilityLiveRegion="polite">
                Class {classOf(draft)} at {Math.round(effectivePower(draft))} bhp{draft.dynoBhp ? ' (dyno)' : swapOn ? ' (donor engine plus mod gains)' : ' (standard plus mod gains)'}
                {swapOn ? ` and ${draft.weightKg} kg` : ''}.
              </Txt>
            </Row>
          </Card>
        ) : null}
      </Section>

      <Section title={`Mods (${mods.length + (swapOn && donorModel.trim() ? 1 : 0)})`}>
        <ModPicker
          kind={kind}
          engine={engine}
          aspKnown={aspKnown}
          onAsp={setAspGuess}
          stage={stage}
          mods={mods}
          swapped={swapOn}
          onChange={(m, st) => { setMods(m); setStage(st); }}
        />
      </Section>

      <Section title="Photos">
        <PhotoManager photos={photos} onChange={setPhotos} onError={setError} saveLater />
        <Txt v="caption">
          Crop as you add, then tap a photo to crop it again, set the cover (first photo) or move it. Number plates are blurred on your phone before a photo is saved, and location data is removed.
          {plateRedactorAvailable ? '' : ' (Automatic plate detection only works in the iPhone app.)'}
        </Txt>
      </Section>

      <Section title="Card colour">
        <Row gap={10}>
          {COLOURS.map((c) => (
            <Pressable
              key={c}
              onPress={() => setColour(c)}
              accessibilityLabel={`Colour ${c}`}
              accessibilityState={{ selected: colour === c }}
              hitSlop={7}
              style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: c, borderWidth: colour === c ? 3 : 0, borderColor: C.chalk }}
            />
          ))}
        </Row>
      </Section>

      <Button label="Save build" onPress={save} busy={saving} />
      <InlineError message={confirmDelete ? null : error} />
      {existing ? (
        confirmDelete ? (
          <ConfirmBox
            message={`Delete ${existing.make} ${existing.model} from your garage? This can't be undone.`}
            verb="Delete"
            error={error}
            onConfirm={() => {
              setError(null);
              store.deleteBuild(existing.id).then(() => router.dismissAll()).catch((e) => setError(e instanceof Error ? e.message : 'Could not delete the build.'));
            }}
            onCancel={() => setConfirmDelete(false)}
          />
        ) : (
          <Button label="Delete build" kind="danger" onPress={() => setConfirmDelete(true)} />
        )
      ) : null}
    </ScrollView>
    </>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (s: string) => void }) {
  return (
    <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
      <Txt v="label">{label}</Txt>
      <TextInput value={value} onChangeText={onChange} keyboardType="number-pad" placeholderTextColor={C.fog} style={ui.input} accessibilityLabel={label} />
    </View>
  );
}
