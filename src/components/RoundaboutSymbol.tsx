import { View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { exitAngle, otherArms, polar, roundaboutLabel, sweepTo } from '../lib/roundabout';
import { COLOR } from '../theme';
import { DsText } from './ds';

/**
 * A roundabout with its exit: a ring, the entry at the bottom (UK: you go clockwise), the way you
 * go round and the exit you take drawn in the route colour, and the exit number in the middle.
 * The exit's direction is a fixed layout by number (roundabout.ts), not the real geometry, so the
 * number is the fact; it always shows. One drawing at every size: the banner, "Then" and the step list.
 */
const C = 50; // centre x of the 100 x 100 drawing
const CY = 45; // centre y: a little up, so the entry has room
const R = 26; // ring radius
const RING = 6; // ring stroke
const ARM = 43; // how far from the centre the arms run

export function RoundaboutSymbol({ exit, size = 72, label = true }: { exit: number; size?: number; label?: boolean }) {
  const hi = COLOR.map.route;
  const ink = COLOR.text.primary;
  const faint = COLOR.text.secondary;
  const taken = exitAngle(exit);
  const armTo = (deg: number) => ({ from: polar(C, CY, R + RING / 2 - 1, deg), to: polar(C, CY, ARM, deg) });
  // The way round: from the entry, clockwise, to the exit.
  const sweep = sweepTo(exit);
  const a = polar(C, CY, R, 180);
  const b = polar(C, CY, R, taken);
  const arc = `M ${a.x} ${a.y} A ${R} ${R} 0 ${sweep > 180 ? 1 : 0} 1 ${b.x} ${b.y}`;
  const out = armTo(taken);
  // Arrowhead at the end of the taken arm.
  const tip = out.to;
  const back = (d: number) => polar(tip.x, tip.y, 12, taken + 180 + d);
  const l = back(35);
  const r = back(-35);
  return (
    <View
      style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
      accessible={label}
      accessibilityRole="image"
      accessibilityLabel={label ? roundaboutLabel(exit) : undefined}
      importantForAccessibility={label ? 'yes' : 'no-hide-descendants'}
    >
      <Svg width={size} height={size} viewBox="0 0 100 100" pointerEvents="none">
        <Circle cx={C} cy={CY} r={R} fill="none" stroke={faint} strokeWidth={RING} />
        {otherArms(exit).map((a) => {
          const { from, to } = armTo(a);
          return <Path key={a} d={`M ${from.x} ${from.y} L ${to.x} ${to.y}`} stroke={faint} strokeWidth={RING} strokeLinecap="butt" />;
        })}
        {/* The way in, from the bottom. */}
        <Path d={`M ${C} ${CY + R + RING / 2 - 1} L ${C} 98`} stroke={ink} strokeWidth={RING} strokeLinecap="butt" />
        <Path d={arc} fill="none" stroke={hi} strokeWidth={RING} strokeLinecap="butt" />
        <Path d={`M ${out.from.x} ${out.from.y} L ${out.to.x} ${out.to.y}`} stroke={hi} strokeWidth={RING} strokeLinecap="butt" />
        <Path d={`M ${l.x} ${l.y} L ${tip.x} ${tip.y} L ${r.x} ${r.y}`} fill="none" stroke={hi} strokeWidth={RING * 0.8} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
      {/* The number sits in the middle of the ring. Not scaled with the text size: it has to fit the ring. */}
      <View pointerEvents="none" style={{ position: 'absolute', left: (C / 100) * size - size * 0.17, top: (CY / 100) * size - size * 0.17, width: size * 0.34, height: size * 0.34, alignItems: 'center', justifyContent: 'center' }}>
        <DsText v="driveTitle" allowFontScaling={false} style={{ fontSize: size * 0.3, lineHeight: size * 0.34, textAlign: 'center', color: ink, fontVariant: ['tabular-nums'] }}>
          {exit}
        </DsText>
      </View>
    </View>
  );
}
