import { useState, type ReactNode } from 'react';
import { Platform, View } from 'react-native';
import { COLOR, RADII, SPACING } from '../../theme';
import { NoticeBell } from '../NoticeBell';
import { IconButton } from './Button';
import type { IconName } from './Icon';
import { statA11yLabel } from './logic';
import { Press } from './Press';
import { DsText } from './Text';

/**
 * A titled block. Eyebrow title in fog (never sodium: Redesign 2, 5.4), a hairline to the edge,
 * and at most one thing on the right: a tertiary Button or a Tag (never a value). No colour prop:
 * sections aren't layers.
 */
export function Section({ title, right, children, gap = 'md' }: { title: string; right?: ReactNode; children: ReactNode; gap?: 'sm' | 'md' }) {
  return (
    <View style={{ gap: SPACING[gap] }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.md, minHeight: 24 }}>
        <DsText v="eyebrow" accessibilityRole="header">
          {title}
        </DsText>
        <View style={{ flex: 1, height: 1, backgroundColor: COLOR.surface.border }} />
        {right}
      </View>
      {children}
    </View>
  );
}

export type HeaderAction = { label: string; onPress: () => void; accessibilityLabel?: string };

/** The tab header's "+" (Tonight, Community, Garage only): what it makes, said in the label. */
export type HeaderAdd = { onPress: () => void; label: string; /** A glyph that says what it makes (the Garage's car with a plus); "+" by default. */ icon?: IconName };

/** One text action in a pushed screen's header ("Share"): chalk, 44 pt tall. */
export function HeaderTextAction({ label, onPress, accessibilityLabel }: HeaderAction) {
  return (
    <Press onPress={onPress} label={accessibilityLabel ?? label} hitSlop={8} style={{ minHeight: 44, paddingHorizontal: SPACING.sm, justifyContent: 'center' }}>
      <DsText v="buttonSm" tone="action">
        {label}
      </DsText>
    </Press>
  );
}

/**
 * A text action written "+ New" or "+ Host" is the old tab-header create button: it draws as the
 * "+" icon instead (Redesign 2, 4.1: never a text action in a tab header). Kept so screens that
 * still pass `action: { label: '+ New' }` follow the rule until they pass `add`.
 */
export function plusShim(action: HeaderAction | undefined): { action?: HeaderAction; add?: HeaderAdd } {
  if (action && /^\+\s/.test(action.label)) return { add: { onPress: action.onPress, label: action.accessibilityLabel ?? action.label.replace(/^\+\s*/, '') } };
  return { action };
}

/**
 * The right side of every header, always in this order (Redesign 2, 4.1):
 * - a tab: `add` ("+", only on Tonight, Community and Garage), then the `bell`;
 * - a pushed screen: at most one text `action` (Share), then the `···` menu (`onMenu`).
 * Nothing else goes up there.
 */
export function HeaderActions({ action: given, add: addGiven, bell, onMenu }: { action?: HeaderAction; add?: HeaderAdd; bell?: boolean; onMenu?: () => void }) {
  const shim = plusShim(given);
  const action = shim.action;
  const add = addGiven ?? shim.add;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs }}>
      {action ? <HeaderTextAction {...action} /> : null}
      {add ? <IconButton icon={add.icon ?? 'plus'} label={add.label} onPress={add.onPress} /> : null}
      {bell ? <NoticeBell /> : null}
      {onMenu ? <IconButton icon="more" label="More options" onPress={onMenu} /> : null}
    </View>
  );
}

type HeaderProps = { title?: string; action?: HeaderAction; add?: HeaderAdd; bell?: boolean; onMenu?: () => void };

/**
 * Native-stack header options for a screen: `<Stack.Screen options={screenHeader({...})} />`.
 * - Tab (T1/T2): `{ title, add?, bell: true }`.
 * - Detail (T3): no title (the Hero carries it), optional `action` (Share) and `onMenu`.
 * - Form or settings (T4/T5): `{ title }` in caps.
 */
export function screenHeader({ title, action, add, bell, onMenu }: HeaderProps) {
  return {
    title: title ? title.toUpperCase() : '',
    headerRight: action || add || bell || onMenu ? () => <HeaderActions action={action} add={add} bell={bell} onMenu={onMenu} /> : undefined,
  };
}

/**
 * The navigator's own header row height (React Navigation's default: 44 on iPhone, 64 elsewhere,
 * the web included), so Tonight's in-page header puts its title, "+" and bell exactly where every
 * other tab's are and the header never jumps when you switch tab (Review 15 problem 14).
 */
export const HEADER_ROW = Platform.OS === 'ios' ? 44 : 64;

