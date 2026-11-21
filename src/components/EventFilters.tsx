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
  /** Show the Meets on/off row (default). The split Layers sheet leaves it out: its Meets / Things to do switch decides. */
  toggle?: boolean;
  /** Time check (mapNight.ts): shown under When. Off by default; on puts a drag-across-the-evening row in the sheet. */
  timeCheck?: boolean;
  onTimeCheck?: (on: boolean) => void;
}

/**
 * The Meets part of the Layers sheet (owner, 18 Nov 2026; "Meets", not "Events": Review 21 gap 19): Meets on or off, When (Tonight / This
 * week / All), Type chips (nothing picked = all) and Only ones I can go to. Meets you're going to or
 * hosting always show. The logic is eventFilter.ts.
 */
export function EventFilters({ eventsOn, onToggleEvents, filter, onChange, toggle = true, timeCheck, onTimeCheck }: EventFiltersProps) {
  return (
    <View style={{ gap: SPACING.md }}>
      {toggle ? <SwitchRow label="Meets" hint="Cruises and rolling meets too. Yours always show" value={eventsOn} onValueChange={onToggleEvents} /> : null}
      {eventsOn ? (
        <>
          <View style={{ gap: SPACING.sm }}>
            <DsText v="label">When</DsText>
            <SegmentedControl accessibilityLabel="When" value={filter.when} onChange={(when) => onChange({ ...filter, when })} options={WHEN_OPTIONS} />
            {onTimeCheck ? (
              <SwitchRow label="Check a time" hint="Drag across the evening, 18:00 to 02:00, to see what's on" value={!!timeCheck} onValueChange={onTimeCheck} />
            ) : null}
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
      {toggle ? <RowDivider /> : null}
    </View>
  );
}
