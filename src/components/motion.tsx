import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { CLASS_COLOURS } from '../lib/classes';
import { feel } from '../lib/feel';
import type { ClassLetter } from '../lib/types';
import { BRAND, C, F, STATE, SURFACE, TYPE } from '../theme';
import { Pin, type Glyph } from './Pin';
import { ClassBadge } from './ui';

/**
 * Motion, following the specs in docs/research/competitors-design-branding.md (C1).
 * Every piece checks reduced motion: loops become static, movement becomes a
 * short fade, and nothing relies on motion alone (there's always text too).
 */

const OUT_CUBIC = Easing.out(Easing.cubic);

// ---------------------------------------------------------------------------
// Live pulse: two staggered rings expanding from the pin. The pin stays still.
// ---------------------------------------------------------------------------

function Ring({ size, colour, delay, reduced }: { size: number; colour: string; delay: number; reduced: boolean }) {
  const t = useSharedValue(0);
  useEffect(() => {
    if (reduced) return;
    t.value = withDelay(delay, withRepeat(withTiming(1, { duration: 1600, easing: OUT_CUBIC }), -1, false));
    return () => cancelAnimation(t);
  }, [reduced, delay, t]);
  const style = useAnimatedStyle(() =>
    reduced
      ? { opacity: 0.4, transform: [{ scale: delay ? 1.6 : 1.3 }] }
      : { opacity: 0.6 * (1 - t.value), transform: [{ scale: 1 + 1.2 * t.value }] },
  );
  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: 'absolute', width: size, height: size, borderRadius: size / 2, borderWidth: 2, borderColor: colour }, style]}
    />
  );
}

/**
 * Wraps a pin. With `live` it gets the pulse; `pad` grows the box so the rings
 * aren't clipped (map markers clip to their own bounds). The pulse means "live
 * now" and nothing else (REVIEW-5 m1): it's always the live colour, whatever the
 * pin's colour. `colour` is kept for callers that pass one and is ignored.
 */
