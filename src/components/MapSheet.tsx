import { useEffect, useId, useMemo, useRef, type ReactNode } from 'react';
import { PanResponder, Pressable, ScrollView, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, withSpring, withTiming, type SharedValue } from 'react-native-reanimated';
import { feel } from '../lib/feel';
import { C, ELEVATION, RADII, SPACING, SURFACE } from '../theme';
import { useToastAnchor } from './ds';
import { detentTops, MIN_SHOWN, ORDER, settle, type Detent } from './sheetDetents';

/**
 * The map's bottom sheet (MAP-REDESIGN.md): three detents, peek, half and
 * full. Drag the grabber or the header, or tap the grabber to cycle. Also `min`:
 * just the grabber and the screen's one-line `minBar`, so the map is all but full
 * screen (Tonight lowers it there when a tap on the map closes a card). Tapping the
 * bar or the grabber, or dragging up, brings it back to peek. The body
 * scrolls only at full; at full, pulling down from the top of the list drags
 * the sheet down again. VoiceOver: the grabber is adjustable (swipe up or
 * down). Reduced motion: no spring, it moves straight to the detent.
 *
 * Built on the responder system and reanimated (no gesture-handler: no new
 * native code). `y` is owned by the screen, so the map's buttons can ride on
 * top of the sheet.
 */

export { detentTops, MIN_SHOWN, settle, type Detent } from './sheetDetents';
const SPRING = { damping: 28, stiffness: 280, mass: 0.9, overshootClamping: true };
const DETENT_WORDS: Record<Detent, string> = { min: 'minimised', peek: 'lowered', half: 'half open', full: 'fully open' };

