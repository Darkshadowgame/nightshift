import { useState } from 'react';
import { View } from 'react-native';
import { COLOR } from '../theme';
import { Icon, ListRow, RowDivider, Sheet } from './ds';

/**
 * One of more than five in a form (Redesign 2, 4.4): a row with the choice under its label that
 * opens a list Sheet, a tick on the one picked. Picking closes the sheet. The same list look as
 * Add a mod's parts, so a long choice always looks like this, never a wall of pills.
 */
export function ChoiceRow<K extends string>({
  label,
  options,
  value,
  onChange,
  placeholder = 'Choose',
}: {
  label: string;
  options: { key: K; label: string; hint?: string }[];
  value: K | null | undefined;
  onChange: (key: K) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const picked = options.find((o) => o.key === value);
  return (
    <>
      <ListRow title={label} subtitle={picked?.label ?? placeholder} onPress={() => setOpen(true)} accessibilityLabel={`${label}: ${picked?.label ?? placeholder}. Change it`} />
      <Sheet visible={open} title={label} onClose={() => setOpen(false)}>
        <View accessibilityRole="radiogroup" accessibilityLabel={label}>
          {options.map((o, i) => {
            const on = o.key === value;
            return (
              <View key={o.key}>
                {i ? <RowDivider /> : null}
                <ListRow
                  title={o.label}
                  subtitle={o.hint}
                  chevron={false}
                  trailing={on ? <Icon name="check" size={20} colour={COLOR.text.primary} /> : undefined}
                  onPress={() => {
                    onChange(o.key);
                    setOpen(false);
                  }}
                  accessibilityLabel={`${o.label}${o.hint ? `, ${o.hint}` : ''}${on ? ', selected' : ''}`}
                />
              </View>
            );
          })}
        </View>
      </Sheet>
    </>
  );
}
