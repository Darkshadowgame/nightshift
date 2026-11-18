import { Linking, View } from 'react-native';
import { creditLine, samplePhoto } from '../lib/photoSource';
import { COLOR, RADII, SPACING } from '../theme';
import { DsText, Press } from './ds';

/**
 * The author and licence of a sample photo from Wikimedia Commons (REVIEW-8: real photos in the
 * demo, credited on each). Tapping it opens the file's Commons page: the full picture and licence.
 * `overlay` sits on the photo's bottom edge on a dark plate; otherwise it's a caption under it.
 * Renders nothing for people's own photos.
 */
export function PhotoCredit({
  photoRef,
  kind = 'car',
  overlay,
  link = true,
}: {
  photoRef: string | undefined | null;
  kind?: 'car' | 'bike' | 'place';
  overlay?: boolean;
  /** False inside a card that is itself a button (a vote card, a garage tile): the credit is text, so taps reach the card. */
  link?: boolean;
}) {
  const p = samplePhoto(photoRef);
  if (!p) return null;
  const line = creditLine(p, kind);
  // On the photo, without the "Photo:" lead-in, on up to two lines so the licence is never cut off.
  const text = overlay ? line.replace(/^Photo: /, '') : line;
  const body = (
    <DsText v={overlay ? 'meta' : 'caption'} numberOfLines={2} style={overlay ? { color: COLOR.text.primary } : undefined}>
      {text}
    </DsText>
  );
  const plate = overlay ? <View style={{ maxWidth: '100%', backgroundColor: COLOR.surface.scrim, borderRadius: RADII.tag, paddingHorizontal: SPACING.xs, paddingVertical: SPACING.xxs }}>{body}</View> : body;
  const place = overlay
    ? ({ position: 'absolute', left: SPACING.xs, right: SPACING.xs, bottom: SPACING.xs, alignItems: 'flex-end' } as const)
    : ({ alignSelf: 'flex-start', paddingVertical: SPACING.xxs } as const);
  if (!link) {
    return (
      <View pointerEvents="none" accessibilityLabel={line} style={place}>
        {plate}
      </View>
    );
  }
  return (
    <Press
      onPress={() => Linking.openURL(p.page).catch(() => {})}
      role="link"
      label={`${line}. Opens Wikimedia Commons`}
      style={place}
    >
      {plate}
    </Press>
  );
}
