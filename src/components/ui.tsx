import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type TextProps, type TextStyle, type ViewStyle } from 'react-native';
import { CLASS_COLOURS } from '../lib/classes';
import type { ClassLetter } from '../lib/types';
import { C, F } from '../theme';

type TxtVariant = 'h1' | 'h2' | 'h3' | 'body' | 'muted' | 'label' | 'eyebrow' | 'mono';

export function Txt({
  v = 'body',
  style,
  children,
  numberOfLines,
  ...rest
}: {
  v?: TxtVariant;
  style?: StyleProp<TextStyle>;
  children: ReactNode;
  numberOfLines?: number;
} & Pick<TextProps, 'accessibilityLiveRegion' | 'accessibilityRole' | 'accessibilityLabel' | 'selectable'>) {
  return (
    <Text style={[t[v], style]} numberOfLines={numberOfLines} {...rest}>
      {children}
    </Text>
  );
}

const t = StyleSheet.create({
  h1: { fontFamily: F.displayItalic, fontSize: 28, color: C.chalk, textTransform: 'uppercase', lineHeight: 30 },
  h2: { fontFamily: F.display, fontSize: 20, color: C.chalk, textTransform: 'uppercase', lineHeight: 23 },
  h3: { fontFamily: F.displayMed, fontSize: 16, color: C.chalk, textTransform: 'uppercase' },
  body: { fontFamily: F.body, fontSize: 15, color: C.chalk, lineHeight: 21 },
  muted: { fontFamily: F.body, fontSize: 14, color: C.fog, lineHeight: 19 },
  label: { fontFamily: F.label, fontSize: 12, color: C.fog, letterSpacing: 1.4, textTransform: 'uppercase' },
  eyebrow: { fontFamily: F.labelBold, fontSize: 12, color: C.sodium, letterSpacing: 2, textTransform: 'uppercase' },
  mono: { fontFamily: F.label, fontSize: 13, color: C.fog, letterSpacing: 0.6, fontVariant: ['tabular-nums'] },
});

export function Chip({
  label,
  on,
  onPress,
  colour = C.sodium,
  strike,
}: {
  label: string;
  on?: boolean;
  onPress?: () => void;
  colour?: string;
  strike?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityState={{ selected: !!on }}
      hitSlop={4}
      style={({ pressed }) => [s.chip, on && { borderColor: colour, backgroundColor: `${colour}1f` }, pressed && { opacity: 0.7 }]}
    >
      <Text style={[s.chipText, on && { color: colour }, strike && { textDecorationLine: 'line-through' }]}>{label}</Text>
    </Pressable>
  );
}

export function Button({
  label,
  onPress,
  kind = 'primary',
  disabled,
  busy,
  style,
  accessibilityHint,
  accessibilityLabel,
}: {
  label: string;
  onPress: () => void;
  kind?: 'primary' | 'ghost' | 'danger' | 'neon';
  disabled?: boolean;
  /** Shows a spinner and blocks taps while something is in progress. */
  busy?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
  accessibilityLabel?: string;
}) {
  const off = disabled || busy;
  const bg = kind === 'primary' ? C.sodium : kind === 'neon' ? C.neon : 'transparent';
  const fg = kind === 'primary' ? C.ink : kind === 'neon' ? '#00222c' : kind === 'danger' ? C.alert : C.chalk;
  const border = kind === 'ghost' ? C.kerbHi : kind === 'danger' ? C.alert : bg;
  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!off, busy: !!busy }}
      style={({ pressed }) => [s.btn, { backgroundColor: bg, borderColor: border }, (pressed || off) && { opacity: disabled ? 0.4 : 0.8 }, style]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {busy ? <ActivityIndicator size="small" color={fg} /> : null}
        <Text style={[s.btnText, { color: fg }]}>{label}</Text>
      </View>
    </Pressable>
  );
}

export function Card({ children, style, accent }: { children: ReactNode; style?: StyleProp<ViewStyle>; accent?: string }) {
  return <View style={[s.card, accent ? { borderLeftWidth: 3, borderLeftColor: accent } : null, style]}>{children}</View>;
}

