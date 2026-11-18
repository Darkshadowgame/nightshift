import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { ReportLink } from '../../components/Community';
import { useCommunityQuery } from '../../lib/communityStore';
import { isRoadIllegal, OFF_ROAD_TAG } from '../../lib/legality';
import { photoUri } from '../../lib/photos';
import { useLayoutEffect, useState } from 'react';
import { Image, ScrollView, View } from 'react-native';
import { BuildHero } from '../../components/BuildHero';
import { FadeUp } from '../../components/motion';
import { PhotoManager } from '../../components/PhotoManager';
import { Cover, Trophy } from '../../components/Cover';
import { UserLink } from '../../components/UserLink';
import { allAwards, categoryInfo } from '../../lib/awards';
import { Card, HeaderAction, InlineError, NotFound, Row, Section, Stat, StatBar, Tag, Txt } from '../../components/ui';
import { MOD_CATEGORIES, modCategoryShort } from '../../data/catalog';
import { bhpPerTonne, classOf, effectivePower, isModified, performanceFigure, powerBar } from '../../lib/classes';
import { useStore } from '../../lib/store';
import { useNow } from '../../lib/clock';
import { swapTag } from '../../lib/swap';
import { stageFromMods, stageLabel } from '../../lib/tune';
import { BRAND, C, RADIUS } from '../../theme';

const LOOKS = new Set(['wheels', 'body', 'lighting', 'interior']);
const HANDLING = new Set(['suspension', 'brakes', 'wheels']);
const SOUND = new Set(['exhaust', 'intake', 'turbo']);

