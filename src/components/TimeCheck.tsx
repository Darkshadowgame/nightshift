import { useMemo, useRef, useState } from 'react';
import { PanResponder, View, type LayoutChangeEvent } from 'react-native';
import { EVENING_MINUTES, EVENING_STEP, eveningTimes, onAtLine } from '../lib/mapNight';
import { clock } from '../lib/when';
import { COLOR, RADII, SPACING, themedStyles } from '../theme';
import { DsText, IconButton } from './ds';

const THUMB = 28;
const TRACK_H = 4;

/**
 * Time check (Meets): drag across the evening, 18:00 to 02:00, and the map fades the meets that
 * aren't on at that time. It sits in the sheet only while it's switched on (Layers › Meets › When ›
 * Check a time), so the default view has no extra control. The line under it says how many meets are
 * on, so the fade is never the only signal. VoiceOver: adjustable, half an hour a swipe.
 */
export function TimeCheck({ now, offset, count, onChange, onClose }: { now: Date; offset: number; count: number; onChange: (offset: number) => void; onClose: () => void }) {
  const [w, setW] = useState(0);
  const width = useRef(0);
  const live = useRef({ onChange, offset });
  live.current = { onChange, offset };
  const at = eveningTimes(now, offset);
  const pan = useMemo(() => {
    const move = (x: number) => {
      if (width.current <= THUMB) return;
      const frac = Math.min(1, Math.max(0, (x - THUMB / 2) / (width.current - THUMB)));
      live.current.onChange(frac * EVENING_MINUTES);
    };
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      // A drag along the track is ours, even inside the sheet.
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (e) => move(e.nativeEvent.locationX),
      onPanResponderMove: (e) => move(e.nativeEvent.locationX),
    });
  }, []);
  const snapped = Math.round(Math.min(EVENING_MINUTES, Math.max(0, offset)) / EVENING_STEP) * EVENING_STEP;
  const left = w > THUMB ? (snapped / EVENING_MINUTES) * (w - THUMB) : 0;
  return (
    <View style={st.box} testID="time-check">
      <View style={st.top}>
        <DsText v="label" style={{ flex: 1 }} accessibilityLiveRegion="polite">
          {onAtLine(count, at)}
        </DsText>
        <IconButton icon="close" label="Close time check" onPress={onClose} />
      </View>
      <View
        style={st.hit}
        onLayout={(e: LayoutChangeEvent) => {
          width.current = e.nativeEvent.layout.width;
          setW(e.nativeEvent.layout.width);
        }}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel="Time of evening"
        accessibilityValue={{ text: clock(at) }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(e) => live.current.onChange(live.current.offset + (e.nativeEvent.actionName === 'increment' ? EVENING_STEP : -EVENING_STEP))}
        {...pan.panHandlers}
      >
        <View style={st.track} pointerEvents="none" />
        <View style={[st.thumb, { left }]} pointerEvents="none" />
      </View>
      <View style={st.ends} pointerEvents="none">
        <DsText v="meta">18:00</DsText>
        <DsText v="meta">22:00</DsText>
        <DsText v="meta">02:00</DsText>
      </View>
    </View>
  );
}

const st = themedStyles(() => ({
  box: { gap: SPACING.xs, paddingVertical: SPACING.xs },
  top: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: SPACING.sm },
  hit: { height: 44, justifyContent: 'center' as const },
  track: { height: TRACK_H, borderRadius: RADII.tag, backgroundColor: COLOR.surface.borderStrong },
  thumb: {
    position: 'absolute' as const,
    top: (44 - THUMB) / 2,
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    backgroundColor: COLOR.text.primary,
    borderWidth: 2,
    borderColor: COLOR.surface.sheet,
  },
  ends: { flexDirection: 'row' as const, justifyContent: 'space-between' as const },
}));
