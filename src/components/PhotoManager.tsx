import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { makeFirst, moveItem } from '../lib/crop';
import { photoUri, plateRedactorAvailable } from '../lib/photos';
import { BRAND, C, F, FONT_SCALE, RADIUS, STATE, SURFACE, TYPE } from '../theme';
import { usePhotoFlow } from './PhotoFlow';
import { Button, Card, ConfirmBox, Row, Txt } from './ui';

/**
 * A build's photos with their actions: add (pick → crop → plate check), crop or
 * rotate again, re-check plates, set as cover, move, delete. The first photo is
 * the cover.
 *
 * `saveLater`: the build editor, where changes are kept when the build is
 * saved (and the store deletes files taken off). Otherwise each change is
 * saved straight away through onChange.
 */
export function PhotoManager({
  photos,
  onChange,
  onError,
  saveLater,
}: {
  photos: string[];
  onChange: (next: string[]) => void;
  onError: (message: string | null) => void;
  saveLater?: boolean;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const flow = usePhotoFlow({
    onError,
    // A build's first photo becomes the garage card's cover: start the crop on the Cover shape.
    aspect: photos.length === 0 ? 'cover' : 'free',
    onPhoto: (ref, replaces) => {
      if (replaces) {
        onChange(photos.map((p) => (p === replaces ? ref : p)));
        if (selected === replaces) setSelected(ref);
      } else {
        onChange([...photos, ref]);
      }
    },
  });

  const index = selected ? photos.indexOf(selected) : -1;
  const sel = index >= 0 ? selected : null;

  function select(p: string) {
    setConfirmDelete(false);
    setSelected((s) => (s === p ? null : p));
  }

  function reorder(next: string[]) {
    setConfirmDelete(false);
    onChange(next);
  }

  function remove() {
    if (!sel) return;
    onChange(photos.filter((p) => p !== sel));
    setSelected(null);
    setConfirmDelete(false);
  }

  return (
    <View style={{ gap: 10 }}>
      {photos.length > 0 ? (
        <ScrollView horizontal contentContainerStyle={{ gap: 8 }} showsHorizontalScrollIndicator={false}>
          {photos.map((p, i) => (
            <Pressable
              key={p}
              onPress={() => select(p)}
              accessibilityRole="button"
              accessibilityState={{ selected: p === sel }}
              accessibilityLabel={`Photo ${i + 1} of ${photos.length}${i === 0 ? ', cover' : ''}`}
              accessibilityHint="Shows crop, plate, order and delete actions"
              style={[st.thumb, p === sel && st.thumbOn]}
            >
              <Image source={{ uri: photoUri(p) }} style={st.img} accessibilityIgnoresInvertColors />
              {i === 0 ? <Text style={st.cover}>Cover</Text> : null}
            </Pressable>
          ))}
        </ScrollView>
      ) : null}

      {sel && !flow.view ? (
        <Card accent={BRAND}>
          <Txt v="label">Photo {index + 1}{index === 0 ? ' · cover' : ''}</Txt>
          <Row gap={6}>
            <Small label="Crop / rotate" onPress={() => flow.recrop(sel)} disabled={flow.busy} />
            {plateRedactorAvailable ? <Small label={flow.busy ? 'Checking…' : 'Re-check plates'} onPress={() => flow.recheck(sel)} disabled={flow.busy} /> : null}
            {index > 0 ? <Small label="Set as cover" onPress={() => reorder(makeFirst(photos, index))} /> : null}
            {index > 0 ? <Small label="‹ Move left" onPress={() => reorder(moveItem(photos, index, -1))} accessibilityLabel="Move left" /> : null}
            {index < photos.length - 1 ? <Small label="Move right ›" onPress={() => reorder(moveItem(photos, index, 1))} accessibilityLabel="Move right" /> : null}
            <Small label="Delete" danger onPress={() => setConfirmDelete(true)} />
          </Row>
          {confirmDelete ? (
            <ConfirmBox
              message={saveLater ? 'Remove this photo? Its file is deleted when you save the build.' : "Delete this photo? It can't be got back."}
              verb={saveLater ? 'Remove' : 'Delete'}
              onConfirm={remove}
              onCancel={() => setConfirmDelete(false)}
            />
          ) : null}
          <Txt v="caption">
            Edits work on the saved photo. Originals aren't kept, so blurred plates stay blurred and a crop can't be undone later.
            {plateRedactorAvailable ? '' : ' (Re-checking plates needs the iPhone app.)'}
          </Txt>
        </Card>
      ) : null}

      {flow.view ?? (
        <Button label={flow.busy ? 'Checking for plates…' : '+ Add a photo'} kind="secondary" onPress={() => flow.pick()} busy={flow.busy && !sel} />
      )}
    </View>
  );
}

function Small({ label, onPress, disabled, danger, accessibilityLabel }: { label: string; onPress: () => void; disabled?: boolean; danger?: boolean; accessibilityLabel?: string }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!disabled }}
      hitSlop={4}
      style={({ pressed }) => [st.small, danger && { borderColor: STATE.danger }, disabled && { backgroundColor: C.kerb, borderColor: C.kerb }, pressed && { opacity: 0.8 }]}
    >
      <Text maxFontSizeMultiplier={FONT_SCALE.chrome} style={[st.smallText, danger && { color: STATE.danger }, disabled && { color: C.fog }]}>{label}</Text>
    </Pressable>
  );
}

const st = StyleSheet.create({
  thumb: { borderRadius: 8, borderWidth: 2, borderColor: 'transparent', overflow: 'hidden' },
  thumbOn: { borderColor: BRAND },
  img: { width: 110, height: 80 },
  cover: {
    position: 'absolute', left: 4, bottom: 4, fontFamily: F.labelBold, fontSize: TYPE.micro, letterSpacing: 1.2, color: C.ink, backgroundColor: BRAND,
    paddingHorizontal: 5, paddingVertical: 1, borderRadius: 3, overflow: 'hidden', textTransform: 'uppercase',
  },
  small: { borderWidth: 1, borderColor: SURFACE.borderStrong, borderRadius: RADIUS.card, paddingHorizontal: 10, paddingVertical: 8, minHeight: 40, justifyContent: 'center' },
  smallText: { fontFamily: F.label, fontSize: TYPE.caption, letterSpacing: 0.8, color: C.chalk, textTransform: 'uppercase' },
});
