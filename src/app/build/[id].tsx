import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useLayoutEffect, useState } from 'react';
import { Image, ScrollView, View } from 'react-native';
import { BuildHero } from '../../components/BuildHero';
import { at, openProfile, openReport, OptionsSheet, personMark } from '../../components/Community';
import { Cover, Trophy } from '../../components/Cover';
import { DsText, ErrorState, HeaderActions, ListRow, RowDivider, Section, StatBlock, Tag, metaLine } from '../../components/ds';
import { PhotoManager } from '../../components/PhotoManager';
import { NotFound } from '../../components/ui';
import { MOD_CATEGORIES } from '../../data/catalog';
import { allAwards, categoryInfo } from '../../lib/awards';
import { classOf, effectivePower, performanceFigure } from '../../lib/classes';
import { useNow } from '../../lib/clock';
import { useCommunityQuery } from '../../lib/communityStore';
import { plural } from '../../lib/format';
import { isRoadIllegal, OFF_ROAD_TAG } from '../../lib/legality';
import { photoUri } from '../../lib/photos';
import { useStore } from '../../lib/store';
import { swapTag } from '../../lib/swap';
import { stageFromMods, stageLabel } from '../../lib/tune';
import { COLOR, RADII, SPACING } from '../../theme';

/**
 * A build: kind, name, owner, tags, the photo, then a stat block (power, weight, class, tune),
 * trophies, and the mods grouped by category with road-illegal ones labelled.
 */
