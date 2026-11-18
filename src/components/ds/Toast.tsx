import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AccessibilityInfo, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp, FadeOut, useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLOR, ELEVATION, MOTION, RADII, SPACING } from '../../theme';
import { Button } from './Button';
import { Icon } from './Icon';
import { toastDuration } from './logic';
import { buzz } from './Press';
import { DsText } from './Text';

export type ToastTone = 'success' | 'info' | 'danger';
export type ToastInput = { message: string; tone?: ToastTone; action?: { label: string; onPress: () => void } };

/**
 * A short confirmation after something happened ("Saved", "Request sent", "Left the group · Undo").
 * One line, 3.2 s, just above the ActionBar or the tab bar (Redesign 2, 4.7), so it never covers
 * the primary. Read out by screen readers, buzzes `success` (or `warning` for danger). Not for
 * errors the user must act on: those stay under the thing that failed (ErrorState).
 */
export function ToastView({ message, tone = 'success', action, onDismiss }: ToastInput & { onDismiss?: () => void }) {
  const colour = tone === 'success' ? COLOR.state.success : tone === 'danger' ? COLOR.state.danger : COLOR.state.info;
  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={[
        { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, minHeight: 52, paddingLeft: SPACING.lg, paddingRight: SPACING.sm, borderRadius: RADII.card, backgroundColor: COLOR.surface.glassRaised, borderWidth: 1, borderColor: COLOR.surface.raisedHi },
        ELEVATION.float,
      ]}
    >
      <Icon name={tone === 'success' ? 'success' : tone === 'danger' ? 'alert' : 'info'} size={20} colour={colour} />
      <DsText v="body" style={{ flex: 1, paddingVertical: SPACING.sm }}>
        {message}
      </DsText>
      {action ? (
        <Button
          label={action.label}
          tier="tertiary"
          size="sm"
          onPress={() => {
            action.onPress();
            onDismiss?.();
          }}
        />
      ) : null}
    </View>
  );
}

const ToastContext = createContext<(t: ToastInput) => void>(() => {});

/** The tab bar's height above the home indicator: where a toast sits when no ActionBar is showing. */
export const TAB_BAR_HEIGHT = 49;

type Anchor = (id: string, height: number | null) => void;
const AnchorContext = createContext<Anchor>(() => {});

/**
 * For `ActionBar`: tell the toast host how tall the bar is (null when it unmounts), so toasts sit
 * just above it. The most recently mounted bar wins.
 */
export function useToastAnchor(): Anchor {
  return useContext(AnchorContext);
}

/** `const toast = useToast(); toast({ message: 'Saved' })`. Needs a ToastProvider above it. */
export function useToast() {
  return useContext(ToastContext);
}

/**
 * Hosts toasts for everything inside it. Goes once at the root (or around a screen, like the gallery).
 * `placement="bottom"` (default) sits above the ActionBar when one is showing, else above the tab
 * bar; `top` (with `topOffset`) is kept for full-screen views with controls at the bottom.
 */
export function ToastProvider({ children, placement = 'bottom', topOffset = 56 }: { children: ReactNode; placement?: 'bottom' | 'top'; topOffset?: number }) {
  const [toast, setToast] = useState<(ToastInput & { id: number }) | null>(null);
  const [anchors, setAnchors] = useState<[string, number][]>([]);
  const anchor = useCallback<Anchor>((id, height) => {
    setAnchors((list) => {
      const rest = list.filter(([k]) => k !== id);
      if (height == null) return rest.length === list.length ? list : rest;
      const same = list.find(([k, h]) => k === id && Math.abs(h - height) < 1);
      return same ? list : [...rest, [id, height]];
    });
  }, []);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Each toast's key, so the same message twice still animates in again. */
  const count = useRef(0);
  const reduced = useReducedMotion();
  const insets = useSafeAreaInsets();
  const show = useCallback((t: ToastInput) => {
    if (timer.current) clearTimeout(timer.current);
    buzz(t.tone === 'danger' ? 'warning' : t.tone === 'info' ? 'none' : 'success');
    AccessibilityInfo.announceForAccessibility(t.message);
    setToast({ ...t, id: ++count.current });
    timer.current = setTimeout(() => setToast(null), toastDuration(t.message, !!t.action, MOTION.toast));
  }, []);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);
  const value = useMemo(() => show, [show]);
  const bar = anchors.length ? anchors[anchors.length - 1][1] : null;
  const position = placement === 'top' ? { top: insets.top + topOffset } : { bottom: (bar ?? insets.bottom + TAB_BAR_HEIGHT) + SPACING.sm };
  return (
    <AnchorContext.Provider value={anchor}>
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <Animated.View
          key={toast.id}
          entering={reduced ? FadeIn.duration(MOTION.fast) : (placement === 'top' ? FadeInDown : FadeInUp).duration(MOTION.base)}
          exiting={FadeOut.duration(MOTION.fast)}
          style={{ position: 'absolute', left: SPACING.lg, right: SPACING.lg, ...position }}
        >
          <ToastView {...toast} onDismiss={() => setToast(null)} />
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
    </AnchorContext.Provider>
  );
}
