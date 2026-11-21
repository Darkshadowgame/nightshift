import { Children, createContext, useContext, type ReactNode } from 'react';
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

const MediaContext = createContext(false);

/** True inside `<OnMedia>`: the thing is drawn on a photo, so it uses the fixed `COLOR.media` colours. */
export const useOnMedia = () => useContext(MediaContext);

/**
 * Wrap anything drawn on a photo or a dark pill over a photo: DsText inside takes the fixed light
 * text colours, so a title on a photo reads the same in light and dark mode.
 */
export function OnMedia({ children }: { children: ReactNode }) {
  return <MediaContext.Provider value>{children}</MediaContext.Provider>;
}

function toneColour(t: TextTone, onMedia: boolean): string {
  switch (t) {
    case 'primary': return onMedia ? COLOR.media.text : COLOR.text.primary;
    case 'secondary': return onMedia ? COLOR.media.muted : COLOR.text.secondary;
    case 'info': return COLOR.text.info;
    case 'action': return onMedia ? COLOR.media.text : COLOR.action.link;
    case 'brand': return onMedia ? COLOR.action.primary : COLOR.text.brand;
    case 'danger': return COLOR.state.danger;
    case 'success': return COLOR.state.success;
    case 'warning': return COLOR.state.warning;
    case 'onAction': return COLOR.action.onPrimary;
  }
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
  const onMedia = useContext(MediaContext);
  const quiet = v === 'secondary' || v === 'caption' || v === 'meta' || v === 'label' || v === 'eyebrow';
  const colour = tone ? toneColour(tone, onMedia) : onMedia ? (quiet ? COLOR.media.muted : COLOR.media.text) : undefined;
  return (
    <Text style={[typeStyle(v, colour), style]} numberOfLines={numberOfLines} maxFontSizeMultiplier={maxFontSizeMultiplier ?? maxScale(v)} {...rest}>
      {/* A meta line never wraps with a "·" at a line end (logic.ts keepTogether). */}
      {typeof children === 'string' ? keepTogether(children) : Array.isArray(children) ? Children.map(children, (c) => (typeof c === 'string' ? keepTogether(c) : c)) : children}
    </Text>
  );
}
