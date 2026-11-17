import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Switch, Text, View, type StyleProp, type TextProps, type TextStyle, type ViewStyle } from 'react-native';
import { CLASS_COLOURS } from '../lib/classes';
import { confirmLabels, SAMPLE, type Tone } from '../lib/glossary';
import type { ClassLetter } from '../lib/types';
import { BRAND, C, F, FONT_SCALE, RADIUS, STATE, SURFACE, TYPE } from '../theme';
import { Pin, type Glyph } from './Pin';

/**
 * The type scale. `caption` is for hints and footnotes, `micro` (11, condensed
 * capitals) for credits and tiny tags only. Body text scales with the iOS text
 * size; pass `scale="chrome"` on dense chrome (pills, HUD, tags) to cap it.
 */
export type TxtVariant = 'h1' | 'h2' | 'h3' | 'body' | 'muted' | 'caption' | 'label' | 'micro' | 'eyebrow' | 'mono';

export function Txt({
  v = 'body',
  style,
  children,
  numberOfLines,
  scale,
  ...rest
}: {
  v?: TxtVariant;
  style?: StyleProp<TextStyle>;
  children: ReactNode;
  numberOfLines?: number;
  /** Cap larger text on dense chrome ('chrome', about 1.3x) or in the driving view ('drive', 1.2x). */
  scale?: keyof typeof FONT_SCALE;
} & Pick<TextProps, 'accessibilityLiveRegion' | 'accessibilityRole' | 'accessibilityLabel' | 'selectable' | 'maxFontSizeMultiplier' | 'adjustsFontSizeToFit' | 'importantForAccessibility'>) {
  return (
    <Text style={[t[v], style]} numberOfLines={numberOfLines} maxFontSizeMultiplier={scale ? FONT_SCALE[scale] : undefined} {...rest}>
      {children}
    </Text>
  );
}

const t = StyleSheet.create({
  h1: { fontFamily: F.displayItalic, fontSize: TYPE.display, color: C.chalk, textTransform: 'uppercase', lineHeight: 31 },
  h2: { fontFamily: F.display, fontSize: TYPE.title, color: C.chalk, textTransform: 'uppercase', lineHeight: 24 },
  h3: { fontFamily: F.displayMed, fontSize: TYPE.heading, color: C.chalk, textTransform: 'uppercase', lineHeight: 20 },
  body: { fontFamily: F.body, fontSize: TYPE.body, color: C.chalk, lineHeight: 21 },
  muted: { fontFamily: F.body, fontSize: TYPE.muted, color: C.fog, lineHeight: 19 },
  caption: { fontFamily: F.body, fontSize: TYPE.caption, color: C.fog, lineHeight: 17 },
  label: { fontFamily: F.label, fontSize: TYPE.label, color: C.fog, letterSpacing: 1.4, textTransform: 'uppercase', lineHeight: 16 },
  micro: { fontFamily: F.label, fontSize: TYPE.micro, color: C.fog, letterSpacing: 0.8, textTransform: 'uppercase', lineHeight: 14 },
  eyebrow: { fontFamily: F.labelBold, fontSize: TYPE.label, color: BRAND, letterSpacing: 2, textTransform: 'uppercase', lineHeight: 16 },
  mono: { fontFamily: F.label, fontSize: TYPE.mono, color: C.fog, letterSpacing: 0.6, fontVariant: ['tabular-nums'], lineHeight: 17 },
});

/** The colour for a state tone (Tag, role labels). */
export function toneColour(tone: Tone): string {
  switch (tone) {
    case 'brand':
      return BRAND;
    case 'success':
      return STATE.success;
    case 'warning':
      return STATE.warning;
    case 'info':
      return STATE.info;
    case 'danger':
      return STATE.danger;
    case 'live':
      return STATE.live;
    default:
      return C.fog;
  }
}

/**
 * A filter chip (multi-select). One "on" colour for every chip unless a layer
 * needs its own. `raw` keeps the text as written (handles are never uppercased).
 */
