import { View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { emblemLabel, emblemMarkIsLight, emblemParts, type EmblemShape } from '../lib/crewEmblems';
import { COLOR, RADII } from '../theme';

/**
 * A crew's emblem: a line shape on a paint swatch, drawn here so no picture is ever uploaded. Paints come
 * from `COLOR.paint` (the same in light and dark), so it reads in both themes.
 */
export function CrewEmblem({ emblem, size = 56 }: { emblem: string; size?: number }) {
  const { shape, paint } = emblemParts(emblem);
  const bg = COLOR.paint[paint] ?? COLOR.paint[6];
  const mark = emblemMarkIsLight(paint) ? COLOR.paint[0] : COLOR.paint[1];
  const p = { stroke: mark, strokeWidth: 2, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={`Crew emblem: ${emblemLabel(emblem)}`}
      style={{ width: size, height: size, borderRadius: Math.min(RADII.card, size / 4), backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}
    >
      <Svg width={size * 0.62} height={size * 0.62} viewBox="0 0 24 24" pointerEvents="none">
        <Shape shape={shape} {...p} />
      </Svg>
    </View>
  );
}

function Shape({ shape, ...p }: { shape: EmblemShape; stroke: string; strokeWidth: number; fill: string; strokeLinecap: 'round'; strokeLinejoin: 'round' }) {
  switch (shape) {
    case 'shield':
      return <Path d="M12 3l7 3v5c0 5-3 8.5-7 10-4-1.5-7-5-7-10V6z" {...p} />;
    case 'bolt':
      return <Path d="M13 3 5 13.5h6L10 21l8-10.5h-6z" {...p} />;
    case 'wheel':
      return (
        <>
          <Circle cx={12} cy={12} r={8} {...p} />
          <Circle cx={12} cy={12} r={2} {...p} />
          <Path d="M12 4v6M12 14v6M4 12h6M14 12h6" {...p} />
        </>
      );
    case 'flag':
      return <Path d="M6 21V4M6 5h11l-2 4 2 4H6" {...p} />;
    case 'star':
      return <Path d="M12 3.5l2.6 5.5 6 .8-4.4 4.2 1.1 6-5.3-2.9-5.3 2.9 1.1-6L3.4 9.8l6-.8z" {...p} />;
    case 'chevron':
      return <Path d="M5 8l7 6 7-6M5 14l7 6 7-6" {...p} />;
  }
}
