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
 *
 * It never takes a tap (Review 13): the pill lets every touch through to what's under it; only
 * its action (Undo, Change) is tappable.
 */
export function ToastView({ message, tone = 'success', action, onDismiss }: ToastInput & { onDismiss?: () => void }) {
  const colour = tone === 'success' ? COLOR.state.success : tone === 'danger' ? COLOR.state.danger : COLOR.state.info;
  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      pointerEvents="box-none"
      style={[
        // A floating pill on the lightest surface with a shadow, so it never reads as a card in the
        // page (Review 12, 4.7: the "Invites sent" toast on the success page looked inline).
        { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, minHeight: 52, paddingLeft: SPACING.lg, paddingRight: SPACING.sm, borderRadius: RADII.pill, backgroundColor: COLOR.surface.raisedHi, borderWidth: 1, borderColor: COLOR.surface.borderStrong },
        ELEVATION.toast,
      ]}
    >
      <View pointerEvents="none" style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: SPACING.md }}>
        <Icon name={tone === 'success' ? 'success' : tone === 'danger' ? 'alert' : 'info'} size={20} colour={colour} />
        <DsText v="body" style={{ flex: 1, paddingVertical: SPACING.sm }}>
          {message}
        </DsText>
      </View>
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

/** How much room the toast on show takes above the ActionBar (0 with none). */
const ClearanceContext = createContext(0);

/**
 * For `ActionBar`: the room to keep free above the bar while a toast shows, so the toast never
 * covers the page's last line (the message you just sent, the attendee row) at any text size
 * (Review 14). The page above shrinks by this much for the toast's 3.2 s.
 */
export function useToastClearance(): number {
  return useContext(ClearanceContext);
}

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
 * A toast raised this soon before the screen changes belongs to the new screen ("Saved" as a form
 * closes), so the change doesn't dismiss it.
 */
export const TOAST_HANDOFF_MS = 400;

/**
 * Hosts toasts for everything inside it. Goes once at the root (or around a screen, like the gallery).
 * `placement="bottom"` (default) sits above the ActionBar when one is showing, else above the tab
 * bar; `top` (with `topOffset`) is kept for full-screen views with controls at the bottom.
 *
 * Redesign 2, 4.7 (Review 13): one toast at a time (a new one replaces it), 3.2 s, and it goes when
 * the screen changes (`screenKey`, the root passes the route's path), so a toast never follows you
 * onto the next screen. A toast raised as part of the change itself (within TOAST_HANDOFF_MS) stays.
 */
export function ToastProvider({ children, placement = 'bottom', topOffset = 56, screenKey }: { children: ReactNode; placement?: 'bottom' | 'top'; topOffset?: number; /** The screen on show (the route path): a change dismisses the toast. */ screenKey?: string }) {
  const [toast, setToast] = useState<(ToastInput & { id: number }) | null>(null);
  const [anchors, setAnchors] = useState<[string, number][]>([]);
  /** The toast pill's measured height (it grows to two lines at large text). */
  const [toastHeight, setToastHeight] = useState(52);
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
  /** The toast on show was raised in the last TOAST_HANDOFF_MS (as part of a screen change). */
  const fresh = useRef(false);
  const freshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dismiss = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setToast(null);
  }, []);
  const show = useCallback((t: ToastInput) => {
    if (timer.current) clearTimeout(timer.current);
    buzz(t.tone === 'danger' ? 'warning' : t.tone === 'info' ? 'none' : 'success');
    AccessibilityInfo.announceForAccessibility(t.message);
    fresh.current = true;
    if (freshTimer.current) clearTimeout(freshTimer.current);
    freshTimer.current = setTimeout(() => {
      fresh.current = false;
    }, TOAST_HANDOFF_MS);
    setToast({ ...t, id: ++count.current });
    timer.current = setTimeout(() => setToast(null), toastDuration(t.message, !!t.action, MOTION.toast));
  }, []);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
    if (freshTimer.current) clearTimeout(freshTimer.current);
  }, []);
  // A new screen: the toast stays behind (unless it was raised as part of the change).
  const lastScreen = useRef(screenKey);
  useEffect(() => {
    if (lastScreen.current === screenKey) return;
    lastScreen.current = screenKey;
    if (!fresh.current) dismiss();
  }, [screenKey, dismiss]);
  const value = useMemo(() => show, [show]);
  const bar = anchors.length ? anchors[anchors.length - 1][1] : null;
  const position = placement === 'top' ? { top: insets.top + topOffset } : { bottom: (bar ?? insets.bottom + TAB_BAR_HEIGHT) + SPACING.sm };
  // Only a bottom toast over an ActionBar needs room kept: the bar makes it.
  const clearance = toast && placement === 'bottom' && bar != null ? toastHeight + SPACING.sm * 2 : 0;
  return (
    <AnchorContext.Provider value={anchor}>
    <ClearanceContext.Provider value={clearance}>
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <Animated.View
          key={toast.id}
          entering={reduced ? FadeIn.duration(MOTION.fast) : (placement === 'top' ? FadeInDown : FadeInUp).duration(MOTION.base)}
          exiting={FadeOut.duration(MOTION.fast)}
          pointerEvents="box-none"
          style={{ position: 'absolute', left: SPACING.lg, right: SPACING.lg, ...position }}
          onLayout={(e) => {
            const h = Math.ceil(e.nativeEvent.layout.height);
            setToastHeight((old) => (Math.abs(old - h) > 1 ? h : old));
          }}
        >
          <ToastView {...toast} onDismiss={dismiss} />
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
    </ClearanceContext.Provider>
    </AnchorContext.Provider>
  );
}
