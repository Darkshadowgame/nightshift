import { memo } from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

export type Glyph =
  | 'meet'
  | 'rolling'
  | 'cruise'
  | 'show'
  | 'trackday'
  | 'photo'
  | 'drive'
  | 'track'
  | 'venue'
  | 'you'
  | 'area'
  | 'locked'
  | 'camera'
  | 'average'
  // Shops layer: the layer itself, each category, and partners.
  | 'shop'
  | 'tuning'
  | 'parts'
  | 'gear'
  | 'dealer'
  | 'tyres'
  | 'detailing'
  | 'dyno'
  | 'garage'
  | 'coffee'
  | 'partner';

const INK = '#0b0f17';

/** Events are drawn filled ("something happening"); places, shops and cameras outlined ("somewhere to go"). */
export const FILLED_GLYPHS: ReadonlySet<Glyph> = new Set<Glyph>(['meet', 'rolling', 'cruise', 'show', 'trackday', 'locked']);

/**
 * Game-style hexagon badge with a glyph, as on the concept board. `count`
 * adds a small number badge (a group of places when zoomed out); `badge` a
 * short text one ("P" on partners, so the label is on the map too).
 * Memoised: map markers re-render only when what they draw changes.
 */
export const Pin = memo(function Pin({ glyph, colour, size = 36, count, badge }: { glyph: Glyph; colour: string; size?: number; count?: number; badge?: string }) {
  const filled = FILLED_GLYPHS.has(glyph);
  const svg = (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <Path d="M20 2 36 11v18L20 38 4 29V11Z" fill={filled ? colour : INK} stroke={colour} strokeWidth={2.5} />
      <GlyphShape glyph={glyph} c={filled ? INK : colour} />
    </Svg>
  );
  if (!count && !badge) return svg;
  const label = badge ?? (count! > 99 ? '99+' : String(count));
  return (
    <View style={{ width: size + 8, height: size + 4, paddingTop: 4 }}>
      {svg}
      <View
        style={{
          position: 'absolute', right: 0, top: 0, minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 4,
          backgroundColor: colour, borderWidth: 1.5, borderColor: INK, alignItems: 'center', justifyContent: 'center',
        }}
      >
        <Text style={{ color: INK, fontSize: 11, lineHeight: 13, fontFamily: 'BarlowCondensed_700Bold' }}>{label}</Text>
      </View>
    </View>
  );
});

