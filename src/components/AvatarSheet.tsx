import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { FitImage, ListRow, Press, RowDivider, Sheet, DsText } from './ds';
import { useIsDemo } from './BuildBits';
import { photoSource } from '../lib/photoSource';
import { buildPicture } from '../lib/similarPhoto';
import { useStore } from '../lib/store';
import { COLOR, RADII, SPACING } from '../theme';

/**
 * Me's profile picture choice: "Choose profile photo" (one of your own vehicle photos) and "Use my main
 * vehicle" (the default: the whole vehicle photo). The choice is kept on this phone only (settings.avatarRef):
 * there is no profile column for a picture yet, so a photo from the library isn't offered until there is.
 */
export function AvatarSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { builds, me, settings, setSettings } = useStore();
  const demo = useIsDemo();
  const [step, setStep] = useState<'menu' | 'pick'>('menu');
  useEffect(() => {
    if (visible) setStep('menu');
  }, [visible]);
  const mine = builds.filter((b) => b.ownerId === me);
  // Every photo of every vehicle you own; a vehicle with none offers its stand-in (demo) so there is always a choice.
  const refs = mine.flatMap((b) => (b.photos.length ? b.photos : [buildPicture(b, demo)?.ref].filter((r): r is string => !!r)));
  const choose = (ref: string | null) => {
    setSettings({ avatarRef: ref });
    onClose();
  };
  return (
    <Sheet visible={visible} title="Profile photo" onClose={onClose}>
      {step === 'menu' ? (
        <View>
          <ListRow title="Choose profile photo" subtitle={refs.length ? 'One of your vehicle photos' : 'Add a photo to a vehicle first'} onPress={refs.length ? () => setStep('pick') : undefined} />
          {settings.avatarRef ? (
            <>
              <RowDivider />
              <ListRow title="Use my main vehicle" onPress={() => choose(null)} />
            </>
          ) : null}
        </View>
      ) : (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm }}>
          {refs.map((r, i) => (
            <Press
              key={r + i}
              onPress={() => choose(r)}
              label={`Photo ${i + 1} of ${refs.length}`}
              state={{ selected: settings.avatarRef === r }}
              style={{ width: '30%', aspectRatio: 1, borderRadius: RADII.control, overflow: 'hidden', borderWidth: settings.avatarRef === r ? 2 : 0, borderColor: COLOR.action.link }}
            >
              <FitImage fit="cover" source={photoSource(r)} frameAspect={1} />
            </Press>
          ))}
          {refs.length === 0 ? <DsText v="secondary">No photos yet.</DsText> : null}
        </View>
      )}
    </Sheet>
  );
}
