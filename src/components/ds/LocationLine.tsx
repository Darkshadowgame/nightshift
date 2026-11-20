import { View } from 'react-native';
import { locationSentence, type LocationLineInput, type LocationState } from '../../lib/glossary';
import { COLOR, SPACING } from '../../theme';
import { Icon } from './Icon';
import { DsText } from './Text';

/**
 * The event page's status line (Redesign 2, 3.5 item 3): where the meet is, in the 4.11 words
 * only, plus at most one more sentence about the next step (`note`: "Check-in opens at 21:30.",
 * "You're 2 mi away."). It is the one place a countdown appears on the screen.
 *
 *   <LocationLine state="hidden" time="21:30" minutesTo={20} />
 *     → "Location shows at 21:30 (in 20 min)."
 *   <LocationLine state="shown" point="Leisure park car park" town="Tamworth" note="Check-in opens at 21:30." />
 *
 * `done` swaps the pin for a green tick (checked in, voted). The wording is `locationSentence()`
 * in glossary.ts, so tests and other screens say it the same way. `text` overrides the location
 * sentence for the states that aren't about location (ended, cancelled): "The host cancelled this meet."
 */
export function LocationLine({
  note,
  done,
  text,
  state,
  ...rest
}: Omit<LocationLineInput, 'state'> & { state?: LocationState; note?: string | null; done?: boolean; text?: string }) {
  const sentence = [text ?? (state ? locationSentence({ state, ...rest }) : null), note].filter(Boolean).join(' ');
  return (
    <View accessible accessibilityLabel={sentence} accessibilityLiveRegion="polite" style={{ flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm }}>
      <View style={{ paddingTop: SPACING.xxs }} aria-hidden>
        <Icon name={done ? 'success' : 'pin'} size={18} colour={done ? COLOR.state.success : COLOR.text.secondary} />
      </View>
      <DsText v="body" style={{ flex: 1 }}>
        {sentence}
      </DsText>
    </View>
  );
}
