import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useNow } from '../lib/clock';
import { roleOf } from '../lib/eventView';
import { phaseOf } from '../lib/events';
import { milesBetween } from '../lib/geo';
import { shareBuild, shareEvent, sharePlace, type ShareCard } from '../lib/messages';
import { useStore } from '../lib/store';
import { classOf } from '../lib/classes';
import { COLOR } from '../theme';
import { DsText, EmptyState, ListRow, PhotoCard, SearchField, SegmentedControl, Sheet } from './ds';

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
    <Sheet visible={visible} title="Share in the chat" onClose={onClose}>
      <SegmentedControl<Kind>
        value={kind}
        onChange={setKind}
        accessibilityLabel="What to share"
        options={[
          { key: 'build', label: 'Builds' },
          { key: 'event', label: 'Events' },
          { key: 'place', label: 'Places' },
        ]}
      />
      {kind === 'place' ? <SearchField value={q} onChangeText={setQ} placeholder="Search drives, photo spots, tracks" accessibilityLabel="Search places" /> : null}
      <View>
        {kind === 'build' ? (
          mine.length ? (
            mine.map((b) => {
              const c = shareBuild(b);
              return <ListRow key={b.id} leading={{ classBadge: classOf(b) }} title={c.title} subtitle={c.subtitle} onPress={() => pick(c)} />;
            })
          ) : (
            <EmptyState variant="inline" title="Your garage is empty." />
          )
        ) : kind === 'event' ? (
          upcoming.length ? (
            upcoming.map((e) => {
              const c = shareEvent(e, now);
              return <ListRow key={e.id} leading={{ pin: e.type, colour: e.type === 'show' ? COLOR.layer.show : e.type === 'trackday' ? COLOR.layer.trackday : COLOR.layer.event }} title={c.title} subtitle={c.subtitle} onPress={() => pick(c)} />;
            })
          ) : (
            <EmptyState variant="inline" title="No upcoming events you're part of." />
          )
        ) : (
          places.map((s) => {
            const c = sharePlace(s);
            return <ListRow key={s.id} leading={{ pin: s.kind, colour: COLOR.layer[s.kind] }} title={c.title} subtitle={c.subtitle} onPress={() => pick(c)} />;
          })
        )}
      </View>
      <DsText v="caption">Events are shared with their area only. The meet point is only shown to people going.</DsText>
    </Sheet>
  );
}

/** A shared build, event or place inside a chat: a small PhotoCard (its drawing, no photo) that opens it. */
export function ShareCardView({ card, onPress }: { card: ShareCard; onPress: () => void }) {
  return (
    <View style={{ width: 260, maxWidth: '100%' }}>
      <PhotoCard
        kind={card.kind === 'build' ? 'build' : card.kind === 'event' ? 'event' : 'place'}
        size="sm"
        eyebrow={card.kind === 'build' ? 'Build' : card.kind === 'event' ? 'Event' : 'Place'}
        layerColour={card.kind === 'event' ? COLOR.layer.event : undefined}
        title={card.title}
        meta={card.subtitle || undefined}
        onPress={onPress}
        accessibilityHint="Opens it"
      />
    </View>
  );
}
