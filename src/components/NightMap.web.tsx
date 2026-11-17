import { useEffect, useImperativeHandle, useState } from 'react';
import { Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';
import { C } from '../theme';
import { PulseRing } from './motion';
import { Pin } from './Pin';
import type { NightMapProps } from './mapTypes';

/**
 * Web preview stand-in for the map (react-native-maps has no web version).
 * A flat projection on a dark grid: good enough to check layouts in a browser.
 */
export function NightMap({
  ref, pins, paths = [], circles = [], centre: centreProp, span: spanProp = 0.6, onSelect, onLongPress, picked, onPressMap, recentreKey, onRegion, credit,
}: NightMapProps) {
  const [size, setSize] = useState({ w: 400, h: 700 });
  /** Set by the handle (e.g. locate me, search); cleared when the props move the map. */
  const [moved, setMoved] = useState<{ centre: NightMapProps['centre']; span: number } | null>(null);
  useEffect(() => setMoved(null), [centreProp.lat, centreProp.lng, spanProp, recentreKey]);
  useImperativeHandle(ref, () => ({ animateTo: (c, sp = spanProp) => setMoved({ centre: c, span: sp }) }), [spanProp]);
  const centre = moved?.centre ?? centreProp;
  const span = moved?.span ?? spanProp;
  // The stand-in map doesn't pan: it reports a new region whenever it's moved.
  useEffect(() => {
    onRegion?.({ centre, span });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [centre.lat, centre.lng, span]);
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
              strokeWidth={p.width ?? 4}
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
      {/* The stand-in can't pinch: zoom buttons, so zoom-dependent layers (cameras, circuit outlines) can be checked. */}
      <View style={{ position: 'absolute', right: 8, top: '42%', gap: 6 }}>
        {[
          { label: '+', factor: 0.5 },
          { label: '−', factor: 2 },
        ].map((z) => (
          <Pressable
            key={z.label}
            onPress={() => setMoved({ centre, span: Math.min(12, Math.max(0.005, span * z.factor)) })}
            accessibilityRole="button"
            accessibilityLabel={z.factor < 1 ? 'Zoom in' : 'Zoom out'}
            style={{ width: 32, height: 32, borderRadius: 6, borderWidth: 1, borderColor: C.kerb, backgroundColor: 'rgba(11,15,23,0.9)', alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={{ color: C.chalk, fontSize: 18 }}>{z.label}</Text>
          </Pressable>
        ))}
      </View>
      {credit ? (
        <View pointerEvents="none" style={{ position: 'absolute', right: 4, bottom: 4, backgroundColor: 'rgba(11,15,23,0.75)', borderRadius: 3, paddingHorizontal: 4, paddingVertical: 1 }}>
          <Text style={{ color: C.fog, fontSize: 9 }}>{credit}</Text>
        </View>
      ) : null}
    </View>
  );
}
