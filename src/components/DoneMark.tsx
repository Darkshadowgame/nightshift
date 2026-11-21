import { View } from 'react-native';
import { COLOR, SPACING } from '../theme';
import { DONE_WORD } from '../lib/mapFocus';
import { DsText } from './ds/Text';
import { Icon } from './ds/Icon';

/**
 * "✓ Done" on a drive or photo spot you've already done (list rows, search results). The word is in the
 * mark, so the tick is never the only signal; the label also reads "Done" to a screen reader.
 * Quiet: success-coloured text with a small tick, never a button or a badge with a number.
 */
export function DoneMark() {
  return (
    <View accessible accessibilityLabel={DONE_WORD} style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xxs }}>
      <Icon name="check" size={14} colour={COLOR.state.success} />
      <DsText v="tag" numberOfLines={1} style={{ color: COLOR.state.success }}>
        {DONE_WORD}
      </DsText>
    </View>
  );
}
