import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { COLOR, RADII, SPACING, TYPE_SCALE } from '../../theme';
import { Button } from './Button';
import { segmentLabel, selectionSummary, toggleSelection } from './logic';
import { Press } from './Press';
import { DsText } from './Text';

/**
 * The one "selected" face for anything you pick (Review 12 decision 4): a chip, a ChoiceGroup
 * option, a day, an hour or a minute in the DateTimeSheet, a day in the month calendar. Off is an
 * outline; on is a sodium tint with a sodium border, and the text goes bold sodium (`chipText`).
 */
export function chipFace(on: boolean) {
  return {
    borderRadius: RADII.control,
    borderWidth: 1,
    borderColor: on ? COLOR.action.selected : COLOR.surface.borderStrong,
    backgroundColor: on ? COLOR.action.selectedTint : 'transparent',
  } as const;
}

/** The text colour that goes with `chipFace`. */
export function chipText(on: boolean, off: string = COLOR.text.primary): string {
  return on ? COLOR.action.selected : off;
}

/**
 * A chip: the one pill face in the app (REVIEW-10 #11). Off is an outline; on is a sodium tint,
 * a sodium border and bold sodium text (so "on" never relies on colour alone). No tick, no radio
 * dot. Many-of-many filters use ChipGroup; a one-of-many row of 5+ options (ChoiceGroup) uses the
 * same face with `role="radio"`. Labels are as typed; `raw` is kept for old callers.
 */
export function Chip({ label, on, onPress, raw, count, accessibilityLabel, role = 'checkbox', hint }: { label: string; on: boolean; onPress: () => void; raw?: boolean; count?: number; accessibilityLabel?: string; role?: 'checkbox' | 'radio'; hint?: string }) {
  return (
    <Press
      onPress={onPress}
      haptic="select"
      role={role}
      state={{ checked: on }}
      label={accessibilityLabel ?? (count !== undefined ? `${label}, ${count}` : label)}
      hitSlop={{ top: 6, bottom: 6 }}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xs,
        minHeight: 34,
        paddingHorizontal: SPACING.md,
        ...chipFace(on),
        ...(hint ? { paddingVertical: SPACING.sm, alignItems: 'flex-start' as const } : null),
      }}
    >
      <View style={{ flexShrink: 1 }}>
        <DsText v={on ? 'bodyStrong' : 'body'} style={{ color: chipText(on) }}>
          {count !== undefined ? `${label} ${count}` : label}
        </DsText>
        {hint ? <DsText v="caption">{hint}</DsText> : null}
      </View>
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
  // Always one row, like iOS (Review 15: a 2x2 block no longer reads as one control). Each label is
  // measured off-screen at its natural size; when they don't all fit, every label shrinks by the
  // same factor (to SEGMENT_MIN_SCALE at most) rather than wrapping or cutting one off. The labels
  // also cap their growth with larger text at SEGMENT_MAX_TEXT, as iOS segmented controls do.
  const [row, setRow] = useState(0);
  const [need, setNeed] = useState<Record<string, number>>({});
  const k = segmentFit(row, options.map((o) => need[o.key] ?? 0));
  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
      onLayout={(e) => setRow(Math.floor(e.nativeEvent.layout.width))}
      style={{ flexDirection: 'row', backgroundColor: COLOR.surface.card, borderColor: COLOR.surface.raisedHi, borderWidth: 1, borderRadius: RADII.control, padding: SEGMENT_GAP, gap: SEGMENT_GAP }}
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
            <DsText v="buttonSm" numberOfLines={1} maxFontSizeMultiplier={SEGMENT_MAX_TEXT} style={{ letterSpacing: 1 }}>
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
              // Wider labels get wider segments (SUSPENSION next to LOOKS), all on one row.
              flexGrow: 1,
              flexShrink: 1,
              flexBasis: need[o.key] ? need[o.key] * k + SEGMENT_PAD * 2 : 0,
              minWidth: 0,
              minHeight: 38,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: RADII.control - 2,
              paddingHorizontal: SEGMENT_PAD,
              paddingVertical: SPACING.xs,
              backgroundColor: on ? COLOR.action.selected : 'transparent',
            }}
          >
            <DsText
              v="buttonSm"
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={SEGMENT_MIN_SCALE}
              maxFontSizeMultiplier={SEGMENT_MAX_TEXT}
              style={[
                { color: on ? COLOR.action.onPrimary : COLOR.text.primary, letterSpacing: 1, textAlign: 'center' },
                k < 1 ? { fontSize: TYPE_SCALE.buttonSm.fontSize * k, letterSpacing: k } : null,
              ]}
            >
              {segmentLabel(o.label, o.count)}
            </DsText>
          </Press>
        );
      })}
    </View>
  );
}

