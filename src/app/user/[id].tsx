import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useLayoutEffect, useMemo } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { BuildArt } from '../../components/BuildArt';
import { Trophy } from '../../components/Cover';
import { LevelTag, useRep } from '../../components/Rep';
import { Card, ClassBadge, Row, Section, Txt } from '../../components/ui';
import { allAwards, categoryInfo } from '../../lib/awards';
import { classOf, effectivePower, isModified } from '../../lib/classes';
import { publicProfile } from '../../lib/people';
import { useStore } from '../../lib/store';
import { C } from '../../theme';

/** Someone's public profile: builds, trophies, crew. Never any location. */
export default function UserScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const nav = useNavigation();
  const { users, builds, crews, events, votes, me, now } = useStore();
  const awards = useMemo(() => allAwards(votes, events, builds, now), [votes, events, builds, now]);
  const p = publicProfile(id, users, builds, crews, events, awards, now);
  const handle = p?.handle;
  const rep = useRep(id);

  useLayoutEffect(() => {
    nav.setOptions({ title: handle ? `@${handle}` : '' });
  }, [nav, handle]);

  if (!p) {
    return (
      <View style={{ flex: 1, padding: 16 }}>
        <Txt>This person isn't on Nightshift any more.</Txt>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 20, paddingBottom: 40 }}>
      <Card>
        <Row>
          <Txt v="h1" style={{ textTransform: 'none' }}>@{p.handle}</Txt>
          <LevelTag level={rep.level.level} size="lg" />
          {p.legend ? <Txt v="eyebrow" style={{ color: C.lime }}>★ Legend this week</Txt> : null}
        </Row>
        <Txt>{p.name}{p.id === me ? ' (you)' : ''}</Txt>
        <Txt v="muted">{p.region}</Txt>
        <Row gap={16}>
          <Txt v="mono">{p.builds.length} BUILDS</Txt>
          <Txt v="mono">{p.meetsAttended} MEETS</Txt>
          <Txt v="mono">{p.hosted} HOSTED</Txt>
          <Txt v="mono">{p.trophies.length} TROPHIES</Txt>
          <Txt v="mono" style={{ color: C.sodium }}>{rep.ledger.total.toLocaleString('en-GB')} REP</Txt>
        </Row>
      </Card>

      <Section title="Crew">
        {p.crew ? (
          <Pressable
            onPress={() => router.push({ pathname: '/crew/[id]', params: { id: p.crew!.id } })}
            accessibilityRole="button"
            accessibilityLabel={`Open ${p.crew.name}`}
            style={({ pressed }) => [pressed && { opacity: 0.8 }]}
          >
            <Card accent={C.neon}>
              <Row style={{ justifyContent: 'space-between' }}>
                <Row>
                  <Txt v="h3">{p.crew.name}</Txt>
                  <Txt v="mono" style={{ color: C.neon }}>[{p.crew.tag}]</Txt>
                </Row>
                <Txt v="label" style={{ color: C.sodium }}>Open ›</Txt>
              </Row>
              <Txt v="muted">{p.crew.memberIds.length} members</Txt>
            </Card>
          </Pressable>
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
              <Txt v="label" style={{ color: C.sodium }}>View ›</Txt>
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
                <Trophy colour={categoryInfo(a.category).cover ? C.sodium : C.fog} size={28} />
                <View style={{ flex: 1 }}>
                  <Txt>{categoryInfo(a.category).label}</Txt>
                  <Txt v="muted" numberOfLines={1}>{b?.make} {b?.model} · {ev?.title}</Txt>
                </View>
                <Txt v="mono" style={{ color: C.sodium }}>+{categoryInfo(a.category).rep}</Txt>
              </Row>
            );
          })}
        </Card>
      </Section>

      <Txt v="muted" style={{ fontSize: 12, textAlign: 'center' }}>Nightshift never shows where anyone lives or where they are.</Txt>
    </ScrollView>
  );
}
