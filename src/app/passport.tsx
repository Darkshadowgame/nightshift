import { ScrollView, useWindowDimensions, View } from 'react-native';
import { AwardBadge } from '../components/AwardBadge';
import { DsText, Section } from '../components/ds';
import { allAwards, categoryInfo, type AwardCategory } from '../lib/awards';
import { useNow } from '../lib/clock';
import { plural } from '../lib/format';
import { PASSPORT_TILES } from '../lib/passport';
import { useStore } from '../lib/store';
import { useVisits } from '../lib/useVisits';
import { COLOR, RADII, SPACING } from '../theme';

const SHELF: AwardCategory[] = ['best-in-show', 'best-car', 'best-bike'];
const GAP = SPACING.sm;
const TILE_HEIGHT = 76;

/**
 * Passport (level-up): the 11 regions as a tile map of the UK (north at the top, west on the left)
 * that fills in as you check in at meets in each, then your trophy badges. A tile map, because a
 * tidy grid reads better at phone size than a map outline.
 */
export default function Passport() {
  const { width } = useWindowDimensions();
  const { stamps, passport } = useVisits();
  const { votes, events, builds, me } = useStore();
  const now = useNow();
  const mine = allAwards(votes, events, builds, now).filter((a) => a.ownerId === me);
  const tile = Math.floor((width - 2 * SPACING.screen - 3 * GAP) / 4);
  const byRegion = new Map(stamps.map((s) => [s.region, s.meets]));

  return (
    <ScrollView contentContainerStyle={{ padding: SPACING.screen, gap: SPACING.section, paddingBottom: SPACING.xxxl }} showsVerticalScrollIndicator={false}>
      <View style={{ gap: SPACING.xs }}>
        <DsText v="titleLg" accessibilityRole="header">
          {passport}
        </DsText>
        <DsText v="secondary">A region fills in when you check in at a meet there.</DsText>
      </View>

      <View style={{ height: 4 * TILE_HEIGHT + 3 * GAP }} accessibilityRole="list">
        {Object.entries(PASSPORT_TILES).map(([region, pos]) => {
          const n = byRegion.get(region) ?? 0;
          const done = n > 0;
          return (
            <View
              key={region}
              accessible
              accessibilityRole="text"
              accessibilityLabel={done ? `${region}: ${plural(n, 'meet')}` : `${region}: no meets yet`}
              style={{
                position: 'absolute',
                left: pos.col * (tile + GAP),
                top: pos.row * (TILE_HEIGHT + GAP),
                width: tile,
                height: TILE_HEIGHT,
                borderRadius: RADII.control,
                padding: SPACING.sm,
                justifyContent: 'space-between',
                backgroundColor: done ? COLOR.action.selectedTint : COLOR.surface.card,
                borderWidth: 1,
                borderColor: done ? COLOR.action.selected : COLOR.surface.border,
              }}
            >
              <DsText v="meta" tone={done ? 'primary' : 'secondary'} numberOfLines={2}>
                {region}
              </DsText>
              {done ? (
                <DsText v="stat" tone="primary" style={{ fontVariant: ['tabular-nums'] }}>
                  {n}
                </DsText>
              ) : null}
            </View>
          );
        })}
      </View>

      <Section title="Badges">
        <View style={{ flexDirection: 'row', gap: SPACING.lg, flexWrap: 'wrap' }}>
          {SHELF.map((c) => {
            const n = mine.filter((a) => a.category === c).length;
            return (
              <View key={c} style={{ alignItems: 'center', gap: SPACING.xs, width: 92 }}>
                <AwardBadge category={c} size={64} earned={n > 0} />
                <DsText v="meta" tone={n > 0 ? 'primary' : 'secondary'} style={{ textAlign: 'center' }}>
                  {categoryInfo(c).label}
                </DsText>
                {n > 0 ? <DsText v="caption" style={{ fontVariant: ['tabular-nums'] }}>{`${n}×`}</DsText> : null}
              </View>
            );
          })}
        </View>
        <DsText v="secondary">Badges come from the trophies the people at a meet vote for.</DsText>
      </Section>
    </ScrollView>
  );
}
