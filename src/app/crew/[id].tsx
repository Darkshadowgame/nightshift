import { router, useLocalSearchParams } from 'expo-router';
import { ReportLink } from '../../components/Community';
import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { EventCard } from '../../components/EventCard';
import { LevelTag, useRepFor } from '../../components/Rep';
import { UserLink } from '../../components/UserLink';
import { Button, Card, ClassBadge, ConfirmBox, EmptyState, InlineError, NotFound, Row, Section, Tag, Txt } from '../../components/ui';
import { classOf } from '../../lib/classes';
import { crewEvents, crewHostLoss, crewless, crewRole, isCrewHost } from '../../lib/crews';
import { viewEvent } from '../../lib/eventView';
import { levelFor } from '../../lib/rep';
import { useStore } from '../../lib/store';
import { useNow } from '../../lib/clock';
import { BRAND, C } from '../../theme';

/** A crew: members, the events it hosts, combined rep, join or leave. */
export default function CrewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const store = useStore();
  const { crews, users, builds, events, me } = store;
  const now = useNow();
  const crew = crews.find((c) => c.id === id);
  const repFor = useRepFor();
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [confirmJoin, setConfirmJoin] = useState(false);
  const [picking, setPicking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The header stays blank, like every detail screen: the card below carries the name and tag.
  const members = useMemo(
    () =>
      (crew?.memberIds ?? [])
        .map((uid) => ({ user: users.find((u) => u.id === uid), rep: repFor(uid) }))
        .filter((m) => m.user)
        .sort((a, b) => b.rep.ledger.total - a.rep.ledger.total),
    [crew, users, repFor],
  );

  if (!crew) return <NotFound what="Crew" message="This crew no longer exists." />;

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
  // Adding people straight in is the demo's; signed in, it needs an invite they accept (not built yet).
  const demo = store.backend === 'local';

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
      <Card accent={BRAND}>
        <Txt v="eyebrow">Crew</Txt>
        <Row>
          <Txt v="h1">{crew.name}</Txt>
          <Txt v="h2" style={{ color: C.chalk }}>[{crew.tag}]</Txt>
        </Row>
        <Row gap={16}>
          <Txt v="mono">{crew.memberIds.length} MEMBER{crew.memberIds.length === 1 ? '' : 'S'}</Txt>
          <Txt v="mono">{evs.length} EVENT{evs.length === 1 ? '' : 'S'}</Txt>
          <Txt v="mono" style={{ color: BRAND }}>{combined.toLocaleString('en-GB')} REP COMBINED</Txt>
          <LevelTag level={levelFor(members.length ? combined / members.length : 0).level} />
        </Row>
        <Txt v="caption">The level is for the average member. The owner and hosts run crew events; the owner picks the hosts.</Txt>
        {member ? <Txt v="mono" style={{ color: C.chalk }}>YOU: {owner ? 'OWNER' : canHost ? 'HOST' : 'MEMBER'}</Txt> : null}
      </Card>
      {member ? (
        confirmLeave ? (
          <ConfirmBox
            message={[
              `Leave ${crew.name}?`,
              owner && crew.memberIds.length > 1 ? 'A host (or the longest-standing member) takes over as owner.' : null,
              losingText,
            ]
              .filter(Boolean)
              .join(' ')}
            verb="Leave"
            confirmLabel="Leave crew"
            onConfirm={() => act(store.leaveCrew)}
            onCancel={() => setConfirmLeave(false)}
            error={error}
          />
        ) : (
          <>
            <Button label="Leave crew" kind="secondary" onPress={() => setConfirmLeave(true)} />
            <InlineError message={error} />
          </>
        )
      ) : confirmJoin && losingText ? (
        <ConfirmBox
          message={`${losingText}${otherCrew ? ` You'll also leave ${otherCrew.name}.` : ''}`}
          verb="Join"
          confirmLabel={`Join ${crew.name}`}
          destructive={false}
          onConfirm={() => act(() => store.joinCrew(crew.id))}
          onCancel={() => setConfirmJoin(false)}
          error={error}
        />
      ) : (
        <View style={{ gap: 8 }}>
          <Button label={`Join ${crew.name}`} onPress={() => (losingText ? setConfirmJoin(true) : act(() => store.joinCrew(crew.id)))} />
          <InlineError message={error} />
          <Txt v="caption">
            You join as a member. The owner can make you a host later.
            {otherCrew ? ` You'll leave ${otherCrew.name}: you can be in one crew at a time.` : ''}
          </Txt>
        </View>
      )}

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
                      </Txt>
                      {role !== 'member' ? <Tag label={role === 'owner' ? 'Owner' : 'Host'} tone="brand" /> : null}
                      <Txt v="muted" numberOfLines={1}>{b ? `${b.make} ${b.model}` : 'No build yet'}</Txt>
                    </View>
                    <LevelTag level={rep.level.level} />
                  </Row>
                </UserLink>
                {owner && uid !== me ? (
                  <Button
                    label={role === 'host' ? 'Remove as host' : 'Make host'}
                    kind="secondary"
                    size="sm"
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
              {demo
                ? 'Demo: sample people who aren’t in a crew join straight away. Signed in, this becomes an invite they accept.'
                : 'Coming soon: invites people accept. For now, people join from this page themselves.'}
            </Txt>
            {demo && picking ? (
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
                        kind="secondary"
                        size="sm"
                        accessibilityLabel={`Add @${u.handle} to ${crew.name}`}
                        onPress={() => act(() => store.addToCrew(crew.id, u.id))}
                      />
                    </Row>
                  );
                })
              )
            ) : null}
            {demo ? (
              <Button label={picking ? 'Done' : 'Invite members'} kind="secondary" onPress={() => setPicking((x) => !x)} />
            ) : (
              <Button label="Invite members · coming soon" kind="secondary" disabled onPress={() => undefined} />
            )}
          </Card>
        </Section>
      ) : null}

      <Section title={`Crew events (${upcoming.length})`}>
        {upcoming.length === 0 ? (
          <EmptyState
            title="Nothing coming up"
            body={canHost ? 'Host one and make it a crew event.' : 'Crew events show here when the owner or a host posts one.'}
            {...(canHost ? { action: { label: 'Host an event', onPress: () => router.push('/event/new') } } : {})}
          />
        ) : null}
        {upcoming.map((v) => (
          <EventCard key={v.event.id} view={v} now={now} />
        ))}
        {canHost && upcoming.length ? <Button label="Host an event" kind="secondary" onPress={() => router.push('/event/new')} /> : null}
      </Section>

      {past.length > 0 ? (
        <Section title={`Past (${past.length})`}>
          {past.map((v) => (
            <EventCard key={v.event.id} view={v} now={now} />
          ))}
        </Section>
      ) : null}
      {!member ? <ReportLink target="crew" id={crew.id} what="crew" /> : null}
    </ScrollView>
  );
}
