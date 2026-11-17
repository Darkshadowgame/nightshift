import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { BellIcon } from '../components/NoticeBell';
import { Card, Txt } from '../components/ui';
import { formatRelative } from '../lib/format';
import { useStore, type Notice } from '../lib/store';
import { C } from '../theme';

const KIND_LABEL: Record<NonNullable<Notice['kind']>, string> = {
  reveal: 'Location unlocked',
  soon: 'Starting soon',
  moved: 'Moved on',
  host: 'You moved the meet on',
  nearby: 'New near you',
};

export default function NotificationsScreen() {
  const { notices, events, now, markNoticesRead, settings } = useStore();
  // Keep "new" highlighted while the list is open; mark it all read on the way out.
  const [unreadIds] = useState(() => new Set(notices.filter((n) => !n.read).map((n) => n.id)));
  useFocusEffect(
    useCallback(() => {
      return () => markNoticesRead();
    }, [markNoticesRead]),
  );

  return (
    <FlatList
      data={notices}
      keyExtractor={(n) => n.id}
      contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 40, flexGrow: 1 }}
      ListHeaderComponent={
        !settings.reminders ? (
          <Card accent={C.alert} style={{ marginBottom: 6 }}>
            <Txt v="muted">Reminders are off. Turn them back on in Me › Reminders.</Txt>
          </Card>
        ) : undefined
      }
      ListEmptyComponent={
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 24 }}>
          <BellIcon colour={C.fog} size={40} />
          <Txt v="h3">Nothing yet</Txt>
          <Txt v="muted" style={{ textAlign: 'center' }}>
            Tap Going on an event and you'll get a reminder when the location unlocks and 30 minutes before the start.
          </Txt>
        </View>
      }
      renderItem={({ item: n }) => {
        const event = events.find((e) => e.id === n.eventId);
        const fresh = unreadIds.has(n.id);
        return (
          <Pressable
            onPress={() => event && router.push({ pathname: '/event/[id]', params: { id: n.eventId } })}
            disabled={!event}
            accessibilityRole="button"
            accessibilityLabel={`${fresh ? 'New. ' : ''}${n.text}`}
            accessibilityHint={event ? 'Opens the event' : undefined}
            style={({ pressed }) => [pressed && { opacity: 0.8 }]}
          >
            <Card accent={fresh ? C.sodium : C.kerbHi}>
              <Txt v="label" style={{ color: fresh ? C.sodium : C.fog }}>
                {n.kind ? KIND_LABEL[n.kind] : 'Update'} · {formatRelative(n.at, now)}
              </Txt>
              <Txt>{n.text}</Txt>
              {event ? <Txt v="label" style={{ color: C.neon }}>Open event ›</Txt> : <Txt v="muted">This event has gone.</Txt>}
            </Card>
          </Pressable>
        );
      }}
    />
  );
}
