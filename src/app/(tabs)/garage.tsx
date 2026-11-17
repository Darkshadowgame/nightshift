import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { BuildHero } from '../../components/BuildHero';
import { FadeUp } from '../../components/motion';
import { Button, EmptyState, Row, Stat, Txt } from '../../components/ui';
import { allAwards } from '../../lib/awards';
import { COVER_ASPECT } from '../../lib/crop';
import { bhpPerTonne, classOf, effectivePower, isModified } from '../../lib/classes';
import { useStore } from '../../lib/store';
import { useNow } from '../../lib/clock';
import { swapTag } from '../../lib/swap';
import { BRAND } from '../../theme';

/** The demo's example build for you (see seed.ts). */
const SAMPLE_BUILD = 'b-me-0';

export default function Garage() {
  const { builds, me, votes, events } = useStore();
  const now = useNow();
  const mine = builds.filter((b) => b.ownerId === me);
  const awards = useMemo(() => allAwards(votes, events, builds, now), [votes, events, builds, now]);
  const isSample = (id: string, nickname?: string) => id === SAMPLE_BUILD && !!nickname?.startsWith('Example');
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 18, paddingBottom: 40 }}>
      {mine.length === 0 ? (
        <EmptyState
          glyph="car"
          title="Your garage is empty"
          body="Add your car or bike. Invites are matched to your builds, and each one gets a class from S to D."
          action={{ label: '+ Add a car or bike', onPress: () => router.push('/build/edit') }}
        />
      ) : null}
      {mine.map((b, i) => {
        const won = awards.filter((a) => a.buildId === b.id).length;
        const sample = isSample(b.id, b.nickname);
        return (
          <FadeUp key={b.id} index={i}>
            <Pressable
              onPress={() => router.push({ pathname: '/build/[id]', params: { id: b.id } })}
              accessibilityRole="button"
              accessibilityLabel={`${b.make} ${b.model}, class ${classOf(b)}, ${b.mods.length} mods${won ? `, ${won} trophies` : ''}`}
              style={({ pressed }) => [{ gap: 10 }, pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] }]}
            >
              <BuildHero build={b} {...(b.photos[0] ? { aspect: COVER_ASPECT } : { height: 160 })} trophies={won} tag={sample ? 'Sample' : undefined} />
              <Row style={{ flexWrap: 'nowrap', justifyContent: 'space-between' }}>
                <View style={{ flex: 1 }}>
                  <Txt v="h2" numberOfLines={2}>{b.make} {b.model}</Txt>
                  {swapTag(b) ? <Txt v="label" style={{ color: BRAND }} numberOfLines={1}>{swapTag(b)}</Txt> : null}
                  {b.nickname ? <Txt v="muted" numberOfLines={1}>{b.nickname}</Txt> : null}
                </View>
                <Txt v="label" style={{ color: BRAND }}>Open ›</Txt>
              </Row>
              <Row gap={8} style={{ flexWrap: 'nowrap' }}>
                <Stat value={`${Math.round(effectivePower(b))}`} label={b.dynoBhp ? 'bhp · dyno' : 'bhp · est.'} />
                <Stat value={`${bhpPerTonne(b)}`} label="bhp / tonne" />
                <Stat value={`${b.mods.length}`} label={isModified(b) ? 'mods · modified' : 'mods'} colour={isModified(b) ? BRAND : undefined} />
              </Row>
              {sample ? (
                <Txt v="caption">
                  A sample build with sample trophies from the demo meet. Tap it, then Edit to make it yours.
                </Txt>
              ) : null}
            </Pressable>
          </FadeUp>
        );
      })}
      {mine.length ? <Button label="+ Add a car or bike" kind="secondary" onPress={() => router.push('/build/edit')} /> : null}
      <Txt v="caption" style={{ textAlign: 'center' }}>
        Class comes from power-to-weight. Cars and bikes use separate scales, so a litre superbike and an M4 are both S.
      </Txt>
    </ScrollView>
  );
}
