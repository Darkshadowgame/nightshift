import { View } from 'react-native';
import { COLOR, SPACING } from '../theme';
import { DsText } from './ds';
import { FadeUp } from './motion';
import { Pin, type Glyph } from './Pin';

/** The core loop, in three lines (docs/SPEC.md): what's on, go with your car, get recognised. */
const PITCH: { glyph: Glyph; text: string }[] = [
  { glyph: 'meet', text: 'Meets, cruises and rolling meets near you tonight. Stops unlock for the people going.' },
  { glyph: 'car', text: "Say you're going with your car or bike, then check in when you get there." },
  { glyph: 'show', text: 'Vote for the best builds, win trophies, and come back next week.' },
];

/**
 * The sign-in and first-run header: the wordmark, and on sign-in the pitch.
 * `compact`: the wordmark only (Welcome: the pitch was on the screen before).
 * No pulse here: the pulse means "live now" and is kept for live events (REVIEW-5 m1).
 */
export function Wordmark({ compact }: { compact?: boolean }) {
  return (
    <View style={{ gap: SPACING.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.md }}>
        <Pin glyph="rolling" colour={COLOR.action.primary} size={compact ? 32 : 44} />
        <DsText v="display" accessibilityRole="header" accessibilityLabel="Nightshift">
          Night<DsText v="display" tone="action">shift</DsText>
        </DsText>
      </View>
      {compact ? null : (
        <>
          <DsText v="title">What's on tonight near you. Go with your car.</DsText>
          <View style={{ gap: SPACING.sm }}>
            {PITCH.map((l, i) => (
              <FadeUp key={l.glyph} index={i} stagger={90}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
                  <View aria-hidden>
                    <Pin glyph={l.glyph} colour={COLOR.text.secondary} size={26} />
                  </View>
                  <DsText v="secondary" style={{ flex: 1 }}>
                    {l.text}
                  </DsText>
                </View>
              </FadeUp>
            ))}
          </View>
        </>
      )}
    </View>
  );
}
