import { Image, StyleSheet, Text, View } from 'react-native';
import { CLASS_COLOURS, classOf } from '../lib/classes';
import { photoUri } from '../lib/photos';
import type { Build } from '../lib/types';
import { BRAND, C, F, FONT_SCALE, RADIUS, SURFACE, TYPE } from '../theme';
import { BuildArt } from './BuildArt';
import { Trophy } from './Cover';
import { ClassBadge, SampleTag } from './ui';

/**
 * The build's photo (or silhouette) with its class stamped on the corner, like a
 * car select screen. Used by the garage cards and the build page.
 * Give a fixed `height`, or an `aspect` (width / height) to size it from its width.
 */
export function BuildHero({ build, height, aspect, trophies = 0, tag }: { build: Build; height?: number; aspect?: number; trophies?: number; tag?: string }) {
  const letter = classOf(build);
  const colour = CLASS_COLOURS[letter];
  return (
    <View style={[st.wrap, aspect ? { aspectRatio: aspect } : { height }]}>
      {build.photos[0] ? (
        <Image source={{ uri: photoUri(build.photos[0]) }} style={StyleSheet.absoluteFill} resizeMode="cover" accessibilityIgnoresInvertColors />
      ) : (
        <BuildArt kind={build.kind} colour={build.colour} height={height ?? 160} />
      )}
      <View style={[st.stamp, { borderColor: `${colour}66` }]}>
        <ClassBadge letter={letter} size="lg" />
        <View>
          <Text maxFontSizeMultiplier={FONT_SCALE.chrome} style={[st.classWord, { color: colour }]}>Class {letter}</Text>
          <Text maxFontSizeMultiplier={FONT_SCALE.chrome} style={st.kind}>{build.kind === 'bike' ? 'Bike' : 'Car'}{build.year ? ` · ${build.year}` : ''}</Text>
        </View>
      </View>
      {trophies > 0 || tag ? (
        <View style={st.corner}>
          {tag ? (
            <View style={st.plate}>
              <SampleTag label={tag} />
            </View>
          ) : null}
          {trophies > 0 ? (
            <View style={st.trophies} accessibilityLabel={`${trophies} trophies`}>
              <Trophy colour={BRAND} size={16} />
              <Text maxFontSizeMultiplier={FONT_SCALE.chrome} style={st.trophyText}>{trophies}</Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { borderRadius: RADIUS.sheet, overflow: 'hidden', backgroundColor: C.tarmac },
  // Top-left, on its own dark plate, so it reads on any photo and never covers the car.
  stamp: {
    position: 'absolute', left: 10, top: 10, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: SURFACE.glass,
    borderWidth: 1, borderRadius: RADIUS.card, paddingLeft: 6, paddingRight: 12, paddingVertical: 6,
  },
  classWord: { fontFamily: F.displayItalic, fontSize: 16, textTransform: 'uppercase' },
  kind: { fontFamily: F.label, fontSize: TYPE.micro, letterSpacing: 1.4, color: C.chalk, textTransform: 'uppercase' },
  corner: { position: 'absolute', top: 10, right: 10, flexDirection: 'row', gap: 6 },
  /** A dark plate under a tag so it reads on any photo. */
  plate: { backgroundColor: SURFACE.glass, borderRadius: RADIUS.tag },
  trophies: {
    flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: RADIUS.tag, paddingHorizontal: 6, paddingVertical: 2, backgroundColor: SURFACE.glass,
    borderWidth: 1, borderColor: BRAND,
  },
  trophyText: { fontFamily: F.labelBold, fontSize: TYPE.label, color: BRAND },
});
