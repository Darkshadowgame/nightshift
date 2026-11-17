import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { isRoadIllegal, OFF_ROAD_TAG } from '../../lib/legality';
import { photoUri } from '../../lib/photos';
import { useLayoutEffect, useState } from 'react';
import { Image, Pressable, ScrollView, View } from 'react-native';
import { BuildHero } from '../../components/BuildHero';
import { FadeUp } from '../../components/motion';
import { PhotoManager } from '../../components/PhotoManager';
import { Cover, Trophy } from '../../components/Cover';
import { UserLink } from '../../components/UserLink';
import { allAwards, categoryInfo } from '../../lib/awards';
import { Card, Row, Section, Stat, StatBar, Txt } from '../../components/ui';
import { MOD_CATEGORIES, modCategoryShort } from '../../data/catalog';
import { bhpPerTonne, classOf, effectivePower, isModified, performanceFigure, powerBar } from '../../lib/classes';
import { useStore } from '../../lib/store';
import { useNow } from '../../lib/clock';
import { swapTag } from '../../lib/swap';
import { stageFromMods, stageLabel } from '../../lib/tune';
import { C } from '../../theme';

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

  useLayoutEffect(() => {
    if (!b || b.ownerId !== me) return;
    nav.setOptions({
      headerRight: () => (
        <Pressable
          onPress={() => router.push({ pathname: '/build/edit', params: { id: b.id } })}
          hitSlop={10}
          style={{ marginRight: 16 }}
          accessibilityRole="button"
          accessibilityLabel="Edit build"
        >
          <Txt v="label" style={{ color: C.sodium, fontSize: 14 }}>Edit</Txt>
        </Pressable>
      ),
    });
  }, [nav, b, me]);

  if (!b) return <View style={{ flex: 1, padding: 16 }}><Txt>This build no longer exists.</Txt></View>;

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
      {b.ownerId === me ? (
        <Section title={`Photos (${b.photos.length})`}>
          <PhotoManager photos={b.photos} onChange={(photos) => saveBuild({ ...b, photos })} onError={setPhotoError} />
          {photoError ? <Txt style={{ color: C.alert }} accessibilityLiveRegion="polite">{photoError}</Txt> : null}
        </Section>
      ) : b.photos.length > 1 ? (
        <ScrollView horizontal contentContainerStyle={{ gap: 8 }}>
          {b.photos.slice(1).map((p) => (
            <Image key={p} source={{ uri: photoUri(p) }} style={{ width: 110, height: 80, borderRadius: 6 }} />
          ))}
        </ScrollView>
      ) : null}

      <Row style={{ flexWrap: 'nowrap', alignItems: 'flex-start' }} gap={14}>
        <View style={{ flex: 1, gap: 2 }}>
          <Txt v="h1">{b.make} {b.model}</Txt>
          {swap || stage !== 'stock' ? (
            <Txt v="label" style={{ color: C.magenta }}>{[swap, stage !== 'stock' ? stageLabel(stage) : null].filter(Boolean).join(' · ')}</Txt>
          ) : null}
          <Txt v="label">{owner?.region}</Txt>
          {owner ? (
            <UserLink id={owner.id} style={{ alignSelf: 'flex-start' }} label={`Open @${owner.handle}`}>
              <Txt v="label" style={{ color: C.neon, textTransform: owner.id === me ? 'uppercase' : 'none' }}>{owner.id === me ? 'Yours' : `@${owner.handle}`} ›</Txt>
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
        <StatBar label="Handling" value={0.3 + count(HANDLING) * 0.17} colour={C.neon} />
        <StatBar label="Looks" value={0.3 + count(LOOKS) * 0.15} colour={C.magenta} />
        <StatBar label="Sound" value={0.25 + count(SOUND) * 0.2} colour={C.lime} />
        <Txt v="muted" style={{ fontSize: 12 }}>
          Class {letter} from {Math.round(figure)} {b.kind === 'bike' ? 'bhp per tonne' : 'weight-adjusted bhp'}. {b.dynoBhp ? 'Dyno verified.' : 'Upload a dyno sheet to verify.'}
        </Txt>
      </Card>

      {(() => {
        if (won.length === 0) return null;
        const covers = won.filter((a) => categoryInfo(a.category).cover);
        return (
          <Section title={`Trophy cabinet (${won.length})`}>
            {covers.length > 0 ? (
              <ScrollView horizontal contentContainerStyle={{ gap: 10 }} showsHorizontalScrollIndicator={false}>
                {covers.map((a) => (
                  <Cover key={a.eventId + a.category} award={a} build={b} owner={owner} event={events.find((e) => e.id === a.eventId)} width={200} />
                ))}
              </ScrollView>
            ) : null}
            <Row gap={10}>
              {won.map((a) => (
                <View key={a.eventId + a.category} style={{ width: 96, alignItems: 'center', gap: 4, padding: 8, backgroundColor: C.tarmac, borderRadius: 8, borderWidth: 1, borderColor: C.kerb }}>
                  <Trophy colour={categoryInfo(a.category).cover ? C.sodium : C.chalk} size={36} />
                  <Txt v="label" style={{ textAlign: 'center', fontSize: 11, color: C.chalk }}>{categoryInfo(a.category).label}</Txt>
                  <Txt v="muted" style={{ textAlign: 'center', fontSize: 11 }} numberOfLines={2}>{events.find((e) => e.id === a.eventId)?.title}</Txt>
                </View>
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
                <Txt v="label" style={{ width: 62, color: C.fog, fontSize: 11 }}>{modCategoryShort(m.category)}</Txt>
                <View style={{ flex: 1 }}>
                  <Txt>{m.name}</Txt>
                  {isRoadIllegal(m) ? <Txt v="label" style={{ color: C.alert, fontSize: 11 }}>⚠ {OFF_ROAD_TAG}</Txt> : null}
                </View>
                {m.bhpGain ? <Txt v="mono" style={{ color: C.sodium }}>+{m.bhpGain} BHP</Txt> : null}
              </Row>
            </FadeUp>
          ))}
        </Card>
      </Section>
      <Txt v="muted" style={{ fontSize: 12 }}>
        {b.engineSwap ? 'Donor engine' : 'Stock'} {b.stockBhp} bhp · {b.weightKg} kg {b.kind === 'bike' ? 'wet' : 'kerb'}{b.engineSwap?.weightDeltaKg ? ` (incl. ${b.engineSwap.weightDeltaKg > 0 ? '+' : ''}${b.engineSwap.weightDeltaKg} kg from the swap)` : ''}
      </Txt>
    </ScrollView>
  );
}
