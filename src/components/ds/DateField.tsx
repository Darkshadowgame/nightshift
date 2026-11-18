import { useState } from 'react';
import { View } from 'react-native';
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
 * The one date picker (REVIEW-10 #11): a month calendar in a Sheet. Used by the host flow
 * (today to 60 days ahead) and the dyno form (a past day). Values are local "YYYY-MM-DD".
 * `DateSheet` is the calendar on its own (for a "Pick a date" button); `DateField` is a form
 * field that shows the day and opens it.
 */
export function DateSheet({ visible, title = 'Pick a date', value, min, max, onPick, onClose }: { visible: boolean; title?: string; value: string | null; min?: string; max?: string; onPick: (day: string) => void; onClose: () => void }) {
  // Mount it when opened (`{open ? <DateSheet visible … /> : null}`) so it starts on the picked month.
  const start = parseLocalDay(value) ?? new Date();
  const [month, setMonth] = useState({ y: start.getFullYear(), m: start.getMonth() });
  const shift = (n: number) => setMonth(({ y, m }) => ({ y: y + Math.floor((m + n) / 12), m: (((m + n) % 12) + 12) % 12 }));
  const lastOfPrev = localDay(new Date(month.y, month.m, 0, 12));
  const firstOfNext = localDay(new Date(month.y, month.m + 1, 1, 12));
  const canBack = !min || lastOfPrev >= min;
  const canNext = !max || firstOfNext <= max;
  const today = localDay(new Date());
  return (
    <Sheet visible={visible} title={title} onClose={onClose}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Press onPress={canBack ? () => shift(-1) : undefined} disabled={!canBack} label="Previous month" style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', opacity: canBack ? 1 : 0.3 }}>
          <Icon name="back" colour={COLOR.action.link} />
        </Press>
        <DsText v="bodyStrong" accessibilityRole="header">{`${MONTHS[month.m]} ${month.y}`}</DsText>
        <Press onPress={canNext ? () => shift(1) : undefined} disabled={!canNext} label="Next month" style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', opacity: canNext ? 1 : 0.3 }}>
          <Icon name="chevron" colour={COLOR.action.link} />
        </Press>
      </View>
      <View style={{ gap: SPACING.xs }}>
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
    </Sheet>
  );
}

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
