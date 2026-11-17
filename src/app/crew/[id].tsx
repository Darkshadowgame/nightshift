import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useLayoutEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { EventCard } from '../../components/EventCard';
import { LevelTag, useRepFor } from '../../components/Rep';
import { UserLink } from '../../components/UserLink';
import { Button, Card, ClassBadge, Row, Section, Txt } from '../../components/ui';
import { classOf } from '../../lib/classes';
import { crewEvents, crewHostLoss, crewless, crewRole, isCrewHost } from '../../lib/crews';
import { viewEvent } from '../../lib/eventView';
import { levelFor } from '../../lib/rep';
import { useStore } from '../../lib/store';
import { useNow } from '../../lib/clock';
import { C } from '../../theme';

/** A crew: members, the events it hosts, combined rep, join or leave. */
export default function CrewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const nav = useNavigation();
  const store = useStore();
  const { crews, users, builds, events, me } = store;
  const now = useNow();
  const crew = crews.find((c) => c.id === id);
  const repFor = useRepFor();
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [confirmJoin, setConfirmJoin] = useState(false);
  const [picking, setPicking] = useState(false);
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
  const owner = crew.ownerId === me;
  const canHost = isCrewHost(crew, me);
  const otherCrew = !member && meUser?.crewId ? crews.find((c) => c.id === meUser.crewId) : undefined;
  const combined = members.reduce((s, m) => s + m.rep.ledger.total, 0);
  const evs = crewEvents(crew, events).map((e) => viewEvent(e, me, crews, users, builds, now));
  const upcoming = evs.filter((v) => v.phase !== 'over');
  const past = evs.filter((v) => v.phase === 'over');
  // Crew events you host only through your crew role: leaving (or joining another crew) ends that.
  const losing = crewHostLoss(me, { crews, users }, events, now);
  const losingText = losing.length
    ? `You'll stop hosting ${losing.map((e) => e.title).join(', ')}: you host ${losing.length === 1 ? 'it' : 'them'} as a crew host, not a named host.`
    : null;
  const canAdd = member && canHost;
  const free = canAdd ? crewless({ crews, users }, [me]) : [];

  async function act(fn: () => void | Promise<void>) {
    setError(null);
    try {
      await fn();
      setConfirmLeave(false);
      setConfirmJoin(false);
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
        <Txt v="muted" style={{ fontSize: 12 }}>The level is for the average member. The owner and hosts run crew events; the owner picks the hosts.</Txt>
        {error ? <Txt style={{ color: C.alert }}>{error}</Txt> : null}
        {member ? (
          <Txt v="mono" style={{ color: C.neon }}>
            YOU: {owner ? 'OWNER' : canHost ? 'HOST' : 'MEMBER'}
          </Txt>
        ) : null}
        {member ? (
          confirmLeave ? (
            <View style={{ gap: 8 }}>
              {owner && crew.memberIds.length > 1 ? (
                <Txt v="muted" style={{ fontSize: 12 }}>A host (or the longest-standing member) takes over as owner.</Txt>
              ) : null}
              {losingText ? <Txt style={{ color: C.alert }}>{losingText}</Txt> : null}
              <Row style={{ flexWrap: 'nowrap' }}>
                <Button label="Leave crew" kind="danger" style={{ flex: 1 }} onPress={() => act(store.leaveCrew)} />
                <Button label="Stay" kind="ghost" onPress={() => setConfirmLeave(false)} />
              </Row>
            </View>
          ) : (
            <Button label="Member ✓  (tap to leave)" kind="ghost" onPress={() => setConfirmLeave(true)} />
          )
        ) : (
          <>
            {confirmJoin && losingText ? (
              <View style={{ gap: 8 }}>
                <Txt style={{ color: C.alert }}>{losingText}</Txt>
                <Row style={{ flexWrap: 'nowrap' }}>
                  <Button label={`Join ${crew.name}`} kind="danger" style={{ flex: 1 }} onPress={() => act(() => store.joinCrew(crew.id))} />
                  <Button label="Stay put" kind="ghost" onPress={() => setConfirmJoin(false)} />
                </Row>
              </View>
            ) : (
              <Button
                label={`Join ${crew.name}`}
                kind="neon"
                onPress={() => (losingText ? setConfirmJoin(true) : act(() => store.joinCrew(crew.id)))}
              />
            )}
            <Txt v="muted" style={{ fontSize: 12 }}>You join as a member. The owner can make you a host later.</Txt>
            {otherCrew ? <Txt v="muted" style={{ fontSize: 12 }}>You'll leave {otherCrew.name}. You can be in one crew at a time.</Txt> : null}
          </>
        )}
      </Card>

      <Section title={`Members (${members.length})`}>
        <Card>
          {members.length === 0 ? <Txt v="muted">No members yet.</Txt> : null}
          {members.map(({ user, rep }) => {
            const uid = user!.id;
            const b = builds.find((x) => x.ownerId === uid);
            const role = crewRole(crew, uid);
            return (
              <View key={uid} style={{ gap: 6 }}>
                <UserLink id={uid} label={`Open @${user!.handle}`}>
                  <Row style={{ flexWrap: 'nowrap' }} gap={10}>
                    {b ? <ClassBadge letter={classOf(b)} size="sm" /> : <View style={{ width: 22 }} />}
                    <View style={{ flex: 1 }}>
                      <Txt numberOfLines={1}>
                        {uid === me ? 'You' : `@${user!.handle}`}
                        {role !== 'member' ? <Txt v="label" style={{ color: C.neon }}>  {role === 'owner' ? 'OWNER' : 'HOST'}</Txt> : null}
                      </Txt>
                      <Txt v="muted" numberOfLines={1}>{b ? `${b.make} ${b.model}` : 'No build yet'}</Txt>
                    </View>
                    <LevelTag level={rep.level.level} />
                  </Row>
                </UserLink>
                {owner && uid !== me ? (
                  <Button
                    label={role === 'host' ? 'Remove as host' : 'Make host'}
                    kind="ghost"
                    accessibilityLabel={`${role === 'host' ? 'Remove' : 'Make'} @${user!.handle} ${role === 'host' ? 'as host' : 'a host'}`}
                    onPress={() => act(() => store.setCrewHost(crew.id, uid, role !== 'host'))}
                  />
                ) : null}
              </View>
            );
          })}
        </Card>
      </Section>

      {canAdd ? (
        <Section title="Bring people in">
          <Card>
            <Txt v="muted">
              Demo: sample people who aren't in a crew join straight away. With the backend this becomes an invite they accept.
            </Txt>
            {picking ? (
              free.length === 0 ? (
                <Txt v="muted">Everyone in the demo is in a crew already.</Txt>
              ) : (
                free.map((u) => {
                  const b = builds.find((x) => x.ownerId === u.id);
                  return (
                    <Row key={u.id} style={{ flexWrap: 'nowrap' }} gap={10}>
                      {b ? <ClassBadge letter={classOf(b)} size="sm" /> : <View style={{ width: 22 }} />}
                      <View style={{ flex: 1 }}>
                        <Txt numberOfLines={1}>@{u.handle}</Txt>
                        <Txt v="muted" numberOfLines={1}>{b ? `${b.make} ${b.model}` : 'No build yet'} · {u.region}</Txt>
                      </View>
                      <Button
                        label="Add"
                        kind="ghost"
                        accessibilityLabel={`Add @${u.handle} to ${crew.name}`}
                        onPress={() => act(() => store.addToCrew(crew.id, u.id))}
                      />
                    </Row>
                  );
                })
              )
            ) : null}
            <Button label={picking ? 'Done' : 'Invite members'} kind={picking ? 'ghost' : 'neon'} onPress={() => setPicking((x) => !x)} />
          </Card>
        </Section>
      ) : null}

      <Section title={`Crew events (${upcoming.length})`}>
        {upcoming.length === 0 ? (
          <Card>
            <Txt v="muted">Nothing coming up.{canHost ? ' Host one from the Events tab and make it a crew event.' : ''}</Txt>
          </Card>
        ) : null}
        {upcoming.map((v) => (
          <EventCard key={v.event.id} view={v} now={now} />
        ))}
        {canHost ? <Button label="Host an event" kind="ghost" onPress={() => router.push('/event/new')} /> : null}
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
