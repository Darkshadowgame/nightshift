import { carShape } from '../lib/buildShape';
import { StyleSheet, View } from 'react-native';
import { classOf } from '../lib/classes';
import { plural } from '../lib/format';
import { photoSource } from '../lib/photoSource';
import type { Build } from '../lib/types';
import { COLOR, RADII, SPACING, outline, themedStyles } from '../theme';
import { BuildArt, DEFAULT_PAINT } from './BuildArt';
import { useBuildPicture } from './BuildBits';
import { ClassBadge, DsText, FitImage, OnMedia, Tag } from './ds';
import { PhotoCredit } from './PhotoCredit';

/**
 * The build's photo (or silhouette) with its class stamped on the corner, like a car select
 * screen. Used by the garage hero, the build page and Rate builds.
 * Give a fixed `height`, or an `aspect` (width / height) to size it from its width.
 */
export function BuildHero({ build, height, aspect, trophies = 0, tag }: { build: Build; height?: number; aspect?: number; trophies?: number; tag?: string }) {
  const letter = classOf(build);
  const metal = COLOR.media.class[letter];
  const pic = useBuildPicture(build);
  return (
    <View style={[st.wrap, aspect ? { aspectRatio: aspect } : { height }]}>
      {pic ? (
        <FitImage source={photoSource(pic.ref)} frameAspect={aspect} />
      ) : (
        <BuildArt kind={build.kind} shape={carShape(build)} paint={build.colour || DEFAULT_PAINT} height={height ?? 160} />
      )}
      {/* Top-left, on its own dark plate, so it reads on any photo and never covers the car. */}
      <View style={[st.stamp, { borderColor: outline(metal) }]}>
        <OnMedia>
          <ClassBadge letter={letter} size="md" />
          <View>
            <DsText v="label" style={{ color: metal }}>
              Class {letter}
            </DsText>
            <DsText v="meta" tone="primary">
              {build.kind === 'bike' ? 'Bike' : 'Car'}
              {build.year ? ` · ${build.year}` : ''}
            </DsText>
          </View>
        </OnMedia>
      </View>
      {trophies > 0 || tag ? (
        <View style={st.corner}>
          {tag ? (
            <View style={st.plate}>
              <OnMedia>
                <Tag label={tag} />
              </OnMedia>
            </View>
          ) : null}
          {trophies > 0 ? (
            <View style={st.plate}>
              <OnMedia>
                <Tag label={plural(trophies, 'trophy', 'trophies')} />
              </OnMedia>
            </View>
          ) : null}
        </View>
      ) : null}
      <PhotoCredit photoRef={pic?.ref} kind={build.kind} standIn={pic?.standIn} overlay />
    </View>
  );
}

const st = themedStyles(() => StyleSheet.create({
  wrap: { borderRadius: RADII.card, overflow: 'hidden', backgroundColor: COLOR.surface.media },
  stamp: {
    position: 'absolute',
    left: SPACING.sm,
    top: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLOR.media.pill,
    borderWidth: 1,
    borderRadius: RADII.control,
    paddingLeft: SPACING.xs,
    paddingRight: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  corner: { position: 'absolute', top: SPACING.sm, right: SPACING.sm, flexDirection: 'row', gap: SPACING.xs },
  /** A dark plate under a tag so it reads on any photo. */
  plate: { backgroundColor: COLOR.media.pill, borderRadius: RADII.tag },
}));
