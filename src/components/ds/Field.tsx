import type { ReactNode } from 'react';
import { TextInput, View, type TextInputProps, type TextStyle } from 'react-native';
import { COLOR, RADII, SPACING } from '../../theme';
import { DsText, typeStyle } from './Text';

/** The text field look: input type, strong border, control radius. */
export const INPUT: TextStyle = {
  ...typeStyle('input'),
  backgroundColor: COLOR.surface.card,
  borderColor: COLOR.surface.borderStrong,
  borderWidth: 1,
  borderRadius: RADII.control,
  paddingHorizontal: SPACING.md,
  paddingVertical: SPACING.md,
  minHeight: 48,
};

export function TextField({ style, multilineHeight, ...rest }: TextInputProps & { multilineHeight?: number }) {
  return <TextInput placeholderTextColor={COLOR.text.secondary} style={[INPUT, multilineHeight ? { minHeight: multilineHeight, textAlignVertical: 'top' } : null, style]} {...rest} />;
}

/** A form field: a caps label above, a hint under it. */
export function Field({ label, hint, children }: { label: string; hint?: string | null; children: ReactNode }) {
  return (
    <View style={{ gap: SPACING.xs }}>
      <DsText v="label">{label}</DsText>
      {children}
      {hint ? <DsText v="caption">{hint}</DsText> : null}
    </View>
  );
}

