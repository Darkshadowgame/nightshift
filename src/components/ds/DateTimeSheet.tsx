import { useRef, useState, type ComponentRef } from 'react';
import { ScrollView, View } from 'react-native';
import { appNow, clockOffset } from '../../lib/appClock';
import { dayKey, dayLabelShort, dayOptions, whenLabel } from '../../lib/when';
import { COLOR, SPACING } from '../../theme';
import { ChoiceGroup, chipFace, chipText } from './Choice';
import { MonthCalendar } from './DateField';
import { Field, INPUT } from './Field';
import { Icon } from './Icon';
import { afterMidnightLabel, localDay, parseLocalDay, shortDate, shortDay } from './logic';
import { Press } from './Press';
import { Sheet } from './Sheet';
import { DsText } from './Text';

export type DateTimeMode = 'datetime' | 'date';

type Opts = {
  /** Nothing earlier can be picked (the host flow: now). Days, hours and minutes before it are greyed. */
  minDate?: Date;
  /** Nothing later can be picked (a dyno run: today). */
  maxDate?: Date;
  /** How many days the quick row shows (from today, or back from today with `past`). */
  days?: number;
  stepMinutes?: number;
  mode?: DateTimeMode;
  /** Days run back from today (a dyno run, a track day you went to). */
  past?: boolean;
  /** "Now" for the day row. Defaults to the app clock (`appNow()`), so the demo night is respected. */
  now?: Date;
  /**
   * This is the end of something that starts at `after` (the host flow's Ends): an end in the small
   * hours after it reads "01:00 (after midnight)" (4.10), not "Tonight 01:00".
   */
  after?: Date;
};

/** What the picker and its field say for a value: "Tonight 22:00", "Sun 10:00", "01:00 (after midnight)", "Today". */
export function dateTimeText(value: Date, now: Date, mode: DateTimeMode = 'datetime', after?: Date): string {
  if (mode === 'date') return dayLabelShort(value, now);
  return (after && afterMidnightLabel(value, after)) || whenLabel(value, now);
}

/**
 * Every hour of the day, in clock order, in one tidy grid of 6 columns by 4 rows (Review 20 #10,
 * owner decision): morning meets (Sunday coffee) are as easy to pick as evening ones. The evening
 * (17–23), when most meets start, has a subtle shaded face; every hour is full strength (Review 21).
 */
const HOURS = Array.from({ length: 24 }, (_, h) => h);
const EVENING_FROM = 17;
const HOUR_COLUMNS = 6;

/**
 * The one date and time picker (Redesign 2, 4.4): host flow Starts and Ends, a dyno run's date, a
 * track day. Never a typed date, never a dropdown.
 *
 * In a Sheet: a sideways row of days (`days`, default 14: "Today", "Tomorrow", "Sat 21", …, then
 * "Another day" for the month calendar, in the same sheet), then for `mode="datetime"` the hour
 * (all 24 in clock order, a 6 x 4 grid with the evening shaded; any that can't be picked are greyed)
 * and the minutes in `stepMinutes` steps (default 15: :00 :15 :30 :45).
 * Every tap calls `onChange` with the whole new Date; the Sheet closes with Done.
 *
 * Use `DateTimeField` in forms: it shows the value ("Sun 10:00", "Today") and opens this.
 */
