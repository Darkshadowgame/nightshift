import { createContext, useContext } from 'react';
import { Image, Text, View, type ImageSourcePropType } from 'react-native';
import type { ClassLetter, VehicleKind } from '../../lib/types';
import { COLOR, F, RADII, SPACING, outline } from '../../theme';
import { BuildArt } from '../BuildArt';
import type { CarShape } from '../../lib/buildShape';
import { initials } from './logic';
import { FitImage } from './FitImage';
import { DsText } from './Text';

/** A photo: a URI string (photoUri(ref)) or a bundled image. */
export type Photo = string | ImageSourcePropType;
const src = (p: Photo) => (typeof p === 'string' ? { uri: p } : p);

export type AvatarSize = 'sm' | 'md' | 'lg';

/**
 * A person's default picture, by handle: their main build's photo (Review 19 #33, "car-photo
 * avatars"). Provided once at the root (AvatarPhotos.tsx); without it, or for someone with no
 * photo, the Avatar shows initials.
 */
export const AvatarPhotoContext = createContext<((handle: string) => Photo | null) | null>(null);
export const AVATAR_SIZE: Record<AvatarSize, number> = { sm: 28, md: 40, lg: 76 };

/**
 * A person: their photo (by default their main build's, AvatarPhotoContext), or their initials in chalk on kerb. Never sodium (a person isn't an
 * action) and never a class badge (a class belongs to a build). Always leading in a row.
 * Decorative by default, because the row next to it says the name; pass `label` when it stands alone.
 */
export function Avatar({
  name,
  handle,
  photo,
  size = 'md',
  label,
  close,
}: {
  name?: string | null;
  handle?: string | null;
  photo?: Photo | null;
  size?: AvatarSize;
  label?: string;
  /**
   * A close crop of the car photo (Me, Review 20 #29): where the whole car is shown right under the
   * avatar, the avatar is a detail of it (about 2.4x in, a little below the middle: lights, wheel arch),
   * so the two never read as the same picture twice.
   */
  close?: boolean;
}) {
  const lookup = useContext(AvatarPhotoContext);
  const dim = AVATAR_SIZE[size];
  const frame = { width: dim, height: dim, borderRadius: dim / 2 };
  const pic = photo ?? (handle && lookup ? lookup(handle) : null);
  const a11y = label
    ? { accessible: true, accessibilityRole: 'image' as const, accessibilityLabel: label }
    : { 'aria-hidden': true };
  if (pic && close) {
    return (
      <View {...a11y} style={[frame, { overflow: 'hidden', backgroundColor: COLOR.surface.media, borderWidth: 1, borderColor: COLOR.avatar.border }]}>
        <Image
          source={src(pic)}
          resizeMode="cover"
          style={{ position: 'absolute', width: dim, height: dim, transform: [{ scale: 2.4 }, { translateX: -dim * 0.1 }, { translateY: dim * 0.05 }] }}
          accessibilityIgnoresInvertColors
        />
      </View>
    );
  }
  if (pic) {
    return <Image source={src(pic)} resizeMode="cover" style={[frame, { backgroundColor: COLOR.surface.media, borderWidth: 1, borderColor: COLOR.avatar.border }]} accessibilityIgnoresInvertColors {...a11y} />;
  }
  const text = initials(name, handle);
  return (
    <View
      {...a11y}
      style={[frame, { backgroundColor: COLOR.avatar.bg, borderWidth: 1, borderColor: COLOR.avatar.border, alignItems: 'center', justifyContent: 'center' }]}
    >
      {/* Fixed size: the tile can't grow, the name beside it does. */}
      <Text allowFontScaling={false} style={{ fontFamily: F.displayMed, color: COLOR.avatar.fg, fontSize: dim * (text.length > 1 ? 0.36 : 0.42) }}>
        {text}
      </Text>
    </View>
  );
}

export type BadgeSize = 'sm' | 'md' | 'lg' | 'xl';
const BADGE: Record<BadgeSize, number> = { sm: 22, md: 32, lg: 52, xl: 92 };