/** Room either side of a segment's label, and between segments. */
const SEGMENT_PAD = SPACING.xs + 2;
const SEGMENT_GAP = 3;
/** How small a segment label may get to stay on one row. */
export const SEGMENT_MIN_SCALE = 0.72;
/** Segment labels grow with larger text only this far (iOS segmented controls cap theirs too). */
export const SEGMENT_MAX_TEXT = 1.15;

/**
 * The factor every label shrinks by so all of them fit one row of `row` px: 1 when they already
 * fit (or nothing is measured yet), never below SEGMENT_MIN_SCALE.
 */
export function segmentFit(row: number, widths: number[]): number {
  const text = widths.reduce((a, b) => a + b, 0);
  if (row <= 0 || text <= 0 || widths.some((w) => w <= 0)) return 1;
  const room = row - 2 - SEGMENT_GAP * (widths.length + 1) - SEGMENT_PAD * 2 * widths.length;
  if (text <= room) return 1;
  return Math.max(SEGMENT_MIN_SCALE, Math.floor((room / text) * 100) / 100);
}

/**
 * One of many for settings and forms (travel distance, alerts, report reason, event type, the
 * minutes in the DateTimeSheet). Always the one Chip face with `role="radio"` (Redesign 2, 4.4:
 * a SegmentedControl only switches the view below it, so a form choice never looks like one).
 * `pills` wraps them in a row; `list` stacks them full width with a hint under each. No radio dots.
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
  /** @deprecated ChoiceGroup is always chips now. Kept so old callers still compile. */
  chips?: boolean;
}) {
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} style={{ gap: SPACING.sm }}>
      {label ? <DsText v="label">{label}</DsText> : null}
      <View style={layout === 'pills' ? { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm } : { gap: SPACING.xs }}>
        {options.map((o) => (
          <Chip key={o.key} role="radio" label={o.label} hint={layout === 'list' ? o.hint : undefined} accessibilityLabel={o.hint ? `${o.label}, ${o.hint}` : o.label} on={o.key === value} onPress={() => onChange(o.key)} />
        ))}
      </View>
    </View>
  );
}

/**
 * Tabs: the top level of a screen (Community: Feed, People, Forum, Messages; a picker's categories).
 * Text labels on the page background with a sodium underline under the one you're on and a
 * hairline under the row, so they never look like the SegmentedControl or chips below them.
 * Scrolls sideways when the labels don't fit.
 */
export function Tabs<K extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
}: {
  options: { key: K; label: string; count?: number; dot?: boolean }[];
  value: K;
  onChange: (key: K) => void;
  accessibilityLabel?: string;
}) {
  return (
    <View style={{ borderBottomWidth: 1, borderBottomColor: COLOR.surface.border }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} accessibilityRole="tablist" accessibilityLabel={accessibilityLabel} contentContainerStyle={{ gap: SPACING.lg, flexGrow: 1 }}>
        {options.map((o, i) => {
          const on = o.key === value;
          const text = o.count ? `${o.label} ${o.count}` : o.label;
          return (
            <Press
              key={o.key}
              onPress={on ? undefined : () => onChange(o.key)}
              haptic="select"
              role="tab"
              state={{ selected: on }}
              label={`${text}, tab ${i + 1} of ${options.length}`}
              style={{ minHeight: 44, justifyContent: 'center', borderBottomWidth: 3, borderBottomColor: on ? COLOR.action.selected : 'transparent', marginBottom: -1, flexDirection: 'row', alignItems: 'center', gap: SPACING.xs }}
            >
              <DsText v="buttonSm" style={{ color: on ? COLOR.action.selected : COLOR.text.secondary }}>
                {text}
              </DsText>
              {o.dot ? <View aria-hidden style={{ width: 8, height: 8, borderRadius: RADII.pill, backgroundColor: COLOR.badge.bg }} /> : null}
            </Press>
          );
        })}
      </ScrollView>
    </View>
  );
}
