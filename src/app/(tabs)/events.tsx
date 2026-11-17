import { router, useFocusEffect, useNavigation } from 'expo-router';
import { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { EventCard } from '../../components/EventCard';
import { Card, Chip, Row, Section, Txt } from '../../components/ui';
import { viewEvents, type EventView } from '../../lib/eventView';
import { formatRelative } from '../../lib/format';
import { useStore } from '../../lib/store';
import { C } from '../../theme';

type Tab = 'mine' | 'invited' | 'public' | 'past';

export default function EventsScreen() {
  const nav = useNavigation();
  const { events, me, crews, users, builds, now, notices, markNoticesRead } = useStore();
  const [tab, setTab] = useState<Tab>('mine');
  const [shownNotices] = useState(() => notices.filter((n) => !n.read).slice(0, 3));

  useLayoutEffect(() => {
    nav.setOptions({
      headerRight: () => (
        <Pressable onPress={() => router.push('/event/new')} hitSlop={10} style={{ marginRight: 16 }} accessibilityRole="button">
          <Txt v="label" style={{ color: C.sodium, fontSize: 14 }}>+ Host</Txt>
        </Pressable>
      ),
    });
  }, [nav]);

  useFocusEffect(
    useCallback(() => {
      return () => markNoticesRead();
    }, [markNoticesRead]),
  );

  const views = useMemo(() => viewEvents(events, me, crews, users, builds, now), [events, me, crews, users, builds, now]);
  const active = (v: EventView) => v.phase !== 'over' && v.phase !== 'cancelled';
  const lists: Record<Tab, EventView[]> = {
    mine: views.filter((v) => active(v) && (v.role === 'host' || v.role === 'going')),
    invited: views.filter((v) => active(v) && v.role === 'invited'),
    public: views.filter((v) => active(v) && v.role === 'public'),
    past: views.filter((v) => !active(v)).reverse(),
  };
  const live = lists.mine.filter((v) => v.phase === 'live');
  const rest = tab === 'mine' ? lists.mine.filter((v) => v.phase !== 'live') : lists[tab];

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 18, paddingBottom: 40 }}>
      {shownNotices.length > 0 ? (
        <Section title="New">
          {shownNotices.map((n) => (
            <Card key={n.id} accent={C.neon}>
              <Txt>{n.text}</Txt>
              <Txt v="mono">{formatRelative(n.at, now).toUpperCase()}</Txt>
            </Card>
          ))}
        </Section>
      ) : null}

      <Row gap={6}>
        <Chip label={`Mine (${lists.mine.length})`} on={tab === 'mine'} onPress={() => setTab('mine')} />
        <Chip label={`Invited (${lists.invited.length})`} on={tab === 'invited'} onPress={() => setTab('invited')} />
        <Chip label={`Public (${lists.public.length})`} on={tab === 'public'} onPress={() => setTab('public')} />
        <Chip label="Past" on={tab === 'past'} onPress={() => setTab('past')} />
      </Row>

      {tab === 'mine' && live.length > 0 ? (
        <Section title="Live now">
          {live.map((v) => (
            <EventCard key={v.event.id} view={v} now={now} />
          ))}
        </Section>
      ) : null}

      <Section title={tab === 'mine' ? 'Coming up' : tab === 'invited' ? 'You match the invite' : tab === 'public' ? 'Shows and track days' : 'Finished and cancelled'}>
        {rest.length === 0 ? (
          <Card>
            <Txt v="muted">
              {tab === 'mine'
                ? 'Nothing planned. Tap Going on an invite, or host your own with + Host.'
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