export function MapSheet({
  y,
  height,
  top,
  peek,
  detent,
  onDetent,
  label,
  header,
  onHeaderLayout,
  toastAnchor,
  hidden,
  minBar,
  children,
}: {
  y: SharedValue<number>;
  /** The screen's height (the sheet's container). */
  height: number;
  /** The highest the sheet goes (full). */
  top: number;
  /** How much of the sheet shows when lowered. */
  peek: number;
  detent: Detent;
  onDetent: (d: Detent) => void;
  /** What the sheet holds, for VoiceOver ("Tonight near you"). */
  label: string;
  /** Always visible: drawn under the grabber, and draggable. */
  header: ReactNode;
  onHeaderLayout?: (h: number) => void;
  /**
   * How far above the screen's bottom toasts should sit (the lowered sheet plus the tab bar), or
   * null when the sheet isn't on screen. Toasts then never cover the card's I'm going.
   */
  toastAnchor?: number | null;
  /**
   * Another sheet is open (Demo night, Map layers, What are you bringing?): this one slides away
   * first and comes back when it closes. Never a sheet on a sheet, never two grab handles (4.5).
   */
  hidden?: boolean;
  /** At `min`, the one line shown under the grabber (over the header); tapping it goes back to peek. */
  minBar?: ReactNode;
  children: ReactNode;
}) {
  const reduced = useReducedMotion();
  const anchor = useToastAnchor();
  const anchorId = useId();
  useEffect(() => {
    anchor(anchorId, hidden ? null : (toastAnchor ?? null));
    return () => anchor(anchorId, null);
  }, [anchor, anchorId, toastAnchor, hidden]);
  const tops = detentTops(height, peek, top);
  const live = useRef({ tops, detent, reduced, scrollY: 0, start: 0 });
  live.current.tops = tops;
  live.current.detent = detent;
  live.current.reduced = reduced;

  const onDetentRef = useRef(onDetent);
  onDetentRef.current = onDetent;
  function snap(d: Detent) {
    const to = live.current.tops[d];
    y.value = live.current.reduced ? withTiming(to, { duration: 0 }) : withSpring(to, SPRING);
    if (d !== live.current.detent) {
      feel.select();
      onDetentRef.current(d);
    }
  }
  // Move when the detent or the screen changes (a pin tapped, the screen rotated, text size changed).
  useEffect(() => {
    const to = hidden ? height + 24 : tops[detent];
    y.value = reduced ? to : hidden ? withTiming(to, { duration: 180 }) : withSpring(to, SPRING);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detent, tops.min, tops.peek, tops.half, tops.full, reduced, hidden, height]);

  const pan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponderCapture: (_e, g) => {
          if (Math.abs(g.dy) < 6 || Math.abs(g.dy) < Math.abs(g.dx) * 1.2) return false;
          if (live.current.detent !== 'full') return true;
          // At full the list scrolls; only a pull down from its top moves the sheet.
          return g.dy > 0 && live.current.scrollY <= 0;
        },
        onPanResponderGrant: () => {
          live.current.start = y.value;
        },
        onPanResponderMove: (_e, g) => {
          const t = live.current.tops;
          const next = live.current.start + g.dy;
          // A little give past the ends.
          const low = live.current.detent === 'min' ? t.min : t.peek;
          y.value = next < t.full ? t.full - (t.full - next) * 0.2 : next > low ? low + (next - low) * 0.2 : next;
        },
        onPanResponderRelease: (_e, g) => snap(settle(y.value, g.vy, live.current.tops, live.current.detent === 'min')),
        onPanResponderTerminate: () => snap(settle(y.value, 0, live.current.tops, live.current.detent === 'min')),
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  const i = ORDER.indexOf(detent);
  const cycle = () => snap(detent === 'min' ? 'peek' : ORDER[(i + 1) % ORDER.length]);

  return (
    <Animated.View style={[st.sheet, { height: height - top }, style]} pointerEvents={hidden ? 'none' : 'auto'} aria-hidden={hidden || undefined} {...pan.panHandlers}>
      <View onLayout={(e: LayoutChangeEvent) => onHeaderLayout?.(e.nativeEvent.layout.height)}>
        <Pressable
          onPress={cycle}
          accessibilityRole="adjustable"
          accessibilityLabel={`${label}, ${DETENT_WORDS[detent]}`}
          accessibilityHint="Swipe up or down to show more or less"
          accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }, { name: 'activate' }]}
          onAccessibilityAction={(e) => {
            if (e.nativeEvent.actionName === 'increment' && detent === 'min') snap('peek');
            else if (e.nativeEvent.actionName === 'increment' && i < ORDER.length - 1) snap(ORDER[i + 1]);
            else if (e.nativeEvent.actionName === 'decrement' && i > 0) snap(ORDER[i - 1]);
            else if (e.nativeEvent.actionName === 'activate') cycle();
          }}
          hitSlop={{ top: 8 }}
          style={st.grabberHit}
        >
          <View style={st.grabber} />
        </Pressable>
        {header}
        {detent === 'min' && minBar ? (
          <Pressable onPress={() => snap('peek')} accessibilityRole="button" style={st.minBar}>
            {minBar}
          </Pressable>
        ) : null}
      </View>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={st.body}
        scrollEnabled={detent === 'full'}
        showsVerticalScrollIndicator={detent === 'full'}
        onScroll={(e) => {
          live.current.scrollY = e.nativeEvent.contentOffset.y;
        }}
        scrollEventThrottle={32}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </Animated.View>
  );
}

const st = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    backgroundColor: SURFACE.sheet,
    borderTopLeftRadius: RADII.sheet,
    borderTopRightRadius: RADII.sheet,
    borderColor: C.kerbHi,
    borderWidth: 1,
    borderBottomWidth: 0,
    ...ELEVATION.sheet,
    overflow: 'hidden',
  },
  // Over the top of the header (kept mounted, so its height and the peek stay as they were).
  minBar: { position: 'absolute', top: 22, left: 0, right: 0, height: MIN_SHOWN - 22, paddingHorizontal: SPACING.screen, justifyContent: 'center', backgroundColor: SURFACE.sheet },
  grabberHit: { alignItems: 'center', justifyContent: 'center', height: 22 },
  grabber: { width: 40, height: 5, borderRadius: RADII.pill, backgroundColor: SURFACE.borderStrong },
  body: { paddingHorizontal: SPACING.screen, paddingBottom: SPACING.xxxl, gap: SPACING.lg },
});
