import { Image, Text, View, type ImageSourcePropType } from 'react-native';
import type { ClassLetter, VehicleKind } from '../../lib/types';
import { COLOR, F, RADII, SPACING, outline } from '../../theme';
import { BuildArt } from '../BuildArt';
import type { CarShape } from '../../lib/buildShape';
import { initials } from './logic';
import { DsText } from './Text';

/** A photo: a URI string (photoUri(ref)) or a bundled image. */
export type Photo = string | ImageSourcePropType;
const src = (p: Photo) => (typeof p === 'string' ? { uri: p } : p);

export type AvatarSize = 'sm' | 'md' | 'lg';
export const AVATAR_SIZE: Record<AvatarSize, number> = { sm: 28, md: 40, lg: 76 };

/**
 * A person: their photo, or their initials in chalk on kerb. Never sodium (a person isn't an
 * action) and never a class badge (a class belongs to a build). Always leading in a row.
 * Decorative by default, because the row next to it says the name; pass `label` when it stands alone.
 */
export function Avatar({
  name,
  handle,
  photo,
  size = 'md',
  label,
}: {
  name?: string | null;
  handle?: string | null;
  photo?: Photo | null;
  size?: AvatarSize;
  label?: string;
}) {
  const dim = AVATAR_SIZE[size];
  const frame = { width: dim, height: dim, borderRadius: dim / 2 };
  const a11y = label
    ? { accessible: true, accessibilityRole: 'image' as const, accessibilityLabel: label }
    : { 'aria-hidden': true };
  if (photo) {
    return <Image source={src(photo)} style={[frame, { backgroundColor: COLOR.surface.media }]} accessibilityIgnoresInvertColors {...a11y} />;
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

/** A build's thumbnail: its first photo, or its silhouette. 4:3, control radius. Separate from Avatar on purpose. */
export function BuildThumb({ photo, kind = 'car', shape, size = 56, label }: { photo?: Photo | null; kind?: VehicleKind; shape?: CarShape; size?: number; label?: string }) {
  const frame = { width: Math.round((size * 4) / 3), height: size, borderRadius: RADII.control, overflow: 'hidden' as const, backgroundColor: COLOR.surface.media };
  if (photo) return <Image source={src(photo)} style={frame} accessibilityLabel={label} accessibilityIgnoresInvertColors />;
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
                ? COLOR.action.selected
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