export default function BuildScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const nav = useNavigation();
  const { builds, users, me, votes, events, saveBuild } = useStore();
  const now = useNow();
  const b = builds.find((x) => x.id === id);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [menu, setMenu] = useState(false);
  const likes = useCommunityQuery((c) => c.buildLikes([id]), [id]);
  const mine = b?.ownerId === me;

  useLayoutEffect(() => {
    if (!b) return;
    nav.setOptions({
      headerRight: () =>
        mine ? (
          <HeaderActions action={{ label: 'Edit', accessibilityLabel: 'Edit build', onPress: () => router.push({ pathname: '/build/edit', params: { id: b.id } }) }} />
        ) : (
          <HeaderActions onMenu={() => setMenu(true)} />
        ),
    });
  }, [nav, b, mine]);

  if (!b) return <NotFound what="Build" message="This build no longer exists." />;

  const owner = users.find((u) => u.id === b.ownerId);
  const letter = classOf(b);
  const figure = performanceFigure(b);
  const won = allAwards(votes, events, builds, now).filter((a) => a.buildId === b.id);
  const swap = swapTag(b);
  const stage = b.tuneStage ?? stageFromMods(b.mods);
  const likeCount = likes.data?.[b.id] ?? 0;
  const groups = MOD_CATEGORIES.map((cat) => ({ cat, mods: b.mods.filter((m) => m.category === cat.key) })).filter((g) => g.mods.length);
  const covers = won.filter((a) => categoryInfo(a.category).cover);

  return (
    <ScrollView contentContainerStyle={{ padding: SPACING.screen, gap: SPACING.section, paddingBottom: SPACING.xxxl }}>
      <View style={{ gap: SPACING.sm }}>
        <DsText v="eyebrow" tone="secondary">
          {b.kind === 'bike' ? 'Bike' : 'Car'}
          {b.year ? ` · ${b.year}` : ''}
        </DsText>
        <DsText v="titleLg" accessibilityRole="header">
          {b.make} {b.model}
        </DsText>
        {b.nickname ? <DsText v="secondary">{b.nickname}</DsText> : null}
        {owner ? (
          <ListRow
            leading={{ avatar: personMark(owner) }}
            title={owner.id === me ? 'You' : at(owner)}
            subtitle={owner.region}
            onPress={() => openProfile(owner.id)}
            accessibilityLabel={owner.id === me ? 'Your profile' : `${at(owner)}'s profile`}
          />
        ) : null}
        {stage !== 'stock' || swap || likeCount > 0 ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: SPACING.sm }}>
            {stage !== 'stock' ? <Tag label={stageLabel(stage)} tone="info" /> : null}
            {swap ? <Tag label={swap} raw /> : null}
            {likeCount > 0 ? (
              <DsText v="meta" accessibilityLabel={`${plural(likeCount, 'like')} from Rate builds`}>
                {plural(likeCount, 'like')}
              </DsText>
            ) : null}
          </View>
        ) : null}
      </View>

      <BuildHero build={b} height={b.photos[0] ? 240 : 200} trophies={won.length} />

      <View style={{ gap: SPACING.sm }}>
        {/* Two rows of two, so "Stage 2+" and a four-figure weight never clip on a small phone. */}
        <StatBlock
          stats={[
            { value: `${Math.round(effectivePower(b))}`, unit: 'bhp', label: b.dynoBhp ? 'Power · dyno' : 'Power · est.' },
            { value: `${b.weightKg}`, unit: 'kg', label: b.kind === 'bike' ? 'Weight · wet' : 'Weight · kerb' },
          ]}
        />
        <StatBlock
          stats={[
            { value: letter, label: 'Class' },
            { value: stageLabel(stage), label: 'Tune' },
          ]}
        />
        <DsText v="caption">
          {metaLine([
            `Class ${letter} from ${Math.round(figure)} ${b.kind === 'bike' ? 'bhp per tonne' : 'weight-adjusted bhp'}`,
            `${b.engineSwap ? 'donor engine' : 'stock'} ${b.stockBhp} bhp`,
            `${b.weightKg} kg ${b.kind === 'bike' ? 'wet' : 'kerb'}${b.engineSwap?.weightDeltaKg ? ` (incl. ${b.engineSwap.weightDeltaKg > 0 ? '+' : ''}${b.engineSwap.weightDeltaKg} kg from the swap)` : ''}`,
          ])}
          . {b.dynoBhp ? 'Dyno verified.' : mine ? 'Upload a dyno sheet to verify.' : 'Not dyno verified.'}
        </DsText>
      </View>

      {mine ? (
        <Section title={`Photos (${b.photos.length})`}>
          <PhotoManager photos={b.photos} onChange={(photos) => saveBuild({ ...b, photos }).catch((e) => setPhotoError(e instanceof Error ? e.message : "Couldn't save the photos."))} onError={setPhotoError} />
          {photoError ? <ErrorState title={photoError} /> : null}
        </Section>
      ) : b.photos.length > 1 ? (
        <ScrollView horizontal contentContainerStyle={{ gap: SPACING.sm }} showsHorizontalScrollIndicator={false}>
          {b.photos.slice(1).map((p) => (
            <Image key={p} source={{ uri: photoUri(p) }} style={{ width: 120, height: 90, borderRadius: RADII.control, backgroundColor: COLOR.surface.media }} accessibilityLabel="Photo of the build" accessibilityIgnoresInvertColors />
          ))}
        </ScrollView>
      ) : null}

      {won.length ? (
        <Section title={`Trophies (${won.length})`}>
          {covers.length > 0 ? (
            <ScrollView horizontal contentContainerStyle={{ gap: SPACING.sm }} showsHorizontalScrollIndicator={false}>
              {covers.map((a) => (
                <Cover key={a.eventId + a.category} award={a} build={b} owner={owner} event={events.find((e) => e.id === a.eventId)} width={200} />
              ))}
            </ScrollView>
          ) : null}
          <View>
            {won.map((a, i) => (
              <View key={a.eventId + a.category}>
                {i ? <RowDivider inset /> : null}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.md, minHeight: 56 }}>
                  <View style={{ width: 40, alignItems: 'center' }} aria-hidden>
                    <Trophy colour={categoryInfo(a.category).cover ? COLOR.state.warning : COLOR.text.primary} size={28} />
                  </View>
                  <View style={{ flex: 1, gap: SPACING.xxs }}>
                    <DsText v="body">{categoryInfo(a.category).label}</DsText>
                    <DsText v="meta" numberOfLines={1}>
                      {events.find((e) => e.id === a.eventId)?.title ?? ''}
                    </DsText>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </Section>
      ) : null}

      <Section title={`Mods (${b.mods.length})`}>
        {groups.length === 0 ? <DsText v="secondary">Stock for now.</DsText> : null}
        {groups.map((g) => (
          <View key={g.cat.key} style={{ gap: SPACING.xxs }}>
            <DsText v="label" accessibilityRole="header">
              {g.cat.label}
            </DsText>
            {g.mods.map((m, i) => (
              <View key={m.id}>
                {i ? <RowDivider /> : null}
                <ListRow
                  title={m.name}
                  trailing={
                    <View style={{ alignItems: 'flex-end', gap: SPACING.xs }}>
                      {m.bhpGain ? <DsText v="meta">+{m.bhpGain} bhp</DsText> : null}
                      {isRoadIllegal(m) ? <Tag label="Off-road only" tone="warning" accessibilityLabel={OFF_ROAD_TAG} /> : null}
                    </View>
                  }
                  accessibilityLabel={metaLine([m.name, m.bhpGain ? `plus ${m.bhpGain} bhp` : null, isRoadIllegal(m) ? OFF_ROAD_TAG : null])}
                />
              </View>
            ))}
          </View>
        ))}
      </Section>

      <OptionsSheet
        visible={menu}
        title="Build options"
        options={[
          ...(owner ? [{ label: `View ${at(owner)}`, onPress: () => openProfile(owner.id) }] : []),
          { label: 'Report build', onPress: () => openReport('build', b.id, b.ownerId, 'build') },
        ]}
        onClose={() => setMenu(false)}
      />
    </ScrollView>
  );
}
