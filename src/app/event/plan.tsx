import { useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { MapPicker } from '../../components/MapPicker';
import { NightMap } from '../../components/NightMap';
import type { MapPin } from '../../components/mapTypes';
import { nameForPlace } from '../../lib/location';
import { shouldAutoName } from '../../lib/placeNames';
import { Button, Card, Chip, ConfirmBox, EmptyState, InlineError, Row, Section, Txt, s as ui } from '../../components/ui';
import { BAN_ZONES } from '../../data/seed';
import { zonePins, zoneShapes } from '../../lib/zones';
import { ZoneNotice } from '../../components/ZoneCard';
import { banZoneAt, canChangePlan, canMoveStop, canRemoveStop, isHost, type PlanChange } from '../../lib/events';
import { formatTime } from '../../lib/format';
import { useStore } from '../../lib/store';
import { useNow } from '../../lib/clock';
import type { LatLng } from '../../lib/types';
import { BRAND, C, RADIUS, STATE } from '../../theme';

/** Ban zones drawn on the map: circles, and council outlines for borough-wide orders. */
const BAN_SHAPES = zoneShapes(BAN_ZONES, STATE.warning);
const BAN_PINS = zonePins(BAN_ZONES, STATE.warning);

type Selected = number | 'new';

/** Rolling meets: hosts rename, move, remove or add stops on the night. */
export default function ChangePlan() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { events, me, crews, users, changePlan } = useStore();
  const now = useNow();
  const ev = events.find((e) => e.id === id);
  const [selected, setSelected] = useState<Selected>(() => (ev ? Math.min(ev.currentStop + 1, ev.stops.length - 1) : 0));
  const [name, setName] = useState('');
  const [pending, setPending] = useState<LatLng | null>(null);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ text: string; warning?: string } | null>(null);
  const [picking, setPicking] = useState(false);
  const autoName = useRef<string | undefined>(undefined);

  if (!ev || !isHost(ev, me, crews)) {
    return (
      <View style={{ flex: 1, padding: 16 }}>
        <EmptyState title="Only hosts can change the plan" body="Ask a host of this event to move or add stops." />
      </View>
    );
  }
  const allowed = canChangePlan(ev, now);
  if (!allowed.ok) {
    return (
      <View style={{ flex: 1, padding: 16 }}>
        <EmptyState title="Can't change the plan now" body={allowed.reason} />
      </View>
    );
  }

  const index = selected === 'new' ? -1 : Math.min(selected, ev.stops.length - 1);
  const stop = index >= 0 ? ev.stops[index] : undefined;
  const move = stop ? canMoveStop(ev, index) : null;
  const remove = stop ? canRemoveStop(ev, index) : null;
  const pendingZone = pending ? banZoneAt(pending, BAN_ZONES) : undefined;
  const checkedIn = stop ? Object.values(ev.checkIns).filter((ids) => ids.includes(stop.id)).length : 0;

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
      setError(e instanceof Error ? e.message : 'That change did not work.');
    }
  }

  function status(i: number): string {
    if (i < ev!.currentStop) return 'Left';
    if (i === ev!.currentStop) return 'Here now';
    return 'Locked';
  }

  const pins: MapPin[] = ev.stops.flatMap((st, i) =>
    st.at
      ? [{ id: st.id, at: st.at, glyph: 'rolling' as const, colour: i === index ? BRAND : i < ev.currentStop ? C.kerbHi : C.chalk, title: st.name, size: i === index ? 40 : 30 }]
      : [],
  );
  const centre = stop?.at ?? ev.stops[ev.currentStop]?.at ?? ev.area;
  const canPlace = selected === 'new' || !!move?.ok;

  /** Back from the full-screen picker: the new place waits for "Move here" / "Add stop". */
  function picked(at: LatLng, knownName?: string) {
    setPicking(false);
    setPending(at);
    setDone(null);
    // A new stop is named after the known place or the street and town; edit it if you like.
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
    else nameForPlace(at).then(takeName);
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 18, paddingBottom: 60 }} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive" automaticallyAdjustKeyboardInsets>
      <Txt v="muted">
        Every change is logged for the hosts. Everyone going gets a chat line saying the plan changed, never where. Stops after the current one stay hidden until you move on.
      </Txt>

      <Row gap={6}>
        {ev.stops.map((st, i) => (
          <Chip key={st.id} label={`${i + 1}. ${st.name}`} on={selected === i} onPress={() => select(i)} strike={i < ev.currentStop} />
        ))}
        <Chip label="+ New stop" on={selected === 'new'} onPress={() => select('new')} />
      </Row>

      <Pressable
        onPress={canPlace ? () => setPicking(true) : undefined}
        disabled={!canPlace}
        accessibilityRole="button"
        accessibilityLabel={canPlace ? 'Open the map to choose the place' : 'Map of the stops'}
        style={{ height: 220, borderRadius: RADIUS.sheet, overflow: 'hidden', borderWidth: 1, borderColor: canPlace ? BRAND : C.kerb }}
      >
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <NightMap
            key={`${selected}`}
            pins={[...BAN_PINS, ...pins]}
            circles={BAN_SHAPES.circles}
            polygons={BAN_SHAPES.polygons}
            paths={[{ id: 'line', coords: ev.stops.flatMap((s) => (s.at ? [s.at] : [])), colour: C.kerbHi, dashed: true }]}
            centre={pending ?? centre}
            span={0.3}
            follow
            picked={pending}
          />
        </View>
      </Pressable>

      {done ? (
        <Card accent={done.warning ? STATE.warning : STATE.success}>
          <Txt>{done.text} Everyone going got “Hosts changed the plan”.</Txt>
          {done.warning ? <Txt v="muted">{done.warning}</Txt> : null}
        </Card>
      ) : null}

      {stop ? (
        <Section title={`Stop ${index + 1}`} right={<Txt v="mono" scale="chrome" style={{ color: index === ev.currentStop ? C.chalk : C.fog }}>{status(index)}{checkedIn ? ` · ${checkedIn} checked in` : ''}</Txt>}>
          <Card>
            <Txt v="label">Rename</Txt>
            <Row style={{ flexWrap: 'nowrap' }}>
              <TextInput value={name} onChangeText={setName} placeholder={stop.name} placeholderTextColor={C.fog} style={[ui.input, { flex: 1 }]} />
              <Button label="Rename" kind="secondary" size="sm" disabled={!name.trim()} onPress={() => apply({ kind: 'rename', stopId: stop.id, name }, `Renamed to ${name.trim()}.`)} />
            </Row>
          </Card>
          <Card>
            <Txt v="label">Move</Txt>
            {move?.ok ? (
              pending ? (
                <>
                  {pendingZone ? (
                    <ZoneNotice zone={pendingZone} subject="The new stop" />
                  ) : (
                    <Txt v="muted">Not in a known ban zone.</Txt>
                  )}
                  <Row style={{ flexWrap: 'nowrap' }}>
                    <Button label={pendingZone ? 'Move here anyway' : 'Move here'} style={{ flex: 1 }} onPress={() => apply({ kind: 'move', stopId: stop.id, at: pending }, `Moved ${stop.name}.`)} />
                    <Button label="Not now" kind="secondary" onPress={() => setPending(null)} />
                  </Row>
                  <Button label="Pick again on the map" kind="secondary" onPress={() => setPicking(true)} />
                </>
              ) : (
                <Button label="Choose the new stop on the map" onPress={() => setPicking(true)} />
              )
            ) : (
              <Txt v="muted">{move?.ok === false ? move.reason : ''}</Txt>
            )}
          </Card>
          <Card>
            <Txt v="label">Remove</Txt>
            {remove?.ok ? (
              confirmRemove ? (
                <ConfirmBox
                  message={`Remove ${stop.name}? Everyone going gets a chat line that the plan changed.`}
                  verb="Remove"
                  onConfirm={() => apply({ kind: 'remove', stopId: stop.id }, `Removed ${stop.name}.`)}
                  onCancel={() => setConfirmRemove(false)}
                />
              ) : (
                <Button label="Remove this stop" kind="danger" onPress={() => setConfirmRemove(true)} />
              )
            ) : (
              <Txt v="muted">{remove?.ok === false ? remove.reason : ''}</Txt>
            )}
          </Card>
          <InlineError message={error} />
        </Section>
      ) : (
        <Section title="New stop">
          <Card>
            <TextInput value={name} onChangeText={setName} placeholder="Name this stop" placeholderTextColor={C.fog} style={ui.input} />
            {pending ? (
              pendingZone ? (
                <ZoneNotice zone={pendingZone} subject={name.trim() || 'The new stop'} />
              ) : (
                <Txt v="muted">Not in a known ban zone.</Txt>
              )
            ) : (
              <Txt v="muted">It goes after the last stop.</Txt>
            )}
            <Button label={pending ? 'Pick again on the map' : 'Choose on the map'} kind="secondary" onPress={() => setPicking(true)} />
            <Button
              label={pendingZone ? 'Add stop anyway' : 'Add stop'}
              disabled={!pending}
              onPress={() => pending && apply({ kind: 'add', name, at: pending }, `Added ${name.trim() || 'a new stop'}.`)}
            />
            <InlineError message={error} />
          </Card>
        </Section>
      )}

      <MapPicker
        visible={picking}
        mode="point"
        title={stop ? `MOVE ${stop.name.toUpperCase()}` : 'PLACE THE NEW STOP'}
        hint="Move the map so the crosshair is on the new stop, or tap a grey pin to use a known place."
        confirmLabel={stop ? 'Move it here' : 'Set stop here'}
        start={pending ?? centre}
        span={0.06}
        initial={pending ? [pending] : stop?.at ? [stop.at] : []}
        showKinds={['venue', 'track', 'photo']}
        snap
        zones
        extraPins={pins.filter((p) => p.id !== stop?.id)}
        extraPaths={[{ id: 'line', coords: ev.stops.flatMap((s) => (s.at ? [s.at] : [])), colour: C.kerbHi, dashed: true }]}
        onDone={([s]) => (s ? picked(s.at, s.name) : setPicking(false))}
        onCancel={() => setPicking(false)}
      />

      <Section title={`Change log (${ev.changes?.length ?? 0})`}>
        <Card>
          {(ev.changes ?? []).length === 0 ? <Txt v="muted">No changes yet.</Txt> : null}
          {[...(ev.changes ?? [])].reverse().map((c) => (
            <View key={c.id} style={{ gap: 2 }}>
              <Txt v="label">
                {c.by === me ? 'You' : `@${users.find((u) => u.id === c.by)?.handle ?? c.by}`} · {formatTime(c.at)}
              </Txt>
              <Txt>{c.text}</Txt>
              {c.banZone ? <Txt v="mono" style={{ color: STATE.warning }}>In the {c.banZone} ban zone</Txt> : null}
            </View>
          ))}
        </Card>
      </Section>
    </ScrollView>
  );
}
