import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { MOD_CATEGORIES, MOD_GROUPS, type ModGroup } from '../data/catalog';
import { newId } from '../lib/store';
import {
  addTypicalParts,
  hasQuickMod,
  isStageMod,
  quickModsFor,
  stageEstimate,
  stageIncludes,
  stageLabel,
  suggestedGain,
  toggleQuickMod,
  TUNE_STAGES,
  typicalParts,
  withStage,
  type StageEngine,
} from '../lib/tune';
import type { Mod, ModCategory, TuneStage, VehicleKind } from '../lib/types';
import type { Aspiration } from '../lib/vehicles';
import { C, F } from '../theme';
import { SuggestMissing } from './SuggestMissing';
import { Button, Card, Chip, Row, Txt, s as ui } from './ui';

const mid = () => newId('m');

function num(s: string): number | undefined {
  const n = Number(s.replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) && n > 0 ? Math.round(n) : undefined;
}

const ASP_CHOICES: { key: Aspiration; label: string }[] = [
  { key: 't', label: 'Turbo petrol' },
  { key: 'd', label: 'Diesel' },
  { key: 'n', label: 'Non-turbo' },
  { key: 's', label: 'Supercharged' },
];

/**
 * Tune stage, quick-pick mod chips grouped by category, the list of mods with
 * editable gains, and free-typed mods. Everything goes through `onChange`.
 */
