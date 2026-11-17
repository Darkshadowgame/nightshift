import { Pressable, Text, View } from 'react-native';
import { C, F } from '../theme';

/** 1–5 stars. Tappable when onRate is given. */
export function Stars({ value, onRate, size = 28 }: { value: number; onRate?: (n: number) => void; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: size * 0.25 }} accessibilityRole={onRate ? 'adjustable' : 'text'} accessibilityLabel={`${value} of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const on = n <= Math.round(value);
        const star = <Text style={{ fontFamily: F.display, fontSize: size, lineHeight: size * 1.15, color: on ? C.sodium : C.kerbHi }}>★</Text>;
        return onRate ? (
          <Pressable key={n} onPress={() => onRate(n)} hitSlop={6} accessibilityRole="button" accessibilityLabel={`${n} star${n > 1 ? 's' : ''}`}>
            {star}
          </Pressable>
        ) : (
          <View key={n}>{star}</View>
        );
      })}
    </View>
  );
}
