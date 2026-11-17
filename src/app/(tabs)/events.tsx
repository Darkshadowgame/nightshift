import { router, useNavigation } from 'expo-router';
import { useLayoutEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { EventCard } from '../../components/EventCard';
import { NoticeBell } from '../../components/NoticeBell';
import { Card, Chip, Row, Section, Txt } from '../../components/ui';
import { viewEvents, type EventView } from '../../lib/eventView';
import { useStore } from '../../lib/store';
import { C } from '../../theme';

type Tab = 'mine' | 'invited' | 'public' | 'past';

export default function EventsScreen() {
  const nav = useNavigation();
  const { events, me, crews, users, builds, now } = useStore();
  const [tab, setTab] = useState<Tab>('mine');

  useLayoutEffect(() => {
    nav.setOptions({
      headerRight: () => (
        <Row gap={14} style={{ marginRight: 16, flexWrap: 'nowrap' }}>
          <NoticeBell />
          <Pressable onPress={() => router.push('/event/new')} hitSlop={10} accessibilityRole="button" accessibilityLabel="Host an event">
            <Txt v="label" style={{ color: C.sodium, fontSize: 14 }}>+ Host</Txt>
          </Pressable>
        </Row>
      ),
    });
  }, [nav]);

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

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 18, paddingBottom: 40 }}>
      <Row gap={6}>
        <Chip label={`Mine (${lists.mine.length})`} on={tab === 'mine'} onPress={() => setTab('mine')} />
        <Chip label={`Invited (${lists.invited.length})`} on={tab === 'invited'} onPress={() => setTab('invited')} />
        <Chip label={`Public (${lists.public.length})`} on={tab === 'public'} onPress={() => setTab('public')} />
        <Chip label="Past" on={tab === 'past'} onPress={() => setTab('past')} />
      </Row>

      {tab === 'mine' && live.length > 0 ? (
        <Section title="Live now" colour={C.neon}>
          {live.map((v) => (
            <EventCard key={v.event.id} view={v} now={now} />
          ))}
        </Section>
      ) : null}

      <Section title={tab === 'mine' ? 'Coming up' : tab === 'invited' ? 'You match the invite' : tab === 'public' ? 'Shows and track days' : 'Finished, cancelled and declined'}>
        {rest.length === 0 ? (
          <Card>
            <Txt v="muted">
              {tab === 'mine'
                ? 'Nothing planned. Tap Going on an invite, or host your own with + Host. Events you ask to go to show here too.'
                : tab === 'invited'
                  ? 'No invites right now. Invites depend on your builds, so add your car or bike in the Garage.'
                  : 'Nothing here yet.'}
            </Txt>
          </Card>
        ) : (
          rest.map((v) => <EventCard key={v.event.id} view={v} now={now} />)
        )}
      </Section>
      <View style={{ height: 8 }} />
    </ScrollView>
  );
}
