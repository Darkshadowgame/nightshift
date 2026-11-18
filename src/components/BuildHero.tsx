import { carShape } from '../lib/buildShape';
import { Image, StyleSheet, View } from 'react-native';
import { classOf } from '../lib/classes';
import { plural } from '../lib/format';
import { photoUri } from '../lib/photos';
import type { Build } from '../lib/types';
import { COLOR, RADII, SPACING, outline } from '../theme';
import { BuildArt } from './BuildArt';
import { ClassBadge, DsText, Tag } from './ds';

/**
 * The build's photo (or silhouette) with its class stamped on the corner, like a car select
 * screen. Used by the garage hero, the build page and Rate builds.
 * Give a fixed `height`, or an `aspect` (width / height) to size it from its width.
 */
export function BuildHero({ build, height, aspect, trophies = 0, tag }: { build: Build; height?: number; aspect?: number; trophies?: number; tag?: string }) {
  const letter = classOf(build);
  const metal = COLOR.classMetal[letter];
  return (
    <View style={[st.wrap, aspect ? { aspectRatio: aspect } : { height }]}>
      {build.photos[0] ? (
        <Image source={{ uri: photoUri(build.photos[0]) }} style={StyleSheet.absoluteFill} resizeMode="cover" accessibilityIgnoresInvertColors />
      ) : (
        <BuildArt kind={build.kind} shape={carShape(build)} colour={build.colour} height={height ?? 160} />
      )}
      {/* Top-left, on its own dark plate, so it reads on any photo and never covers the car. */}
      <View style={[st.stamp, { borderColor: outline(metal) }]}>
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
      </View>
      {trophies > 0 || tag ? (
        <View style={st.corner}>
          {tag ? (
            <View style={st.plate}>
              <Tag label={tag} />
            </View>
          ) : null}
          {trophies > 0 ? (
            <View style={st.plate}>
              <Tag label={plural(trophies, 'trophy', 'trophies')} />
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { borderRadius: RADII.card, overflow: 'hidden', backgroundColor: COLOR.surface.media },
  stamp: {
    position: 'absolute',
    left: SPACING.sm,
    top: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLOR.surface.glass,
    borderWidth: 1,
    borderRadius: RADII.control,
    paddingLeft: SPACING.xs,
    paddingRight: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  corner: { position: 'absolute', top: SPACING.sm, right: SPACING.sm, flexDirection: 'row', gap: SPACING.xs },
  /** A dark plate under a tag so it reads on any photo. */
  plate: { backgroundColor: COLOR.surface.glass, borderRadius: RADII.tag },
});
