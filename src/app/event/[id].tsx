import * as Location from 'expo-location';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useLayoutEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, TextInput, View } from 'react-native';
import { NightMap } from '../../components/NightMap';
import type { MapPath, MapPin } from '../../components/mapTypes';
import { Pin } from '../../components/Pin';
import { Button, Card, ClassBadge, Row, Section, Txt, s as ui } from '../../components/ui';
import { BAN_ZONES } from '../../data/seed';
import { classOf } from '../../lib/classes';
import { canCheckIn, canSeeStop, EVENT_LABELS, isHost, moveOnAudience, phaseOf, revealTime } from '../../lib/events';
import { roleOf } from '../../lib/eventView';
import { formatRelative, formatTime, formatWhen } from '../../lib/format';
import { milesBetween } from '../../lib/geo';
import { describeFilter } from '../../lib/invites';
import { useStore } from '../../lib/store';
import type { LatLng } from '../../lib/types';
import { C, EVENT_COLOURS } from '../../theme';

export default function EventScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const nav = useNavigation();
  const store = useStore();
  const { events, me, crews, users, builds, now, chat, settings } = store;
  const e = events.find((x) => x.id === id);
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const [picked, setPicked] = useState<LatLng | null>(null);
  const [pickedName, setPickedName] = useState('');
  const [busy, setBusy] = useState(false);

  useLayoutEffect(() => {
    if (e) nav.setOptions({ title: EVENT_LABELS[e.type] });
  }, [nav, e]);

  const messages = useMemo(() => chat.filter((m) => m.eventId === id), [chat, id]);

  if (!e) {
    return (
      <View style={{ flex: 1, padding: 16 }}>
        <Txt>This event no longer exists.</Txt>
      </View>
    );
  }

  const ev = e;
  const colour = EVENT_COLOURS[ev.type];
  const host = isHost(ev, me, crews);
  const role = roleOf(ev, me, crews, users, builds);
  const going = ev.going.includes(me);
  const phase = phaseOf(ev, now);
  const crew = ev.crewId ? crews.find((c) => c.id === ev.crewId) : undefined;
  const hostNames = ev.hostIds.map((h) => (h === me ? 'You' : `@${users.find((u) => u.id === h)?.handle ?? h}`));
  const myCheckIns = ev.checkIns[me] ?? [];
  const current = ev.type === 'rolling' ? ev.currentStop : 0;
  const nextStop = ev.stops[ev.currentStop + 1];
  const audience = moveOnAudience(ev, ev.currentStop).length;

  const visibleStops = ev.stops.map((st, i) => ({ st, i, visible: canSeeStop(ev, i, me, crews, now) }));
  const mapPins: MapPin[] = visibleStops
    .filter((x) => x.visible && x.st.at)
    .map((x) => ({ id: x.st.id, at: x.st.at!, glyph: ev.type, colour: x.i === current ? colour : C.fog, title: x.st.name, size: x.i === current ? 40 : 30 }));
  const mapPaths: MapPath[] =
    ev.type === 'cruise' && mapPins.length > 1 ? [{ id: 'route', coords: mapPins.map((p) => p.at), colour, dashed: true }] : [];
  const anyVisible = mapPins.length > 0;

  async function position(): Promise<LatLng | null> {
    if (settings.simulateGps) return null;
    const perm = await Location.requestForegroundPermissionsAsync();
    if (!perm.granted) return null;
    const p = await Location.getCurrentPositionAsync({});
    return { lat: p.coords.latitude, lng: p.coords.longitude };
  }

  async function doCheckIn() {
    setError(null);
    setBusy(true);
    try {
      const pos = await position();
      const result = canCheckIn(ev, current, me, crews, new Date(), pos, settings.simulateGps);
      if (!result.ok) setError(result.reason);
      else store.checkIn(ev.id, current);
    } catch {
      setError('Could not read your location. Try again outside.');
    } finally {
      setBusy(false);
    }
  }

  function doMoveOn() {
    setError(null);
    if (nextStop?.at) {
      store.moveOn(ev.id);
      return;
    }
    setPicking(true);
  }

  function confirmPicked() {
    if (!picked) {
      setError('Long-press the map to drop the next spot.');
      return;
    }
    store.moveOn(ev.id, { name: pickedName.trim() || 'Next spot', at: picked });
    setPicking(false);
    setPicked(null);
    setPickedName('');
  }

  const banWarning = picked ? BAN_ZONES.find((z) => milesBetween(z.centre, picked) <= z.radiusMiles) : undefined;
  const mapCentre = picking ? (ev.stops[current]?.at ?? ev.area) : (mapPins.find((p) => p.id === ev.stops[current]?.id)?.at ?? mapPins[0]?.at ?? ev.area);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 18, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <View style={{ gap: 6 }}>
          <Row>
            <Txt v="eyebrow" style={{ color: colour }}>{EVENT_LABELS[ev.type]}</Txt>
            {phase === 'live' ? <Txt v="eyebrow" style={{ color: C.neon }}>· Live now</Txt> : null}
            {phase === 'cancelled' ? <Txt v="eyebrow" style={{ color: C.alert }}>· Cancelled</Txt> : null}
          </Row>
          <Txt v="h1">{ev.title}</Txt>
          <Txt v="mono" style={{ color: C.chalk }}>
            {formatWhen(ev.startsAt, now).toUpperCase()}
            {ev.endsAt ? ` – ${formatTime(ev.endsAt)}` : ''} · {ev.areaName.toUpperCase()}
            {ev.routeMiles ? ` · ${ev.routeMiles} MI` : ''}
          </Txt>
          {ev.description ? <Txt v="muted">{ev.description}</Txt> : null}
        </View>

        <View style={{ height: picking ? 320 : 220, borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: C.kerb }}>
          <NightMap
            pins={anyVisible ? mapPins : [{ id: 'area', at: ev.area, glyph: 'locked', colour, title: ev.areaName }]}
            paths={mapPaths}
            circles={anyVisible ? [] : [{ id: 'area', centre: ev.area, radiusMiles: 3, colour }]}
            centre={mapCentre}
            span={ev.type === 'cruise' ? 0.25 : 0.12}
            onLongPress={picking ? setPicked : undefined}
            picked={picking ? picked : null}
          />
        </View>

        {picking ? (
          <Card accent={C.neon}>
            <Txt v="h3">Where next?</Txt>
            <Txt v="muted">Long-press the map to drop the spot, then name it. Only the {audience} people checked in here get told.</Txt>
            <TextInput
              value={pickedName}
              onChangeText={setPickedName}
              placeholder="Name the spot, e.g. Ventura Park"
              placeholderTextColor={C.fog}
              style={ui.input}
            />
            {banWarning ? (
              <Txt v="muted" style={{ color: C.alert }}>
                Warning: this spot is inside the {banWarning.name} meet-ban zone. {banWarning.note}
              </Txt>
            ) : null}
            <Row>
              <Button label="Send everyone here" kind="neon" onPress={confirmPicked} style={{ flex: 1 }} />
              <Button label="Back" kind="ghost" onPress={() => { setPicking(false); setPicked(null); }} />
            </Row>
          </Card>
        ) : null}

        {error ? (
          <Card accent={C.alert}>
            <Txt>{error}</Txt>
          </Card>
        ) : null}

        {phase !== 'over' && phase !== 'cancelled' && !picking ? (
          <View style={{ gap: 10 }}>
            {!host ? (
              going ? (
                <Button label="Going ✓  (tap to drop out)" kind="ghost" onPress={() => store.setGoing(ev.id, false)} />
              ) : (
                <Button
                  label={role === 'invited' || role === 'public' ? "I'm going" : "Request to go"}
                  onPress={() => store.setGoing(ev.id, true)}
                />
              )
            ) : null}
            {(going || host) && canSeeStop(ev, current, me, crews, now) ? (
              myCheckIns.includes(ev.stops[current]?.id) ? (
                <Card accent={C.lime}>
                  <Txt>Checked in at {ev.stops[current].name}.{ev.type === 'rolling' ? " You'll get the next spot when the hosts move on." : ''}</Txt>
                </Card>
              ) : (
                <Button label={busy ? 'Checking…' : `Check in at ${ev.stops[current]?.name ?? 'the stop'}`} kind="neon" onPress={doCheckIn} disabled={busy} />
              )
            ) : null}
            {host && ev.type === 'rolling' && phase !== 'upcoming' ? (
              <Button label={nextStop?.at ? `Move on to ${nextStop.name}` : 'Move on: pick the next spot'} onPress={doMoveOn} />
            ) : null}
          </View>
        ) : null}

        <Section title={ev.type === 'cruise' ? 'Route' : ev.type === 'rolling' ? 'Stops' : 'Where'}>
          <Card>
            {visibleStops.map(({ st, i, visible }) => {
              const done = myCheckIns.includes(st.id);
              const isCurrent = ev.type === 'rolling' && i === ev.currentStop;
              const label = visible
                ? st.name
                : st.at
                  ? ev.type === 'rolling' && i > 0
                    ? 'Revealed when the hosts move on'
                    : `Unlocks ${formatRelative(revealTime(ev).toISOString(), now)} for people going`
                  : 'Picked on the night';
              return (
                <Row key={st.id} style={{ flexWrap: 'nowrap', alignItems: 'flex-start' }} gap={10}>
                  <Pin glyph={visible ? ev.type : 'locked'} colour={isCurrent ? colour : visible ? C.chalk : C.fog} size={26} />
                  <View style={{ flex: 1 }}>
                    <Txt style={!visible ? { color: C.fog } : undefined}>{label}</Txt>
                    <Txt v="mono">
                      {[
                        isCurrent ? 'HERE NOW' : null,
                        done ? 'CHECKED IN' : null,
                        st.revealedAt && host ? `MOVED ON ${formatRelative(st.revealedAt, now).toUpperCase()}` : null,
                        host && st.note ? st.note.toUpperCase() : null,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </Txt>
                  </View>
                </Row>
              );
            })}
          </Card>
        </Section>

        <Section title="Who's invited">
          <Card>
            <Txt>{describeFilter(ev.filter)}</Txt>
            <Txt v="muted">
              Hosted by {crew ? `${crew.name} (any member) with ` : ''}
              {hostNames.join(', ')}
            </Txt>
          </Card>
        </Section>

        <Section title={`Going (${ev.going.length})`}>
          <Card>
            {ev.going.map((uid) => {
              const u = users.find((x) => x.id === uid);
              const b = builds.find((x) => x.ownerId === uid);
              const checked = (ev.checkIns[uid] ?? []).length;
              return (
                <Row key={uid} style={{ flexWrap: 'nowrap' }} gap={10}>
                  {b ? <ClassBadge letter={classOf(b)} size="sm" /> : <View style={{ width: 22 }} />}
                  <View style={{ flex: 1 }}>
                    <Txt numberOfLines={1}>{uid === me ? 'You' : `@${u?.handle ?? uid}`}</Txt>
                    <Txt v="muted" numberOfLines={1}>{b ? `${b.make} ${b.model}` : 'No build yet'}</Txt>
                  </View>
                  {checked > 0 ? <Txt v="mono" style={{ color: C.lime }}>{checked} ✓</Txt> : null}
                </Row>
              );
            })}
          </Card>
        </Section>

        <Section title="Chat">
          <Card>
            {messages.length === 0 ? <Txt v="muted">No messages yet.</Txt> : null}
            {messages.map((m) => (
              <View key={m.id} style={{ gap: 2 }}>
                <Txt v="label" style={{ color: m.userId === me ? C.neon : C.sodium }}>
                  {m.userId === me ? 'You' : `@${users.find((u) => u.id === m.userId)?.handle ?? m.userId}`} · {formatTime(m.at)}
                </Txt>
                <Txt>{m.text}</Txt>
              </View>
            ))}
            <Row style={{ flexWrap: 'nowrap' }}>
              <TextInput
                value={message}
                onChangeText={setMessage}
                placeholder="Message everyone going"
                placeholderTextColor={C.fog}
                style={[ui.input, { flex: 1 }]}
                returnKeyType="send"
                onSubmitEditing={() => {
                  if (message.trim()) store.sendChat(ev.id, message.trim());
                  setMessage('');
                }}
              />
              <Button
                label="Send"
                kind="ghost"
                onPress={() => {
                  if (message.trim()) store.sendChat(ev.id, message.trim());
                  setMessage('');
                }}
              />
            </Row>
            <Txt v="muted" style={{ fontSize: 12 }}>Chat stays on this phone until the app has a backend.</Txt>
          </Card>
        </Section>

        {host && phase !== 'over' && phase !== 'cancelled' ? (
          <Button
            label="Cancel event"
            kind="danger"
            onPress={() => {
              store.cancelEvent(ev.id);
              router.back();
            }}
          />
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
