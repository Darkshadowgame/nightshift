import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { allVariants } from '../data/vehicles';
import { classOf } from '../lib/classes';
import { plural } from '../lib/format';
import { carShape } from '../lib/buildShape';
import { photoSource } from '../lib/photoSource';
import { buildPicture } from '../lib/similarPhoto';
import { useStore } from '../lib/store';
import type { VehicleKind } from '../lib/types';
import {
  canonicalMake,
  familyFor,
  findVariant,
  groupByModel,
  makesFor,
  modelLabel,
  modelsFor,
  searchVariants,
  variantLine,
  variantsFor,
  yearsLabel,
  type Variant,
} from '../lib/vehicles';
import { COLOR, SPACING } from '../theme';
import { Button, DsText, Icon, ListRow, PhotoCard, SearchField } from './ds';
import { FadeUp } from './motion';
import { PhotoCredit } from './PhotoCredit';
import { SuggestMissing } from './SuggestMissing';

/** Where the picker is: the one search, or the "Enter it yourself" list flow (make, model, version). */
type Stage = 'search' | 'make' | 'model' | 'version';

/**
 * Pick a car or bike (Redesign 2, 4.4; Review 13, K2): one search with results, never a dropdown.
 * Type a make or model, tap yours; its stock specs go to `onPickVariant`.
 *
 * "Can't find it? Enter it yourself" turns the same place into a list flow, one search at a time:
 * Make (pick from the list, or use what you typed) → Model → Generation and engine (when we know
 * it) → done. Anything not listed still works as typed. Onboarding and the Garage's "+" are the
 * same picker.
 */
