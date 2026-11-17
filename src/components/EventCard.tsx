import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { classMixText } from '../lib/bringing';
import { endTime, EVENT_LABELS } from '../lib/events';
import { countdown } from '../lib/hud';
import type { EventView } from '../lib/eventView';
import { formatWhen } from '../lib/format';
import { describeFilter } from '../lib/invites';
import { isSeedEvent } from '../lib/demoTime';
import { useStore } from '../lib/store';
import { roleLabel, roleTone } from '../lib/glossary';
import { BRAND, C, EVENT_COLOURS, STATE } from '../theme';
import { PulseRing } from './motion';
import { Pin } from './Pin';
import { Card, Row, SampleTag, Tag, Txt } from './ui';

/** `note`: an extra line, e.g. the distance in Find events. `tag`: a short highlight such as NEW. */
export function EventCard({ view, now, note, tag }: { view: EventView; now: Date; note?: string; tag?: string }) {
  const { event: e, role, phase, shownStop } = view;
  const { builds } = useStore();
  // What people going are bringing, by class (their picked build, see bringing.ts).
  const mix = classMixText(e, builds);
  const colour = EVENT_COLOURS[e.type];
  const done = phase === 'over' || phase === 'cancelled';
  const role$ = roleLabel(role);
  const place =
    shownStop >= 0
      ? e.stops[shownStop].name
      : role === 'requested'
        ? `${e.areaName} · waiting for a host to say yes`
        : `${e.areaName} · stop locked`;
  const soon = (phase === 'upcoming' || phase === 'revealed') && new Date(e.startsAt).getTime() - now.getTime() < 24 * 3_600_000;
  const when =
    phase === 'live' ? `Live · ends in ${countdown(endTime(e), now)}`
      : phase === 'cancelled' ? 'Cancelled'
        : phase === 'over' ? 'Finished'
          : soon ? `${formatWhen(e.startsAt, now)} · in ${countdown(e.startsAt, now)}`
            : formatWhen(e.startsAt, now);
  // Finished and cancelled cards use quieter colours (not opacity), so the text keeps its contrast.
  const accent = done ? C.fog : colour;
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/event/[id]', params: { id: e.id } })}
      accessibilityRole="button"
      accessibilityLabel={`${tag ? `${tag}. ` : ''}${e.title}, ${EVENT_LABELS[e.type]}, ${when}, ${e.going.length} going${mix ? ` (${mix})` : ''}${role$ ? `, ${role$}` : ''}${note ? `, ${note}` : ''}`}
      style={({ pressed }) => pressed && { opacity: 0.8 }}
    >
      <Card accent={colour} variant={done ? 'muted' : 'solid'} style={{ gap: 6 }}>
        <Row style={{ flexWrap: 'nowrap', alignItems: 'flex-start' }} gap={12}>
          <PulseRing live={phase === 'live'} colour={STATE.live} size={40}>
            <Pin glyph={shownStop >= 0 ? e.type : 'locked'} colour={accent} size={40} />
          </PulseRing>
          <View style={{ flex: 1, gap: 4 }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Row gap={6}>
                <Txt v="label" scale="chrome" style={{ color: accent }}>{EVENT_LABELS[e.type]}</Txt>
                {isSeedEvent(e.id) ? <SampleTag /> : null}
                {tag ? <Tag label={tag} tone="brand" /> : null}
              </Row>
              {role$ ? <Tag label={role$} tone={done ? 'muted' : roleTone(role)} /> : null}
            </Row>
            <Txt v="h3" style={done ? { color: C.fog } : undefined}>{e.title}</Txt>
            <Txt v="mono" scale="chrome" style={{ color: phase === 'live' ? STATE.live : done ? C.fog : C.chalk }}>
              {when} · {e.going.length} going{mix ? ` · ${mix}` : ''}{e.routeMiles ? ` · ${e.routeMiles} mi` : ''}
            </Txt>
            <Txt v="muted" numberOfLines={1}>{place}</Txt>
            <Txt v="caption" numberOfLines={1}>{describeFilter(e.filter)}</Txt>
            {note ? <Txt v="mono" scale="chrome" numberOfLines={1} style={{ color: BRAND }}>{note}</Txt> : null}
          </View>
        </Row>
      </Card>
    </Pressable>
  );
}
