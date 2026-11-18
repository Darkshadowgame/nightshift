import { useState } from 'react';
import { Linking, View } from 'react-native';
import { creditLine, samplePhoto } from '../lib/photoSource';
import { COLOR, RADII, SPACING } from '../theme';
import { Button, DsText, Icon, Press, Sheet } from './ds';

/**
 * The author and licence of a sample photo from Wikimedia Commons. On a photo (`overlay`) it's a
 * small ⓘ in a corner (REVIEW-9 decision 9: no credit text over the picture); tapping it opens the
 * credit (author, licence, what it shows) with a link to the file's Commons page, as the licences
 * require. Without `overlay` it's a caption under the photo. Renders nothing for people's own photos.
 */
export function PhotoCredit({
  photoRef,
  kind = 'car',
  overlay,
  corner = 'bottomRight',
}: {
  photoRef: string | undefined | null;
  kind?: 'car' | 'bike' | 'place';
  overlay?: boolean;
  /** Where the ⓘ sits on the photo. */
  corner?: 'bottomRight' | 'topRight';
}) {
  const [open, setOpen] = useState(false);
  const p = samplePhoto(photoRef);
  if (!p) return null;
  const line = creditLine(p, kind);
  const openCommons = () => Linking.openURL(p.page).catch(() => {});
  if (!overlay) {
    return (
      <Press onPress={openCommons} role="link" label={`${line}. Opens Wikimedia Commons`} style={{ alignSelf: 'flex-start', paddingVertical: SPACING.xxs }}>
        <DsText v="caption" numberOfLines={2}>
          {line}
        </DsText>
      </Press>
    );
  }
  const similar = p.similar ? `${kind === 'place' ? 'Nearby' : `A similar ${kind}`}: ${p.similar}` : null;
  return (
    <>
      <Press
        onPress={() => setOpen(true)}
        label="Photo credit"
        hint={line}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={{
          position: 'absolute',
          right: SPACING.xs,
          ...(corner === 'topRight' ? { top: SPACING.xs } : { bottom: SPACING.xs }),
          width: 28,
          height: 28,
          borderRadius: RADII.pill,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: COLOR.surface.scrim,
        }}
      >
        <Icon name="info" size={16} colour={COLOR.text.primary} />
      </Press>
      <Sheet visible={open} title="Photo credit" onClose={() => setOpen(false)}>
        <View style={{ gap: SPACING.sm }}>
          <DsText v="bodyStrong">{p.title}</DsText>
          <DsText v="body">{`By ${p.author} · ${p.licence}`}</DsText>
          {similar ? <DsText v="secondary">{similar}</DsText> : null}
          {p.edited ? <DsText v="secondary">{p.edited}</DsText> : null}
          <DsText v="caption">A sample photo from Wikimedia Commons, used under its free licence. The demo's people and builds are made up.</DsText>
          <Button label="Open on Wikimedia Commons" tier="secondary" block onPress={openCommons} />
        </View>
      </Sheet>
    </>
  );
}
