import { useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Line, Polygon, Polyline } from 'react-native-svg';
import { ART, BRAND, C, RADII, SPACING, SURFACE } from '../theme';
import { DsText } from './ds/Text';
import { PulseRing } from './motion';
import { Pin } from './Pin';
import type { NightMapProps } from './mapTypes';

/**
 * Web preview stand-in for the map (react-native-maps has no web version).
 * A flat projection on a dark grid: good enough to check layouts in a browser.
 */
export function NightMap({
  ref, pins, paths = [], circles = [], polygons = [], centre: centreProp, span: spanProp = 0.6, onSelect, onLongPress, picked, onPressMap, recentreKey, onRegion, credit,
}: NightMapProps) {
  const [size, setSize] = useState({ w: 400, h: 700 });
  /** Set by the handle (e.g. locate me, search); cleared when the props move the map. */
  const [moved, setMoved] = useState<{ centre: NightMapProps['centre']; span: number } | null>(null);
  useEffect(() => setMoved(null), [centreProp.lat, centreProp.lng, spanProp, recentreKey]);
  const centre = moved?.centre ?? centreProp;
  const span = moved?.span ?? spanProp;
  useImperativeHandle(
    ref,
    () => ({ animateTo: (c, sp = spanProp) => setMoved({ centre: c, span: sp }), region: () => ({ centre, span }) }),
    [spanProp, centre, span],
  );
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
  const box = useRef<unknown>(null);
  /** Screen point to map point. A browser click has no locationX, so measure it from the map's box. */
  const at = (e: { locationX?: number; locationY?: number; clientX?: number; clientY?: number }) => {
    let lx = e.locationX;
    let ly = e.locationY;
    const el = box.current as unknown as { getBoundingClientRect?: () => { left: number; top: number } } | null;
    if ((typeof lx !== 'number' || typeof ly !== 'number') && el?.getBoundingClientRect && e.clientX !== undefined && e.clientY !== undefined) {
      const r = el.getBoundingClientRect();
      lx = e.clientX - r.left;
      ly = e.clientY - r.top;
    }
    return {
      lat: centre.lat + latSpan / 2 - ((ly ?? size.h / 2) / size.h) * latSpan,
      lng: centre.lng - lngSpan / 2 + ((lx ?? size.w / 2) / size.w) * lngSpan,
    };
  };

  return (
    <View ref={box as never} style={[StyleSheet.absoluteFill, { backgroundColor: ART.mapBg }]} onLayout={onLayout}>
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={onPressMap ? (e) => onPressMap(at(e.nativeEvent as never)) : undefined}
        onLongPress={onLongPress ? (e) => onLongPress(at(e.nativeEvent as never)) : undefined}
      >
        <Svg width={size.w} height={size.h}>
          {Array.from({ length: 12 }, (_, i) => (
            <Line key={`h${i}`} x1={0} x2={size.w} y1={(i * size.h) / 12} y2={(i * size.h) / 12} stroke={ART.mapGrid} strokeWidth={1} />
          ))}
          {Array.from({ length: 8 }, (_, i) => (
            <Line key={`v${i}`} y1={0} y2={size.h} x1={(i * size.w) / 8} x2={(i * size.w) / 8} stroke={ART.mapGrid} strokeWidth={1} />
          ))}
          {polygons.map((p) => (
            <Polygon key={p.id} points={p.coords.map((q) => `${x(q.lng)},${y(q.lat)}`).join(' ')} fill={`${p.colour}1f`} stroke={`${p.colour}99`} />
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
            accessibilityLabel={p.live ? `${p.title}, live now` : p.count ? `${p.count} ${p.title}. Zoom in` : p.title}
            style={{ position: 'absolute', left: x(p.at.lng) - box / 2, top: y(p.at.lat) - box / 2 }}
          >
            {p.live ? (
              <PulseRing live colour={p.colour} size={sz} pad>
                <Pin glyph={p.glyph} colour={p.colour} size={sz} />
              </PulseRing>
            ) : (
              <Pin glyph={p.glyph} colour={p.colour} size={sz} count={p.count} badge={p.badge} />
            )}
          </Pressable>
        );
      })}
      {picked ? (
        <View pointerEvents="none" style={{ position: 'absolute', left: x(picked.lng) - 20, top: y(picked.lat) - 20 }}>
          <Pin glyph="you" colour={BRAND} size={40} />
        </View>
      ) : null}
      {/* The stand-in can't pinch: zoom buttons, so zoom-dependent layers (cameras, circuit outlines) can be checked. */}
      {/* Top left: clear of the layers, locate and fit stack on the right (REVIEW-7 bug 2), and of the sheet even
          when the first-run card makes it tall on a 375x667 phone (REVIEW-8 bug 12). */}
      <View style={{ position: 'absolute', left: SPACING.sm, top: SPACING.sm, gap: SPACING.xs }}>
        {[
          { label: '+', factor: 0.5 },
          { label: '−', factor: 2 },
        ].map((z) => (
          <Pressable
            key={z.label}
            onPress={() => setMoved({ centre, span: Math.min(12, Math.max(0.005, span * z.factor)) })}
            accessibilityRole="button"
            accessibilityLabel={z.factor < 1 ? 'Zoom in' : 'Zoom out'}
            style={{ width: 44, height: 44, borderRadius: RADII.control, borderWidth: 1, borderColor: C.kerb, backgroundColor: SURFACE.glass, alignItems: 'center', justifyContent: 'center' }}
          >
            <DsText v="stat">{z.label}</DsText>
          </Pressable>
        ))}
      </View>
      {credit ? (
        <View pointerEvents="none" style={{ position: 'absolute', right: SPACING.xs, bottom: SPACING.xs, backgroundColor: SURFACE.glass, borderRadius: RADII.tag, paddingHorizontal: SPACING.xs, paddingVertical: SPACING.xxs }}>
          <DsText v="meta" tone="secondary">
            {credit}
          </DsText>
        </View>
      ) : null}
    </View>
  );
}
