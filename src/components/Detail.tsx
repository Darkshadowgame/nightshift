import { router } from 'expo-router';
import { Children, Fragment, isValidElement, useEffect, type ReactNode } from 'react';
import { TextInput, View, type StyleProp, type TextInputProps, type TextStyle, type ViewStyle } from 'react-native';
import { COLOR, RADII, SPACING, tint, line } from '../theme';
import { buzz, DsText, EmptyState, Hero, Icon, type IconName, type TagTone } from './ds';
import { CheckInMark } from './motion';
import type { Glyph } from './Pin';

/**
 * @deprecated Use the design system's `Hero` (Redesign 2): it adds the photo, the title on a
 * gradient and the live dot. This shim draws a words-only Hero so existing detail screens keep
 * working until they move over. `sample` is ignored: "Sample" tags are cut (the Tonight header
 * carries DEMO NIGHT instead).
 */
export function DetailHero({
  kind,
  colour,
  glyph,
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
  /** Ignored (Redesign 2 cuts "Sample" tags). */
  sample?: boolean;
  /** One state tag on the right: Live, Going, Hosting, Waiting. */
  status?: { label: string; tone?: TagTone; raw?: boolean } | null;
  title: string;
  /** Meta lines under the title, most important first: when, where, facts. */
  lines?: (string | null | undefined | false)[];
  children?: ReactNode;
}) {
  return (
    <Hero eyebrow={kind} layerColour={colour} glyph={glyph} tag={status} title={title} meta={lines}>
      {children}
    </Hero>
  );
}

/** A bordered frame for a map or media inside a page. */
export function MediaFrame({ height, children, style }: { height: number; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ height, borderRadius: RADII.card, overflow: 'hidden', borderWidth: 1, borderColor: COLOR.surface.border, backgroundColor: COLOR.surface.media }, style]}>{children}</View>;
}

/**
 * Children for a View with any loose text wrapped: runs of strings and numbers (`{why} Change it…`
 * is an array) become one secondary DsText, elements stay as they are. Raw text in a View throws
 * "Text strings must be rendered within a <Text>" on iOS and falls back to a serif face on web.
 */
export function textSafe(children: ReactNode): ReactNode {
  const out: ReactNode[] = [];
  let run: string[] = [];
  const flush = () => {
    const text = run.join('');
    if (text.trim()) out.push(<DsText key={`t${out.length}`} v="secondary">{text}</DsText>);
    run = [];
  };
  const walk = (node: ReactNode) => {
    Children.forEach(node, (c) => {
      if (c == null || typeof c === 'boolean') return;
      if (typeof c === 'string' || typeof c === 'number' || typeof c === 'bigint') {
        run.push(String(c));
        return;
      }
      if (isValidElement(c) && c.type === Fragment) {
        walk((c.props as { children?: ReactNode }).children);
        return;
      }
      flush();
      out.push(isValidElement(c) && c.key == null ? <Fragment key={`e${out.length}`}>{c}</Fragment> : c);
    });
  };
  walk(children);
  flush();
  return out.length === 1 ? out[0] : out;
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
        {textSafe(children)}
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

/** The page body for detail screens: gutter, section rhythm, room at the bottom. Above an ActionBar use `PAGE_WITH_BAR`. */
export const PAGE = { padding: SPACING.screen, gap: SPACING.section, paddingBottom: SPACING.xxxl } as const;
export { PAGE_WITH_BAR } from './ds';

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
