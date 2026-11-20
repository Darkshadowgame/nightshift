import { useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Callout, Field, MediaFrame, PAGE, TextField } from '../../components/Detail';
import { Button, ChoiceGroup, ConfirmSheet, displayHandle, DsText, EmptyState, ErrorState, Press, Section, Tag } from '../../components/ds';
import { MapPicker } from '../../components/MapPicker';
import type { MapPin } from '../../components/mapTypes';
import { NightMap } from '../../components/NightMap';
import { ZoneNotice } from '../../components/ZoneCard';
import { BAN_ZONES } from '../../data/seed';
import { useNow } from '../../lib/clock';
import { banZoneAt, canChangePlan, canMoveStop, canRemoveStop, isHost, type PlanChange } from '../../lib/events';
import { formatTime } from '../../lib/format';
import { nameForPlace } from '../../lib/location';
import { fallbackPointName, shouldAutoName } from '../../lib/placeNames';
import { areaNameNear } from '../../lib/profile';
import { visibleSpots } from '../../lib/spots';
import { useStore } from '../../lib/store';
import type { LatLng } from '../../lib/types';
import { banConfirmText, zoneKind, zoneShapes } from '../../lib/zones';
import { COLOR, EVENT_COLOURS, SPACING } from '../../theme';

/** Meet bans drawn on the map: outlines only, explained in one line under it (Review 13: no unexplained hexagons). */
const BAN_SHAPES = zoneShapes(BAN_ZONES, COLOR.state.warning);

type Selected = number | 'new';

