import { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FILTER_BRANDS } from '../data/catalog';
import { BAN_ZONES } from '../data/seed';
import { eventArea } from '../lib/area';
import { useNow } from '../lib/clock';
import { isCrewHost } from '../lib/crews';
import { banZoneAt, EVENT_LABELS, isPublicType, stopsFromDraft, type DraftStop } from '../lib/events';
import { formatWhen, plural } from '../lib/format';
import { fitRegion } from '../lib/geo';
import { GOING, UNLOCK } from '../lib/glossary';
import { classRange, DEFAULT_FILTER, describeFilter, fromVehicleSelection, hostLeftOut, invitees, vehicleSelection, type VehicleKey } from '../lib/invites';
import { geocoderAvailable, nameForPlace, townForPlace } from '../lib/location';
import { shouldAutoName } from '../lib/placeNames';
import { nearestRegion } from '../lib/profile';
import { newId, useStore } from '../lib/store';
import type { LatLng } from '../lib/types';
import { CLASS_LETTERS, type ClassLetter, type EventType, type InviteFilter, type NightEvent } from '../lib/types';
import { startFrom, type DayChoice } from '../lib/when';
import { zonePins, zoneShapes } from '../lib/zones';
import { COLOR, SPACING } from '../theme';
import { Callout, Field, MediaFrame, TextField } from './Detail';
import { Button, ChipGroup, ChoiceGroup, displayHandle, DsText, ErrorState, ListRow, Press, RowDivider, Section, StatBlock } from './ds';
import { MapPicker } from './MapPicker';
import { NightMap } from './NightMap';
import { ToggleRow } from './ui';
import { ZoneNotice } from './ZoneCard';

/** Meet bans drawn on the map: circles, and council outlines for borough-wide orders. */
const BAN_SHAPES = zoneShapes(BAN_ZONES, COLOR.state.warning);
const BAN_PINS = zonePins(BAN_ZONES, COLOR.state.warning);

const TYPES: EventType[] = ['cruise', 'rolling', 'meet', 'show', 'trackday'];
const TYPE_HINTS: Record<EventType, string> = {
  cruise: 'A planned route with regroup stops. The whole route unlocks for everyone going at the time you pick.',
  rolling: 'A meet in several parts. Every stop is placed now; the next one unlocks only for people checked in at the current one, when a host moves on.',
  meet: 'One stop. Pick somewhere with permission, or a meet spot that welcomes meets.',
  show: 'A public show. The stop is visible to everyone.',
  trackday: 'A circuit or sprint venue. Public, and the only place lap times count.',
};
const DAY_CHOICES: DayChoice[] = [
  { label: 'Tonight', days: 0 },
  { label: 'Tomorrow', days: 1 },
  { label: 'In 2 days', days: 2 },
  { label: 'This weekend', days: -1 },
  { label: 'Next week', days: 7 },
];
const TIME_CHOICES = ['19:00', '20:30', '22:00', '22:30', '23:00', '23:59', '06:00', '09:00'];
const REVEAL_CHOICES = [0, 30, 60, 120];
const MOD_CHOICES = [0, 1, 3, 5, 8];
const RADIUS_CHOICES = [10, 25, 50, 100];

const STEPS = ['What', 'When', 'Where', "Who's invited", 'Review'] as const;
type Step = 0 | 1 | 2 | 3 | 4;

