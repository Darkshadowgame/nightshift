import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { BellIcon } from '../components/NoticeBell';
import { Card, Notice as NoticeCard, Txt } from '../components/ui';
import { formatRelative } from '../lib/format';
import { useStore, type Notice } from '../lib/store';
import { useNow } from '../lib/clock';
import { WHERE } from '../lib/glossary';
import { BRAND, C } from '../theme';

const KIND_LABEL: Record<NonNullable<Notice['kind']>, string> = {
  reveal: 'Stop unlocked',
  soon: 'Starting soon',
  moved: 'Moved on',
  host: 'You moved the meet on',
  nearby: 'New near you',
};

export default function NotificationsScreen() {
  const { notices, events, markNoticesRead, settings } = useStore();
  const now = useNow();
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
          <View style={{ marginBottom: 6 }}>
            <NoticeCard action={{ label: 'Open settings ›', onPress: () => router.push('/settings') }}>
              Reminders are off. Turn them back on in {WHERE.reminders}.
            </NoticeCard>
          </View>
        ) : undefined
      }
      ListEmptyComponent={
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 24 }}>
          <BellIcon colour={C.fog} size={40} />
          <Txt v="h3">Nothing yet</Txt>
          <Txt v="muted" style={{ textAlign: 'center' }}>
            Say you're going to an event and you'll get a reminder when its stop unlocks and 30 minutes before the start.
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
            <Card accent={fresh ? BRAND : C.kerbHi}>
              <Txt v="label" style={{ color: fresh ? BRAND : C.fog }}>
                {n.kind ? KIND_LABEL[n.kind] : 'Update'} · {formatRelative(n.at, now)}
              </Txt>
              <Txt>{n.text}</Txt>
              {event ? <Txt v="label" style={{ color: BRAND }}>Open event ›</Txt> : <Txt v="muted">This event has gone.</Txt>}
            </Card>
          </Pressable>
        );
      }}
    />
  );
}
