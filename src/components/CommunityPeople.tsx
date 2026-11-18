import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SAMPLE_PEOPLE } from '../data/seed';
import { ANY_NEAR, isFiltered, makesNear, personCards, type NearFilter } from '../lib/carsNear';
import { useCommunity, useCommunityQuery } from '../lib/communityStore';
import { plural } from '../lib/format';
import { useStore } from '../lib/store';
import { CLASS_LETTERS, type ClassLetter } from '../lib/types';
import { BRAND } from '../theme';
import { PersonCard } from './Community';
import { useRepFor } from './Rep';
import { Card, Chip, EmptyState, InlineError, LinkText, Row, Section, ToggleRow, Txt } from './ui';

const DISTANCES = [10, 25, 50, 100];

/** Community › People: Cars near you, with filters, requests waiting and the "Show me" switch. */
export function CommunityPeople() {
  const { users, builds, me } = useStore();
  const community = useCommunity();
  const repFor = useRepFor();
  const meUser = users.find((u) => u.id === me);
  const travel = meUser?.travelMiles ?? 25;
  const [miles, setMiles] = useState(DISTANCES.includes(travel) ? travel : 25);
  const [filter, setFilter] = useState<NearFilter>(ANY_NEAR);
  const [error, setError] = useState<string | null>(null);
  const near = useCommunityQuery((s) => s.peopleNear(miles), [miles]);
  const list = near.data ?? [];
  const cards = useMemo(() => personCards(list, users, builds, filter), [list, users, builds, filter]);
  const makes = useMemo(() => makesNear(list, builds), [list, builds]);
  const noHome = !meUser?.home || (meUser.home.lat === 0 && meUser.home.lng === 0);

  const toggleClass = (c: ClassLetter) =>
    setFilter((f) => ({ ...f, classes: f.classes.includes(c) ? f.classes.filter((x) => x !== c) : [...f.classes, c] }));

  return (
    <View style={{ gap: 18 }}>
      {community.incoming.length > 0 ? (
        <Card accent={BRAND}>
          <Row style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}>
            <Txt style={{ flex: 1 }}>{plural(community.incoming.length, 'person wants', 'people want')} to connect.</Txt>
            <LinkText label="See requests ›" onPress={() => router.push('/connections')} />
          </Row>
        </Card>
      ) : null}

      <Section title="Cars near you" right={<LinkText label="Rate builds ›" onPress={() => router.push('/rate')} accessibilityLabel="Rate builds near you" />}>
        <Txt v="caption">
          Distances are rough, worked out from home areas. Nobody sees where anyone lives.
        </Txt>
        <Row>
          {DISTANCES.map((d) => (
            <Chip key={d} label={`${d} mi`} on={miles === d} onPress={() => setMiles(d)} accessibilityLabel={`Within ${d} miles`} />
          ))}
        </Row>
        <Row>
          <Chip label="Cars" on={filter.kind === 'car'} onPress={() => setFilter((f) => ({ ...f, kind: f.kind === 'car' ? 'all' : 'car' }))} />
          <Chip label="Bikes" on={filter.kind === 'bike'} onPress={() => setFilter((f) => ({ ...f, kind: f.kind === 'bike' ? 'all' : 'bike' }))} />
          {CLASS_LETTERS.map((c) => (
            <Chip key={c} label={c} on={filter.classes.includes(c)} onPress={() => toggleClass(c)} accessibilityLabel={`Class ${c}`} />
          ))}
        </Row>
        {makes.length > 1 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }} accessibilityLabel="Filter by make">
            <Chip label="Any make" on={!filter.make} onPress={() => setFilter((f) => ({ ...f, make: '' }))} />
            {makes.map((m) => (
              <Chip key={m} label={m} raw on={filter.make === m} onPress={() => setFilter((f) => ({ ...f, make: f.make === m ? '' : m }))} />
            ))}
          </ScrollView>
        ) : null}
        <InlineError message={near.error} />

        {noHome ? (
          <EmptyState glyph="community" title="Set your home area first" body="Cars near you is worked out from your rough home area." action={{ label: 'Edit profile', onPress: () => router.push('/profile') }} />
        ) : near.loading && !near.data ? (
          <Txt v="muted">Looking for people near you…</Txt>
        ) : cards.length === 0 ? (
          <EmptyState
            glyph="community"
            title={isFiltered(filter) ? 'Nothing matches' : 'Nobody near you yet'}
            body={isFiltered(filter) ? 'Try fewer filters or a bigger distance.' : `Nobody within ${miles} mi has shared their builds yet. Try a bigger distance, or ask on the forum.`}
            action={isFiltered(filter) ? { label: 'Clear filters', onPress: () => setFilter(ANY_NEAR) } : { label: 'Open the forum', onPress: () => router.setParams({ tab: 'forum' }) }}
          />
        ) : (
          <>
            <Txt v="mono">{plural(cards.length, 'PERSON', 'PEOPLE')} WITHIN {miles} MI</Txt>
            {cards.map((c) => (
              <PersonCard key={c.user.id} card={c} level={repFor(c.user.id).level.level} state={community.stateOf(c.user.id)} sample={SAMPLE_PEOPLE.includes(c.user.id)} />
            ))}
          </>
        )}
      </Section>

      <Section title="Your privacy">
        <Card>
          <ToggleRow
            label="Show me in Cars near you"
            hint="People near you see your builds and a rough distance, never where you live. Turn it off to stay out of the list."
            value={community.showInNearby}
            onValueChange={(v) => {
              setError(null);
              community.run((s) => s.setShowInNearby(v)).catch((e) => setError(e instanceof Error ? e.message : 'Could not save that.'));
            }}
          />
          <InlineError message={error} />
          <LinkText label="Connections and blocked people ›" onPress={() => router.push('/connections')} />
        </Card>
      </Section>
    </View>
  );
}
