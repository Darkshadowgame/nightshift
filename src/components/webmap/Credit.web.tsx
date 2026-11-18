import { useState } from 'react';
import { Pressable } from 'react-native';
import { RADII, SPACING, SURFACE, TYPE } from '../../theme';
import { DsText } from '../ds/Text';
import { creditLine, shortCredit, TILE_CREDIT } from './tiles.web';

/**
 * The map's credit slot on web: always shows the credit for the tiles on show (plus any credit
 * the screen passes). `tiles` null: the grid is showing, so only the screen's credit.
 * `top`: top left, for full-screen maps whose bottom is under a sheet or panel.
 *
 * Review 14: the full line wrapped to two lines at 1.3x text and covered the meet circle on small
 * maps. It now shows the short form ("© Stadia · OSM") on one line, tucked in the corner, and the
 * full credit on tap (tap again to shorten it).
 */
export function Credit({ credit, tiles = TILE_CREDIT, top }: { credit?: string; tiles?: string | null; top?: boolean }) {
  const [full, setFull] = useState(false);
  const line = tiles ? creditLine(credit, tiles) : credit;
  if (!line) return null;
  const short = shortCredit(line);
  const showFull = full || short === line;
  return (
    <Pressable
      onPress={() => setFull((f) => !f)}
      accessibilityRole="button"
      accessibilityLabel={`Map credit: ${line}`}
      accessibilityHint={showFull ? undefined : 'Shows the full map credit'}
      hitSlop={SPACING.sm}
      style={{
        position: 'absolute',
        ...(top ? { top: SPACING.xxs, left: SPACING.xxs } : { bottom: SPACING.xxs, right: SPACING.xxs }),
        maxWidth: showFull ? '90%' : undefined,
        backgroundColor: SURFACE.glass,
        borderRadius: RADII.tag,
        paddingHorizontal: SPACING.xs,
        paddingVertical: SPACING.xxs,
        zIndex: 1000,
      }}
    >
      <DsText v="caption" tone="secondary" numberOfLines={showFull ? undefined : 1} style={{ fontSize: TYPE.micro, lineHeight: TYPE.micro + 3 }}>
        {showFull ? line : short}
      </DsText>
    </Pressable>
  );
}
