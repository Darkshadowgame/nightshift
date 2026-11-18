import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AccessibilityInfo, View } from 'react-native';
import Animated, { FadeIn, FadeInUp, FadeOut, useReducedMotion } from 'react-native-reanimated';
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
 * At the top of the screen, just under the header, one at a time, so it never sits on a screen's
 * main buttons (REVIEW-10: "You're going" covered the going list and Navigate). Read out by screen readers, buzzes
 * `success` (or `warning` for danger). Not for errors the user must act on: those are ErrorState.
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

/** `const toast = useToast(); toast({ message: 'Saved' })`. Needs a ToastProvider above it. */
export function useToast() {
  return useContext(ToastContext);
}

/** Hosts toasts for everything inside it. Goes once at the root (or around a screen, like the gallery). */
export function ToastProvider({ children, topOffset = 56 }: { children: ReactNode; topOffset?: number }) {
  const [toast, setToast] = useState<(ToastInput & { id: number }) | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reduced = useReducedMotion();
  const insets = useSafeAreaInsets();
  const show = useCallback((t: ToastInput) => {
    if (timer.current) clearTimeout(timer.current);
    buzz(t.tone === 'danger' ? 'warning' : t.tone === 'info' ? 'none' : 'success');
    AccessibilityInfo.announceForAccessibility(t.message);
    setToast({ ...t, id: Date.now() });
    timer.current = setTimeout(() => setToast(null), toastDuration(t.message, !!t.action, MOTION.toast));
  }, []);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);
  const value = useMemo(() => show, [show]);
  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <Animated.View
          key={toast.id}
          entering={reduced ? FadeIn.duration(MOTION.fast) : FadeInUp.duration(MOTION.base)}
          exiting={FadeOut.duration(MOTION.fast)}
          style={{ position: 'absolute', left: SPACING.lg, right: SPACING.lg, top: insets.top + topOffset }}
        >
          <ToastView {...toast} onDismiss={() => setToast(null)} />
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}
