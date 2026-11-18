import { Image, Pressable, View } from 'react-native';
import { photoUri, plateRedactorAvailable } from '../lib/photos';
import type { Build } from '../lib/types';
import { C, RADIUS, STATE } from '../theme';
import { usePhotoFlow } from './PhotoFlow';
import { Button, Chip, Row, Txt } from './ui';

/**
 * Photos for a post, thread, reply or message: every one goes through the same
 * pick → crop → plate check → saved-without-metadata flow as build photos.
 */
export function ComposerPhotos({ photos, onChange, onError, max = 4 }: { photos: string[]; onChange: (p: string[]) => void; onError: (m: string | null) => void; max?: number }) {
  const flow = usePhotoFlow({ onError, onPhoto: (ref, replaces) => onChange(replaces ? photos.map((p) => (p === replaces ? ref : p)) : [...photos, ref].slice(0, max)) });
  if (flow.view) return <>{flow.view}</>;
  return (
    <View style={{ gap: 10 }}>
      {photos.length ? (
        <Row gap={8}>
          {photos.map((p) => (
            <View key={p}>
              <Image source={{ uri: photoUri(p) }} style={{ width: 84, height: 84, borderRadius: RADIUS.card, backgroundColor: C.kerb }} accessibilityLabel="Photo to post" accessibilityIgnoresInvertColors />
              <Pressable
                onPress={() => onChange(photos.filter((x) => x !== p))}
                accessibilityRole="button"
                accessibilityLabel="Remove this photo"
                hitSlop={8}
                style={{ position: 'absolute', right: -6, top: -6, width: 26, height: 26, borderRadius: 13, backgroundColor: C.asphalt, borderWidth: 1, borderColor: STATE.danger, alignItems: 'center', justifyContent: 'center' }}
              >
                <Txt v="label" style={{ color: STATE.danger }}>×</Txt>
              </Pressable>
            </View>
          ))}
        </Row>
      ) : null}
      {photos.length < max ? (
        <Row style={{ flexWrap: 'nowrap' }}>
          <Button label="Camera" kind="secondary" size="sm" style={{ flex: 1 }} onPress={() => flow.pick(true)} disabled={flow.busy} />
          <Button label="Library" kind="secondary" size="sm" style={{ flex: 1 }} onPress={() => flow.pick(false)} disabled={flow.busy} />
        </Row>
      ) : null}
      <Txt v="caption">
        {plateRedactorAvailable ? 'Number plates are found and blurred before anything is shared; check the boxes when asked.' : 'Photos are saved without location data.'} Up to {max}.
      </Txt>
    </View>
  );
}

/** Link one of your builds (or none). */
export function BuildChooser({ builds, value, onChange }: { builds: Build[]; value?: string; onChange: (id: string | undefined) => void }) {
  if (!builds.length) return <Txt v="caption">Add a car or bike in your garage to link it.</Txt>;
  return (
    <Row>
      <Chip label="None" on={!value} onPress={() => onChange(undefined)} />
      {builds.map((b) => (
        <Chip key={b.id} raw label={`${b.make} ${b.model}`} on={value === b.id} onPress={() => onChange(value === b.id ? undefined : b.id)} />
      ))}
    </Row>
  );
}
