import type { ReactNode } from 'react';
import { View } from 'react-native';
import { COLOR, RADII, SPACING } from '../../theme';
import { NoticeBell } from '../NoticeBell';
import { IconButton } from './Button';
import { statA11yLabel } from './logic';
import { Press } from './Press';
import { DsText } from './Text';

/**
 * A titled block. Eyebrow title in sodium, a hairline to the edge, and at most one thing on
 * the right: a tertiary Button or a Tag (never a value). No colour prop: sections aren't layers.
 */
export function Section({ title, right, children, gap = 'md' }: { title: string; right?: ReactNode; children: ReactNode; gap?: 'sm' | 'md' }) {
  return (
    <View style={{ gap: SPACING[gap] }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.md, minHeight: 24 }}>
        <DsText v="eyebrow" tone="action" accessibilityRole="header">
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

/** One text action in a header ("+ Host", "Settings"): sodium, 44 pt tall. */
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
 * The right side of every header: at most one text action, the bell, and a ··· menu.
 * Nothing else goes up there.
 */
export function HeaderActions({ action, bell, onMenu }: { action?: HeaderAction; bell?: boolean; onMenu?: () => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs }}>
      {action ? <HeaderTextAction {...action} /> : null}
      {bell ? <NoticeBell /> : null}
      {onMenu ? <IconButton icon="more" label="More options" onPress={onMenu} /> : null}
    </View>
  );
}

/**
 * Native-stack header options for a screen: `<Stack.Screen options={screenHeader({...})} />`.
 * Title in caps (chrome). Detail screens pass no title (their hero carries it) and an `onMenu`.
 * Chat titles are the one sentence-case exception (`content: true`).
 */
export function screenHeader({ title, action, bell, onMenu, content }: { title?: string; action?: HeaderAction; bell?: boolean; onMenu?: () => void; content?: boolean }) {
  return {
    title: title ? (content ? title : title.toUpperCase()) : '',
    headerRight: action || bell || onMenu ? () => <HeaderActions action={action} bell={bell} onMenu={onMenu} /> : undefined,
  };
}

/**
 * An in-page header, for screens without a native header (the map, sheets, the gallery's preview).
 * Same anatomy as `screenHeader`: caps title, then the actions.
 */
export function ScreenHeader({ title, action, bell, onMenu }: { title: string; action?: HeaderAction; bell?: boolean; onMenu?: () => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', minHeight: 52, gap: SPACING.sm }}>
      <DsText v="heading" accessibilityRole="header" numberOfLines={1} style={{ flex: 1 }}>
        {title}
      </DsText>
      <HeaderActions action={action} bell={bell} onMenu={onMenu} />
    </View>
  );
}

export type Stat = { value: string; unit?: string; label: string; tone?: 'live' };

/**
 * 2–4 numbers in a row, one height. Fixed sets: build = bhp, bhp/tonne, mods; event = starts in,
 * going, stop n of m; person = builds, events, rep. Replaces inline caps stat lines.
 * No sodium numbers: a stat isn't something to tap. `live` (white) for a running countdown.
 */
export function StatBlock({ stats }: { stats: Stat[] }) {
  return (
    <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
      {stats.slice(0, 4).map((s) => (
        <View
          key={s.label}
          accessible
          accessibilityLabel={statA11yLabel(s)}
          style={{ flex: 1, backgroundColor: COLOR.surface.card, borderColor: COLOR.surface.border, borderWidth: 1, borderRadius: RADII.card, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, gap: SPACING.xxs }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: SPACING.xs }}>
            <DsText v="stat" numberOfLines={1} style={{ color: s.tone === 'live' ? COLOR.state.live : COLOR.text.primary, flexShrink: 1 }}>
              {s.value}
            </DsText>
            {s.unit ? <DsText v="meta">{s.unit}</DsText> : null}
          </View>
          <DsText v="label" numberOfLines={2}>
            {s.label}
          </DsText>
        </View>
      ))}
    </View>
  );
}
