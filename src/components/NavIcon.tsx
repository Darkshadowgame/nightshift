import { memo } from 'react';
import { Image, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import type { NavIconShape } from '../lib/driveView';
import { ART } from '../theme';

const INK = ART.ink;
const SHADE = ART.black;
const SHINE = ART.signWhite;

/**
 * Your icon in the driving view, seen from above and pointing up at `rotation` 0: an arrow, a
 * hatchback, saloon, coupé, estate, van, a bike, or your own picture. Drawn like the map pins
 * (Pin.tsx): your colour with ink detail and a crisp ink outline, plus a little shading (darker
 * flanks, a lit roof) so it reads as a shape on a light or dark map.
 */
export const NavIcon = memo(function NavIcon({
  shape,
  colour,
  size = 44,
  rotation = 0,
  photo,
}: {
  shape: NavIconShape;
  colour: string;
  size?: number;
  rotation?: number;
  /** Your own picture (shape 'photo'): an image URI. */
  photo?: string | null;
}) {
  if (shape === 'photo' && photo) return <PhotoIcon uri={photo} colour={colour} size={size} rotation={rotation} />;
  return (
    <View style={{ width: size, height: size, transform: [{ rotate: `${Math.round(rotation)}deg` }] }}>
      <Svg width={size} height={size} viewBox="0 0 40 40">
        <Shape shape={shape} c={colour} />
      </Svg>
    </View>
  );
});

/**
 * Your own picture: round, in a ring of your colour, with a notch on the rim that points the way
 * you're going (the whole icon turns, the notch leads).
 */
function PhotoIcon({ uri, colour, size, rotation }: { uri: string; colour: string; size: number; rotation: number }) {
  const ring = Math.max(2, Math.round(size * 0.07));
  const disc = Math.round(size * 0.74);
  const top = Math.round((size - disc) / 2) + Math.round(size * 0.05);
  return (
    <View style={{ width: size, height: size, transform: [{ rotate: `${Math.round(rotation)}deg` }] }}>
      <Svg width={size} height={size} viewBox="0 0 40 40" style={{ position: 'absolute' }}>
        {/* The notch: an arrowhead on top of the ring. */}
        <Path d="M20 1.5 26 9.5H14Z" fill={colour} stroke={INK} strokeWidth={1.4} strokeLinejoin="round" />
        <Circle cx={20} cy={22} r={17} fill={colour} stroke={INK} strokeWidth={1.4} />
      </Svg>
      <View
        style={{
          position: 'absolute',
          left: (size - disc) / 2,
          top,
          width: disc,
          height: disc,
          borderRadius: disc / 2,
          overflow: 'hidden',
          borderWidth: ring / 2,
          borderColor: INK,
          backgroundColor: INK,
        }}
      >
        {/* Turned back so the picture stays upright while the notch turns. */}
        <Image source={{ uri }} style={{ width: '100%', height: '100%', transform: [{ rotate: `${-Math.round(rotation)}deg` }] }} resizeMode="cover" accessibilityIgnoresInvertColors />
      </View>
    </View>
  );
}

/** A car seen from above, 40 × 40, nose at the top. Every length is in the box's units. */
interface CarSpec {
  /** Front and back of the body. */
  front: number;
  back: number;
  /** Half the body's width. */
  half: number;
  /** Corner rounding at the nose and the tail. */
  noseR: number;
  tailR: number;
  /** Windscreen from its base (bonnet) to the roof. */
  screen: [number, number];
  /** Where the roof ends; the rear window runs from there to `rear`, or there's none (van). */
  roofEnd: number;
  rear: number | null;
  /** Wheel centres. */
  wheels: [number, number];
  rails?: boolean;
}

const CARS: Record<'hatch' | 'saloon' | 'coupe' | 'estate' | 'van', CarSpec> = {
  hatch: { front: 6, back: 34, half: 7.6, noseR: 5, tailR: 3, screen: [13, 18], roofEnd: 27.5, rear: 31.5, wheels: [11, 29] },
  saloon: { front: 3.5, back: 36.5, half: 7.4, noseR: 5, tailR: 4, screen: [12.5, 17.5], roofEnd: 25, rear: 29, wheels: [10, 30] },
  coupe: { front: 3.5, back: 36.5, half: 8, noseR: 6, tailR: 5, screen: [14.5, 20.5], roofEnd: 24.5, rear: 28.5, wheels: [10, 30.5] },
  estate: { front: 3.5, back: 36.5, half: 7.4, noseR: 5, tailR: 2.5, screen: [12.5, 17.5], roofEnd: 32.8, rear: 35.3, wheels: [10, 30], rails: true },
  van: { front: 3, back: 37, half: 8.4, noseR: 3.5, tailR: 1.5, screen: [7.5, 11.5], roofEnd: 37, rear: null, wheels: [8.5, 31] },
};

function carBody(s: CarSpec): string {
  const l = 20 - s.half;
  const r = 20 + s.half;
  return [
    `M${l} ${s.front + s.noseR}`,
    `Q${l} ${s.front} ${l + s.noseR} ${s.front}`,
    `H${r - s.noseR}`,
    `Q${r} ${s.front} ${r} ${s.front + s.noseR}`,
    `V${s.back - s.tailR}`,
    `Q${r} ${s.back} ${r - s.tailR} ${s.back}`,
    `H${l + s.tailR}`,
    `Q${l} ${s.back} ${l} ${s.back - s.tailR}`,
    'Z',
  ].join('');
}

/** A trapezoid across the car from y0 (half-width w0) to y1 (half-width w1). */
function band(y0: number, w0: number, y1: number, w1: number): string {
  return `M${20 - w0} ${y0}H${20 + w0}L${20 + w1} ${y1}H${20 - w1}Z`;
}

function Car({ s, c }: { s: CarSpec; c: string }) {
  const outline = { stroke: INK, strokeWidth: 1.4, strokeLinejoin: 'round' as const };
  const roofHalf = s.half - 2.6;
  const flank = 1.7;
  return (
    <G>
      {/* Tyres just showing past the body. */}
      {s.wheels.map((y) => (
        <G key={y}>
          <Rect x={20 - s.half - 1.1} y={y - 2.8} width={2.4} height={5.6} rx={1} fill={INK} />
          <Rect x={20 + s.half - 1.3} y={y - 2.8} width={2.4} height={5.6} rx={1} fill={INK} />
        </G>
      ))}
      {/* Mirrors. */}
      <Ellipse cx={20 - s.half - 1.2} cy={s.screen[0] + 0.8} rx={1.6} ry={1} fill={c} {...outline} strokeWidth={1} />
      <Ellipse cx={20 + s.half + 1.2} cy={s.screen[0] + 0.8} rx={1.6} ry={1} fill={c} {...outline} strokeWidth={1} />
      <Path d={carBody(s)} fill={c} {...outline} />
      {/* Shading: darker flanks either side of the roof line. */}
      <Path d={`M${20 - s.half + 0.7} ${s.front + s.noseR}V${s.back - s.tailR}H${20 - s.half + 0.7 + flank}V${s.front + s.noseR}Z`} fill={SHADE} opacity={0.22} />
      <Path d={`M${20 + s.half - 0.7 - flank} ${s.front + s.noseR}V${s.back - s.tailR}H${20 + s.half - 0.7}V${s.front + s.noseR}Z`} fill={SHADE} opacity={0.22} />
      {/* Headlights and tail lights. */}
      <Path d={`M${20 - s.half + 1.2} ${s.front + 1.6}q1.6 -1 3.4 -0.9v1.4h-3.2z`} fill={SHINE} opacity={0.95} />
      <Path d={`M${20 + s.half - 1.2} ${s.front + 1.6}q-1.6 -1 -3.4 -0.9v1.4h3.2z`} fill={SHINE} opacity={0.95} />
      <Rect x={20 - s.half + 0.9} y={s.back - 1.6} width={3} height={1.1} rx={0.5} fill={ART.signRed} />
      <Rect x={20 + s.half - 3.9} y={s.back - 1.6} width={3} height={1.1} rx={0.5} fill={ART.signRed} />
      {/* Glass: windscreen, side windows, rear window. */}
      <Path d={band(s.screen[0], s.half - 1.3, s.screen[1], roofHalf)} fill={INK} />
      <Path d={band(s.screen[0] + 0.9, s.half - 2.4, s.screen[0] + 2.2, s.half - 2.9)} fill={SHINE} opacity={0.18} />
      <Path d={`M${20 - s.half + 0.6} ${s.screen[1]}V${s.roofEnd - 0.4}H${20 - roofHalf}V${s.screen[1]}Z`} fill={INK} opacity={0.85} />
      <Path d={`M${20 + roofHalf} ${s.screen[1]}V${s.roofEnd - 0.4}H${20 + s.half - 0.6}V${s.screen[1]}Z`} fill={INK} opacity={0.85} />
      {s.rear != null ? <Path d={band(s.roofEnd, roofHalf, s.rear, s.half - 1.5)} fill={INK} /> : null}
      {/* The roof, lit from above. */}
      <Path d={band(s.screen[1], roofHalf, s.roofEnd, roofHalf)} fill={c} />
      <Path d={band(s.screen[1] + 0.8, roofHalf - 1.2, s.roofEnd - 1.2, roofHalf - 1.2)} fill={SHINE} opacity={0.16} />
      {s.rails ? <Path d={`M${20 - roofHalf + 0.8} ${s.screen[1] + 1}V${s.roofEnd - 1}M${20 + roofHalf - 0.8} ${s.screen[1] + 1}V${s.roofEnd - 1}`} stroke={INK} strokeWidth={0.9} strokeLinecap="round" /> : null}
      {s.rear == null ? (
        // A van's roof: stiffening ribs instead of a rear window.
        <Path d={`M${20 - roofHalf + 0.6} 20H${20 + roofHalf - 0.6}M${20 - roofHalf + 0.6} 26H${20 + roofHalf - 0.6}M${20 - roofHalf + 0.6} 32H${20 + roofHalf - 0.6}`} stroke={INK} strokeWidth={0.8} opacity={0.6} />
      ) : null}
    </G>
  );
}

function Bike({ c }: { c: string }) {
  const outline = { stroke: INK, strokeWidth: 1.3, strokeLinejoin: 'round' as const };
  return (
    <G>
      {/* Tyres, rimmed in your colour so they show on a dark map. */}
      <Rect x={17.9} y={2.5} width={4.2} height={9} rx={2.1} fill={INK} stroke={c} strokeWidth={0.9} />
      <Rect x={17.6} y={28} width={4.8} height={9.5} rx={2.4} fill={INK} stroke={c} strokeWidth={0.9} />
      {/* Bars with grips and mirrors. */}
      <Path d="M10 12.5Q20 10.5 30 12.5" stroke={INK} strokeWidth={4} strokeLinecap="round" fill="none" />
      <Path d="M10 12.5Q20 10.5 30 12.5" stroke={c} strokeWidth={2} strokeLinecap="round" fill="none" />
      <Circle cx={11} cy={9.5} r={1.5} fill={c} {...outline} strokeWidth={1} />
      <Circle cx={29} cy={9.5} r={1.5} fill={c} {...outline} strokeWidth={1} />
      {/* Headlight and fairing. */}
      <Path d="M15.5 9.5Q20 6 24.5 9.5L23.5 12H16.5Z" fill={c} {...outline} />
      <Ellipse cx={20} cy={8.6} rx={2} ry={1} fill={SHINE} opacity={0.9} />
      {/* Tank, seat (shaded), tail and tail light. */}
      <Path d="M15.5 13.5Q20 12 24.5 13.5L23.5 20Q20 21.5 16.5 20Z" fill={c} {...outline} />
      <Path d="M17.5 14.3Q20 13.6 22.5 14.3L22.1 16.5Q20 17 17.9 16.5Z" fill={SHINE} opacity={0.25} />
      <Path d="M17 20.5Q20 19.8 23 20.5L22.4 29Q20 29.8 17.6 29Z" fill={c} {...outline} />
      <Path d="M17 20.5Q20 19.8 23 20.5L22.4 29Q20 29.8 17.6 29Z" fill={SHADE} opacity={0.45} />
      <Path d="M17.8 29H22.2L21.4 33H18.6Z" fill={c} {...outline} />
      <Rect x={18.6} y={32.2} width={2.8} height={0.9} rx={0.4} fill={ART.signRed} />
      {/* The rider from above: shoulders and helmet. */}
      <Ellipse cx={20} cy={22.5} rx={5.2} ry={2.6} fill={c} {...outline} />
      <Ellipse cx={21.5} cy={22.8} rx={3} ry={1.8} fill={SHADE} opacity={0.2} />
      <Circle cx={20} cy={21.2} r={2.9} fill={INK} stroke={c} strokeWidth={1.2} />
      <Path d="M18.4 19.9Q20 19 21.6 19.9" stroke={SHINE} strokeWidth={0.8} opacity={0.6} fill="none" />
    </G>
  );
}

function Arrow({ c }: { c: string }) {
  return (
    <G>
      <Path d="M20 3.5 33 35 20 27.5 7 35Z" fill={c} stroke={INK} strokeWidth={1.6} strokeLinejoin="round" />
      {/* The right half in shadow: it reads as a raised chevron. */}
      <Path d="M20 5.5 31.6 33.4 20 26.6Z" fill={SHADE} opacity={0.2} />
      <Path d="M20 8 11.5 29.5" stroke={SHINE} strokeWidth={1} opacity={0.35} strokeLinecap="round" />
    </G>
  );
}

function Shape({ shape, c }: { shape: NavIconShape; c: string }) {
  switch (shape) {
    case 'hatch':
    case 'saloon':
    case 'coupe':
    case 'estate':
    case 'van':
      return <Car s={CARS[shape]} c={c} />;
    case 'bike':
      return <Bike c={c} />;
    case 'arrow':
    case 'photo':
    default:
      return <Arrow c={c} />;
  }
}