function GlyphShape({ glyph, c }: { glyph: Glyph; c: string }) {
  switch (glyph) {
    case 'show':
      // A trophy: shows are judged.
      return (
        <>
          <Path d="M14 11h12v5a6 6 0 0 1-12 0z" fill={c} />
          <Path d="M14 13h-3v1.5a3.5 3.5 0 0 0 3.5 3.5M26 13h3v1.5a3.5 3.5 0 0 1-3.5 3.5" fill="none" stroke={c} strokeWidth={1.8} />
          <Path d="M20 22v4" stroke={c} strokeWidth={2.6} />
          <Rect x={15} y={26} width={10} height={3} rx={1} fill={c} />
        </>
      );
    case 'venue':
      // A building with a flag: somewhere that welcomes meets (cafés, museums).
      return (
        <>
          <Path d="M11 20 20 13.5 29 20" fill="none" stroke={c} strokeWidth={2.4} strokeLinejoin="round" />
          <Path d="M13.5 19v10h13V19" fill="none" stroke={c} strokeWidth={2.2} />
          <Rect x={18} y={23} width={4} height={6} fill={c} />
          <Path d="M20 13.5V8.5" stroke={c} strokeWidth={1.6} />
          <Path d="M20 8.5h5l-1.2 1.6L25 11.7h-5z" fill={c} />
        </>
      );
    case 'meet':
      return (
        <>
          <Circle cx={14} cy={20} r={3.4} fill={c} />
          <Circle cx={20} cy={15} r={3.4} fill={c} />
          <Circle cx={26} cy={20} r={3.4} fill={c} />
          <Circle cx={20} cy={25} r={3.4} fill={c} />
        </>
      );
    case 'rolling':
      return (
        <>
          <Circle cx={13} cy={20} r={3.2} fill={c} />
          <Circle cx={20} cy={20} r={3.2} fill={c} />
          <Path d="M25 15l5 5-5 5" fill="none" stroke={c} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
        </>
      );
    case 'cruise':
      return <Path d="M11 15l5 5-5 5M18 15l5 5-5 5M25 15l5 5-5 5" fill="none" stroke={c} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />;
    case 'photo':
      return (
        <>
          <Rect x={11} y={14} width={18} height={13} rx={2} fill="none" stroke={c} strokeWidth={2.4} />
          <Circle cx={20} cy={20.5} r={3.6} fill={c} />
          <Rect x={15} y={11.5} width={6} height={3} fill={c} />
        </>
      );
    case 'drive':
      return (
        <>
          <Path d="M13 28V11" stroke={c} strokeWidth={2.4} />
          <Path d="M13 12h14v9H13z" fill="none" stroke={c} strokeWidth={2} />
          <Path d="M13 12h3.5v3h-3.5zM20 12h3.5v3H20zM16.5 15H20v3h-3.5zM23.5 15H27v3h-3.5zM13 18h3.5v3H13zM20 18h3.5v3H20z" fill={c} />
        </>
      );
    case 'track':
    case 'trackday':
      return <Path d="M12 24c0-6 4-10 9-10 6 0 8 4 6 7s-6 1-7 4 4 3 6 3" fill="none" stroke={c} strokeWidth={2.6} strokeLinecap="round" />;
    case 'you':
      return <Path d="M20 10 27 29 20 25 13 29Z" fill={c} />;
    case 'locked':
      return (
        <>
          <Rect x={13} y={19} width={14} height={10} rx={1.5} fill={c} />
          <Path d="M16 19v-3a4 4 0 0 1 8 0v3" fill="none" stroke={c} strokeWidth={2.4} />
        </>
      );
    case 'camera':
      // A roadside speed camera: housing, lens and post.
      return (
        <>
          <Rect x={10} y={13} width={15} height={10} rx={1.5} fill={c} />
          <Path d="M25 15.5h3.5v5H25" fill="none" stroke={c} strokeWidth={2} />
          <Circle cx={15} cy={18} r={2.6} fill="#0b0f17" />
          <Path d="M17.5 23v7" stroke={c} strokeWidth={2.6} strokeLinecap="round" />
        </>
      );
    case 'average':
      // Average speed: a small camera over a dashed stretch of road.
      return (
        <>
          <Rect x={13} y={11} width={12} height={8} rx={1.2} fill={c} />
          <Circle cx={17} cy={15} r={2} fill="#0b0f17" />
          <Path d="M25 13h3v4h-3" fill="none" stroke={c} strokeWidth={1.8} />
          <Path d="M9 27h22" stroke={c} strokeWidth={2.6} strokeLinecap="round" strokeDasharray="4 3" />
          <Path d="M9 23v8M31 23v8" stroke={c} strokeWidth={2.2} strokeLinecap="round" />
        </>
      );
    case 'area':
      return <Circle cx={20} cy={20} r={6} fill="none" stroke={c} strokeWidth={2.4} strokeDasharray="3 3" />;
    case 'shop':
      // A shopfront: awning, window and door.
      return (
        <>
          <Path d="M11 17h18l-2.2-5H13.2z" fill={c} />
          <Path d="M12.5 17v11h15V17" fill="none" stroke={c} strokeWidth={2.2} />
          <Rect x={18} y={21} width={4.5} height={7} fill={c} />
        </>
      );
    case 'tuning':
      // Lightning bolt.
      return <Path d="M22.5 9.5 13 22h6l-2 8.5L27 18h-6z" fill={c} />;
    case 'parts':
      // A cog.
      return (
        <>
          <Circle cx={20} cy={20} r={7} fill="none" stroke={c} strokeWidth={3.6} strokeDasharray="3.1 2.4" />
          <Circle cx={20} cy={20} r={5} fill="none" stroke={c} strokeWidth={2} />
        </>
      );
    case 'gear':
      // A helmet with its visor.
      return (
        <>
          <Path d="M11 25c0-6.5 4-11 9.5-11 5.2 0 8.5 3.8 8.5 9v4H11z" fill={c} />
          <Path d="M19 19.5h9" stroke="#0b0f17" strokeWidth={2.6} strokeLinecap="round" />
        </>
      );
    case 'dealer':
      // A price tag.
      return (
        <>
          <Path d="M11.5 12.5h9l9 9-8 8-10-10z" fill="none" stroke={c} strokeWidth={2.4} strokeLinejoin="round" />
          <Circle cx={16} cy={17} r={2} fill={c} />
        </>
      );
    case 'tyres':
      return (
        <>
          <Circle cx={20} cy={20} r={7.5} fill="none" stroke={c} strokeWidth={3.6} />
          <Circle cx={20} cy={20} r={2.2} fill={c} />
        </>
      );
    case 'detailing':
      // A sparkle.
      return (
        <>
          <Path d="M18.5 11l1.9 6.6 6.6 1.9-6.6 1.9-1.9 6.6-1.9-6.6L10 19.5l6.6-1.9z" fill={c} />
          <Path d="M27 10.5l.9 2.6 2.6.9-2.6.9-.9 2.6-.9-2.6-2.6-.9 2.6-.9z" fill={c} />
        </>
      );
    case 'dyno':
      // A rev counter.
      return (
        <>
          <Path d="M11.5 26a8.5 8.5 0 1 1 17 0" fill="none" stroke={c} strokeWidth={2.6} strokeLinecap="round" />
          <Path d="M20 26l5-6.5" stroke={c} strokeWidth={2.6} strokeLinecap="round" />
          <Circle cx={20} cy={26} r={1.8} fill={c} />
        </>
      );
    case 'garage':
      // A spanner.
      return (
        <>
          <Path d="M21.5 18.5 12.5 27.5" stroke={c} strokeWidth={3.4} strokeLinecap="round" />
          <Path d="M27.6 13.4a4.6 4.6 0 0 1-5.9 5.9 4.6 4.6 0 0 1 2-8.6l-2.3 2.6.6 2.3 2.3.6z" fill={c} />
        </>
      );
    case 'coffee':
      // A cup with steam.
      return (
        <>
          <Path d="M11.5 18h13v5.5a5 5 0 0 1-5 5h-3a5 5 0 0 1-5-5z" fill={c} />
          <Path d="M24.5 20h1.8a2.6 2.6 0 0 1 0 5.2h-2" fill="none" stroke={c} strokeWidth={2} />
          <Path d="M15.5 15.5c-1-1.4 1-2.3 0-3.8M20 15.5c-1-1.4 1-2.3 0-3.8" fill="none" stroke={c} strokeWidth={1.6} strokeLinecap="round" />
        </>
      );
    case 'partner':
      // A star: partners are always marked as partners.
      return <Path d="M20 10.5l2.9 6 6.6.8-4.9 4.5 1.3 6.5L20 25l-5.9 3.3 1.3-6.5-4.9-4.5 6.6-.8z" fill={c} />;
  }
}