export default function BuildScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const nav = useNavigation();
  const { builds, users, me, votes, events, saveBuild } = useStore();
  const now = useNow();
  const b = builds.find((x) => x.id === id);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const likes = useCommunityQuery((c) => c.buildLikes([id]), [id]);

  useLayoutEffect(() => {
    if (!b || b.ownerId !== me) return;
    nav.setOptions({
      headerRight: () => (
        <HeaderAction label="Edit" accessibilityLabel="Edit build" onPress={() => router.push({ pathname: '/build/edit', params: { id: b.id } })} />
      ),
    });
  }, [nav, b, me]);

  if (!b) return <NotFound what="Build" message="This build no longer exists." />;

  const owner = users.find((u) => u.id === b.ownerId);
  const letter = classOf(b);
  const count = (set: Set<string>) => b.mods.filter((m) => set.has(m.category)).length;
  const figure = performanceFigure(b);
  const won = allAwards(votes, events, builds, now).filter((a) => a.buildId === b.id);
  const swap = swapTag(b);
  const stage = b.tuneStage ?? stageFromMods(b.mods);

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 18, paddingBottom: 40 }}>
      <BuildHero build={b} height={b.photos[0] ? 240 : 200} trophies={won.length} />
      {likes.data && (likes.data[b.id] ?? 0) > 0 ? (
        <Txt v="mono" accessibilityLabel={`${likes.data[b.id]} likes from Rate builds`}>♥ {likes.data[b.id]} {likes.data[b.id] === 1 ? 'LIKE' : 'LIKES'}</Txt>
      ) : null}
      {b.ownerId === me ? (
        <Section title={`Photos (${b.photos.length})`}>
          <PhotoManager photos={b.photos} onChange={(photos) => saveBuild({ ...b, photos }).catch((e) => setPhotoError(e instanceof Error ? e.message : 'Could not save the photos.'))} onError={setPhotoError} />
          <InlineError message={photoError} />
        </Section>
      ) : b.photos.length > 1 ? (
        <ScrollView horizontal contentContainerStyle={{ gap: 8 }}>
          {b.photos.slice(1).map((p) => (
            <Image key={p} source={{ uri: photoUri(p) }} style={{ width: 110, height: 80, borderRadius: RADIUS.card }} />
          ))}
        </ScrollView>
      ) : null}

      <Row style={{ flexWrap: 'nowrap', alignItems: 'flex-start' }} gap={14}>
        <View style={{ flex: 1, gap: 2 }}>
          <Txt v="h1">{b.make} {b.model}</Txt>
          {swap || stage !== 'stock' ? (
            <Txt v="label" style={{ color: BRAND }}>{[swap, stage !== 'stock' ? stageLabel(stage) : null].filter(Boolean).join(' · ')}</Txt>
          ) : null}
          <Txt v="label">{owner?.region}</Txt>
          {owner ? (
            <UserLink id={owner.id} style={{ alignSelf: 'flex-start' }} label={`Open @${owner.handle}`}>
              <Txt v="label" style={{ color: BRAND, textTransform: owner.id === me ? 'uppercase' : 'none' }}>{owner.id === me ? 'Yours' : `@${owner.handle}`} ›</Txt>
            </UserLink>
          ) : null}
          {b.nickname ? <Txt v="muted">{b.nickname}</Txt> : null}
        </View>
      </Row>

      <Row gap={8} style={{ flexWrap: 'nowrap' }}>
        <Stat value={`${Math.round(effectivePower(b))}`} label={b.dynoBhp ? 'bhp · dyno' : 'bhp · est.'} />
        <Stat value={b.torqueLbFt ? `${b.torqueLbFt}` : '–'} label="lb-ft" />
        <Stat value={`${bhpPerTonne(b)}`} label="bhp / tonne" />
      </Row>

      <Card>
        <StatBar label="Power" value={powerBar(b)} />
        <StatBar label="Handling" value={0.3 + count(HANDLING) * 0.17} />
        <StatBar label="Looks" value={0.3 + count(LOOKS) * 0.15} />
        <StatBar label="Sound" value={0.25 + count(SOUND) * 0.2} />
        <Txt v="caption">
          Class {letter} from {Math.round(figure)} {b.kind === 'bike' ? 'bhp per tonne' : 'weight-adjusted bhp'}. {b.dynoBhp ? 'Dyno verified.' : b.ownerId === me ? 'Upload a dyno sheet to verify.' : 'Not dyno verified.'}
        </Txt>
      </Card>

      {(() => {
        if (won.length === 0) return null;
        const covers = won.filter((a) => categoryInfo(a.category).cover);
        return (
          <Section title={`Trophies (${won.length})`}>
            {covers.length > 0 ? (
              <ScrollView horizontal contentContainerStyle={{ gap: 10 }} showsHorizontalScrollIndicator={false}>
                {covers.map((a) => (
                  <Cover key={a.eventId + a.category} award={a} build={b} owner={owner} event={events.find((e) => e.id === a.eventId)} width={200} />
                ))}
              </ScrollView>
            ) : null}
            <Row gap={10}>
              {won.map((a) => (
                <Card key={a.eventId + a.category} style={{ width: 96, alignItems: 'center', gap: 4, padding: 8 }}>
                  <Trophy colour={categoryInfo(a.category).cover ? BRAND : C.chalk} size={36} />
                  <Txt v="micro" style={{ textAlign: 'center', color: C.chalk }}>{categoryInfo(a.category).label}</Txt>
                  <Txt v="micro" style={{ textAlign: 'center', textTransform: 'none' }} numberOfLines={2}>{events.find((e) => e.id === a.eventId)?.title}</Txt>
                </Card>
              ))}
            </Row>
          </Section>
        );
      })()}

      <Section title={`Mods (${b.mods.length})${isModified(b) ? ' · modified' : ''}`}>
        <Card>
          {b.mods.length === 0 ? <Txt v="muted">Stock for now.</Txt> : null}
          {MOD_CATEGORIES.flatMap((cat) => b.mods.filter((m) => m.category === cat.key)).map((m, i, all) => (
            <FadeUp key={m.id} index={i}>
              <Row
                style={[
                  { justifyContent: 'space-between', flexWrap: 'nowrap', paddingBottom: 6 },
                  i < all.length - 1 && { borderBottomWidth: 1, borderBottomColor: C.kerb },
                ]}
              >
                <Txt v="micro" style={{ width: 62 }}>{modCategoryShort(m.category)}</Txt>
                <View style={{ flex: 1 }}>
                  <Txt>{m.name}</Txt>
                  {isRoadIllegal(m) ? <Tag label={`⚠ ${OFF_ROAD_TAG}`} tone="warning" /> : null}
                </View>
                {m.bhpGain ? <Txt v="mono" style={{ color: BRAND }}>+{m.bhpGain} BHP</Txt> : null}
              </Row>
            </FadeUp>
          ))}
        </Card>
      </Section>
      <Txt v="caption">
        {b.engineSwap ? 'Donor engine' : 'Stock'} {b.stockBhp} bhp · {b.weightKg} kg {b.kind === 'bike' ? 'wet' : 'kerb'}{b.engineSwap?.weightDeltaKg ? ` (incl. ${b.engineSwap.weightDeltaKg > 0 ? '+' : ''}${b.engineSwap.weightDeltaKg} kg from the swap)` : ''}
      </Txt>
      {b.ownerId !== me ? <ReportLink target="build" id={b.id} userId={b.ownerId} what="build" /> : null}
    </ScrollView>
  );
}