export function PulseRing({ live, size, pad, children }: { live: boolean; colour?: string; size: number; pad?: boolean; children: ReactNode }) {
  const reduced = useReducedMotion();
  const box = pad ? size * 2.2 : size;
  return (
    <View style={{ width: box, height: box, alignItems: 'center', justifyContent: 'center' }}>
      {live ? (
        <>
          <Ring size={size} colour={STATE.live} delay={0} reduced={reduced} />
          <Ring size={size} colour={STATE.live} delay={600} reduced={reduced} />
        </>
      ) : null}
      {children}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Fade up: list items and mod tags settle in on first show, staggered.
// 220 ms out-quad, 8 px rise (C1 "garage hero / mod tags"). Reduced motion: a
// plain 150 ms fade.
// ---------------------------------------------------------------------------

export function FadeUp({ index = 0, stagger = 40, children, style }: { index?: number; stagger?: number; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const reduced = useReducedMotion();
  const p = useSharedValue(0);
  useEffect(() => {
    const delay = Math.min(index, 10) * stagger;
    p.value = withDelay(delay, withTiming(1, { duration: reduced ? 150 : 220, easing: Easing.out(Easing.quad) }));
  }, [index, stagger, reduced, p]);
  const anim = useAnimatedStyle(() => (reduced ? { opacity: p.value } : { opacity: p.value, transform: [{ translateY: 8 * (1 - p.value) }] }));
  return <Animated.View style={[style, anim]}>{children}</Animated.View>;
}

// ---------------------------------------------------------------------------
// Sparks: a one-off burst of small dots, used by check-in and trophies.
// ---------------------------------------------------------------------------

function Spark({ angle, distance, colour, go }: { angle: number; distance: number; colour: string; go: SharedValue<number> }) {
  const style = useAnimatedStyle(() => ({
    opacity: go.value === 0 ? 0 : 1 - go.value,
    transform: [
      { translateX: Math.cos(angle) * distance * go.value },
      { translateY: Math.sin(angle) * distance * go.value + 10 * go.value * go.value },
      { scale: 1 - 0.5 * go.value },
    ],
  }));
  return <Animated.View pointerEvents="none" style={[{ position: 'absolute', width: 6, height: 6, borderRadius: 3, backgroundColor: colour }, style]} />;
}

function Sparks({ count, distance, colours, go }: { count: number; distance: number; colours: string[]; go: SharedValue<number> }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <Spark key={i} angle={(i / count) * Math.PI * 2 + 0.3} distance={distance * (0.75 + 0.25 * ((i * 7) % 3))} colour={colours[i % colours.length]} go={go} />
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// Check-in confirmation: ring draws in, tick pops, sparks burst once.
// ---------------------------------------------------------------------------

export function CheckInMark({ play, colour = STATE.success }: { play: boolean; colour?: string }) {
  const reduced = useReducedMotion();
  const ring = useSharedValue(play ? 0 : 1);
  const tick = useSharedValue(play ? 0 : 1);
  const burst = useSharedValue(0);
  const wave = useSharedValue(0);
  useEffect(() => {
    if (!play) return;
    if (reduced) {
      ring.value = withTiming(1, { duration: 150 });
      tick.value = withTiming(1, { duration: 150 });
      return;
    }
    ring.value = withSpring(1, { damping: 14, stiffness: 180 });
    tick.value = withDelay(220, withSpring(1, { damping: 10, stiffness: 220 }));
    wave.value = withDelay(200, withTiming(1, { duration: 500, easing: OUT_CUBIC }));
    burst.value = withDelay(220, withTiming(1, { duration: 650, easing: OUT_CUBIC }));
  }, [play, reduced, ring, tick, burst, wave]);

  const ringStyle = useAnimatedStyle(() =>
    reduced ? { opacity: ring.value } : { opacity: Math.min(1, ring.value * 2), transform: [{ scale: 0.4 + 0.6 * ring.value }] },
  );
  const tickStyle = useAnimatedStyle(() => (reduced ? { opacity: tick.value } : { opacity: tick.value, transform: [{ scale: tick.value }] }));
  const waveStyle = useAnimatedStyle(() => ({ opacity: wave.value === 0 ? 0 : 0.7 * (1 - wave.value), transform: [{ scale: 1 + 1.4 * wave.value }] }));

  return (
    <View style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {!reduced ? (
        <>
          <Animated.View style={[st.circle, { borderColor: colour }, waveStyle]} />
          <Sparks count={10} distance={34} colours={[colour, BRAND, STATE.live]} go={burst} />
        </>
      ) : null}
      <Animated.View style={[st.circle, { borderColor: colour, backgroundColor: `${colour}22` }, ringStyle]} />
      <Animated.Text style={[{ fontFamily: F.display, color: colour, fontSize: TYPE.title + 2 }, tickStyle]}>✓</Animated.Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Cover and trophy reveal: rises and settles with a spring, sparks once.
// ---------------------------------------------------------------------------

/** Awards revealed this session, so the reveal plays once rather than on every visit. */
const revealed = new Set<string>();

export function RevealIn({ id, delay = 0, sparks, children, style }: { id: string; delay?: number; sparks?: boolean; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const reduced = useReducedMotion();
  const [first] = useState(() => !revealed.has(id));
  const p = useSharedValue(first ? 0 : 1);
  const burst = useSharedValue(0);
  useEffect(() => {
    if (!first) return;
    revealed.add(id);
    if (reduced) {
      p.value = withDelay(delay, withTiming(1, { duration: 150 }));
      return;
    }
    p.value = withDelay(delay, withSpring(1, { damping: 12, stiffness: 120 }));
    if (sparks) {
      burst.value = withDelay(delay + 250, withTiming(1, { duration: 1200, easing: Easing.out(Easing.quad) }));
      const t = setTimeout(feel.success, delay + 250);
      return () => clearTimeout(t);
    }
  }, [first, id, reduced, delay, sparks, p, burst]);
  const style2 = useAnimatedStyle(() =>
    reduced
      ? { opacity: p.value }
      : { opacity: Math.min(1, p.value * 1.5), transform: [{ translateY: 40 * (1 - p.value) }, { scale: 0.8 + 0.2 * p.value }] },
  );
  return (
    <View style={[{ alignItems: 'center', justifyContent: 'center' }, style]}>
      {sparks && !reduced && first ? <Sparks count={24} distance={150} colours={[BRAND, STATE.live, STATE.success, STATE.warning]} go={burst} /> : null}
      <Animated.View style={style2}>{children}</Animated.View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Class-up: the badge flips on its Y axis, a light streak wipes across.
// ---------------------------------------------------------------------------

export function ClassUpMoment({ from, to, onDone }: { from: ClassLetter; to: ClassLetter; onDone: () => void }) {
  const reduced = useReducedMotion();
  const flip = useSharedValue(0);
  const streak = useSharedValue(0);
  const show = useSharedValue(0);
  const done = useRef(false);
  const finish = () => {
    if (done.current) return;
    done.current = true;
    onDone();
  };

  useEffect(() => {
    show.value = withTiming(1, { duration: reduced ? 150 : 200 });
    const timers: ReturnType<typeof setTimeout>[] = [];
    if (reduced) {
      flip.value = withDelay(300, withTiming(180, { duration: 150 }));
      timers.push(setTimeout(feel.success, 300));
    } else {
      const ease = Easing.inOut(Easing.cubic);
      flip.value = withDelay(350, withSequence(withTiming(90, { duration: 180, easing: ease }), withTiming(180, { duration: 180, easing: ease })));
      streak.value = withDelay(750, withTiming(1, { duration: 400, easing: Easing.inOut(Easing.quad) }));
      timers.push(setTimeout(feel.thump, 530));
      timers.push(setTimeout(feel.success, 900));
    }
    timers.push(setTimeout(finish, 2400));
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const back = useAnimatedStyle(() => ({ opacity: show.value }));
  const front = useAnimatedStyle(() =>
    reduced
      ? { opacity: flip.value < 90 ? 1 : 0 }
      : { opacity: flip.value < 90 ? 1 : 0, transform: [{ perspective: 600 }, { rotateY: `${flip.value}deg` }] },
  );
  const rear = useAnimatedStyle(() =>
    reduced
      ? { opacity: flip.value >= 90 ? 1 : 0 }
      : { opacity: flip.value >= 90 ? 1 : 0, transform: [{ perspective: 600 }, { rotateY: `${flip.value - 180}deg` }] },
  );
  const streakStyle = useAnimatedStyle(() => ({
    opacity: streak.value === 0 || streak.value === 1 ? 0 : 0.85,
    transform: [{ translateX: -90 + 180 * streak.value }, { rotate: '20deg' }],
  }));

  return (
    <Modal transparent animationType="none" visible onRequestClose={finish}>
      <Pressable style={StyleSheet.absoluteFill} onPress={finish} accessibilityRole="button" accessibilityLabel={`Class up: ${from} to ${to}. Tap to continue.`}>
        <Animated.View style={[StyleSheet.absoluteFill, st.scrim, back]}>
          <Text style={st.eyebrow}>Class up</Text>
          <View style={{ width: 120, height: 120, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            <Animated.View style={[StyleSheet.absoluteFill, st.centre, front]}>
              <ClassBadge letter={from} size="xl" />
            </Animated.View>
            <Animated.View style={[StyleSheet.absoluteFill, st.centre, rear]}>
              <ClassBadge letter={to} size="xl" />
            </Animated.View>
            {!reduced ? <Animated.View pointerEvents="none" style={[st.streak, streakStyle]} /> : null}
          </View>
          <Text style={[st.big, { color: CLASS_COLOURS[to] }]}>
            {from} › {to}
          </Text>
          <Text style={st.hint}>Your build moved up a class. Tap to carry on.</Text>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Event unlocked: dim, a scan sweeps round the lock, the pin swaps, a card rises.
// ---------------------------------------------------------------------------

export function UnlockReveal({ glyph, colour, title, onDone }: { glyph: Glyph; colour: string; title: string; onDone: () => void }) {
  const reduced = useReducedMotion();
  const dim = useSharedValue(0);
  const sweep = useSharedValue(0);
  const swap = useSharedValue(0);
  const card = useSharedValue(0);
  const out = useSharedValue(1);
  const done = useRef(false);
  const finish = () => {
    if (done.current) return;
    done.current = true;
    onDone();
  };

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    dim.value = withTiming(1, { duration: reduced ? 150 : 250 });
    if (reduced) {
      swap.value = 1;
      card.value = withTiming(1, { duration: 150 });
      timers.push(setTimeout(feel.success, 150));
    } else {
      sweep.value = withTiming(1, { duration: 700, easing: Easing.linear });
      swap.value = withDelay(700, withTiming(1, { duration: 300, easing: Easing.out(Easing.quad) }));
      card.value = withDelay(950, withTiming(1, { duration: 250, easing: Easing.bezier(0.2, 0.8, 0.2, 1) }));
      timers.push(setTimeout(feel.success, 700));
    }
    timers.push(setTimeout(() => (out.value = withTiming(0, { duration: 300 })), 2600));
    timers.push(setTimeout(finish, 2950));
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const wrap = useAnimatedStyle(() => ({ opacity: out.value }));
  const scrim = useAnimatedStyle(() => ({ opacity: 0.6 * dim.value }));
  const sweepStyle = useAnimatedStyle(() => ({
    opacity: sweep.value === 0 || sweep.value === 1 ? 0 : 1,
    transform: [{ rotate: `${360 * sweep.value}deg` }],
  }));
  const lockStyle = useAnimatedStyle(() => ({ opacity: 1 - swap.value }));
  const openStyle = useAnimatedStyle(() => (reduced ? { opacity: swap.value } : { opacity: swap.value, transform: [{ scale: 0.8 + 0.2 * swap.value }] }));
  const cardStyle = useAnimatedStyle(() => (reduced ? { opacity: card.value } : { opacity: card.value, transform: [{ translateY: 24 * (1 - card.value) }] }));
  const letters = useAnimatedStyle(() => ({ letterSpacing: reduced ? 2 : 2 + 4 * (1 - card.value) }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, wrap]}>
      <Pressable style={StyleSheet.absoluteFill} onPress={finish} accessibilityRole="button" accessibilityLabel={`Unlocked: ${title}. Tap to close.`}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: '#000' }, scrim]} />
        <View style={[StyleSheet.absoluteFill, st.centre]}>
          <View style={{ width: 96, height: 96, alignItems: 'center', justifyContent: 'center' }}>
            {!reduced ? (
              <Animated.View style={[StyleSheet.absoluteFill, { borderRadius: 48, borderWidth: 3, borderColor: 'transparent', borderTopColor: colour }, sweepStyle]} />
            ) : null}
            <Animated.View style={[StyleSheet.absoluteFill, st.centre, lockStyle]}>
              <Pin glyph="locked" colour={C.fog} size={56} />
            </Animated.View>
            <Animated.View style={[StyleSheet.absoluteFill, st.centre, openStyle]}>
              <Pin glyph={glyph} colour={colour} size={56} />
            </Animated.View>
          </View>
          <Animated.View style={[st.card, { borderLeftColor: colour }, cardStyle]}>
            <Animated.Text style={[st.cardEyebrow, { color: colour }, letters]}>Unlocked</Animated.Text>
            <Text style={st.cardTitle} numberOfLines={1}>{title}</Text>
          </Animated.View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const st = StyleSheet.create({
  circle: { position: 'absolute', width: 40, height: 40, borderRadius: 20, borderWidth: 2 },
  centre: { alignItems: 'center', justifyContent: 'center' },
  scrim: { backgroundColor: SURFACE.glassRaised, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24 },
  eyebrow: { fontFamily: F.labelBold, fontSize: TYPE.muted, color: BRAND, letterSpacing: 3, textTransform: 'uppercase' },
  big: { fontFamily: F.displayItalic, fontSize: 34 },
  hint: { fontFamily: F.body, fontSize: TYPE.muted, color: C.fog, textAlign: 'center' },
  streak: { position: 'absolute', top: -20, bottom: -20, width: 14, backgroundColor: 'rgba(255,255,255,0.75)' },
  card: {
    marginTop: 12, backgroundColor: SURFACE.glassRaised, borderColor: C.kerb, borderWidth: 1, borderLeftWidth: 3, borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 10, maxWidth: '86%', alignItems: 'center',
  },
  cardEyebrow: { fontFamily: F.labelBold, fontSize: TYPE.label, textTransform: 'uppercase' },
  cardTitle: { fontFamily: F.displayMed, fontSize: TYPE.heading, color: C.chalk, textTransform: 'uppercase' },
});