export function DateTimeSheet({
  visible,
  title = 'Pick a time',
  value,
  onChange,
  onClose,
  minDate,
  maxDate,
  days = 14,
  stepMinutes = 15,
  mode = 'datetime',
  past = false,
  now: nowGiven,
  after,
}: Opts & {
  visible: boolean;
  title?: string;
  value: Date | null;
  onChange: (d: Date) => void;
  onClose: () => void;
}) {
  const now = nowGiven ?? appNow();
  // The demo runs on a virtual Friday night (appClock): say which day "Today" is, once, so a phone
  // that reads Wednesday doesn't make "Today" look wrong.
  const demoDay = !nowGiven && clockOffset() !== 0 ? `The demo night is ${shortDate(now)}, so that's "Today" here.` : null;
  const [calendar, setCalendar] = useState(false);
  // The day row opens scrolled to the picked day (it can be two weeks along).
  const row = useRef<ComponentRef<typeof ScrollView>>(null);
  const scrolled = useRef(false);
  const options = dayOptions(now, days, past);
  const minKey = minDate ? dayKey(minDate) : undefined;
  const maxKey = maxDate ? dayKey(maxDate) : undefined;
  const current = value ? dayKey(value) : null;
  const inRow = !!current && options.some((o) => o.key === current);

  // The value with one part changed. A first pick with no value starts at 20:00.
  const base = () => {
    if (value) return new Date(value);
    const d = new Date(now);
    d.setHours(20, 0, 0, 0);
    return d;
  };
  const pickDay = (key: string) => {
    const day = parseLocalDay(key);
    if (!day) return;
    const d = base();
    d.setFullYear(day.getFullYear(), day.getMonth(), day.getDate());
    onChange(clamp(d, minDate, maxDate));
    setCalendar(false);
  };
  const pickHour = (h: number) => {
    const d = base();
    d.setHours(h, d.getMinutes(), 0, 0);
    onChange(clamp(d, minDate, maxDate));
  };
  const pickMinute = (m: number) => {
    const d = base();
    d.setMinutes(m, 0, 0);
    onChange(clamp(d, minDate, maxDate));
  };

  const dayOff = (key: string) => (!!minKey && key < minKey) || (!!maxKey && key > maxKey);
  const hourOff = (h: number) => {
    if (!value) return false;
    const start = new Date(value);
    start.setHours(h, 0, 0, 0);
    const end = new Date(start.getTime() + 3_599_000);
    return (!!minDate && end < minDate) || (!!maxDate && start > maxDate);
  };
  const minutes = Array.from({ length: Math.max(1, Math.floor(60 / stepMinutes)) }, (_, i) => i * stepMinutes);
  const hourChip = (h: number) => {
    const on = !!value && value.getHours() === h;
    const off = hourOff(h);
    const evening = h >= EVENING_FROM;
    return (
      <Press
        key={h}
        onPress={off ? undefined : () => pickHour(h)}
        disabled={off}
        haptic="select"
        role="radio"
        state={{ checked: on, disabled: off }}
        label={`${String(h).padStart(2, '0')}:00`}
        style={{
          flex: 1,
          minHeight: 44,
          alignItems: 'center',
          justifyContent: 'center',
          ...chipFace(on),
          // Every hour is full strength and tappable (Review 21 gap 17: dim mornings looked disabled).
          // The evening gets only a subtle raised face; selection stays the one sodium state.
          ...(!on && evening ? { backgroundColor: COLOR.surface.raised } : null),
          opacity: off ? 0.35 : 1,
        }}
      >
        <DsText v={on ? 'bodyStrong' : 'body'} style={{ color: chipText(on), fontVariant: ['tabular-nums'] }}>
          {String(h).padStart(2, '0')}
        </DsText>
      </Press>
    );
  };
  const hourRows = Array.from({ length: HOURS.length / HOUR_COLUMNS }, (_, r) => HOURS.slice(r * HOUR_COLUMNS, (r + 1) * HOUR_COLUMNS));

  return (
    <Sheet visible={visible} title={title} onClose={onClose}>
      {value ? (
        <DsText v="title" accessibilityLiveRegion="polite">
          {dateTimeText(value, now, mode, after)}
        </DsText>
      ) : null}
      {demoDay ? <DsText v="caption">{demoDay}</DsText> : null}
      {calendar ? (
        <MonthCalendar value={current} min={minKey} max={maxKey ?? (past ? localDay(now) : undefined)} onPick={pickDay} />
      ) : (
        <ScrollView ref={row} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: SPACING.sm, paddingVertical: SPACING.xxs }}>
          {options.map((o, i) => {
            const on = o.key === current;
            const off = dayOff(o.key);
            // "Today / Fri 20", "Tomorrow / Sat 21", then "Sun / 22": the weekday is always on the chip.
            const word = i === 0 ? 'Today' : i === 1 ? (past ? 'Yesterday' : 'Tomorrow') : shortDay(o.date).split(' ')[0];
            const num = i <= 1 ? shortDay(o.date) : String(o.date.getDate());
            return (
              <Press
                key={o.key}
                onLayout={
                  on
                    ? (e) => {
                        if (scrolled.current) return;
                        scrolled.current = true;
                        const x = e.nativeEvent.layout.x;
                        if (x > 0) row.current?.scrollTo({ x: Math.max(0, x - SPACING.xl), animated: false });
                      }
                    : undefined
                }
                onPress={off ? undefined : () => pickDay(o.key)}
                disabled={off}
                haptic="select"
                role="radio"
                state={{ checked: on, disabled: off }}
                label={`${word}, ${shortDate(o.date)}`}
                style={{
                  minWidth: 64,
                  minHeight: 56,
                  paddingHorizontal: SPACING.sm,
                  alignItems: 'center',
                  justifyContent: 'center',
                  ...chipFace(on),
                  opacity: off ? 0.35 : 1,
                }}
              >
                <DsText v="meta" style={{ color: chipText(on, COLOR.text.secondary) }}>
                  {word}
                </DsText>
                <DsText v={on ? 'bodyStrong' : 'body'} style={{ color: chipText(on) }}>
                  {num}
                </DsText>
              </Press>
            );
          })}
          <Press
            onPress={() => setCalendar(true)}
            label="Another day"
            role="button"
            style={{
              minWidth: 64,
              minHeight: 56,
              paddingHorizontal: SPACING.sm,
              alignItems: 'center',
              justifyContent: 'center',
              ...chipFace(!inRow && !!current),
            }}
          >
            <Icon name="calendar" size={18} colour={chipText(!inRow && !!current, COLOR.text.secondary)} />
            <DsText v="meta" style={{ color: chipText(!inRow && !!current, COLOR.text.secondary) }}>
              Another day
            </DsText>
          </Press>
        </ScrollView>
      )}
      {mode === 'datetime' && !calendar ? (
        <View style={{ gap: SPACING.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: SPACING.sm }}>
            <DsText v="label">Hour</DsText>
            <DsText v="caption">Evening (17–23) is shaded</DsText>
          </View>
          <View style={{ gap: SPACING.xs }}>
            {hourRows.map((row) => (
              <View key={row[0]} style={{ flexDirection: 'row', gap: SPACING.xs }}>
                {row.map((h) => hourChip(h))}
              </View>
            ))}
          </View>
          <ChoiceGroup
            label="Minutes"
            options={minutes.map((m) => ({ key: String(m), label: `:${String(m).padStart(2, '0')}` }))}
            value={value ? String(Math.floor(value.getMinutes() / stepMinutes) * stepMinutes) : null}
            onChange={(k) => pickMinute(Number(k))}
          />
        </View>
      ) : null}
    </Sheet>
  );
}

