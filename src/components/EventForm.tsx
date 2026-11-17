import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, Switch, TextInput, View } from 'react-native';
import { NightMap } from '../../components/NightMap';
import { Button, Card, Chip, Row, Section, Txt, s as ui } from '../../components/ui';
import { FILTER_BRANDS } from '../../data/catalog';
import { BAN_ZONES, SPOTS } from '../../data/seed';
import { EVENT_LABELS, isPublicType } from '../../lib/events';
import { milesBetween } from '../../lib/geo';
import { DEFAULT_FILTER, invitees } from '../../lib/invites';
import { newId, useStore } from '../../lib/store';
import { CLASS_LETTERS, type ClassLetter, type EventType, type InviteFilter, type LatLng, type Stop } from '../../lib/types';
import { C } from '../../theme';

const TYPES: EventType[] = ['cruise', 'rolling', 'meet', 'show', 'trackday'];
const DAY_CHOICES = [
  { label: 'Tonight', days: 0 },
  { label: 'Tomorrow', days: 1 },
  { label: 'In 2 days', days: 2 },
  { label: 'This weekend', days: -1 },
  { label: 'Next week', days: 7 },
];
const TIME_CHOICES = ['19:00', '20:30', '22:00', '22:30', '23:00', '23:59', '06:00', '09:00'];
const REVEAL_CHOICES = [0, 30, 60, 120];

interface DraftStop {
  key: string;
  name: string;
  at?: LatLng;
}

function startDate(days: number, time: string): Date {
  const d = new Date();
  if (days === -1) {
    const toSat = (6 - d.getDay() + 7) % 7;
    d.setDate(d.getDate() + toSat);
  } else d.setDate(d.getDate() + days);
  const [h, m] = time.split(':').map(Number);
  d.setHours(h, m, 0, 0);
  if (d.getTime() < Date.now()) d.setDate(d.getDate() + 1);
  return d;
}

