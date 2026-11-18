import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { COLOR, RADII, SPACING } from '../../theme';
import { Pin, type Glyph } from '../Pin';
import { Button } from './Button';
import { Icon } from './Icon';
import { DsText } from './Text';

type Action = { label: string; onPress: () => void };

/**
 * Nothing here yet.
 * - `inline` (inside a Section): one muted line and an optional tertiary link. "No comments yet."
 * - `block` (a whole tab or list): glyph, title, one line, one primary action.
 */
export function EmptyState({
  variant = 'block',
  glyph,
  colour = COLOR.text.secondary,
  title,
  body,
  action,
}: {
  variant?: 'inline' | 'block';
  glyph?: Glyph;
  colour?: string;
  title: string;
  body?: string;
  action?: Action;
}) {
  if (variant === 'inline') {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: SPACING.sm, minHeight: 44 }}>
        <DsText v="secondary">{title}</DsText>
        {action ? <Button label={action.label} onPress={action.onPress} tier="tertiary" size="sm" /> : null}
      </View>
    );
  }
  return (
    <View style={{ alignItems: 'center', gap: SPACING.sm, paddingVertical: SPACING.xl, paddingHorizontal: SPACING.lg }}>
      {glyph ? (
        <View aria-hidden>
          <Pin glyph={glyph} colour={colour} size={48} />
        </View>
      ) : null}
      <DsText v="title" accessibilityRole="header" style={{ textAlign: 'center' }}>
        {title}
      </DsText>
      {body ? (
        <DsText v="secondary" style={{ textAlign: 'center' }}>
          {body}
        </DsText>
      ) : null}
      {action ? <Button label={action.label} onPress={action.onPress} style={{ marginTop: SPACING.sm, alignSelf: 'center' }} /> : null}
    </View>
  );
}

/** A grey bar that breathes while content loads (still with reduced motion). */
function Bone({ width, height, reduced, round }: { width: number | `${number}%`; height: number; reduced: boolean; round?: boolean }) {
  const p = useSharedValue(0);
  useEffect(() => {
    if (reduced) return;
    p.value = withRepeat(withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) }), -1, true);
    return () => cancelAnimation(p);
  }, [reduced, p]);
  const style = useAnimatedStyle(() => ({ opacity: reduced ? 0.7 : 0.45 + 0.4 * p.value }));
  return <Animated.View style={[{ width, height, borderRadius: round ? RADII.pill : RADII.tag, backgroundColor: COLOR.surface.skeleton }, style]} />;
}

/**
 * Loading.
 * - `rows` (default): skeleton ListRows, 3 of them. Every list loads this way.
 * - `inline`: a small spinner and a short line ("Finding you…"), for a part of a screen.
 * Buttons don't use this: they take `busy` and keep their label.
 */
export function LoadingState({ variant = 'rows', rows = 3, label = 'Loading' }: { variant?: 'rows' | 'inline'; rows?: number; label?: string }) {
  const reduced = useReducedMotion();
  if (variant === 'inline') {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, minHeight: 44 }} accessibilityRole="progressbar" accessibilityLabel={label} accessibilityState={{ busy: true }}>
        <ActivityIndicator size="small" color={COLOR.text.secondary} />
        <DsText v="secondary">{label}</DsText>
      </View>
    );
  }
  return (
    <View accessibilityRole="progressbar" accessibilityLabel={label} accessibilityState={{ busy: true }} accessible>
      {Array.from({ length: rows }, (_, i) => (
        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.md, minHeight: 56, paddingVertical: SPACING.sm }}>
          <Bone width={40} height={40} reduced={reduced} round />
          <View style={{ flex: 1, gap: SPACING.sm }}>
            <Bone width={i % 2 ? '55%' : '70%'} height={14} reduced={reduced} />
            <Bone width="40%" height={10} reduced={reduced} />
          </View>
        </View>
      ))}
    </View>
  );
}

/**
 * Something went wrong. Copy starts "Couldn't …" and says what to do.
 * - `inline`: red caption under the control that failed, with an optional Retry link.
 * - `block`: a whole list or screen failed: icon, title, line, Try again.
 */
export function ErrorState({ variant = 'inline', title, body, onRetry }: { variant?: 'inline' | 'block'; title: string; body?: string; onRetry?: () => void }) {
  if (variant === 'inline') {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: SPACING.sm }}>
        <DsText v="caption" tone="danger" accessibilityRole="alert" accessibilityLiveRegion="polite">
          {title}
        </DsText>
        {onRetry ? <Button label="Retry" tier="tertiary" size="sm" onPress={onRetry} accessibilityLabel={`Retry. ${title}`} /> : null}
      </View>
    );
  }
  return (
    <View style={{ alignItems: 'center', gap: SPACING.sm, paddingVertical: SPACING.xl, paddingHorizontal: SPACING.lg }} accessibilityLiveRegion="polite">
      <Icon name="alert" size={36} colour={COLOR.state.danger} />
      <DsText v="title" accessibilityRole="alert" style={{ textAlign: 'center' }}>
        {title}
      </DsText>
      {body ? (
        <DsText v="secondary" style={{ textAlign: 'center' }}>
          {body}
        </DsText>
      ) : null}
      {onRetry ? <Button label="Try again" tier="secondary" onPress={onRetry} style={{ marginTop: SPACING.sm, alignSelf: 'center' }} /> : null}
    </View>
  );
}
