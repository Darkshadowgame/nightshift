import { router, useNavigation } from 'expo-router';
import { useLayoutEffect } from 'react';
import { ScrollView } from 'react-native';
import { CrewCard } from '../../components/CrewCard';
import { RepPanel, useRep } from '../../components/Rep';
import { Button, Card, HeaderAction, LegendTag, LinkText, ListRow, Row, Section, Txt } from '../../components/ui';
import { allAwards, hasLegend } from '../../lib/awards';
import { isHost, phaseOf } from '../../lib/events';
import { plural } from '../../lib/format';
import { PLACE_NAMES, SCREEN_TITLES } from '../../lib/glossary';
import { useStore, type Settings } from '../../lib/store';
import { useNow } from '../../lib/clock';
import { C, SPOT_COLOURS } from '../../theme';

/**
 * Me: who you are (REVIEW-5 M7). Profile, rep, crew and your places. Every
 * setting is on the Settings screen (the header's Settings button).
 */
export default function Me() {
  const nav = useNavigation();
  const { users, me, crews, builds, events, votes, spots } = useStore();
  const now = useNow();
  const rep = useRep(me);
  const awards = allAwards(votes, events, builds, now);
  const myAwards = awards.filter((a) => a.ownerId === me);
  const user = users.find((u) => u.id === me);
  const crew = crews.find((c) => c.id === user?.crewId);
  const mySpots = spots.filter((x) => x.authorId === me);
  const hosting = events.filter((e) => !e.cancelled && phaseOf(e, now) !== 'over' && isHost(e, me, crews)).length;

  useLayoutEffect(() => {
    nav.setOptions({
      headerRight: () => (
        <Row style={{ marginRight: 10 }}>
          <HeaderAction label={SCREEN_TITLES.settings} onPress={() => router.push('/settings')} />
        </Row>
      ),
    });
  }, [nav]);

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 20, paddingBottom: 40 }}>
      <Card>
        <Row>
          <Txt v="h2" style={{ textTransform: 'none' }}>@{user?.handle}</Txt>
          {hasLegend(awards, me, now) ? <LegendTag /> : null}
        </Row>
        <Txt>{user?.name}</Txt>
        <Txt v="muted">{user?.region}{crew ? ` · Crew: ${crew.name}` : ''}</Txt>
        <Row gap={16}>
          <Txt v="mono">{plural(builds.filter((b) => b.ownerId === me).length, 'build').toUpperCase()}</Txt>
          {/* Hosting now (upcoming or live), not ever hosted: profiles count that. */}
          <Txt v="mono">{hosting > 0 ? `HOSTING ${hosting} NOW` : 'NOT HOSTING'}</Txt>
          <Txt v="mono">{plural(myAwards.length, 'trophy', 'trophies').toUpperCase()}</Txt>
        </Row>
        <Row style={{ flexWrap: 'nowrap' }}>
          <Button label="Edit profile" kind="secondary" size="sm" style={{ flex: 1 }} onPress={() => router.push('/profile')} />
          <Button label="Public view" kind="secondary" size="sm" style={{ flex: 1 }} onPress={() => router.push({ pathname: '/user/[id]', params: { id: me } })} />
        </Row>
      </Card>

      {/* The level shows once, here (REVIEW-5 m8). */}
      <RepPanel ledger={rep.ledger} level={rep.level} title="Your rep" />

      <Section title="Crew" right={<LinkText label="All crews ›" onPress={() => router.push('/crews')} />}>
        {crew ? (
          <CrewCard crew={crew} />
        ) : (
          <Card>
            <Txt v="muted">You're not in a crew. Crews host events together.</Txt>
            <Row style={{ flexWrap: 'nowrap' }}>
              <Button label="Find a crew" kind="secondary" size="sm" style={{ flex: 1 }} onPress={() => router.push('/crews')} />
              <Button label="Start one" kind="secondary" size="sm" style={{ flex: 1 }} onPress={() => router.push('/crew/new')} />
            </Row>
          </Card>
        )}
      </Section>

      <Section title="Your places">
        <Card>
          {mySpots.length === 0 ? (
            <Txt v="muted">Suggest a great road to drive or a photo spot. You earn rep when it's approved and each time someone else uses it.</Txt>
          ) : null}
          {mySpots.map((x) => (
            <ListRow
              key={x.id}
              glyph={x.kind}
              colour={x.status === 'pending' ? C.fog : SPOT_COLOURS[x.kind]}
              title={x.name}
              subtitle={`${PLACE_NAMES[x.kind].one} · ${x.status === 'pending' ? 'waiting for approval' : 'live'}`}
              onPress={() => router.push({ pathname: '/spot/[id]', params: { id: x.id } })}
            />
          ))}
          <Button label="Suggest a place" kind="secondary" size="sm" onPress={() => router.push('/spot/new')} />
        </Card>
      </Section>

      <Card>
        <Txt>Something not right, or got an idea?</Txt>
        <Button label="Send feedback" kind="secondary" size="sm" onPress={() => router.push({ pathname: '/feedback', params: { from: '/me' } })} />
        <Txt v="caption">See what happened to what you sent under Send feedback › Your feedback.</Txt>
      </Card>

      <LinkText label="All settings ›" onPress={() => router.push('/settings')} />
    </ScrollView>
  );
}

export type { Settings };
