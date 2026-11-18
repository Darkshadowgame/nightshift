import { useState } from 'react';
import { TextInput, View } from 'react-native';
import { newId } from '../lib/store';
import {
  addTypicalParts,
  hasQuickMod,
  isStageMod,
  offRoadParts,
  quickModsFor,
  stageEstimate,
  stageHint,
  stageIncludes,
  stageLabel,
  suggestedGain,
  toggleQuickMod,
  TUNE_STAGES,
  typicalParts,
  withStage,
  type StageEngine,
} from '../lib/tune';
import type { Build, Mod, TuneStage, VehicleKind } from '../lib/types';
import { isRoadIllegal, OFF_ROAD_TAG } from '../lib/legality';
import type { Aspiration } from '../lib/vehicles';
import { COLOR, RADII, SPACING } from '../theme';
import { AddModSheet } from './AddModSheet';
import { ChoiceRow } from './ChoiceRow';
import { Button, Chip, DsText, IconButton, INPUT, RowDivider, Tag } from './ds';
import { SuggestMissing } from './SuggestMissing';

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
 * The build form's engine and mods (Review 14, 4.4 and K2): the tune stage and, for a typed car,
 * the kind of engine are rows that open a list (more than five options), parts are added with the
 * same Add a mod sheet as the build page, then the list of mods with editable gains. Everything
 * goes through `onChange`.
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
  const [adding, setAdding] = useState(false);
  const estimate = engine ? stageEstimate(engine, stage) : null;
  const parts = typicalParts(kind, engine?.asp, stage);
  const missingParts = parts.filter((p) => !hasQuickMod(mods, p));
  const optionalOffRoad = offRoadParts(kind, engine?.asp, stage);
  const stockBhp = engine?.bhp ?? 0;

  function pickStage(next: TuneStage) {
    const est = engine ? stageEstimate(engine, next) : null;
    onChange(withStage(mods, next, est?.gain, mid), next);
  }

  function setGain(id: string, text: string) {
    onChange(mods.map((m) => (m.id === id ? { ...m, bhpGain: num(text) } : m)), stage);
  }

  function remove(m: Mod) {
    // Taking the stage mod off puts the stage back to stock.
    onChange(mods.filter((x) => x.id !== m.id), isStageMod(m) ? 'stock' : stage);
  }

  const hint = stageHint(mods, stage);
  const toggle = (c: ReturnType<typeof quickModsFor>[number]) => onChange(toggleQuickMod(mods, c, suggestedGain(c, stockBhp, stage), mid), stage);

  return (
    <View style={{ gap: SPACING.lg }}>
      <View style={{ gap: SPACING.sm }}>
        <View>
          {kind === 'car' && !aspKnown ? (
            <>
              <ChoiceRow label="Kind of engine" options={ASP_CHOICES} value={engine?.asp ?? null} onChange={onAsp} />
              <RowDivider />
            </>
          ) : null}
          <ChoiceRow<TuneStage> label={`Tune stage${swapped ? ' (swapped engine)' : ''}`} options={TUNE_STAGES.map((st) => ({ key: st, label: stageLabel(st) }))} value={stage} onChange={pickStage} />
        </View>
        <DsText v="secondary">{stageIncludes(kind, engine?.asp, stage)}</DsText>
        {/* A remap, a decat or a bigger turbo with the stage still lower: suggest it (REVIEW-9). */}
        {hint ? (
          <View style={{ gap: SPACING.xs }} accessibilityLiveRegion="polite">
            <DsText v="secondary" tone="primary">{`Your mods usually mean ${stageLabel(hint)}. Update the tune stage?`}</DsText>
            <Button label={`Set ${stageLabel(hint)}`} tier="secondary" size="sm" onPress={() => pickStage(hint)} style={{ alignSelf: 'flex-start' }} />
          </View>
        ) : null}
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
              Often fitted at this stage, but not added for you: off-road only.
            </DsText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm }}>
              {optionalOffRoad.map((c) => (
                <Chip key={c.key} label={c.name} raw on={hasQuickMod(mods, c)} onPress={() => toggle(c)} accessibilityLabel={`${c.name}, ${OFF_ROAD_TAG}`} />
              ))}
            </View>
          </View>
        ) : null}
      </View>

      <Button label="Add a mod" icon="plus" tier="secondary" block onPress={() => setAdding(true)} />

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
                    style={[INPUT, { width: 64, paddingVertical: SPACING.xs, paddingHorizontal: SPACING.sm, textAlign: 'right' }]}
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

      {mods.length ? (
        <DsText v="caption">
          {stage !== 'stock' ? 'With a tune stage set, power parts start at +0 because the stage figure covers them. ' : ''}Parts that do the same job count once (a Stage 1 tune and an ECU remap are one mod).
        </DsText>
      ) : null}

      <SuggestMissing screen="mod-picker" label="Suggest a missing mod" placeholder="e.g. Wastegate actuator" context={kind} />
      <AddModSheet
        visible={adding}
        build={{ id: 'draft', ownerId: '', kind, make: '', model: '', stockBhp, weightKg: 0, mods, photos: [], colour: '', tuneStage: stage === 'stock' ? undefined : stage } as Build}
        asp={engine?.asp}
        onAdd={(m) => onChange([...mods, m], stage)}
        onClose={() => setAdding(false)}
      />
    </View>
  );
}
