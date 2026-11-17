import { Pressable, Text, View } from 'react-native';
import { BRAND, F, SURFACE } from '../theme';

/** 1–5 stars. Tappable when onRate is given. */
export function Stars({ value, onRate, size = 28 }: { value: number; onRate?: (n: number) => void; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: size * 0.25 }} accessibilityRole={onRate ? 'adjustable' : 'text'} accessibilityLabel={`${value} of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const on = n <= Math.round(value);
        // Unlit stars use the control border colour (3:1 or better), so they read as tappable.
        const star = <Text allowFontScaling={false} style={{ fontFamily: F.display, fontSize: size, lineHeight: size * 1.15, color: on ? BRAND : SURFACE.borderStrong }}>★</Text>;
        return onRate ? (
          <Pressable key={n} onPress={() => onRate(n)} hitSlop={size < 34 ? 10 : 6} accessibilityRole="button" accessibilityLabel={`${n} star${n > 1 ? 's' : ''}`}>
            {star}
          </Pressable>
        ) : (
          <View key={n}>{star}</View>
        );
      })}
    </View>
  );
}