/** Rolling meets: hosts rename, move, remove or add meet points on the night. */
export default function ChangePlan() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { events, me, crews, users, changePlan, spots } = useStore();
  const now = useNow();
  const ev = events.find((e) => e.id === id);
  const [selected, setSelected] = useState<Selected>(() => (ev ? Math.min(ev.currentStop + 1, ev.stops.length - 1) : 0));
  const [name, setName] = useState('');
  const [pending, setPending] = useState<LatLng | null>(null);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ text: string; warning?: string } | null>(null);
  const [picking, setPicking] = useState(false);
  /** The meet-ban warning before moving or adding a point inside one (warn, never block: owner 9.3). */
  const [askBan, setAskBan] = useState<{ verb: string; run: () => void } | null>(null);
  const autoName = useRef<string | undefined>(undefined);

  if (!ev || !isHost(ev, me, crews)) {
    return (
      <View style={{ flex: 1, padding: SPACING.screen, backgroundColor: COLOR.surface.bg }}>
        <EmptyState title="Only hosts can change the plan" body="Ask a host of this event to move or add meet points." />
      </View>
    );
  }
  const allowed = canChangePlan(ev, now);
  if (!allowed.ok) {
    return (
      <View style={{ flex: 1, padding: SPACING.screen, backgroundColor: COLOR.surface.bg }}>
        <EmptyState title="Can't change the plan now" body={allowed.reason} />
      </View>
    );
  }

  const index = selected === 'new' ? -1 : Math.min(selected, ev.stops.length - 1);
  const point = index >= 0 ? ev.stops[index] : undefined;
  const move = point ? canMoveStop(ev, index) : null;
  const remove = point ? canRemoveStop(ev, index) : null;
  const pendingZone = pending ? banZoneAt(pending, BAN_ZONES) : undefined;
  const checkedIn = point ? Object.values(ev.checkIns).filter((ids) => ids.includes(point.id)).length : 0;

  function select(s: Selected) {
    setSelected(s);
    setName('');
    setPending(null);
    setConfirmRemove(false);
    setError(null);
  }

  async function apply(change: PlanChange, text: string) {
    setError(null);
    const stopsBefore = ev!.stops.length;
    try {
      const r = await changePlan(ev!.id, change);
      setDone({ text, warning: r.warning });
      setPending(null);
      setName('');
      setConfirmRemove(false);
      if (change.kind === 'add') setSelected(stopsBefore);
      if (change.kind === 'remove') setSelected(Math.max(0, index - 1));
    } catch (e) {
      setDone(null);
      setError(e instanceof Error ? e.message : "Couldn't make that change.");
    }
  }

  function status(i: number): string {
    if (i < ev!.currentStop) return 'Left';
    if (i === ev!.currentStop) return 'Here now';
    return 'Not shown yet';
  }

  const pins: MapPin[] = ev.stops.flatMap((st, i) =>
    st.at
      ? [{ id: st.id, at: st.at, glyph: 'rolling' as const, colour: i === index ? EVENT_COLOURS.rolling : i < ev.currentStop ? COLOR.surface.raisedHi : COLOR.text.primary, title: st.name, size: i === index ? 40 : 30 }]
      : [],
  );
  const line = ev.stops.flatMap((s) => (s.at ? [s.at] : []));
  const centre = point?.at ?? ev.stops[ev.currentStop]?.at ?? ev.area;
  const canPlace = selected === 'new' || !!move?.ok;

  /** Inside a meet ban, ask first (the same confirm as posting, owner 9.3); else just do it. */
  function guard(verb: string, run: () => void) {
    if (pendingZone) setAskBan({ verb, run });
    else run();
  }

  /** Back from the full-screen picker: the new place waits for "Move here" / "Add meet point". */
  function picked(at: LatLng, knownName?: string) {
    setPicking(false);
    setPending(at);
    setDone(null);
    // A new point is named after the known place or the street and town; edit it if you like.
    if (selected !== 'new') return;
    const takeName = (found: string | null) => {
      if (!found) return;
      setName((n) => {
        if (!shouldAutoName(n, autoName.current)) return n;
        autoName.current = found;
        return found;
      });
    };
    if (knownName) takeName(knownName);
    // No geocoder (the web preview) or no answer: the nearest known place or town (Review 13).
    else nameForPlace(at).then((found) => takeName(found ?? fallbackPointName(at, visibleSpots(spots, me), areaNameNear(at))));
  }

  return (
    <ScrollView style={{ backgroundColor: COLOR.surface.bg }} contentContainerStyle={PAGE} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive" automaticallyAdjustKeyboardInsets>
      <DsText v="secondary">
        Every change is logged for the hosts. Everyone going gets a chat line saying the plan changed, never where. Meet points after the current one stay hidden until you move on.
      </DsText>

      <ChoiceGroup
        label="Meet point"
        options={[...ev.stops.map((st, i) => ({ key: String(i), label: `${i + 1}. ${st.name}${i < ev.currentStop ? ' (left)' : ''}` })), { key: 'new', label: 'New meet point' }]}
        value={String(selected)}
        onChange={(k) => select(k === 'new' ? 'new' : Number(k))}
      />

      <Press onPress={canPlace ? () => setPicking(true) : undefined} disabled={!canPlace} feedback="card" label={canPlace ? 'Open the map to choose the place' : 'Map of the meet points'}>
        <MediaFrame height={200}>
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <NightMap
              labels={false}
              key={`${selected}`}
              pins={pins}
              circles={BAN_SHAPES.circles}
              polygons={BAN_SHAPES.polygons}
              paths={[{ id: 'line', coords: line, colour: COLOR.surface.raisedHi, dashed: true }]}
              centre={pending ?? centre}
              span={0.3}
              follow
              picked={pending}
            />
          </View>
        </MediaFrame>
      </Press>
      <DsText v="caption">Orange outlines are meet bans.</DsText>

      {done ? (
        <Callout tone={done.warning ? 'warning' : 'success'} title={`${done.text} Everyone going got “Hosts changed the plan”.`}>
          {done.warning ?? undefined}
        </Callout>
      ) : null}

      {point ? (
        <Section title={`Meet point ${index + 1}`} right={<Tag label={`${status(index)}${checkedIn ? ` · ${checkedIn} checked in` : ''}`} tone={index === ev.currentStop ? 'live' : 'neutral'} />}>
          <Field label="Rename">
            <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
              <TextField value={name} onChangeText={setName} placeholder={point.name} style={{ flex: 1 }} accessibilityLabel="New name" />
              <Button label="Rename" tier="secondary" disabled={!name.trim()} onPress={() => apply({ kind: 'rename', stopId: point.id, name }, `Renamed to ${name.trim()}.`)} />
            </View>
          </Field>
          <Field label="Move">
            {move?.ok ? (
              pending ? (
                <View style={{ gap: SPACING.sm }}>
                  {pendingZone ? <ZoneNotice zone={pendingZone} subject="The new meet point" /> : <DsText v="secondary">Not in a known meet ban.</DsText>}
                  <Button label="Move here" block onPress={() => guard('Move', () => apply({ kind: 'move', stopId: point.id, at: pending }, `Moved ${point.name}.`))} />
                  <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
                    <Button label="Pick again" tier="secondary" style={{ flex: 1 }} block onPress={() => setPicking(true)} />
                    <Button label="Not now" tier="secondary" style={{ flex: 1 }} block onPress={() => setPending(null)} />
                  </View>
                </View>
              ) : (
                <Button label="Choose the new meet point on the map" tier="secondary" block onPress={() => setPicking(true)} />
              )
            ) : (
              <DsText v="secondary">{move?.ok === false ? move.reason : ''}</DsText>
            )}
          </Field>
          <Field label="Remove">
            {remove?.ok ? (
              <Button label="Remove this meet point" tier="destructive" block onPress={() => setConfirmRemove(true)} />
            ) : (
              <DsText v="secondary">{remove?.ok === false ? remove.reason : ''}</DsText>
            )}
          </Field>
          {error ? <ErrorState title={error} /> : null}
          <ConfirmSheet
            visible={confirmRemove}
            title="Remove meet point"
            message={`Remove ${point.name}? Everyone going gets a chat line that the plan changed.`}
            verb="Remove"
            onConfirm={() => apply({ kind: 'remove', stopId: point.id }, `Removed ${point.name}.`)}
            onCancel={() => setConfirmRemove(false)}
          />
        </Section>
      ) : (
        <Section title="New meet point">
          <TextField value={name} onChangeText={setName} placeholder="Name this meet point" accessibilityLabel="Name this meet point" />
          {pending ? (
            pendingZone ? (
              <ZoneNotice zone={pendingZone} subject={name.trim() || 'The new meet point'} />
            ) : (
              <DsText v="secondary">Not in a known meet ban.</DsText>
            )
          ) : (
            <DsText v="secondary">It goes after the last meet point.</DsText>
          )}
          <Button label={pending ? 'Pick again on the map' : 'Choose on the map'} tier="secondary" block onPress={() => setPicking(true)} />
          <Button
            label="Add meet point"
            block
            onPress={() => (pending ? guard('Add', () => apply({ kind: 'add', name, at: pending }, `Added ${name.trim() || 'a new meet point'}.`)) : setError('Choose the new meet point on the map first.'))}
          />
          {error ? <ErrorState title={error} /> : null}
        </Section>
      )}

      <ConfirmSheet
        visible={!!askBan && !!pendingZone}
        title={pendingZone && zoneKind(pendingZone) === 'injunction' ? 'Court injunction' : 'Meet ban'}
        message={pendingZone && askBan ? banConfirmText(pendingZone, askBan.verb) : ''}
        verb={askBan?.verb ?? 'Move'}
        confirmLabel={`${askBan?.verb ?? 'Move'} anyway`}
        cancelLabel="Pick again"
        safeFirst
        onConfirm={() => {
          const run = askBan?.run;
          setAskBan(null);
          run?.();
        }}
        onCancel={() => {
          setAskBan(null);
          setPicking(true);
        }}
        onDismiss={() => setAskBan(null)}
      >
        <DsText v="caption">Nightshift only warns: you're responsible for where you send people.</DsText>
      </ConfirmSheet>

      <MapPicker
        visible={picking}
        mode="point"
        title={point ? `Move ${point.name}` : 'Place the new meet point'}
        hint="Move the map to put the crosshair on it."
        confirmLabel={point ? 'Move meet point here' : 'Set meet point here'}
        start={pending ?? centre}
        span={0.06}
        initial={pending ? [pending] : point?.at ? [point.at] : []}
        showKinds={['venue', 'track', 'photo']}
        snap
        zones
        extraPins={pins.filter((p) => p.id !== point?.id)}
        extraPaths={[{ id: 'line', coords: line, colour: COLOR.surface.raisedHi, dashed: true }]}
        onDone={([s]) => (s ? picked(s.at, s.name) : setPicking(false))}
        onCancel={() => setPicking(false)}
      />

      <Section title={`Change log (${ev.changes?.length ?? 0})`}>
        {(ev.changes ?? []).length === 0 ? <EmptyState variant="inline" title="No changes yet." /> : null}
        {[...(ev.changes ?? [])].reverse().map((c) => (
          <View key={c.id} style={{ gap: SPACING.xxs }}>
            <DsText v="meta">
              {c.by === me ? 'You' : displayHandle(users.find((u) => u.id === c.by)?.handle ?? c.by)} · {formatTime(c.at)}
            </DsText>
            <DsText v="body">{c.text}</DsText>
            {c.banZone ? (
              <DsText v="caption" tone="warning">
                In the {c.banZone} meet ban
              </DsText>
            ) : null}
          </View>
        ))}
      </Section>
    </ScrollView>
  );
}
