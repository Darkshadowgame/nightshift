import { Pressable, Switch, View } from 'react-native';
import { COLOR, SPACING } from '../../theme';
import { buzz } from './Press';
import { DsText } from './Text';

/**
 * A setting that's on or off: the label (as typed), an optional hint under it, and a switch on
 * the right. The whole row is one control for a screen reader (role switch, label, hint, state),
 * buzzes `select` when it changes, and is at least 44 tall. Sodium track when on. Tapping anywhere
 * on the row flips it, not just the switch (REVIEW-13 #19).
 */
export function SwitchRow({
  label,
  hint,
  value,
  onValueChange,
  disabled,
}: {
  label: string;
  hint?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  const flip = (v: boolean) => {
    buzz('select');
    onValueChange(v);
  };
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.md, minHeight: 56 }}>
      {/* The words flip it too; the switch handles its own taps (so one tap is one change on web). */}
      <Pressable onPress={() => (disabled ? undefined : flip(!value))} accessible={false} style={{ flex: 1, gap: SPACING.xxs, alignSelf: 'stretch', justifyContent: 'center', paddingVertical: SPACING.sm }} aria-hidden>
        <DsText v="body" style={disabled ? { color: COLOR.text.disabled } : undefined}>
          {label}
        </DsText>
        {hint ? <DsText v="caption">{hint}</DsText> : null}
      </Pressable>
      <Switch
        accessibilityLabel={label}
        accessibilityHint={hint}
        value={value}
        disabled={disabled}
        onValueChange={flip}
        trackColor={{ true: COLOR.action.primary, false: COLOR.surface.raisedHi }}
        thumbColor={COLOR.text.primary}
        ios_backgroundColor={COLOR.surface.raisedHi}
        // React Native Web draws its own "on" colours unless told (the iPhone uses trackColor).
        {...({ activeThumbColor: COLOR.text.primary, activeTrackColor: COLOR.action.primary } as object)}
      />
    </View>
  );
}
