import { carShape } from '../lib/buildShape';
import { Image, StyleSheet, View } from 'react-native';
import { photoSource } from '../lib/photoSource';
import Svg, { Path, Rect, TSpan, Text as SvgText } from 'react-native-svg';
import { categoryInfo, type Award } from '../lib/awards';
import { classOf } from '../lib/classes';
import { coverTitle, plural } from '../lib/format';
import { powerText } from '../lib/dyno';
import { modCount } from '../lib/modGroups';
import type { Build, NightEvent, User } from '../lib/types';
import { COLOR, F, RADII, SPACING } from '../theme';
import { BuildArt } from './BuildArt';
import { useBuildPicture } from './BuildBits';
import { ClassBadge, displayHandle, DsText } from './ds';

/** The "cover shoot" reward: the winning build as a stylised magazine-style cover. */
export function Cover({ award, build, owner, event, width = 260 }: { award: Award; build: Build; owner?: User; event?: NightEvent; width?: number }) {
  const h = width * 1.3;
  const pic = useBuildPicture(build);
  const date = new Date(award.at);
  const issue = `${date.toLocaleString('en-GB', { month: 'short' }).toUpperCase()} ${date.getFullYear()}`;
  const title = coverTitle(build.make, build.model, width - 2 * SPACING.md - BADGE_SM - SPACING.sm, width * 0.1);
  return (
    <View style={[st.cover, { width, height: h }]} accessibilityLabel={`Cover: ${categoryInfo(award.category).label}, ${build.make} ${build.model}`}>
      {pic ? (
        <Image source={photoSource(pic.ref)} style={StyleSheet.absoluteFill} resizeMode="cover" />
      ) : (
        <View style={[StyleSheet.absoluteFill, { justifyContent: 'center' }]}>
          <BuildArt kind={build.kind} shape={carShape(build)} colour={build.colour} height={h * 0.55} />
        </View>
      )}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: COLOR.surface.scrim, opacity: 0.6 }]} />
      <View style={st.top}>
        {/* The masthead is a drawing (SVG text): it scales with the cover, never with the text size, so it's never cut. */}
        <Svg width={width - 2 * SPACING.md} height={width * 0.17} accessibilityLabel="Nightshift">
          {/* textLength pins its width (Review 15): at any text size it fills the same box, never "NIGHTSHIF". */}
          <SvgText x={0} y={width * 0.135} fontFamily={F.displayItalic} fontSize={width * 0.14} letterSpacing={-1} textLength={width * MASTHEAD_SHARE} lengthAdjust="spacingAndGlyphs" fill={COLOR.text.primary}>
            NIGHT
            <TSpan fill={COLOR.action.primary}>SHIFT</TSpan>
          </SvgText>
        </Svg>
        <DsText v="tag" tone="primary">
          {issue} · {event?.areaName ?? 'UK'}
        </DsText>
      </View>
      <View style={st.bottom}>
        {/* The trophy is chrome (a tag); the build's name is content, so it keeps its case (Review 13). */}
        <View style={st.ribbon}>
          <DsText v="eyebrow" tone="primary">
            {categoryInfo(award.category).label}
          </DsText>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
          <ClassBadge letter={classOf(build)} size="sm" />
          <DsText v="hero" numberOfLines={2} allowFontScaling={false} style={{ flexShrink: 1, fontFamily: F.displayItalic, fontSize: title.size, lineHeight: Math.round(title.size * 1.2) }}>
            {title.text}
          </DsText>
        </View>
        <DsText v="meta" tone="primary">
          {[displayHandle(owner?.handle ?? 'unknown'), powerText(build), plural(modCount(build.mods), 'mod').replace(' ', '\u00a0')].join(' · ')}
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

/** The class badge's width at size "sm" (ds ClassBadge). */
const BADGE_SM = 22;
/** The masthead's width as a share of the cover's: its natural width at 0.14 × the cover (Review 15). */
const MASTHEAD_SHARE = 0.78;
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
  // Sodium is for the one primary (5.4): the ribbon is glass with a hairline.
  ribbon: { alignSelf: 'flex-start', backgroundColor: COLOR.surface.glass, borderWidth: 1, borderColor: COLOR.text.primary, paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xxs, transform: [{ skewX: '-10deg' }] },
});
