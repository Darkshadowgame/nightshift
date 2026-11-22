import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { openReport } from '../../components/Community';
import { bhpLine } from '../../components/BringPicker';
import { CrewEmblem } from '../../components/CrewEmblem';
import { NotFoundState } from '../../components/Detail';
import {
  ActionBar,
  Button,
  ConfirmSheet,
  displayHandle,
  DsText,
  EmptyState,
  ErrorState,
  Hero,
  ListRow,
  metaLine,
  PAGE_WITH_BAR,
  RowDivider,
  screenHeader,
  Press,
  Section,
  Sheet,
  SheetOption,
  StatBlock,
  Tag,
} from '../../components/ds';
import { idsWithoutBlocked } from '../../lib/blocking';
import { classOf } from '../../lib/classes';
import { useCommunity } from '../../lib/communityStore';
import { EMBLEMS, emblemLabel, emblemOf } from '../../lib/crewEmblems';
import { crewMeets, crewVehicles } from '../../lib/crewPage';
import { useNow } from '../../lib/clock';
import { crewEvents, crewHostLoss, crewless, crewRole, isCrewHost } from '../../lib/crews';
import { EVENT_LABELS } from '../../lib/events';
import { viewEvent, type EventView } from '../../lib/eventView';
import { formatWhen } from '../../lib/format';
import { useStore } from '../../lib/store';
import { COLOR, EVENT_COLOURS, RADII, SPACING } from '../../theme';