export default function NewEvent() {
  const store = useStore();
  const { users, builds, me, crews } = store;
  const meUser = users.find((u) => u.id === me)!;
  const myCrew = crews.find((c) => c.id === meUser.crewId);

  const [type, setType] = useState<EventType>('cruise');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [day, setDay] = useState(0);
  const [time, setTime] = useState('22:30');
  const [stops, setStops] = useState<DraftStop[]>([
    { key: 's0', name: '' },
    { key: 's1', name: '' },
  ]);
  const [activeStop, setActiveStop] = useState(0);
  const [filter, setFilter] = useState<InviteFilter>({ ...DEFAULT_FILTER });
  const [reveal, setReveal] = useState(60);
  const [crewOwned, setCrewOwned] = useState(!!myCrew);
  const [coHosts, setCoHosts] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const placed = stops.filter((st) => st.at);
  const area: LatLng = placed.length
    ? { lat: placed.reduce((a, s) => a + s.at!.lat, 0) / placed.length, lng: placed.reduce((a, s) => a + s.at!.lng, 0) / placed.length }
    : meUser.home;
  const matches = useMemo(() => invitees(users.filter((u) => u.id !== me), builds, filter, area), [users, builds, filter, area, me]);
  const bans = placed
    .map((st) => ({ st, zone: BAN_ZONES.find((z) => milesBetween(z.centre, st.at!) <= z.radiusMiles) }))
    .filter((x) => x.zone);
  const singlePlace = type === 'meet' || type === 'show' || type === 'trackday';
  const visibleStops = singlePlace ? stops.slice(0, 1) : stops;
  const friends = users.filter((u) => u.id !== me && u.crewId === meUser.crewId);

  function setStop(i: number, patch: Partial<DraftStop>) {
    setStops((xs) => xs.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  }

  function stopLabel(i: number, n: number) {
    if (type === 'cruise') return i === 0 ? 'Start' : i === n - 1 ? 'Finish' : `Regroup ${i}`;
    if (type === 'rolling') return `Stop ${i + 1}`;
    return 'Place';
  }

  function toggleClass(l: ClassLetter) {
    setFilter((f) => ({ ...f, classes: f.classes.includes(l) ? f.classes.filter((x) => x !== l) : [...f.classes, l] }));
  }
  function toggleBrand(b: string) {
    setFilter((f) => ({ ...f, brands: f.brands.includes(b) ? f.brands.filter((x) => x !== b) : [...f.brands, b] }));
  }

  function save() {
    const used = visibleStops;
    if (!title.trim()) return setError('Give the event a name.');
    if (!used[0]?.at) return setError(`Drop the ${stopLabel(0, used.length).toLowerCase()} on the map (long-press).`);
    if (type === 'cruise' && used.filter((s) => s.at).length < 2) return setError('A cruise needs at least a start and a finish.');
    if (type === 'rolling' && used.some((s) => !s.at)) return setError('Place every stop on the map. Rolling meets are planned in full before they start.');
    if (!filter.cars && !filter.bikes && !filter.everyone) return setError('Invite cars, bikes or both.');
    const id = newId('ev');
    const finalStops: Stop[] = used
      .filter((st) => st.at)
      .map((st, i, arr) => ({
        id: `${id}-s${i}`,
        name: st.name.trim() || stopLabel(i, arr.length),
        at: st.at,
      }));
    const start = startDate(DAY_CHOICES[day].days, time);
    store.saveEvent({
      id,
      type,
      title: title.trim(),
      description: description.trim() || undefined,
      startsAt: start.toISOString(),
      area,
      areaName: meUser.region,
      stops: finalStops,
      currentStop: 0,
      revealMinutesBefore: isPublicType(type) ? 0 : reveal,
      hostIds: [me, ...coHosts],
      crewId: crewOwned ? myCrew?.id : undefined,
      filter,
      going: [me],
      checkIns: {},
    });
    router.replace({ pathname: '/event/[id]', params: { id } });
  }

  const pickPins = [
    ...SPOTS.filter((s) => s.kind !== 'drive').map((s) => ({ id: `sp:${s.id}`, at: s.at, glyph: s.kind, colour: C.fog, title: s.name, size: 26 })),
    ...visibleStops.flatMap((st, i) =>
      st.at ? [{ id: `st:${i}`, at: st.at, glyph: type, colour: i === activeStop ? C.sodium : C.chalk, title: st.name || stopLabel(i, visibleStops.length), size: 36 }] : [],
    ),
  ];

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 20, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
      <Section title="Type">
        <Row gap={6}>
          {TYPES.map((t) => (
            <Chip key={t} label={EVENT_LABELS[t]} on={type === t} onPress={() => setType(t)} />
          ))}
        </Row>
        <Txt v="muted">
          {type === 'cruise' && 'A planned route with regroup stops. Everyone going sees the whole route at the reveal time.'}
          {type === 'rolling' && 'A meet in several parts. Place every stop now; each is checked against ban zones. People only see the next stop once they have checked in at the current one and a host moves on.'}
          {type === 'meet' && 'One spot. Static meets get moved on by police more often, so consider a cruise or rolling meet.'}
          {type === 'show' && 'A public show. The place is visible to everyone.'}
          {type === 'trackday' && 'A circuit or sprint venue. Public, and the only place lap times count.'}
        </Txt>
      </Section>

      <Section title="Name and details">
        <TextInput value={title} onChangeText={setTitle} placeholder="e.g. Peak District night cruise" placeholderTextColor={C.fog} style={ui.input} />
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Anything people should know (optional)"
          placeholderTextColor={C.fog}
          style={[ui.input, { minHeight: 70 }]}
          multiline
        />
      </Section>

      <Section title="When">
        <Row gap={6}>
          {DAY_CHOICES.map((d, i) => (
            <Chip key={d.label} label={d.label} on={day === i} onPress={() => setDay(i)} />
          ))}
        </Row>
        <Row gap={6}>
          {TIME_CHOICES.map((t) => (
            <Chip key={t} label={t} on={time === t} onPress={() => setTime(t)} colour={C.neon} />
          ))}
        </Row>
      </Section>

      <Section title={type === 'cruise' ? 'Route' : type === 'rolling' ? 'Stops' : 'Place'}>
        <Txt v="muted">Pick a stop below, then long-press the map to place it. Grey pins are known spots and tracks.</Txt>
        <View style={{ height: 280, borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: C.kerb }}>
          <NightMap
            pins={pickPins}
            paths={type === 'cruise' && placed.length > 1 ? [{ id: 'r', coords: placed.map((p) => p.at!), colour: C.sodium, dashed: true }] : []}
            circles={BAN_ZONES.map((z) => ({ id: z.id, centre: z.centre, radiusMiles: z.radiusMiles, colour: C.alert }))}
            centre={stops[activeStop]?.at ?? meUser.home}
            span={0.9}
            onLongPress={(at) => setStop(activeStop, { at })}
            onSelect={(pid) => {
              if (!pid.startsWith('sp:')) return;
              const spot = SPOTS.find((s) => `sp:${s.id}` === pid);
              if (spot) setStop(activeStop, { at: spot.at, name: stops[activeStop].name || spot.name });
            }}
          />
        </View>
        {visibleStops.map((st, i) => (
          <Card key={st.key} accent={i === activeStop ? C.sodium : undefined}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Chip label={stopLabel(i, visibleStops.length)} on={i === activeStop} onPress={() => setActiveStop(i)} />
              <Txt v="mono" style={{ color: st.at ? C.lime : C.fog }}>
                {st.at ? 'PLACED' : 'NOT PLACED'}
              </Txt>
            </Row>
            <TextInput
              value={st.name}
              onChangeText={(name) => setStop(i, { name })}
              onFocus={() => setActiveStop(i)}
              placeholder="Name this spot"
              placeholderTextColor={C.fog}
              style={ui.input}
            />
            {!singlePlace && visibleStops.length > 2 ? (
              <Button
                label="Remove"
                kind="ghost"
                onPress={() => {
                  setStops((xs) => xs.filter((_, j) => j !== i));
                  setActiveStop(0);
                }}
              />
            ) : null}
          </Card>
        ))}
        {!singlePlace ? (
          <Button
            label={type === 'cruise' ? '+ Add regroup stop' : '+ Add stop'}
            kind="ghost"
            onPress={() => {
              const insertAt = type === 'cruise' ? stops.length - 1 : stops.length;
              const next = [...stops];
              next.splice(insertAt, 0, { key: `s${Date.now()}`, name: '' });
              setStops(next);
              setActiveStop(insertAt);
            }}
          />
        ) : null}
        {bans.map(({ st, zone }) => (
          <Card key={st.key} accent={C.alert}>
            <Txt>
              {st.name || 'A stop'} is inside the {zone!.name} ban zone. Court orders here can ban organising or promoting late-night meets and cruises (often 3pm to 7am), and hosts have been taken to court. {zone!.note}
            </Txt>
          </Card>
        ))}
      </Section>

      <Section title="Who's invited">
        <Row style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}>
          <View style={{ flex: 1 }}>
            <Txt>Everyone welcome</Txt>
            <Txt v="muted">Skip the build filters. The radius still applies.</Txt>
          </View>
          <Switch value={filter.everyone} onValueChange={(everyone) => setFilter((f) => ({ ...f, everyone }))} trackColor={{ true: C.sodium, false: C.kerb }} />
        </Row>
        {!filter.everyone ? (
          <>
            <Txt v="label">Vehicles</Txt>
            <Row gap={6}>
              <Chip label="Cars" on={filter.cars} onPress={() => setFilter((f) => ({ ...f, cars: !f.cars }))} />
              <Chip label="Bikes" on={filter.bikes} onPress={() => setFilter((f) => ({ ...f, bikes: !f.bikes }))} />
            </Row>
            <Txt v="label">Class (none picked = all)</Txt>
            <Row gap={6}>
              {CLASS_LETTERS.map((l) => (
                <Chip key={l} label={l} on={filter.classes.includes(l)} onPress={() => toggleClass(l)} />
              ))}
            </Row>
            <Txt v="label">Minimum mods</Txt>
            <Row gap={6}>
              {[0, 1, 3, 5, 8].map((n) => (
                <Chip key={n} label={n === 0 ? 'Any' : `${n}+`} on={filter.minMods === n} onPress={() => setFilter((f) => ({ ...f, minMods: n }))} />
              ))}
            </Row>
            <Txt v="label">Brands (none picked = all)</Txt>
            <Row gap={6}>
              {FILTER_BRANDS.map((b) => (
                <Chip key={b} label={b} on={filter.brands.includes(b)} onPress={() => toggleBrand(b)} />
              ))}
            </Row>
          </>
        ) : null}
        <Txt v="label">Radius</Txt>
        <Row gap={6}>
          {[10, 25, 50, 100].map((r) => (
            <Chip key={r} label={`${r} mi`} on={filter.radiusMiles === r} onPress={() => setFilter((f) => ({ ...f, radiusMiles: r }))} colour={C.neon} />
          ))}
        </Row>
        <Card accent={C.sodium}>
          <Row style={{ alignItems: 'baseline' }}>
            <Txt v="h1" style={{ color: C.sodium, fontStyle: 'normal' }}>{matches.userIds.length}</Txt>
            <Txt v="muted">people match ({matches.buildIds.length} builds)</Txt>
          </Row>
        </Card>
      </Section>

      {!isPublicType(type) ? (
        <Section title="Reveal the place">
          <Row gap={6}>
            {REVEAL_CHOICES.map((m) => (
              <Chip key={m} label={m === 0 ? 'Straight away' : `${m} min before`} on={reveal === m} onPress={() => setReveal(m)} colour={C.neon} />
            ))}
          </Row>
          <Txt v="muted">Until then, people going only see the rough area.</Txt>
        </Section>
      ) : null}

      <Section title="Hosts">
        {myCrew ? (
          <Row style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}>
            <View style={{ flex: 1 }}>
              <Txt>Crew event: {myCrew.name}</Txt>
              <Txt v="muted">Any crew member can host, move on and edit.</Txt>
            </View>
            <Switch value={crewOwned} onValueChange={setCrewOwned} trackColor={{ true: C.sodium, false: C.kerb }} />
          </Row>
        ) : null}
        <Txt v="label">Co-hosts</Txt>
        <Row gap={6}>
          {friends.map((u) => (
            <Chip
              key={u.id}
              label={`@${u.handle}`}
              on={coHosts.includes(u.id)}
              onPress={() => setCoHosts((xs) => (xs.includes(u.id) ? xs.filter((x) => x !== u.id) : [...xs, u.id]))}
              colour={C.neon}
            />
          ))}
        </Row>
      </Section>

      {error ? (
        <Card accent={C.alert}>
          <Txt>{error}</Txt>
        </Card>
      ) : null}
      <Button label="Send invites" onPress={save} />
    </ScrollView>
  );
}
