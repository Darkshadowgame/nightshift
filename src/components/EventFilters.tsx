import { View } from 'react-native';
import { EVENT_COLOURS } from '../theme';
import { KIND_OPTIONS, WHEN_OPTIONS, type EventFilter } from '../lib/eventFilter';
import { SPACING } from '../theme';
import { ChipGroup, DsText, RowDivider, SegmentedControl, SwitchRow } from './ds';

export interface EventFiltersProps {
  eventsOn: boolean;
  onToggleEvents: () => void;
  filter: EventFilter;
  onChange: (next: EventFilter) => void;
}

/**
 * The Meets part of the Layers sheet (owner, 18 Nov 2026; "Meets", not "Events": Review 21 gap 19): Meets on or off, When (Tonight / This
 * week / All), Type chips (nothing picked = all) and Only ones I can go to. Meets you're going to or
 * hosting always show. The logic is eventFilter.ts.
 */
export function EventFilters({ eventsOn, onToggleEvents, filter, onChange }: EventFiltersProps) {
  return (
    <View style={{ gap: SPACING.md }}>
      <SwitchRow label="Meets" hint="Cruises and rolling meets too. Yours always show" value={eventsOn} onValueChange={onToggleEvents} />
      {eventsOn ? (
        <>
          <View style={{ gap: SPACING.sm }}>
            <DsText v="label">When</DsText>
            <SegmentedControl accessibilityLabel="When" value={filter.when} onChange={(when) => onChange({ ...filter, when })} options={WHEN_OPTIONS} />
          </View>
          <ChipGroup label="Type" allLabel="All types" options={KIND_OPTIONS.map((o) => ({ ...o, dot: EVENT_COLOURS[o.key] }))} selected={filter.types} onChange={(types) => onChange({ ...filter, types })} />
          <SwitchRow
            label="Only ones I can go to"
            hint="Hides meets your garage doesn't fit"
            value={filter.canGoOnly}
            onValueChange={(canGoOnly) => onChange({ ...filter, canGoOnly })}
          />
        </>
      ) : null}
      <RowDivider />
    </View>
  );
}