/** A crew: the same anatomy as an event or place. Hero, stats, one primary, then members and events. */
export default function CrewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const store = useStore();
  const { crews, users, builds, events, me } = store;
  const now = useNow();
  const { blocked } = useCommunity();
  const crew = crews.find((c) => c.id === id);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [confirmJoin, setConfirmJoin] = useState(false);
  const [picking, setPicking] = useState(false);
  const [menu, setMenu] = useState(false);
  const [emblemSheet, setEmblemSheet] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const members = useMemo(
    () =>
      // Someone you blocked is not on the crew's page.
      idsWithoutBlocked(crew?.memberIds ?? [], blocked)
        .map((uid) => ({ user: users.find((u) => u.id === uid) }))
        .filter((m) => m.user),
    [crew, users, blocked],
  );

  if (!crew) return <NotFoundState what="Crew" message="This crew no longer exists." />;

  const meUser = users.find((u) => u.id === me);
  const member = crew.memberIds.includes(me);
  const owner = crew.ownerId === me;
  const canHost = isCrewHost(crew, me);
  const otherCrew = !member && meUser?.crewId ? crews.find((c) => c.id === meUser.crewId) : undefined;
  const evs = crewEvents(crew, events).map((e) => viewEvent(e, me, crews, users, builds, now));
  const upcoming = evs.filter((v) => v.phase !== 'over');
  const past = evs.filter((v) => v.phase === 'over');
  // Crew events you host only through your crew role: leaving (or joining another crew) ends that.
  const losing = crewHostLoss(me, { crews, users }, events, now);
  const losingText = losing.length
    ? `You'll no longer host ${losing.map((e) => e.title).join(', ')}: you host ${losing.length === 1 ? 'it' : 'them'} as a crew host, not a named host.`
    : null;
  const canAdd = member && canHost;
  const free = canAdd ? crewless({ crews, users }, [me, ...blocked]) : [];
  const vehicles = crewVehicles(crew, users, builds, blocked);
  const goingMeets = crewMeets(crew, events, now, blocked);
  // Adding people straight in is the demo's; signed in, it needs an invite they accept (not built yet).
  const demo = store.backend === 'local';
  const yourRole = owner ? 'Owner' : canHost ? 'Host' : 'Member';

  async function act(fn: () => void | Promise<void>) {
    setError(null);
    try {
      await fn();
      setConfirmLeave(false);
      setConfirmJoin(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't do that.");
    }
  }

  const buildOf = (uid: string) => builds.find((x) => x.ownerId === uid);
  const handle = (uid: string) => (uid === me ? 'You' : displayHandle(users.find((u) => u.id === uid)?.handle ?? uid));

  return (
    <View style={{ flex: 1, backgroundColor: COLOR.surface.bg }}>
    <ScrollView contentContainerStyle={PAGE_WITH_BAR} showsVerticalScrollIndicator={false}>
      <Stack.Screen options={screenHeader({ onMenu: () => setMenu(true) })} />
      <Hero
        leading={<CrewEmblem emblem={emblemOf(crew)} size={56} />}
        eyebrow={`Crew · ${crew.tag}`}
        tag={member ? { label: yourRole, tone: 'success' } : null}
        title={crew.name}
        meta={`${crew.ownerId && !blocked.has(crew.ownerId) ? `Owner ${handle(crew.ownerId)}` : 'Owner hidden'}${idsWithoutBlocked(crew.hostIds ?? [], blocked).length ? ` · hosts ${idsWithoutBlocked(crew.hostIds ?? [], blocked).map(handle).join(', ')}` : ''}`}
      />

      <StatBlock
        stats={[
          { label: 'Members', value: String(members.length) },
          { label: 'Events', value: String(evs.length) },
        ]}
      />

      {!member ? (
        <View style={{ gap: SPACING.sm }}>
          {error ? <ErrorState title={error} /> : null}
          <DsText v="caption">
            You join as a member. The owner can make you a host later.
            {otherCrew ? ` You'll leave ${otherCrew.name}: you can be in one crew at a time.` : ''}
          </DsText>
        </View>
      ) : null}

      <Section title={`Members (${members.length})`}>
        {members.length === 0 ? <EmptyState variant="inline" title="No members yet." /> : null}
        <View>
          {members.map(({ user }, i) => {
            const uid = user!.id;
            const b = buildOf(uid);
            const role = crewRole(crew, uid);
            return (
              <View key={uid}>
                {i > 0 ? <RowDivider inset /> : null}
                <ListRow
                  leading={{ avatar: { name: user!.name, handle: user!.handle } }}
                  title={handle(uid)}
                  subtitle={b ? `${b.make} ${b.model} · Class\u00a0${classOf(b)}` : 'No car or bike yet'}
                  trailing={role !== 'member' ? <Tag label={role === 'owner' ? 'Owner' : 'Host'} /> : undefined}
                  onPress={() => router.push({ pathname: '/user/[id]', params: { id: uid } })}
                />
              </View>
            );
          })}
        </View>
      </Section>

      {owner && members.length > 1 ? (
        <Section title="Crew hosts">
          <DsText v="secondary">Hosts can host, move on and edit crew events.</DsText>
          <View>
            {members
              .filter((m) => m.user!.id !== me)
              .map(({ user }, i) => {
                const uid = user!.id;
                const host = crewRole(crew, uid) === 'host';
                return (
                  <View key={uid}>
                    {i > 0 ? <RowDivider inset /> : null}
                    <ListRow
                      leading={{ avatar: { name: user!.name, handle: user!.handle } }}
                      title={handle(uid)}
                      subtitle={host ? 'Host' : 'Member'}
                      trailing={
                        <Button
                          label={host ? 'Remove' : 'Make host'}
                          tier={host ? 'destructive' : 'secondary'}
                          size="sm"
                          accessibilityLabel={`${host ? 'Remove' : 'Make'} ${handle(uid)} ${host ? 'as host' : 'a host'}`}
                          onPress={() => act(() => store.setCrewHost(crew.id, uid, !host))}
                        />
                      }
                    />
                  </View>
                );
              })}
          </View>
        </Section>
      ) : null}

      {canAdd ? (
        <Section title="Bring people in">
          <DsText v="secondary">
            {demo ? 'Demo: sample people who aren’t in a crew join straight away. Signed in, this becomes an invite they accept.' : 'Coming soon: invites people accept. For now, people join from this page themselves.'}
          </DsText>
          {demo && picking ? (
            free.length === 0 ? (
              <EmptyState variant="inline" title="Everyone in the demo is in a crew already." />
            ) : (
              <View>
                {free.map((u, i) => {
                  const b = buildOf(u.id);
                  return (
                    <View key={u.id}>
                      {i > 0 ? <RowDivider inset /> : null}
                      <ListRow
                        leading={{ avatar: { name: u.name, handle: u.handle } }}
                        title={displayHandle(u.handle)}
                        subtitle={`${b ? `${b.make} ${b.model}` : 'No car or bike yet'} · ${u.region}`}
                        trailing={<Button label="Add" tier="secondary" size="sm" accessibilityLabel={`Add ${displayHandle(u.handle)} to ${crew.name}`} onPress={() => act(() => store.addToCrew(crew.id, u.id))} />}
                      />
                    </View>
                  );
                })}
              </View>
            )
          ) : null}
          {demo ? <Button label={picking ? 'Done' : 'Invite members'} tier="secondary" block onPress={() => setPicking((x) => !x)} /> : null}
        </Section>
      ) : null}

      {vehicles.length > 0 ? (
        <Section title={`Vehicles (${vehicles.length})`}>
          <View>
            {vehicles.slice(0, 6).map(({ build: b, owner }, i) => (
              <View key={b.id}>
                {i > 0 ? <RowDivider inset /> : null}
                <ListRow
                  leading={{ classBadge: classOf(b) }}
                  title={`${b.make} ${b.model}`}
                  subtitle={metaLine([handle(owner.id), bhpLine(b)])}
                  onPress={() => router.push({ pathname: '/build/[id]', params: { id: b.id } })}
                />
              </View>
            ))}
          </View>
          {vehicles.length > 6 ? <DsText v="caption">{`and ${vehicles.length - 6} more`}</DsText> : null}
        </Section>
      ) : null}

      {goingMeets.length > 0 ? (
        <Section title="The crew is going to">
          <View>
            {goingMeets.map(({ event: e, crewGoing }, i) => (
              <View key={e.id}>
                {i > 0 ? <RowDivider inset /> : null}
                <ListRow
                  leading={{ pin: e.type, colour: EVENT_COLOURS[e.type] }}
                  title={e.title}
                  subtitle={metaLine([formatWhen(e.startsAt, now), `${crewGoing} from the crew`])}
                  onPress={() => router.push({ pathname: '/event/[id]', params: { id: e.id } })}
                />
              </View>
            ))}
          </View>
        </Section>
      ) : null}

      <Section title={`Crew events (${upcoming.length})`}>
        {upcoming.length === 0 ? (
          <EmptyState
            variant="inline"
            title={canHost ? 'Nothing coming up. Host one and make it a crew event.' : 'Nothing coming up. Crew events show here when the owner or a host posts one.'}
          />
        ) : null}
        {upcoming.map((v) => (
          <EventEntity key={v.event.id} view={v} now={now} />
        ))}
      </Section>

      {past.length > 0 ? (
        <Section title={`Past (${past.length})`}>
          {past.map((v) => (
            <EventEntity key={v.event.id} view={v} now={now} />
          ))}
        </Section>
      ) : null}

      <Sheet visible={menu} title="Crew options" onClose={() => setMenu(false)}>
        <View>
          {owner ? (
            <SheetOption
              label="Change emblem"
              onPress={() => {
                setMenu(false);
                setEmblemSheet(true);
              }}
            />
          ) : null}
          {member ? (
            <SheetOption
              label="Leave crew"
              destructive
              onPress={() => {
                setMenu(false);
                setConfirmLeave(true);
              }}
            />
          ) : (
            <SheetOption
              label="Report this crew"
              onPress={() => {
                setMenu(false);
                openReport('crew', crew.id, undefined, 'crew');
              }}
            />
          )}
        </View>
      </Sheet>
      <Sheet visible={emblemSheet} title="Crew emblem" onClose={() => setEmblemSheet(false)}>
        <DsText v="secondary">Pick one. Everyone in the crew sees it on the crew's page.</DsText>
        {error ? <ErrorState title={error} /> : null}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm }}>
          {EMBLEMS.map((key) => (
            <Press
              key={key}
              onPress={() => act(async () => {
                await store.setCrewEmblem(crew.id, key);
                setEmblemSheet(false);
              })}
              role="button"
              state={{ selected: emblemOf(crew) === key }}
              label={emblemLabel(key)}
              style={{ padding: 3, borderRadius: RADII.card + 3, borderWidth: 2, borderColor: emblemOf(crew) === key ? COLOR.text.primary : 'transparent' }}
            >
              <CrewEmblem emblem={key} size={44} />
            </Press>
          ))}
        </View>
      </Sheet>
      <ConfirmSheet
        visible={confirmLeave}
        title="Leave crew"
        message={[`Leave ${crew.name}?`, owner && crew.memberIds.length > 1 ? 'A host (or the longest-standing member) takes over as owner.' : null, losingText, error].filter(Boolean).join(' ')}
        verb="Leave"
        onConfirm={() => act(store.leaveCrew)}
        onCancel={() => setConfirmLeave(false)}
      />
      <ConfirmSheet
        visible={confirmJoin}
        title={`Join ${crew.name}`}
        message={[losingText, otherCrew ? `You'll leave ${otherCrew.name}: you can be in one crew at a time.` : null, error].filter(Boolean).join(' ')}
        verb="Join"
        destructive={false}
        onConfirm={() => act(() => store.joinCrew(crew.id))}
        onCancel={() => setConfirmJoin(false)}
      />
    </ScrollView>
    <ActionBar
      primary={
        member
          ? canHost
            ? { label: 'Host a crew event', onPress: () => router.push('/event/new') }
            : null
          : { label: `Join ${crew.name}`, haptic: 'success', onPress: () => (losingText || otherCrew ? setConfirmJoin(true) : act(() => store.joinCrew(crew.id))) }
      }
    />
    </View>
  );
}

/** A crew event as a row: pin, title, when, going. */
function EventEntity({ view, now }: { view: EventView; now: Date }) {
  const e = view.event;
  const over = view.phase === 'over' || view.phase === 'cancelled';
  return (
    <ListRow
      leading={{ pin: e.type, colour: over ? COLOR.text.secondary : EVENT_COLOURS[e.type] }}
      title={e.title}
      subtitle={metaLine([EVENT_LABELS[e.type], formatWhen(e.startsAt, now), `${e.going.length} going`])}
      trailing={view.phase === 'live' ? <Tag label="Live" tone="live" /> : undefined}
      onPress={() => router.push({ pathname: '/event/[id]', params: { id: e.id } })}
    />
  );
}
