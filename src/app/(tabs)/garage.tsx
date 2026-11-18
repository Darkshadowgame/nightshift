import { router, useNavigation } from 'expo-router';
import { useLayoutEffect, useMemo } from 'react';
import { ScrollView, View } from 'react-native';
import { BuildHero } from '../../components/BuildHero';
import { BuildGrid, buildMeta } from '../../components/Community';
import { DsText, EmptyState, HeaderActions, Press, Section, StatBlock, Tag } from '../../components/ds';
import { allAwards } from '../../lib/awards';
import { lastBrought } from '../../lib/bringing';
import { bhpPerTonne, classOf, effectivePower } from '../../lib/classes';
import { useNow } from '../../lib/clock';
import { COVER_ASPECT } from '../../lib/crop';
import { plural } from '../../lib/format';
import { useStore } from '../../lib/store';
import { swapTag } from '../../lib/swap';
import { stageFromMods, stageLabel } from '../../lib/tune';
import type { Build } from '../../lib/types';
import { SPACING } from '../../theme';

/** The demo's example build for you (see seed.ts). */
const SAMPLE_BUILD = 'b-me-0';
const isSample = (b: Build) => b.id === SAMPLE_BUILD && !!b.nickname?.startsWith('Example');

/**
 * Your garage: the heart of who you are on Nightshift. A hero for your main build (the one you
 * last brought to a meet, else your first), then the rest as a grid. "+ Add" is in the header.
 */
export default function Garage() {
  const nav = useNavigation();
  const { builds, me, votes, events } = useStore();
  const now = useNow();
  const mine = builds.filter((b) => b.ownerId === me);
  const awards = useMemo(() => allAwards(votes, events, builds, now), [votes, events, builds, now]);
  const trophiesOf = (id: string) => awards.filter((a) => a.buildId === id).length;
  const main = lastBrought(events, me, builds) ?? mine[0];
  const others = mine.filter((b) => b.id !== main?.id);

  useLayoutEffect(() => {
    nav.setOptions({
      headerRight: () => <HeaderActions action={{ label: '+ Add', accessibilityLabel: 'Add a car or bike', onPress: () => router.push('/build/edit') }} />,
    });
  }, [nav]);

  if (!main) {
    return (
      <ScrollView contentContainerStyle={{ padding: SPACING.screen, paddingBottom: SPACING.xxxl }}>
        <EmptyState
          glyph="car"
          title="Your garage is empty"
          body="Add your car or bike. It's what you bring to meets: invites are matched to it, and it gets a class from S to D."
          action={{ label: 'Add a car or bike', onPress: () => router.push('/build/edit') }}
        />
      </ScrollView>
    );
  }

  const stage = main.tuneStage ?? stageFromMods(main.mods);
  const swap = swapTag(main);
  const won = trophiesOf(main.id);
  const sample = isSample(main);

  return (
    <ScrollView contentContainerStyle={{ padding: SPACING.screen, gap: SPACING.section, paddingBottom: SPACING.xxxl }}>
      <View style={{ gap: SPACING.md }}>
        <Press
          onPress={() => router.push({ pathname: '/build/[id]', params: { id: main.id } })}
          feedback="card"
          label={`Your main build: ${main.make} ${main.model}, class ${classOf(main)}, ${buildMeta(main)}${stage !== 'stock' ? `, ${stageLabel(stage)}` : ''}${won ? `, ${plural(won, 'trophy', 'trophies')}` : ''}`}
          hint="Opens the build"
          style={{ gap: SPACING.md }}
        >
          <BuildHero build={main} {...(main.photos[0] ? { aspect: COVER_ASPECT } : { height: 180 })} trophies={won} tag={sample ? 'Sample' : undefined} />
          <View style={{ gap: SPACING.xs }}>
            <DsText v="eyebrow" tone="secondary">
              Main build
            </DsText>
            <DsText v="titleLg" numberOfLines={2}>
              {main.make} {main.model}
            </DsText>
            {main.nickname ? (
              <DsText v="secondary" numberOfLines={1}>
                {main.nickname}
              </DsText>
            ) : null}
          </View>
          {stage !== 'stock' || swap ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs }}>
              {stage !== 'stock' ? <Tag label={stageLabel(stage)} tone="info" /> : null}
              {swap ? <Tag label={swap} raw /> : null}
            </View>
          ) : null}
          <StatBlock
            stats={[
              { value: `${Math.round(effectivePower(main))}`, unit: 'bhp', label: main.dynoBhp ? 'Power · dyno' : 'Power · est.' },
              { value: `${bhpPerTonne(main)}`, label: 'bhp / tonne' },
              { value: `${main.mods.length}`, label: main.mods.length === 1 ? 'Mod' : 'Mods' },
            ]}
          />
        </Press>
        {sample ? <DsText v="caption">A sample build with sample trophies from the demo meet. Open it, then Edit to make it yours.</DsText> : null}
      </View>

      {others.length ? (
        <Section title={`Other builds (${others.length})`}>
          <BuildGrid builds={others} trophiesOf={trophiesOf} sampleId={isSample} />
        </Section>
      ) : null}

      <DsText v="caption" style={{ textAlign: 'center' }}>
        Class comes from power-to-weight. Cars and bikes use separate scales, so a litre superbike and an M4 are both S.
      </DsText>
    </ScrollView>
  );
}
