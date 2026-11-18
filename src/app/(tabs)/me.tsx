import { router, Tabs } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { BuildCard } from '../../components/BuildBits';
import { Cover } from '../../components/Cover';
import { Avatar, DsText, EmptyState, Icon, ListRow, Press, RowDivider, Section, StatBlock, Tag, metaLine } from '../../components/ds';
import { LadderSheet } from '../../components/LadderSheet';
import { NoticeBell } from '../../components/NoticeBell';
import { useRep } from '../../components/Rep';
import { statusTag } from '../../components/TonightCards';
import { allAwards, categoryInfo } from '../../lib/awards';
import { lastBrought } from '../../lib/bringing';
import { classOf } from '../../lib/classes';
import { useNow } from '../../lib/clock';
import { EVENT_LABELS, endTime, isHost, phaseOf } from '../../lib/events';
import { myEventStatus } from '../../lib/eventView';
import { SCREEN_TITLES } from '../../lib/glossary';
import { attendedEvents, levelLabel } from '../../lib/rep';
import { useStore } from '../../lib/store';
import { eventTimeLabel } from '../../lib/when';
import { ASPECT, COLOR, SPACING } from '../../theme';

const openEvent = (id: string) => router.push({ pathname: '/event/[id]', params: { id } });
const openSettings = () => router.push('/settings');

/** The gear: the same 44 pt box, 22 pt line icon and colour as the header's IconButtons. */
function SettingsButton() {
  return (
    <Press onPress={openSettings} label="Settings" style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={22} height={22} viewBox="0 0 24 24" pointerEvents="none">
        <Circle cx={12} cy={12} r={3} stroke={COLOR.text.primary} strokeWidth={2} fill="none" />
        <Path
          d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
          stroke={COLOR.text.primary}
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </Press>
  );
}

/**
 * Me's header (4.1, owner decision REVIEW-12): caps title; on the right the Settings gear in the
 * place the other tabs keep their "+", then the bell. Never a text action.
 */
const meHeaderRight = () => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs }}>
    <SettingsButton />
    <NoticeBell />
  </View>
);

/** The demo's ended meet with its results and trophies (src/data/seed.ts): always under Past, so the results are one tap from Me. */
const DEMO_RESULTS_EVENT = 'ev-past-snowdome';

/**
 * Me (Redesign 2, 3.10; T1): you, your meets and your trophies. Avatar, @handle and your level on
 * one line (tap for the ladder; owner decision, section 9) → your main build → Meets, Hosted,
 * Trophies → your meets, next then past → trophy covers → Edit profile, Settings, help, feedback.
 * Settings is also the gear in the header, so it's one tap from the top (REVIEW-12 #6).
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
  // Hosted counts the meets you host that are still to come too, so it's never "0 Hosted" while you're hosting one.
  const hosted = events.filter((e) => host(e) && phaseOf(e, now) !== 'cancelled').length;
  const results = events.find((e) => e.id === DEMO_RESULTS_EVENT && phaseOf(e, now) === 'over' && !past.some((x) => x.id === e.id));
  const pastShown = [...past.slice(0, 5), ...(results ? [results] : [])];
  const timeOf = (e: (typeof events)[number]) => eventTimeLabel(e.startsAt, endTime(e), now);

  return (
    <ScrollView contentContainerStyle={st.page} showsVerticalScrollIndicator={false}>
      <Tabs.Screen options={{ headerRight: meHeaderRight }} />
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
          <BuildCard build={main} now={now} aspect={ASPECT.event} onPress={() => router.push({ pathname: '/build/[id]', params: { id: main.id } })} />
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
        {next.length === 0 && pastShown.length === 0 ? (
          <EmptyState variant="inline" title="Nothing yet. Say you're going to a meet on Tonight." action={{ label: 'See tonight', onPress: () => router.navigate('/') }} />
        ) : null}
        {next.length ? (
          <View>
            {next.map((e, i) => {
              // K3: the one status (myEventStatus), the same tag as Tonight's card and the event page.
              const tag = statusTag(myEventStatus(e, me, crews, now)) ?? { label: 'Going', tone: 'success' as const };
              return (
                <View key={e.id}>
                  {i ? <RowDivider /> : null}
                  <ListRow
                    leading={{ pin: e.type, colour: COLOR.text.primary }}
                    title={e.title}
                    subtitle={metaLine([EVENT_LABELS[e.type], timeOf(e)])}
                    trailing={<Tag label={tag.label} tone={tag.tone} />}
                    onPress={() => openEvent(e.id)}
                  />
                </View>
              );
            })}
          </View>
        ) : null}
        {pastShown.length ? (
          <View style={{ gap: SPACING.xxs }}>
            <DsText v="label" accessibilityRole="header">
              Past
            </DsText>
            <View>
              {pastShown.map((e, i) => {
                const label = e === results ? 'Results' : host(e) ? 'Hosted' : 'Went';
                return (
                  <View key={e.id}>
                    {i ? <RowDivider /> : null}
                    <ListRow
                      leading={{ pin: e.type, colour: COLOR.text.secondary }}
                      title={e.title}
                      subtitle={metaLine([EVENT_LABELS[e.type], timeOf(e)])}
                      trailing={<Tag label={label} tone="neutral" />}
                      onPress={() => openEvent(e.id)}
                      accessibilityHint={e === results ? 'Opens the results and trophies' : undefined}
                    />
                  </View>
                );
              })}
            </View>
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
                  <ListRow leading={{ icon: 'success', colour: COLOR.text.primary }} title={categoryInfo(a.category).label} subtitle={metaLine([e?.title, e ? timeOf(e) : null])} onPress={e ? () => openEvent(e.id) : undefined} />
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
