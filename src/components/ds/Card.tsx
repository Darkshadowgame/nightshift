import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { COLOR, RADII, SPACING } from '../../theme';

/**
 * A plain block on the page: card surface, hairline border, card radius, no shadow. For a form
 * inside a page, a group of facts or a short panel. Not for browse items (that's EntityCard) and
 * never with an accent bar (accent bars are layer identity, on EntityCard only). `raised` sits
 * inside another card.
 */
export function Card({ children, raised, style }: { children: ReactNode; raised?: boolean; style?: StyleProp<ViewStyle> }) {
  return (
    <View
      style={[
        {
          backgroundColor: raised ? COLOR.surface.raised : COLOR.surface.card,
          borderColor: raised ? COLOR.surface.raisedHi : COLOR.surface.border,
          borderWidth: 1,
          borderRadius: RADII.card,
          padding: SPACING.md,
          gap: SPACING.sm,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
