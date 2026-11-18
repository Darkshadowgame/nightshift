import { createContext, useContext, useEffect, useId, type ReactNode } from 'react';
import { View } from 'react-native';
import Animated, { FadeIn, useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLOR, ELEVATION, MOTION, RADII, SPACING } from '../../theme';
import { Button } from './Button';
import type { IconName } from './Icon';
import type { Haptic } from './Press';
import { DsText } from './Text';
import { useToastAnchor } from './Toast';

export type ActionBarButton = {
  label: string;
  onPress: () => void;
  busy?: boolean;
  icon?: IconName;
  /** Pass `success` on save, send, going, check in. */
  haptic?: Haptic;
  accessibilityLabel?: string;
  accessibilityHint?: string;
};

/**
 * Set by a Sheet around its pinned footer: an ActionBar there draws flat (no bar of its own, no
 * home-indicator inset, no toast anchor), since the Sheet already sits above the home indicator.
 */
export const InSheetContext = createContext(false);

/**
 * The bottom bar of every detail screen (T3) and form (T4), and the sign-in screen (Redesign 2,
 * 4.3): the screen's one primary, at most one secondary, pinned above the home indicator so it is
 * always visible at 375x667.
 *
 * Put it after the ScrollView, in a `flex: 1` column (it is not absolute, so nothing scrolls
 * under it):
 *
 *   <View style={{ flex: 1 }}>
 *     <ScrollView contentContainerStyle={PAGE_WITH_BAR}>…</ScrollView>
 *     <ActionBar primary={{ label: "I'm going", onPress: go, haptic: 'success' }} />
 *   </View>
 *
 * - `primary` + `secondary`: stacked, full width, primary on top.
 * - `status` + `secondary`: never a disabled primary. When the next step isn't possible yet, a
 *   status pill says when it will be ("Location at 21:30") with a secondary that helps (Remind me).
 * - `secondary` alone: an outline button (an ended event's "See photos").
 * - Nothing at all renders nothing.
 * - `children` replace the buttons (a comment field on a post or thread page).
 *
 * When the primary's label changes (I'm going → Open) the new one fades in over `MOTION.morph`.
 * Toasts sit just above the bar (it tells the ToastProvider its height). `inset={false}` inside a
 * tab screen, where the tab bar already clears the home indicator.
 */
export function ActionBar({
  primary,
  secondary,
  status,
  children,
  inset = true,
}: {
  primary?: ActionBarButton | null;
  secondary?: ActionBarButton | null;
  /** Shown instead of a primary that can't be pressed yet: one short line, "Location at 21:30". */
  status?: string | null;
  children?: ReactNode;
  inset?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const anchor = useToastAnchor();
  const inSheet = useContext(InSheetContext);
  const id = useId();
  const hasContent = !!(primary || secondary || status || children);
  useEffect(() => {
    if (!hasContent || inSheet) anchor(id, null);
    return () => anchor(id, null);
  }, [anchor, id, hasContent, inSheet]);
  if (!hasContent) return null;
  // The status pill only stands in for a primary: with a primary showing it would say the same twice.
  const pill = !primary && status ? status : null;
  return (
    <View
      onLayout={inSheet ? undefined : (e) => anchor(id, e.nativeEvent.layout.height)}
      style={inSheet ? { gap: SPACING.sm } : [
        {
          backgroundColor: COLOR.surface.bg,
          borderTopWidth: 1,
          borderTopColor: COLOR.surface.border,
          paddingHorizontal: SPACING.screen,
          paddingTop: SPACING.md,
          paddingBottom: (inset ? insets.bottom : 0) + SPACING.md,
          gap: SPACING.sm,
        },
        ELEVATION.bar,
      ]}
    >
      {children ?? (
        <>
          {primary ? (
            <Animated.View key={primary.label} entering={FadeIn.duration(reduced ? MOTION.fast : MOTION.morph)}>
              <Button tier="primary" size="md" block {...barButton(primary)} />
            </Animated.View>
          ) : null}
          {pill ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
              <StatusPill text={pill} />
              {secondary ? <Button tier="secondary" size="md" {...barButton(secondary)} /> : null}
            </View>
          ) : secondary ? (
            <Button tier="secondary" size="md" block {...barButton(secondary)} />
          ) : null}
        </>
      )}
    </View>
  );
}

function barButton(b: ActionBarButton) {
  return { label: b.label, onPress: b.onPress, busy: b.busy, icon: b.icon, haptic: b.haptic, accessibilityLabel: b.accessibilityLabel, accessibilityHint: b.accessibilityHint };
}

/** "Location at 21:30": what the bar is waiting for, in place of a primary. Not a button. */
function StatusPill({ text }: { text: string }) {
  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={text}
      style={{ flex: 1, minHeight: 48, justifyContent: 'center', paddingHorizontal: SPACING.lg, borderRadius: RADII.pill, backgroundColor: COLOR.surface.raised }}
    >
      <DsText v="bodyStrong" numberOfLines={2}>
        {text}
      </DsText>
    </View>
  );
}

/**
 * The page padding for a scroll view above an ActionBar: gutter, section rhythm, and `SPACING.xl`
 * at the bottom so the last section never sits against the bar.
 */
export const PAGE_WITH_BAR = { padding: SPACING.screen, gap: SPACING.section, paddingBottom: SPACING.xl } as const;
