import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { BuildHero } from '../../components/BuildHero';
import { FadeUp } from '../../components/motion';
import { Button, Card, Row, Stat, Txt } from '../../components/ui';
import { allAwards } from '../../lib/awards';
import { COVER_ASPECT } from '../../lib/crop';
import { bhpPerTonne, classOf, effectivePower, isModified } from '../../lib/classes';
import { useStore } from '../../lib/store';
import { swapTag } from '../../lib/swap';
import { C } from '../../theme';

/** The demo's example build for you (see seed.ts). */
const SAMPLE_BUILD = 'b-me-0';

export default function Garage() {
  const { builds, me, votes, events, now } = useStore();
  const mine = builds.filter((b) => b.ownerId === me);
  const awards = useMemo(() => allAwards(votes, events, builds, now), [votes, events, builds, now]);
  const isSample = (id: string, nickname?: string) => id === SAMPLE_BUILD && !!nickname?.startsWith('Example');
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 18, paddingBottom: 40 }}>
      {mine.length === 0 ? (
        <Card>
          <Txt v="h3">Your garage is empty</Txt>
          <Txt v="muted">Add your car or bike. Invites to meets and cruises are matched against your builds.</Txt>
        </Card>
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
                  {swapTag(b) ? <Txt v="label" style={{ color: C.magenta }} numberOfLines={1}>{swapTag(b)}</Txt> : null}
                  {b.nickname ? <Txt v="muted" numberOfLines={1}>{b.nickname}</Txt> : null}
                </View>
                <Txt v="label" style={{ color: C.sodium }}>Open ›</Txt>
              </Row>
              <Row gap={8} style={{ flexWrap: 'nowrap' }}>
                <Stat value={`${Math.round(effectivePower(b))}`} label={b.dynoBhp ? 'bhp · dyno' : 'bhp · est.'} />
                <Stat value={`${bhpPerTonne(b)}`} label="bhp / tonne" />
                <Stat value={`${b.mods.length}`} label={isModified(b) ? 'mods · modified' : 'mods'} colour={isModified(b) ? C.sodium : undefined} />
              </Row>
              {sample ? (
                <Txt v="muted" style={{ fontSize: 13 }}>
                  A sample build with sample trophies from the demo meet. Tap it, then Edit to make it yours.
                </Txt>
              ) : null}
            </Pressable>
          </FadeUp>
        );
      })}
      <Button label="+ Add a car or bike" kind={mine.length === 0 ? 'primary' : 'ghost'} onPress={() => router.push('/build/edit')} />
      <Txt v="muted" style={{ textAlign: 'center', fontSize: 13 }}>
        Class comes from power-to-weight. Cars and bikes use separate scales, so a litre superbike and an M4 are both S.
      </Txt>
    </ScrollView>
  );
}
