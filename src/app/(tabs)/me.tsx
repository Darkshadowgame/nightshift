import { router, Tabs } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { BuildCard } from '../../components/BuildBits';
import { AvatarSheet } from '../../components/AvatarSheet';
import { Cover } from '../../components/Cover';
import { Avatar, DsText, EmptyState, Icon, ListRow, Press, RowDivider, Section, StatBlock, metaLine } from '../../components/ds';
import { LadderSheet } from '../../components/LadderSheet';
import { NoticeBell } from '../../components/NoticeBell';
import { useRep } from '../../components/Rep';
import { useVisits } from '../../lib/useVisits';
import { EventRow } from '../../components/EventRow';
import { allAwards, categoryInfo, votingCloses } from '../../lib/awards';
import { lastBrought } from '../../lib/bringing';
import { plural } from '../../lib/format';
import { classOf } from '../../lib/classes';
import { useNow } from '../../lib/clock';
import { endTime, isHost, phaseOf } from '../../lib/events';
import { viewEvent } from '../../lib/eventView';
import { useDistanceOrigin } from '../../lib/useDistanceOrigin';
import { aroundArea, SCREEN_TITLES } from '../../lib/glossary';
import { levelLabel } from '../../lib/rep';
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
 * Trophies (Meets counts the rows below) → Coming up, then Past meets → trophy covers → Edit profile, help, feedback.
 * Settings is the gear in the header only (REVIEW-12 #6; said once, C5).
 */
export default function Me() {
  const store = useStore();
  const { users, me, crews, builds, events, votes } = store;
  const now = useNow();
  const rep = useRep(me);
  const [ladder, setLadder] = useState(false);
  const [picker, setPicker] = useState(false);
  const year = useVisits();
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
  const liveNow = next.filter((e) => phaseOf(e, now) === 'live');
  const comingUp = next.filter((e) => phaseOf(e, now) !== 'live');
  const past = mine.filter((e) => phaseOf(e, now) === 'over' && (checkedIn(e) || host(e))).sort((a, b) => startMs(b.startsAt) - startMs(a.startsAt));
  // Meets counts exactly the rows under Coming up and Past meets (Review 19 #47): the ones you're going to or
  // hosting, and the ones you went to or hosted. Hosted is the part of them you host.
  const meets = next.length + past.length;
  // Hosted counts the meets you host that are still to come too, so it's never "0 Hosted" while you're hosting one.
  const hosted = events.filter((e) => host(e) && phaseOf(e, now) !== 'cancelled').length;
  const results = events.find((e) => e.id === DEMO_RESULTS_EVENT && phaseOf(e, now) === 'over' && !past.some((x) => x.id === e.id));
  const pastShown = [...past.slice(0, 5), ...(results ? [results] : [])];
  const atMeets = events.filter((e) => checkedIn(e) && !e.cancelled);
  const decided = atMeets.some((e) => now >= votingCloses(e) || (store.backend === 'local' && votes.some((v) => v.eventId === e.id && v.voterId === me)));
  const trophyHint = decided
    ? "Not this time. Trophies go to the builds the people at a meet vote for."
    : atMeets.length
      ? 'Winners show here when the voting at your meets ends.'
      : 'Check in at a meet, and the people there vote for the best builds.';
  const timeOf = (e: (typeof events)[number]) => eventTimeLabel(e.startsAt, endTime(e), now);
  const view = (e: (typeof events)[number]) => viewEvent(e, me, crews, users, builds, now);
  // The one distance origin, the same as Tonight and Search (useDistanceOrigin, Review 18).
  const origin = useDistanceOrigin();
  // Two of your meets with the same name (one you host, one you're going to) also say where, so
  // they never look the same (Review 19 #49): the meet point when you can see it, else "Around Tamworth".
  const listed = [...next, ...pastShown];
  const placeIfTwin = (e: (typeof events)[number]) => {
    if (!listed.some((x) => x.id !== e.id && x.title.trim().toLowerCase() === e.title.trim().toLowerCase())) return null;
    const v = view(e);
    return v.shownStop >= 0 ? e.stops[v.shownStop]?.name || e.areaName : aroundArea(e.areaName);
  };

  return (
    <ScrollView contentContainerStyle={st.page} showsVerticalScrollIndicator={false}>
      <Tabs.Screen options={{ headerRight: meHeaderRight }} />
      <View style={{ gap: SPACING.md }}>
        <View style={st.profile}>
          {/* Your picture: your main vehicle by default; tap to choose a photo from your library or one of your vehicle photos. */}
          <Press onPress={() => setPicker(true)} label="Profile photo" hint="Choose a profile photo" style={{ width: 76, height: 76, borderRadius: 38 }}>
            <Avatar name={user?.name} handle={user?.handle} size="lg" />
          </Press>
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

      {/* The quiet streak (level-up): a plain line, nothing when there is none, never a notification. */}
      {year.streak ? <DsText v="secondary">{year.streak}</DsText> : null}

      {/* A meet that's on now isn't "coming up" (Review 21 gap 15): it has its own Now section first, as on Tonight. */}
      {liveNow.length ? (
        <Section title="Now">
          <View>
            {liveNow.map((e, i) => (
              <View key={e.id}>
                {i ? <RowDivider /> : null}
                <EventRow view={view(e)} now={now} origin={origin} place={placeIfTwin(e)} onPress={() => openEvent(e.id)} />
              </View>
            ))}
          </View>
        </Section>
      ) : null}

      {comingUp.length || !liveNow.length ? (
      <Section title="Coming up">
        {comingUp.length === 0 ? (
          <EmptyState
            variant="inline"
            title={pastShown.length ? "Nothing coming up. Say you're going to a meet on Tonight." : "Nothing yet. Say you're going to a meet on Tonight."}
            action={{ label: 'See tonight', onPress: () => router.navigate('/') }}
          />
        ) : null}
        {comingUp.length ? (
          <View>
            {comingUp.map((e, i) => (
              // K3: the one event row (Tonight's list and Search), with the one status tag.
              <View key={e.id}>
                {i ? <RowDivider /> : null}
                <EventRow view={view(e)} now={now} origin={origin} place={placeIfTwin(e)} onPress={() => openEvent(e.id)} />
              </View>
            ))}
          </View>
        ) : null}
      </Section>
      ) : null}

      {pastShown.length ? (
        // The same section header as Coming up, rule line and all (Review 19 #48).
        <Section title="Past meets">
          <View>
            {pastShown.map((e, i) => {
              const label = e === results ? 'Results' : host(e) ? 'Hosted' : 'Went';
              return (
                <View key={e.id}>
                  {i ? <RowDivider /> : null}
                  <EventRow
                    view={view(e)}
                    now={now}
                    origin={origin}
                    place={placeIfTwin(e)}
                    tag={{ label, tone: 'neutral' }}
                    onPress={() => openEvent(e.id)}
                    accessibilityHint={e === results ? 'Opens the results and trophies' : undefined}
                  />
                </View>
              );
            })}
          </View>
        </Section>
      ) : null}

      <Section title="Trophies">
        {myAwards.length === 0 ? (
          <EmptyState
            variant="inline"
            // Said for where you are (Reviews 14 and 15): before a check-in, how trophies work; after one,
            // when they come; once a meet you were at has its results (on the demo night, once you've
            // voted), that this time it wasn't you.
            title={trophyHint}
          />
        ) : null}
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

      <Section title="Your year">
        <View>
          <ListRow leading={{ icon: 'pin', colour: COLOR.text.secondary }} title="Passport" subtitle={year.passport} onPress={() => router.push('/passport')} />
          <RowDivider />
          <ListRow leading={{ icon: 'calendar', colour: COLOR.text.secondary }} title="Your year so far" subtitle={metaLine([plural(year.recap.meets, 'meet'), plural(year.recap.drives, 'drive')])} onPress={() => router.push('/recap')} />
        </View>
      </Section>

      <View>
        <ListRow title="Edit profile" onPress={() => router.push('/profile')} />
        <RowDivider />
        <ListRow title={SCREEN_TITLES.help} onPress={() => router.push('/help')} />
        <RowDivider />
        <ListRow title={SCREEN_TITLES.feedback} onPress={() => router.push({ pathname: '/feedback', params: { from: '/me' } })} />
      </View>

      <AvatarSheet visible={picker} onClose={() => setPicker(false)} />
      <LadderSheet visible={ladder} onClose={() => setLadder(false)} level={rep.level} ledger={rep.ledger} />
    </ScrollView>
  );
}

const st = StyleSheet.create({
  page: { padding: SPACING.screen, gap: SPACING.section, paddingBottom: SPACING.xxxl },
  profile: { flexDirection: 'row', alignItems: 'center', gap: SPACING.lg },
});
