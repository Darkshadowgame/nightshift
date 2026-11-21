import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { FitImage, ListRow, Press, RowDivider, Sheet, DsText, useToast } from './ds';
import { useIsDemo } from './BuildBits';
import { usePhotoFlow } from './PhotoFlow';
import { samePhoto } from '../lib/avatar';
import { deletePhotos } from '../lib/photos';
import { droppedPhotos } from '../lib/photoRefs';
import { photoSource } from '../lib/photoSource';
import { buildPicture } from '../lib/similarPhoto';
import { useStore } from '../lib/store';
import { COLOR, RADII, SPACING } from '../theme';

/**
 * Me's profile picture: "Choose from library" (a photo from the phone, cropped square and plate-checked like
 * every photo), "Choose from my vehicles" (one of your own vehicle photos) and "Use my main vehicle" (the
 * default). The choice is saved on your profile, so everyone sees it (profiles.avatar_ref); in the demo it is
 * kept on the demo person.
 */
export function AvatarSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { builds, me, users, setAvatar } = useStore();
  const demo = useIsDemo();
  const toast = useToast();
  const [step, setStep] = useState<'menu' | 'pick'>('menu');
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (visible) {
      setStep('menu');
    }
  }, [visible]);
  const current = users.find((u) => u.id === me)?.avatarRef ?? null;
  const mine = builds.filter((b) => b.ownerId === me);
  // Every photo of every vehicle you own; a vehicle with none offers its stand-in (demo) so there is always a choice.
  const refs = mine.flatMap((b) => (b.photos.length ? b.photos : [buildPicture(b, demo)?.ref].filter((r): r is string => !!r)));

  const save = async (ref: string | null, fromLibrary = false) => {
    setSaving(true);
    try {
      await setAvatar(ref);
      // A library photo's file on the phone isn't needed once it is on the profile (the demo keeps it).
      if (fromLibrary && ref && !demo) deletePhotos([ref]);
      // The demo drops its own old library file, unless a vehicle uses it.
      if (demo && current) deletePhotos(droppedPhotos([current], ref ? [ref] : [], mine.flatMap((b) => b.photos)));
      toast({ message: ref ? 'Profile photo changed' : 'Using your main vehicle' });
      onClose();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Couldn't save that photo. Try again.";
      if (fromLibrary && ref && !demo) deletePhotos([ref]);
      toast({ message });
    } finally {
      setSaving(false);
    }
  };
  const flow = usePhotoFlow({
    aspect: '1:1',
    onError: (m) => m && toast({ message: m }),
    onPhoto: (ref) => void save(ref, true),
    cameraDenied: 'Allow camera access to take a photo.',
  });
  const library = () => {
    // The crop editor is a full-screen view of its own: close the sheet first.
    onClose();
    void flow.pick();
  };
  const isCurrent = (r: string) => samePhoto(current, r);
  return (
    <>
      {flow.view}
      <Sheet visible={visible} title="Profile photo" onClose={onClose}>
        {step === 'menu' ? (
          <View>
            <ListRow title="Choose from library" subtitle="A photo from your phone" onPress={saving || flow.busy ? undefined : library} />
            <RowDivider />
            <ListRow title="Choose from my vehicles" subtitle={refs.length ? 'One of your vehicle photos' : 'Add a photo to a vehicle first'} onPress={refs.length ? () => setStep('pick') : undefined} />
            {current ? (
              <>
                <RowDivider />
                <ListRow title="Use my main vehicle" subtitle="Go back to the default" onPress={saving ? undefined : () => void save(null)} />
              </>
            ) : null}
          </View>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm }}>
            {refs.map((r, i) => (
              <Press
                key={r + i}
                onPress={() => void save(r)}
                label={`Photo ${i + 1} of ${refs.length}`}
                state={{ selected: isCurrent(r) }}
                style={{ width: '30%', aspectRatio: 1, borderRadius: RADII.control, overflow: 'hidden', borderWidth: isCurrent(r) ? 2 : 0, borderColor: COLOR.action.link }}
              >
                <FitImage fit="cover" source={photoSource(r)} frameAspect={1} />
              </Press>
            ))}
            {refs.length === 0 ? <DsText v="secondary">No photos yet.</DsText> : null}
          </View>
        )}
      </Sheet>
    </>
  );
}
