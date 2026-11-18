import Svg, { Circle, Path } from 'react-native-svg';
import { COLOR } from '../../theme';

/**
 * The line icons used by the design system (2 px stroke, 24 grid). Replaces
 * Unicode stand-ins (›, ✕, ✓, ···, ⚠) in components. Decorative: the control
 * that holds an icon carries the accessibility label.
 */
export type IconName = 'search' | 'close' | 'chevron' | 'check' | 'more' | 'plus' | 'alert' | 'info' | 'success' | 'bell' | 'back';

export function Icon({ name, size = 20, colour = COLOR.text.primary }: { name: IconName; size?: number; colour?: string }) {
  const p = { stroke: colour, strokeWidth: 2, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" pointerEvents="none">
      {name === 'search' ? (
        <>
          <Circle cx={10.5} cy={10.5} r={6.5} {...p} />
          <Path d="M15.5 15.5 21 21" {...p} />
        </>
      ) : null}
      {name === 'close' ? <Path d="M6 6l12 12M18 6 6 18" {...p} /> : null}
      {name === 'chevron' ? <Path d="M9 5l7 7-7 7" {...p} /> : null}
      {name === 'back' ? <Path d="M15 5l-7 7 7 7" {...p} /> : null}
      {name === 'check' ? <Path d="M5 12.5l4.5 4.5L19 7.5" {...p} /> : null}
      {name === 'plus' ? <Path d="M12 5v14M5 12h14" {...p} /> : null}
      {name === 'more' ? (
        <>
          <Circle cx={5} cy={12} r={1.8} fill={colour} />
          <Circle cx={12} cy={12} r={1.8} fill={colour} />
          <Circle cx={19} cy={12} r={1.8} fill={colour} />
        </>
      ) : null}
      {name === 'alert' ? (
        <>
          <Path d="M12 3.5 21.5 20h-19z" {...p} />
          <Path d="M12 10v4.5M12 17.2v.3" {...p} />
        </>
      ) : null}
      {name === 'info' ? (
        <>
          <Circle cx={12} cy={12} r={9} {...p} />
          <Path d="M12 11v6M12 7.6v.3" {...p} />
        </>
      ) : null}
      {name === 'success' ? (
        <>
          <Circle cx={12} cy={12} r={9} {...p} />
          <Path d="M8 12.3l2.8 2.8L16.2 9.6" {...p} />
        </>
      ) : null}
      {name === 'bell' ? (
        <>
          <Path d="M6 17V11a6 6 0 0 1 12 0v6l1.5 2h-15z" {...p} />
          <Path d="M10 21h4" {...p} />
        </>
      ) : null}
    </Svg>
  );
}