function hhmm(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/**
 * The host flow, in five steps: What → When → Where (and stops) → Who's invited → Review.
 * Used to create an event and to edit one before it starts. `onSubmit` gets the finished event
 * and may throw with a readable reason. Invite filters follow the chip rule: nothing selected
 * means everyone in that dimension.
 */
export function EventForm({ initial, submitLabel, onSubmit }: { initial?: NightEvent; submitLabel: string; onSubmit: (event: NightEvent) => void | Promise<void> }) {
  const store = useStore();
  const { users, builds, me, crews } = store;
  const now = useNow();
  const insets = useSafeAreaInsets();
  const meUser = users.find((u) => u.id === me)!;
  const myCrew = crews.find((c) => c.id === meUser.crewId);
  /** Only crew owners and hosts can put an event under the crew. */
  const canCrewHost = isCrewHost(myCrew, me);
  const editing = !!initial;
  const scroll = useRef<{ scrollTo: (o: { y: number; animated?: boolean }) => void } | null>(null);

  const [step, setStep] = useState<Step>(0);
  const [dayChoices] = useState<DayChoice[]>(() =>
    initial ? [{ label: formatWhen(initial.startsAt, now).replace(/ \d\d:\d\d$/, '') + ' (as planned)', days: 0, date: initial.startsAt }, ...DAY_CHOICES] : DAY_CHOICES,
  );
  const [timeChoices] = useState<string[]>(() => (initial && !TIME_CHOICES.includes(hhmm(initial.startsAt)) ? [hhmm(initial.startsAt), ...TIME_CHOICES] : TIME_CHOICES));
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
  const peopleCount = !remote ? String(localMatches.userIds.length) : serverCount === 'loading' ? '…' : serverCount === 'offline' ? '?' : countText(serverCount.people);
  const buildCount = !remote ? String(localMatches.buildIds.length) : serverCount === 'loading' ? '…' : serverCount === 'offline' ? '?' : countText(serverCount.builds);
  const bans = placed.map((st) => ({ st, zone: banZoneAt(st.at!, BAN_ZONES) })).filter((x) => x.zone);
  const friends = meUser.crewId ? users.filter((u) => u.id !== me && u.crewId === meUser.crewId) : [];
  const myBuilds = builds.filter((b) => b.ownerId === me);
  const leftOut = !isPublicType(type) && hostLeftOut(filter, myBuilds);

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

  /** What's missing on a step, if anything (shown under Next, which stays tappable). */
  function problem(s: Step): string | null {
    if (s === 0 && !title.trim()) return 'Give the event a name.';
    if (s === 1 && !chosen.ok) return chosen.reason;
    if (s === 2) {
      if (!visibleStops[0]?.at) return `Choose the ${stopLabel(0, visibleStops.length).toLowerCase()} on the map.`;
      if (type === 'cruise' && placed.length < 2) return 'A cruise needs at least a start and a finish.';
      if (type === 'rolling' && visibleStops.some((x) => !x.at)) return 'Place every stop on the map. Rolling meets are planned in full before they start.';
    }
    return null;
  }

  function go(next: Step) {
    setError(null);
    setStep(next);
    scroll.current?.scrollTo({ y: 0, animated: false });
  }

  function nextStep() {
    const p = problem(step);
    if (p) return setError(p);
    go((step + 1) as Step);
  }

  async function save() {
    if (saving) return;
    for (const s of [0, 1, 2] as Step[]) {
      const p = problem(s);
      if (p) {
        setStep(s);
        return setError(p);
      }
    }
    const used = visibleStops;
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
      setError(e instanceof Error ? e.message : "Couldn't save.");
    } finally {
      setSaving(false);
    }
  }

  const stopPins = (active: number | null) =>
    visibleStops.flatMap((st, i) =>
      st.at && i !== (active === null ? -1 : active)
        ? [{ id: `st:${i}`, at: st.at, glyph: type, colour: i === activeStop ? COLOR.action.primary : COLOR.text.primary, title: st.name || stopLabel(i, visibleStops.length), size: active === null ? 36 : 28 }]
        : [],
    );
  const routePaths = type === 'cruise' && placed.length > 1 ? [{ id: 'r', coords: placed.map((p) => p.at!), colour: COLOR.action.primary, dashed: true }] : [];
  // The preview frames the stops placed so far, or opens on home.
  const preview = fitRegion(placed.map((p) => p.at!), 0.1) ?? { centre: meUser.home, span: 0.9 };
  function openPicker(i: number) {
    setActiveStop(i);
    setPicking(i);
  }

  const startText = chosen.ok ? formatWhen(chosen.start.toISOString(), now) : '';
  const revealText = isPublicType(type) ? 'Visible to everyone' : reveal === 0 ? 'The stop unlocks straight away for people going' : `The stop unlocks ${reveal} min before the start`;
  const coHostNames = coHosts.map((h) => displayHandle(users.find((u) => u.id === h)?.handle ?? h));

  // ---------------------------------------------------------------------------
  // Steps
  // ---------------------------------------------------------------------------

  const what = (
    <>
      <ChoiceGroup
        label="Type"
        options={(editing ? [type] : TYPES).map((t) => ({ key: t, label: EVENT_LABELS[t] }))}
        value={type}
        onChange={(t) => !editing && setType(t)}
      />
      <DsText v="secondary">{TYPE_HINTS[type]}</DsText>
      <Field label="Name">
        <TextField value={title} onChangeText={setTitle} placeholder="e.g. Peak District night cruise" maxLength={60} accessibilityLabel="Name" />
      </Field>
      <Field label="Details (optional)">
        <TextField value={description} onChangeText={setDescription} placeholder="Anything people should know" multiline multilineHeight={88} accessibilityLabel="Details" />
      </Field>
    </>
  );

  const whenStep = (
    <>
      <ChoiceGroup label="Day" options={dayChoices.map((d, i) => ({ key: String(i), label: d.label }))} value={String(day)} onChange={(k) => setDay(Number(k))} />
      <ChoiceGroup label="Start time" options={timeChoices.map((t) => ({ key: t, label: t }))} value={time} onChange={setTime} />
      {chosen.ok ? <DsText v="bodyStrong">Starts {startText}</DsText> : <ErrorState title={chosen.reason} />}
      {!isPublicType(type) ? (
        <>
          <ChoiceGroup
            label={UNLOCK.setting}
            options={REVEAL_CHOICES.map((m) => ({ key: String(m), label: m === 0 ? 'Straight away' : `${m} min before` }))}
            value={String(reveal)}
            onChange={(k) => setReveal(Number(k))}
          />
          <DsText v="secondary">Until it unlocks, people going only see the rough area.</DsText>
        </>
      ) : null}
    </>
  );

  const whereStep = (
    <>
      <DsText v="secondary">
        Choose {singlePlace ? 'the stop' : 'each stop'} on the map: move it until the crosshair is on it. It's named after the street or the known place it's on; edit the name if you like. Each stop is checked against meet bans.
      </DsText>
      <Press onPress={() => openPicker(activeStop)} label={`Open the map to place the ${stopLabel(activeStop, visibleStops.length).toLowerCase()}`} feedback="card">
        <MediaFrame height={180}>
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <NightMap pins={[...BAN_PINS, ...stopPins(null)]} paths={routePaths} circles={BAN_SHAPES.circles} polygons={BAN_SHAPES.polygons} centre={preview.centre} span={preview.span} follow />
          </View>
          {placed.length === 0 ? (
            <View pointerEvents="none" style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', backgroundColor: COLOR.surface.scrim }]}>
              <DsText v="buttonSm">Tap to open the map</DsText>
            </View>
          ) : null}
        </MediaFrame>
      </Press>
      {visibleStops.map((st, i) => {
        const zone = st.at ? banZoneAt(st.at, BAN_ZONES) : undefined;
        const label = stopLabel(i, visibleStops.length);
        return (
          <View key={st.key} style={{ gap: SPACING.sm }}>
            {i > 0 ? <RowDivider /> : null}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
              <DsText v="label" style={{ flex: 1 }}>
                {label}
              </DsText>
              <DsText v="meta" tone={st.at ? 'success' : 'secondary'}>
                {st.at ? 'Placed' : 'Not placed'}
              </DsText>
            </View>
            <TextField
              value={st.name}
              onChangeText={(name) => setStop(i, { name })}
              onFocus={() => setActiveStop(i)}
              placeholder={st.at && geocoderAvailable ? 'Naming it from the map…' : 'Name this stop'}
              accessibilityLabel={`${label} name`}
            />
            {st.at && autoNames.current[st.key] && st.name === autoNames.current[st.key] ? <DsText v="caption">Named from the map. Edit it if people know it by another name.</DsText> : null}
            <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
              <Button
                label={st.at ? 'Move on the map' : 'Choose on the map'}
                tier="secondary"
                size="sm"
                style={{ flex: 1 }}
                block
                onPress={() => openPicker(i)}
                accessibilityLabel={`${st.at ? 'Move' : 'Choose'} the ${label.toLowerCase()} on the map`}
              />
              {!singlePlace && visibleStops.length > 2 ? (
                <Button
                  label="Remove"
                  tier="destructive"
                  size="sm"
                  accessibilityLabel={`Remove the ${label.toLowerCase()}`}
                  onPress={() => {
                    setStops((xs) => xs.filter((_, j) => j !== i));
                    setActiveStop(0);
                  }}
                />
              ) : null}
            </View>
            {zone ? <ZoneNotice zone={zone} subject={st.name || label} /> : null}
          </View>
        );
      })}
      {!singlePlace ? (
        <Button
          label={type === 'cruise' ? 'Add a regroup stop' : 'Add a stop'}
          icon="plus"
          tier="tertiary"
          onPress={() => {
            const insertAt = type === 'cruise' ? stops.length - 1 : stops.length;
            const next = [...stops];
            next.splice(insertAt, 0, { key: `s${Date.now()}`, name: '' });
            setStops(next);
            setActiveStop(insertAt);
          }}
        />
      ) : null}
      {bans.length ? <DsText v="caption">Nightshift only warns. As the host, you're responsible for checking the order.</DsText> : null}
      <Field
        label="Area name"
        hint={isPublicType(type) ? 'Shown with the event.' : `Until the stop unlocks, people only see this name and a ${areaRadiusMiles} mi circle that doesn't centre on any stop.`}
      >
        <TextField value={areaName} onChangeText={setAreaName} placeholder={`e.g. ${suggestedAreaName}`} maxLength={30} accessibilityLabel="Area name" />
      </Field>
    </>
  );

  const vehicles = vehicleSelection(filter);
  const whoStep = (
    <>
      <ToggleRow
        label={`${GOING.public}: any car or bike`}
        hint="Skip the build filters. The radius still applies."
        value={filter.everyone}
        onValueChange={(everyone) => setFilter((f) => ({ ...f, everyone }))}
      />
      {!filter.everyone ? (
        <>
          <DsText v="secondary">Pick nothing in a row to invite everyone in it.</DsText>
          <ChipGroup<VehicleKey>
            label="Vehicles"
            allLabel="Cars and bikes"
            options={[
              { key: 'car', label: 'Cars' },
              { key: 'bike', label: 'Bikes' },
            ]}
            selected={vehicles}
            onChange={(next) => setFilter((f) => ({ ...f, ...fromVehicleSelection(next) }))}
          />
          <ChipGroup<ClassLetter>
            label="Class"
            allLabel="Every class"
            options={CLASS_LETTERS.map((l) => ({ key: l, label: l }))}
            selected={filter.classes}
            onChange={(next) => setFilter((f) => ({ ...f, classes: next.length === CLASS_LETTERS.length ? [] : next }))}
          />
          <ChoiceGroup
            label="Minimum mods"
            options={MOD_CHOICES.map((n) => ({ key: String(n), label: n === 0 ? 'Any' : `${n}+` }))}
            value={String(filter.minMods)}
            onChange={(k) => setFilter((f) => ({ ...f, minMods: Number(k) }))}
          />
          <ChipGroup<string> label="Brands" allLabel="Every brand" raw options={FILTER_BRANDS.map((b) => ({ key: b, label: b }))} selected={filter.brands} onChange={(next) => setFilter((f) => ({ ...f, brands: next }))} />
        </>
      ) : null}
      <ChoiceGroup label="Radius from the area" options={RADIUS_CHOICES.map((r) => ({ key: String(r), label: `${r} mi` }))} value={String(filter.radiusMiles)} onChange={(k) => setFilter((f) => ({ ...f, radiusMiles: Number(k) }))} />
      <StatBlock
        stats={[
          { label: 'People match', value: peopleCount },
          { label: 'Builds match', value: buildCount },
        ]}
      />
      {remote && serverCount === 'offline' ? <DsText v="caption">Can't count while offline.</DsText> : null}
      {leftOut ? (
        <Callout tone="warning" title="None of your own builds fits this invite">
          Check Vehicles, Class, Minimum mods and Brands, or you'll be hosting something you can't bring a car or bike to.
        </Callout>
      ) : null}
      {myCrew && (canCrewHost || initial?.crewId === myCrew.id) ? (
        <ToggleRow label={`Crew event: ${myCrew.name}`} hint="The crew owner and hosts can host, move on and edit." value={crewOwned} onValueChange={setCrewOwned} />
      ) : null}
      {friends.length ? (
        <ChipGroup<string>
          label="Co-hosts"
          allLabel="Just you"
          raw
          options={friends.map((u) => ({ key: u.id, label: displayHandle(u.handle) }))}
          selected={coHosts}
          onChange={setCoHosts}
        />
      ) : (
        <DsText v="caption">Co-hosts come from your crew. Join or start one from Me.</DsText>
      )}
    </>
  );

  const review = (
    <>
      <View>
        <ReviewRow label="What" value={`${EVENT_LABELS[type]} · ${title.trim() || 'No name yet'}`} onEdit={() => go(0)} />
        <RowDivider />
        <ReviewRow label="When" value={chosen.ok ? `${startText}${isPublicType(type) ? '' : ` · ${revealText.toLowerCase()}`}` : chosen.reason} onEdit={() => go(1)} />
        <RowDivider />
        <ReviewRow
          label="Where"
          value={`${placed.length ? placed.map((p, i) => p.name || stopLabel(i, visibleStops.length)).join(' → ') : 'No stop placed'} · shown as ${areaName.trim() || suggestedAreaName}`}
          onEdit={() => go(2)}
        />
        <RowDivider />
        <ReviewRow label="Who's invited" value={describeFilter(filter)} onEdit={() => go(3)} />
        <RowDivider />
        <ReviewRow
          label="Hosts"
          value={crewOwned && myCrew ? `${myCrew.name} crew with ${['you', ...coHostNames].join(', ')}` : ['You', ...coHostNames].join(', ')}
          onEdit={() => go(3)}
        />
      </View>
      <Callout tone="info" title={inviteSentence(filter, peopleCount)}>
        {isPublicType(type) ? 'Anyone can see it and the stop.' : `${revealText}. Until then, people see the rough area and a circle about ${areaRadiusMiles * 2} mi across.`}
      </Callout>
      {leftOut ? (
        <Callout tone="warning" title="None of your own builds fits this invite" right={<Button tier="tertiary" size="sm" label="Change" onPress={() => go(3)} />}>
          You'd be hosting something you can't bring your own car or bike to.
        </Callout>
      ) : null}
      {bans.map(({ st, zone }) => (
        <ZoneNotice key={st.key} zone={zone!} subject={st.name || 'A stop'} />
      ))}
    </>
  );

  const body = [what, whenStep, whereStep, whoStep, review][step];
  const last = step === 4;

  return (
    <View style={{ flex: 1, backgroundColor: COLOR.surface.bg }}>
      <ScrollView
        ref={scroll as never}
        contentContainerStyle={{ padding: SPACING.screen, gap: SPACING.lg, paddingBottom: SPACING.xxxl }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        automaticallyAdjustKeyboardInsets
      >
        <StepBar step={step} onGo={(s) => (s < step ? go(s) : undefined)} />
        <Section title={STEPS[step]}>
          <View style={{ gap: SPACING.lg }}>{body}</View>
        </Section>
      </ScrollView>
      <View style={{ paddingHorizontal: SPACING.screen, paddingTop: SPACING.md, paddingBottom: Math.max(insets.bottom, SPACING.lg), gap: SPACING.sm, borderTopWidth: 1, borderTopColor: COLOR.surface.border, backgroundColor: COLOR.surface.bg }}>
        {error ? <ErrorState title={error} /> : null}
        <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
          {step > 0 ? <Button label="Back" tier="secondary" onPress={() => go((step - 1) as Step)} /> : null}
          <View style={{ flex: 1 }}>
            {last ? <Button label={submitLabel} block busy={saving} haptic="success" onPress={save} /> : <Button label="Next" block onPress={nextStep} />}
          </View>
        </View>
      </View>

      <MapPicker
        visible={picking !== null}
        mode="point"
        title={picking !== null ? `Place the ${stopLabel(picking, visibleStops.length).toLowerCase()}` : ''}
        hint="Move the map so the crosshair is on the stop, or tap a grey pin to use a known place."
        confirmLabel={picking !== null && visibleStops[picking]?.at ? 'Move it here' : 'Set stop here'}
        start={(picking !== null && (visibleStops[picking]?.at ?? [...visibleStops.slice(0, picking)].reverse().find((x) => x.at)?.at)) || placed[0]?.at || meUser.home}
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
    </View>
  );
}

/** "Cars and bikes · Class A–S · 3+ mods · within 25 mi" as a sentence about who gets the invite. */
function inviteSentence(filter: InviteFilter, people: string): string {
  if (filter.everyone) return `Anyone within ${filter.radiusMiles} mi can go (${people} people near here).`;
  const kinds = filter.cars && !filter.bikes ? 'cars' : filter.bikes && !filter.cars ? 'bikes' : 'cars and bikes';
  const cls = filter.classes.length ? `, class ${classRange(filter.classes)}` : '';
  const mods = filter.minMods > 0 ? ` with ${plural(filter.minMods, 'mod')} or more` : '';
  const brands = filter.brands.length ? ` (${filter.brands.join(', ')})` : '';
  return `Invites ${kinds}${cls}${mods}${brands} within ${filter.radiusMiles} mi: ${people} people match.`;
}

function ReviewRow({ label, value, onEdit }: { label: string; value: string; onEdit: () => void }) {
  return <ListRow title={value} subtitle={label} trailing={<Button tier="tertiary" size="sm" label="Edit" accessibilityLabel={`Edit ${label}`} onPress={onEdit} />} />;
}

/** Where you are in the five steps. Earlier steps can be tapped to go back. */
function StepBar({ step, onGo }: { step: Step; onGo: (s: Step) => void }) {
  return (
    <View accessibilityRole="progressbar" accessibilityLabel={`Step ${step + 1} of ${STEPS.length}: ${STEPS[step]}`} style={{ gap: SPACING.sm }}>
      <View style={{ flexDirection: 'row', gap: SPACING.xs }}>
        {STEPS.map((s, i) => (
          <Press key={s} onPress={i < step ? () => onGo(i as Step) : undefined} disabled={i >= step} label={`Back to ${s}`} style={{ flex: 1, paddingVertical: SPACING.sm }}>
            <View style={{ height: 4, borderRadius: 2, backgroundColor: i <= step ? COLOR.action.primary : COLOR.surface.raisedHi }} />
          </Press>
        ))}
      </View>
      <DsText v="meta">
        Step {step + 1} of {STEPS.length}
      </DsText>
    </View>
  );
}
