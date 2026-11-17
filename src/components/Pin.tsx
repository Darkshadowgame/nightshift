import Svg, { Circle, Path, Rect } from 'react-native-svg';

export type Glyph = 'meet' | 'rolling' | 'cruise' | 'show' | 'trackday' | 'photo' | 'drive' | 'track' | 'you' | 'area' | 'locked';

/** Game-style hexagon badge with a glyph, as on the concept board. */
export function Pin({ glyph, colour, size = 36 }: { glyph: Glyph; colour: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <Path d="M20 2 36 11v18L20 38 4 29V11Z" fill="#0b0f17" stroke={colour} strokeWidth={2.5} />
      <GlyphShape glyph={glyph} c={colour} />
    </Svg>
  );
}

function GlyphShape({ glyph, c }: { glyph: Glyph; c: string }) {
  switch (glyph) {
    case 'meet':
    case 'show':
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
    case 'area':
      return <Circle cx={20} cy={20} r={6} fill="none" stroke={c} strokeWidth={2.4} strokeDasharray="3 3" />;
  }
}
