import { useState } from 'react';
import { View } from 'react-native';
import { COLOR, RADII, SPACING } from '../../theme';
import { Button } from './Button';
import { Icon } from './Icon';
import { segmentLabel, selectionSummary, toggleSelection } from './logic';
import { Press } from './Press';
import { DsText } from './Text';

/**
 * A filter chip: **many of many only**. Off is an outline with fog text; on is a sodium tint,
 * sodium border and a check mark (so "on" never relies on colour alone). Never a radio button:
 * one-of-many is SegmentedControl or ChoiceGroup. Labels are as typed, in the pill's face; `raw` is kept for old callers.
 */
export function Chip({ label, on, onPress, raw, count, accessibilityLabel }: { label: string; on: boolean; onPress: () => void; raw?: boolean; count?: number; accessibilityLabel?: string }) {
  const c = on ? COLOR.action.selected : COLOR.text.secondary;
  return (
    <Press
      onPress={onPress}
      haptic="select"
      role="checkbox"
      state={{ checked: on }}
      label={accessibilityLabel ?? (count !== undefined ? `${label}, ${count}` : label)}
      hitSlop={{ top: 6, bottom: 6 }}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xs,
        minHeight: 34,
        paddingHorizontal: SPACING.md,
        borderRadius: RADII.control,
        borderWidth: 1,
        borderColor: on ? COLOR.action.selected : COLOR.surface.borderStrong,
        backgroundColor: on ? COLOR.action.selectedTint : 'transparent',
      }}
    >
      {on ? <Icon name="check" size={14} colour={c} /> : null}
      {/* Same face, size and case as a ChoiceGroup pill, so one form never mixes two control styles (REVIEW-7 inconsistency 3). */}
      <DsText v="body" style={{ color: on ? c : COLOR.text.primary }}>
        {count !== undefined ? `${label} ${count}` : label}
      </DsText>
    </Press>
  );
}

/**
 * A row of filter chips with the one rule: **nothing selected = everything** (no filter). A
 * "Clear" link appears once anything is on. `allLabel` names the unfiltered state for screen readers.
 */
export function ChipGroup<K extends string>({
  label,
  options,
  selected,
  onChange,
  allLabel = 'All',
  raw,
}: {
  label: string;
  options: { key: K; label: string; count?: number }[];
  selected: K[];
  onChange: (next: K[]) => void;
  allLabel?: string;
  raw?: boolean;
}) {
  const order = options.map((o) => o.key);
  const summary = selectionSummary(
    options.filter((o) => selected.includes(o.key)).map((o) => o.label),
    allLabel,
  );
  return (
    <View style={{ gap: SPACING.sm }} accessibilityLabel={`${label}: ${summary}`}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 24 }}>
        <DsText v="label">{label}</DsText>
        {selected.length ? <Button label="Clear" tier="tertiary" size="sm" onPress={() => onChange([])} accessibilityLabel={`Clear ${label}`} /> : null}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm }}>
        {options.map((o) => (
          <Chip key={o.key} label={o.label} count={o.count} raw={raw} on={selected.includes(o.key)} onPress={() => onChange(toggleSelection(selected, o.key, order))} />
        ))}
      </View>
    </View>
  );
}

/**
 * Switches the view below it: 2–4 options, one on, counts allowed ("Mine 3"). Events,
 * Community, Find, feed scope, post visibility, car/bike.
 */
