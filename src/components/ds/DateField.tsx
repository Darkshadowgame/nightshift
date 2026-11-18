import { useState } from 'react';
import { View } from 'react-native';
import { appNow } from '../../lib/appClock';
import { COLOR, RADII, SPACING } from '../../theme';
import { Field, INPUT } from './Field';
import { Icon } from './Icon';
import { localDay, monthGrid, parseLocalDay } from './logic';
import { Press } from './Press';
import { Sheet } from './Sheet';
import { DsText } from './Text';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEK = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

/** "Fri 27 Nov 2026". */
export function dayLabel(day: string): string {
  const d = parseLocalDay(day);
  return d ? d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : day;
}

/**
 * A month calendar (Monday first), inline: the inside of `DateSheet`, and the "Another day" view
 * of `DateTimeSheet`. `min`/`max` (local "YYYY-MM-DD") grey out the rest.
 */
export function MonthCalendar({ value, min, max, onPick }: { value: string | null; min?: string; max?: string; onPick: (day: string) => void }) {
  const start = parseLocalDay(value) ?? parseLocalDay(max && localDay(appNow()) > max ? max : null) ?? appNow();
  const [month, setMonth] = useState({ y: start.getFullYear(), m: start.getMonth() });
  const shift = (n: number) => setMonth(({ y, m }) => ({ y: y + Math.floor((m + n) / 12), m: (((m + n) % 12) + 12) % 12 }));
  const lastOfPrev = localDay(new Date(month.y, month.m, 0, 12));
  const firstOfNext = localDay(new Date(month.y, month.m + 1, 1, 12));
  const canBack = !min || lastOfPrev >= min;
  const canNext = !max || firstOfNext <= max;
  const today = localDay(appNow());
  return (
    <View style={{ gap: SPACING.xs }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Press onPress={canBack ? () => shift(-1) : undefined} disabled={!canBack} label="Previous month" style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', opacity: canBack ? 1 : 0.3 }}>
          <Icon name="back" colour={COLOR.text.primary} />
        </Press>
        <DsText v="bodyStrong" accessibilityRole="header">{`${MONTHS[month.m]} ${month.y}`}</DsText>
        <Press onPress={canNext ? () => shift(1) : undefined} disabled={!canNext} label="Next month" style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', opacity: canNext ? 1 : 0.3 }}>
          <Icon name="chevron" colour={COLOR.text.primary} />
        </Press>
      </View>
      <View style={{ flexDirection: 'row' }} aria-hidden>
        {WEEK.map((w, i) => (
          <DsText key={i} v="label" style={{ flex: 1, textAlign: 'center' }}>
            {w}
          </DsText>
        ))}
      </View>
      {monthGrid(month.y, month.m).map((row, r) => (
        <View key={r} style={{ flexDirection: 'row' }}>
          {row.map((day, i) => {
            if (!day) return <View key={i} style={{ flex: 1, height: 44 }} />;
            const off = (min && day < min) || (max && day > max);
            const on = day === value;
            return (
              <Press
                key={i}
                onPress={off ? undefined : () => onPick(day)}
                disabled={!!off}
                role="button"
                state={{ selected: on, disabled: !!off }}
                label={dayLabel(day)}
                style={{ flex: 1, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: RADII.control, backgroundColor: on ? COLOR.action.selected : 'transparent', borderWidth: day === today && !on ? 1 : 0, borderColor: COLOR.surface.borderStrong }}
              >
                <DsText v={on ? 'bodyStrong' : 'body'} style={{ color: on ? COLOR.action.onPrimary : off ? COLOR.text.disabled : COLOR.text.primary }}>
                  {String(Number(day.slice(8)))}
                </DsText>
              </Press>
            );
          })}
        </View>
      ))}
    </View>
  );
}

/**
 * @deprecated Redesign 2, 4.4: a date or time is `DateTimeSheet` everywhere (host flow, dyno run).
 * Kept until the host form and dyno form move over. A month calendar in a Sheet; values are local
 * "YYYY-MM-DD". Mount it when opened (`{open ? <DateSheet visible … /> : null}`) so it starts on
 * the picked month.
 */
export function DateSheet({ visible, title = 'Pick a date', value, min, max, onPick, onClose }: { visible: boolean; title?: string; value: string | null; min?: string; max?: string; onPick: (day: string) => void; onClose: () => void }) {
  return (
    <Sheet visible={visible} title={title} onClose={onClose}>
      <MonthCalendar value={value} min={min} max={max} onPick={onPick} />
    </Sheet>
  );
}

/** @deprecated Use `DateTimeField` (mode "date"). */
export function DateField({ label, hint, value, min, max, onChange }: { label: string; hint?: string; value: string; min?: string; max?: string; onChange: (day: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <Field label={label} hint={hint}>
      <Press onPress={() => setOpen(true)} label={`${label}: ${dayLabel(value)}. Change`} style={[INPUT, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
        <DsText v="input">{dayLabel(value)}</DsText>
        <DsText v="buttonSm" tone="action">
          Change
        </DsText>
      </Press>
      {open ? (
        <DateSheet
          visible
          title={label}
          value={value}
          min={min}
          max={max}
          onClose={() => setOpen(false)}
          onPick={(d) => {
            onChange(d);
            setOpen(false);
          }}
        />
      ) : null}
    </Field>
  );
}
