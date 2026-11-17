import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BAN_ZONES, SPOTS } from '../../data/seed';
import { NightMap } from '../../components/NightMap';
import type { MapCircle, MapPath, MapPin } from '../../components/mapTypes';
import { Chip, Row, Txt } from '../../components/ui';
import { EVENT_LABELS } from '../../lib/events';
import { viewEvents } from '../../lib/eventView';
import { describeFilter } from '../../lib/invites';
import { formatWhen } from '../../lib/format';
import { useStore } from '../../lib/store';
import { C, EVENT_COLOURS, SPOT_COLOURS } from '../../theme';

type Layer = 'events' | 'photo' | 'sprint' | 'track' | 'bans';
const LAYERS: { key: Layer; label: string; colour: string }[] = [
  { key: 'events', label: 'Events', colour: C.sodium },
  { key: 'photo', label: 'Photo spots', colour: C.magenta },
  { key: 'sprint', label: 'Sprints', colour: C.neon },
  { key: 'track', label: 'Tracks', colour: C.lime },
  { key: 'bans', label: 'Ban zones', colour: C.alert },
];

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const store = useStore();
  const { events, me, crews, users, builds, now } = store;
  const [layers, setLayers] = useState<Record<Layer, boolean>>({ events: true, photo: true, sprint: true, track: true, bans: false });
  const [selected, setSelected] = useState<string | null>(null);
  const meUser = users.find((u) => u.id === me);

  const views = useMemo(
    () => viewEvents(events, me, crews, users, builds, now).filter((v) => v.phase !== 'over' && v.phase !== 'cancelled'),
    [events, me, crews, users, builds, now],
  );

  const { pins, paths, circles } = useMemo(() => {
    const pins: MapPin[] = [];
    const paths: MapPath[] = [];
    const circles: MapCircle[] = [];
    if (layers.events) {
      for (const v of views) {
        const e = v.event;
        const colour = EVENT_COLOURS[e.type];
        if (v.shownStop >= 0) {
          const stop = e.stops[v.shownStop];
          if (stop.at) pins.push({ id: `ev:${e.id}`, at: stop.at, glyph: e.type, colour, title: e.title, size: 42 });
          if (e.type === 'cruise') {
            const coords = e.stops.flatMap((s) => (s.at ? [s.at] : []));
            paths.push({ id: `rt:${e.id}`, coords, colour, dashed: true });
          }
        } else {
          circles.push({ id: `ar:${e.id}`, centre: e.area, radiusMiles: 3, colour });
          pins.push({ id: `ev:${e.id}`, at: e.area, glyph: 'locked', colour, title: `${e.title} (location locked)`, size: 34 });
        }
      }
    }
    for (const s of SPOTS) {
      if (!layers[s.kind]) continue;
      pins.push({ id: `sp:${s.id}`, at: s.at, glyph: s.kind, colour: SPOT_COLOURS[s.kind], title: s.name, size: 32 });
      if (s.path) paths.push({ id: `pa:${s.id}`, coords: s.path, colour: SPOT_COLOURS.sprint });
    }
    if (layers.bans) for (const z of BAN_ZONES) circles.push({ id: `bz:${z.id}`, centre: z.centre, radiusMiles: z.radiusMiles, colour: C.alert });
    return { pins, paths, circles };
  }, [views, layers]);

  const sel = selected ? describeSelection(selected) : null;

  function describeSelection(id: string) {
    const [kind, key] = id.split(':');
    if (kind === 'ev') {
      const v = views.find((x) => x.event.id === key);
      if (!v) return null;
      const e = v.event;
      const place = v.shownStop >= 0 ? e.stops[v.shownStop].name : `${e.areaName} · location locked`;
      return {
        title: e.title,
        meta: `${EVENT_LABELS[e.type]} · ${v.phase === 'live' ? 'LIVE NOW' : formatWhen(e.startsAt, now)} · ${e.going.length} going`,
        body: `${place}\n${describeFilter(e.filter)}`,
        colour: EVENT_COLOURS[e.type],
        open: () => router.push({ pathname: '/event/[id]', params: { id: e.id } }),
      };
    }
    const s = SPOTS.find((x) => x.id === key);
    if (!s) return null;
    return {
      title: s.name,
      meta: s.kind === 'sprint' ? `Sprint route · ${s.miles} mi` : s.kind === 'track' ? 'Track' : 'Photo spot',
      body: s.description,
      colour: SPOT_COLOURS[s.kind],
      open: undefined,
    };
  }

  const liveCount = views.filter((v) => v.phase === 'live').length;

  return (
    <View style={{ flex: 1, backgroundColor: C.asphalt }}>
      <NightMap
        pins={pins}
        paths={paths}
        circles={circles}
        centre={meUser?.home ?? { lat: 52.7, lng: -1.7 }}
        span={1.4}
        onSelect={setSelected}
        showsUser
      />
      <View style={[st.hud, { paddingTop: insets.top + 8 }]} pointerEvents="box-none">
        <Row style={{ justifyContent: 'space-between' }}>
          <View style={st.brand}>
            <Txt v="h3" style={{ fontStyle: 'italic' }}>
              NIGHT<Txt v="h3" style={{ color: C.sodium, fontStyle: 'italic' }}>SHIFT</Txt>
            </Txt>
          </View>
          {liveCount > 0 ? (
            <View style={st.live}>
              <Txt v="label" style={{ color: '#00222c' }}>{liveCount} live now</Txt>
            </View>
          ) : null}
        </Row>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingVertical: 8 }}>
          {LAYERS.map((l) => (
            <View key={l.key} style={st.chipBg}>
              <Chip label={l.label} on={layers[l.key]} colour={l.colour} onPress={() => setLayers((x) => ({ ...x, [l.key]: !x[l.key] }))} />
            </View>
          ))}
        </ScrollView>
      </View>
      {sel ? (
        <Pressable style={[st.peek, { borderLeftColor: sel.colour }]} onPress={sel.open} accessibilityRole={sel.open ? 'button' : undefined}>
          <Row style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}>
            <Txt v="h3" style={{ flex: 1 }} numberOfLines={1}>{sel.title}</Txt>
            <Pressable onPress={() => setSelected(null)} hitSlop={12} accessibilityLabel="Close">
              <Txt v="label">Close</Txt>
            </Pressable>
          </Row>
          <Txt v="mono" style={{ color: sel.colour }}>{sel.meta.toUpperCase()}</Txt>
          <Txt v="muted">{sel.body}</Txt>
          {sel.open ? <Txt v="label" style={{ color: sel.colour }}>Open event ›</Txt> : null}
        </Pressable>
      ) : null}
    </View>
  );
}

const st = StyleSheet.create({
  hud: { position: 'absolute', left: 0, right: 0, top: 0, paddingHorizontal: 14 },
  brand: { backgroundColor: 'rgba(11,15,23,0.88)', borderColor: C.kerb, borderWidth: 1, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6 },
  live: { backgroundColor: C.neon, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 5 },
  chipBg: { backgroundColor: 'rgba(11,15,23,0.88)', borderRadius: 4 },
  peek: {
    position: 'absolute', left: 12, right: 12, bottom: 12, backgroundColor: 'rgba(19,26,38,0.97)', borderColor: C.kerb, borderWidth: 1,
    borderLeftWidth: 3, borderRadius: 8, padding: 14, gap: 6,
  },
});
