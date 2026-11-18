import { carShape } from '../lib/buildShape';
import { Image, StyleSheet, View } from 'react-native';
import { photoUri } from '../lib/photos';
import Svg, { Path, Rect } from 'react-native-svg';
import { categoryInfo, type Award } from '../lib/awards';
import { classOf, effectivePower } from '../lib/classes';
import type { Build, NightEvent, User } from '../lib/types';
import { COLOR, RADII, SPACING } from '../theme';
import { BuildArt } from './BuildArt';
import { DsText } from './ds';

/** The "cover shoot" reward: the winning build as a stylised magazine-style cover. */
export function Cover({ award, build, owner, event, width = 260 }: { award: Award; build: Build; owner?: User; event?: NightEvent; width?: number }) {
  const h = width * 1.3;
  const date = new Date(award.at);
  const issue = `${date.toLocaleString('en-GB', { month: 'short' }).toUpperCase()} ${date.getFullYear()}`;
  return (
    <View style={[st.cover, { width, height: h }]} accessibilityLabel={`Cover: ${categoryInfo(award.category).label}, ${build.make} ${build.model}`}>
      {build.photos[0] ? (
        <Image source={{ uri: photoUri(build.photos[0]) }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      ) : (
        <View style={[StyleSheet.absoluteFill, { justifyContent: 'center' }]}>
          <BuildArt kind={build.kind} shape={carShape(build)} colour={build.colour} height={h * 0.55} />
        </View>
      )}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: COLOR.surface.scrim, opacity: 0.6 }]} />
      <View style={st.top}>
        {/* The masthead is a drawing: it scales with the cover, not the text size. */}
        <DsText v="display" numberOfLines={1} adjustsFontSizeToFit allowFontScaling={false} style={{ fontSize: width * 0.14, lineHeight: width * 0.17, letterSpacing: -1 }}>
          Night<DsText v="display" tone="action" allowFontScaling={false} style={{ fontSize: width * 0.14, letterSpacing: -1 }}>shift</DsText>
        </DsText>
        <DsText v="tag" tone="primary">
          {issue} · {event?.areaName ?? 'UK'}
        </DsText>
      </View>
      <View style={st.bottom}>
        <View style={st.ribbon}>
          <DsText v="eyebrow" tone="onAction">
            {categoryInfo(award.category).label}
          </DsText>
        </View>
        <DsText v="display" numberOfLines={2} allowFontScaling={false} style={{ fontSize: width * 0.1, lineHeight: width * 0.12 }}>
          {build.make} {build.model}
        </DsText>
        <DsText v="meta" tone="primary">
          @{owner?.handle ?? 'unknown'} · {Math.round(effectivePower(build))} bhp · Class {classOf(build)} · {build.mods.length} mods
        </DsText>
        {event?.title ? (
          <DsText v="meta" tone="primary" numberOfLines={1}>
            {event.title}
          </DsText>
        ) : null}
      </View>
    </View>
  );
}

export function Trophy({ colour = COLOR.action.primary, size = 34 }: { colour?: string; size?: number }) {
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
  cover: { borderRadius: RADII.control, overflow: 'hidden', backgroundColor: COLOR.surface.media, borderWidth: 1, borderColor: COLOR.surface.raisedHi },
  top: { position: 'absolute', top: SPACING.sm, left: SPACING.md, right: SPACING.md },
  bottom: { position: 'absolute', left: SPACING.md, right: SPACING.md, bottom: SPACING.md, gap: SPACING.xs },
  ribbon: { alignSelf: 'flex-start', backgroundColor: COLOR.action.primary, paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xxs, transform: [{ skewX: '-10deg' }] },
});
