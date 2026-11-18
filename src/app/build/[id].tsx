import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useLayoutEffect, useState } from 'react';
import { Image, ScrollView, View } from 'react-native';
import { BuildHero } from '../../components/BuildHero';
import { at, isStaffNow, openProfile, openReport, OptionsSheet, personMark } from '../../components/Community';
import { Cover, Trophy } from '../../components/Cover';
import { Button, DsText, ErrorState, HeaderActions, ListRow, RowDivider, Section, StatBlock, Tag, metaLine, useToast } from '../../components/ds';
import { DynoSection } from '../../components/DynoSection';
import { PhotoManager } from '../../components/PhotoManager';
import { MOD_CATEGORIES } from '../../data/catalog';
import { allAwards, categoryInfo } from '../../lib/awards';
import { bhpPerTonne, classOf, powerIsEstimate, sheetRun } from '../../lib/classes';
import { modCount, sharedGroupLabel } from '../../lib/modGroups';
import { AddModSheet } from '../../components/AddModSheet';
import { useNow } from '../../lib/clock';
import { useCommunity, useCommunityQuery } from '../../lib/communityStore';
import { plural } from '../../lib/format';
import { isRoadIllegal, OFF_ROAD_TAG } from '../../lib/legality';
import { useStore } from '../../lib/store';
import { swapTag } from '../../lib/swap';
import { stageFromMods, stageLabel } from '../../lib/tune';
import { COLOR, RADII, SPACING } from '../../theme';
import { NotFoundState } from '../../components/Detail';
import { photoSource } from '../../lib/photoSource';
import { dynoBadge, headlinePower, latestRun, whpText } from '../../lib/dyno';
import { DynoBadge } from '../../components/DynoBadge';

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
  const [addMod, setAddMod] = useState(false);
  const likes = useCommunityQuery((c) => c.buildLikes([id]), [id]);
  const mine = b?.ownerId === me;
  const community = useCommunity();
  const toast = useToast();

  useLayoutEffect(() => {
    if (!b) return;
    nav.setOptions({
      // Detail screens: a ··· menu, yours or not (REVIEW-7 inconsistency 2). Edit is in it.
      headerRight: () => <HeaderActions onMenu={() => setMenu(true)} />,
    });
  }, [nav, b, mine]);

  if (!b) return <NotFoundState what="Build" message="This build no longer exists." />;

  const owner = users.find((u) => u.id === b.ownerId);
  const letter = classOf(b);
  const power = headlinePower(b);
  const whp = whpText(b);
  const won = allAwards(votes, events, builds, now).filter((a) => a.buildId === b.id);
  const swap = swapTag(b);
  const stage = b.tuneStage ?? stageFromMods(b.mods);
  const likeCount = likes.data?.[b.id] ?? 0;
  const groups = MOD_CATEGORIES.map((cat) => ({ cat, mods: b.mods.filter((m) => m.category === cat.key) })).filter((g) => g.mods.length);
  const covers = won.filter((a) => categoryInfo(a.category).cover);
  const badge = dynoBadge(b, now);
  const latest = latestRun(b.dynoRuns);

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
      <DynoBadge build={b} />

      <View style={{ gap: SPACING.sm }}>
        {/* Two rows of two, so "Stage 2+" and a four-figure weight never clip on a small phone. */}
        <StatBlock
          stats={[
            // One power figure (REVIEW-10 #5): bhp at the crank, "est." from a wheels run; proven by a sheet or claimed.
            { value: `${power.bhp}`, unit: power.est ? 'bhp est.' : 'bhp', label: badge?.state === 'proven' ? 'Power · dyno' : sheetRun(b) ? 'Power · sheet' : 'Power · claimed' },
            { value: `${b.weightKg}`, unit: 'kg', label: b.kind === 'bike' ? 'Weight · wet' : 'Weight · kerb' },
          ]}
        />
        <StatBlock
          stats={[
            { value: letter, label: 'Class' },
            { value: `${bhpPerTonne(b)}`, label: 'bhp / tonne' },
            { value: stageLabel(stage), label: 'Tune' },
          ]}
        />
        {whp ? <DsText v="secondary">{whp}</DsText> : null}
        <DsText v="caption">
          {/* One plain line for Class (REVIEW-10 #5): no "on the car scale" number. */}
          {`Class ${letter} comes from ${power.bhp} bhp${powerIsEstimate(b) ? ' (estimated from the wheels run)' : ''} for ${b.weightKg} kg${b.kind === 'bike' ? ' wet' : ''}; ${b.kind === 'bike' ? 'bikes' : 'cars'} have their own scale. `}
          {sheetRun(b) ? 'The power is from your dyno run with its sheet.' : `The power is claimed: ${b.engineSwap ? 'the donor engine' : 'standard'} ${b.stockBhp} bhp plus the mods. Typed dyno runs without a sheet don't change it.`}
        </DsText>
      </View>

      <DynoSection build={b} mine={mine} onSave={saveBuild} />

      {mine ? (
        <Section title={`Photos (${b.photos.length})`}>
          <PhotoManager photos={b.photos} onChange={(photos) => saveBuild({ ...b, photos }).catch((e) => setPhotoError(e instanceof Error ? e.message : "Couldn't save the photos."))} onError={setPhotoError} />
          {photoError ? <ErrorState title={photoError} /> : null}
        </Section>
      ) : b.photos.length > 1 ? (
        <ScrollView horizontal contentContainerStyle={{ gap: SPACING.sm }} showsHorizontalScrollIndicator={false}>
          {b.photos.slice(1).map((p) => (
            <Image key={p} source={photoSource(p)} style={{ width: 120, height: 90, borderRadius: RADII.control, backgroundColor: COLOR.surface.media }} accessibilityLabel="Photo of the build" accessibilityIgnoresInvertColors />
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

      <Section title={`Mods (${modCount(b.mods)})`}>
        {groups.length === 0 ? <DsText v="secondary">Stock for now.</DsText> : null}
        {mine ? (
          <Button
            label="Add a mod"
            icon="plus"
            tier="secondary"
            block
            onPress={() => setAddMod(true)}
          />
        ) : null}
        {mine ? <AddModSheet visible={addMod} build={b} onClose={() => setAddMod(false)} /> : null}
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
                  subtitle={metaLine([m.note, sharedGroupLabel(m, b.mods) ? `Counts once as ${sharedGroupLabel(m, b.mods)!.toLowerCase()}` : null]) || undefined}
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
        options={
          mine
            ? [
                { label: 'Edit build', onPress: () => router.push({ pathname: '/build/edit', params: { id: b.id } }) },
                {
                  label: 'Sell a part',
                  detail: 'A For sale listing on the forum, linked to this build',
                  onPress: () => router.push({ pathname: '/forum/new', params: { board: 'for_sale', buildId: b.id, body: `Fits: ${b.make} ${b.model}${b.year ? ` (${b.year})` : ''}
` } }),
                },
              ]
            : [
                ...(owner ? [{ label: `View ${at(owner)}`, onPress: () => openProfile(owner.id) }] : []),
                { label: 'Report build', onPress: () => openReport('build', b.id, b.ownerId, 'build') },
                // Staff: a fake or edited sheet loses its badge (logged in the audit log).
                ...(isStaffNow() && latest?.photo && !latest.badgeRemoved
                  ? [
                      {
                        label: 'Remove the Dyno badge',
                        detail: 'For a fake or edited dyno sheet. Logged in the audit log.',
                        onPress: () =>
                          community
                            .run((s) => s.removeDynoBadge(latest.id, 'Fake or edited dyno sheet'))
                            .then(() => toast({ message: 'Dyno badge removed' }))
                            .catch((e) => setPhotoError(e instanceof Error ? e.message : "Couldn't remove it.")),
                      },
                    ]
                  : []),
              ]
        }
        onClose={() => setMenu(false)}
      />
    </ScrollView>
  );
}
