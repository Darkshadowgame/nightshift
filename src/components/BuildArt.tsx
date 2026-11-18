import { View } from 'react-native';
import Svg, { Circle, Defs, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import type { CarShape } from '../lib/buildShape';
import type { VehicleKind } from '../lib/types';
import { ART, C, COLOR, RADII } from '../theme';

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
export function BuildArt({ kind, colour = C.sodium, height = 150, shape = 'saloon' }: { kind: VehicleKind; colour?: string; height?: number; shape?: CarShape }) {
  const car = CAR[shape];
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
