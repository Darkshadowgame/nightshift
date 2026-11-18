import type { ReactNode } from 'react';
import { Pressable, type AccessibilityRole, type LayoutChangeEvent, type AccessibilityState, type Insets, type StyleProp, type ViewStyle } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { feel } from '../../lib/feel';
import { PRESS } from '../../theme';

/**
 * Haptics by rule (DESIGN-SYSTEM.md): `select` on toggles, chips, segments and likes;
 * `success` on saved, sent, checked in; `warning` on destructive confirms; `tap` on map
 * chrome only. Components pick the default so screens never call `feel` directly.
 */
export type Haptic = 'none' | 'tap' | 'select' | 'success' | 'warning';

export function buzz(h: Haptic) {
  if (h !== 'none') feel[h]();
}

/**
 * The one pressable. `feedback="control"` dims (buttons, chips, rows); `"card"` dims and
 * shrinks a touch (cards), but never moves with reduced motion. Every tappable thing in the
 * design system goes through this, so press states and haptics are the same everywhere.
 */
export function Press({
  onPress,
  onLongPress,
  haptic = 'none',
  feedback = 'control',
  disabled,
  role = 'button',
  state,
  label,
  hint,
  hitSlop,
  style,
  pressedStyle,
  children,
  testID,
  onLayout,
}: {
  onPress?: () => void;
  onLongPress?: () => void;
  haptic?: Haptic;
  feedback?: 'control' | 'card' | 'none';
  disabled?: boolean;
  role?: AccessibilityRole;
  state?: AccessibilityState;
  label?: string;
  hint?: string;
  hitSlop?: number | Insets;
  style?: StyleProp<ViewStyle>;
  /** Extra style while pressed (e.g. a background change), on top of the standard feedback. */
  pressedStyle?: StyleProp<ViewStyle>;
  children: ReactNode;
  testID?: string;
  onLayout?: (e: LayoutChangeEvent) => void;
}) {
  const reduced = useReducedMotion();
  return (
    <Pressable
      onPress={
        onPress
          ? () => {
              buzz(haptic);
              onPress();
            }
          : undefined
      }
      onLongPress={onLongPress}
      disabled={disabled}
      accessibilityRole={role}
      accessibilityState={{ disabled: !!disabled, ...state }}
      accessibilityLabel={label}
      accessibilityHint={hint}
      hitSlop={hitSlop}
      testID={testID}
      onLayout={onLayout}
      style={({ pressed }) => [
        style,
        pressed && !disabled && feedback === 'control' && { opacity: PRESS.control.opacity },
        pressed && !disabled && feedback === 'card' && { opacity: PRESS.card.opacity, transform: reduced ? undefined : [{ scale: PRESS.card.scale }] },
        pressed && !disabled && pressedStyle,
      ]}
    >
      {children}
    </Pressable>
  );
}
