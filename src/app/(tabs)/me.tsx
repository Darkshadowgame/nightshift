import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Avatar, Button, DsText, EmptyState, ListRow, RowDivider, Section, Tag, metaLine } from '../../components/ds';
import { useRep } from '../../components/Rep';
import { allAwards, categoryInfo, hasLegend } from '../../lib/awards';
import { formatWhen, plural } from '../../lib/format';
import { PLACE_NAMES, SCREEN_TITLES } from '../../lib/glossary';
import { useStore } from '../../lib/store';
import { useNow } from '../../lib/clock';
import { COLOR, SPACING, SPOT_COLOURS } from '../../theme';

/**
 * Me: who you are, in one screen. Profile (avatar, handle, level, crew),
 * trophies and your places, then Settings, feedback and how the app works.
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

  return (
    <ScrollView contentContainerStyle={st.page}>
      <View style={st.profile}>
        <Avatar name={user?.name} handle={user?.handle} size="lg" />
        <View style={{ flex: 1, gap: SPACING.xxs }}>
          <DsText v="titleLg" numberOfLines={1}>
            @{user?.handle}
          </DsText>
          {user?.name && user.name !== user.handle ? <DsText v="secondary">{user.name}</DsText> : null}
          {/* The level as a plain fact: not an action, so not sodium (DESIGN-SYSTEM rule 11). */}
          <DsText v="meta">{metaLine([`Level ${rep.level.level}`, `${rep.ledger.total.toLocaleString('en-GB')} rep`, plural(myBuilds.length, 'build')])}</DsText>
          {hasLegend(awards, me, now) ? <Tag label="Legend this week" tone="selected" /> : null}
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

      <Section title="Trophies">
        {myAwards.length === 0 ? (
          <EmptyState variant="inline" title="None yet. Check in at a meet, and people there vote for the best builds." />
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

      <View>
        <ListRow title={SCREEN_TITLES.settings} subtitle="Account, navigation, notifications, privacy" onPress={() => router.push('/settings')} />
        <RowDivider />
        <ListRow title={SCREEN_TITLES.feedback} subtitle="A bug, an idea, or something wrong on the map" onPress={() => router.push({ pathname: '/feedback', params: { from: '/me' } })} />
        <RowDivider />
        <ListRow title={SCREEN_TITLES.help} subtitle="Meet points, check-in, classes, trophies and rep" onPress={() => router.push('/help')} />
      </View>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  page: { padding: SPACING.screen, gap: SPACING.section, paddingBottom: SPACING.xxxl },
  profile: { flexDirection: 'row', alignItems: 'center', gap: SPACING.lg },
});