export function VehiclePicker({
  kind,
  make,
  model,
  vehicleId,
  onMakeModel,
  onPickVariant,
  editableBelow = false,
}: {
  /** The figures can be changed in fields below the picker (the build form); not in onboarding. */
  editableBelow?: boolean;
  /** @deprecated Always search-first now (Review 13); kept so old callers still compile. */
  searchFirst?: boolean;
  kind: VehicleKind;
  make: string;
  model: string;
  vehicleId?: string;
  /** Free-typed or family-level change. Clears the variant. */
  onMakeModel: (make: string, model: string) => void;
  onPickVariant: (v: Variant) => void;
}) {
  const list = allVariants();
  const variant = findVariant(list, vehicleId);
  const family = familyFor(list, kind, make, model, variant);
  const variants = useMemo(() => (family ? variantsFor(list, kind, make, family) : []), [list, kind, make, family]);
  const [stage, setStageRaw] = useState<Stage>('search');
  const [query, setQuery] = useState('');
  const setStage = (s: Stage) => {
    setQuery('');
    setStageRaw(s);
  };
  // Car or bike changed: start again at the search.
  const [lastKind, setLastKind] = useState(kind);
  if (lastKind !== kind) {
    setLastKind(kind);
    setStageRaw('search');
    setQuery('');
  }
  const noun = kind === 'car' ? 'car' : 'bike';
  const typed = query.trim();

  const hits = useMemo(() => (stage === 'search' ? searchVariants(list, kind, query, 8) : []), [stage, list, kind, query]);
  const makes = useMemo(() => (stage === 'make' ? makesFor(list, kind, query).slice(0, 8) : []), [stage, list, kind, query]);
  const models = useMemo(() => (stage === 'model' ? modelsFor(list, kind, make, query).slice(0, 8) : []), [stage, list, kind, make, query]);

  function pickMake(m: string) {
    onMakeModel(m, m === make ? model : '');
    setStage('model');
  }
  function pickModel(m: string) {
    const mk = canonicalMake(list, kind, make);
    onMakeModel(mk, m);
    setStage(variantsFor(list, kind, mk, m).length ? 'version' : 'search');
  }
  /** "Use “Escort Cosworth”": a row that takes what you typed when it isn't listed. */
  const useTyped = (options: string[], onUse: (t: string) => void) =>
    typed && !options.some((o) => o.toLowerCase() === typed.toLowerCase()) ? (
      <ListRow leading={{ icon: 'plus' }} title={`Use “${typed}”`} chevron={false} onPress={() => onUse(typed)} />
    ) : null;

  if (stage === 'search') {
    const groups = groupByModel(hits, typed);
    // A heading per model only when it helps: several models, or several versions of one.
    const headed = groups.length > 1 || (groups[0]?.variants.length ?? 0) >= 3;
    const freeTyped = !variant && make.trim() && model.trim();
    return (
      <View style={{ gap: SPACING.sm }}>
        <SearchField
          value={query}
          onChangeText={setQuery}
          // Short enough to show whole at 1.3x text in a 375 pt field (Review 15: it was cut to "e.g. Fies").
          placeholder={kind === 'car' ? 'Make or model, e.g. Fiesta ST' : 'Make or model, e.g. R1'}
          accessibilityLabel={`Search every ${noun}`}
        />
        {typed && headed ? <DsText v="caption">Pick yours by its years and power.</DsText> : null}
        {typed ? (
          <View style={{ gap: SPACING.sm }}>
            {groups.map((g) => (
              <View key={`${g.make}|${g.model}`}>
                {/* Grouped by exact model name (Review 14): the count is the rows under it, and an ST-Line is never counted as an ST. */}
                {headed ? (
                  <DsText v="bodyStrong" style={{ paddingVertical: SPACING.xs }}>
                    {`${g.make} ${g.model} · ${plural(g.variants.length, 'version')}`}
                  </DsText>
                ) : null}
                {g.variants.map((v) => (
                  <VariantRow key={v.id} v={v} withName on={v.id === vehicleId} onPress={() => { onPickVariant(v); setQuery(''); }} />
                ))}
              </View>
            ))}
            {hits.length === 0 ? <DsText v="secondary">No match. Try fewer words, or enter it yourself.</DsText> : null}
          </View>
        ) : null}
        {variant && !typed ? (editableBelow ? <Picked variant={variant} kind={kind} editableBelow /> : <PickedCard variant={variant} />) : null}
        {freeTyped && !typed ? (
          <View accessibilityLiveRegion="polite" style={{ flexDirection: 'row', gap: SPACING.sm, alignItems: 'flex-start' }}>
            <Icon name="success" size={20} colour={COLOR.state.success} />
            <View style={{ flex: 1, gap: SPACING.xxs }}>
              <DsText v="body">{`${make.trim()} ${model.trim()}`}</DsText>
              <DsText v="caption">{editableBelow ? 'Entered yourself, so add the power and weight below.' : 'Entered yourself. Add the power and weight in the Garage.'}</DsText>
            </View>
          </View>
        ) : null}
        <Button
          tier="tertiary"
          size="sm"
          label={variant || freeTyped ? 'Not quite right? Enter it yourself' : "Can't find it? Enter it yourself"}
          style={{ alignSelf: 'flex-start' }}
          onPress={() => setStage('make')}
        />
      </View>
    );
  }

  // "Enter it yourself": one step at a time, each a search with a list under it.
  const back = <Button tier="tertiary" size="sm" label="Back to search" style={{ alignSelf: 'flex-start' }} onPress={() => setStage('search')} />;
  const suggest = (
    <SuggestMissing
      screen="vehicle-picker"
      label={`Suggest a missing ${noun}`}
      placeholder={kind === 'car' ? 'e.g. Astra VXR Arctic' : 'e.g. Honda CBR400RR'}
      context={[kind, make, model].filter(Boolean).join(' · ')}
    />
  );
  const chosenMake = make.trim() ? (
    <ListRow title={canonicalMake(list, kind, make)} subtitle="Make" trailing={<DsText v="buttonSm" tone="action">Change</DsText>} chevron={false} onPress={() => setStage('make')} accessibilityLabel={`Make: ${make}. Change it`} />
  ) : null;

  return (
    <View style={{ gap: SPACING.sm }}>
      <StepLabel stage={stage} />
      {stage === 'make' ? (
        <>
          <SearchField value={query} onChangeText={setQuery} autoFocus placeholder={`Type the ${noun}'s make`} accessibilityLabel={`Make of your ${noun}`} />
          <View>
            {makes.map((m) => (
              <ListRow key={m} title={m} chevron onPress={() => pickMake(m)} trailing={m === make ? <Icon name="check" size={18} colour={COLOR.text.primary} /> : undefined} />
            ))}
            {useTyped(makes, pickMake)}
          </View>
        </>
      ) : null}
      {stage === 'model' ? (
        <>
          {chosenMake}
          <SearchField value={query} onChangeText={setQuery} autoFocus placeholder="Type the model" accessibilityLabel={`Model of your ${noun}`} />
          <View>
            {models.map((m) => (
              <ListRow key={m} title={m} subtitle={rangeOf(variantsFor(list, kind, make, m))} chevron onPress={() => pickModel(m)} />
            ))}
            {useTyped(models, (t) => {
              onMakeModel(make, t);
              setStage('search');
            })}
          </View>
        </>
      ) : null}
      {stage === 'version' ? (
        <>
          {chosenMake}
          <View>
            {variants.map((v) => (
              <VariantRow key={v.id} v={v} on={v.id === vehicleId} onPress={() => { onPickVariant(v); setStage('search'); }} />
            ))}
            <ListRow title={`None of these: just “${family ?? model}”`} subtitle={editableBelow ? 'Add the power and weight below yourself.' : undefined} chevron={false} onPress={() => setStage('search')} />
          </View>
        </>
      ) : null}
      {back}
      {suggest}
    </View>
  );
}

