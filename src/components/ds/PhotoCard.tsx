import { useState, type ReactNode } from 'react';
import { useWindowDimensions, View } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';
import type { CarShape } from '../../lib/buildShape';
import type { ClassLetter, VehicleKind } from '../../lib/types';
import { ART, ASPECT, COLOR, RADII, SPACING } from '../../theme';
import { BuildArt } from '../BuildArt';
import { Button } from './Button';
import { FitImage } from './FitImage';
import type { EntityTag } from './EntityCard';
import { Gradient } from './Gradient';
import { contentColour, entityA11yLabel, rgba } from './logic';
import { ClassBadge, Tag, type Photo } from './Marks';
import { Press, type Haptic } from './Press';
import { DsText } from './Text';

export type PhotoCardKind = 'event' | 'build' | 'post' | 'place';

export type CardAction = {
  label: string;
  onPress: () => void;
  /**
   * Cards carry at most one secondary. `primary` only for the Tonight map's pick card, where
   * "I'm going" is the one primary on the screen (Redesign 2, 3.3).
   */
  tier?: 'primary' | 'secondary';
  busy?: boolean;
  haptic?: Haptic;
  accessibilityLabel?: string;
};

/**
 * The browse card (Redesign 2, 5.1): photo on top, full width, then the words. Replaces
 * `EntityCard` on Tonight, the map sheet, search, Garage, profiles and the feed.
 *
 *   ┌───────────────────────────┐
 *   │░░░░░░░ photo (aspect) ░░░░│  16:9 events and places, 4:3 builds, 4:5 posts
 *   │[tag] ░░░░░░░░░░░░░░░░░░░ ⓘ│  one status tag top left; `overlay` (ⓘ credit top right, ✕)
 *   ├───────────────────────────┤
 *   │ ● MEET                    │  kind line: layer colour (events, places), live dot
 *   │ Car park meet-up          │  title, as typed, 2 lines
 *   │ Live · until 23:00 · 2 mi │  meta, one line of facts (2 lines at large text)
 *   │ [       I'M GOING       ] │  one action (secondary; primary only on the map's pick)
 *   └───────────────────────────┘
 *
 * `titleOnPhoto` (builds, the Tonight peek card) puts the kind line, class badge and title on a
 * bottom gradient over the photo; meta stays below. Three type sizes per card: tag (kind and
 * status), title, meta.
 *
 * Every card has a picture (5.1): `photo`; else `fallback` (a node, e.g. a map snapshot); else
 * for events and places the area-circle drawing in the layer colour, for builds the silhouette on
 * a gradient of the build's `paint`. Never a grey box.
 *
 * `size="sm"`: a row-shaped card (picture left, words right) for a picked build in onboarding.
 *
 * Larger text (Review 13, L2: nothing clipped or overlapping at 1.3x):
 * - A narrow card (a two-column grid, under NARROW_CARD points of room at the current text size)
 *   puts the class badge on the kind line, above the title, so the title has the full width; the
 *   title is `titleSm` and wraps to three lines, by words, never cut mid-word.
 * - `titleOnPhoto` needs a real photo (or a `fallback` snapshot): on the drawn silhouette the title
 *   goes under the picture, so it never runs over the car (Me at 1.3x).
 */
