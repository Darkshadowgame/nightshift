import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { buildName, powerLine } from '../../components/BuildBits';
import { Cover } from '../../components/Cover';
import { Avatar, DsText, EmptyState, Icon, ListRow, PhotoCard, Press, RowDivider, Section, StatBlock, Tag, metaLine } from '../../components/ds';
import { LadderSheet } from '../../components/LadderSheet';
import { useRep } from '../../components/Rep';
import { allAwards, categoryInfo } from '../../lib/awards';
import { lastBrought } from '../../lib/bringing';
import { carShape } from '../../lib/buildShape';
import { classOf } from '../../lib/classes';
import { useNow } from '../../lib/clock';
import { EVENT_LABELS, isHost, phaseOf } from '../../lib/events';
import { formatWhen } from '../../lib/format';
import { SCREEN_TITLES } from '../../lib/glossary';
import { photoSource } from '../../lib/photoSource';
import { attendedEvents, hostedEvents, levelLabel } from '../../lib/rep';
import { useStore } from '../../lib/store';
import { COLOR, SPACING } from '../../theme';

const openEvent = (id: string) => router.push({ pathname: '/event/[id]', params: { id } });

/**
 * Me (Redesign 2, 3.10; T1): you, your meets and your trophies. Avatar, @handle and your level on
 * one line (tap for the ladder; owner decision, section 9) → your main build → Meets, Hosted,
 * Trophies → your meets, next then past → trophy covers → Edit profile, Settings, help, feedback.
 */
