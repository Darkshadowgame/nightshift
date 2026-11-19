import { useEffect, useRef } from 'react';
import { Animated, Easing, ScrollView, StyleSheet, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { startLabel } from '../lib/autoStart';
import type { RouteCard } from '../lib/routeChoice';
import { COLOR, RADII, ROAD_COLOUR, SPACING } from '../theme';
import { ActionBar, ChoiceGroup, DsText } from './ds';

/**
 * The route preview before the driving view starts talking (Waze and Google Maps style): the
 * whole route on the map with live traffic, the time, distance and arrival, any road reports
 * and closures on it, and, when Apple gives more than one (build 15 on), up to three routes to
 * pick from. One primary: Start (Redesign 2, 4.3), in the ActionBar.
 */
export function RoutePreview({
  time,
  distance,
  eta,
  trafficNote,
  cards,
  chosen,
  onChoose,
  troubles,
  advisories,
  onStart,
  onCancel,
  countdown,
  onTouch,
}: {
  /** Auto-start (one route only): seconds left on Start, or null when not counting. */
  countdown?: number | null;
  /** Any touch on the panel: stops the countdown. */
  onTouch?: () => void;
  /** "18 min". */
  time: string;
  /** "7.2 mi". */
  distance: string;
  /** "21:42". */
  eta: string;
  /** What the time includes: live traffic, or traffic on the map only. */
  trafficNote: string;
  /** Two or more: the route cards. One or none: just the route. */
  cards: RouteCard[];
  chosen: number;
  onChoose: (i: number) => void;
  /** "Crash reported · 1.2 mi along" for the chosen route. */
  troubles: string[];
  advisories: string[];
  onStart: () => void;
  onCancel: () => void;
}) {
  const reduced = useReducedMotion();
  const counting = countdown != null && countdown > 0;
  // The bar fills over the 5 seconds (text only with Reduce Motion on).
  const fill = useRef(new Animated.Value(0)).current;
  const started = useRef(false);
  useEffect(() => {
    if (!counting) {
      fill.stopAnimation();
      started.current = false;
      return;
    }
    if (reduced || started.current) return;
    started.current = true;
    fill.setValue(0);
    Animated.timing(fill, { toValue: 1, duration: countdown! * 1000, easing: Easing.linear, useNativeDriver: false }).start();
  }, [counting, reduced, countdown, fill]);
  return (
    <View style={st.panel} onTouchStart={onTouch}>
      <ScrollView style={{ maxHeight: 320 }} contentContainerStyle={st.body}>
        <View style={st.summary} accessible accessibilityLabel={`${time}, ${distance}. Arrive at ${eta}.`}>
          <DsText v="driveReadout">{time}</DsText>
          <DsText v="driveBody" tone="secondary">
            {distance} · Arrive {eta}
          </DsText>
        </View>
        <DsText v="caption">{trafficNote}</DsText>
        {cards.length > 1 ? (
          <ChoiceGroup
            label="Routes"
            layout="list"
            value={String(chosen)}
            onChange={(k) => onChoose(Number(k))}
            options={cards.map((c) => ({ key: String(c.index), label: c.title, hint: c.note ? `${c.distance} · ${c.note}` : c.distance }))}
          />
        ) : null}
        <View style={{ gap: SPACING.xxs }}>
          {troubles.length ? (
            troubles.map((t) => (
              <View key={t} style={st.trouble}>
                <View style={st.dot} />
                <DsText v="body" style={{ flex: 1 }}>
                  {t}
                </DsText>
              </View>
            ))
          ) : (
            <DsText v="secondary">No road reports or closures on this route.</DsText>
          )}
          {advisories.map((a) => (
            <DsText key={a} v="caption">
              {a}
            </DsText>
          ))}
        </View>
      </ScrollView>
      {counting && !reduced ? (
        <View style={st.track} aria-hidden>
          <Animated.View style={[st.bar, { width: fill.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
        </View>
      ) : null}
      <ActionBar
        primary={{
          label: startLabel(counting ? countdown! : null),
          onPress: onStart,
          haptic: 'success',
          accessibilityHint: counting ? `Starts by itself in ${countdown} seconds. Touch anything to stay here.` : undefined,
        }}
        secondary={{ label: 'Not now', onPress: onCancel }}
      />
    </View>
  );
}

const st = StyleSheet.create({
  panel: { backgroundColor: COLOR.surface.bg, borderTopWidth: 1, borderTopColor: COLOR.surface.border },
  body: { paddingHorizontal: SPACING.screen, paddingTop: SPACING.md, gap: SPACING.sm },
  summary: { flexDirection: 'row', alignItems: 'baseline', gap: SPACING.sm, flexWrap: 'wrap' },
  trouble: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  track: { height: 4, marginHorizontal: SPACING.screen, marginTop: SPACING.sm, borderRadius: RADII.pill, backgroundColor: COLOR.surface.raised, overflow: 'hidden' },
  bar: { height: 4, borderRadius: RADII.pill, backgroundColor: COLOR.text.primary },
  dot: { width: 10, height: 10, borderRadius: RADII.pill, backgroundColor: ROAD_COLOUR },
});
