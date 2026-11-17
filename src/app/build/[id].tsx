import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { photoUri } from '../../lib/photos';
import { useLayoutEffect } from 'react';
import { Image, Pressable, ScrollView, View } from 'react-native';
import { BuildArt } from '../../components/BuildArt';
import { Cover, Trophy } from '../../components/Cover';
import { UserLink } from '../../components/UserLink';
import { allAwards, categoryInfo } from '../../lib/awards';
import { Card, ClassBadge, Row, Section, StatBar, Txt } from '../../components/ui';
import { MOD_CATEGORIES, modCategoryShort } from '../../data/catalog';
import { classOf, effectivePower, isModified, performanceFigure, powerBar } from '../../lib/classes';
import { useStore } from '../../lib/store';
import { C } from '../../theme';

const LOOKS = new Set(['wheels', 'body', 'lighting', 'interior']);
const HANDLING = new Set(['suspension', 'brakes', 'wheels']);
const SOUND = new Set(['exhaust', 'intake', 'turbo']);

export default function BuildScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const nav = useNavigation();
  const { builds, users, me, votes, events, now } = useStore();
  const b = builds.find((x) => x.id === id);

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

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 18, paddingBottom: 40 }}>
      {b.photos[0] ? <Image source={{ uri: photoUri(b.photos[0]) }} style={{ height: 220, borderRadius: 10 }} /> : <BuildArt kind={b.kind} colour={b.colour} height={180} />}
      {b.photos.length > 1 ? (
        <ScrollView horizontal contentContainerStyle={{ gap: 8 }}>
          {b.photos.slice(1).map((p) => (
            <Image key={p} source={{ uri: photoUri(p) }} style={{ width: 110, height: 80, borderRadius: 6 }} />
          ))}
        </ScrollView>
      ) : null}

      <Row style={{ flexWrap: 'nowrap', alignItems: 'flex-start' }} gap={14}>
        <ClassBadge letter={letter} size="lg" />
        <View style={{ flex: 1, gap: 2 }}>
          <Txt v="h1">{b.make} {b.model}</Txt>
          <Txt v="label">
            {b.year ? `${b.year} · ` : ''}{b.kind === 'bike' ? 'Bike' : 'Car'} · {owner?.region}
          </Txt>
          {owner ? (
            <UserLink id={owner.id} style={{ alignSelf: 'flex-start' }} label={`Open @${owner.handle}`}>
              <Txt v="label" style={{ color: C.neon }}>{owner.id === me ? 'Yours' : `@${owner.handle}`} ›</Txt>
            </UserLink>
          ) : null}
          {b.nickname ? <Txt v="muted">{b.nickname}</Txt> : null}
        </View>
      </Row>

      <Row gap={8} style={{ flexWrap: 'nowrap' }}>
        <Stat value={`${Math.round(effectivePower(b))}`} label={b.dynoBhp ? 'bhp · dyno' : 'bhp · est.'} />
        <Stat value={b.torqueLbFt ? `${b.torqueLbFt}` : '–'} label="lb-ft" />
        <Stat value={`${Math.round(b.kind === 'bike' ? figure : (effectivePower(b) / b.weightKg) * 1000)}`} label="bhp / tonne" />
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
        const won = allAwards(votes, events, builds, now).filter((a) => a.buildId === b.id);
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
          {MOD_CATEGORIES.flatMap((cat) =>
            b.mods
              .filter((m) => m.category === cat.key)
              .map((m) => (
                <Row key={m.id} style={{ justifyContent: 'space-between', flexWrap: 'nowrap', borderBottomWidth: 1, borderBottomColor: C.kerb, paddingBottom: 6 }}>
                  <Txt style={{ flex: 1 }}>{m.name}</Txt>
                  <Txt v="mono">{m.bhpGain ? `+${m.bhpGain} BHP · ` : ''}{modCategoryShort(m.category)}</Txt>
                </Row>
              )),
          )}
        </Card>
      </Section>
      <Txt v="muted" style={{ fontSize: 12 }}>
        Stock {b.stockBhp} bhp · {b.weightKg} kg {b.kind === 'bike' ? 'wet' : 'kerb'}
      </Txt>
    </ScrollView>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: C.tarmac, borderColor: C.kerb, borderWidth: 1, borderRadius: 6, padding: 10 }}>
      <Txt v="h2" style={{ fontVariant: ['tabular-nums'] }}>{value}</Txt>
      <Txt v="label" style={{ fontSize: 10 }}>{label}</Txt>
    </View>
  );
}
