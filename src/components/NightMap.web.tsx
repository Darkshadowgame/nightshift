import { useEffect, useImperativeHandle, useState } from 'react';
import { Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';
import { C } from '../theme';
import { PulseRing } from './motion';
import { Pin } from './Pin';
import type { NightMapProps } from './mapTypes';

/**
 * Web preview stand-in for the map (react-native-maps has no web version).
 * A flat projection on a dark grid: good enough to check layouts in a browser.
 */
export function NightMap({ ref, pins, paths = [], circles = [], centre: centreProp, span: spanProp = 0.6, onSelect, onLongPress, picked, onPressMap, recentreKey }: NightMapProps) {
  const [size, setSize] = useState({ w: 400, h: 700 });
  /** Set by the handle (e.g. locate me, search); cleared when the props move the map. */
  const [moved, setMoved] = useState<{ centre: NightMapProps['centre']; span: number } | null>(null);
  useEffect(() => setMoved(null), [centreProp.lat, centreProp.lng, spanProp, recentreKey]);
  useImperativeHandle(ref, () => ({ animateTo: (c, sp = spanProp) => setMoved({ centre: c, span: sp }) }), [spanProp]);
  const centre = moved?.centre ?? centreProp;
  const span = moved?.span ?? spanProp;
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width > 0 && height > 0) setSize({ w: width, h: height });
  };
  const latSpan = span;
  const lngSpan = (span * 1.6 * size.w) / Math.max(1, size.h);
  const x = (lng: number) => ((lng - (centre.lng - lngSpan / 2)) / lngSpan) * size.w;
  const y = (lat: number) => ((centre.lat + latSpan / 2 - lat) / latSpan) * size.h;
  const pxPerMile = size.h / (latSpan * 69);

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: '#080c13' }]} onLayout={onLayout}>
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={onPressMap}
        onLongPress={(e) => {
          if (!onLongPress) return;
          const { locationX, locationY } = e.nativeEvent;
          onLongPress({ lat: centre.lat + latSpan / 2 - (locationY / size.h) * latSpan, lng: centre.lng - lngSpan / 2 + (locationX / size.w) * lngSpan });
        }}
      >
        <Svg width={size.w} height={size.h}>
          {Array.from({ length: 12 }, (_, i) => (
            <Line key={`h${i}`} x1={0} x2={size.w} y1={(i * size.h) / 12} y2={(i * size.h) / 12} stroke="#141c2a" strokeWidth={1} />
          ))}
          {Array.from({ length: 8 }, (_, i) => (
            <Line key={`v${i}`} y1={0} y2={size.h} x1={(i * size.w) / 8} x2={(i * size.w) / 8} stroke="#141c2a" strokeWidth={1} />
          ))}
          {circles.map((c) => (
            <Circle key={c.id} cx={x(c.centre.lng)} cy={y(c.centre.lat)} r={c.radiusMiles * pxPerMile} fill={`${c.colour}1f`} stroke={`${c.colour}99`} />
          ))}
          {paths.map((p) => (
            <Polyline
              key={p.id}
              points={p.coords.map((q) => `${x(q.lng)},${y(q.lat)}`).join(' ')}
              stroke={p.colour}
              strokeWidth={4}
              fill="none"
              strokeDasharray={p.dashed ? '8 6' : undefined}
            />
          ))}
        </Svg>
      </Pressable>
      {pins.map((p) => {
        const sz = p.size ?? 36;
        const box = p.live ? sz * 2.2 : sz;
        return (
          <Pressable
            key={p.id}
            onPress={() => onSelect?.(p.id)}
            accessibilityRole="button"
            accessibilityLabel={p.live ? `${p.title}, live now` : p.title}
            style={{ position: 'absolute', left: x(p.at.lng) - box / 2, top: y(p.at.lat) - box / 2 }}
          >
            {p.live ? (
              <PulseRing live colour={p.colour} size={sz} pad>
                <Pin glyph={p.glyph} colour={p.colour} size={sz} />
              </PulseRing>
            ) : (
              <Pin glyph={p.glyph} colour={p.colour} size={sz} />
            )}
          </Pressable>
        );
      })}
      {picked ? (
        <View pointerEvents="none" style={{ position: 'absolute', left: x(picked.lng) - 20, top: y(picked.lat) - 20 }}>
          <Pin glyph="you" colour={C.neon} size={40} />
        </View>
      ) : null}
    </View>
  );
}
