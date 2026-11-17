import { Image, StyleSheet, Text, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { categoryInfo, type Award } from '../lib/awards';
import { classOf, effectivePower } from '../lib/classes';
import type { Build, NightEvent, User } from '../lib/types';
import { C, F } from '../theme';
import { BuildArt } from './BuildArt';

/** The "cover shoot" reward: the winning build as a stylised magazine-style cover. */
export function Cover({ award, build, owner, event, width = 260 }: { award: Award; build: Build; owner?: User; event?: NightEvent; width?: number }) {
  const h = width * 1.3;
  const date = new Date(award.at);
  const issue = `${date.toLocaleString('en-GB', { month: 'short' }).toUpperCase()} ${date.getFullYear()}`;
  return (
    <View style={[st.cover, { width, height: h }]} accessibilityLabel={`Cover: ${categoryInfo(award.category).label}, ${build.make} ${build.model}`}>
      {build.photos[0] ? (
        <Image source={{ uri: build.photos[0] }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      ) : (
        <View style={[StyleSheet.absoluteFill, { justifyContent: 'center' }]}>
          <BuildArt kind={build.kind} colour={build.colour} height={h * 0.55} />
        </View>
      )}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(5,8,14,0.35)' }]} />
      <View style={st.top}>
        <Text style={[st.mast, { fontSize: width * 0.14 }]} numberOfLines={1} adjustsFontSizeToFit>NIGHT<Text style={{ color: C.sodium }}>SHIFT</Text></Text>
        <Text style={st.issue}>{issue} · {event?.areaName?.toUpperCase() ?? 'UK'}</Text>
      </View>
      <View style={st.bottom}>
        <View style={st.ribbon}>
          <Text style={st.ribbonText}>{categoryInfo(award.category).label}</Text>
        </View>
        <Text style={[st.headline, { fontSize: width * 0.1 }]} numberOfLines={2}>{build.make} {build.model}</Text>
        <Text style={st.lines}>
          @{owner?.handle ?? 'unknown'} · {Math.round(effectivePower(build))} BHP · CLASS {classOf(build)} · {build.mods.length} MODS
        </Text>
        <Text style={st.lines}>{event?.title ?? ''}</Text>
      </View>
    </View>
  );
}

export function Trophy({ colour = C.sodium, size = 34 }: { colour?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <Path d="M13 8h14v8a7 7 0 0 1-14 0z" fill={colour} />
      <Path d="M13 10H8c0 5 2 8 6 8M27 10h5c0 5-2 8-6 8" fill="none" stroke={colour} strokeWidth={2} />
      <Rect x={18} y={22} width={4} height={6} fill={colour} />
      <Rect x={12} y={28} width={16} height={4} rx={1} fill={colour} />
    </Svg>
  );
}

const st = StyleSheet.create({
  cover: { borderRadius: 6, overflow: 'hidden', backgroundColor: '#111827', borderWidth: 1, borderColor: C.kerbHi },
  top: { position: 'absolute', top: 10, left: 12, right: 12 },
  mast: { fontFamily: F.display, color: C.chalk, fontStyle: 'italic', letterSpacing: -1, lineHeight: undefined },
  issue: { fontFamily: F.label, color: C.chalk, fontSize: 11, letterSpacing: 2 },
  bottom: { position: 'absolute', left: 12, right: 12, bottom: 12, gap: 3 },
  ribbon: { alignSelf: 'flex-start', backgroundColor: C.sodium, paddingHorizontal: 8, paddingVertical: 3, transform: [{ skewX: '-10deg' }] },
  ribbonText: { fontFamily: F.labelBold, color: C.ink, fontSize: 12, letterSpacing: 2, textTransform: 'uppercase' },
  headline: { fontFamily: F.display, color: C.chalk, textTransform: 'uppercase', fontStyle: 'italic' },
  lines: { fontFamily: F.label, color: C.chalk, fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase' },
});
