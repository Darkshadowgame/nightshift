import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useLayoutEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { EventCard } from '../../components/EventCard';
import { LevelTag, useRepFor } from '../../components/Rep';
import { UserLink } from '../../components/UserLink';
import { Button, Card, ClassBadge, Row, Section, Txt } from '../../components/ui';
import { classOf } from '../../lib/classes';
import { crewEvents } from '../../lib/crews';
import { viewEvent } from '../../lib/eventView';
import { levelFor } from '../../lib/rep';
import { useStore } from '../../lib/store';
import { C } from '../../theme';

/** A crew: members, the events it hosts, combined rep, join or leave. */
export default function CrewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const nav = useNavigation();
  const store = useStore();
  const { crews, users, builds, events, me, now } = store;
  const crew = crews.find((c) => c.id === id);
  const repFor = useRepFor();
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useLayoutEffect(() => {
    nav.setOptions({ title: crew ? `[${crew.tag}]` : '' });
  }, [nav, crew]);

  const members = useMemo(
    () =>
      (crew?.memberIds ?? [])
        .map((uid) => ({ user: users.find((u) => u.id === uid), rep: repFor(uid) }))
        .filter((m) => m.user)
        .sort((a, b) => b.rep.ledger.total - a.rep.ledger.total),
    [crew, users, repFor],
  );

  if (!crew) {
    return (
      <View style={{ flex: 1, padding: 16 }}>
        <Txt>This crew no longer exists.</Txt>
      </View>
    );
  }

  const meUser = users.find((u) => u.id === me);
  const member = crew.memberIds.includes(me);
  const otherCrew = !member && meUser?.crewId ? crews.find((c) => c.id === meUser.crewId) : undefined;
  const combined = members.reduce((s, m) => s + m.rep.ledger.total, 0);
  const evs = crewEvents(crew, events).map((e) => viewEvent(e, me, crews, users, builds, now));
  const upcoming = evs.filter((v) => v.phase !== 'over');
  const past = evs.filter((v) => v.phase === 'over');

  function act(fn: () => void) {
    setError(null);
    try {
      fn();
      setConfirmLeave(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'That did not work.');
    }
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 20, paddingBottom: 48 }}>
      <Card accent={C.neon}>
        <Txt v="eyebrow" style={{ color: C.neon }}>Crew</Txt>
        <Row>
          <Txt v="h1">{crew.name}</Txt>
          <Txt v="h2" style={{ color: C.neon }}>[{crew.tag}]</Txt>
        </Row>
        <Row gap={16}>
          <Txt v="mono">{crew.memberIds.length} MEMBER{crew.memberIds.length === 1 ? '' : 'S'}</Txt>
          <Txt v="mono">{evs.length} EVENT{evs.length === 1 ? '' : 'S'}</Txt>
          <Txt v="mono" style={{ color: C.sodium }}>{combined.toLocaleString('en-GB')} REP COMBINED</Txt>
          <LevelTag level={levelFor(members.length ? combined / members.length : 0).level} />
        </Row>
        <Txt v="muted" style={{ fontSize: 12 }}>The level is for the average member. Any member can host and run crew events.</Txt>
        {error ? <Txt style={{ color: C.alert }}>{error}</Txt> : null}
        {member ? (
          confirmLeave ? (
            <Row style={{ flexWrap: 'nowrap' }}>
              <Button label="Leave crew" kind="danger" style={{ flex: 1 }} onPress={() => act(store.leaveCrew)} />
              <Button label="Stay" kind="ghost" onPress={() => setConfirmLeave(false)} />
            </Row>
          ) : (
            <Button label="Member ✓  (tap to leave)" kind="ghost" onPress={() => setConfirmLeave(true)} />
          )
        ) : (
          <>
            <Button label={`Join ${crew.name}`} kind="neon" onPress={() => act(() => store.joinCrew(crew.id))} />
            {otherCrew ? <Txt v="muted" style={{ fontSize: 12 }}>You'll leave {otherCrew.name}. You can be in one crew at a time.</Txt> : null}
          </>
        )}
      </Card>

      <Section title={`Members (${members.length})`}>
        <Card>
          {members.length === 0 ? <Txt v="muted">No members yet.</Txt> : null}
          {members.map(({ user, rep }) => {
            const b = builds.find((x) => x.ownerId === user!.id);
            return (
              <UserLink key={user!.id} id={user!.id} label={`Open @${user!.handle}`}>
                <Row style={{ flexWrap: 'nowrap' }} gap={10}>
                  {b ? <ClassBadge letter={classOf(b)} size="sm" /> : <View style={{ width: 22 }} />}
                  <View style={{ flex: 1 }}>
                    <Txt numberOfLines={1}>{user!.id === me ? 'You' : `@${user!.handle}`}</Txt>
                    <Txt v="muted" numberOfLines={1}>{b ? `${b.make} ${b.model}` : 'No build yet'}</Txt>
                  </View>
                  <LevelTag level={rep.level.level} />
                </Row>
              </UserLink>
            );
          })}
        </Card>
      </Section>

      <Section title={`Crew events (${upcoming.length})`}>
        {upcoming.length === 0 ? (
          <Card>
            <Txt v="muted">Nothing coming up.{member ? ' Host one from the Events tab and pick the crew as host.' : ''}</Txt>
          </Card>
        ) : null}
        {upcoming.map((v) => (
          <EventCard key={v.event.id} view={v} now={now} />
        ))}
        {member ? <Button label="Host an event" kind="ghost" onPress={() => router.push('/event/new')} /> : null}
      </Section>

      {past.length > 0 ? (
        <Section title={`Past (${past.length})`}>
          {past.map((v) => (
            <EventCard key={v.event.id} view={v} now={now} />
          ))}
        </Section>
      ) : null}
    </ScrollView>
  );
}
