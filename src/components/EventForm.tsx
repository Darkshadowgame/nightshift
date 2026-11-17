import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { MapPicker } from './MapPicker';
import { NightMap } from './NightMap';
import { Button, Card, Chip, InlineError, Row, Section, ToggleRow, Txt, s as ui } from './ui';
import { FILTER_BRANDS } from '../data/catalog';
import { BAN_ZONES } from '../data/seed';
import { zonePins, zoneShapes } from '../lib/zones';
import { ZoneNotice } from './ZoneCard';
import { visibleSpots } from '../lib/spots';
import { banZoneAt, EVENT_LABELS, isPublicType, stopsFromDraft, type DraftStop } from '../lib/events';
import { formatWhen } from '../lib/format';
import { fitRegion } from '../lib/geo';
import { startFrom, type DayChoice } from '../lib/when';
import { eventArea } from '../lib/area';
import { isCrewHost } from '../lib/crews';
import { DEFAULT_FILTER, invitees } from '../lib/invites';
import { nearestRegion } from '../lib/profile';
import { geocoderAvailable, nameForPlace, townForPlace } from '../lib/location';
import { shouldAutoName } from '../lib/placeNames';
import type { LatLng } from '../lib/types';
import { newId, useStore } from '../lib/store';
import { useNow } from '../lib/clock';
import { CLASS_LETTERS, type ClassLetter, type EventType, type InviteFilter, type NightEvent } from '../lib/types';
import { GOING, UNLOCK } from '../lib/glossary';
import { BRAND, C, F, RADIUS, STATE, SURFACE } from '../theme';

/** Ban zones drawn on the map: circles, and council outlines for borough-wide orders. */
const BAN_SHAPES = zoneShapes(BAN_ZONES, STATE.warning);
const BAN_PINS = zonePins(BAN_ZONES, STATE.warning);

const TYPES: EventType[] = ['cruise', 'rolling', 'meet', 'show', 'trackday'];
const DAY_CHOICES: DayChoice[] = [
  { label: 'Tonight', days: 0 },
  { label: 'Tomorrow', days: 1 },
  { label: 'In 2 days', days: 2 },
  { label: 'This weekend', days: -1 },
  { label: 'Next week', days: 7 },
];
const TIME_CHOICES = ['19:00', '20:30', '22:00', '22:30', '23:00', '23:59', '06:00', '09:00'];
const REVEAL_CHOICES = [0, 30, 60, 120];

