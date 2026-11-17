import { View } from 'react-native';
import { BRAND, LAYER } from '../theme';
import { FadeUp } from './motion';
import { Pin } from './Pin';
import { ClassBadge, Row, Txt } from './ui';

/**
 * The sign-in and first-run header: the wordmark and the three-line pitch.
 * No pulse here: the pulse means "live now" and is kept for live events (REVIEW-5 m1).
 */
export function Wordmark() {
  return (
    <View style={{ gap: 14 }}>
      <Row gap={12} style={{ flexWrap: 'nowrap' }}>
        <Pin glyph="rolling" colour={BRAND} size={44} />
        <Txt v="h1" style={{ fontSize: 34, lineHeight: 38 }} accessibilityRole="header">
          Night<Txt v="h1" style={{ fontSize: 34, lineHeight: 38, color: BRAND }}>shift</Txt>
        </Txt>
      </Row>
      <Txt style={{ fontSize: 17, lineHeight: 23 }}>The UK car and bike scene on one map, after dark.</Txt>
      <View style={{ gap: 10 }}>
        <FadeUp index={0} stagger={90}>
          <Row gap={10} style={{ flexWrap: 'nowrap' }}>
            <Pin glyph="locked" colour={LAYER.event} size={26} />
            <Txt v="muted" style={{ flex: 1 }}>Meets and cruises whose stops unlock for the people going, on the night.</Txt>
          </Row>
        </FadeUp>
        <FadeUp index={1} stagger={90}>
          <Row gap={10} style={{ flexWrap: 'nowrap' }}>
            <View style={{ width: 26, alignItems: 'center' }}>
              <ClassBadge letter="S" size="sm" />
            </View>
            <Txt v="muted" style={{ flex: 1 }}>Your garage, classed S to D on power-to-weight. Win covers and trophies.</Txt>
          </Row>
        </FadeUp>
        <FadeUp index={2} stagger={90}>
          <Row gap={10} style={{ flexWrap: 'nowrap' }}>
            <Pin glyph="drive" colour={LAYER.drive} size={26} />
            <Txt v="muted" style={{ flex: 1 }}>Great roads to drive and photo spots, rated by the scene. Never timed.</Txt>
          </Row>
        </FadeUp>
      </View>
    </View>
  );
}
