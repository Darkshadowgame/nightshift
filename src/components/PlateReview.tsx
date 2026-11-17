import { useState } from 'react';
import { Image, Pressable, View, type LayoutChangeEvent } from 'react-native';
import type { PlateBox } from '../../modules/plate-redactor';
import { BRAND, STATE } from '../theme';
import { Button, Card, Row, Txt } from './ui';

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
}: {
  photo: PendingPhoto;
  onDone: (boxes: PlateBox[]) => void;
  onCancel: () => void;
  busy?: boolean;
  recheck?: boolean;
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
    <Card accent={BRAND}>
      <Txt v="h3">{recheck ? 'Add more plate blur' : 'Check the number plates'}</Txt>
      <Txt v="muted">
        {recheck
          ? `Blur already in this photo stays. ${photo.boxes.length > 0 ? `We found ${photo.boxes.length} more to cover. ` : ''}Tap any plate that still shows to cover it, or a box to remove it.`
          : photo.boxes.length > 0
          ? `We found ${photo.boxes.length} plate${photo.boxes.length > 1 ? 's' : ''}. Tap a box to remove it, or tap a missed plate to cover it.`
          : "We didn't find a plate. Check the photo and tap any plate to cover it before saving."}
      </Txt>
      <View style={{ width: '100%', aspectRatio: aspect, borderRadius: 6, overflow: 'hidden' }} onLayout={onLayout}>
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
              backgroundColor: 'rgba(17,24,39,0.85)',
              borderWidth: 2,
              borderColor: STATE.danger,
            }}
          />
        ))}
      </View>
      <Txt v="caption">We try to blur plates automatically, but check before saving. The original photo isn't kept.</Txt>
      <Row style={{ flexWrap: 'nowrap' }}>
        <Button label={busy ? 'Blurring…' : recheck ? (boxes.length ? `Blur ${boxes.length} and save` : 'Nothing to add') : `Blur ${boxes.length} and add`} onPress={() => onDone(boxes)} busy={busy} style={{ flex: 1 }} />
        <Button label="Cancel" kind="secondary" onPress={onCancel} />
      </Row>
    </Card>
  );
}
