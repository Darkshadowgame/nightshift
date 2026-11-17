import { View } from 'react-native';
import Svg, { Circle, Defs, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import type { VehicleKind } from '../lib/types';
import { C } from '../theme';

/** Placeholder art for a build with no photo yet: a silhouette in the build's colour. */
export function BuildArt({ kind, colour = C.sodium, height = 150 }: { kind: VehicleKind; colour?: string; height?: number }) {
  return (
    <View style={{ height, borderRadius: 10, overflow: 'hidden', backgroundColor: '#111827' }}>
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
            <Path
              d="M28 82c2-10 10-14 26-16l30-14c10-4 22-6 40-6h30c14 0 26 6 38 14l22 5c12 2 18 6 20 14v6H28z"
              fill="#1d2636"
              stroke={colour}
              strokeWidth={1.6}
            />
            <Path d="M96 54l16-6h30l20 10H96z" fill="#0b0f17" />
            <Circle cx={72} cy={86} r={12} fill="#070a10" stroke={C.fog} strokeWidth={2} />
            <Circle cx={180} cy={86} r={12} fill="#070a10" stroke={C.fog} strokeWidth={2} />
          </>
        ) : (
          <>
            <Circle cx={78} cy={82} r={16} fill="#070a10" stroke={C.fog} strokeWidth={2.5} />
            <Circle cx={166} cy={82} r={16} fill="#070a10" stroke={C.fog} strokeWidth={2.5} />
            <Path d="M78 82l26-28h34l14 10 14 18M104 54l-6-12h-8M138 54l20-14h14" fill="none" stroke={colour} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M104 54c8-10 26-12 40-6l12 8-12 8h-30z" fill="#1d2636" stroke={colour} strokeWidth={1.6} />
          </>
        )}
      </Svg>
    </View>
  );
}
