import { View } from 'react-native';
import { RADII, SPACING, SURFACE, TYPE } from '../../theme';
import { DsText } from '../ds/Text';
import { creditLine, TILE_CREDIT } from './tiles.web';

/**
 * The map's credit slot on web: always shows the credit for the tiles on show (plus any credit
 * the screen passes). `tiles` null: the grid is showing, so only the screen's credit.
 * `top`: top left, for full-screen maps whose bottom is under a sheet or panel.
 */
export function Credit({ credit, tiles = TILE_CREDIT, top }: { credit?: string; tiles?: string | null; top?: boolean }) {
  const line = tiles ? creditLine(credit, tiles) : credit;
  if (!line) return null;
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        ...(top ? { top: SPACING.xs, left: SPACING.xs } : { bottom: SPACING.xs, right: SPACING.xs }),
        maxWidth: '90%',
        backgroundColor: SURFACE.glass,
        borderRadius: RADII.tag,
        paddingHorizontal: SPACING.xs,
        paddingVertical: SPACING.xxs,
        zIndex: 1000,
      }}
    >
      {/* Small, so it stays one line across the full-width map at larger text (Review 13); never cut short. */}
      <DsText v="caption" tone="secondary" style={{ fontSize: TYPE.micro, lineHeight: TYPE.micro + 3 }}>
        {line}
      </DsText>
    </View>
  );
}
