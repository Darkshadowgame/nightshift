import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { EVENT_LABELS } from '../lib/events';
import type { EventView } from '../lib/eventView';
import { formatWhen } from '../lib/format';
import { describeFilter } from '../lib/invites';
import { C, EVENT_COLOURS } from '../theme';
import { PulseRing } from './motion';
import { Pin } from './Pin';
import { Row, Txt } from './ui';

const ROLE_TEXT = { host: 'Hosting', going: 'Going', invited: 'Invited', public: 'Public', requested: 'Requested', declined: 'Declined', none: '' } as const;

export function EventCard({ view, now }: { view: EventView; now: Date }) {
  const { event: e, role, phase, shownStop } = view;
  const colour = EVENT_COLOURS[e.type];
  const place =
    shownStop >= 0
      ? e.stops[shownStop].name
      : role === 'requested'
        ? `${e.areaName} · waiting for a host to say yes`
        : `${e.areaName} · location locked`;
  const when = phase === 'live' ? 'Live now' : phase === 'cancelled' ? 'Cancelled' : phase === 'over' ? 'Finished' : formatWhen(e.startsAt, now);
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/event/[id]', params: { id: e.id } })}
      accessibilityRole="button"
      accessibilityLabel={`${e.title}, ${EVENT_LABELS[e.type]}, ${when}, ${e.going.length} going${ROLE_TEXT[role] ? `, ${ROLE_TEXT[role]}` : ''}`}
      style={({ pressed }) => [
        { backgroundColor: C.tarmac, borderColor: C.kerb, borderWidth: 1, borderLeftWidth: 3, borderLeftColor: colour, borderRadius: 8, padding: 14, gap: 6 },
        pressed && { opacity: 0.8 },
        (phase === 'over' || phase === 'cancelled') && { opacity: 0.55 },
      ]}
    >
      <Row style={{ flexWrap: 'nowrap', alignItems: 'flex-start' }} gap={12}>
        <PulseRing live={phase === 'live'} colour={colour} size={40}>
          <Pin glyph={shownStop >= 0 ? e.type : 'locked'} colour={colour} size={40} />
        </PulseRing>
        <View style={{ flex: 1, gap: 4 }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Txt v="label" style={{ color: colour }}>{EVENT_LABELS[e.type]}</Txt>
            <Txt v="label" style={{ color: role === 'host' ? C.neon : role === 'requested' ? C.sodium : role === 'declined' ? C.alert : C.fog }}>{ROLE_TEXT[role]}</Txt>
          </Row>
          <Txt v="h3">{e.title}</Txt>
          <Txt v="mono" style={{ color: phase === 'live' ? C.neon : C.chalk }}>
            {when.toUpperCase()} · {e.going.length} GOING{e.routeMiles ? ` · ${e.routeMiles} MI` : ''}
          </Txt>
          <Txt v="muted" numberOfLines={1}>{place}</Txt>
          <Txt v="muted" numberOfLines={1} style={{ fontSize: 13 }}>{describeFilter(e.filter)}</Txt>
        </View>
      </Row>
    </Pressable>
  );
}
