import { View, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { laneLabel, type LaneArrow, type LaneStrip as Strip } from '../lib/lanes';
import { COLOR, RADII, SPACING, themedStyles } from '../theme';
import { DsText } from './ds';

/**
 * The lane picture under the driving view's next turn: one box per lane, left to right as you
 * drive, with its painted arrows. The lanes for the manoeuvre are bright and outlined; the
 * others are dim. A roundabout adds its exit number (or shows only that when the lanes can't be
 * matched). Lanes come from OpenStreetMap (lanes.ts); nothing shows when there's no data.
 */
export function LaneStrip({ strip }: { strip: Strip }) {
  return (
    <View style={st.row} accessible accessibilityLabel={laneLabel(strip)}>
      {strip.exit ? (
        <View style={st.exit}>
          <DsText v="driveLabel" tone="secondary">
            EXIT
          </DsText>
          <DsText v="driveTitle" allowFontScaling={false}>
            {strip.exit}
          </DsText>
        </View>
      ) : null}
      {strip.lanes ? (
        <View style={st.lanes}>
          {strip.lanes.map((l, i) => (
            <View key={i} style={[st.lane, i > 0 && st.divider, l.on && st.on]}>
              <Svg width={30} height={36} viewBox="0 0 24 30">
                {arrowPaths(l.arrows).map((d, k) => (
                  <Path key={k} d={d} fill="none" stroke={l.on ? COLOR.text.primary : COLOR.text.secondary} strokeOpacity={l.on ? 1 : 0.45} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
                ))}
              </Svg>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const ANGLE: Partial<Record<LaneArrow, number>> = {
  through: 0,
  slight_left: -45,
  left: -90,
  sharp_left: -135,
  slight_right: 45,
  right: 90,
  sharp_right: 135,
};

/** SVG paths for a lane's arrows on a 24 × 30 box: one stem from the bottom, a branch and head per arrow. */
export function arrowPaths(arrows: LaneArrow[]): string[] {
  const out: string[] = [];
  const joinY = 15;
  const stem = arrows.includes('through') ? 'M12 28V5' : `M12 28V${joinY}`;
  const visible = arrows.filter((a) => a !== 'none');
  if (visible.length === 0) return ['M12 26V18'];
  out.push(stem);
  for (const a of visible) {
    if (a === 'through') {
      out.push('M7.5 9.5 12 5 16.5 9.5');
    } else if (a === 'reverse') {
      // UK: a U-turn goes round to the right.
      out.push(`M12 ${joinY}V9Q12 5 16 5Q20 5 20 9V17`, 'M16.5 13.5 20 17 23.5 13.5');
    } else if (a === 'merge_to_left' || a === 'merge_to_right') {
      const s = a === 'merge_to_left' ? -1 : 1;
      out.push(`M12 ${joinY}L${12 + 7 * s} 7V3`, `M${12 + 7 * s - 3.5} 6.5 ${12 + 7 * s} 3 ${12 + 7 * s + 3.5} 6.5`);
    } else {
      const deg = ANGLE[a] ?? 0;
      const r = (deg * Math.PI) / 180;
      const len = 9;
      const tx = 12 + len * Math.sin(r);
      const ty = joinY - len * Math.cos(r);
      // Head: two short strokes back from the tip, 40° either side of the way it points.
      const head = (off: number) => {
        const b = r + Math.PI + (off * Math.PI) / 180;
        return `${(tx + 4.5 * Math.sin(b)).toFixed(1)} ${(ty - 4.5 * Math.cos(b)).toFixed(1)}`;
      };
      out.push(`M12 ${joinY}L${tx.toFixed(1)} ${ty.toFixed(1)}`, `M${head(-40)} ${tx.toFixed(1)} ${ty.toFixed(1)} ${head(40)}`);
    }
  }
  return out;
}

const st = themedStyles(() => StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.xs, backgroundColor: COLOR.surface.bg, borderBottomWidth: 1, borderBottomColor: COLOR.surface.border },
  lanes: { flexDirection: 'row', borderRadius: RADII.control, borderWidth: 1, borderColor: COLOR.surface.borderStrong, overflow: 'hidden', backgroundColor: COLOR.surface.card },
  lane: { width: 44, height: 48, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent' },
  divider: { borderLeftColor: COLOR.surface.border },
  on: { borderColor: COLOR.text.primary, backgroundColor: COLOR.surface.raised },
  exit: { minWidth: 56, height: 48, borderRadius: RADII.control, borderWidth: 2, borderColor: COLOR.text.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING.xs },
}));
