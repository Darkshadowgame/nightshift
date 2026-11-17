import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { endTime, EVENT_LABELS } from '../lib/events';
import { countdown } from '../lib/hud';
import type { EventView } from '../lib/eventView';
import { formatWhen } from '../lib/format';
import { describeFilter } from '../lib/invites';
import { isSeedEvent } from '../lib/demoTime';
import { C, EVENT_COLOURS } from '../theme';
import { PulseRing } from './motion';
import { Pin } from './Pin';
import { Row, Txt } from './ui';

const ROLE_TEXT = { host: 'Hosting', going: 'Going', invited: 'Invited', public: 'Public', requested: 'Requested', declined: 'Declined', none: '' } as const;

/** `note`: an extra line, e.g. the distance in Find events. `tag`: a short highlight such as NEW. */
export function EventCard({ view, now, note, tag }: { view: EventView; now: Date; note?: string; tag?: string }) {
  const { event: e, role, phase, shownStop } = view;
  const colour = EVENT_COLOURS[e.type];
  const place =
    shownStop >= 0
      ? e.stops[shownStop].name
      : role === 'requested'
        ? `${e.areaName} · waiting for a host to say yes`
        : `${e.areaName} · location locked`;
  const soon = (phase === 'upcoming' || phase === 'revealed') && new Date(e.startsAt).getTime() - now.getTime() < 24 * 3_600_000;
  const when =
    phase === 'live' ? `Live · ends in ${countdown(endTime(e), now)}`
      : phase === 'cancelled' ? 'Cancelled'
        : phase === 'over' ? 'Finished'
          : soon ? `${formatWhen(e.startsAt, now)} · in ${countdown(e.startsAt, now)}`
            : formatWhen(e.startsAt, now);
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/event/[id]', params: { id: e.id } })}
      accessibilityRole="button"
      accessibilityLabel={`${tag ? `${tag}. ` : ''}${e.title}, ${EVENT_LABELS[e.type]}, ${when}, ${e.going.length} going${ROLE_TEXT[role] ? `, ${ROLE_TEXT[role]}` : ''}${note ? `, ${note}` : ''}`}
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
            <Txt v="label" style={{ color: colour }}>
              {EVENT_LABELS[e.type]}
              {isSeedEvent(e.id) ? <Txt v="label" style={{ color: C.fog }}> · Sample</Txt> : null}
              {tag ? <Txt v="label" style={{ color: C.lime }}> · {tag}</Txt> : null}
            </Txt>
            <Txt v="label" style={{ color: role === 'host' ? C.neon : role === 'requested' ? C.sodium : role === 'declined' ? C.alert : C.fog }}>{ROLE_TEXT[role]}</Txt>
          </Row>
          <Txt v="h3">{e.title}</Txt>
          <Txt v="mono" style={{ color: phase === 'live' ? C.neon : C.chalk }}>
            {when.toUpperCase()} · {e.going.length} GOING{e.routeMiles ? ` · ${e.routeMiles} MI` : ''}
          </Txt>
          <Txt v="muted" numberOfLines={1}>{place}</Txt>
          <Txt v="muted" numberOfLines={1} style={{ fontSize: 13 }}>{describeFilter(e.filter)}</Txt>
          {note ? <Txt v="mono" numberOfLines={1} style={{ color: C.sodium }}>{note.toUpperCase()}</Txt> : null}
        </View>
      </Row>
    </Pressable>
  );
}
