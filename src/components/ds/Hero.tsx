import type { ReactNode } from 'react';
import { View } from 'react-native';
import type { ClassLetter } from '../../lib/types';
import { ASPECT, COLOR, RADII, SPACING } from '../../theme';
import { Pin, type Glyph } from '../Pin';
import type { EntityTag } from './EntityCard';
import { FitImage } from './FitImage';
import { Gradient } from './Gradient';
import { contentColour } from './logic';
import { ClassBadge, Tag, type Photo } from './Marks';
import { DsText } from './Text';

/**
 * The top of every detail screen (T3), in a fixed order (Redesign 2, 3.5): picture → kind
 * eyebrow → title → meta line(s) → tag. Replaces `DetailHero`.
 *
 * - `photo`: full-width picture (16:9, or `aspect`); the kind and title sit on a bottom gradient
 *   over it (`titleOnPhoto`, default on) in the `hero` type, and the meta lines follow below.
 * - `media`: any other picture (a map in a MediaFrame, BuildArt); the words go under it.
 * - Neither: words only (a crew, a zone).
 *
 * `bleed` runs the picture edge to edge when the Hero is the first thing inside a `PAGE`-padded
 * scroll view (it cancels the page gutter and top padding, then pads its own words).
 * `overlay` sits on top of the picture (a `PhotoCredit overlay corner="topRight"` ⓘ; the top right is kept free for it).
 */
export function Hero({
  photo,
  media,
  aspect = ASPECT.event,
  eyebrow,
  layerColour,
  glyph,
  live,
  title,
  meta,
  tag,
  classLetter,
  leading,
  titleOnPhoto = true,
  overlay,
  bleed,
  children,
}: {
  photo?: Photo | null;
  media?: ReactNode;
  aspect?: number;
  /** The kind in words: "Rolling meet", "Photo spot", "Crew". */
  eyebrow?: string;
  /** Events and places: the kind line in the layer colour (and the pin, with `glyph`). */
  layerColour?: string;
  glyph?: Glyph;
  live?: boolean;
  title: string;
  /** One line ("Tonight 22:00–00:30 · Around Tamworth"), or several, most important first. */
  meta?: string | (string | null | undefined | false)[];
  /** One state: Going, Hosting, Cancelled. */
  tag?: EntityTag | null;
  /** Builds: the ClassBadge before the title. */
  classLetter?: ClassLetter;
  /** People: their Avatar before the @handle (K3: a person is always avatar + @handle). */
  leading?: ReactNode;
  titleOnPhoto?: boolean;
  overlay?: ReactNode;
  bleed?: boolean;
  children?: ReactNode;
}) {
  const lines = (Array.isArray(meta) ? meta : [meta]).filter((l): l is string => !!l);
  const onPhoto = !!photo && titleOnPhoto;
  const kindColour = contentColour(layerColour, COLOR.text.secondary);

  // One place for the status tag, as on PhotoCard (K3, Review 13): top left of the picture; with
  // no picture, first on the kind line.
  const tagOnPicture = !!tag && !!(photo || media);
  const statusTag = tag ? <Tag label={tag.label} tone={tag.tone} raw={tag.raw} /> : null;
  const kindRow =
    eyebrow || live || glyph || (tag && !tagOnPicture) ? (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, flexWrap: 'wrap' }}>
        {tagOnPicture ? null : statusTag}
        {glyph ? (
          <View aria-hidden>
            <Pin glyph={glyph} colour={kindColour} size={24} />
          </View>
        ) : null}
        {/* Live is a dot here; the words ("Live · until 23:00") are the meta line's, said once (C5, Review 18). */}
        {live ? <View aria-hidden style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: COLOR.state.liveDot }} /> : null}
        {eyebrow ? (
          <DsText v="eyebrow" style={{ color: kindColour }}>
            {eyebrow}
          </DsText>
        ) : null}
      </View>
    ) : null;

  const titleRow = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
      {leading ?? null}
      {classLetter ? <ClassBadge letter={classLetter} size={onPhoto ? 'md' : 'sm'} /> : null}
      {/* On a photo, three lines at most: at 1.3x text a long title never climbs out of the picture (Review 13). */}
      <DsText v={onPhoto ? 'hero' : 'titleLg'} accessibilityRole="header" numberOfLines={onPhoto ? 3 : undefined} style={{ flexShrink: 1 }}>
        {title}
      </DsText>
    </View>
  );

  const metaLines = lines.map((l, i) => (
    <DsText key={`${i}:${l}`} v={i === 0 ? 'bodyStrong' : 'meta'} style={i === 0 ? undefined : { color: COLOR.text.primary }}>
      {l}
    </DsText>
  ));

  const picture = photo ? (
    <FitImage source={photo} frameAspect={aspect} />
  ) : (
    media
  );

  const edge = !!bleed && !!picture;
  const gutter = edge ? SPACING.screen : 0;
  return (
    <View style={[{ gap: SPACING.md }, edge && { marginHorizontal: -SPACING.screen, marginTop: -SPACING.screen }]}>
      {picture ? (
        <View style={{ aspectRatio: aspect, backgroundColor: COLOR.surface.media, overflow: 'hidden' }}>
          {picture}
          {onPhoto ? (
            <>
              <Gradient style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '75%' }} />
              <View style={{ position: 'absolute', left: SPACING.screen, right: SPACING.screen, bottom: SPACING.md, gap: SPACING.xs }}>
                {kindRow}
                {titleRow}
              </View>
            </>
          ) : null}
          {tagOnPicture ? (
            <View style={{ position: 'absolute', top: SPACING.sm, left: edge ? SPACING.screen : SPACING.sm, backgroundColor: COLOR.surface.glass, borderRadius: RADII.tag }}>{statusTag}</View>
          ) : null}
          {overlay}
        </View>
      ) : null}
      <View style={{ gap: SPACING.xs, paddingHorizontal: gutter }}>
        {onPhoto ? null : kindRow}
        {onPhoto ? null : titleRow}
        {metaLines}
        {children}
      </View>
    </View>
  );
}
