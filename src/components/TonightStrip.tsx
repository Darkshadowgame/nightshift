import { ScrollView, View } from 'react-native';
import { plural } from '../lib/format';
import { ORGANISED_A11Y, ORGANISED_TAG, ORGANISED_WORDS } from '../lib/organised';
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
  const grouped = meets.some((m) => m.organised) && meets.some((m) => !m.organised);
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
        {meets.map((m, i) => {
          const home = nearHome?.has(m.id);
          // Two kinds in the row: a small heading starts each group, local meets first (organised.ts).
          const heading = grouped && (i === 0 || !!m.organised !== !!meets[i - 1].organised) ? (m.organised ? ORGANISED_WORDS.organisedGroup : ORGANISED_WORDS.localGroup) : null;
          return (
            <View key={m.id} style={st.group}>
              {heading ? (
                <DsText v="eyebrow" numberOfLines={1}>
                  {heading}
                </DsText>
              ) : grouped ? (
                <DsText v="eyebrow" aria-hidden numberOfLines={1}>
                  {' '}
                </DsText>
              ) : null}
            <Press
              onPress={() => onOpen(m.id)}
              haptic="select"
              label={`${m.live ? 'Live now' : m.time}, ${m.title}${m.organised ? `, ${ORGANISED_A11Y}` : ''}, ${plural(m.going, 'person', 'people')} going${home ? ', on your way home' : ''}`}
              hint="Shows it on the map"
              style={st.chip}
            >
              <DsText v="meta" tone={m.live ? 'primary' : 'secondary'} numberOfLines={1}>
                {m.live ? 'Live now' : m.time}
              </DsText>
              <DsText v="secondary" tone="primary" numberOfLines={2}>
                {m.title}
              </DsText>
              <DsText v="meta">
                {[`${m.going} going`, m.organised ? ORGANISED_TAG : null, home ? 'On your way home' : null].filter(Boolean).join(' · ')}
              </DsText>
            </Press>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const st = themedStyles(() => ({
  group: { gap: SPACING.xs },
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