export function Chip({
  label,
  on,
  onPress,
  colour = STATE.selected,
  strike,
  raw,
  accessibilityLabel,
}: {
  label: string;
  on?: boolean;
  onPress?: () => void;
  colour?: string;
  strike?: boolean;
  raw?: boolean;
  accessibilityLabel?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityState={{ selected: !!on }}
      accessibilityLabel={accessibilityLabel}
      hitSlop={{ top: 6, bottom: 6, left: 2, right: 2 }}
      style={({ pressed }) => [s.chip, on && { borderColor: colour, backgroundColor: `${colour}1f` }, pressed && { opacity: 0.8 }]}
    >
      <Text
        maxFontSizeMultiplier={FONT_SCALE.chrome}
        style={[s.chipText, raw && { textTransform: 'none', letterSpacing: 0.3 }, on && { color: colour }, strike && { textDecorationLine: 'line-through' }]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/** Tabs inside a screen (Mine / Invited / Public / Past): one selected at a time, unlike filter chips. */
export function Segmented<K extends string>({
  options,
  value,
  onChange,
}: {
  options: { key: K; label: string }[];
  value: K;
  onChange: (key: K) => void;
}) {
  return (
    <View style={s.seg} accessibilityRole="tablist">
      {options.map((o) => {
        const on = o.key === value;
        return (
          <Pressable
            key={o.key}
            onPress={() => onChange(o.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            style={({ pressed }) => [s.segItem, on && s.segOn, pressed && { opacity: 0.8 }]}
          >
            <Text maxFontSizeMultiplier={FONT_SCALE.chrome} numberOfLines={1} style={[s.segText, on && { color: C.ink }]}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export type ButtonKind = 'primary' | 'secondary' | 'ghost' | 'danger';

/**
 * Buttons. **primary** (sodium) is the one thing the screen is for: at most one
 * visible at a time. **secondary** (outline; `ghost` is the same) is everything
 * else. **danger** (red outline) only destroys or cancels something.
 */
export function Button({
  label,
  onPress,
  kind = 'primary',
  size = 'md',
  disabled,
  busy,
  style,
  accessibilityHint,
  accessibilityLabel,
}: {
  label: string;
  onPress: () => void;
  kind?: ButtonKind;
  /** `lg` for the driving view, `sm` for buttons inside a row or card. */
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  /** Shows a spinner and blocks taps while something is in progress. */
  busy?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
  accessibilityLabel?: string;
}) {
  const off = disabled || busy;
  const primary = kind === 'primary';
  // Disabled: a kerb fill with a fog label (5:1), not a faded colour.
  const bg = disabled ? C.kerb : primary ? BRAND : 'transparent';
  const fg = disabled ? C.fog : primary ? C.ink : kind === 'danger' ? STATE.danger : C.chalk;
  const border = disabled ? C.kerb : primary ? BRAND : kind === 'danger' ? STATE.danger : SURFACE.borderStrong;
  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!off, busy: !!busy }}
      style={({ pressed }) => [
        s.btn,
        size === 'lg' && s.btnLg,
        size === 'sm' && s.btnSm,
        { backgroundColor: bg, borderColor: border },
        pressed && !off && { opacity: 0.8 },
        style,
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {busy ? <ActivityIndicator size="small" color={fg} /> : null}
        <Text maxFontSizeMultiplier={FONT_SCALE.chrome} style={[s.btnText, size === 'lg' && { fontSize: 18 }, size === 'sm' && { fontSize: 13, letterSpacing: 1.4 }, { color: fg }]}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

/**
 * A card. `solid` on the page, `raised` inside another card, `glass` floating
 * over the map, `muted` for finished or cancelled things (a quieter palette,
 * never opacity, so the text keeps its contrast).
 */
export function Card({
  children,
  style,
  accent,
  variant = 'solid',
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  accent?: string;
  variant?: 'solid' | 'raised' | 'glass' | 'muted';
}) {
  return (
    <View
      style={[
        s.card,
        variant === 'raised' && { backgroundColor: C.kerb, borderColor: C.kerbHi },
        variant === 'glass' && { backgroundColor: SURFACE.glassRaised },
        variant === 'muted' && { backgroundColor: C.asphalt, borderStyle: 'dashed' },
        accent ? { borderLeftWidth: 3, borderLeftColor: variant === 'muted' ? C.kerbHi : accent } : null,
        style,
      ]}
    >
      {children}
    </View>
  );
}

/**
 * A small outlined tag: role, sample, level, tier, partner, legend. Give a
 * `tone` (state colours) or a `colour` (a layer's, for a place's own tag).
 */
export function Tag({ label, tone = 'muted', colour, raw, solid, accessibilityLabel }: { label: string; tone?: Tone; colour?: string; raw?: boolean; solid?: boolean; accessibilityLabel?: string }) {
  const c = colour ?? toneColour(tone);
  return (
    <View style={[s.tag, { borderColor: solid ? c : `${c}99` }, solid && { backgroundColor: c }]} accessibilityLabel={accessibilityLabel}>
      <Text maxFontSizeMultiplier={FONT_SCALE.chrome} style={[s.tagText, { color: solid ? C.asphalt : c }, raw && { textTransform: 'none', letterSpacing: 0.3 }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

/** Sample data in the demo: one style everywhere (fog outline). */
export function SampleTag({ label = SAMPLE }: { label?: string }) {
  return <Tag label={label} tone="muted" accessibilityLabel="Sample, for the demo" />;
}

/** Legend this week (rep): one style everywhere. */
export function LegendTag() {
  return <Tag label="★ Legend" tone="brand" accessibilityLabel="Legend this week" />;
}

/**
 * Confirm in place: a question with "{Verb} it" and "Keep it". Only a
 * destructive verb is red; joining or switching uses the primary style.
 */
export function ConfirmBox({
  message,
  verb,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  destructive = true,
  busy,
  error,
}: {
  message: string;
  /** "Cancel" gives "Cancel it / Keep it". */
  verb?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  destructive?: boolean;
  busy?: boolean;
  error?: string | null;
}) {
  const labels = confirmLabels(verb ?? 'Do');
  return (
    <Card accent={destructive ? STATE.danger : BRAND} style={{ gap: 10 }}>
      <Txt>{message}</Txt>
      <Row style={{ flexWrap: 'nowrap' }}>
        <Button
          label={confirmLabel ?? labels.confirm}
          kind={destructive ? 'danger' : 'primary'}
          size="sm"
          busy={busy}
          onPress={onConfirm}
          style={{ flex: 1 }}
        />
        <Button label={cancelLabel ?? labels.cancel} kind="secondary" size="sm" onPress={onCancel} style={{ flex: 1 }} />
      </Row>
      <InlineError message={error} />
    </Card>
  );
}

/** An error under the control that caused it. Alert red, read out politely. */
export function InlineError({ message, style }: { message?: string | null; style?: StyleProp<TextStyle> }) {
  if (!message) return null;
  return (
    <Txt v="caption" style={[{ color: STATE.danger }, style]} accessibilityLiveRegion="polite" accessibilityRole="alert">
      {message}
    </Txt>
  );
}

/** A neutral notice (not an error): e.g. "Location is off, searching from home". */
export function Notice({ children, onDismiss, action }: { children: ReactNode; onDismiss?: () => void; action?: { label: string; onPress: () => void } }) {
  return (
    <View style={s.notice} accessibilityLiveRegion="polite">
      <Txt v="muted" style={{ color: C.chalk }}>{children}</Txt>
      {action || onDismiss ? (
        <Row gap={18}>
          {action ? <LinkText label={action.label} onPress={action.onPress} /> : null}
          {onDismiss ? <LinkText label="OK" onPress={onDismiss} colour={C.fog} /> : null}
        </Row>
      ) : null}
    </View>
  );
}

/** Nothing here yet: a glyph, a title, one line and up to two actions (the first is the primary). */
export function EmptyState({
  glyph,
  colour = C.fog,
  title,
  body,
  action,
  secondary,
}: {
  glyph?: Glyph;
  colour?: string;
  title: string;
  body?: string;
  action?: { label: string; onPress: () => void };
  secondary?: { label: string; onPress: () => void };
}) {
  return (
    <Card style={{ alignItems: 'flex-start', gap: 10 }}>
      <Row gap={10} style={{ flexWrap: 'nowrap' }}>
        {glyph ? <Pin glyph={glyph} colour={colour} size={30} /> : null}
        <Txt v="h3" style={{ flexShrink: 1 }}>{title}</Txt>
      </Row>
      {body ? <Txt v="muted">{body}</Txt> : null}
      {action || secondary ? (
        <Row style={{ alignSelf: 'stretch', flexWrap: 'nowrap' }}>
          {action ? <Button label={action.label} onPress={action.onPress} size="sm" style={{ flex: 1 }} /> : null}
          {secondary ? <Button label={secondary.label} kind="secondary" size="sm" onPress={secondary.onPress} style={{ flex: 1 }} /> : null}
        </Row>
      ) : null}
    </Card>
  );
}

/** A screen for an id that isn't there (deleted, or an old link), with a way back. */
export function NotFound({ what, message }: { what: string; message?: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: C.asphalt, padding: 16 }}>
      <EmptyState
        title={`${what} not found`}
        body={message ?? `It may have been deleted, or the link is old.`}
        action={{ label: 'Go back', onPress: () => (router.canGoBack() ? router.back() : router.replace('/')) }}
      />
    </View>
  );
}

/** A setting: label, an optional hint under it, and a switch. */
export function ToggleRow({
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
  return (
    <View style={s.toggleRow}>
      <View style={{ flex: 1, gap: 2 }}>
        <Txt>{label}</Txt>
        {hint ? <Txt v="caption">{hint}</Txt> : null}
      </View>
      <Switch
        accessibilityLabel={label}
        value={value}
        disabled={disabled}
        onValueChange={onValueChange}
        trackColor={{ true: BRAND, false: C.kerbHi }}
        thumbColor={C.chalk}
        // React Native Web draws its own "on" colours unless told (the iPhone uses trackColor).
        {...({ activeThumbColor: C.chalk, activeTrackColor: BRAND } as object)}
      />
    </View>
  );
}

/** A row in a list: optional glyph, title, subtitle and a trailing value or chevron. */
export function ListRow({
  title,
  subtitle,
  glyph,
  colour,
  right,
  onPress,
  accessibilityLabel,
}: {
  title: string;
  subtitle?: string;
  glyph?: Glyph;
  colour?: string;
  right?: ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
}) {
  const body = (
    <>
      {glyph ? <Pin glyph={glyph} colour={colour ?? C.fog} size={28} /> : null}
      <View style={{ flex: 1, gap: 1 }}>
        <Txt numberOfLines={2}>{title}</Txt>
        {subtitle ? <Txt v="caption" numberOfLines={2}>{subtitle}</Txt> : null}
      </View>
      {right ?? (onPress ? <Txt v="label" style={{ color: BRAND }}>›</Txt> : null)}
    </>
  );
  if (!onPress) return <View style={s.listRow}>{body}</View>;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={accessibilityLabel} style={({ pressed }) => [s.listRow, pressed && { opacity: 0.8 }]}>
      {body}
    </Pressable>
  );
}

/** A text link: sodium, "Open ›" or "{Verb} ›", with a 44 pt tap area. */
export function LinkText({ label, onPress, colour = BRAND, accessibilityLabel }: { label: string; onPress: () => void; colour?: string; accessibilityLabel?: string }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="link" accessibilityLabel={accessibilityLabel} hitSlop={{ top: 12, bottom: 12, left: 6, right: 6 }} style={({ pressed }) => pressed && { opacity: 0.7 }}>
      <Txt v="label" scale="chrome" style={{ color: colour, fontSize: TYPE.muted }}>
        {label}
      </Txt>
    </Pressable>
  );
}

/** The one header action style: a sodium label (with an accessibility label when it's an icon). */
export function HeaderAction({ label, onPress, accessibilityLabel }: { label: string; onPress: () => void; accessibilityLabel?: string }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? label} hitSlop={12} style={({ pressed }) => [{ paddingHorizontal: 6, minHeight: 44, justifyContent: 'center' }, pressed && { opacity: 0.7 }]}>
      <Txt v="label" scale="chrome" style={{ color: BRAND, fontSize: TYPE.muted, fontFamily: F.labelBold }}>
        {label}
      </Txt>
    </Pressable>
  );
}

export function ClassBadge({ letter, size = 'md' }: { letter: ClassLetter; size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const dim = size === 'xl' ? 92 : size === 'lg' ? 52 : size === 'md' ? 32 : 22;
  const colour = CLASS_COLOURS[letter];
  return (
    <View style={[s.badge, { width: dim, height: dim, borderColor: colour }]} accessibilityLabel={`Class ${letter}`}>
      <Text allowFontScaling={false} style={{ fontFamily: F.displayItalic, color: colour, fontSize: dim * 0.55, lineHeight: dim * 0.7 }}>{letter}</Text>
    </View>
  );
}

export function StatBar({ label, value, colour = BRAND }: { label: string; value: number; colour?: string }) {
  return (
    <View style={s.barRow}>
      <Text maxFontSizeMultiplier={FONT_SCALE.chrome} style={s.barLabel}>{label}</Text>
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
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 24 }} accessibilityRole="header">
        <Txt v="eyebrow" scale="chrome" style={colour ? { color: colour } : undefined}>{title}</Txt>
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
      <Text style={[s.statValue, colour ? { color: colour } : null]} numberOfLines={1} adjustsFontSizeToFit maxFontSizeMultiplier={FONT_SCALE.chrome}>{value}</Text>
      <Text style={s.statLabel} numberOfLines={2} maxFontSizeMultiplier={FONT_SCALE.chrome}>{label}</Text>
    </View>
  );
}

export function Row({ children, style, gap = 8 }: { children: ReactNode; style?: StyleProp<ViewStyle>; gap?: number }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap, flexWrap: 'wrap' }, style]}>{children}</View>;
}

export const s = StyleSheet.create({
  chip: { paddingHorizontal: 12, paddingVertical: 8, minHeight: 34, justifyContent: 'center', borderRadius: RADIUS.tag, borderWidth: 1, borderColor: SURFACE.borderStrong },
  chipText: { fontFamily: F.label, fontSize: TYPE.caption, letterSpacing: 1, textTransform: 'uppercase', color: C.fog },
  seg: { flexDirection: 'row', backgroundColor: C.tarmac, borderColor: C.kerbHi, borderWidth: 1, borderRadius: RADIUS.card, padding: 3, gap: 3 },
  segItem: { flex: 1, minHeight: 38, alignItems: 'center', justifyContent: 'center', borderRadius: RADIUS.card - 2, paddingHorizontal: 6 },
  segOn: { backgroundColor: BRAND },
  segText: { fontFamily: F.labelBold, fontSize: TYPE.caption, letterSpacing: 1, textTransform: 'uppercase', color: C.chalk },
  btn: { paddingVertical: 13, paddingHorizontal: 16, minHeight: 48, justifyContent: 'center', borderRadius: RADIUS.card, borderWidth: 1, alignItems: 'center' },
  btnLg: { paddingVertical: 16, minHeight: 56 },
  btnSm: { paddingVertical: 9, paddingHorizontal: 12, minHeight: 44 },
  btnText: { fontFamily: F.labelBold, fontSize: TYPE.body, letterSpacing: 2, textTransform: 'uppercase', textAlign: 'center' },
  card: { backgroundColor: C.tarmac, borderColor: C.kerb, borderWidth: 1, borderRadius: RADIUS.card, padding: 14, gap: 8 },
  tag: { alignSelf: 'flex-start', borderWidth: 1, borderRadius: RADIUS.tag, paddingHorizontal: 6, paddingVertical: 2 },
  tagText: { fontFamily: F.labelBold, fontSize: TYPE.micro, letterSpacing: 1, textTransform: 'uppercase' },
  notice: { backgroundColor: SURFACE.glassRaised, borderColor: C.kerbHi, borderWidth: 1, borderRadius: RADIUS.card, padding: 12, gap: 8 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44 },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44, paddingVertical: 6 },
  badge: { borderWidth: 2, borderRadius: RADIUS.tag, alignItems: 'center', justifyContent: 'center', transform: [{ skewX: '-8deg' }], backgroundColor: C.asphalt },
  rule: { flex: 1, height: 1, backgroundColor: C.kerb },
  stat: { flex: 1, backgroundColor: C.tarmac, borderColor: C.kerb, borderWidth: 1, borderRadius: RADIUS.card, paddingHorizontal: 10, paddingVertical: 9, gap: 1 },
  statValue: { fontFamily: F.display, fontSize: TYPE.title, color: C.chalk, fontVariant: ['tabular-nums'] },
  statLabel: { fontFamily: F.label, fontSize: TYPE.micro, letterSpacing: 1.2, color: C.fog, textTransform: 'uppercase' },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  barLabel: { width: 74, fontFamily: F.label, fontSize: TYPE.label, letterSpacing: 1.2, color: C.fog, textTransform: 'uppercase' },
  barTrack: { flex: 1, height: 7, backgroundColor: C.kerb, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  input: {
    backgroundColor: C.tarmac, borderColor: SURFACE.borderStrong, borderWidth: 1, borderRadius: RADIUS.card, paddingHorizontal: 12, paddingVertical: 11,
    color: C.chalk, fontFamily: F.body, fontSize: 16,
  },
});
