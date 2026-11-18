import type { ReactNode } from 'react';
import { Text, type StyleProp, type TextProps, type TextStyle } from 'react-native';
import { COLOR, FONT_SCALE, TYPE_SCALE, type TypeToken } from '../../theme';

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
    color: colour ?? (token === 'secondary' || token === 'caption' || token === 'meta' || token === 'label' ? COLOR.text.secondary : COLOR.text.primary),
  };
}

/** The larger-text cap for a token: body text scales fully, chrome caps at FONT_SCALE.chrome, the driving view at FONT_SCALE.drive. */
export function maxScale(token: TypeToken): number | undefined {
  const scale = TYPE_SCALE[token].scale;
  return scale === 'chrome' ? FONT_SCALE.chrome : scale === 'drive' ? FONT_SCALE.drive : undefined;
}

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
  ...rest
}: {
  v?: TypeToken;
  tone?: 'primary' | 'secondary' | 'info' | 'action' | 'danger' | 'success' | 'warning' | 'onAction';
  children: ReactNode;
  /** Layout only (margins, flex, alignment). */
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
} & Pick<TextProps, 'accessibilityRole' | 'accessibilityLabel' | 'accessibilityLiveRegion' | 'selectable' | 'aria-hidden' | 'nativeID' | 'adjustsFontSizeToFit' | 'allowFontScaling'>) {
  const colour =
    tone === 'primary'
      ? COLOR.text.primary
      : tone === 'secondary'
        ? COLOR.text.secondary
        : tone === 'info'
          ? COLOR.text.info
          : tone === 'action'
            ? COLOR.action.link
            : tone === 'danger'
              ? COLOR.state.danger
              : tone === 'success'
                ? COLOR.state.success
                : tone === 'warning'
                  ? COLOR.state.warning
                  : tone === 'onAction'
                    ? COLOR.action.onPrimary
                    : undefined;
  return (
    <Text style={[typeStyle(v, colour), style]} numberOfLines={numberOfLines} maxFontSizeMultiplier={maxScale(v)} {...rest}>
      {children}
    </Text>
  );
}
