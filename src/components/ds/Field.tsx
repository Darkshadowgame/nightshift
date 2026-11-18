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

/**
 * A form field: a caps label above, then one message slot under it (Review 12 decision 1): the
 * `error` when there is one, in its place the `hint`. An error never sits on top of, or next to,
 * the helper text.
 */
export function Field({ label, hint, error, children }: { label: string; hint?: string | null; error?: string | null; children: ReactNode }) {
  return (
    <View style={{ gap: SPACING.xs }}>
      <DsText v="label">{label}</DsText>
      {children}
      {error ? (
        <DsText v="caption" tone="danger" accessibilityLiveRegion="polite">
          {error}
        </DsText>
      ) : hint ? (
        <DsText v="caption">{hint}</DsText>
      ) : null}
    </View>
  );
}

