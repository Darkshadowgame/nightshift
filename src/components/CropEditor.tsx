import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Image, Modal, PanResponder, ScrollView, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ASPECTS,
  aspectRatio,
  dragCorner,
  fitAspect,
  fullBox,
  moveBox,
  nextRotation,
  rotateBoxClockwise,
  rotatedSize,
  scaleBox,
  type AspectKey,
  type Box,
  type Handle,
  type Rotation,
} from '../lib/crop';
import { C } from '../theme';
import { Button, Chip, Row, Txt } from './ui';

const HANDLE = 40;
const MARK = 20;

/**
 * Crop and turn a photo. Drag inside the box to move it, drag a corner to resize.
 * Pure React Native (PanResponder), so it ships over the air. The maths is in crop.ts.
 *
 * `saved`: the photo is one already kept (plates already blurred). The original
 * was never kept, so cropping it again works on what's saved.
 */
export function CropEditor({
  uri,
  width,
  height,
  saved,
  busy,
  initialAspect = 'free',
  onDone,
  onSkip,
  onCancel,
}: {
  uri: string;
  width?: number;
  height?: number;
  saved?: boolean;
  busy?: boolean;
  initialAspect?: AspectKey;
  onDone: (box: Box, rot: Rotation, viewW: number, viewH: number) => void;
  onSkip?: () => void;
  onCancel: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [size, setSize] = useState<{ w: number; h: number } | null>(width && height ? { w: width, h: height } : null);
  const [failed, setFailed] = useState(false);
  const [rot, setRot] = useState<Rotation>(0);
  const [aspect, setAspect] = useState<AspectKey>(initialAspect);
  const [box, setBox] = useState<Box | null>(null);
  const [stage, setStage] = useState({ w: 0, h: 0 });

  // The picker's size is usually right; a saved photo needs reading.
  useEffect(() => {
    if (size) return;
    let live = true;
    Image.getSize(
      uri,
      (w, h) => live && setSize({ w, h }),
      () => live && setFailed(true),
    );
    return () => {
      live = false;
    };
  }, [uri, size]);

  const view = size ? rotatedSize(size.w, size.h, rot) : { w: 1, h: 1 };
  const ratio = aspectRatio(aspect);
  useEffect(() => {
    if (size && !box) setBox(fitAspect(size.w, size.h, aspectRatio(initialAspect)));
  }, [size, box, initialAspect]);

  const scale = size && stage.w > 0 ? Math.min(stage.w / view.w, stage.h / view.h) : 0;
  const dispW = view.w * scale;
  const dispH = view.h * scale;

  // Gestures read the latest values through a ref, so the responders are made once.
  const live = useRef({ box, scale, W: view.w, H: view.h, ratio });
  live.current = { box, scale, W: view.w, H: view.h, ratio };
  const start = useRef<Box | null>(null);
  const responders = useMemo(() => {
    const make = (kind: 'move' | Handle) =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onShouldBlockNativeResponder: () => true,
        onPanResponderGrant: () => {
          start.current = live.current.box;
        },
        onPanResponderMove: (_e, g) => {
          const L = live.current;
          const s = start.current;
          if (!s || !L.scale) return;
          const dx = g.dx / L.scale;
          const dy = g.dy / L.scale;
          setBox(kind === 'move' ? moveBox(s, dx, dy, L.W, L.H) : dragCorner(s, kind, dx, dy, L.W, L.H, L.ratio));
        },
      });
    return { move: make('move'), tl: make('tl'), tr: make('tr'), bl: make('bl'), br: make('br') };
  }, []);

  function pickAspect(k: AspectKey) {
    setAspect(k);
    if (box) setBox(fitAspect(view.w, view.h, aspectRatio(k), box));
  }

  function rotate() {
    if (!box) return;
    const next = nextRotation(rot);
    const turned = rotateBoxClockwise(box, view.h);
    // The image is now view.h x view.w; a fixed shape keeps its shape the right way up.
    setRot(next);
    setBox(ratio == null ? turned : fitAspect(view.h, view.w, ratio, turned));
  }

  function reset() {
    if (!size) return;
    setRot(0);
    setAspect('free');
    setBox(fullBox(size.w, size.h));
  }

  const onStage = (e: LayoutChangeEvent) => setStage({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height });
  const b = box && scale ? { x: box.x * scale, y: box.y * scale, w: box.w * scale, h: box.h * scale } : null;
  // The photo is drawn unrotated, then turned about its centre to fill the view box.
  const imgW = rot % 180 ? dispH : dispW;
  const imgH = rot % 180 ? dispW : dispH;

  return (
    <Modal visible animationType="slide" presentationStyle="fullScreen" onRequestClose={onCancel}>
      <View style={[st.screen, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 8 }]}>
        <View style={{ paddingHorizontal: 16, gap: 4 }}>
          <Txt v="h3">{saved ? 'Crop or rotate photo' : 'Crop the photo'}</Txt>
          <Txt v="muted" style={{ fontSize: 13 }}>
            {saved
              ? "This changes the saved photo. Originals aren't kept, so anything cropped off now can't be got back, and blurred plates stay blurred."
              : 'Drag the box to move it, or a corner to resize. Plates are checked on the cropped photo next.'}
          </Txt>
        </View>

        <View style={st.stage} onLayout={onStage}>
          {failed ? (
            <Txt v="muted">Couldn't open that photo.</Txt>
          ) : !size || !b ? (
            <ActivityIndicator color={C.sodium} />
          ) : (
            <View style={{ width: dispW, height: dispH }}>
              <Image
                source={{ uri }}
                style={{ position: 'absolute', left: (dispW - imgW) / 2, top: (dispH - imgH) / 2, width: imgW, height: imgH, transform: [{ rotate: `${rot}deg` }] }}
                resizeMode="stretch"
                accessibilityIgnoresInvertColors
              />
              {/* Shade outside the crop. */}
              <View pointerEvents="none" style={[st.shade, { left: 0, top: 0, width: dispW, height: b.y }]} />
              <View pointerEvents="none" style={[st.shade, { left: 0, top: b.y + b.h, width: dispW, height: dispH - b.y - b.h }]} />
              <View pointerEvents="none" style={[st.shade, { left: 0, top: b.y, width: b.x, height: b.h }]} />
              <View pointerEvents="none" style={[st.shade, { left: b.x + b.w, top: b.y, width: dispW - b.x - b.w, height: b.h }]} />
              <View
                {...responders.move.panHandlers}
                style={[st.box, { left: b.x, top: b.y, width: b.w, height: b.h }]}
                accessible
                accessibilityRole="adjustable"
                accessibilityLabel="Crop area"
                accessibilityHint="Drag to move. Swipe up or down to make it bigger or smaller."
                accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
                onAccessibilityAction={(e) => box && setBox(scaleBox(box, e.nativeEvent.actionName === 'increment' ? 1.1 : 0.9, view.w, view.h))}
              >
                {/* Rule of thirds. */}
                <View pointerEvents="none" style={[st.gridV, { left: '33.33%' }]} />
                <View pointerEvents="none" style={[st.gridV, { left: '66.66%' }]} />
                <View pointerEvents="none" style={[st.gridH, { top: '33.33%' }]} />
                <View pointerEvents="none" style={[st.gridH, { top: '66.66%' }]} />
              </View>
              {(['tl', 'tr', 'bl', 'br'] as Handle[]).map((h) => {
                const left = h === 'tl' || h === 'bl';
                const top = h === 'tl' || h === 'tr';
                return (
                  <View
                    key={h}
                    {...responders[h].panHandlers}
                    style={[st.handle, { left: (left ? b.x : b.x + b.w) - HANDLE / 2, top: (top ? b.y : b.y + b.h) - HANDLE / 2 }]}
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                  >
                    <View pointerEvents="none" style={[st.markH, { [left ? 'left' : 'right']: HANDLE / 2 - 3, [top ? 'top' : 'bottom']: HANDLE / 2 - 3 }]} />
                    <View pointerEvents="none" style={[st.markV, { [left ? 'left' : 'right']: HANDLE / 2 - 3, [top ? 'top' : 'bottom']: HANDLE / 2 - 3 }]} />
                  </View>
                );
              })}
            </View>
          )}
        </View>

        <View style={{ gap: 10 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingHorizontal: 16 }}>
            {ASPECTS.map((a) => (
              <Chip key={a.key} label={a.label} on={aspect === a.key} onPress={() => pickAspect(a.key)} />
            ))}
          </ScrollView>
          <Row style={{ flexWrap: 'nowrap', paddingHorizontal: 16 }}>
            <Button label="Rotate 90°" kind="ghost" onPress={rotate} disabled={!box || busy} style={{ flex: 1 }} accessibilityLabel="Rotate 90 degrees clockwise" />
            <Button label="Reset" kind="ghost" onPress={reset} disabled={!box || busy} style={{ flex: 1 }} />
          </Row>
          <Row style={{ flexWrap: 'nowrap', paddingHorizontal: 16 }}>
            <Button
              label={busy ? 'Cropping…' : saved ? 'Save crop' : 'Use this crop'}
              onPress={() => box && onDone(box, rot, view.w, view.h)}
              busy={busy}
              disabled={!box}
              style={{ flex: 1 }}
            />
            {onSkip ? <Button label="Skip crop" kind="ghost" onPress={onSkip} disabled={busy} /> : null}
            <Button label="Cancel" kind="ghost" onPress={onCancel} disabled={busy} />
          </Row>
        </View>
      </View>
    </Modal>
  );
}

const st = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.asphalt, gap: 12 },
  stage: { flex: 1, alignItems: 'center', justifyContent: 'center', margin: 24 },
  shade: { position: 'absolute', backgroundColor: 'rgba(5,8,14,0.66)' },
  box: { position: 'absolute', borderWidth: 1.5, borderColor: C.chalk },
  gridV: { position: 'absolute', top: 0, bottom: 0, width: StyleSheet.hairlineWidth, backgroundColor: 'rgba(233,237,244,0.55)' },
  gridH: { position: 'absolute', left: 0, right: 0, height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(233,237,244,0.55)' },
  handle: { position: 'absolute', width: HANDLE, height: HANDLE },
  markH: { position: 'absolute', width: MARK, height: 4, backgroundColor: C.sodium, borderRadius: 1 },
  markV: { position: 'absolute', width: 4, height: MARK, backgroundColor: C.sodium, borderRadius: 1 },
});
