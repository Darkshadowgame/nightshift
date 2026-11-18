import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { SectionList, StyleSheet, View } from 'react-native';
import { Button, DsText, EmptyState, ListRow, RowDivider } from '../components/ds';
import { useStore, type Notice } from '../lib/store';
import { useNow } from '../lib/clock';
import { endTime } from '../lib/events';
import { clock, dayDiff, dayWord } from '../lib/when';
import { COLOR, EVENT_COLOURS, RADII, SPACING } from '../theme';

/** When a notice came: "21:30" today, "Yesterday", "Fri", "Fri 13 Nov". */
function noticeTime(iso: string, now: Date): string {
  const d = new Date(iso);
  const days = dayDiff(d, now);
  if (days === 0) return clock(d);
  if (days === -1) return 'Yesterday';
  return dayWord(d, now);
}

/**
 * Notifications (Redesign 2, 3.13, template T1 pushed from the bell): Today, then Earlier. One row
 * each (the event's pin or the person, one sentence, the time), opening the event or the person.
 * The demo starts with none.
 */
export default function NotificationsScreen() {
  const { notices, events, users, markNoticesRead, settings, me } = useStore();
  const now = useNow();
  const goingToOne = events.some((e) => !e.cancelled && e.going.includes(me) && endTime(e).getTime() > now.getTime());
  // Keep "new" marked while the list is open; mark it all read on the way out.
  const [unreadIds] = useState(() => new Set(notices.filter((n) => !n.read).map((n) => n.id)));
  useFocusEffect(
    useCallback(() => {
      return () => markNoticesRead();
    }, [markNoticesRead]),
  );

  const today = notices.filter((n) => dayDiff(new Date(n.at), now) === 0);
  const earlier = notices.filter((n) => dayDiff(new Date(n.at), now) !== 0);
  const sections = [
    ...(today.length ? [{ title: 'Today', data: today }] : []),
    ...(earlier.length ? [{ title: 'Earlier', data: earlier }] : []),
  ];

  if (notices.length === 0) {
    return (
      <View style={[st.page, { flex: 1 }]}>
        {/* 4.6: glyph, one line, one primary. The line follows what you've done (Review 14). */}
        <EmptyState
          variant="block"
          glyph="meet"
          title={
            !settings.reminders
              ? 'Event reminders are off.'
              : goingToOne
                ? 'Reminders for your meets will show here.'
                : "Say you're going to a meet and its reminders show here."
          }
          action={
            !settings.reminders
              ? { label: 'Turn reminders on', onPress: () => router.push('/settings') }
              : { label: 'See tonight', onPress: () => router.navigate({ pathname: '/', params: { view: 'list' } }) }
          }
        />
      </View>
    );
  }

  return (
    <SectionList
      sections={sections}
      keyExtractor={(n) => n.id}
      contentContainerStyle={st.page}
      ItemSeparatorComponent={RowDivider}
      stickySectionHeadersEnabled={false}
      ListHeaderComponent={
        !settings.reminders ? (
          <View style={st.notice}>
            <DsText v="secondary" tone="primary">Event reminders are off.</DsText>
            <Button label="Settings" tier="tertiary" size="sm" onPress={() => router.push('/settings')} accessibilityLabel="Turn reminders on in Settings" />
          </View>
        ) : undefined
      }
      renderSectionHeader={({ section }) => (
        <DsText v="eyebrow" accessibilityRole="header" style={{ marginTop: SPACING.lg, marginBottom: SPACING.xs }}>
          {section.title}
        </DsText>
      )}
      renderItem={({ item: n }: { item: Notice }) => {
        const fresh = unreadIds.has(n.id);
        if (n.kind === 'connection' && n.userId) {
          const userId = n.userId;
          const u = users.find((x) => x.id === userId);
          return (
            <ListRow
              leading={{ avatar: { name: u?.name, handle: u?.handle } }}
              unread={fresh}
              title={n.text}
              meta={noticeTime(n.at, now)}
              onPress={() => router.push({ pathname: '/user/[id]', params: { id: userId } })}
              accessibilityHint="Opens their profile"
            />
          );
        }
        const event = events.find((e) => e.id === n.eventId);
        return (
          <ListRow
            leading={{ pin: event?.type ?? 'meet', colour: event ? EVENT_COLOURS[event.type] : COLOR.text.secondary }}
            unread={fresh}
            title={n.text}
            meta={event ? noticeTime(n.at, now) : `${noticeTime(n.at, now)} · This event has gone`}
            onPress={event ? () => router.push({ pathname: '/event/[id]', params: { id: n.eventId } }) : undefined}
            accessibilityHint={event ? 'Opens the event' : undefined}
          />
        );
      }}
    />
  );
}

const st = StyleSheet.create({
  page: { padding: SPACING.screen, paddingBottom: SPACING.xxxl, flexGrow: 1, backgroundColor: COLOR.surface.bg },
  notice: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: SPACING.sm, padding: SPACING.md, marginBottom: SPACING.md, borderRadius: RADII.card, borderWidth: 1, borderColor: COLOR.surface.raisedHi, backgroundColor: COLOR.surface.raised },
});