/**
 * An in-page header, for screens without a native header (the Tonight map, the gallery's preview).
 * Same anatomy as `screenHeader`: caps title, an optional `tag` after it (DEMO NIGHT), then the actions.
 */
export function ScreenHeader({ title, tag, action, add, bell, onMenu }: { title: string; tag?: ReactNode } & Omit<HeaderProps, 'title'>) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', minHeight: HEADER_ROW, gap: SPACING.sm }}>
      <DsText v="heading" accessibilityRole="header" numberOfLines={1} style={{ flexShrink: 1 }}>
        {title}
      </DsText>
      {tag}
      <View style={{ flex: 1 }} />
      <HeaderActions action={action} add={add} bell={bell} onMenu={onMenu} />
    </View>
  );
}

/**
 * The one step indicator for a multi-step form (onboarding, the host flow): the form's name is the
 * caps header title (4.1), and the body opens with this: "Step 1 of 4" small, the step's question
 * big, an optional line under it. Never "STEP 1 OF 2" as the header title.
 *
 *   <StepHeading step={1} of={4} title="What and when" />
 */
export function StepHeading({ step, of, title, hint }: { step: number; of: number; title: string; hint?: string }) {
  return (
    <View style={{ gap: SPACING.xxs }} accessible accessibilityRole="header" accessibilityLabel={`Step ${step} of ${of}: ${title}`}>
      <DsText v="meta">{`Step ${step} of ${of}`}</DsText>
      <DsText v="titleLg">{title}</DsText>
      {hint ? <DsText v="secondary">{hint}</DsText> : null}
    </View>
  );
}

export type Stat = { value: string; unit?: string; label: string; tone?: 'live' };

/**
 * 2–4 numbers in a row, one height. Fixed sets (Redesign 2): build = bhp, Class, Mods; person (Me) =
 * Meets, Hosted, Trophies. Replaces inline caps stat lines.
 * No sodium numbers: a stat isn't something to tap. `live` (white) for a running countdown.
 */
export function StatBlock({ stats }: { stats: Stat[] }) {
  // Large text (REVIEW-7 problem 7): each tile is at least as wide as its value and its longest
  // label word, measured off-screen, so nothing is cut off ("2h 40…") or broken mid-word
  // ("CHECKPOINT/S"). When they don't fit in one row, tiles wrap onto a second.
  const shown = stats.slice(0, 4);
  const [need, setNeed] = useState<Record<string, number>>({});
  const measure = (key: string) => (e: { nativeEvent: { layout: { width: number } } }) => {
    const w = Math.ceil(e.nativeEvent.layout.width);
    setNeed((n) => (Math.abs((n[key] ?? 0) - w) > 1 ? { ...n, [key]: w } : n));
  };
  // Padding and border, plus a little slack for sub-pixel text widths.
  const pad = SPACING.md * 2 + 2 + SPACING.xs;
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm }}>
      <View pointerEvents="none" aria-hidden style={{ position: 'absolute', left: 0, top: 0, opacity: 0 }}>
        {shown.map((s) => (
          <View key={s.label} style={{ alignItems: 'flex-start' }}>
            <View onLayout={measure(`v:${s.label}`)} style={{ flexDirection: 'row', alignItems: 'baseline', gap: SPACING.xs, alignSelf: 'flex-start' }}>
              <DsText v="stat">{s.value}</DsText>
              {s.unit ? <DsText v="meta">{s.unit}</DsText> : null}
            </View>
            <View onLayout={measure(`l:${s.label}`)} style={{ alignSelf: 'flex-start' }}>
              <DsText v="label">{[...s.label.split(/\s+/)].sort((a, b) => b.length - a.length)[0]}</DsText>
            </View>
          </View>
        ))}
      </View>
      {shown.map((s) => (
        <View
          key={s.label}
          accessible
          accessibilityLabel={statA11yLabel(s)}
          style={{
            flexGrow: 1,
            flexBasis: 0,
            minWidth: Math.max(need[`v:${s.label}`] ?? 0, need[`l:${s.label}`] ?? 0) + pad,
            backgroundColor: COLOR.surface.card,
            borderColor: COLOR.surface.border,
            borderWidth: 1,
            borderRadius: RADII.card,
            paddingHorizontal: SPACING.md,
            paddingVertical: SPACING.sm,
            gap: SPACING.xxs,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: SPACING.xs }}>
            <DsText v="stat" style={{ color: s.tone === 'live' ? COLOR.state.live : COLOR.text.primary, flexShrink: 1 }}>
              {s.value}
            </DsText>
            {s.unit ? <DsText v="meta">{s.unit}</DsText> : null}
          </View>
          <DsText v="label">{s.label}</DsText>
        </View>
      ))}
    </View>
  );
}