function hhmm(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/**
 * The host form, used to create an event and to edit one before it starts.
 * `onSubmit` gets the finished event and may throw with a readable reason.
 */
export function EventForm({
  initial,
  submitLabel,
  onSubmit,
}: {
  initial?: NightEvent;
  submitLabel: string;
  onSubmit: (event: NightEvent) => void | Promise<void>;
}) {
  const store = useStore();
  const SPOTS = visibleSpots(store.spots, store.me);
  const { users, builds, me, crews } = store;
  const now = useNow();
  const meUser = users.find((u) => u.id === me)!;
  const myCrew = crews.find((c) => c.id === meUser.crewId);
  /** Only crew owners and hosts can put an event under the crew. */
  const canCrewHost = isCrewHost(myCrew, me);
  const editing = !!initial;

  const [dayChoices] = useState<DayChoice[]>(() =>
    initial ? [{ label: formatWhen(initial.startsAt, now).replace(/ \d\d:\d\d$/, '') + ' (as planned)', days: 0, date: initial.startsAt }, ...DAY_CHOICES] : DAY_CHOICES,
  );
  const [timeChoices] = useState<string[]>(() =>
    initial && !TIME_CHOICES.includes(hhmm(initial.startsAt)) ? [hhmm(initial.startsAt), ...TIME_CHOICES] : TIME_CHOICES,
  );
  const [type, setType] = useState<EventType>(initial?.type ?? 'cruise');
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [areaName, setAreaName] = useState(initial?.areaName ?? '');
  const [day, setDay] = useState(0);
  const [time, setTime] = useState(initial ? hhmm(initial.startsAt) : '22:30');
  const [stops, setStops] = useState<DraftStop[]>(() =>
    initial
      ? initial.stops.map((st) => ({ key: st.id, name: st.name, at: st.at }))
      : [
          { key: 's0', name: '' },
          { key: 's1', name: '' },
        ],
  );
  const [activeStop, setActiveStop] = useState(0);
  const [filter, setFilter] = useState<InviteFilter>(initial ? { ...initial.filter } : { ...DEFAULT_FILTER });
  const [reveal, setReveal] = useState(initial?.revealMinutesBefore ?? 60);
  const [crewOwned, setCrewOwned] = useState(initial ? !!initial.crewId : canCrewHost);
  const [coHosts, setCoHosts] = useState<string[]>(initial ? initial.hostIds.filter((h) => h !== me) : []);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const chosen = startFrom(dayChoices[day], time, now);

  const singlePlace = type === 'meet' || type === 'show' || type === 'trackday';
  const visibleStops = singlePlace ? stops.slice(0, 1) : stops;
  // Only the stops this type uses: a hidden second stop left over from a cruise doesn't count.
  const placed = visibleStops.filter((st) => st.at);
  const placedKey = placed.map((p) => `${p.at!.lat},${p.at!.lng}`).join('|');
  const areaKey = initial?.id ?? 'draft';
  const { area, areaRadiusMiles } = useMemo(
    () => (placed.length ? eventArea(placed.map((p) => p.at!), areaKey, isPublicType(type)) : { area: meUser.home, areaRadiusMiles: 3 }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [placedKey, areaKey, type, meUser.home],
  );
  // The town the (fuzzed) area is in, from the phone's geocoder; the region if it can't say.
  const [town, setTown] = useState<string | null>(null);
  useEffect(() => {
    setTown(null);
    if (!placed.length) return;
    let live = true;
    townForPlace(area).then((t) => live && setTown(t));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [area.lat, area.lng]);
  const suggestedAreaName = placed.length ? (town ?? nearestRegion(area)) : meUser.region;
  const localMatches = useMemo(() => invitees(users.filter((u) => u.id !== me), builds, filter, area), [users, builds, filter, area, me]);
  // Signed in, other people's homes never reach the phone: the server counts (invite_count(), "fewer than 3" as null).
  const remote = store.remote;
  const [serverCount, setServerCount] = useState<{ people: number | null; builds: number | null } | 'loading' | 'offline'>('loading');
  const filterKey = JSON.stringify(filter);
  useEffect(() => {
    if (!remote) return;
    let live = true;
    const t = setTimeout(() => {
      remote
        .inviteCount(filter, area)
        .then((c) => live && setServerCount(c))
        .catch(() => live && setServerCount('offline'));
    }, 400);
    return () => {
      live = false;
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remote, filterKey, area.lat, area.lng]);
  const countText = (n: number | null) => (n === null ? 'fewer than 3' : String(n));
  const matchHeadline = !remote
    ? String(localMatches.userIds.length)
    : serverCount === 'loading' ? '…' : serverCount === 'offline' ? '?' : countText(serverCount.people);
  const matchLine = !remote
    ? `people match (${localMatches.buildIds.length} builds)`
    : serverCount === 'loading' ? 'counting who this reaches…' : serverCount === 'offline' ? "people match (can't count while offline)" : `people match (${countText(serverCount.builds)} builds)`;
  const bans = placed
    .map((st) => ({ st, zone: banZoneAt(st.at!, BAN_ZONES) }))
    .filter((x) => x.zone);
  const friends = meUser.crewId ? users.filter((u) => u.id !== me && u.crewId === meUser.crewId) : [];

  function setStop(i: number, patch: Partial<DraftStop>) {
    setStops((xs) => xs.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  }

  /** Which stop the full-screen map picker is placing, if it's open. */
  const [picking, setPicking] = useState<number | null>(null);
  /** The last name the geocoder gave each stop, so a name the host typed is never overwritten. */
  const autoNames = useRef<Record<string, string>>({});

  /** Drop a stop, then name it after the street and town (the host can edit it). */
  function placeStop(i: number, at: LatLng, knownName?: string) {
    const key = stops[i]?.key;
    if (!key) return;
    if (knownName) {
      setStop(i, { at, name: shouldAutoName(stops[i].name, autoNames.current[key]) ? knownName : stops[i].name });
      autoNames.current[key] = knownName;
      return;
    }
    setStop(i, { at });
    nameForPlace(at).then((name) => {
      if (!name) return;
      setStops((xs) =>
        xs.map((x) => {
          if (x.key !== key || x.at !== at || !shouldAutoName(x.name, autoNames.current[key])) return x;
          autoNames.current[key] = name;
          return { ...x, name };
        }),
      );
    });
  }

  function stopLabel(i: number, n: number) {
    if (type === 'cruise') return i === 0 ? 'Start' : i === n - 1 ? 'Finish' : `Regroup ${i}`;
    if (type === 'rolling') return `Stop ${i + 1}`;
    if (type === 'show') return 'Show venue';
    if (type === 'trackday') return 'Circuit';
    return 'Meet spot';
  }

  function toggleClass(l: ClassLetter) {
    setFilter((f) => ({ ...f, classes: f.classes.includes(l) ? f.classes.filter((x) => x !== l) : [...f.classes, l] }));
  }
  function toggleBrand(b: string) {
    setFilter((f) => ({ ...f, brands: f.brands.includes(b) ? f.brands.filter((x) => x !== b) : [...f.brands, b] }));
  }

  async function save() {
    if (saving) return;
    const used = visibleStops;
    if (!title.trim()) return setError('Give the event a name.');
    if (!used[0]?.at) return setError(`Choose the ${stopLabel(0, used.length).toLowerCase()} on the map.`);
    if (type === 'cruise' && used.filter((s) => s.at).length < 2) return setError('A cruise needs at least a start and a finish.');
    if (type === 'rolling' && used.some((s) => !s.at)) return setError('Place every stop on the map. Rolling meets are planned in full before they start.');
    if (!filter.cars && !filter.bikes && !filter.everyone) return setError('Invite cars, bikes or both.');
    const id = initial?.id ?? newId('ev');
    const finalStops = stopsFromDraft(id, used, initial?.stops ?? [], stopLabel);
    // The rough area is fuzzed from the stops with the event's own id, so it never sits on a stop.
    const where = eventArea(finalStops.map((st) => st.at!), id, isPublicType(type));
    const when = startFrom(dayChoices[day], time, new Date());
    if (!when.ok) return setError(when.reason);
    const start = when.start;
    // Editing as a crew member who isn't a named host keeps the named hosts as they were.
    let hostIds = initial ? Array.from(new Set([...(initial.hostIds.includes(me) ? [me] : []), ...coHosts])) : [me, ...coHosts];
    if (hostIds.length === 0) hostIds = [me];
    const event: NightEvent = {
      ...(initial ?? {}),
      id,
      type,
      title: title.trim(),
      description: description.trim() || undefined,
      startsAt: start.toISOString(),
      area: where.area,
      areaRadiusMiles: where.areaRadiusMiles,
      areaName: areaName.trim() || suggestedAreaName,
      stops: finalStops,
      currentStop: initial?.currentStop ?? 0,
      revealMinutesBefore: isPublicType(type) ? 0 : reveal,
      hostIds,
      crewId: crewOwned ? (initial?.crewId ?? (canCrewHost ? myCrew?.id : undefined)) : undefined,
      filter,
      going: initial?.going ?? [me],
      checkIns: initial?.checkIns ?? {},
    };
    if (initial?.endsAt) {
      // Keep the same length when the start moves.
      const length = new Date(initial.endsAt).getTime() - new Date(initial.startsAt).getTime();
      event.endsAt = new Date(start.getTime() + length).toISOString();
    }
    setError(null);
    setSaving(true);
    try {
      await onSubmit(event);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save.');
    } finally {
      setSaving(false);
    }
  }

  const stopPins = (active: number | null) =>
    visibleStops.flatMap((st, i) =>
      st.at && i !== (active === null ? -1 : active)
        ? [{ id: `st:${i}`, at: st.at, glyph: type, colour: i === activeStop ? BRAND : C.chalk, title: st.name || stopLabel(i, visibleStops.length), size: active === null ? 36 : 28 }]
        : [],
    );
  const routePaths = type === 'cruise' && placed.length > 1 ? [{ id: 'r', coords: placed.map((p) => p.at!), colour: BRAND, dashed: true }] : [];
  // The preview frames the stops placed so far, or opens on home.
  const preview = fitRegion(placed.map((p) => p.at!), 0.1) ?? { centre: meUser.home, span: 0.9 };
  function openPicker(i: number) {
    setActiveStop(i);
    setPicking(i);
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 20, paddingBottom: 60 }} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive" automaticallyAdjustKeyboardInsets>
      <Section title="Type">
        <Row gap={6}>
          {(editing ? [type] : TYPES).map((t) => (
            <Chip key={t} label={EVENT_LABELS[t]} on={type === t} onPress={editing ? undefined : () => setType(t)} />
          ))}
        </Row>
        <Txt v="muted">
          {type === 'cruise' && 'A planned route with regroup stops. The whole route unlocks for everyone going at the time you pick.'}
          {type === 'rolling' && 'A meet in several parts. Place every stop now; each is checked against ban zones. The next stop unlocks only for people checked in at the current one, when a host moves on.'}
          {type === 'meet' && 'One stop. Pick somewhere with permission, or a meet spot that welcomes meets.'}
          {type === 'show' && 'A public show. The stop is visible to everyone.'}
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
          {dayChoices.map((d, i) => (
            <Chip key={d.label} label={d.label} on={day === i} onPress={() => setDay(i)} />
          ))}
        </Row>
        <Row gap={6}>
          {timeChoices.map((t) => (
            <Chip key={t} label={t} on={time === t} onPress={() => setTime(t)} />
          ))}
        </Row>
        {chosen.ok ? (
          <Txt v="mono" scale="chrome" style={{ color: STATE.success }}>Starts {formatWhen(chosen.start.toISOString(), now)}</Txt>
        ) : (
          <InlineError message={chosen.reason} />
        )}
      </Section>

      <Section title={type === 'cruise' ? 'Route' : type === 'rolling' ? 'Stops' : 'Stop'}>
        <Txt v="muted">
          Choose {singlePlace ? 'the stop' : 'each stop'} on the map: move it until the crosshair is on it. It's named after the street (or the known
          place it's on); edit the name if you like.
        </Txt>
        <Pressable
          onPress={() => openPicker(activeStop)}
          accessibilityRole="button"
          accessibilityLabel={`Open the map to place the ${stopLabel(activeStop, visibleStops.length).toLowerCase()}`}
          style={{ height: 200, borderRadius: RADIUS.sheet, overflow: 'hidden', borderWidth: 1, borderColor: C.kerb }}
        >
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <NightMap
              pins={[...BAN_PINS, ...stopPins(null)]}
              paths={routePaths}
              circles={BAN_SHAPES.circles}
              polygons={BAN_SHAPES.polygons}
              centre={preview.centre}
              span={preview.span}
              follow
            />
          </View>
          {placed.length === 0 ? (
            <View pointerEvents="none" style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', backgroundColor: SURFACE.scrim }]}>
              <Txt v="label" style={{ color: C.chalk }}>Tap to open the map</Txt>
            </View>
          ) : null}
        </Pressable>
        {visibleStops.map((st, i) => (
          <Card key={st.key} accent={i === activeStop ? BRAND : undefined}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Chip label={stopLabel(i, visibleStops.length)} on={i === activeStop} onPress={() => setActiveStop(i)} />
              <Txt v="mono" scale="chrome" style={{ color: st.at ? STATE.success : C.fog }}>
                {st.at ? 'Placed' : 'Not placed'}
              </Txt>
            </Row>
            <Button
              label={st.at ? 'Move on the map' : 'Choose on the map'}
              kind="secondary"
              onPress={() => openPicker(i)}
              accessibilityLabel={`${st.at ? 'Move' : 'Choose'} the ${stopLabel(i, visibleStops.length).toLowerCase()} on the map`}
            />
            <TextInput
              value={st.name}
              onChangeText={(name) => setStop(i, { name })}
              onFocus={() => setActiveStop(i)}
              placeholder={st.at && geocoderAvailable ? 'Naming it from the map…' : 'Name this stop'}
              placeholderTextColor={C.fog}
              style={ui.input}
            />
            {st.at && autoNames.current[st.key] && st.name === autoNames.current[st.key] ? (
              <Txt v="caption">Named from the map. Edit it if people know it by another name.</Txt>
            ) : null}
            {!singlePlace && visibleStops.length > 2 ? (
              <Button
                label="Remove this stop"
                kind="danger"
                size="sm"
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
            kind="secondary"
            onPress={() => {
              const insertAt = type === 'cruise' ? stops.length - 1 : stops.length;
              const next = [...stops];
              next.splice(insertAt, 0, { key: `s${Date.now()}`, name: '' });
              setStops(next);
              setActiveStop(insertAt);
            }}
          />
        ) : null}
        <Txt v="label">Area name</Txt>
        <TextInput
          value={areaName}
          onChangeText={setAreaName}
          placeholder={`e.g. ${suggestedAreaName}`}
          placeholderTextColor={C.fog}
          style={ui.input}
          maxLength={30}
          accessibilityLabel="Area name"
        />
        <Txt v="muted">
          {isPublicType(type)
            ? 'Shown with the event.'
            : `Until the stop unlocks, people only see this name and a ${areaRadiusMiles} mi circle that doesn't centre on any stop.`}
        </Txt>
        {bans.map(({ st, zone }) => (
          <ZoneNotice key={st.key} zone={zone!} subject={st.name || 'A stop'} />
        ))}
        {bans.length ? <Txt v="caption">Nightshift only warns. As the host, you're responsible for checking the order.</Txt> : null}
      </Section>

      <Section title="Who's invited">
        <ToggleRow
          label={`${GOING.public}: any car or bike`}
          hint="Skip the build filters. The radius still applies."
          value={filter.everyone}
          onValueChange={(everyone) => setFilter((f) => ({ ...f, everyone }))}
        />
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
            <Chip key={r} label={`${r} mi`} on={filter.radiusMiles === r} onPress={() => setFilter((f) => ({ ...f, radiusMiles: r }))} />
          ))}
        </Row>
        <Card accent={BRAND}>
          <Row style={{ alignItems: 'baseline' }}>
            <Txt v="h1" style={{ color: BRAND, fontFamily: F.display }}>{matchHeadline}</Txt>
            <Txt v="muted">{matchLine}</Txt>
          </Row>
        </Card>
      </Section>

      {!isPublicType(type) ? (
        <Section title={UNLOCK.setting}>
          <Row gap={6}>
            {REVEAL_CHOICES.map((m) => (
              <Chip key={m} label={m === 0 ? 'Straight away' : `${m} min before`} on={reveal === m} onPress={() => setReveal(m)} />
            ))}
          </Row>
          <Txt v="muted">Until it unlocks, people going only see the rough area.</Txt>
        </Section>
      ) : null}

      <Section title="Hosts">
        {myCrew && (canCrewHost || initial?.crewId === myCrew.id) ? (
          <ToggleRow label={`Crew event: ${myCrew.name}`} hint="The crew owner and hosts can host, move on and edit." value={crewOwned} onValueChange={setCrewOwned} />
        ) : null}
        <Txt v="label">Co-hosts</Txt>
        {friends.length === 0 ? <Txt v="muted">Co-hosts come from your crew. Join or start one from Me.</Txt> : null}
        <Row gap={6}>
          {friends.map((u) => (
            <Chip
              key={u.id}
              label={`@${u.handle}`}
              on={coHosts.includes(u.id)}
              onPress={() => setCoHosts((xs) => (xs.includes(u.id) ? xs.filter((x) => x !== u.id) : [...xs, u.id]))}
              raw
            />
          ))}
        </Row>
      </Section>

      <Button label={submitLabel} onPress={save} busy={saving} />
      <InlineError message={error} />

      <MapPicker
        visible={picking !== null}
        mode="point"
        title={picking !== null ? `PLACE THE ${stopLabel(picking, visibleStops.length).toUpperCase()}` : ''}
        hint="Move the map so the crosshair is on the stop, or tap a grey pin to use a known place."
        confirmLabel={picking !== null && visibleStops[picking]?.at ? 'Move it here' : 'Set stop here'}
        start={
          (picking !== null && (visibleStops[picking]?.at ?? [...visibleStops.slice(0, picking)].reverse().find((x) => x.at)?.at)) ||
          placed[0]?.at ||
          meUser.home
        }
        span={0.08}
        initial={picking !== null && visibleStops[picking]?.at ? [visibleStops[picking].at!] : []}
        showKinds={['venue', 'track', 'photo']}
        snap
        zones
        extraPins={stopPins(picking)}
        extraPaths={routePaths}
        onDone={([stop]) => {
          if (picking !== null && stop) placeStop(picking, stop.at, stop.name);
          setPicking(null);
        }}
        onCancel={() => setPicking(null)}
      />
    </ScrollView>
  );
}
