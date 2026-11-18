import { router } from 'expo-router';
import { useEffect, type ReactNode } from 'react';
import { TextInput, View, type StyleProp, type TextInputProps, type TextStyle, type ViewStyle } from 'react-native';
import { COLOR, RADII, SPACING, tint, line } from '../theme';
import { buzz, DsText, EmptyState, Icon, Tag, typeStyle, type IconName, type TagTone } from './ds';
import { CheckInMark } from './motion';
import { Pin, type Glyph } from './Pin';

/**
 * Detail-screen anatomy for events, places, shops, zones and crews (DESIGN-SYSTEM.md "One way
 * to do X" 4): a hero in a fixed order (kind → title → meta lines → tags), then Sections.
 * Kept here until the design system's own Hero lands; the props match its proposal.
 */
export function DetailHero({
  kind,
  colour,
  glyph,
  sample,
  status,
  title,
  lines,
  children,
}: {
  /** The kind in words: "Rolling meet", "Photo spot", "Crew". */
  kind: string;
  /** Layer colour for events and places; omit for crews (people aren't layers). */
  colour?: string;
  glyph?: Glyph;
  sample?: boolean;
  /** One state tag on the right: Live, Going, Hosting, Waiting. */
  status?: { label: string; tone?: TagTone; raw?: boolean } | null;
  title: string;
  /** Meta lines under the title, most important first: when, where, facts. */
  lines?: (string | null | undefined | false)[];
  children?: ReactNode;
}) {
  return (
    <View style={{ gap: SPACING.xs }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, flexWrap: 'wrap' }}>
        {glyph ? (
          <View aria-hidden>
            <Pin glyph={glyph} colour={colour ?? COLOR.text.secondary} size={24} />
          </View>
        ) : null}
        <DsText v="eyebrow" style={{ color: colour ?? COLOR.text.secondary }}>
          {kind}
        </DsText>
        {sample ? <Tag label="Sample" accessibilityLabel="Sample, for the demo" /> : null}
        <View style={{ flex: 1 }} />
        {status ? <Tag label={status.label} tone={status.tone} raw={status.raw} /> : null}
      </View>
      <DsText v="titleLg" accessibilityRole="header">
        {title}
      </DsText>
      {(lines ?? []).filter((l): l is string => !!l).map((l, i) => (
        <DsText key={`${i}:${l}`} v={i === 0 ? 'bodyStrong' : 'meta'} style={i === 0 ? undefined : { color: COLOR.text.primary }}>
          {l}
        </DsText>
      ))}
      {children}
    </View>
  );
}

/** A bordered frame for a map or media inside a page. */
export function MediaFrame({ height, children, style }: { height: number; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ height, borderRadius: RADII.card, overflow: 'hidden', borderWidth: 1, borderColor: COLOR.surface.border, backgroundColor: COLOR.surface.media }, style]}>{children}</View>;
}

export type CalloutTone = 'info' | 'warning' | 'success' | 'danger' | 'neutral';

const TONE_ICON: Record<CalloutTone, IconName> = { info: 'info', warning: 'alert', success: 'success', danger: 'alert', neutral: 'info' };

/**
 * A message in a tinted box with its tone's icon (the design system's planned `Notice`): before
 * you go, request sent, a meet ban, "only hosts see this". No accent bar: those are layer identity.
 */
export function Callout({ tone = 'info', title, children, right }: { tone?: CalloutTone; title?: string; children?: ReactNode; right?: ReactNode }) {
  const c =
    tone === 'warning' ? COLOR.state.warning : tone === 'success' ? COLOR.state.success : tone === 'danger' ? COLOR.state.danger : tone === 'info' ? COLOR.state.info : COLOR.text.secondary;
  return (
    <View
      style={{
        flexDirection: 'row',
        gap: SPACING.md,
        padding: SPACING.md,
        borderRadius: RADII.card,
        borderWidth: 1,
        borderColor: tone === 'neutral' ? COLOR.surface.border : line(c),
        backgroundColor: tone === 'neutral' ? COLOR.surface.card : tint(c),
      }}
    >
      <View style={{ paddingTop: SPACING.xxs }}>
        <Icon name={TONE_ICON[tone]} size={20} colour={c} />
      </View>
      <View style={{ flex: 1, gap: SPACING.xs }}>
        {title ? <DsText v="bodyStrong">{title}</DsText> : null}
        {typeof children === 'string' ? <DsText v="secondary">{children}</DsText> : children}
      </View>
      {right}
    </View>
  );
}

/**
 * The check-in moment, the same on events and photo spots: the burst, a green tick, one line, and
 * a success buzz (through the design system's haptics) when it plays.
 */
export function CheckInCelebration({ play, title, body, children }: { play: boolean; title: string; body?: string; children?: ReactNode }) {
  useEffect(() => {
    if (play) buzz('success');
  }, [play]);
  return (
    <View
      accessibilityLiveRegion="polite"
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
        padding: SPACING.md,
        borderRadius: RADII.card,
        borderWidth: 1,
        borderColor: line(COLOR.state.success),
        backgroundColor: tint(COLOR.state.success),
      }}
    >
      <CheckInMark play={play} />
      <View style={{ flex: 1, gap: SPACING.xxs }}>
        <DsText v="title">{title}</DsText>
        {body ? <DsText v="secondary">{body}</DsText> : null}
        {children}
      </View>
    </View>
  );
}

/** Fields moved to the design system; re-exported so detail screens keep one import. */
export { Field, INPUT, TextField } from './ds';

/** The page body for detail screens: gutter, section rhythm, room at the bottom. */
export const PAGE = { padding: SPACING.screen, gap: SPACING.section, paddingBottom: SPACING.xxxl } as const;

/** A detail route whose thing is gone: what, why, and Go back. */
export function NotFoundState({ what, message }: { what: string; message?: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: COLOR.surface.bg, padding: SPACING.screen }}>
      <EmptyState
        title={`${what} not found`}
        body={message ?? 'It may have been deleted, or the link is old.'}
        action={{ label: 'Go back', onPress: () => (router.canGoBack() ? router.back() : router.replace('/')) }}
      />
    </View>
  );
}
