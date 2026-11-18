import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Button, DsText, EmptyState, ListRow, RowDivider } from '../components/ds';
import { formatRelative } from '../lib/format';
import { useStore, type Notice } from '../lib/store';
import { useNow } from '../lib/clock';
import { SPACING, COLOR, RADII } from '../theme';

const KIND_LABEL: Record<NonNullable<Notice['kind']>, string> = {
  reveal: 'Location shown',
  soon: 'Starting soon',
  moved: 'Moved on',
  host: 'You moved the meet on',
  nearby: 'New near you',
  connection: 'Connection',
};

/** Under the bell (Tonight and Community): reminders and news about your events, newest first. */
export default function NotificationsScreen() {
  const { notices, events, markNoticesRead, settings } = useStore();
  const now = useNow();
  // Keep "new" marked while the list is open; mark it all read on the way out.
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
      contentContainerStyle={st.page}
      ItemSeparatorComponent={RowDivider}
      ListHeaderComponent={
        !settings.reminders ? (
          <View style={st.notice}>
            <DsText v="secondary" tone="primary">Event reminders are off.</DsText>
            <Button label="Settings" tier="tertiary" size="sm" onPress={() => router.push('/settings')} accessibilityLabel="Turn reminders on in Settings" />
          </View>
        ) : undefined
      }
      ListEmptyComponent={
        <EmptyState
          title="Nothing yet"
          body="Say you're going to an event and you'll get a reminder when its location shows and 30 minutes before the start."
          action={{ label: 'See tonight', onPress: () => router.navigate({ pathname: '/', params: { view: 'list' } }) }}
        />
      }
      renderItem={({ item: n }) => {
        const fresh = unreadIds.has(n.id);
        if (n.kind === 'connection' && n.userId) {
          const userId = n.userId;
          return (
            <ListRow
              unread={fresh}
              title={n.text}
              meta={`${KIND_LABEL.connection} · ${formatRelative(n.at, now)}`}
              onPress={() => router.push({ pathname: '/user/[id]', params: { id: userId } })}
              accessibilityHint="Opens their profile"
            />
          );
        }
        const event = events.find((e) => e.id === n.eventId);
        return (
          <ListRow
            unread={fresh}
            title={n.text}
            meta={`${n.kind ? KIND_LABEL[n.kind] : 'Update'} · ${formatRelative(n.at, now)}${event ? '' : ' · this event has gone'}`}
            onPress={event ? () => router.push({ pathname: '/event/[id]', params: { id: n.eventId } }) : undefined}
            accessibilityHint={event ? 'Opens the event' : undefined}
          />
        );
      }}
    />
  );
}

const st = StyleSheet.create({
  page: { padding: SPACING.screen, paddingBottom: SPACING.xxxl, flexGrow: 1 },
  notice: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: SPACING.sm, padding: SPACING.md, marginBottom: SPACING.md, borderRadius: RADII.card, borderWidth: 1, borderColor: COLOR.surface.raisedHi, backgroundColor: COLOR.surface.raised },
});
