import { ScrollView, View } from 'react-native';
import { plural } from '../lib/format';
import type { StripMeet } from '../lib/mapNight';
import { COLOR, RADII, SPACING, themedStyles } from '../theme';
import { DsText, Press } from './ds';

/** One chip's width: about two and a half show at 375 pt, so it's plain that the row swipes. */
const CHIP_W = 168;

/**
 * Tonight strip (Meets): the next three meets as a swipeable row of small chips above the sheet's
 * card, so the map answers "what's on" without opening the list. They're chips, not cards, so the
 * peek still shows one card. Tapping one centres its pin and opens its card.
 * `nearHome`: the ids of meets close to the way home (mapNight.ts), said in words on the chip.
 */
export function TonightStrip({ meets, nearHome, onOpen }: { meets: StripMeet[]; nearHome?: ReadonlySet<string>; onOpen: (id: string) => void }) {
  if (meets.length === 0) return null;
  return (
    <View testID="tonight-strip" accessibilityLabel="Next meets">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={CHIP_W + SPACING.sm}
        decelerationRate="fast"
        contentContainerStyle={st.row}
        keyboardShouldPersistTaps="handled"
      >
        {meets.map((m) => {
          const home = nearHome?.has(m.id);
          return (
            <Press
              key={m.id}
              onPress={() => onOpen(m.id)}
              haptic="select"
              label={`${m.live ? 'Live now' : m.time}, ${m.title}, ${plural(m.going, 'person', 'people')} going${home ? ', on your way home' : ''}`}
              hint="Shows it on the map"
              style={st.chip}
            >
              <DsText v="meta" tone={m.live ? 'primary' : 'secondary'} numberOfLines={1}>
                {m.live ? 'Live now' : m.time}
              </DsText>
              <DsText v="secondary" tone="primary" numberOfLines={1}>
                {m.title}
              </DsText>
              <DsText v="meta" numberOfLines={1}>
                {home ? `${m.going} going · On your way home` : `${m.going} going`}
              </DsText>
            </Press>
          );
        })}
      </ScrollView>
    </View>
  );
}

const st = themedStyles(() => ({
  row: { gap: SPACING.sm, paddingVertical: SPACING.xs },
  chip: {
    width: CHIP_W,
    gap: SPACING.xxs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADII.card,
    borderWidth: 1,
    borderColor: COLOR.surface.border,
    backgroundColor: COLOR.surface.raised,
  },
}));
