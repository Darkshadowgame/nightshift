import { useId } from 'react';
import { View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { C } from '../theme';

/**
 * A soft fade at the top and side edges of a small map card, so a road label or shield cut by the
 * card's edge melts into it instead of showing as a white sliver (Review 19 #5, look checklist).
 * The bottom edge is left clear: the map's credit chip sits there. Draws over the map, never takes
 * touches. Use it inside the card, after the map, with the map's wrapper at `zIndex: 0` so the web
 * map's own layers stay under it.
 */
export function MapEdgeFade({ size = 14 }: { size?: number }) {
  const id = `f${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  // iOS react-native-svg ignores the alpha in an rgba stopColor: colour and opacity apart (as Gradient).
  const stops = [<Stop key="a" offset="0" stopColor={C.asphalt} stopOpacity={0.9} />, <Stop key="b" offset="1" stopColor={C.asphalt} stopOpacity={0} />];
  const edge = { position: 'absolute' as const };
  return (
    <View pointerEvents="none" aria-hidden style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, zIndex: 1 }}>
      <View style={{ ...edge, left: 0, right: 0, top: 0, height: size }}>
        <Svg width="100%" height="100%" preserveAspectRatio="none">
          <Defs>
            <LinearGradient id={`${id}t`} x1="0" y1="0" x2="0" y2="1">{stops}</LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id}t)`} />
        </Svg>
      </View>
      <View style={{ ...edge, top: 0, bottom: 0, left: 0, width: size }}>
        <Svg width="100%" height="100%" preserveAspectRatio="none">
          <Defs>
            <LinearGradient id={`${id}l`} x1="0" y1="0" x2="1" y2="0">{stops}</LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id}l)`} />
        </Svg>
      </View>
      <View style={{ ...edge, top: 0, bottom: 0, right: 0, width: size }}>
        <Svg width="100%" height="100%" preserveAspectRatio="none">
          <Defs>
            <LinearGradient id={`${id}r`} x1="1" y1="0" x2="0" y2="0">{stops}</LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id}r)`} />
        </Svg>
      </View>
    </View>
  );
}