export function SegmentedControl<K extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
}: {
  options: { key: K; label: string; count?: number }[];
  value: K;
  onChange: (key: K) => void;
  accessibilityLabel?: string;
}) {
  // Large text (REVIEW-7 problem 7): labels are measured off-screen; when they don't all fit in one
  // row, the control becomes two rows instead of cutting a label off ("MESSAGE…").
  const [row, setRow] = useState(0);
  const [need, setNeed] = useState<Record<string, number>>({});
  const padEach = SPACING.xs * 2 + 3 + SPACING.xs;
  const total = options.reduce((sum, o) => sum + (need[o.key] ?? 0) + padEach, 0) + 6;
  const twoRows = row > 0 && options.length > 2 && total > row;
  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
      onLayout={(e) => setRow(Math.floor(e.nativeEvent.layout.width))}
      style={{ flexDirection: 'row', flexWrap: 'wrap', backgroundColor: COLOR.surface.card, borderColor: COLOR.surface.raisedHi, borderWidth: 1, borderRadius: RADII.control, padding: 3, gap: 3 }}
    >
      <View pointerEvents="none" aria-hidden style={{ position: 'absolute', left: 0, top: 0, opacity: 0 }}>
        {options.map((o) => (
          <View
            key={o.key}
            style={{ alignSelf: 'flex-start' }}
            onLayout={(e) => {
              const w = Math.ceil(e.nativeEvent.layout.width);
              setNeed((n) => (Math.abs((n[o.key] ?? 0) - w) > 1 ? { ...n, [o.key]: w } : n));
            }}
          >
            <DsText v="buttonSm" style={{ letterSpacing: 1 }}>
              {segmentLabel(o.label, o.count)}
            </DsText>
          </View>
        ))}
      </View>
      {options.map((o, i) => {
        const on = o.key === value;
        return (
          <Press
            key={o.key}
            onPress={on ? undefined : () => onChange(o.key)}
            haptic="select"
            role="tab"
            state={{ selected: on }}
            label={`${segmentLabel(o.label, o.count)}, ${i + 1} of ${options.length}`}
            style={{
              flexGrow: 1,
              flexBasis: twoRows ? '45%' : 0,
              minHeight: 38,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: RADII.control - 2,
              paddingHorizontal: SPACING.xs,
              backgroundColor: on ? COLOR.action.selected : 'transparent',
            }}
          >
            <DsText v="buttonSm" style={{ color: on ? COLOR.action.onPrimary : COLOR.text.primary, letterSpacing: 1, textAlign: 'center' }}>
              {segmentLabel(o.label, o.count)}
            </DsText>
          </Press>
        );
      })}
    </View>
  );
}

/**
 * One of many for settings and forms (travel distance, alerts, report reason, event type).
 * `pills` wrap and show a filled dot when on; `list` is a radio list with a hint per option.
 */
export function ChoiceGroup<K extends string>({
  label,
  options,
  value,
  onChange,
  layout = 'pills',
}: {
  label: string;
  options: { key: K; label: string; hint?: string }[];
  value: K | null;
  onChange: (key: K) => void;
  layout?: 'pills' | 'list';
}) {
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} style={{ gap: SPACING.sm }}>
      <DsText v="label">{label}</DsText>
      <View style={layout === 'pills' ? { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm } : { gap: SPACING.xs }}>
        {options.map((o) => {
          const on = o.key === value;
          return (
            <Press
              key={o.key}
              onPress={() => onChange(o.key)}
              haptic="select"
              role="radio"
              state={{ checked: on }}
              label={o.hint ? `${o.label}, ${o.hint}` : o.label}
              style={[
                { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, minHeight: layout === 'list' ? 44 : 34, paddingHorizontal: SPACING.md, borderRadius: RADII.control, borderWidth: 1 },
                { borderColor: on ? COLOR.action.selected : COLOR.surface.borderStrong, backgroundColor: on ? COLOR.action.selectedTint : 'transparent' },
                layout === 'list' && { paddingVertical: SPACING.sm },
              ]}
            >
              <View style={{ width: 16, height: 16, borderRadius: 8, borderWidth: 1.5, borderColor: on ? COLOR.action.selected : COLOR.surface.borderStrong, alignItems: 'center', justifyContent: 'center' }}>
                {on ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: COLOR.action.selected }} /> : null}
              </View>
              <View style={{ flexShrink: 1 }}>
                <DsText v="body">{o.label}</DsText>
                {layout === 'list' && o.hint ? <DsText v="caption">{o.hint}</DsText> : null}
              </View>
            </Press>
          );
        })}
      </View>
    </View>
  );
}