export function PhotoCard({
  kind,
  photo,
  fallback,
  paint,
  vehicle = 'car',
  shape,
  layerColour,
  title,
  eyebrow,
  live,
  meta,
  detail,
  selected,
  tag,
  classLetter,
  action,
  onPress,
  titleOnPhoto,
  overlay,
  aspect,
  size = 'lg',
  finished,
  accessibilityHint,
}: {
  kind: PhotoCardKind;
  photo?: Photo | null;
  /** Drawn when there's no photo (an event's map snapshot). */
  fallback?: ReactNode;
  /** Builds: the paint colour (hex) behind the silhouette when there's no photo. */
  paint?: string;
  vehicle?: VehicleKind;
  shape?: CarShape;
  /** Events and places: the layer colour for the kind line and the fallback drawing. */
  layerColour?: string;
  title: string;
  /** The kind in words: "Meet", "Rolling meet", "Photo spot". Builds and posts usually leave it out. */
  eyebrow?: string;
  /** Live now: a red dot and "Live" before the kind. */
  live?: boolean;
  meta?: string;
  /** One quiet line under meta ("Not open to your car"). */
  detail?: string;
  /** The one picked (a vote): the selected border, like every other selection (Review 20 gap 25). */
  selected?: boolean;
  /** One state: Going, Hosting, Checked in. */
  tag?: EntityTag | null;
  /** Builds: the ClassBadge beside the title. */
  classLetter?: ClassLetter;
  action?: CardAction | null;
  onPress?: () => void;
  titleOnPhoto?: boolean;
  /** Absolute children over the photo: `<PhotoCredit overlay … />`, a ✕. */
  overlay?: ReactNode;
  /** Width / height. Defaults to `ASPECT` for the kind. */
  aspect?: number;
  size?: 'lg' | 'sm';
  /** Past or cancelled: no layer colour, quieter. */
  finished?: boolean;
  accessibilityHint?: string;
}) {
  const ratio = aspect ?? (kind === 'build' ? ASPECT.build : kind === 'post' ? ASPECT.post : ASPECT.event);
  // How much room the words have, at the current text size: a narrow card stacks badge and title.
  const { fontScale } = useWindowDimensions();
  const [width, setWidth] = useState(0);
  const narrow = size === 'lg' && narrowCard(width, fontScale);
  // Words over the picture only when it's a photo (or a snapshot), never over the drawn silhouette.
  const onPhoto = !!titleOnPhoto && (!!photo || !!fallback);
  const placeLike = kind === 'event' || kind === 'place';
  const kindColour = placeLike && !finished ? contentColour(layerColour, COLOR.text.secondary) : COLOR.text.secondary;
  const label = entityA11yLabel({
    eyebrow: eyebrow || undefined,
    title,
    meta,
    detail,
    tags: [tag?.label, classLetter ? `Class ${classLetter}` : undefined].filter((x): x is string => !!x),
  });

  const picture = (
    <Picture kind={kind} aspect={ratio} photo={photo} fallback={fallback} paint={paint} vehicle={vehicle} shape={shape} colour={placeLike ? (layerColour ?? COLOR.layer.event) : undefined} />
  );

  const badgeOnKindLine = narrow && !!classLetter;
  const kindLine =
    live || eyebrow || badgeOnKindLine ? (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs }}>
        {badgeOnKindLine ? <ClassBadge letter={classLetter!} size="sm" decorative /> : null}
        {/* Live is a dot here; the words ("Live · until 23:00") are the meta line's, said once (C5, Review 18). */}
        {live ? <View aria-hidden style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: COLOR.state.liveDot }} /> : null}
        {eyebrow ? (
          <DsText v="tag" numberOfLines={1} style={{ color: kindColour, flexShrink: 1 }}>
            {eyebrow}
          </DsText>
        ) : null}
      </View>
    ) : null;

  const titleRow = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
      {classLetter && !badgeOnKindLine ? <ClassBadge letter={classLetter} size="sm" decorative /> : null}
      <DsText v={narrow ? 'titleSm' : 'title'} numberOfLines={narrow ? 3 : 2} style={{ flexShrink: 1 }}>
        {title}
      </DsText>
    </View>
  );

  const facts =
    meta || detail ? (
      <View style={{ gap: SPACING.xxs }}>
        {meta ? (
          <DsText v="meta" numberOfLines={2}>
            {meta}
          </DsText>
        ) : null}
        {detail ? (
          <DsText v="meta" numberOfLines={2} style={{ color: COLOR.text.info }}>
            {detail}
          </DsText>
        ) : null}
      </View>
    ) : null;

  const button = action ? (
    <Button
      label={action.label}
      onPress={action.onPress}
      tier={action.tier === 'primary' ? 'primary' : 'secondary'}
      size={action.tier === 'primary' ? 'md' : 'sm'}
      block
      busy={action.busy}
      haptic={action.haptic}
      accessibilityLabel={action.accessibilityLabel}
    />
  ) : null;

  const frame = {
    backgroundColor: finished ? COLOR.surface.bg : COLOR.surface.card,
    borderColor: selected ? COLOR.action.selected : COLOR.surface.border,
    borderStyle: finished ? ('dashed' as const) : ('solid' as const),
    borderWidth: selected ? 2 : 1,
    borderRadius: RADII.card,
    overflow: 'hidden' as const,
  };

  if (size === 'sm') {
    const body = (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.md, padding: SPACING.sm }}>
        <View style={{ width: 96, aspectRatio: ratio, borderRadius: RADII.control, overflow: 'hidden', backgroundColor: COLOR.surface.media }}>{picture}</View>
        <View style={{ flex: 1, gap: SPACING.xxs }}>
          {kindLine}
          {titleRow}
          {facts}
        </View>
        {tag ? <Tag label={tag.label} tone={tag.tone} raw={tag.raw} /> : null}
      </View>
    );
    return onPress ? (
      <Press onPress={onPress} feedback="card" label={label} hint={accessibilityHint} style={frame}>
        {body}
      </Press>
    ) : (
      <View style={frame} accessible accessibilityLabel={label}>
        {body}
      </View>
    );
  }

  const content = (
    <>
      <View style={{ aspectRatio: ratio, backgroundColor: COLOR.surface.media }}>
        {picture}
        {onPhoto ? (
          <>
            <Gradient style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '70%' }} />
            <View style={{ position: 'absolute', left: SPACING.md, right: SPACING.md, bottom: SPACING.md, gap: SPACING.xs }}>
              {kindLine}
              {titleRow}
            </View>
          </>
        ) : null}
        {tag ? (
          <View style={{ position: 'absolute', top: SPACING.sm, left: SPACING.sm, backgroundColor: COLOR.surface.glass, borderRadius: RADII.tag }}>
            <Tag label={tag.label} tone={tag.tone} raw={tag.raw} />
          </View>
        ) : null}
      </View>
      {onPhoto && !facts ? null : (
        <View style={{ paddingHorizontal: SPACING.md, paddingTop: SPACING.md, paddingBottom: action ? SPACING.md : SPACING.lg, gap: SPACING.xs }}>
          {onPhoto ? null : kindLine}
          {onPhoto ? null : titleRow}
          {facts}
        </View>
      )}
    </>
  );

  // The overlay (ⓘ, ✕) and the action sit outside the pressable body, so a screen reader reaches them.
  const overlayLayer = overlay ? (
    <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, top: 0, aspectRatio: ratio }}>
      {overlay}
    </View>
  ) : null;

  return (
    <View style={frame} onLayout={(e) => setWidth(Math.round(e.nativeEvent.layout.width))}>
      {onPress ? (
        <Press onPress={onPress} feedback={action ? 'control' : 'card'} label={label} hint={accessibilityHint}>
          {content}
        </Press>
      ) : (
        <View accessible accessibilityLabel={label}>
          {content}
        </View>
      )}
      {overlayLayer}
      {button ? <View style={{ paddingHorizontal: SPACING.md, paddingBottom: SPACING.lg, paddingTop: onPhoto && !meta && !detail ? SPACING.md : 0 }}>{button}</View> : null}
    </View>
  );
}

