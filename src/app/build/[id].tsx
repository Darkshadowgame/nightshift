import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useLayoutEffect, useState } from 'react';
import { Image, ScrollView, View } from 'react-native';
import { AddModSheet } from '../../components/AddModSheet';
import { PaintedArt } from '../../components/BuildArt';
import { MOD_SECTIONS, sectionOfCategory, useBuildPicture } from '../../components/BuildBits';
import { at, isStaffNow, openProfile, openReport, OptionsSheet, personMark } from '../../components/Community';
import { Cover } from '../../components/Cover';
import { NotFoundState } from '../../components/Detail';
import { ActionBar, DsText, EmptyState, ErrorState, HeaderActions, Hero, ListRow, PAGE_WITH_BAR, RowDivider, Section, StatBlock, Tag, metaLine, useToast } from '../../components/ds';
import { DynoBadge } from '../../components/DynoBadge';
import { PhotoCredit } from '../../components/PhotoCredit';
import { PhotoManager } from '../../components/PhotoManager';
import { allAwards, categoryInfo } from '../../lib/awards';
import { carShape } from '../../lib/buildShape';
import { classOf } from '../../lib/classes';
import { useNow } from '../../lib/clock';
import { useCommunity } from '../../lib/communityStore';
import { dynoBadge, headlinePower, latestRun } from '../../lib/dyno';
import { isRoadIllegal, OFF_ROAD_TAG } from '../../lib/legality';
import { modCount, sharedGroupLabel } from '../../lib/modGroups';
import { photoSource } from '../../lib/photoSource';
import { useStore } from '../../lib/store';
import { swapTag } from '../../lib/swap';
import { stageFromMods, stageLabel } from '../../lib/tune';
import { ASPECT, COLOR, RADII, SPACING } from '../../theme';

