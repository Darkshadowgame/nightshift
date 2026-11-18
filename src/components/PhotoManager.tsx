import { useState } from 'react';
import { Image, ScrollView, StyleSheet, View } from 'react-native';
import { makeFirst, moveItem } from '../lib/crop';
import { photoUri, plateRedactorAvailable } from '../lib/photos';
import { COLOR, RADII, SPACING } from '../theme';
import { Button, ConfirmBody, DsText, Press, Tag } from './ds';
import { usePhotoFlow } from './PhotoFlow';

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
    aspect: photos.length === 0 ? '4:3' : 'free',
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
    <View style={{ gap: SPACING.md }}>
      {photos.length > 0 ? (
        <ScrollView horizontal contentContainerStyle={{ gap: SPACING.sm }} showsHorizontalScrollIndicator={false}>
          {photos.map((p, i) => (
            <Press
              key={p}
              onPress={() => select(p)}
              state={{ selected: p === sel }}
              label={`Photo ${i + 1} of ${photos.length}${i === 0 ? ', cover' : ''}`}
              hint="Shows crop, plate, order and delete actions"
              style={[st.thumb, p === sel && st.thumbOn]}
            >
              <Image source={{ uri: photoUri(p) }} style={st.img} accessibilityIgnoresInvertColors />
              {i === 0 ? (
                <View style={st.cover}>
                  <Tag label="Cover" />
                </View>
              ) : null}
            </Press>
          ))}
        </ScrollView>
      ) : null}

      {sel && !flow.view ? (
        <View style={st.panel}>
          <DsText v="label">
            Photo {index + 1}
            {index === 0 ? ' · cover' : ''}
          </DsText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm }}>
            <Small label="Crop / rotate" onPress={() => flow.recrop(sel)} disabled={flow.busy} />
            {plateRedactorAvailable ? <Small label={flow.busy ? 'Checking…' : 'Re-check plates'} onPress={() => flow.recheck(sel)} disabled={flow.busy} /> : null}
            {index > 0 ? <Small label="Set as cover" onPress={() => reorder(makeFirst(photos, index))} /> : null}
            {index > 0 ? <Small label="Move left" onPress={() => reorder(moveItem(photos, index, -1))} accessibilityLabel="Move left" /> : null}
            {index < photos.length - 1 ? <Small label="Move right" onPress={() => reorder(moveItem(photos, index, 1))} accessibilityLabel="Move right" /> : null}
            <Small label="Delete" danger onPress={() => setConfirmDelete(true)} />
          </View>
          {confirmDelete ? (
            <ConfirmBody
              message={saveLater ? 'Remove this photo? Its file is deleted when you save the build.' : "Delete this photo? It can't be got back."}
              verb={saveLater ? 'Remove' : 'Delete'}
              onConfirm={remove}
              onCancel={() => setConfirmDelete(false)}
            />
          ) : null}
          <DsText v="caption">
            Edits work on the saved photo. Originals aren't kept, so blurred plates stay blurred and a crop can't be undone later.
          </DsText>
        </View>
      ) : null}

      {flow.view ?? (
        <Button label="Add a photo" icon="camera" tier="secondary" block onPress={() => flow.pick()} busy={flow.busy && !sel} />
      )}
    </View>
  );
}

function Small({ label, onPress, disabled, danger, accessibilityLabel }: { label: string; onPress: () => void; disabled?: boolean; danger?: boolean; accessibilityLabel?: string }) {
  return <Button label={label} onPress={onPress} disabled={disabled} tier={danger ? 'destructive' : 'secondary'} size="sm" accessibilityLabel={accessibilityLabel} />;
}

const st = StyleSheet.create({
  thumb: { borderRadius: RADII.control, borderWidth: 2, borderColor: 'transparent', overflow: 'hidden' },
  thumbOn: { borderColor: COLOR.text.primary },
  img: { width: 120, height: 90, backgroundColor: COLOR.surface.media },
  cover: { position: 'absolute', left: SPACING.xs, bottom: SPACING.xs, backgroundColor: COLOR.surface.glass, borderRadius: RADII.tag },
  panel: { gap: SPACING.md, padding: SPACING.md, borderRadius: RADII.card, borderWidth: 1, borderColor: COLOR.surface.border, backgroundColor: COLOR.surface.card },
});