/** Below this much room (points at 1x text), a card is narrow: badge above the title, smaller title. */
export const NARROW_CARD = 220;

/** A card `width` points wide is narrow at this text size (a two-column grid; any card at large text sizes). */
export function narrowCard(width: number, fontScale = 1): boolean {
  return width > 0 && width / Math.max(1, fontScale) < NARROW_CARD;
}

/** The picture: photo, else the given fallback, else a drawing that's never a grey box. */
function Picture({
  kind,
  aspect,
  photo,
  fallback,
  paint,
  vehicle,
  shape,
  colour,
}: {
  kind: PhotoCardKind;
  /** The frame's shape: a photo of another shape is shown whole (FitImage), never cut. */
  aspect: number;
  photo?: Photo | null;
  fallback?: ReactNode;
  paint?: string;
  vehicle: VehicleKind;
  shape?: CarShape;
  colour?: string;
}) {
  if (photo) return <FitImage source={photo} frameAspect={aspect} />;
  if (fallback) return <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}>{fallback}</View>;
  if (kind === 'build') return <PaintArt paint={paint} vehicle={vehicle} shape={shape} />;
  return <AreaArt colour={colour ?? COLOR.layer.event} />;
}

/**
 * A build with no photo: its silhouette on a gradient of its paint colour (Redesign 2, 5.1),
 * never on grey. Fills its parent.
 */
export function PaintArt({ paint, vehicle = 'car', shape }: { paint?: string; vehicle?: VehicleKind; shape?: CarShape }) {
  const [h, setH] = useState(0);
  const p = paint ?? COLOR.paint[0];
  // A dark paint keeps a light outline so the shape still reads.
  const outlineColour = luminance(p) > 0.18 ? p : COLOR.text.secondary;
  return (
    <View onLayout={(e) => setH(Math.round(e.nativeEvent.layout.height))} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}>
      {h > 0 ? <BuildArt kind={vehicle} shape={shape} colour={outlineColour} height={h} /> : null}
      <Gradient colours={[rgba(p, 0.5), rgba(p, 0)]} />
    </View>
  );
}

/** Relative luminance of a hex colour, 0 (black) to 1 (white). */
function luminance(hex: string): number {
  const m = rgba(hex, 1).match(/\d+/g) ?? ['0', '0', '0'];
  const [r, g, b] = m.slice(0, 3).map((v) => {
    const c = Number(v) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * An event or place with no photo: a dark map tile with its area circle and a pin in the middle,
 * in the layer colour (the stand-in for a map snapshot). Fills its parent.
 */
/** The alphas in theme `tint()` (1f) and `line()` (40), for Svg fill and stroke opacity. */
const TINT_ALPHA = 0x1f / 255;
const LINE_ALPHA = 0x40 / 255;

export function AreaArt({ colour = COLOR.layer.event }: { colour?: string }) {
  return (
    <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: ART.mapBg }} aria-hidden>
      <Svg width="100%" height="100%" viewBox="0 0 160 90" preserveAspectRatio="xMidYMid slice">
        {[15, 35, 55, 75].map((y) => (
          <Line key={`h${y}`} x1={0} y1={y} x2={160} y2={y + 6} stroke={ART.mapGrid} strokeWidth={1.2} />
        ))}
        {[20, 55, 95, 130].map((x) => (
          <Line key={`v${x}`} x1={x} y1={0} x2={x - 8} y2={90} stroke={ART.mapGrid} strokeWidth={1.2} />
        ))}
        <Line x1={0} y1={62} x2={160} y2={30} stroke={COLOR.surface.raisedHi} strokeWidth={2.4} />
        {/* Colour and alpha apart: react-native-svg on iOS can draw an alpha colour solid (566aac1). */}
        <Circle cx={80} cy={45} r={28} fill={colour} fillOpacity={TINT_ALPHA} stroke={colour} strokeOpacity={LINE_ALPHA} strokeWidth={1.5} />
        <Circle cx={80} cy={45} r={5} fill={colour} />
      </Svg>
    </View>
  );
}
