import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { COLOR } from '../theme';
import { Press } from './ds';

const STAR = 'M12 2.6l2.9 6 6.5.8-4.8 4.5 1.2 6.5L12 17.3l-5.8 3.1 1.2-6.5L2.6 9.4l6.5-.8z';

/** One star: filled when on, an outline in the control border colour (3:1 or better) when off. */
function Star({ on, size }: { on: boolean; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" pointerEvents="none">
      <Path d={STAR} fill={on ? COLOR.text.primary : 'none'} stroke={on ? COLOR.text.primary : COLOR.surface.borderStrong} strokeWidth={1.6} strokeLinejoin="round" />
    </Svg>
  );
}

/** 1–5 stars. Tappable when onRate is given (buzzes `select`, like every choice). */
export function Stars({ value, onRate, size = 28 }: { value: number; onRate?: (n: number) => void; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: size * 0.2 }} accessibilityRole={onRate ? 'adjustable' : 'text'} accessibilityLabel={`${value} of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const on = n <= Math.round(value);
        return onRate ? (
          <Press key={n} onPress={() => onRate(n)} haptic="select" hitSlop={size < 34 ? 10 : 6} label={`${n} star${n > 1 ? 's' : ''}`}>
            <Star on={on} size={size} />
          </Press>
        ) : (
          <Star key={n} on={on} size={size} />
        );
      })}
    </View>
  );
}
