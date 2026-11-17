import { useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
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
import { C, F, RADIUS, STATE, TYPE } from '../theme';
import { SearchSelect } from './SearchSelect';
import { SuggestMissing } from './SuggestMissing';
import { Card, Txt, s as ui } from './ui';

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
}: {
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
    <View style={{ gap: 8 }}>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder={kind === 'car' ? 'Quick search, e.g. Golf R Mk7 or Type R FK8' : 'Quick search, e.g. R6 2017 or Street Triple'}
        placeholderTextColor={C.fog}
        style={ui.input}
        autoCorrect={false}
        autoCapitalize="none"
        accessibilityLabel={`Search every ${noun}`}
      />
      {query.trim() ? (
        <View style={{ gap: 6 }}>
          {hits.map((v) => (
            <VariantRow key={v.id} v={v} withName on={v.id === vehicleId} onPress={() => { onPickVariant(v); setQuery(''); }} />
          ))}
          {hits.length === 0 ? <Txt v="muted">No match. Pick the make below or type your own.</Txt> : null}
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
        <View style={{ gap: 6 }}>
          <Txt v="label">Generation and engine</Txt>
          {variants.map((v) => (
            <VariantRow key={v.id} v={v} on={v.id === vehicleId} onPress={() => onPickVariant(v)} />
          ))}
        </View>
      ) : null}

      {!family && make.trim() && model.trim() ? (
        <Txt v="caption">Not in our list, so add the specs below yourself.</Txt>
      ) : null}
      {family && !variant ? (
        <Txt v="caption">Pick yours above, or name it your own way here:</Txt>
      ) : null}
      {family && !variant ? (
        <TextInput
          value={model}
          onChangeText={(t) => onMakeModel(make, t)}
          placeholder="Model as it shows on your build"
          placeholderTextColor={C.fog}
          style={ui.input}
          accessibilityLabel="Model name shown on your build"
        />
      ) : null}

      {variant ? (
        <Card accent={STATE.success}>
          <Txt v="label" style={{ color: STATE.success }}>Stock specs filled in</Txt>
          <Txt>
            {variant.make} {modelLabel(variant)} · {variant.engine} · {yearsLabel(variant)}
          </Txt>
          <Txt v="caption">
            {variant.bhp} bhp · {variant.weightKg} kg {kind === 'car' ? 'kerb' : 'wet'}{variant.weightApprox ? ' (approx. from dry)' : ''}
            {variant.torqueLbFt ? ` · ${variant.torqueLbFt} lb-ft` : ''}. Change anything below if yours differs.
          </Txt>
        </Card>
      ) : null}

      <SuggestMissing
        screen="vehicle-picker"
        label={`Suggest a missing ${noun}`}
        placeholder={kind === 'car' ? 'e.g. Vauxhall Astra VXR Arctic Edition' : 'e.g. Honda CBR400RR NC29'}
        context={[kind, make, model].filter(Boolean).join(' · ')}
      />
      <Txt v="caption">Stock figures are manufacturer UK figures (PS × 0.986 = bhp).</Txt>
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
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!on }}
      accessibilityLabel={`${withName ? `${v.make} ${v.model}, ` : ''}${line}`}
      style={({ pressed }) => [
        { paddingVertical: 9, paddingHorizontal: 12, minHeight: 44, borderRadius: RADIUS.card, borderWidth: 1, borderColor: on ? STATE.selected : C.kerbHi, backgroundColor: on ? `${STATE.selected}1f` : C.tarmac },
        pressed && { opacity: 0.8 },
      ]}
    >
      {withName ? <Text style={{ fontFamily: F.bodyBold, fontSize: TYPE.body, color: on ? STATE.selected : C.chalk }}>{v.make} {v.model}</Text> : null}
      <Text style={{ fontFamily: withName ? F.body : F.bodyBold, fontSize: withName ? TYPE.caption : TYPE.body, color: withName ? C.fog : on ? STATE.selected : C.chalk }}>{line}</Text>
    </Pressable>
  );
}