export default function Me() {
  const { users, me, crews, builds, events, votes } = useStore();
  const now = useNow();
  const rep = useRep(me);
  const [ladder, setLadder] = useState(false);
  const user = users.find((u) => u.id === me);
  const main = lastBrought(events, me, builds) ?? builds.find((b) => b.ownerId === me);
  const myAwards = allAwards(votes, events, builds, now).filter((a) => a.ownerId === me);
  const covers = myAwards.filter((a) => categoryInfo(a.category).cover);
  const otherAwards = myAwards.filter((a) => !categoryInfo(a.category).cover);
  const startMs = (iso: string) => new Date(iso).getTime();
  const checkedIn = (e: (typeof events)[number]) => (e.checkIns[me] ?? []).length > 0;
  const host = (e: (typeof events)[number]) => isHost(e, me, crews);
  const mine = events.filter((e) => host(e) || e.going.includes(me) || checkedIn(e));
  const next = mine.filter((e) => { const p = phaseOf(e, now); return p !== 'over' && p !== 'cancelled'; }).sort((a, b) => startMs(a.startsAt) - startMs(b.startsAt));
  const past = mine.filter((e) => phaseOf(e, now) === 'over' && (checkedIn(e) || host(e))).sort((a, b) => startMs(b.startsAt) - startMs(a.startsAt));
  const meets = attendedEvents(events, me, now).length;
  const hosted = hostedEvents(events, me, crews, now).length;

  return (
    <ScrollView contentContainerStyle={st.page}>
      <View style={{ gap: SPACING.md }}>
        <View style={st.profile}>
          <Avatar name={user?.name} handle={user?.handle} size="lg" />
          <View style={{ flex: 1, gap: SPACING.xxs }}>
            <DsText v="titleLg" numberOfLines={1}>
              @{user?.handle}
            </DsText>
            {/* Rep and level: one line, here only; the ladder opens on a tap (owner decision, section 9). */}
            <Press
              onPress={() => setLadder(true)}
              label={`${levelLabel(rep.level.level)}, ${rep.ledger.total} rep`}
              hint="Shows every level and how to earn rep"
              style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xxs, minHeight: 44, alignSelf: 'flex-start' }}
            >
              <DsText v="meta" tone="action">
                {levelLabel(rep.level.level)}
              </DsText>
              <Icon name="chevron" size={16} colour={COLOR.action.link} />
            </Press>
          </View>
        </View>
        {main ? (
          <PhotoCard
            kind="build"
            size="sm"
            photo={main.photos[0] ? photoSource(main.photos[0]) : null}
            paint={main.colour}
            vehicle={main.kind}
            shape={main.kind === 'car' ? carShape(main) : undefined}
            classLetter={classOf(main)}
            title={buildName(main)}
            meta={powerLine(main, now)}
            onPress={() => router.push({ pathname: '/build/[id]', params: { id: main.id } })}
            accessibilityHint="Opens the build"
          />
        ) : (
          <ListRow leading={{ icon: 'plus' }} title="Add your car or bike" onPress={() => router.push('/build/edit')} />
        )}
      </View>

      <StatBlock
        stats={[
          { value: `${meets}`, label: meets === 1 ? 'Meet' : 'Meets' },
          { value: `${hosted}`, label: 'Hosted' },
          { value: `${myAwards.length}`, label: myAwards.length === 1 ? 'Trophy' : 'Trophies' },
        ]}
      />

      <Section title="Your meets">
        {next.length === 0 && past.length === 0 ? (
          <EmptyState variant="inline" title="Nothing yet. Say you're going to a meet on Tonight." action={{ label: 'See tonight', onPress: () => router.navigate('/') }} />
        ) : null}
        {next.length || past.length ? (
        <View>
          {[...next, ...past.slice(0, 5)].map((e, i) => {
            const over = phaseOf(e, now) === 'over';
            const label = over ? (host(e) ? 'Hosted' : 'Went') : host(e) ? 'Hosting' : checkedIn(e) ? 'Checked in' : 'Going';
            return (
              <View key={e.id}>
                {i ? <RowDivider /> : null}
                <ListRow
                  leading={{ pin: e.type, colour: over ? COLOR.text.secondary : COLOR.text.primary }}
                  title={e.title}
                  subtitle={metaLine([EVENT_LABELS[e.type], formatWhen(e.startsAt, now)])}
                  trailing={<Tag label={label} tone={over ? 'neutral' : host(e) ? 'info' : 'success'} />}
                  onPress={() => openEvent(e.id)}
                />
              </View>
            );
          })}
        </View>
        ) : null}
      </Section>

      <Section title="Trophies">
        {myAwards.length === 0 ? <EmptyState variant="inline" title="None yet. Check in at a meet, and the people there vote for the best builds." /> : null}
        {covers.length ? (
          <ScrollView horizontal contentContainerStyle={{ gap: SPACING.sm }} showsHorizontalScrollIndicator={false}>
            {covers.map((a) => {
              const b = builds.find((x) => x.id === a.buildId);
              const e = events.find((x) => x.id === a.eventId);
              return b ? (
                <Press key={`${a.eventId}:${a.category}`} onPress={() => e && openEvent(e.id)} feedback="card" label={metaLine([categoryInfo(a.category).label, e?.title])}>
                  <Cover award={a} build={b} owner={user} event={e} width={150} />
                </Press>
              ) : null;
            })}
          </ScrollView>
        ) : null}
        {otherAwards.length ? (
          <View>
            {otherAwards.map((a, i) => {
              const e = events.find((x) => x.id === a.eventId);
              return (
                <View key={`${a.eventId}:${a.category}`}>
                  {i ? <RowDivider /> : null}
                  <ListRow leading={{ icon: 'success', colour: COLOR.text.primary }} title={categoryInfo(a.category).label} subtitle={metaLine([e?.title, formatWhen(a.at, now)])} onPress={e ? () => openEvent(e.id) : undefined} />
                </View>
              );
            })}
          </View>
        ) : null}
      </Section>

      <View>
        <ListRow title="Edit profile" onPress={() => router.push('/profile')} />
        <RowDivider />
        <ListRow title={SCREEN_TITLES.settings} onPress={() => router.push('/settings')} />
        <RowDivider />
        <ListRow title={SCREEN_TITLES.help} onPress={() => router.push('/help')} />
        <RowDivider />
        <ListRow title={SCREEN_TITLES.feedback} onPress={() => router.push({ pathname: '/feedback', params: { from: '/me' } })} />
      </View>

      <LadderSheet visible={ladder} onClose={() => setLadder(false)} level={rep.level} ledger={rep.ledger} />
    </ScrollView>
  );
}

const st = StyleSheet.create({
  page: { padding: SPACING.screen, gap: SPACING.section, paddingBottom: SPACING.xxxl },
  profile: { flexDirection: 'row', alignItems: 'center', gap: SPACING.lg },
});
