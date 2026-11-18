import { useId, useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import type { CarShape } from '../lib/buildShape';
import type { VehicleKind } from '../lib/types';
import { ART, C, COLOR, RADII } from '../theme';

/** The paint used when a build's colour isn't known: a deep blue, never grey (Redesign 2, 5.1). */
export const DEFAULT_PAINT = COLOR.paint[3];

/** Mix a hex colour with white (`amount` > 0) or black (< 0). Returns a hex. */
export function shade(hex: string, amount: number): string {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h.slice(0, 6);
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return shade(DEFAULT_PAINT, amount);
  const target = amount > 0 ? 255 : 0;
  const t = Math.min(1, Math.abs(amount));
  const mix = (v: number) => Math.round(v + (target - v) * t);
  const out = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(mix);
  return `#${out.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}


/** Car outlines in a 240×110 box: body, then the glass. Wheels sit at x 72 and 180. */
const CAR: Record<CarShape, { body: string; glass: string }> = {
  saloon: {
    body: 'M28 82c2-10 10-14 26-16l30-14c10-4 22-6 40-6h30c14 0 26 6 38 14l22 5c12 2 18 6 20 14v6H28z',
    glass: 'M96 54l16-6h30l20 10H96z',
  },
  // Short tail and a near-upright tailgate.
  hatch: {
    body: 'M30 82c2-10 10-14 26-16l28-16c10-5 22-7 38-7h44c12 0 18 4 22 12l6 14c8 2 12 6 13 13v6H30z',
    glass: 'M96 53l18-8h40c6 0 10 3 12 9l2 6H96z',
  },
  // Long bonnet, low roof sloping to the tail.
  coupe: {
    body: 'M24 84c2-9 10-13 28-15l40-12c10-4 20-6 32-6h22c14 0 28 8 42 16l20 3c10 2 16 6 18 14v4H24z',
    glass: 'M108 58l14-5h24l26 12H108z',
  },
};

/** Placeholder art for a build with no photo yet: a silhouette in the build's card colour (picked when adding it). */
export function BuildArt({ kind, colour = C.sodium, height = 150, shape = 'saloon', paint }: { kind: VehicleKind; colour?: string; height?: number; shape?: CarShape; /** Draw the body in this paint on its own gradient (never grey). */ paint?: string }) {
  const car = CAR[shape];
  if (paint) return <PaintedSvg kind={kind} shape={shape} paint={paint} height={height} />;
  return (
    <View style={{ height, borderRadius: RADII.control, overflow: 'hidden', backgroundColor: COLOR.surface.media }}>
      <Svg width="100%" height="100%" viewBox="0 0 240 110" preserveAspectRatio="xMidYMid meet">
        <Defs>
          <RadialGradient id="glow" cx="50%" cy="110%" r="70%">
            <Stop offset="0" stopColor={colour} stopOpacity={0.45} />
            <Stop offset="1" stopColor={colour} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width="240" height="110" fill="url(#glow)" />
        {kind === 'car' ? (
          <>
            <Path d={car.body} fill={ART.body} stroke={colour} strokeWidth={1.6} />
            <Path d={car.glass} fill={ART.ink} />
            <Circle cx={72} cy={86} r={12} fill={ART.shadow} stroke={C.fog} strokeWidth={2} />
            <Circle cx={180} cy={86} r={12} fill={ART.shadow} stroke={C.fog} strokeWidth={2} />
          </>
        ) : (
          <>
            <Circle cx={78} cy={82} r={16} fill={ART.shadow} stroke={C.fog} strokeWidth={2.5} />
            <Circle cx={166} cy={82} r={16} fill={ART.shadow} stroke={C.fog} strokeWidth={2.5} />
            <Path d="M78 82l26-28h34l14 10 14 18M104 54l-6-12h-8M138 54l20-14h14" fill="none" stroke={colour} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M104 54c8-10 26-12 40-6l12 8-12 8h-30z" fill={ART.body} stroke={colour} strokeWidth={1.6} />
          </>
        )}
      </Svg>
    </View>
  );
}

/**
 * A build with no photo, drawn in its paint (Redesign 2, 5.1): the body in the build's colour on a
 * gradient of that colour, with a light rim so a dark paint still reads. Unknown paint gets
 * `DEFAULT_PAINT`, never grey. Fills its parent (absolute).
 */
export function PaintedArt({ paint, vehicle = 'car', shape }: { paint?: string | null; vehicle?: VehicleKind; shape?: CarShape }) {
  const [h, setH] = useState(0);
  return (
    <View onLayout={(e) => setH(Math.round(e.nativeEvent.layout.height))} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} aria-hidden>
      {h > 0 ? <PaintedSvg kind={vehicle} shape={shape ?? 'saloon'} paint={paint || DEFAULT_PAINT} height={h} fill /> : null}
    </View>
  );
}

function PaintedSvg({ kind, shape, paint, height, fill }: { kind: VehicleKind; shape: CarShape; paint: string; height: number; fill?: boolean }) {
  // One id set per instance: two drawings on a page must not share <defs> ids on web.
  const id = `p${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const car = CAR[shape];
  const light = shade(paint, 0.35);
  const rim = shade(paint, 0.55);
  const deep = shade(paint, -0.45);
  return (
    <View style={{ height, borderRadius: fill ? 0 : RADII.control, overflow: 'hidden', backgroundColor: shade(paint, -0.8) }}>
      {/* Filling a card, the drawing gets room above and below so the whole car shows at 4:3 or 16:9. */}
      <Svg width="100%" height="100%" viewBox={fill ? '-10 -30 260 195' : '0 0 240 110'} preserveAspectRatio="xMidYMid slice">
        <Defs>
          <LinearGradient id={`${id}bg`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={shade(paint, -0.25)} stopOpacity={1} />
            <Stop offset="1" stopColor={shade(paint, -0.85)} stopOpacity={1} />
          </LinearGradient>
          <RadialGradient id={`${id}glow`} cx="50%" cy="58%" r="40%">
            <Stop offset="0" stopColor={light} stopOpacity={0.45} />
            <Stop offset="1" stopColor={light} stopOpacity={0} />
          </RadialGradient>
          <LinearGradient id={`${id}body`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={light} stopOpacity={1} />
            <Stop offset="0.55" stopColor={paint} stopOpacity={1} />
            <Stop offset="1" stopColor={deep} stopOpacity={1} />
          </LinearGradient>
        </Defs>
        <Rect x={-120} y={-120} width={480} height={360} fill={`url(#${id}bg)`} />
        <Rect x={-120} y={-120} width={480} height={360} fill={`url(#${id}glow)`} />
        <Ellipse cx={126} cy={98} rx={92} ry={6} fill={ART.shadow} opacity={0.7} />
        {kind === 'car' ? (
          <>
            <Path d={car.body} fill={`url(#${id}body)`} stroke={rim} strokeWidth={1.2} />
            <Path d={car.glass} fill={ART.ink} stroke={rim} strokeWidth={0.6} opacity={0.95} />
            <Circle cx={72} cy={86} r={12} fill={ART.shadow} stroke={C.fog} strokeWidth={2} />
            <Circle cx={72} cy={86} r={5} fill={C.fog} opacity={0.5} />
            <Circle cx={180} cy={86} r={12} fill={ART.shadow} stroke={C.fog} strokeWidth={2} />
            <Circle cx={180} cy={86} r={5} fill={C.fog} opacity={0.5} />
          </>
        ) : (
          <>
            <Circle cx={78} cy={82} r={16} fill={ART.shadow} stroke={C.fog} strokeWidth={2.5} />
            <Circle cx={166} cy={82} r={16} fill={ART.shadow} stroke={C.fog} strokeWidth={2.5} />
            <Path d="M78 82l26-28h34l14 10 14 18M104 54l-6-12h-8M138 54l20-14h14" fill="none" stroke={rim} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M104 54c8-10 26-12 40-6l12 8-12 8h-30z" fill={`url(#${id}body)`} stroke={rim} strokeWidth={1.2} />
          </>
        )}
      </Svg>
    </View>
  );
}
