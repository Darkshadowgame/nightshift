import { useState } from 'react';
import { Image, Pressable, View, type LayoutChangeEvent } from 'react-native';
import type { PlateBox } from '../../modules/plate-redactor';
import { COLOR, RADII, SPACING } from '../theme';
import { Button, DsText } from './ds';

export interface PendingPhoto {
  uri: string;
  width: number;
  height: number;
  boxes: PlateBox[];
}

/**
 * Check the plate boxes before a photo is saved.
 * Tap a box to remove it, tap anywhere else to add one there.
 *
 * `recheck`: the photo is already saved and blurred. Blur in it stays (it's in
 * the pixels); this can only add more.
 */
export function PlateReview({
  photo,
  onDone,
  onCancel,
  busy,
  recheck,
  progress,
  onStopAll,
}: {
  photo: PendingPhoto;
  onDone: (boxes: PlateBox[]) => void;
  onCancel: () => void;
  busy?: boolean;
  recheck?: boolean;
  /** One of several picked at once: "Photo 2 of 5". Cancel then skips just this one. */
  progress?: string;
  /** Several picked and more to come: drop this one and the rest. */
  onStopAll?: () => void;
}) {
  const [boxes, setBoxes] = useState<PlateBox[]>(photo.boxes);
  const [frame, setFrame] = useState({ w: 1, h: 1 });
  const aspect = photo.width / Math.max(1, photo.height);

  const onLayout = (e: LayoutChangeEvent) => setFrame({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height });

  function addAt(px: number, py: number) {
    const w = 0.22;
    const h = 0.07 * aspect;
    const x = Math.min(1 - w, Math.max(0, px / frame.w - w / 2));
    const y = Math.min(1 - h, Math.max(0, py / frame.h - h / 2));
    setBoxes((b) => [...b, { x, y, w, h }]);
  }

  return (
    <View style={{ gap: SPACING.md, padding: SPACING.lg, borderRadius: RADII.card, borderWidth: 1, borderColor: COLOR.surface.border, backgroundColor: COLOR.surface.card }}>
      {progress ? (
        <DsText v="label" accessibilityLiveRegion="polite">
          {progress}
        </DsText>
      ) : null}
      <DsText v="title" accessibilityRole="header">
        {recheck ? 'Add more plate blur' : 'Check the number plates'}
      </DsText>
      <DsText v="secondary">
        {recheck
          ? `Blur already in this photo stays. ${photo.boxes.length > 0 ? `We found ${photo.boxes.length} more to cover. ` : ''}Tap any plate that still shows to cover it, or a box to remove it.`
          : photo.boxes.length > 0
          ? `We found ${photo.boxes.length} plate${photo.boxes.length > 1 ? 's' : ''}. Tap a box to remove it, or tap a missed plate to cover it.`
          : "We didn't find a plate. Check the photo and tap any plate to cover it before saving."}
      </DsText>
      <View style={{ width: '100%', aspectRatio: aspect, borderRadius: RADII.control, overflow: 'hidden', backgroundColor: COLOR.surface.media }} onLayout={onLayout}>
        <Pressable style={{ flex: 1 }} onPress={(e) => addAt(e.nativeEvent.locationX, e.nativeEvent.locationY)} accessibilityLabel="Photo. Tap to add a blur box">
          <Image source={{ uri: photo.uri }} style={{ width: '100%', height: '100%' }} />
        </Pressable>
        {boxes.map((b, i) => (
          <Pressable
            key={`${i}-${b.x}-${b.y}`}
            onPress={() => setBoxes((xs) => xs.filter((_, j) => j !== i))}
            accessibilityLabel="Blur box. Tap to remove"
            style={{
              position: 'absolute',
              left: b.x * frame.w,
              top: b.y * frame.h,
              width: b.w * frame.w,
              height: b.h * frame.h,
              backgroundColor: COLOR.surface.media,
              opacity: 0.9,
              borderWidth: 2,
              borderColor: COLOR.state.danger,
            }}
          />
        ))}
      </View>
      <DsText v="caption">We try to blur plates automatically, but check before saving. The original photo isn't kept.</DsText>
      <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
        <Button
          label={recheck ? (boxes.length ? `Blur ${boxes.length} and save` : 'Nothing to add') : `Blur ${boxes.length} and add`}
          onPress={() => onDone(boxes)}
          busy={busy}
          haptic="success"
          block
          style={{ flex: 1 }}
        />
        <Button label={progress ? 'Skip this photo' : 'Cancel'} tier="secondary" onPress={onCancel} />
      </View>
      {onStopAll ? <Button label="Don't add the rest" tier="tertiary" size="sm" onPress={onStopAll} style={{ alignSelf: 'center' }} /> : null}
    </View>
  );
}