function clamp(d: Date, min?: Date, max?: Date): Date {
  if (min && d < min) return new Date(min);
  if (max && d > max) return new Date(max);
  return d;
}

/**
 * A form field for a date and time (or a date): the caps label, the value as the app says it
 * ("Tonight 22:00", "Sun 10:00", "Today"), Change, and the `DateTimeSheet` on tap.
 *
 *   <DateTimeField label="Starts" value={start} onChange={setStart} minDate={appNow()} />
 *   <DateTimeField label="Date of the run" mode="date" past days={14} value={day} onChange={setDay} maxDate={appNow()} />
 */
export function DateTimeField({
  label,
  hint,
  error,
  value,
  onChange,
  placeholder = 'Pick',
  ...opts
}: Opts & { label: string; hint?: string; error?: string | null; value: Date | null; onChange: (d: Date) => void; placeholder?: string }) {
  const [open, setOpen] = useState(false);
  const now = opts.now ?? appNow();
  const shown = value ? dateTimeText(value, now, opts.mode, opts.after) : placeholder;
  return (
    <Field label={label} hint={hint} error={error}>
      <Press onPress={() => setOpen(true)} label={`${label}: ${shown}. Change`} style={[INPUT, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
        <DsText v="input" style={value ? undefined : { color: COLOR.text.secondary }}>
          {shown}
        </DsText>
        <DsText v="buttonSm" tone="action">
          Change
        </DsText>
      </Press>
      {open ? <DateTimeSheet visible title={label} value={value} onChange={onChange} onClose={() => setOpen(false)} {...opts} /> : null}
    </Field>
  );
}
