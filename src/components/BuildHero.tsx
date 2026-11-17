import { Image, StyleSheet, Text, View } from 'react-native';
import { CLASS_COLOURS, classOf } from '../lib/classes';
import { photoUri } from '../lib/photos';
import type { Build } from '../lib/types';
import { C, F } from '../theme';
import { BuildArt } from './BuildArt';
import { Trophy } from './Cover';
import { ClassBadge } from './ui';

/**
 * The build's photo (or silhouette) with its class stamped on the corner, like a
 * car select screen. Used by the garage cards and the build page.
 */
export function BuildHero({ build, height, trophies = 0, tag }: { build: Build; height: number; trophies?: number; tag?: string }) {
  const letter = classOf(build);
  const colour = CLASS_COLOURS[letter];
  return (
    <View style={[st.wrap, { height }]}>
      {build.photos[0] ? (
        <Image source={{ uri: photoUri(build.photos[0]) }} style={StyleSheet.absoluteFill} resizeMode="cover" accessibilityIgnoresInvertColors />
      ) : (
        <BuildArt kind={build.kind} colour={build.colour} height={height} />
      )}
      <View style={[st.stamp, { borderColor: `${colour}66` }]}>
        <ClassBadge letter={letter} size="lg" />
        <View>
          <Text style={[st.classWord, { color: colour }]}>Class {letter}</Text>
          <Text style={st.kind}>{build.kind === 'bike' ? 'Bike' : 'Car'}{build.year ? ` · ${build.year}` : ''}</Text>
        </View>
      </View>
      {trophies > 0 || tag ? (
        <View style={st.corner}>
          {tag ? <Text style={st.tag}>{tag}</Text> : null}
          {trophies > 0 ? (
            <View style={st.trophies} accessibilityLabel={`${trophies} trophies`}>
              <Trophy colour={C.sodium} size={16} />
              <Text style={st.trophyText}>{trophies}</Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { borderRadius: 10, overflow: 'hidden', backgroundColor: '#111827' },
  // Top-left, on its own dark plate, so it reads on any photo and never covers the car.
  stamp: {
    position: 'absolute', left: 10, top: 10, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(5,8,14,0.72)',
    borderWidth: 1, borderRadius: 8, paddingLeft: 6, paddingRight: 12, paddingVertical: 6,
  },
  classWord: { fontFamily: F.displayItalic, fontSize: 16, textTransform: 'uppercase' },
  kind: { fontFamily: F.label, fontSize: 11, letterSpacing: 1.4, color: C.chalk, textTransform: 'uppercase' },
  corner: { position: 'absolute', top: 10, right: 10, flexDirection: 'row', gap: 6 },
  tag: {
    fontFamily: F.labelBold, fontSize: 11, letterSpacing: 1.4, color: C.neon, textTransform: 'uppercase', borderWidth: 1, borderColor: C.neon,
    borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, backgroundColor: 'rgba(5,8,14,0.7)', overflow: 'hidden',
  },
  trophies: {
    flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, backgroundColor: 'rgba(5,8,14,0.7)',
    borderWidth: 1, borderColor: C.sodium,
  },
  trophyText: { fontFamily: F.labelBold, fontSize: 12, color: C.sodium },
});