/** The step of "Enter it yourself" as a label: MAKE, MODEL, GENERATION AND ENGINE. */
function StepLabel({ stage }: { stage: Stage }) {
  const words = stage === 'make' ? 'Enter it yourself: make' : stage === 'model' ? 'Enter it yourself: model' : 'Generation and engine';
  return (
    <DsText v="label" accessibilityRole="header">
      {words}
    </DsText>
  );
}

/** What you picked, with its standard figures (the manufacturer's UK figures), said once. */
function Picked({ variant, kind, editableBelow }: { variant: Variant; kind: VehicleKind; editableBelow: boolean }) {
  return (
    <View accessibilityLiveRegion="polite" style={{ flexDirection: 'row', gap: SPACING.sm, alignItems: 'flex-start' }}>
      <Icon name="success" size={20} colour={COLOR.state.success} />
      <View style={{ flex: 1, gap: SPACING.xxs }}>
        <DsText v="body">{`${variant.make} ${modelLabel(variant)} · ${variant.engine} · ${yearsLabel(variant)}`}</DsText>
        <DsText v="caption">
          {`Manufacturer's UK figures filled in: ${variant.bhp} bhp · ${variant.weightKg} kg ${kind === 'car' ? 'kerb' : 'wet'}${variant.weightApprox ? ' (approx. from dry)' : ''}${variant.torqueLbFt ? ` · ${variant.torqueLbFt} lb-ft` : ''}.${editableBelow ? ' Change anything below if yours differs.' : ' Add your mods in the Garage later.'}`}
        </DsText>
      </View>
    </View>
  );
}

function rangeOf(vs: Variant[]): string | undefined {
  if (!vs.length) return undefined;
  const from = Math.min(...vs.map((v) => v.from));
  const to = vs.some((v) => !v.to) ? undefined : Math.max(...vs.map((v) => v.to!));
  return `${vs.length} version${vs.length === 1 ? '' : 's'} · ${yearsLabel({ from, to })}`;
}

/** A variant's class, from its stock figures. */
function variantClass(v: Variant) {
  return classOf({ kind: v.kind, stockBhp: v.bhp, weightKg: v.weightKg, mods: [] });
}

/**
 * Onboarding's picked card (Redesign 2, 3.2): the build as it will look, its class badge animating in.
 * The same picture the Garage will show (Review 17): in the demo a stand-in photo of a similar car,
 * else the drawing in its paint until you add your own photo.
 */
function PickedCard({ variant }: { variant: Variant }) {
  const { backend } = useStore();
  const pic = buildPicture({ photos: [], make: variant.make, model: variant.model, kind: variant.kind, year: variant.from }, backend === 'local');
  return (
    <FadeUp key={variant.id}>
      <View accessibilityLiveRegion="polite">
        <PhotoCard
          kind="build"
          size="sm"
          photo={pic ? photoSource(pic.ref) : null}
          overlay={pic ? <PhotoCredit photoRef={pic.ref} kind={variant.kind} standIn={pic.standIn} overlay /> : undefined}
          vehicle={variant.kind}
          shape={carShape(variant)}
          paint={COLOR.paint[3]}
          title={`${variant.make} ${modelLabel(variant)}`}
          meta={`${variant.bhp} bhp · ${yearsLabel(variant)}`}
          classLetter={variantClass(variant)}
        />
      </View>
    </FadeUp>
  );
}

/** One result: the class badge, the name and the engine line, a tick when it's the one picked. */
function VariantRow({ v, on, withName, onPress }: { v: Variant; on?: boolean; withName?: boolean; onPress: () => void }) {
  const line = variantLine(v);
  // In search results the generation goes in the name ("Ford Fiesta ST Mk8 facelift"), so five
  // Fiesta STs don't read as five identical rows (REVIEW-11 task 1); the line under it is the rest.
  const rest = [v.engine, yearsLabel(v), `${v.bhp} bhp`].filter(Boolean).join(' · ');
  const name = `${v.make} ${modelLabel(v)}`;
  return (
    <ListRow
      leading={{ classBadge: variantClass(v) }}
      title={withName ? name : line}
      subtitle={withName ? rest : undefined}
      trailing={on ? <Icon name="check" size={18} colour={COLOR.text.primary} /> : undefined}
      chevron={false}
      onPress={onPress}
      accessibilityLabel={`${withName ? `${name}, ${rest}` : line}${on ? ', picked' : ''}`}
    />
  );
}