/** A build's class letter in its metal. Belongs to a build, never to a person. */
export function ClassBadge({ letter, size = 'md', decorative }: { letter: ClassLetter; size?: BadgeSize; decorative?: boolean }) {
  const dim = BADGE[size];
  const colour = COLOR.classMetal[letter];
  return (
    <View
      accessible={!decorative}
      accessibilityRole={decorative ? undefined : 'image'}
      accessibilityLabel={decorative ? undefined : `Class ${letter}`}
      aria-hidden={decorative}
      style={{
        width: dim,
        height: dim,
        borderWidth: size === 'sm' ? 1.5 : 2,
        borderColor: colour,
        borderRadius: RADII.tag,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLOR.surface.bg,
        transform: [{ skewX: '-8deg' }],
      }}
    >
      <Text allowFontScaling={false} style={{ fontFamily: F.displayItalic, color: colour, fontSize: dim * 0.55, lineHeight: dim * 0.7 }}>
        {letter}
      </Text>
    </View>
  );
}

/**
 * A build in a line (K3): its ClassBadge, its name and its one power figure, "197 bhp". The way a
 * build is said inside a person's row, a going list or a search result.
 *
 *   <BuildLine letter="B" name="Volkswagen Golf GTI Mk7" power="230 bhp" />
 */
export function BuildLine({ letter, name, power }: { letter: ClassLetter; name: string; power: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs }}>
      <ClassBadge letter={letter} size="sm" decorative />
      {/* Two lines at large text: a name wraps by words rather than being cut (Review 13). The power
          keeps its number and unit together ("· 197 bhp" never splits as "197 / bhp", Review 15). */}
      <DsText v="secondary" numberOfLines={2} style={{ flexShrink: 1 }}>
        {`${name} ·\u00A0${power.replace(/ /g, '\u00A0')}`}
      </DsText>
    </View>
  );
}

/** A build's thumbnail: its first photo, or its silhouette. 4:3, control radius. Separate from Avatar on purpose. */
export function BuildThumb({ photo, kind = 'car', shape, size = 56, label }: { photo?: Photo | null; kind?: VehicleKind; shape?: CarShape; size?: number; label?: string }) {
  const frame = { width: Math.round((size * 4) / 3), height: size, borderRadius: RADII.control, overflow: 'hidden' as const, backgroundColor: COLOR.surface.media };
  if (photo) return <FitImage fit="cover" source={photo} frameAspect={4 / 3} style={frame} accessibilityLabel={label} />;
  return (
    <View style={frame} accessibilityLabel={label} accessible={!!label} accessibilityRole={label ? 'image' : undefined}>
      <BuildArt kind={kind} shape={shape} colour={COLOR.text.secondary} height={size} />
    </View>
  );
}

export type TagTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'live' | 'selected';

/**
 * A state, in one small outlined capsule: Going, Hosting, Waiting, Sample, Live. Tones are
 * states only (no layer colours). `raw` keeps the text as typed (names).
 */
export function Tag({ label, tone = 'neutral', raw, accessibilityLabel }: { label: string; tone?: TagTone; raw?: boolean; accessibilityLabel?: string }) {
  const c =
    tone === 'success'
      ? COLOR.state.success
      : tone === 'warning'
        ? COLOR.state.warning
        : tone === 'danger'
          ? COLOR.state.danger
          : tone === 'info'
            ? COLOR.state.info
            : tone === 'live'
              ? COLOR.state.live
              : tone === 'selected'
                ? COLOR.text.primary
                : COLOR.text.secondary;
  return (
    <View
      accessible
      accessibilityLabel={accessibilityLabel ?? label}
      style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, borderWidth: 1, borderColor: outline(c), borderRadius: RADII.tag, paddingHorizontal: SPACING.xs + SPACING.xxs, paddingVertical: SPACING.xxs }}
    >
      {tone === 'live' ? <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: COLOR.state.liveDot }} /> : null}
      <DsText v="tag" numberOfLines={1} style={[{ color: c }, raw && { textTransform: 'none', letterSpacing: 0.3 }]}>
        {label}
      </DsText>
    </View>
  );
}
