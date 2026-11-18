import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { allVariants } from '../data/vehicles';
import { brandOptions, type BrandKinds } from '../lib/brands';
import { makesFor } from '../lib/vehicles';
import { SPACING } from '../theme';
import { Button, Chip, DsText, SearchField } from './ds';

/**
 * The invite's Brands row (REVIEW-9 decision 5): every make in the vehicle data, searchable, the
 * common ones first. Picked makes stay at the front as "on" chips. Nothing picked: every brand.
 */
export function BrandPicker({ vehicles, selected, onChange }: { vehicles: BrandKinds; selected: string[]; onChange: (next: string[]) => void }) {
  const [query, setQuery] = useState('');
  const all = useMemo(() => ({ car: makesFor(allVariants(), 'car'), bike: makesFor(allVariants(), 'bike') }), []);
  const options = brandOptions(all, vehicles, query, selected, query ? 24 : 21);
  const toggle = (b: string) => onChange(selected.includes(b) ? selected.filter((x) => x !== b) : [...selected, b]);
  return (
    <View style={{ gap: SPACING.sm }} accessibilityLabel={`Brands: ${selected.length ? selected.join(', ') : 'every brand'}`}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 24 }}>
        <DsText v="label">Brands</DsText>
        {selected.length ? <Button label="Clear" tier="tertiary" size="sm" onPress={() => onChange([])} accessibilityLabel="Clear Brands" /> : null}
      </View>
      <DsText v="meta">{selected.length ? `Only ${selected.join(', ')}` : 'Every brand'}</DsText>
      {selected.length ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm }}>
          {selected.map((b) => (
            <Chip key={b} label={b} raw on onPress={() => toggle(b)} />
          ))}
        </View>
      ) : null}
      <SearchField value={query} onChangeText={setQuery} placeholder="Search every make" accessibilityLabel="Search makes" />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm }}>
        {options.map((b) => (
          <Chip
            key={b}
            label={b}
            raw
            on={false}
            onPress={() => {
              toggle(b);
              // Picked: the search has done its job (REVIEW-10: "No make called that" under the make you'd just picked).
              setQuery('');
            }}
          />
        ))}
      </View>
      {query.trim() && options.length === 0 && !selected.some((b) => b.toLowerCase().includes(query.trim().toLowerCase())) ? (
        <DsText v="caption">{`No make called "${query.trim()}". Try another spelling.`}</DsText>
      ) : null}
    </View>
  );
}
