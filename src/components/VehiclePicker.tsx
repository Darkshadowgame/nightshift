import { useMemo, useState } from 'react';
import { TextInput, View } from 'react-native';
import { allVariants } from '../data/vehicles';
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
import { COLOR, RADII, SPACING } from '../theme';
import { DsText, Icon, INPUT, Press, SearchField } from './ds';
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
}: {
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
  const hits = useMemo(() => searchVariants(list, kind, query, 8), [list, kind, query]);
  const noun = kind === 'car' ? 'car' : 'bike';

  return (
    <View style={{ gap: SPACING.sm }}>
      <SearchField
        value={query}
        onChangeText={setQuery}
        placeholder={kind === 'car' ? 'Search, e.g. Golf R Mk7 or Type R FK8' : 'Search, e.g. R6 2017 or Street Triple'}
        accessibilityLabel={`Search every ${noun}`}
      />
      {query.trim() ? (
        <View style={{ gap: SPACING.xs }}>
          {hits.map((v) => (
            <VariantRow key={v.id} v={v} withName on={v.id === vehicleId} onPress={() => { onPickVariant(v); setQuery(''); }} />
          ))}
          {hits.length === 0 ? <DsText v="secondary">No match. Pick the make below or type your own.</DsText> : null}
        </View>
      ) : null}

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
        <View style={{ gap: SPACING.xs }}>
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

      {variant ? (
        <View style={{ flexDirection: 'row', gap: SPACING.sm, alignItems: 'flex-start' }}>
          <Icon name="success" size={20} colour={COLOR.state.success} />
          <View style={{ flex: 1, gap: SPACING.xxs }}>
            <DsText v="body">
              {variant.make} {modelLabel(variant)} · {variant.engine} · {yearsLabel(variant)}
            </DsText>
            <DsText v="caption">
              Standard figures filled in: {variant.bhp} bhp · {variant.weightKg} kg {kind === 'car' ? 'kerb' : 'wet'}{variant.weightApprox ? ' (approx. from dry)' : ''}
              {variant.torqueLbFt ? ` · ${variant.torqueLbFt} lb-ft` : ''}.
              {editableBelow ? ' Change anything below if yours differs.' : ' Add your mods in the Garage later.'}
            </DsText>
          </View>
        </View>
      ) : null}

      <SuggestMissing
        screen="vehicle-picker"
        label={`Suggest a missing ${noun}`}
        placeholder={kind === 'car' ? 'e.g. Vauxhall Astra VXR Arctic Edition' : 'e.g. Honda CBR400RR NC29'}
        context={[kind, make, model].filter(Boolean).join(' · ')}
      />
      <DsText v="caption">Standard figures are the manufacturer's UK figures.</DsText>
    </View>
  );
}

function rangeOf(vs: Variant[]): string | undefined {
  if (!vs.length) return undefined;
  const from = Math.min(...vs.map((v) => v.from));
  const to = vs.some((v) => !v.to) ? undefined : Math.max(...vs.map((v) => v.to!));
  return `${vs.length} version${vs.length === 1 ? '' : 's'} · ${yearsLabel({ from, to })}`;
}

function VariantRow({ v, on, withName, onPress }: { v: Variant; on?: boolean; withName?: boolean; onPress: () => void }) {
  const line = variantLine(v);
  return (
    <Press
      onPress={onPress}
      haptic="select"
      role="radio"
      state={{ checked: !!on }}
      label={`${withName ? `${v.make} ${v.model}, ` : ''}${line}`}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.md,
        minHeight: 44,
        borderRadius: RADII.control,
        borderWidth: 1,
        borderColor: on ? COLOR.action.selected : COLOR.surface.borderStrong,
        backgroundColor: on ? COLOR.action.selectedTint : 'transparent',
      }}
    >
      <View style={{ flex: 1 }}>
        {withName ? (
          <DsText v="bodyStrong">
            {v.make} {v.model}
          </DsText>
        ) : null}
        <DsText v={withName ? 'caption' : 'body'}>{line}</DsText>
      </View>
      {on ? <Icon name="check" size={18} colour={COLOR.action.selected} /> : null}
    </Press>
  );
}
