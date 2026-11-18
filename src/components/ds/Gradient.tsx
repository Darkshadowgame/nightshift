import { useId } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { COLOR } from '../../theme';

/**
 * The one gradient (SVG, so it draws the same on iOS and web). It fills its parent (absolute)
 * unless given a `style`, and never takes touches.
 *
 * - Default: `COLOR.surface.photoFade`, transparent at the top to asphalt 90% at the bottom: the
 *   fade under a title on a photo (PhotoCard, Hero).
 * - `colours` for anything else, top → bottom (a build's paint colour behind its silhouette).
 * - `to="top"` flips it (dark at the top, for chrome over a photo).
 */
export function Gradient({
  colours = COLOR.surface.photoFade,
  to = 'bottom',
  style,
}: {
  /** Two CSS colours, start → end. rgba works. */
  colours?: readonly [string, string];
  /** Which edge the second colour sits on. */
  to?: 'bottom' | 'top';
  style?: StyleProp<ViewStyle>;
}) {
  // One id per instance: two gradients on a page must not share a <defs> id on web.
  const id = `g${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const [a, b] = to === 'bottom' ? colours : [colours[1], colours[0]];
  return (
    <View pointerEvents="none" aria-hidden style={style ?? { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}>
      <Svg width="100%" height="100%" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={a} />
            <Stop offset="1" stopColor={b} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}
