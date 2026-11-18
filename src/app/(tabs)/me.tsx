import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Avatar, Button, DsText, EmptyState, Icon, ListRow, Press, RowDivider, Section, Tag, metaLine } from '../../components/ds';
import { LadderSheet } from '../../components/LadderSheet';
import { useRep } from '../../components/Rep';
import { allAwards, categoryInfo } from '../../lib/awards';
import { EVENT_LABELS, isHost, phaseOf } from '../../lib/events';
import { levelLabel, levelName } from '../../lib/rep';
import { formatWhen, plural } from '../../lib/format';
import { PLACE_NAMES, SCREEN_TITLES } from '../../lib/glossary';
import { useStore } from '../../lib/store';
import { useNow } from '../../lib/clock';
import { COLOR, SPACING, SPOT_COLOURS } from '../../theme';

/**
 * Me: who you are, in one screen. Profile (avatar, handle, level, crew), your events
 * (going, hosting, past), trophies and your places, then Settings, feedback and how the app works.
 * Every setting lives on the one Settings screen.
 */
export default function Me() {
  const { users, me, crews, builds, events, votes, spots } = useStore();
  const now = useNow();
  const rep = useRep(me);
  const awards = allAwards(votes, events, builds, now);
  const myAwards = awards.filter((a) => a.ownerId === me);
  const user = users.find((u) => u.id === me);
  const crew = crews.find((c) => c.id === user?.crewId);
  const mySpots = spots.filter((x) => x.authorId === me);
  const myBuilds = builds.filter((b) => b.ownerId === me);
  // Your events (REVIEW-9): hosting and going (soonest first), then the ones you went to.
  const start = (iso: string) => new Date(iso).getTime();
  const mineEvents = events.filter((e) => isHost(e, me, crews) || e.going.includes(me) || (e.checkIns[me] ?? []).length > 0);
  const upcoming = mineEvents.filter((e) => { const p = phaseOf(e, now); return p !== 'over' && p !== 'cancelled'; }).sort((a, b) => start(a.startsAt) - start(b.startsAt));
  const past = mineEvents.filter((e) => phaseOf(e, now) === 'over' && ((e.checkIns[me] ?? []).length > 0 || isHost(e, me, crews))).sort((a, b) => start(b.startsAt) - start(a.startsAt));
  const checkedInAnywhere = events.some((e) => (e.checkIns[me] ?? []).length > 0);
  const nextLevel = rep.level.level + 1;
  const [ladder, setLadder] = useState(false);
  const checkedIn = (e: (typeof events)[number]) => (e.checkIns[me] ?? []).length > 0;

  return (
    <ScrollView contentContainerStyle={st.page}>
      <View style={st.profile}>
        <Avatar name={user?.name} handle={user?.handle} size="lg" />
        <View style={{ flex: 1, gap: SPACING.xxs }}>
          <DsText v="titleLg" numberOfLines={1}>
            @{user?.handle}
          </DsText>
          {user?.name && user.name !== user.handle ? <DsText v="secondary">{user.name}</DsText> : null}
          <DsText v="meta">{plural(myBuilds.length, 'build')}</DsText>
          {/* The level opens the ladder (REVIEW-10 #15): levels, points, how to earn. */}
          <Press
            onPress={() => setLadder(true)}
            label={`${levelLabel(rep.level.level)}, ${rep.ledger.total} rep`}
            hint="Shows every level and how to earn rep"
            style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, minHeight: 44, alignSelf: 'flex-start' }}
          >
            <View style={{ gap: SPACING.xxs }}>
              <DsText v="meta" tone="action">{levelLabel(rep.level.level)}</DsText>
              <DsText v="meta">{`${rep.ledger.total.toLocaleString('en-GB')} rep · ${(rep.level.next - rep.level.rep).toLocaleString('en-GB')} to Level ${nextLevel} (${levelName(nextLevel)})`}</DsText>
            </View>
            <Icon name="chevron" size={16} colour={COLOR.action.link} />
          </Press>
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
        <Button label="Edit profile" tier="secondary" size="sm" block style={{ flex: 1 }} onPress={() => router.push('/profile')} />
        <Button label="Public view" tier="secondary" size="sm" block style={{ flex: 1 }} onPress={() => router.push({ pathname: '/user/[id]', params: { id: me } })} />
      </View>

      <Section title="Crew" right={crew ? <Button label="All crews" tier="tertiary" size="sm" onPress={() => router.push('/crews')} /> : undefined}>
        {crew ? (
          <ListRow
            title={crew.name}
            subtitle={metaLine([crew.tag, plural(crew.memberIds.length, 'member')])}
            onPress={() => router.push({ pathname: '/crew/[id]', params: { id: crew.id } })}
          />
        ) : (
          <EmptyState variant="inline" title="Not in a crew. Crews host events together." action={{ label: 'Find a crew', onPress: () => router.push('/crews') }} />
        )}
      </Section>

      <Section title="Your events" right={<Button label="Find more" tier="tertiary" size="sm" onPress={() => router.push({ pathname: '/', params: { view: 'list', t: String(Date.now()) } })} />}>
        {upcoming.length === 0 && past.length === 0 ? (
          <EmptyState variant="inline" title="Nothing yet. Say you're going to something on Tonight, or host one." />
        ) : null}
        {upcoming.map((e) => (
          <ListRow
            key={e.id}
            leading={{ pin: e.type, colour: COLOR.text.primary }}
            title={e.title}
            subtitle={metaLine([EVENT_LABELS[e.type], formatWhen(e.startsAt, now)])}
            trailing={<Tag label={isHost(e, me, crews) ? 'Hosting' : checkedIn(e) ? 'Checked in' : 'Going'} tone={isHost(e, me, crews) ? 'selected' : 'success'} />}
            onPress={() => router.push({ pathname: '/event/[id]', params: { id: e.id } })}
          />
        ))}
        {past.slice(0, 5).map((e) => (
          <ListRow
            key={e.id}
            leading={{ pin: e.type, colour: COLOR.text.secondary }}
            title={e.title}
            subtitle={metaLine([EVENT_LABELS[e.type], formatWhen(e.startsAt, now)])}
            trailing={<Tag label={isHost(e, me, crews) ? 'Hosted' : 'Went'} />}
            onPress={() => router.push({ pathname: '/event/[id]', params: { id: e.id } })}
          />
        ))}
      </Section>

      <Section title="Trophies">
        {myAwards.length === 0 ? (
          <EmptyState
            variant="inline"
            title={checkedInAnywhere ? 'None yet. People who turn up vote for the best builds once a meet starts.' : 'None yet. Check in at a meet, and people there vote for the best builds.'}
          />
        ) : (
          myAwards.map((a) => {
            const b = builds.find((x) => x.id === a.buildId);
            const e = events.find((x) => x.id === a.eventId);
            return (
              <ListRow
                key={`${a.eventId}:${a.category}`}
                leading={{ icon: 'success', colour: COLOR.text.primary }}
                title={categoryInfo(a.category).label}
                subtitle={metaLine([b ? `${b.make} ${b.model}` : null, e?.title])}
                meta={metaLine([plural(a.votes, 'vote'), formatWhen(a.at, now)])}
                onPress={e ? () => router.push({ pathname: '/event/[id]', params: { id: e.id } }) : undefined}
              />
            );
          })
        )}
      </Section>

      <Section title="Your places" right={<Button label="Suggest one" tier="tertiary" size="sm" onPress={() => router.push('/spot/new')} />}>
        {mySpots.length === 0 ? (
          <EmptyState variant="inline" title="Suggest a great road to drive or a photo spot. You earn rep when it's approved." />
        ) : (
          mySpots.map((x) => (
            <ListRow
              key={x.id}
              leading={{ pin: x.kind, colour: x.status === 'pending' ? COLOR.text.secondary : SPOT_COLOURS[x.kind] }}
              title={x.name}
              subtitle={PLACE_NAMES[x.kind].one}
              trailing={x.status === 'pending' ? <Tag label="Waiting" tone="warning" /> : <Tag label="Live" tone="success" />}
              onPress={() => router.push({ pathname: '/spot/[id]', params: { id: x.id } })}
            />
          ))
        )}
      </Section>

      <LadderSheet visible={ladder} onClose={() => setLadder(false)} level={rep.level} ledger={rep.ledger} />

      <View>
        <ListRow title={SCREEN_TITLES.settings} subtitle="Account, notifications, privacy, driving" onPress={() => router.push('/settings')} />
        <RowDivider />
        <ListRow title={SCREEN_TITLES.feedback} subtitle="A bug, an idea, or something wrong on the map" onPress={() => router.push({ pathname: '/feedback', params: { from: '/me' } })} />
        <RowDivider />
        <ListRow title={SCREEN_TITLES.help} subtitle="Meet points, check-in, classes, trophies and levels" onPress={() => router.push('/help')} />
      </View>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  page: { padding: SPACING.screen, gap: SPACING.section, paddingBottom: SPACING.xxxl },
  profile: { flexDirection: 'row', alignItems: 'center', gap: SPACING.lg },
});
