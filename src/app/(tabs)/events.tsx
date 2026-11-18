import { router, useNavigation } from 'expo-router';
import { useLayoutEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { EventCard } from '../../components/EventCard';
import { NoticeBell } from '../../components/NoticeBell';
import { EmptyState, HeaderAction, LinkText, Row, Section, Segmented } from '../../components/ui';
import { viewEvents, type EventView } from '../../lib/eventView';
import { useStore } from '../../lib/store';
import { useNow } from '../../lib/clock';
import { firstPage, PAGE } from '../../lib/paging';
import { STATE } from '../../theme';

type Tab = 'mine' | 'invited' | 'public' | 'past';

export default function EventsScreen() {
  const nav = useNavigation();
  const { events, me, crews, users, builds, nearby } = useStore();
  const now = useNow();
  const newNear = nearby?.unseen.length ?? 0;
  const [tab, setTab] = useState<Tab>('mine');

  useLayoutEffect(() => {
    nav.setOptions({
      headerRight: () => (
        <Row gap={8} style={{ marginRight: 10, flexWrap: 'nowrap' }}>
          <NoticeBell />
          <HeaderAction
            label={newNear > 0 ? `Find · ${newNear} new` : 'Find'}
            accessibilityLabel={newNear > 0 ? `Find events, ${newNear} new near you` : 'Find events'}
            onPress={() => router.push('/find')}
          />
          <HeaderAction label="+ Host" accessibilityLabel="Host an event" onPress={() => router.push('/event/new')} />
        </Row>
      ),
    });
  }, [nav, newNear]);

  const views = useMemo(() => viewEvents(events, me, crews, users, builds, now), [events, me, crews, users, builds, now]);
  const active = (v: EventView) => v.phase !== 'over' && v.phase !== 'cancelled';
  const lists: Record<Tab, EventView[]> = {
    mine: views.filter((v) => active(v) && (v.role === 'host' || v.role === 'going' || v.role === 'requested')),
    invited: views.filter((v) => active(v) && v.role === 'invited'),
    public: views.filter((v) => active(v) && v.role === 'public'),
    // A host said no: it moves to Past so it's still there to look back at.
    past: views.filter((v) => !active(v) || v.role === 'declined').reverse(),
  };
  const live = lists.mine.filter((v) => v.phase === 'live');
  const rest = tab === 'mine' ? lists.mine.filter((v) => v.phase !== 'live') : lists[tab];
  // A page at a time: Past only grows, and a busy weekend can fill Public (hundreds of cards at once stall the tab).
  const [shown, setShown] = useState(PAGE);
  const page = firstPage(rest, shown);

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 18, paddingBottom: 40 }}>
      <Segmented<Tab>
        value={tab}
        onChange={(t) => {
          setTab(t);
          setShown(PAGE);
        }}
        options={[
          { key: 'mine', label: `Mine ${lists.mine.length}` },
          { key: 'invited', label: `Invited ${lists.invited.length}` },
          { key: 'public', label: `Public ${lists.public.length}` },
          { key: 'past', label: 'Past' },
        ]}
      />

      {tab === 'mine' && live.length > 0 ? (
        <Section title="Live now" colour={STATE.live}>
          {live.map((v) => (
            <EventCard key={v.event.id} view={v} now={now} />
          ))}
        </Section>
      ) : null}

      <Section title={tab === 'mine' ? 'Coming up' : tab === 'invited' ? 'You match the invite' : tab === 'public' ? 'Shows and track days' : 'Finished, cancelled and declined'}>
        {rest.length === 0 ? (
          tab === 'mine' ? (
            <EmptyState
              glyph="meet"
              title="Nothing planned"
              body="Events you're hosting, going to or have requested show here."
              action={{ label: 'Find events', onPress: () => router.push('/find') }}
              secondary={{ label: 'Host one', onPress: () => router.push('/event/new') }}
            />
          ) : tab === 'invited' ? (
            <EmptyState
              glyph="meet"
              title="No invites right now"
              body="Invites are matched to your builds. Add your car or bike in the Garage, or find every event near you."
              action={{ label: 'Find events', onPress: () => router.push('/find') }}
              secondary={{ label: 'Open garage', onPress: () => router.push('/garage') }}
            />
          ) : (
            <EmptyState title="Nothing here yet" body={tab === 'public' ? 'Shows and track days near you show here.' : 'Finished, cancelled and declined events show here.'} />
          )
        ) : (
          page.items.map((v) => <EventCard key={v.event.id} view={v} now={now} />)
        )}
        {page.more > 0 ? <LinkText label={`Show ${page.more} more ›`} onPress={() => setShown((n) => n + PAGE)} /> : null}
      </Section>
      <View style={{ height: 8 }} />
    </ScrollView>
  );
}
