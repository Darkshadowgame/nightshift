import type { ReactNode } from 'react';
import { View } from 'react-native';

/**
 * A slot on the main map, bottom right, just above the bottom card: room for
 * one small widget (for example a live speed readout with the camera limit).
 * Empty for now. Keep whatever goes here compact (about 64 pt square) and
 * aligned to the right edge; it sits in the map's bottom column, so it moves
 * up with the card and never covers it.
 */
export function MapWidgetSlot({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return (
    <View style={{ alignSelf: 'flex-end' }} pointerEvents="box-none">
      {children}
    </View>
  );
}
