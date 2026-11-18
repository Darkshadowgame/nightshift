import { memo } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import type { NavIconShape } from '../lib/driveView';
import { ART } from '../theme';

const INK = ART.ink;

/**
 * Your icon in the driving view: an arrow, a car seen from above (hatchback,
 * saloon, coupé, estate or van) or a bike, in your colour, pointing up at
 * `rotation` 0. Drawn like the map pins (Pin.tsx): one flat colour with ink
 * detail and an ink outline so it reads on any part of the dark map.
 */
export const NavIcon = memo(function NavIcon({ shape, colour, size = 44, rotation = 0 }: { shape: NavIconShape; colour: string; size?: number; rotation?: number }) {
  return (
    <View style={{ width: size, height: size, transform: [{ rotate: `${Math.round(rotation)}deg` }] }}>
      <Svg width={size} height={size} viewBox="0 0 40 40">
        <Shape shape={shape} c={colour} />
      </Svg>
    </View>
  );
});

function Shape({ shape, c }: { shape: NavIconShape; c: string }) {
  const outline = { stroke: INK, strokeWidth: 1.6, strokeLinejoin: 'round' as const };
  switch (shape) {
    case 'hatch':
      return (
        <>
          <Path d="M13 11Q13 6 20 6Q27 6 27 11V31Q27 34 24 34H16Q13 34 13 31Z" fill={c} {...outline} />
          <Path d="M15.2 14.5H24.8L23.8 19.5H16.2Z" fill={INK} />
          <Path d="M16.2 28.5H23.8L24.6 31.5H15.4Z" fill={INK} />
        </>
      );
    case 'saloon':
      return (
        <>
          <Path d="M13.5 9Q13.5 4 20 4Q26.5 4 26.5 9V33Q26.5 36 23.5 36H16.5Q13.5 36 13.5 33Z" fill={c} {...outline} />
          <Path d="M15.6 13H24.4L23.4 18H16.6Z" fill={INK} />
          <Path d="M16.6 25.5H23.4L24.4 29.5H15.6Z" fill={INK} />
        </>
      );
    case 'coupe':
      return (
        <>
          <Path d="M12.5 10Q12.5 4 20 4Q27.5 4 27.5 10V32Q27.5 36 23 36H17Q12.5 36 12.5 32Z" fill={c} {...outline} />
          <Path d="M14.8 15.5H25.2L23.8 21H16.2Z" fill={INK} />
          <Path d="M16.2 24H23.8L25 27.5H15Z" fill={INK} />
        </>
      );
    case 'estate':
      return (
        <>
          <Path d="M13 8Q13 4 17 4H23Q27 4 27 8V35.5H13Z" fill={c} {...outline} />
          <Path d="M15.2 10.5H24.8L23.8 15H16.2Z" fill={INK} />
          <Path d="M15.8 18V32.5M24.2 18V32.5" stroke={INK} strokeWidth={1.6} strokeLinecap="round" />
        </>
      );
    case 'bike':
      return (
        <>
          <Path d="M18.4 3.5H21.6V10H18.4Z" fill={c} {...outline} />
          <Path d="M10.5 12.5H29.5" stroke={INK} strokeWidth={4.4} strokeLinecap="round" />
          <Path d="M10.5 12.5H29.5" stroke={c} strokeWidth={2.4} strokeLinecap="round" />
          <Path d="M17 10.5Q20 9 23 10.5L22.5 30Q20 31 17.5 30Z" fill={c} {...outline} />
          <Circle cx={20} cy={19.5} r={4.4} fill={INK} stroke={c} strokeWidth={1.6} />
          <Path d="M18.4 30H21.6V36.5H18.4Z" fill={c} {...outline} />
        </>
      );
    case 'arrow':
    default:
      return <Path d="M20 4 32.5 34.5 20 27.5 7.5 34.5Z" fill={c} {...outline} />;
  }
}
