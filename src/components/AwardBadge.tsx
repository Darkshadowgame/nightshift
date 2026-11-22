import Svg, { Circle, G, Path, Polygon, Text as SvgText } from 'react-native-svg';
import { categoryInfo, type AwardCategory } from '../lib/awards';
import { COLOR, F } from '../theme';

/**
 * Each trophy's badge, drawn in code (no image files) in the brand's style: a round medallion with a
 * tyre-tread ring (the tyre-print mark's pattern) in the brand green, and one simple line glyph in
 * the middle. The ring and glyph take their colours from the theme, so a badge reads on light and
 * dark. A badge you haven't earned is the same drawing with the colour taken out (`earned={false}`).
 */

const TREAD = 28;

/** The glyph for a trophy, drawn in a 64 x 64 box around (32, 32) with the given stroke colour. */
function Glyph({ category, ink, fill }: { category: AwardCategory; ink: string; fill: string }) {
  const line = { stroke: ink, strokeWidth: 2.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };
  switch (category) {
    case 'best-in-show':
      // A five-point star.
      return <Polygon points="32,15 36.4,26.2 48.4,27 39.2,34.8 42.2,46.4 32,40 21.8,46.4 24.8,34.8 15.6,27 27.6,26.2" fill={fill} stroke={ink} strokeWidth={2.4} strokeLinejoin="round" />;
    case 'best-car':
      // A car from the side: roof, body, two wheels.
      return (
        <G>
          <Path d="M15 38v-5l4.5-1 4-7h15l5 7 5 1v5z" {...line} />
          <Circle cx={23} cy={39} r={4.2} fill={fill} stroke={ink} strokeWidth={2.4} />
          <Circle cx={42} cy={39} r={4.2} fill={fill} stroke={ink} strokeWidth={2.4} />
        </G>
      );
    case 'best-bike':
      // A motorbike: two wheels, frame, bars and seat.
      return (
        <G>
          <Circle cx={21} cy={39} r={6} {...line} />
          <Circle cx={43} cy={39} r={6} {...line} />
          <Path d="M21 39l7-9h9l6 9M28 30l-2-4h-4M37 30l3-5h4" {...line} />
        </G>
      );
    case 'stance':
      // A wheel under an arch.
      return (
        <G>
          <Path d="M14 42V36a18 18 0 0 1 36 0v6" {...line} />
          <Circle cx={32} cy={38} r={6} fill={fill} stroke={ink} strokeWidth={2.4} />
        </G>
      );
    case 'sound':
      // A speaker with two waves.
      return (
        <G>
          <Path d="M17 28h6l8-6v20l-8-6h-6z" {...line} />
          <Path d="M38 27a7 7 0 0 1 0 10M43 23a13 13 0 0 1 0 18" {...line} />
        </G>
      );
    case 'paint':
      // A paint drop.
      return <Path d="M32 15c7 9 11 14 11 20a11 11 0 0 1-22 0c0-6 4-11 11-20z" fill={fill} stroke={ink} strokeWidth={2.4} strokeLinejoin="round" />;
    case 'cleanest':
      // A sparkle.
      return <Path d="M32 14l4 12 12 4-12 4-4 12-4-12-12-4 12-4z" fill={fill} stroke={ink} strokeWidth={2.4} strokeLinejoin="round" />;
    case 'newcomer':
      // A rising arrow.
      return <Path d="M20 42l12-14 12 14M20 32l12-14 12 14" {...line} />;
    default: {
      // A class trophy: the class letter.
      const letter = category.startsWith('class-') ? category.slice(6) : '';
      return (
        <SvgText x={32} y={42} textAnchor="middle" fontFamily={F.displayItalic} fontSize={26} fill={ink}>
          {letter}
        </SvgText>
      );
    }
  }
}

export function AwardBadge({ category, size = 56, earned = true }: { category: AwardCategory; size?: number; earned?: boolean }) {
  const ring = earned ? COLOR.action.primary : COLOR.surface.borderStrong;
  const edge = earned ? COLOR.action.selected : COLOR.surface.borderStrong;
  const ink = earned ? COLOR.text.primary : COLOR.text.secondary;
  const fill = earned ? COLOR.action.primary : COLOR.surface.raised;
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" accessibilityLabel={`${categoryInfo(category).label} badge${earned ? '' : ', not earned yet'}`}>
      <Circle cx={32} cy={32} r={30} fill={COLOR.surface.raised} stroke={edge} strokeWidth={2} />
      {/* The tread: a ring of short blocks, as on the tyre print. */}
      <Circle cx={32} cy={32} r={TREAD - 1} fill="none" stroke={ring} strokeWidth={5} strokeDasharray="3.4 2.6" opacity={earned ? 1 : 0.55} />
      <Circle cx={32} cy={32} r={22} fill={COLOR.surface.card} stroke={edge} strokeWidth={1.5} />
      <Glyph category={category} ink={ink} fill={fill} />
    </Svg>
  );
}
