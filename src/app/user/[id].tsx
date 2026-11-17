import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { BuildArt } from '../../components/BuildArt';
import { Trophy } from '../../components/Cover';
import { LevelTag, useRep } from '../../components/Rep';
import { CrewCard } from '../../components/CrewCard';
import { Card, ClassBadge, LegendTag, NotFound, Row, SampleTag, Section, Txt } from '../../components/ui';
import { allAwards, categoryInfo } from '../../lib/awards';
import { classOf, effectivePower, isModified } from '../../lib/classes';
import { plural } from '../../lib/format';
import { publicProfile } from '../../lib/people';
import { useStore } from '../../lib/store';
import { useNow } from '../../lib/clock';
import { SAMPLE_PEOPLE } from '../../data/seed';
import { BRAND, C } from '../../theme';

/** Someone's public profile: builds, trophies, crew. Never any location. */
export default function UserScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { users, builds, crews, events, votes, me } = useStore();
  const now = useNow();
  const awards = useMemo(() => allAwards(votes, events, builds, now), [votes, events, builds, now]);
  const p = publicProfile(id, users, builds, crews, events, awards, now);
  const rep = useRep(id);

  // The header stays blank, like every detail screen: the card carries the handle.
  if (!p) return <NotFound what="Profile" message="This person isn't on Nightshift any more." />;

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 20, paddingBottom: 40 }}>
      <Card>
        <Row>
          <Txt v="h1" style={{ textTransform: 'none' }}>@{p.handle}</Txt>
          <LevelTag level={rep.level.level} size="lg" />
          {p.legend ? <LegendTag /> : null}
          {SAMPLE_PEOPLE.includes(p.id) ? <SampleTag /> : null}
        </Row>
        <Txt>{p.name}{p.id === me ? ' (you)' : ''}</Txt>
        <Txt v="muted">{p.region}</Txt>
        <Row gap={16}>
          <Txt v="mono">{plural(p.builds.length, 'build').toUpperCase()}</Txt>
          <Txt v="mono" accessibilityLabel={`${plural(p.meetsAttended, 'event')} attended`}>{plural(p.meetsAttended, 'event').toUpperCase()} ATTENDED</Txt>
          <Txt v="mono">{p.hosted} HOSTED</Txt>
          <Txt v="mono">{plural(p.trophies.length, 'trophy', 'trophies').toUpperCase()}</Txt>
          <Txt v="mono" style={{ color: BRAND }}>{rep.ledger.total.toLocaleString('en-GB')} REP</Txt>
        </Row>
      </Card>

      <Section title="Crew">
        {p.crew ? (
          <CrewCard crew={p.crew} />
        ) : (
          <Card>
            <Txt v="muted">Not in a crew.</Txt>
          </Card>
        )}
      </Section>

      <Section title={`Garage (${p.builds.length})`}>
        {p.builds.length === 0 ? (
          <Card>
            <Txt v="muted">No builds yet.</Txt>
          </Card>
        ) : null}
        {p.builds.map((b) => (
          <Pressable
            key={b.id}
            onPress={() => router.push({ pathname: '/build/[id]', params: { id: b.id } })}
            accessibilityRole="button"
            accessibilityLabel={`${b.make} ${b.model}`}
            style={({ pressed }) => [{ gap: 8 }, pressed && { opacity: 0.85 }]}
          >
            <BuildArt kind={b.kind} colour={b.colour} height={110} />
            <Row style={{ flexWrap: 'nowrap' }} gap={12}>
              <ClassBadge letter={classOf(b)} />
              <View style={{ flex: 1 }}>
                <Txt v="h3">{b.make} {b.model}</Txt>
                <Txt v="mono">
                  {Math.round(effectivePower(b))} BHP · {b.mods.length} MODS{isModified(b) ? ' · MODIFIED' : ''}
                </Txt>
              </View>
              <Txt v="label" style={{ color: BRAND }}>Open ›</Txt>
            </Row>
          </Pressable>
        ))}
      </Section>

      <Section title={`Trophies (${p.trophies.length})`}>
        <Card>
          {p.trophies.length === 0 ? <Txt v="muted">No trophies yet.</Txt> : null}
          {p.trophies.map((a) => {
            const b = builds.find((x) => x.id === a.buildId);
            const ev = events.find((e) => e.id === a.eventId);
            return (
              <Row key={a.eventId + a.category} style={{ flexWrap: 'nowrap' }} gap={10}>
                <Trophy colour={categoryInfo(a.category).cover ? BRAND : C.fog} size={28} />
                <View style={{ flex: 1 }}>
                  <Txt>{categoryInfo(a.category).label}</Txt>
                  <Txt v="muted" numberOfLines={1}>{b?.make} {b?.model} · {ev?.title}</Txt>
                </View>
                <Txt v="mono" style={{ color: BRAND }}>+{categoryInfo(a.category).rep}</Txt>
              </Row>
            );
          })}
        </Card>
      </Section>

      <Txt v="caption" style={{ textAlign: 'center' }}>Nightshift never shows where anyone lives or where they are.</Txt>
    </ScrollView>
  );
}
