import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, ScrollView, TextInput, View } from 'react-native';
import { Button, Card, Chip, ClassBadge, Row, Section, Txt, s as ui } from '../../components/ui';
import { BIKE_MAKES, CAR_MAKES, MOD_CATEGORIES } from '../../data/catalog';
import { classOf, effectivePower } from '../../lib/classes';
import { cleanPhoto } from '../../lib/photos';
import { newId, useStore } from '../../lib/store';
import type { Build, Mod, ModCategory, VehicleKind } from '../../lib/types';
import { C } from '../../theme';

const COLOURS = [C.sodium, C.neon, C.magenta, C.lime, '#ff4d4d', '#3f6fff', '#9b5de5', '#e9edf4', '#7a7f8c'];

function num(s: string): number | undefined {
  const n = Number(s.replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

export default function EditBuild() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const store = useStore();
  const existing = id ? store.builds.find((b) => b.id === id) : undefined;

  const [kind, setKind] = useState<VehicleKind>(existing?.kind ?? 'car');
  const [make, setMake] = useState(existing?.make ?? '');
  const [model, setModel] = useState(existing?.model ?? '');
  const [year, setYear] = useState(existing?.year ? String(existing.year) : '');
  const [nickname, setNickname] = useState(existing?.nickname ?? '');
  const [stockBhp, setStockBhp] = useState(existing ? String(existing.stockBhp) : '');
  const [weight, setWeight] = useState(existing ? String(existing.weightKg) : '');
  const [torque, setTorque] = useState(existing?.torqueLbFt ? String(existing.torqueLbFt) : '');
  const [dyno, setDyno] = useState(existing?.dynoBhp ? String(existing.dynoBhp) : '');
  const [colour, setColour] = useState(existing?.colour ?? C.sodium);
  const [mods, setMods] = useState<Mod[]>(existing?.mods ?? []);
  const [photos, setPhotos] = useState<string[]>(existing?.photos ?? []);
  const [modName, setModName] = useState('');
  const [modCat, setModCat] = useState<ModCategory>('engine');
  const [modGain, setModGain] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const makes = kind === 'car' ? CAR_MAKES : BIKE_MAKES;
  const draft: Build = {
    id: existing?.id ?? newId('b'),
    ownerId: store.me,
    kind,
    make: make.trim(),
    model: model.trim(),
    year: num(year),
    nickname: nickname.trim() || undefined,
    stockBhp: num(stockBhp) ?? 0,
    weightKg: num(weight) ?? (kind === 'car' ? 1400 : 190),
    torqueLbFt: num(torque),
    dynoBhp: num(dyno),
    mods,
    photos,
    colour,
  };
  const ready = draft.make && draft.model && draft.stockBhp > 0;

  async function addPhoto() {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8, allowsMultipleSelection: true, exif: false });
    if (res.canceled) return;
    try {
      const cleaned = await Promise.all(res.assets.map((a) => cleanPhoto(a.uri, a.width, a.height)));
      setPhotos((p) => [...p, ...cleaned]);
    } catch {
      setError("Couldn't prepare that photo. Try another one.");
    }
  }

  function addMod() {
    if (!modName.trim()) return;
    setMods((m) => [...m, { id: newId('m'), category: modCat, name: modName.trim(), bhpGain: num(modGain) }]);
    setModName('');
    setModGain('');
  }

  function save() {
    if (!draft.make || !draft.model) return setError('Add the make and model.');
    if (!draft.stockBhp) return setError('Add the standard power (bhp) so the app can work out the class.');
    store.saveBuild(draft);
    router.back();
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 20, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
      <Section title="Car or bike">
        <Row gap={6}>
          <Chip label="Car" on={kind === 'car'} onPress={() => setKind('car')} />
          <Chip label="Bike" on={kind === 'bike'} onPress={() => setKind('bike')} />
        </Row>
      </Section>

      <Section title="Make and model">
        <TextInput value={make} onChangeText={setMake} placeholder="Make" placeholderTextColor={C.fog} style={ui.input} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
          {makes.map((m) => (
            <Chip key={m} label={m} on={make === m} onPress={() => setMake(m)} colour={C.neon} />
          ))}
        </ScrollView>
        <TextInput value={model} onChangeText={setModel} placeholder={kind === 'car' ? 'Model, e.g. Golf R Mk7.5' : 'Model, e.g. YZF-R1'} placeholderTextColor={C.fog} style={ui.input} />
        <Row style={{ flexWrap: 'nowrap' }}>
          <TextInput value={year} onChangeText={setYear} placeholder="Year" keyboardType="number-pad" placeholderTextColor={C.fog} style={[ui.input, { flex: 1 }]} />
          <TextInput value={nickname} onChangeText={setNickname} placeholder="Nickname (optional)" placeholderTextColor={C.fog} style={[ui.input, { flex: 2 }]} />
        </Row>
      </Section>

      <Section title="Specs">
        <Row style={{ flexWrap: 'nowrap' }}>
          <Field label="Standard bhp" value={stockBhp} onChange={setStockBhp} />
          <Field label={kind === 'car' ? 'Kerb weight kg' : 'Wet weight kg'} value={weight} onChange={setWeight} />
        </Row>
        <Row style={{ flexWrap: 'nowrap' }}>
          <Field label="Torque lb-ft" value={torque} onChange={setTorque} />
          <Field label="Dyno bhp (if you have a sheet)" value={dyno} onChange={setDyno} />
        </Row>
        {ready ? (
          <Card accent={C.sodium}>
            <Row style={{ flexWrap: 'nowrap' }} gap={12}>
              <ClassBadge letter={classOf(draft)} size="md" />
              <Txt v="muted" style={{ flex: 1 }}>
                Class {classOf(draft)} at {Math.round(effectivePower(draft))} bhp{draft.dynoBhp ? ' (dyno)' : ' (standard plus mod gains)'}.
              </Txt>
            </Row>
          </Card>
        ) : null}
      </Section>

      <Section title={`Mods (${mods.length})`}>
        {mods.map((m) => (
          <Row key={m.id} style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}>
            <Txt style={{ flex: 1 }}>{m.name}{m.bhpGain ? ` (+${m.bhpGain} bhp)` : ''}</Txt>
            <Pressable onPress={() => setMods((xs) => xs.filter((x) => x.id !== m.id))} hitSlop={10} accessibilityLabel={`Remove ${m.name}`}>
              <Txt v="label" style={{ color: C.alert }}>Remove</Txt>
            </Pressable>
          </Row>
        ))}
        <Card>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
            {MOD_CATEGORIES.map((c) => (
              <Chip key={c.key} label={c.short} on={modCat === c.key} onPress={() => setModCat(c.key)} colour={C.neon} />
            ))}
          </ScrollView>
          <TextInput value={modName} onChangeText={setModName} placeholder="e.g. Stage 2 remap" placeholderTextColor={C.fog} style={ui.input} onSubmitEditing={addMod} />
          <Row style={{ flexWrap: 'nowrap' }}>
            <TextInput value={modGain} onChangeText={setModGain} placeholder="bhp gain (optional)" keyboardType="number-pad" placeholderTextColor={C.fog} style={[ui.input, { flex: 1 }]} />
            <Button label="Add mod" kind="ghost" onPress={addMod} />
          </Row>
        </Card>
      </Section>

      <Section title="Photos">
        <ScrollView horizontal contentContainerStyle={{ gap: 8 }}>
          {photos.map((p) => (
            <Pressable key={p} onLongPress={() => setPhotos((xs) => xs.filter((x) => x !== p))} accessibilityHint="Long-press to remove">
              <Image source={{ uri: p }} style={{ width: 110, height: 80, borderRadius: 6 }} />
            </Pressable>
          ))}
        </ScrollView>
        <Button label="+ Add photos" kind="ghost" onPress={addPhoto} />
        <Txt v="muted" style={{ fontSize: 12 }}>Hide your number plate before uploading. Automatic blurring comes in Phase 2.</Txt>
      </Section>

      <Section title="Card colour">
        <Row gap={10}>
          {COLOURS.map((c) => (
            <Pressable
              key={c}
              onPress={() => setColour(c)}
              accessibilityLabel={`Colour ${c}`}
              style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: c, borderWidth: colour === c ? 3 : 0, borderColor: C.chalk }}
            />
          ))}
        </Row>
      </Section>

      {error ? (
        <Card accent={C.alert}>
          <Txt>{error}</Txt>
        </Card>
      ) : null}
      <Button label="Save build" onPress={save} />
      {existing ? (
        confirmDelete ? (
          <Row style={{ flexWrap: 'nowrap' }}>
            <Button label="Yes, delete it" kind="danger" style={{ flex: 1 }} onPress={() => { store.deleteBuild(existing.id); router.dismissAll(); }} />
            <Button label="Keep" kind="ghost" onPress={() => setConfirmDelete(false)} />
          </Row>
        ) : (
          <Button label="Delete build" kind="danger" onPress={() => setConfirmDelete(true)} />
        )
      ) : null}
    </ScrollView>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (s: string) => void }) {
  return (
    <View style={{ flex: 1, gap: 4 }}>
      <Txt v="label" style={{ fontSize: 11 }}>{label}</Txt>
      <TextInput value={value} onChangeText={onChange} keyboardType="number-pad" placeholderTextColor={C.fog} style={ui.input} />
    </View>
  );
}
