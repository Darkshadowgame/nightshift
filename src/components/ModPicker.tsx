import { useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import { MOD_GROUPS, type ModGroup } from '../data/catalog';
import { newId } from '../lib/store';
import {
  addTypicalParts,
  hasQuickMod,
  isStageMod,
  offRoadParts,
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
import type { Mod, TuneStage, VehicleKind } from '../lib/types';
import { isRoadIllegal, MAX_REWARDED_MODS, OFF_ROAD_TAG } from '../lib/legality';
import type { Aspiration } from '../lib/vehicles';
import { COLOR, RADII, SPACING } from '../theme';
import { Button, Chip, ChoiceGroup, DsText, IconButton, Press, RowDivider, Tag } from './ds';
import { SuggestMissing } from './SuggestMissing';
import { s as ui } from './ui';

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
  { key: 'h', label: 'Hybrid' },
  { key: 'e', label: 'Electric' },
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
  const [modGain, setModGain] = useState('');
  const chips = quickModsFor(kind, engine?.asp);
  const groups = MOD_GROUPS.filter((g) => chips.some((c) => c.group === g.key));
  const activeGroup = groups.some((g) => g.key === group) ? group : groups[0]?.key ?? 'engine';
  const shown = chips.filter((c) => c.group === activeGroup);
  const estimate = engine ? stageEstimate(engine, stage) : null;
  const parts = typicalParts(kind, engine?.asp, stage);
  const missingParts = parts.filter((p) => !hasQuickMod(mods, p));
  const optionalOffRoad = offRoadParts(kind, engine?.asp, stage);
  const stockBhp = engine?.bhp ?? 0;

  function pickStage(next: TuneStage) {
    const est = engine ? stageEstimate(engine, next) : null;
    onChange(withStage(mods, next, est?.gain, mid), next);
  }

  function addFree() {
    if (!modName.trim()) return;
    const category = MOD_GROUPS.find((g) => g.key === activeGroup)?.category ?? 'other';
    onChange([...mods, { id: mid(), category, name: modName.trim().slice(0, 60), bhpGain: num(modGain) }], stage);
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

  const toggle = (c: (typeof chips)[number]) => onChange(toggleQuickMod(mods, c, suggestedGain(c, stockBhp, stage), mid), stage);

  return (
    <View style={{ gap: SPACING.lg }}>
      <View style={{ gap: SPACING.sm }}>
        <ChoiceGroup<TuneStage> label={`Tune stage${swapped ? ' (swapped engine)' : ''}`} options={TUNE_STAGES.map((st) => ({ key: st, label: stageLabel(st) }))} value={stage} onChange={pickStage} />
        {kind === 'car' && !aspKnown ? <ChoiceGroup label="What kind of engine?" options={ASP_CHOICES} value={engine?.asp ?? null} onChange={onAsp} /> : null}
        <DsText v="secondary">{stageIncludes(kind, engine?.asp, stage)}</DsText>
        {estimate ? (
          <View style={{ gap: SPACING.xxs }} accessibilityLiveRegion="polite">
            <DsText v="body">
              Typically {stockBhp} → {estimate.bhp} bhp (+{estimate.gain}).
            </DsText>
            <DsText v="caption">
              {estimate.source === 'tuner' ? 'From UK tuner figures for this engine.' : 'A cautious typical figure for this kind of engine.'} Change the gain below if yours differs.
            </DsText>
          </View>
        ) : stage !== 'stock' && stage !== 'custom' ? (
          <DsText v="secondary">Add the standard bhp to see a typical figure.</DsText>
        ) : stage === 'custom' ? (
          <DsText v="secondary">Type your gain on the “Custom tune” line below.</DsText>
        ) : null}
        {missingParts.length ? (
          <Button label={`Add typical parts (${missingParts.length})`} tier="secondary" size="sm" onPress={() => onChange(addTypicalParts(mods, parts, mid), stage)} accessibilityHint={missingParts.map((p) => p.name).join(', ')} />
        ) : null}
        {optionalOffRoad.length ? (
          <View style={{ gap: SPACING.sm }}>
            <DsText v="caption" tone="warning">
              Often fitted at this stage, but not added for you: off-road only, and no rep.
            </DsText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm }}>
              {optionalOffRoad.map((c) => (
                <Chip key={c.key} label={c.name} raw on={hasQuickMod(mods, c)} onPress={() => toggle(c)} accessibilityLabel={`${c.name}, ${OFF_ROAD_TAG}`} />
              ))}
            </View>
          </View>
        ) : null}
      </View>

      <View style={{ gap: SPACING.sm }}>
        <DsText v="label">Add parts</DsText>
        {/* One of many, scrolled sideways: the same radio pill as ChoiceGroup, in one row. */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: SPACING.sm }} accessibilityRole="radiogroup" accessibilityLabel="Part type">
          {groups.map((g) => {
            const n = chips.filter((c) => c.group === g.key && hasQuickMod(mods, c)).length;
            const on = g.key === activeGroup;
            const label = n ? `${g.label} · ${n}` : g.label;
            return (
              <Press
                key={g.key}
                onPress={() => setGroup(g.key)}
                haptic="select"
                role="radio"
                state={{ checked: on }}
                label={label}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: SPACING.sm,
                  minHeight: 34,
                  paddingHorizontal: SPACING.md,
                  borderRadius: RADII.control,
                  borderWidth: 1,
                  borderColor: on ? COLOR.action.selected : COLOR.surface.borderStrong,
                  backgroundColor: on ? COLOR.action.selectedTint : 'transparent',
                }}
              >
                <DsText v="body">{label}</DsText>
              </Press>
            );
          })}
        </ScrollView>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm }}>
          {shown.map((c) => (
            <Chip key={c.key} label={c.name} raw on={hasQuickMod(mods, c)} onPress={() => toggle(c)} accessibilityLabel={c.roadLegal === false ? `${c.name}, ${OFF_ROAD_TAG}` : c.name} />
          ))}
        </View>
        <DsText v="caption">
          Tap to add, tap again to remove.{stage !== 'stock' ? ' With a tune stage set, power parts start at +0 because the stage figure covers them.' : ''}
          {shown.some((c) => c.roadLegal === false) ? ' Some parts here are off-road only: you can log them, but they earn no rep.' : ''} Rep counts each road-legal mod once, up to {MAX_REWARDED_MODS} per build.
        </DsText>
        <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
          <TextInput value={modName} onChangeText={setModName} placeholder="Something else, e.g. Wagner intercooler" placeholderTextColor={COLOR.text.secondary} style={[ui.input, { flex: 2, minWidth: 0 }]} onSubmitEditing={addFree} maxLength={60} accessibilityLabel={`Mod name, added under ${MOD_GROUPS.find((g) => g.key === activeGroup)?.label ?? 'Other'}`} />
          <TextInput value={modGain} onChangeText={setModGain} placeholder="+bhp" keyboardType="number-pad" placeholderTextColor={COLOR.text.secondary} style={[ui.input, { flex: 1, minWidth: 0 }]} accessibilityLabel="bhp gain (optional)" />
        </View>
        <Button label="Add mod" tier="secondary" size="sm" onPress={addFree} disabled={!modName.trim()} />
      </View>

      {mods.length ? (
        <View style={{ borderWidth: 1, borderColor: COLOR.surface.border, borderRadius: RADII.card, paddingHorizontal: SPACING.md }}>
          {mods.map((m, i) => (
            <View key={m.id}>
              {i ? <RowDivider /> : null}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, minHeight: 56, paddingVertical: SPACING.xs }}>
                <View style={{ flex: 1, gap: SPACING.xs }}>
                  <DsText v="body" numberOfLines={2}>
                    {m.name}
                  </DsText>
                  {isRoadIllegal(m) ? <Tag label="Off-road only" tone="warning" accessibilityLabel={OFF_ROAD_TAG} /> : null}
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xxs }}>
                  <DsText v="meta">+</DsText>
                  <TextInput
                    value={m.bhpGain ? String(m.bhpGain) : ''}
                    onChangeText={(t) => setGain(m.id, t)}
                    placeholder="0"
                    placeholderTextColor={COLOR.text.secondary}
                    keyboardType="number-pad"
                    style={[ui.input, { width: 64, paddingVertical: SPACING.xs, paddingHorizontal: SPACING.sm, textAlign: 'right' }]}
                    accessibilityLabel={`bhp gain for ${m.name}`}
                  />
                  <DsText v="meta">bhp</DsText>
                </View>
                <IconButton icon="close" label={`Remove ${m.name}`} onPress={() => remove(m)} colour={COLOR.state.danger} />
              </View>
            </View>
          ))}
        </View>
      ) : null}

      <SuggestMissing screen="mod-picker" label="Suggest a missing mod" placeholder="e.g. Wastegate actuator" context={`${kind} · ${group}`} />
    </View>
  );
}