/**
 * A build (Redesign 2, 3.9; T3): the photo with its class and name → bhp (✓ Dyno when a sheet
 * proves it), Class, Mods → the mods in four groups → photos → trophies → "Power and dyno ›" (the
 * only place for wheel figures, weight and dyno runs). Yours: Add a mod in the ActionBar, Edit in
 * the ··· menu. Someone else's: the same page with no owner actions.
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
  const mine = b?.ownerId === me;
  const community = useCommunity();
  const toast = useToast();
  const pic = useBuildPicture(b ?? { photos: [], make: '', model: '', kind: 'car' });

  useLayoutEffect(() => {
    if (!b) return;
    nav.setOptions({ headerRight: () => <HeaderActions onMenu={() => setMenu(true)} /> });
  }, [nav, b]);

  if (!b) return <NotFoundState what="Build" message="This build no longer exists." />;

  const owner = users.find((u) => u.id === b.ownerId);
  const letter = classOf(b);
  const power = headlinePower(b);
  const proven = dynoBadge(b, now)?.state === 'proven';
  const won = allAwards(votes, events, builds, now).filter((a) => a.buildId === b.id);
  const covers = won.filter((a) => categoryInfo(a.category).cover);
  const swap = swapTag(b);
  const stage = b.tuneStage ?? stageFromMods(b.mods);
  const groups = MOD_SECTIONS.map((s) => ({ ...s, mods: b.mods.filter((m) => sectionOfCategory(m.category) === s.key) })).filter((g) => g.mods.length);
  const latest = latestRun(b.dynoRuns);
  const photo = pic?.ref;
  const kindLine = metaLine([b.kind === 'bike' ? 'Bike' : 'Car', b.year ? String(b.year) : null, stage !== 'stock' ? stageLabel(stage) : null, swap]);
  const openPower = () => router.push({ pathname: '/build/power', params: { id: b.id } });

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={PAGE_WITH_BAR}>
        <Hero
          bleed
          aspect={ASPECT.build}
          photo={photo ? photoSource(photo) : null}
          media={
            photo ? undefined : (
              <PaintedArt paint={b.colour} vehicle={b.kind} shape={b.kind === 'car' ? carShape(b) : undefined} />
            )
          }
          classLetter={letter}
          title={`${b.make} ${b.model}`}
          meta={[b.nickname, kindLine]}
          overlay={photo ? <PhotoCredit photoRef={photo} kind={b.kind} similar={pic?.similar} overlay corner="topRight" /> : null}
        />

        <View style={{ gap: SPACING.sm }}>
          <StatBlock
            stats={[
              { value: `${power.bhp}`, unit: power.est ? 'bhp est.' : 'bhp', label: 'Power' },
              { value: letter, label: 'Class' },
              { value: `${modCount(b.mods)}`, label: modCount(b.mods) === 1 ? 'Mod' : 'Mods' },
            ]}
          />
          {proven ? <DynoBadge build={b} /> : null}
        </View>

        {!mine && owner ? (
          <ListRow leading={{ avatar: personMark(owner) }} title={at(owner)} subtitle="Owner" onPress={() => openProfile(owner.id)} accessibilityLabel={`${at(owner)}'s profile`} />
        ) : null}

        <Section title="Mods">
          {groups.length === 0 ? <EmptyState variant="inline" title={mine ? 'Stock for now. Add what you have done to it.' : 'Stock for now.'} /> : null}
          {groups.map((g) => (
            <View key={g.key} style={{ gap: SPACING.xxs }}>
              <DsText v="label" accessibilityRole="header">
                {g.label}
              </DsText>
              <View>
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
            </View>
          ))}
        </Section>

        {mine ? (
          <Section title="Photos">
            <PhotoManager photos={b.photos} onChange={(photos) => saveBuild({ ...b, photos }).catch((e) => setPhotoError(e instanceof Error ? e.message : "Couldn't save the photos."))} onError={setPhotoError} />
            {photoError ? <ErrorState title={photoError} /> : null}
          </Section>
        ) : b.photos.length > 1 ? (
          <Section title="Photos">
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm }}>
              {b.photos.slice(1).map((p) => (
                <Image key={p} source={photoSource(p)} style={{ width: '31%', aspectRatio: 1, borderRadius: RADII.control, backgroundColor: COLOR.surface.media }} accessibilityLabel="Photo of the build" accessibilityIgnoresInvertColors />
              ))}
            </View>
          </Section>
        ) : null}

        {won.length ? (
          <Section title="Trophies">
            {covers.length ? (
              <ScrollView horizontal contentContainerStyle={{ gap: SPACING.sm }} showsHorizontalScrollIndicator={false}>
                {covers.map((a) => (
                  <Cover key={a.eventId + a.category} award={a} build={b} owner={owner} event={events.find((e) => e.id === a.eventId)} width={180} />
                ))}
              </ScrollView>
            ) : null}
            <View>
              {won
                .filter((a) => !categoryInfo(a.category).cover)
                .map((a, i) => (
                  <View key={a.eventId + a.category}>
                    {i ? <RowDivider /> : null}
                    <ListRow leading={{ icon: 'success', colour: COLOR.text.primary }} title={categoryInfo(a.category).label} subtitle={events.find((e) => e.id === a.eventId)?.title} />
                  </View>
                ))}
            </View>
          </Section>
        ) : null}

        <View>
          <RowDivider />
          <ListRow
            title="Power and dyno"
            subtitle={latest ? 'How the power is worked out, and the dyno runs' : 'How the power is worked out'}
            trailing={proven ? <Tag label="✓ Dyno" tone="success" /> : undefined}
            onPress={openPower}
          />
          <RowDivider />
        </View>
      </ScrollView>

      <ActionBar primary={mine ? { label: 'Add a mod', icon: 'plus', onPress: () => setAddMod(true) } : null} />
      {mine ? <AddModSheet visible={addMod} build={b} onClose={() => setAddMod(false)} /> : null}

      <OptionsSheet
        visible={menu}
        title="Build options"
        options={
          mine
            ? [
                { label: 'Edit build', onPress: () => router.push({ pathname: '/build/edit', params: { id: b.id } }) },
                { label: 'Power and dyno', onPress: openPower },
                {
                  label: 'Sell a part',
                  detail: 'A For sale listing on the forum, linked to this build',
                  onPress: () => router.push({ pathname: '/forum/new', params: { board: 'for_sale', buildId: b.id, body: `Fits: ${b.make} ${b.model}${b.year ? ` (${b.year})` : ''}\n` } }),
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
    </View>
  );
}
