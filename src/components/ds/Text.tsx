import { Children, type ReactNode } from 'react';
import { Text, type StyleProp, type TextProps, type TextStyle } from 'react-native';
import { COLOR, FONT_SCALE, TYPE_SCALE, type TypeToken } from '../../theme';
import { keepTogether } from './logic';

/** The style object for a type token: family, size, line height, case and tabular figures. */
export function typeStyle(token: TypeToken, colour?: string): TextStyle {
  const t = TYPE_SCALE[token] as (typeof TYPE_SCALE)[TypeToken] & { letterSpacing?: number; caps?: boolean; tabular?: boolean };
  return {
    fontFamily: t.fontFamily,
    fontSize: t.fontSize,
    lineHeight: t.fontSize > 0 ? t.lineHeight : undefined,
    letterSpacing: t.letterSpacing,
    textTransform: t.caps ? 'uppercase' : 'none',
    fontVariant: t.tabular ? ['tabular-nums'] : undefined,
    // Eyebrows are fog by default (Redesign 2, 5.4): sodium is for the primary and "selected" only.
    color: colour ?? (token === 'secondary' || token === 'caption' || token === 'meta' || token === 'label' || token === 'eyebrow' ? COLOR.text.secondary : COLOR.text.primary),
  };
}

/** The larger-text cap for a token: body text scales fully, chrome caps at FONT_SCALE.chrome, the driving view at FONT_SCALE.drive. */
export function maxScale(token: TypeToken): number | undefined {
  const scale = TYPE_SCALE[token].scale;
  return scale === 'chrome' ? FONT_SCALE.chrome : scale === 'drive' ? FONT_SCALE.drive : undefined;
}

export type TextTone = 'primary' | 'secondary' | 'info' | 'action' | 'brand' | 'danger' | 'success' | 'warning' | 'onAction';

const TONE: Record<TextTone, string> = {
  primary: COLOR.text.primary,
  secondary: COLOR.text.secondary,
  info: COLOR.text.info,
  action: COLOR.action.link,
  brand: COLOR.action.primary,
  danger: COLOR.state.danger,
  success: COLOR.state.success,
  warning: COLOR.state.warning,
  onAction: COLOR.action.onPrimary,
};

/**
 * Text on the v2 scale. Pick a `v` (token) and, only when the role needs it, a `tone`.
 * There is no free `color`/`fontSize`: if a screen needs a new style, it's a new token.
 */
export function DsText({
  v = 'body',
  tone,
  children,
  style,
  numberOfLines,
  maxFontSizeMultiplier,
  ...rest
}: {
  v?: TypeToken;
  /**
   * `action` is the link colour (chalk since Redesign 2). `brand` is sodium: the wordmark and a
   * selected state only, never information.
   */
  tone?: TextTone;
  children: ReactNode;
  /** Layout only (margins, flex, alignment). */
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
  /** Overrides the token's larger-text cap (segment labels cap at 1.15, like iOS). */
  maxFontSizeMultiplier?: number;
} & Pick<TextProps, 'accessibilityRole' | 'accessibilityLabel' | 'accessibilityLiveRegion' | 'selectable' | 'aria-hidden' | 'nativeID' | 'adjustsFontSizeToFit' | 'minimumFontScale' | 'allowFontScaling'>) {
  const colour = tone ? TONE[tone] : undefined;
  return (
    <Text style={[typeStyle(v, colour), style]} numberOfLines={numberOfLines} maxFontSizeMultiplier={maxFontSizeMultiplier ?? maxScale(v)} {...rest}>
      {/* A meta line never wraps with a "·" at a line end (logic.ts keepTogether). */}
      {typeof children === 'string' ? keepTogether(children) : Array.isArray(children) ? Children.map(children, (c) => (typeof c === 'string' ? keepTogether(c) : c)) : children}
    </Text>
  );
}