export function ClassBadge({ letter, size = 'md' }: { letter: ClassLetter; size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const dim = size === 'xl' ? 92 : size === 'lg' ? 52 : size === 'md' ? 32 : 22;
  const colour = CLASS_COLOURS[letter];
  return (
    <View style={[s.badge, { width: dim, height: dim, borderColor: colour }]} accessibilityLabel={`Class ${letter}`}>
      <Text style={{ fontFamily: F.displayItalic, color: colour, fontSize: dim * 0.55, lineHeight: dim * 0.7 }}>{letter}</Text>
    </View>
  );
}

export function StatBar({ label, value, colour = C.sodium }: { label: string; value: number; colour?: string }) {
  return (
    <View style={s.barRow}>
      <Text style={s.barLabel}>{label}</Text>
      <View style={s.barTrack}>
        <View style={[s.barFill, { width: `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%`, backgroundColor: colour }]} />
      </View>
    </View>
  );
}

/**
 * A titled block. Every screen uses this for its sections so headers share one
 * rhythm: eyebrow title, a hairline running to the edge, optional action.
 */
export function Section({ title, children, right, colour }: { title: string; children: ReactNode; right?: ReactNode; colour?: string }) {
  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }} accessibilityRole="header">
        <Txt v="eyebrow" style={colour ? { color: colour } : undefined}>{title}</Txt>
        <View style={[s.rule, colour ? { backgroundColor: `${colour}40` } : null]} />
        {right}
      </View>
      {children}
    </View>
  );
}

/** A big number with a small label under it: the HUD readout used on events and builds. */
export function Stat({ value, label, colour, style }: { value: string; label: string; colour?: string; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[s.stat, style]} accessibilityLabel={`${label} ${value}`}>
      <Text style={[s.statValue, colour ? { color: colour } : null]} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
      <Text style={s.statLabel} numberOfLines={1}>{label}</Text>
    </View>
  );
}

export function Row({ children, style, gap = 8 }: { children: ReactNode; style?: StyleProp<ViewStyle>; gap?: number }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap, flexWrap: 'wrap' }, style]}>{children}</View>;
}

export const s = StyleSheet.create({
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 4, borderWidth: 1, borderColor: C.kerbHi },
  chipText: { fontFamily: F.label, fontSize: 13, letterSpacing: 1, textTransform: 'uppercase', color: C.fog },
  btn: { paddingVertical: 13, paddingHorizontal: 16, borderRadius: 6, borderWidth: 1, alignItems: 'center' },
  btnText: { fontFamily: F.labelBold, fontSize: 15, letterSpacing: 2, textTransform: 'uppercase' },
  card: { backgroundColor: C.tarmac, borderColor: C.kerb, borderWidth: 1, borderRadius: 8, padding: 14, gap: 8 },
  badge: { borderWidth: 2, borderRadius: 4, alignItems: 'center', justifyContent: 'center', transform: [{ skewX: '-8deg' }], backgroundColor: C.asphalt },
  rule: { flex: 1, height: 1, backgroundColor: C.kerb },
  stat: { flex: 1, backgroundColor: C.tarmac, borderColor: C.kerb, borderWidth: 1, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 9, gap: 1 },
  statValue: { fontFamily: F.display, fontSize: 20, color: C.chalk, fontVariant: ['tabular-nums'] },
  statLabel: { fontFamily: F.label, fontSize: 10, letterSpacing: 1.2, color: C.fog, textTransform: 'uppercase' },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  barLabel: { width: 74, fontFamily: F.label, fontSize: 12, letterSpacing: 1.2, color: C.fog, textTransform: 'uppercase' },
  barTrack: { flex: 1, height: 7, backgroundColor: C.kerb, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  input: {
    backgroundColor: C.tarmac, borderColor: C.kerb, borderWidth: 1, borderRadius: 6, paddingHorizontal: 12, paddingVertical: 11,
    color: C.chalk, fontFamily: F.body, fontSize: 16,
  },
});
