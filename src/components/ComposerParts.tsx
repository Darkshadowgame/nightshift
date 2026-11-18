import type { ReactNode } from 'react';
import { Image, View, type TextStyle } from 'react-native';
import { photoUri, plateRedactorAvailable } from '../lib/photos';
import type { Build } from '../lib/types';
import { COLOR, RADII, SPACING } from '../theme';
import { Button, ChoiceGroup, DsText, Icon, Press, typeStyle } from './ds';
import { usePhotoFlow } from './PhotoFlow';

/** The text box style for composers (posts, threads, replies, chats): input type, strong border, control radius. */
export const INPUT: TextStyle = {
  ...typeStyle('input'),
  minHeight: 48,
  borderWidth: 1,
  borderColor: COLOR.surface.borderStrong,
  borderRadius: RADII.control,
  backgroundColor: COLOR.surface.card,
  paddingHorizontal: SPACING.md,
  paddingVertical: SPACING.sm,
};

/** A form field: caps label above, the control, an optional hint below. */
export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <View style={{ gap: SPACING.xs }}>
      <DsText v="label">{label}</DsText>
      {children}
      {hint ? <DsText v="caption">{hint}</DsText> : null}
    </View>
  );
}

/**
 * Photos for a post, thread, reply or message: every one goes through the same
 * pick → crop → plate check → saved-without-metadata flow as build photos.
 */
export function ComposerPhotos({ photos, onChange, onError, max = 4 }: { photos: string[]; onChange: (p: string[]) => void; onError: (m: string | null) => void; max?: number }) {
  const flow = usePhotoFlow({ onError, onPhoto: (ref, replaces) => onChange(replaces ? photos.map((p) => (p === replaces ? ref : p)) : [...photos, ref].slice(0, max)) });
  if (flow.view) return <>{flow.view}</>;
  return (
    <View style={{ gap: SPACING.sm }}>
      {photos.length ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm }}>
          {photos.map((p) => (
            <View key={p}>
              <Image source={{ uri: photoUri(p) }} style={{ width: 84, height: 84, borderRadius: RADII.control, backgroundColor: COLOR.surface.media }} accessibilityLabel="Photo to post" accessibilityIgnoresInvertColors />
              <Press
                onPress={() => onChange(photos.filter((x) => x !== p))}
                label="Remove this photo"
                hitSlop={8}
                style={{ position: 'absolute', right: -SPACING.sm, top: -SPACING.sm, width: 28, height: 28, borderRadius: RADII.pill, backgroundColor: COLOR.surface.bg, borderWidth: 1, borderColor: COLOR.surface.borderStrong, alignItems: 'center', justifyContent: 'center' }}
              >
                <Icon name="close" size={14} colour={COLOR.text.primary} />
              </Press>
            </View>
          ))}
        </View>
      ) : null}
      {photos.length < max ? (
        <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
          <Button label="Camera" icon="camera" tier="secondary" size="sm" block style={{ flex: 1 }} onPress={() => flow.pick(true)} disabled={flow.busy} />
          <Button label="Library" tier="secondary" size="sm" block style={{ flex: 1 }} onPress={() => flow.pick(false)} disabled={flow.busy} />
        </View>
      ) : null}
      <DsText v="caption">
        {plateRedactorAvailable ? 'Number plates are found and blurred before anything is shared; check the boxes when asked.' : 'Photos are saved without location data.'} Up to {max}.
      </DsText>
    </View>
  );
}

/** Link one of your builds (or none): one of many, so a radio list. */
export function BuildChooser({ builds, value, onChange, label = 'Link a build' }: { builds: Build[]; value?: string; onChange: (id: string | undefined) => void; label?: string }) {
  if (!builds.length) return <DsText v="caption">Add a car or bike in your garage to link it.</DsText>;
  return (
    <ChoiceGroup<string>
      label={label}
      layout="pills"
      value={value ?? 'none'}
      onChange={(k) => onChange(k === 'none' ? undefined : k)}
      options={[{ key: 'none', label: 'None' }, ...builds.map((b) => ({ key: b.id, label: `${b.make} ${b.model}` }))]}
    />
  );
}
