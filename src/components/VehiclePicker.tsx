import { useMemo, useState } from 'react';
import { TextInput, View } from 'react-native';
import { allVariants } from '../data/vehicles';
import { classOf } from '../lib/classes';
import { carShape } from '../lib/buildShape';
import type { VehicleKind } from '../lib/types';
import {
  canonicalMake,
  familyFor,
  findVariant,
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
import { Button, DsText, Icon, INPUT, ListRow, PhotoCard, SearchField } from './ds';
import { FadeUp } from './motion';
import { SearchSelect } from './SearchSelect';
import { SuggestMissing } from './SuggestMissing';

/**
 * Make → model → variant, searchable, for cars and bikes. Picking a variant
 * hands its stock specs to `onPickVariant`; free-typed makes and models still
 * work for anything that isn't listed.
 */
export function VehiclePicker({
  kind,
  make,
  model,
  vehicleId,
  onMakeModel,
  onPickVariant,
  editableBelow = false,
  searchFirst = false,
}: {
  /**
   * Onboarding: one way to pick (search), with Make and Model behind "Can't find it?". Once
   * picked, the confirmation sits right under the search so it's on screen.
   */
  searchFirst?: boolean;
  /** The figures can be changed in fields below the picker (the build form); not in onboarding. */
  editableBelow?: boolean;
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
  const [query, setQuery] = useState('');
  const [browsing, setBrowsing] = useState(false);
  const showSelects = !searchFirst || browsing;
  const hits = useMemo(() => searchVariants(list, kind, query, 8), [list, kind, query]);
  const noun = kind === 'car' ? 'car' : 'bike';

  return (
    <View style={{ gap: SPACING.sm }}>
      <SearchField
        value={query}
        onChangeText={setQuery}
        placeholder={kind === 'car' ? 'Type a make or model, e.g. Fiesta ST' : 'Type a make or model, e.g. Street Triple'}
        accessibilityLabel={`Search every ${noun}`}
      />
      {query.trim() ? (
        <View>
          {hits.map((v) => (
            <VariantRow key={v.id} v={v} withName on={v.id === vehicleId} onPress={() => { onPickVariant(v); setQuery(''); }} />
          ))}
          {hits.length === 0 ? <DsText v="secondary">{searchFirst ? 'No match. Try fewer words, or enter it yourself below.' : 'No match. Pick the make below or type your own.'}</DsText> : null}
        </View>
      ) : null}

      {searchFirst && variant && !browsing && !query.trim() ? <PickedCard variant={variant} /> : null}
      {searchFirst && !browsing ? (
        <Button
          tier="tertiary"
          size="sm"
          label={variant ? 'Not quite right? Enter it yourself' : "Can't find it? Enter it yourself"}
          style={{ alignSelf: 'flex-start' }}
          onPress={() => setBrowsing(true)}
        />
      ) : null}

      {showSelects ? (
      <>
      <SearchSelect
        label="Make"
        value={make}
        placeholder={`Pick or type the ${noun}'s make`}
        search={(q) => makesFor(list, kind, q).map((m) => ({ key: m, title: m }))}
        onPick={(o) => onMakeModel(o.title, o.title === make ? model : '')}
        onFree={(t) => onMakeModel(t, t === make ? model : '')}
      />
      <SearchSelect
        label="Model"
        value={family ?? model}
        placeholder={make ? 'Pick or type the model' : 'Pick the make first'}
        search={(q) => modelsFor(list, kind, make, q).map((m) => ({ key: m, title: m, detail: rangeOf(variantsFor(list, kind, make, m)) }))}
        onPick={(o) => onMakeModel(canonicalMake(list, kind, make), o.title)}
        onFree={(t) => onMakeModel(make, t)}
        disabled={!make.trim()}
      />

      {family && variants.length ? (
        <View>
          <DsText v="label">Generation and engine</DsText>
          {variants.map((v) => (
            <VariantRow key={v.id} v={v} on={v.id === vehicleId} onPress={() => onPickVariant(v)} />
          ))}
        </View>
      ) : null}

      {!family && make.trim() && model.trim() ? (
        <DsText v="caption">Not in our list, so add the power and weight below yourself.</DsText>
      ) : null}
      {family && !variant ? (
        <DsText v="caption">Pick yours above, or name it your own way here:</DsText>
      ) : null}
      {family && !variant ? (
        <TextInput
          value={model}
          onChangeText={(t) => onMakeModel(make, t)}
          placeholder="Model as it shows on your build"
          placeholderTextColor={COLOR.text.secondary}
          style={INPUT}
          accessibilityLabel="Model name shown on your build"
        />
      ) : null}

      {variant ? (searchFirst ? <PickedCard variant={variant} /> : <Picked variant={variant} kind={kind} editableBelow={editableBelow} />) : null}

      <SuggestMissing
        screen="vehicle-picker"
        label={`Suggest a missing ${noun}`}
        placeholder={kind === 'car' ? 'e.g. Vauxhall Astra VXR Arctic Edition' : 'e.g. Honda CBR400RR NC29'}
        context={[kind, make, model].filter(Boolean).join(' · ')}
      />
      </>
      ) : null}
    </View>
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

/** Onboarding's picked card (Redesign 2, 3.2): the build as it will look, its class badge animating in. */
function PickedCard({ variant }: { variant: Variant }) {
  return (
    <FadeUp key={variant.id}>
      <View accessibilityLiveRegion="polite">
        <PhotoCard
          kind="build"
          size="sm"
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