export function ModPicker({
  kind,
  engine,
  aspKnown,
  onAsp,
  stage,
  mods,
  onChange,
  swapped,
}: {
  kind: VehicleKind;
  /** The engine being tuned (the donor's after a swap). Null until stock bhp is known. */
  engine: StageEngine | null;
  /** False for a free-typed car: ask what kind of engine it is. */
  aspKnown: boolean;
  onAsp: (a: Aspiration) => void;
  stage: TuneStage;
  mods: Mod[];
  onChange: (mods: Mod[], stage: TuneStage) => void;
  swapped?: boolean;
}) {
  const [group, setGroup] = useState<ModGroup>('engine');
  const [modName, setModName] = useState('');
  const [modCat, setModCat] = useState<ModCategory>('engine');
  const [modGain, setModGain] = useState('');
  const chips = quickModsFor(kind, engine?.asp);
  const groups = MOD_GROUPS.filter((g) => chips.some((c) => c.group === g.key));
  const shown = chips.filter((c) => c.group === (groups.some((g) => g.key === group) ? group : groups[0]?.key));
  const estimate = engine ? stageEstimate(engine, stage) : null;
  const parts = typicalParts(kind, engine?.asp, stage);
  const missingParts = parts.filter((p) => !hasQuickMod(mods, p));
  const stockBhp = engine?.bhp ?? 0;

  function pickStage(next: TuneStage) {
    const est = engine ? stageEstimate(engine, next) : null;
    onChange(withStage(mods, next, est?.gain, mid), next);
  }

  function addFree() {
    if (!modName.trim()) return;
    onChange([...mods, { id: mid(), category: modCat, name: modName.trim().slice(0, 60), bhpGain: num(modGain) }], stage);
    setModName('');
    setModGain('');
  }

  function setGain(id: string, text: string) {
    onChange(mods.map((m) => (m.id === id ? { ...m, bhpGain: num(text) } : m)), stage);
  }

  function remove(m: Mod) {
    // Taking the stage mod off puts the stage back to stock.
    onChange(mods.filter((x) => x.id !== m.id), isStageMod(m) ? 'stock' : stage);
  }

  return (
    <View style={{ gap: 12 }}>
      <Card accent={C.sodium}>
        <Txt v="h3">Tune stage{swapped ? ' (swapped engine)' : ''}</Txt>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }} accessibilityRole="radiogroup" accessibilityLabel="Tune stage">
          {TUNE_STAGES.map((st) => (
            <Pressable
              key={st}
              onPress={() => pickStage(st)}
              accessibilityRole="radio"
              accessibilityState={{ checked: st === stage }}
              style={({ pressed }) => [
                { paddingVertical: 8, paddingHorizontal: 11, borderRadius: 4, borderWidth: 1, borderColor: st === stage ? C.sodium : C.kerbHi, backgroundColor: st === stage ? C.sodium : 'transparent' },
                pressed && { opacity: 0.75 },
              ]}
            >
              <Text style={{ fontFamily: F.labelBold, fontSize: 14, letterSpacing: 1, textTransform: 'uppercase', color: st === stage ? C.ink : C.chalk }}>{stageLabel(st)}</Text>
            </Pressable>
          ))}
        </View>
        {kind === 'car' && !aspKnown ? (
          <View style={{ gap: 4 }}>
            <Txt v="label" style={{ fontSize: 11 }}>Engine type (for the estimate)</Txt>
            <Row gap={6}>
              {ASP_CHOICES.map((a) => (
                <Chip key={a.key} label={a.label} on={engine?.asp === a.key} onPress={() => onAsp(a.key)} colour={C.neon} />
              ))}
            </Row>
          </View>
        ) : null}
        <Txt v="muted">{stageIncludes(kind, engine?.asp, stage)}</Txt>
        {estimate ? (
          <Txt accessibilityLiveRegion="polite">
            Typically {stockBhp} → <Text style={{ color: C.sodium, fontFamily: F.bodyBold }}>{estimate.bhp} bhp</Text> (+{estimate.gain}).{' '}
            <Text style={{ color: C.fog, fontSize: 13 }}>
              {estimate.source === 'tuner' ? 'From UK tuner figures for this engine.' : 'A cautious typical figure for this kind of engine.'} Edit the gain below if yours differs.
            </Text>
          </Txt>
        ) : stage !== 'stock' && stage !== 'custom' ? (
          <Txt v="muted">Add the standard bhp to see a typical figure.</Txt>
        ) : stage === 'custom' ? (
          <Txt v="muted">Type your gain on the “Custom tune” line below.</Txt>
        ) : null}
        {missingParts.length ? (
          <Button label={`Add typical parts (${missingParts.length})`} kind="ghost" onPress={() => onChange(addTypicalParts(mods, parts, mid), stage)} accessibilityHint={missingParts.map((p) => p.name).join(', ')} />
        ) : null}
      </Card>

      <View style={{ gap: 8 }}>
        <Txt v="label">Quick add</Txt>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
          {groups.map((g) => {
            const n = chips.filter((c) => c.group === g.key && hasQuickMod(mods, c)).length;
            return <Chip key={g.key} label={n ? `${g.label} · ${n}` : g.label} on={g.key === (shown[0]?.group ?? group)} onPress={() => setGroup(g.key)} colour={C.neon} />;
          })}
        </ScrollView>
        <Row gap={6}>
          {shown.map((c) => (
            <Chip
              key={c.key}
              label={hasQuickMod(mods, c) ? `✓ ${c.name}` : c.name}
              on={hasQuickMod(mods, c)}
              onPress={() => onChange(toggleQuickMod(mods, c, suggestedGain(c, stockBhp, stage), mid), stage)}
            />
          ))}
        </Row>
        <Txt v="muted" style={{ fontSize: 12 }}>
          Tap to add, tap again to remove.{stage !== 'stock' ? ' With a tune stage set, power parts start at +0 because the stage figure covers them.' : ''}
        </Txt>
      </View>

      {mods.length ? (
        <Card>
          {mods.map((m) => (
            <Row key={m.id} style={{ flexWrap: 'nowrap' }} gap={8}>
              <Txt style={{ flex: 1 }} numberOfLines={2}>{m.name}</Txt>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                <Txt v="mono">+</Txt>
                <TextInput
                  value={m.bhpGain ? String(m.bhpGain) : ''}
                  onChangeText={(t) => setGain(m.id, t)}
                  placeholder="0"
                  placeholderTextColor={C.fog}
                  keyboardType="number-pad"
                  style={[ui.input, { width: 64, paddingVertical: 6, paddingHorizontal: 8, fontSize: 15, textAlign: 'right' }]}
                  accessibilityLabel={`bhp gain for ${m.name}`}
                />
                <Txt v="mono">bhp</Txt>
              </View>
              <Pressable onPress={() => remove(m)} hitSlop={10} accessibilityRole="button" accessibilityLabel={`Remove ${m.name}`}>
                <Txt v="label" style={{ color: C.alert }}>✕</Txt>
              </Pressable>
            </Row>
          ))}
        </Card>
      ) : null}

      <Card>
        <Txt v="label">Something else</Txt>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
          {MOD_CATEGORIES.map((c) => (
            <Chip key={c.key} label={c.short} on={modCat === c.key} onPress={() => setModCat(c.key)} colour={C.neon} />
          ))}
        </ScrollView>
        <TextInput value={modName} onChangeText={setModName} placeholder="e.g. Wagner intercooler" placeholderTextColor={C.fog} style={ui.input} onSubmitEditing={addFree} maxLength={60} accessibilityLabel="Mod name" />
        <Row style={{ flexWrap: 'nowrap' }}>
          <TextInput value={modGain} onChangeText={setModGain} placeholder="bhp gain (optional)" keyboardType="number-pad" placeholderTextColor={C.fog} style={[ui.input, { flex: 1 }]} accessibilityLabel="bhp gain" />
          <Button label="Add mod" kind="ghost" onPress={addFree} />
        </Row>
      </Card>
      <SuggestMissing screen="mod-picker" label="Suggest a missing mod" placeholder="e.g. Wastegate actuator" context={`${kind} · ${group}`} />
    </View>
  );
}
