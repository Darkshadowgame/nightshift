import { ActivityIndicator, View, type StyleProp, type ViewStyle } from 'react-native';
import { COLOR, ELEVATION, HIT, RADII, SPACING } from '../../theme';
import { Icon, type IconName } from './Icon';
import { Press, type Haptic } from './Press';
import { DsText } from './Text';

export type ButtonTier = 'primary' | 'secondary' | 'tertiary' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

const HEIGHT: Record<ButtonSize, number> = { sm: HIT, md: 48, lg: 56 };

/**
 * Four tiers, three sizes.
 * - **primary**: sodium fill. The one thing this screen (or region) is for. At most one visible.
 * - **secondary**: outline. Everything else that deserves a button.
 * - **tertiary**: text only, sodium. "See all", "Open", inline actions. Replaces LinkText in actions.
 * - **destructive**: red outline. Only destroys, removes or leaves. Buzzes `warning`.
 * Disabled keeps the tier's shape (dimmed outline, fog label) and shows `hint` saying why.
 * Busy keeps the label and adds a spinner.
 */
export function Button({
  label,
  onPress,
  tier = 'primary',
  size = 'md',
  icon,
  disabled,
  busy,
  hint,
  haptic,
  block,
  style,
  accessibilityLabel,
  accessibilityHint,
}: {
  label: string;
  onPress: () => void;
  tier?: ButtonTier;
  size?: ButtonSize;
  icon?: IconName;
  disabled?: boolean;
  busy?: boolean;
  /** Shown under a disabled button: why it can't be pressed yet ("Write something first"). */
  hint?: string;
  /** Defaults: destructive → warning, others none. Pass `success` on save/send. */
  haptic?: Haptic;
  /** Full width. */
  block?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}) {
  const off = !!disabled || !!busy;
  const fg =
    disabled
      ? COLOR.text.disabled
      : tier === 'primary'
        ? COLOR.action.onPrimary
        : tier === 'destructive'
          ? COLOR.action.destructive
          : tier === 'tertiary'
            ? COLOR.action.link
            : COLOR.text.primary;
  const box: ViewStyle =
    tier === 'tertiary'
      ? { backgroundColor: 'transparent', borderColor: 'transparent', paddingHorizontal: SPACING.xs }
      : tier === 'primary'
        ? disabled
          ? { backgroundColor: 'transparent', borderColor: COLOR.action.disabledBorder }
          : { backgroundColor: COLOR.action.primary, borderColor: COLOR.action.primary }
        : tier === 'destructive'
          ? { backgroundColor: 'transparent', borderColor: disabled ? COLOR.surface.raisedHi : COLOR.action.destructive }
          : { backgroundColor: 'transparent', borderColor: disabled ? COLOR.surface.raisedHi : COLOR.surface.borderStrong };
  const text = size === 'lg' ? 'buttonLg' : size === 'sm' ? 'buttonSm' : 'button';
  const showHint = !!hint && !!disabled;
  return (
    <View style={[block ? { alignSelf: 'stretch' } : { alignItems: 'flex-start' }, style]}>
      <Press
        onPress={onPress}
        disabled={off}
        haptic={haptic ?? (tier === 'destructive' ? 'warning' : 'none')}
        label={accessibilityLabel ?? label}
        hint={showHint ? hint : accessibilityHint}
        state={{ busy: !!busy }}
        testID={tier === 'primary' ? 'primary-button' : undefined}
        hitSlop={size === 'sm' || tier === 'tertiary' ? { top: 4, bottom: 4 } : undefined}
        style={[
          {
            minHeight: HEIGHT[size],
            borderRadius: RADII.control,
            borderWidth: 1,
            paddingHorizontal: size === 'sm' ? SPACING.md : SPACING.lg,
            paddingVertical: SPACING.sm,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: SPACING.sm,
          },
          box,
        ]}
      >
        {busy ? <ActivityIndicator size="small" color={fg} /> : icon ? <Icon name={icon} size={size === 'sm' ? 16 : 18} colour={fg} /> : null}
        <DsText v={text} style={{ color: fg, textAlign: 'center' }}>
          {label}
        </DsText>
      </Press>
      {showHint ? (
        <DsText v="caption" style={{ marginTop: SPACING.xs, textAlign: block ? 'center' : 'left' }}>
          {hint}
        </DsText>
      ) : null}
    </View>
  );
}

/** A round icon-only button: header icons (no fill) and map chrome (`glass`, floats). Always has a label. */
export function IconButton({
  icon,
  label,
  onPress,
  variant = 'plain',
  colour,
  haptic,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  variant?: 'plain' | 'glass';
  colour?: string;
  haptic?: Haptic;
}) {
  return (
    <Press
      onPress={onPress}
      label={label}
      haptic={haptic ?? (variant === 'glass' ? 'tap' : 'none')}
      style={[
        { width: HIT, height: HIT, alignItems: 'center', justifyContent: 'center', borderRadius: RADII.control },
        variant === 'glass' && [{ backgroundColor: COLOR.surface.glass, borderWidth: 1, borderColor: COLOR.surface.border }, ELEVATION.float],
      ]}
    >
      <Icon name={icon} size={22} colour={colour ?? COLOR.text.primary} />
    </Press>
  );
}
