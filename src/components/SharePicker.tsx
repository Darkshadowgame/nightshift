import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useNow } from '../lib/clock';
import { roleOf } from '../lib/eventView';
import { phaseOf } from '../lib/events';
import { milesBetween } from '../lib/geo';
import { shareBuild, shareEvent, sharePlace, type ShareCard } from '../lib/messages';
import { useStore } from '../lib/store';
import { C, SURFACE } from '../theme';
import { Button, ListRow, Segmented, Txt, s as ui } from './ui';

type Kind = 'build' | 'event' | 'place';

/**
 * Pick something to share in a chat as a card: one of your builds, an event you
 * can see (title, time and rough area only, never a stop) or a place.
 */
export function SharePicker({ visible, onPick, onClose }: { visible: boolean; onPick: (c: ShareCard) => void; onClose: () => void }) {
  const { builds, events, spots, me, users, crews } = useStore();
  const now = useNow();
  const [kind, setKind] = useState<Kind>('build');
  const [q, setQ] = useState('');
  const home = users.find((u) => u.id === me)?.home;
  const mine = builds.filter((b) => b.ownerId === me);
  const upcoming = useMemo(
    () =>
      events
        .filter((e) => phaseOf(e, now) !== 'over' && phaseOf(e, now) !== 'cancelled' && roleOf(e, me, crews, users, builds) !== 'none')
        .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
        .slice(0, 30),
    [events, now, me, crews, users, builds],
  );
  const places = useMemo(() => {
    const term = q.trim().toLowerCase();
    const list = spots.filter((s) => s.status === 'approved' && (!term || s.name.toLowerCase().includes(term)));
    if (home && (home.lat || home.lng)) list.sort((a, b) => milesBetween(a.at, home) - milesBetween(b.at, home));
    return list.slice(0, 30);
  }, [spots, q, home]);

  const pick = (c: ShareCard) => {
    onPick(c);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: C.asphalt, padding: 16, gap: 14 }}>
        <Txt v="h2">Share in the chat</Txt>
        <Segmented<Kind>
          value={kind}
          onChange={setKind}
          options={[
            { key: 'build', label: 'Builds' },
            { key: 'event', label: 'Events' },
            { key: 'place', label: 'Places' },
          ]}
        />
        {kind === 'place' ? (
          <TextInput value={q} onChangeText={setQ} placeholder="Search drives, photo spots, tracks" placeholderTextColor={C.fog} style={ui.input} accessibilityLabel="Search places" autoCorrect={false} />
        ) : null}
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: 2 }} keyboardShouldPersistTaps="handled">
          {kind === 'build'
            ? mine.length
              ? mine.map((b) => {
                  const c = shareBuild(b);
                  return <ListRow key={b.id} glyph="car" colour={C.chalk} title={c.title} subtitle={c.subtitle} onPress={() => pick(c)} />;
                })
              : <Txt v="muted">Your garage is empty.</Txt>
            : kind === 'event'
              ? upcoming.length
                ? upcoming.map((e) => {
                    const c = shareEvent(e, now);
                    return <ListRow key={e.id} glyph="calendar" colour={C.chalk} title={c.title} subtitle={c.subtitle} onPress={() => pick(c)} />;
                  })
                : <Txt v="muted">No upcoming events you're part of.</Txt>
              : places.map((s) => {
                  const c = sharePlace(s);
                  return <ListRow key={s.id} glyph={s.kind === 'track' ? 'track' : s.kind} colour={C.chalk} title={c.title} subtitle={c.subtitle} onPress={() => pick(c)} />;
                })}
        </ScrollView>
        <Txt v="caption">Events are shared with their rough area only. Stops stay locked to the people going.</Txt>
        <Button label="Close" kind="secondary" onPress={onClose} />
      </View>
    </Modal>
  );
}

/** A shared card inside a message. */
export function ShareCardView({ card, onPress, mine }: { card: ShareCard; onPress: () => void; mine: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="link"
      accessibilityLabel={`Open ${card.kind}: ${card.title}`}
      style={({ pressed }) => [{ borderWidth: 1, borderColor: mine ? '#00000040' : SURFACE.borderStrong, borderRadius: 8, padding: 10, gap: 2, minWidth: 200 }, pressed && { opacity: 0.8 }]}
    >
      <Txt v="micro" style={{ color: mine ? C.ink : C.fog }}>{card.kind === 'build' ? 'Build' : card.kind === 'event' ? 'Event' : 'Place'}</Txt>
      <Txt style={{ color: mine ? C.ink : C.chalk, fontWeight: '600' }} numberOfLines={2}>{card.title}</Txt>
      {card.subtitle ? <Txt v="caption" style={{ color: mine ? C.ink : C.fog }} numberOfLines={2}>{card.subtitle}</Txt> : null}
    </Pressable>
  );
}
