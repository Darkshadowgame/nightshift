import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import { NightMap } from '../../components/NightMap';
import type { MapPin } from '../../components/mapTypes';
import { Button, Card, Chip, Row, Section, Txt, s as ui } from '../../components/ui';
import { BAN_ZONES } from '../../data/seed';
import { banZoneAt, banZoneWarning, canChangePlan, canMoveStop, canRemoveStop, isHost, type PlanChange } from '../../lib/events';
import { formatTime } from '../../lib/format';
import { useStore } from '../../lib/store';
import type { LatLng } from '../../lib/types';
import { C } from '../../theme';

type Selected = number | 'new';

/** Rolling meets: hosts rename, move, remove or add stops on the night. */
export default function ChangePlan() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { events, me, crews, users, now, changePlan } = useStore();
  const ev = events.find((e) => e.id === id);
  const [selected, setSelected] = useState<Selected>(() => (ev ? Math.min(ev.currentStop + 1, ev.stops.length - 1) : 0));
  const [name, setName] = useState('');
  const [pending, setPending] = useState<LatLng | null>(null);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ text: string; warning?: string } | null>(null);

  if (!ev || !isHost(ev, me, crews)) {
    return (
      <View style={{ flex: 1, padding: 16 }}>
        <Txt>Only hosts can change the plan.</Txt>
      </View>
    );
  }
  const allowed = canChangePlan(ev, now);
  if (!allowed.ok) {
    return (
      <View style={{ flex: 1, padding: 16 }}>
        <Card accent={C.alert}>
          <Txt>{allowed.reason}</Txt>
        </Card>
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

  function apply(change: PlanChange, text: string) {
    setError(null);
    try {
      const r = changePlan(ev!.id, change);
      setDone({ text, warning: r.warning });
      setPending(null);
      setName('');
      setConfirmRemove(false);
      if (change.kind === 'add') setSelected(ev!.stops.length);
      if (change.kind === 'remove') setSelected(Math.max(0, index - 1));
    } catch (e) {
      setDone(null);
      setError(e instanceof Error ? e.message : 'That change did not work.');
    }
  }

  function status(i: number): string {
    if (i < ev!.currentStop) return 'LEFT';
    if (i === ev!.currentStop) return 'HERE NOW';
    return 'NOT REVEALED';
  }

  const pins: MapPin[] = ev.stops.flatMap((st, i) =>
    st.at
      ? [{ id: st.id, at: st.at, glyph: 'rolling' as const, colour: i === index ? C.sodium : i < ev.currentStop ? C.kerbHi : C.chalk, title: st.name, size: i === index ? 40 : 30 }]
      : [],
  );
  const centre = stop?.at ?? ev.stops[ev.currentStop]?.at ?? ev.area;
  const canPlace = selected === 'new' || !!move?.ok;

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 18, paddingBottom: 60 }} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
      <Txt v="muted">
        Every change is logged for the hosts. Everyone going gets a chat line saying the plan changed, never where. Stops after the current one stay hidden until you move on.
      </Txt>

      <Row gap={6}>
        {ev.stops.map((st, i) => (
          <Chip key={st.id} label={`${i + 1}. ${st.name}`} on={selected === i} onPress={() => select(i)} strike={i < ev.currentStop} />
        ))}
        <Chip label="+ New stop" on={selected === 'new'} onPress={() => select('new')} colour={C.neon} />
      </Row>

      <View style={{ height: 260, borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: canPlace ? C.sodium : C.kerb }}>
        <NightMap
          key={`${selected}`}
          pins={pins}
          circles={BAN_ZONES.map((z) => ({ id: z.id, centre: z.centre, radiusMiles: z.radiusMiles, colour: C.alert }))}
          paths={[{ id: 'line', coords: ev.stops.flatMap((s) => (s.at ? [s.at] : [])), colour: C.kerbHi, dashed: true }]}
          centre={centre}
          span={0.3}
          picked={pending}
          onLongPress={canPlace ? (at) => { setPending(at); setDone(null); } : undefined}
        />
      </View>

      {error ? (
        <Card accent={C.alert}>
          <Txt>{error}</Txt>
        </Card>
      ) : null}
      {done ? (
        <Card accent={done.warning ? C.alert : C.lime}>
          <Txt>{done.text} Everyone going got “Hosts changed the plan”.</Txt>
          {done.warning ? <Txt v="muted">{done.warning}</Txt> : null}
        </Card>
      ) : null}

      {stop ? (
        <Section title={`Stop ${index + 1}`} right={<Txt v="mono" style={{ color: index === ev.currentStop ? C.neon : C.fog }}>{status(index)}{checkedIn ? ` · ${checkedIn} CHECKED IN` : ''}</Txt>}>
          <Card>
            <Txt v="label">Rename</Txt>
            <Row style={{ flexWrap: 'nowrap' }}>
              <TextInput value={name} onChangeText={setName} placeholder={stop.name} placeholderTextColor={C.fog} style={[ui.input, { flex: 1 }]} />
              <Button label="Rename" kind="ghost" disabled={!name.trim()} onPress={() => apply({ kind: 'rename', stopId: stop.id, name }, `Renamed to ${name.trim()}.`)} />
            </Row>
          </Card>
          <Card>
            <Txt v="label">Move</Txt>
            {move?.ok ? (
              pending ? (
                <>
                  {pendingZone ? (
                    <Card accent={C.alert} style={{ backgroundColor: C.asphalt }}>
                      <Txt>{banZoneWarning('The new place', pendingZone)}</Txt>
                    </Card>
                  ) : (
                    <Txt v="muted">Not in a known ban zone.</Txt>
                  )}
                  <Row style={{ flexWrap: 'nowrap' }}>
                    <Button label={pendingZone ? 'Move here anyway' : 'Move here'} style={{ flex: 1 }} onPress={() => apply({ kind: 'move', stopId: stop.id, at: pending }, `Moved ${stop.name}.`)} />
                    <Button label="Cancel" kind="ghost" onPress={() => setPending(null)} />
                  </Row>
                </>
              ) : (
                <Txt v="muted">Long-press the map where it should go.</Txt>
              )
            ) : (
              <Txt v="muted">{move?.ok === false ? move.reason : ''}</Txt>
            )}
          </Card>
          <Card>
            <Txt v="label">Remove</Txt>
            {remove?.ok ? (
              confirmRemove ? (
                <Row style={{ flexWrap: 'nowrap' }}>
                  <Button label={`Remove ${stop.name}`} kind="danger" style={{ flex: 1 }} onPress={() => apply({ kind: 'remove', stopId: stop.id }, `Removed ${stop.name}.`)} />
                  <Button label="Keep" kind="ghost" onPress={() => setConfirmRemove(false)} />
                </Row>
              ) : (
                <Button label="Remove this stop" kind="danger" onPress={() => setConfirmRemove(true)} />
              )
            ) : (
              <Txt v="muted">{remove?.ok === false ? remove.reason : ''}</Txt>
            )}
          </Card>
        </Section>
      ) : (
        <Section title="New stop">
          <Card>
            <TextInput value={name} onChangeText={setName} placeholder="Name this spot" placeholderTextColor={C.fog} style={ui.input} />
            {pending ? (
              pendingZone ? (
                <Card accent={C.alert} style={{ backgroundColor: C.asphalt }}>
                  <Txt>{banZoneWarning(name.trim() || 'The new stop', pendingZone)}</Txt>
                </Card>
              ) : (
                <Txt v="muted">Not in a known ban zone.</Txt>
              )
            ) : (
              <Txt v="muted">Long-press the map to place it. It goes on the end of the route.</Txt>
            )}
            <Button
              label={pendingZone ? 'Add stop anyway' : 'Add stop'}
              disabled={!pending}
              onPress={() => pending && apply({ kind: 'add', name, at: pending }, `Added ${name.trim() || 'a new stop'}.`)}
            />
          </Card>
        </Section>
      )}

      <Section title={`Change log (${ev.changes?.length ?? 0})`}>
        <Card>
          {(ev.changes ?? []).length === 0 ? <Txt v="muted">No changes yet.</Txt> : null}
          {[...(ev.changes ?? [])].reverse().map((c) => (
            <View key={c.id} style={{ gap: 2 }}>
              <Txt v="label">
                {c.by === me ? 'You' : `@${users.find((u) => u.id === c.by)?.handle ?? c.by}`} · {formatTime(c.at)}
              </Txt>
              <Txt>{c.text}</Txt>
              {c.banZone ? <Txt v="mono" style={{ color: C.alert }}>IN THE {c.banZone.toUpperCase()} BAN ZONE</Txt> : null}
            </View>
          ))}
        </Card>
      </Section>
    </ScrollView>
  );
}
