import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigation, usePreventRemove } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BAN_ZONES } from '../data/seed';
import { eventArea } from '../lib/area';
import { useNow } from '../lib/clock';
import { isCrewHost } from '../lib/crews';
import { banZoneAt, duplicateHosted, EVENT_LABELS, isPublicType, stopsFromDraft, type DraftStop } from '../lib/events';
import { formatWhen, plural } from '../lib/format';
import { fitRegion } from '../lib/geo';
import { leadText, LOCATION, MEET_POINT } from '../lib/glossary';
import { classRange, DEFAULT_FILTER, describeFilter, fromVehicleSelection, hostLeftOut, invitees, leftOutMessage, normaliseFilter, vehicleSelection, type VehicleKey } from '../lib/invites';
import { geocoderAvailable, nameForPlace, townForPlace } from '../lib/location';
import { shouldAutoName } from '../lib/placeNames';
import { nearestRegion } from '../lib/profile';
import { newId, useStore } from '../lib/store';
import type { LatLng } from '../lib/types';
import { CLASS_LETTERS, type ClassLetter, type EventType, type InviteFilter, type NightEvent } from '../lib/types';
import { defaultStart, endFrom, EVENING_TIMES, MAX_DAYS_AHEAD, orderedTimes, pickedDayChoice, quickDays, startFrom, timeAfter, type DayChoice } from '../lib/when';
import { clearHostDraft, restoredDay, saveHostDraft, worthKeeping, type HostDraft } from '../lib/hostDraft';
import { BrandPicker } from './BrandPicker';
import { injunctionConfirmText, publishCheck, zonePins, zoneShapes, zoneShortName } from '../lib/zones';
import { COLOR, RADII, SPACING } from '../theme';
import { Callout, Field, MediaFrame, TextField } from './Detail';
import { Button, ChipGroup, ChoiceGroup, DateSheet, displayHandle, DsText, ErrorState, localDay, Press, RowDivider, Section, Sheet, StatBlock, SwitchRow } from './ds';
import { MapPicker } from './MapPicker';
import { NightMap } from './NightMap';
import { ZoneNotice } from './ZoneCard';

/** Meet bans drawn on the map: circles, and council outlines for borough-wide orders. */
const BAN_SHAPES = zoneShapes(BAN_ZONES, COLOR.state.warning);
const BAN_PINS = zonePins(BAN_ZONES, COLOR.state.warning);

const TYPES: EventType[] = ['meet', 'cruise', 'rolling', 'show', 'trackday'];
const TYPE_HINTS: Record<EventType, string> = {
  cruise: 'A planned route with regroup points. The whole route is shown to everyone going at the time you pick.',
  rolling: 'A meet in several parts. Every meet point is placed now. People going see the one it is at; a host moves it on to the next.',
  meet: 'One meet point. Pick somewhere with permission, or a meet spot that welcomes meets.',
  show: 'A public show. The venue is visible to everyone.',
  trackday: 'A circuit or sprint venue. Public, and the only place lap times count.',
};
/** Quick start times; "Other time" offers every 15 minutes (REVIEW-9 decision 4). No 10:00 (REVIEW-10). */
const TIME_CHOICES = EVENING_TIMES;
/** Quick end times: hours after the start. */
const LENGTH_CHOICES = [120, 180, 240];
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
/** What the form showed when it was sent: the invite count ("12", "fewer than 3", "…" while counting). */
export interface EventFormSent {
  invited: string;
}

export function EventForm({
  initial,
  draft,
  submitLabel,
  onSubmit,
}: {
  initial?: NightEvent;
  /** A new event: the saved draft to carry on with (REVIEW-10 decision 2). */
  draft?: HostDraft | null;
  submitLabel: string;
  onSubmit: (event: NightEvent, sent: EventFormSent) => void | Promise<void>;
}) {
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

  const d0 = !initial ? draft : null;
  const [step, setStep] = useState<Step>(() => (d0 ? (Math.min(Math.max(d0.step, 0), 4) as Step) : 0));
  const [baseDays] = useState<DayChoice[]>(() =>
    initial ? [{ label: formatWhen(initial.startsAt, now).replace(/ \d\d:\d\d$/, '') + ' (as planned)', days: 0, date: initial.startsAt }, ...quickDays(now)] : quickDays(now),
  );
  const [startDefault] = useState(() => (d0 ? restoredDay(d0, baseDays, now) : null));
  const [firstStart] = useState(() => defaultStart(now));
  /** A date from "Pick a date", shown as its own choice once picked. */
  const [pickedDay, setPickedDay] = useState<DayChoice | null>(startDefault?.picked ?? null);
  const dayChoices = dayChoicesOf(baseDays, pickedDay);
  const [pickDateOpen, setPickDateOpen] = useState(false);
  /** Which time the hour-and-minute sheet is setting. */
  const [timeSheet, setTimeSheet] = useState<'start' | 'end' | null>(null);
  const [endTime, setEndTime] = useState<string | null>(initial?.endsAt ? hhmm(initial.endsAt) : (d0?.endTime ?? null));
  const [type, setType] = useState<EventType>(initial?.type ?? d0?.type ?? 'meet');
  const [title, setTitle] = useState(initial?.title ?? d0?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? d0?.description ?? '');
  const [areaName, setAreaName] = useState(initial?.areaName ?? d0?.areaName ?? '');
  const [day, setDay] = useState(startDefault ? startDefault.index : initial ? 0 : firstStart.day);
  const [time, setTime] = useState(initial ? hhmm(initial.startsAt) : (d0?.time ?? firstStart.time));
  const [stops, setStops] = useState<DraftStop[]>(() =>
    initial
      ? initial.stops.map((st) => ({ key: st.id, name: st.name, at: st.at }))
      : d0?.stops?.length
        ? d0.stops
        : [
          { key: 's0', name: '' },
          { key: 's1', name: '' },
        ],
  );
  const [activeStop, setActiveStop] = useState(0);
  const [filter, setFilter] = useState<InviteFilter>(initial ? { ...initial.filter } : d0 ? { ...DEFAULT_FILTER, ...d0.filter } : { ...DEFAULT_FILTER });
  const [reveal, setReveal] = useState(initial?.revealMinutesBefore ?? d0?.reveal ?? 60);
  const [crewOwned, setCrewOwned] = useState(initial ? !!initial.crewId : d0 ? d0.crewOwned && canCrewHost : canCrewHost);
  const [coHosts, setCoHosts] = useState<string[]>(initial ? initial.hostIds.filter((h) => h !== me) : (d0?.coHosts ?? []));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  /** Set once Next was tapped on Where, so unnamed meet points show their own error. */
  const [checkNames, setCheckNames] = useState(false);
  /** The court-injunction confirm is open. */
  const [askInjunction, setAskInjunction] = useState(false);
  /** PSPOs the host has said they checked (by zone id), for the Review step's lighter confirm. */
  const [pspoAck, setPspoAck] = useState<string>('');

  // ---------------------------------------------------------------------------
  // The draft (REVIEW-10 decision 2): saved as you go; leaving from step 2 on asks first.
  // ---------------------------------------------------------------------------
  const dayPicked = dayChoicesOf(baseDays, pickedDay)[Math.min(day, baseDays.length + (pickedDay ? 1 : 0) - 1)];
  const draftNow: HostDraft = { step, type, title, description, areaName, day: dayPicked, time, endTime, reveal, stops, filter, crewOwned, coHosts, savedAt: '' };
  const draftKey = JSON.stringify(draftNow);
  /** Set once the event is sent (or the draft thrown away), so leaving never asks again. */
  const finished = useRef(false);
  useEffect(() => {
    if (editing || finished.current || !worthKeeping(draftNow)) return;
    const t = setTimeout(() => {
      if (!finished.current) saveHostDraft(me, { ...draftNow, savedAt: new Date().toISOString() });
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftKey, editing, me]);
  const navigation = useNavigation();
  const [leaveAction, setLeaveAction] = useState<{ type: string } | null>(null);
  /** Leaving is allowed (sent, kept or discarded); `action` is the navigation to finish once the guard is off. */
  const [exit, setExit] = useState<{ action: { type: string } | null } | null>(null);
  usePreventRemove(!editing && step >= 1 && !exit, ({ data }) => {
    // Dispatching from inside the guard would be stopped again (and loop): turn it off first.
    if (finished.current) setExit({ action: data.action });
    else setLeaveAction(data.action);
  });
  useEffect(() => {
    if (exit?.action) navigation.dispatch(exit.action as never);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exit]);
  function leave(keep: boolean) {
    const action = leaveAction;
    setLeaveAction(null);
    finished.current = true;
    if (keep) saveHostDraft(me, { ...draftNow, savedAt: new Date().toISOString() });
    else clearHostDraft(me);
    setExit({ action });
  }

  const chosen = startFrom(dayChoices[Math.min(day, dayChoices.length - 1)], time, now);
  const chosenEnd = chosen.ok ? endFrom(chosen.start, endTime) : null;

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
  // Warn only (owner), but a court injunction needs "Publish anyway" and a PSPO a tick on Review.
  const check = publishCheck(placed, BAN_ZONES);
  const psposKey = check.pspos.map((z) => z.id).join(',');
  const pspoOk = !psposKey || pspoAck === psposKey;
  const verb = editing ? 'Save' : 'Publish';
  const friends = meUser.crewId ? users.filter((u) => u.id !== me && u.crewId === meUser.crewId) : [];
  const myBuilds = builds.filter((b) => b.ownerId === me);
  const leftOut = !isPublicType(type) && hostLeftOut(filter, myBuilds);
  const leftOutWhy = leftOut ? leftOutMessage(filter, myBuilds) : null;

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
    if (type === 'rolling') return `Meet point ${i + 1}`;
    if (type === 'show') return 'Venue';
    if (type === 'trackday') return 'Circuit';
    return 'Meet point';
  }

  /** What's missing on a step, if anything (shown under Next, which stays tappable). */
  function problem(s: Step): string | null {
    if (s === 0 && !title.trim()) return 'Give the event a name.';
    if (s === 1 && !chosen.ok) return chosen.reason;
    if (s === 2) {
      if (!visibleStops[0]?.at) return `Choose the ${stopLabel(0, visibleStops.length).toLowerCase()} on the map.`;
      if (type === 'cruise' && placed.length < 2) return 'A cruise needs at least a start and a finish.';
      if (type === 'rolling' && visibleStops.some((x) => !x.at)) return 'Place every meet point on the map. Rolling meets are planned in full before they start.';
      const unnamed = visibleStops.findIndex((x) => x.at && !x.name.trim());
      if (unnamed >= 0) return `Give the ${stopLabel(unnamed, visibleStops.length).toLowerCase()} a name people will recognise.`;
    }
    return null;
  }

  function go(next: Step) {
    setError(null);
    setStep(next);
    scroll.current?.scrollTo({ y: 0, animated: false });
  }

  function nextStep() {
    if (step === 2) setCheckNames(true);
    const p = problem(step);
    if (p) return setError(p);
    go((step + 1) as Step);
  }

  /** Publish: checks every step, then asks before a court injunction (warn only, never blocked). */
  function save() {
    if (saving) return;
    for (const s of [0, 1, 2] as Step[]) {
      const p = problem(s);
      if (p) {
        if (s === 2) setCheckNames(true);
        setStep(s);
        return setError(p);
      }
    }
    if (!pspoOk) return setError(`Tick that you've checked the PSPO first.`);
    if (check.injunction) return setAskInjunction(true);
    return publish();
  }

  async function publish() {
    setAskInjunction(false);
    if (saving) return;
    const used = visibleStops;
    const id = initial?.id ?? newId('ev');
    const finalStops = stopsFromDraft(id, used, initial?.stops ?? [], stopLabel);
    // The rough area is fuzzed from the stops with the event's own id, so it never sits on a stop.
    const where = eventArea(finalStops.map((st) => st.at!), id, isPublicType(type));
    const when = startFrom(dayChoices[Math.min(day, dayChoices.length - 1)], time, new Date());
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
      // Nothing narrowed is "everyone" (the DB's invite_everyone), so the summary says "Anyone within X mi".
      filter: normaliseFilter(filter),
      going: initial?.going ?? [me],
      checkIns: initial?.checkIns ?? {},
    };
    // The optional end time: the same evening, or the small hours after (REVIEW-9 decision 4).
    const end = endFrom(start, endTime);
    if (end) event.endsAt = end.toISOString();
    else delete event.endsAt;
    const twin = !initial ? duplicateHosted(store.events, event, me) : undefined;
    if (twin) return setError(`You already host ${twin.title} at that time. Open it from Tonight, or change the name or time.`);
    setError(null);
    setSaving(true);
    finished.current = true;
    setExit({ action: null });
    try {
      await onSubmit(event, { invited: peopleCount });
      if (!editing) clearHostDraft(me);
    } catch (e) {
      finished.current = false;
      setExit(null);
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
  // The preview frames the meet points placed so far, or opens on home.
  const preview = fitRegion(placed.map((p) => p.at!), 0.1) ?? { centre: meUser.home, span: 0.9 };
  function openPicker(i: number) {
    setActiveStop(i);
    setPicking(i);
  }

  const startText = chosen.ok ? `${formatWhen(chosen.start.toISOString(), now)}${chosenEnd ? ` to ${hhmm(chosenEnd.toISOString())}` : ''}` : '';
  const dayNow = dayChoices[Math.min(day, dayChoices.length - 1)];
  // The quick times that are still to come on this day, plus the one picked.
  const quickTimes = orderedTimes(dayNow, Array.from(new Set([...TIME_CHOICES, time])), now).filter((t) => t.time === time || startFrom(dayNow, t.time, now).ok);
  const endOptions = chosen.ok
    ? [
        { key: 'none', label: 'No set end' },
        ...Array.from(new Set([...LENGTH_CHOICES.map((m) => timeAfter(chosen.start, m)), ...(endTime ? [endTime] : [])])).map((t) => ({ key: t, label: `Until ${t}` })),
      ]
    : [{ key: 'none', label: 'No set end' }];
  const revealText = isPublicType(type) ? 'Visible to everyone' : `${LOCATION.lead(reveal)}, to people going`;
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
      <ChoiceGroup chips label="Day" options={dayChoices.map((d, i) => ({ key: String(i), label: d.label }))} value={String(Math.min(day, dayChoices.length - 1))} onChange={(k) => setDay(Number(k))} />
      <Button label="Pick a date" icon="plus" tier="tertiary" size="sm" onPress={() => setPickDateOpen(true)} accessibilityLabel="Pick any date in the next 60 days" style={{ alignSelf: 'flex-start' }} />
      <ChoiceGroup label="Start time" options={quickTimes.map((t) => ({ key: t.time, label: t.label }))} value={time} onChange={setTime} />
      <Button label="Other time" icon="plus" tier="tertiary" size="sm" onPress={() => setTimeSheet('start')} accessibilityLabel="Pick any start time, in 15-minute steps" style={{ alignSelf: 'flex-start' }} />
      <ChoiceGroup chips label="End time (optional)" options={endOptions} value={endTime ?? 'none'} onChange={(k) => setEndTime(k === 'none' ? null : k)} />
      <Button label="Other end time" icon="plus" tier="tertiary" size="sm" onPress={() => setTimeSheet('end')} style={{ alignSelf: 'flex-start' }} />
      {chosen.ok ? <DsText v="bodyStrong">Starts {startText}</DsText> : <ErrorState title={chosen.reason} />}
      {!isPublicType(type) ? (
        <>
          <ChoiceGroup
            label={LOCATION.setting}
            options={REVEAL_CHOICES.map((m) => ({ key: String(m), label: m === 0 ? 'At the start' : `${leadText(m)} before` }))}
            value={String(reveal)}
            onChange={(k) => setReveal(Number(k))}
          />
          <DsText v="secondary">{LOCATION.toGoing}. Until then they only see the area.</DsText>
        </>
      ) : null}
    </>
  );

  const whereStep = (
    <>
      <DsText v="secondary">
        Choose {singlePlace ? `the ${MEET_POINT.one}` : `each ${MEET_POINT.one}`} on the map: move it until the crosshair is on it. It's named after the street or the known place it's on; edit the name if you like. Each one is checked against meet bans.
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
              placeholder={st.at && geocoderAvailable ? 'Naming it from the map…' : `Name this ${MEET_POINT.one}`}
              accessibilityLabel={`${label} name`}
            />
            {checkNames && st.at && !st.name.trim() ? (
              <DsText v="caption" tone="danger">
                Name it, e.g. the car park or venue people know it by.
              </DsText>
            ) : st.at && autoNames.current[st.key] && st.name === autoNames.current[st.key] ? (
              <DsText v="caption">Named from the map. Edit it if people know it by another name.</DsText>
            ) : null}
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
          label={type === 'cruise' ? 'Add a regroup point' : `Add a ${MEET_POINT.one}`}
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
        hint={isPublicType(type) ? 'Shown with the event.' : `Until the location shows, people only see this name and ${areaCircle(areaRadiusMiles)} that doesn't centre on any ${MEET_POINT.one}.`}
      >
        <TextField value={areaName} onChangeText={setAreaName} placeholder={`e.g. ${suggestedAreaName}`} maxLength={30} accessibilityLabel="Area name" />
      </Field>
    </>
  );

  const vehicles = vehicleSelection(filter);
  // No Public switch (REVIEW-9 decision 5): nothing picked in a row means everyone in it.
  const whoStep = (
    <>
      {(
        <>
          <DsText v="secondary">Pick nothing in a row to invite everyone in it. Nothing picked at all: anyone within the radius.</DsText>
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
          <DsText v="caption">Class S to D is a build's power for its weight: S the quickest, D the gentlest. Pick none for every class.</DsText>
          <ChoiceGroup
            label="Minimum mods"
            options={MOD_CHOICES.map((n) => ({ key: String(n), label: n === 0 ? 'Any' : `${n}+` }))}
            value={String(filter.minMods)}
            onChange={(k) => setFilter((f) => ({ ...f, minMods: Number(k) }))}
          />
          <BrandPicker vehicles={vehicles} selected={filter.brands} onChange={(brands) => setFilter((f) => ({ ...f, brands }))} />
        </>
      )}
      <ChoiceGroup label="Radius from the area" options={RADIUS_CHOICES.map((r) => ({ key: String(r), label: `${r} mi` }))} value={String(filter.radiusMiles)} onChange={(k) => setFilter((f) => ({ ...f, radiusMiles: Number(k) }))} />
      <StatBlock
        stats={[
          { label: peopleCount === '1' ? 'Person matches' : 'People match', value: peopleCount },
          { label: buildCount === '1' ? 'Build matches' : 'Builds match', value: buildCount },
        ]}
      />
      {remote && serverCount === 'offline' ? <DsText v="caption">Can't count while offline.</DsText> : null}
      {leftOut ? (
        <Callout tone="warning" title="None of your own builds fits this invite">
          {`${leftOutWhy} Change it, or you'll be hosting something you can't bring a car or bike to.`}
        </Callout>
      ) : null}
      {myCrew && (canCrewHost || initial?.crewId === myCrew.id) ? (
        <SwitchRow label={`Crew event: ${myCrew.name}`} hint="The crew owner and hosts can host, move on and edit." value={crewOwned} onValueChange={setCrewOwned} />
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
          value={`${placed.length ? placed.map((p, i) => p.name || stopLabel(i, visibleStops.length)).join(' → ') : 'Nothing placed'} · shown as ${areaName.trim() || suggestedAreaName}`}
          onEdit={() => go(2)}
        />
        <RowDivider />
        <ReviewRow label="Who's invited" value={describeFilter(normaliseFilter(filter))} onEdit={() => go(3)} />
        <RowDivider />
        <ReviewRow
          label="Hosts"
          value={crewOwned && myCrew ? `${myCrew.name} crew with ${['you', ...coHostNames].join(', ')}` : ['You', ...coHostNames].join(', ')}
          onEdit={() => go(3)}
        />
      </View>
      <Callout tone="info" title={inviteSentence(normaliseFilter(filter), peopleCount)}>
        {isPublicType(type) ? 'Anyone can see it and where it is.' : `${revealText}. Until then, people see the area name and ${areaCircle(areaRadiusMiles)}.`}
      </Callout>
      {leftOut ? (
        <Callout tone="warning" title="None of your own builds fits this invite" right={<Button tier="tertiary" size="sm" label="Change" onPress={() => go(3)} />}>
          {`${leftOutWhy} You'd be hosting something you can't bring your own car or bike to.`}
        </Callout>
      ) : null}
      {bans.map(({ st, zone }) => (
        <ZoneNotice key={st.key} zone={zone!} subject={st.name || `A ${MEET_POINT.one}`} />
      ))}
      {check.pspos.length ? (
        <SwitchRow
          label={`I've checked the PSPO rules for ${check.pspos.map(zoneShortName).join(' and ')}`}
          hint="A PSPO can make meets and gathering to watch an offence, with a fine. Nightshift only warns."
          value={pspoOk}
          onValueChange={(v) => setPspoAck(v ? psposKey : '')}
        />
      ) : null}
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
            {last ? (
              <Button label={submitLabel} block busy={saving} haptic="success" onPress={save} disabled={!pspoOk} hint={pspoOk ? undefined : "Tick that you've checked the PSPO first"} />
            ) : (
              <Button label="Next" block onPress={nextStep} />
            )}
          </View>
        </View>
      </View>

      <MapPicker
        visible={picking !== null}
        mode="point"
        title={picking !== null ? `Place the ${stopLabel(picking, visibleStops.length).toLowerCase()}` : ''}
        hint={`Move the map so the crosshair is on the ${picking !== null ? stopLabel(picking, visibleStops.length).toLowerCase() : MEET_POINT.one}, or tap a grey pin to use a known place. Orange outlines and pins are meet bans.`}
        confirmLabel={picking !== null ? `${visibleStops[picking]?.at ? 'Move' : 'Set'} ${stopLabel(picking, visibleStops.length).toLowerCase()} here` : ''}
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

      {pickDateOpen ? (
        <DateSheet
          visible
          title="Pick a date"
          value={dayNow.date ? localDay(new Date(dayNow.date)) : chosen.ok ? localDay(chosen.start) : null}
          min={localDay(now)}
          max={localDay(new Date(now.getTime() + MAX_DAYS_AHEAD * 86_400_000))}
          onClose={() => setPickDateOpen(false)}
          onPick={(d) => {
            setPickedDay(pickedDayChoice(d, now));
            setDay(baseDays.length);
            setPickDateOpen(false);
          }}
        />
      ) : null}

      <Sheet visible={leaveAction !== null} title="Keep this meet as a draft?" onClose={() => setLeaveAction(null)} doneLabel="Stay">
        <View style={{ gap: SPACING.md }}>
          <DsText v="body">{`${title.trim() || 'Your meet'} is saved on this phone. Open Host again to carry on where you left off.`}</DsText>
          <Button label="Keep draft" block onPress={() => leave(true)} />
          <Button label="Discard" tier="destructive" block onPress={() => leave(false)} />
        </View>
      </Sheet>

      <TimeSheet
        visible={timeSheet !== null}
        title={timeSheet === 'end' ? 'End time' : 'Start time'}
        value={timeSheet === 'end' ? (endTime ?? (chosen.ok ? timeAfter(chosen.start, 180) : '23:00')) : time}
        onPick={(t) => (timeSheet === 'end' ? setEndTime(t) : setTime(t))}
        onClose={() => setTimeSheet(null)}
      />

      <Sheet visible={askInjunction} title="Court injunction" onClose={() => setAskInjunction(false)} doneLabel="Cancel">
        <View style={{ gap: SPACING.md }}>
          {check.injunction ? <DsText v="body">{injunctionConfirmText(check.injunction.zone, verb)}</DsText> : null}
          {check.injunction ? <DsText v="caption">{`${check.injunction.stop || stopLabel(0, visibleStops.length)} is inside it. Nightshift only warns: you're responsible for where you send people.`}</DsText> : null}
          <Button
            label="Change location"
            block
            onPress={() => {
              setAskInjunction(false);
              go(2);
            }}
          />
          <Button label={`${verb} anyway`} tier="destructive" block busy={saving} onPress={publish} />
        </View>
      </Sheet>
    </View>
  );
}

function dayChoicesOf(base: DayChoice[], picked: DayChoice | null): DayChoice[] {
  return picked ? [...base, picked] : base;
}

/** Hours from the morning round to the small hours, so evening times sit together. */
const HOURS = [...Array.from({ length: 18 }, (_, i) => i + 6), 0, 1, 2, 3, 4, 5].map((h) => String(h).padStart(2, '0'));
const MINUTES = ['00', '15', '30', '45'];

/** Any time in 15-minute steps: an hour, then the minutes (REVIEW-9 decision 4). */
function TimeSheet({ visible, title, value, onPick, onClose }: { visible: boolean; title: string; value: string; onPick: (t: string) => void; onClose: () => void }) {
  const [h, m] = value.split(':');
  const minute = MINUTES.includes(m) ? m : '00';
  return (
    <Sheet visible={visible} title={title} onClose={onClose}>
      <View style={{ gap: SPACING.lg }}>
        <DsText v="title">{`${h}:${minute}`}</DsText>
        <ChoiceGroup label="Hour" options={HOURS.map((x) => ({ key: x, label: x }))} value={h} onChange={(x) => onPick(`${x}:${minute}`)} />
        <ChoiceGroup label="Minutes" options={MINUTES.map((x) => ({ key: x, label: `:${x}` }))} value={minute} onChange={(x) => onPick(`${h}:${x}`)} />
      </View>
    </Sheet>
  );
}

/** One wording for the rough area on Where and Review: its size across, as people see it on the map. */
function areaCircle(radiusMiles: number): string {
  return `a circle about ${radiusMiles * 2} mi across`;
}

/** "Cars and bikes · Class A–S · 3+ mods · within 25 mi" as a sentence about who gets the invite. */
function inviteSentence(filter: InviteFilter, people: string): string {
  const n = Number(people);
  const who = people === '1' ? '1 person' : `${people} people`;
  if (filter.everyone) return `Anyone within ${filter.radiusMiles} mi can go (${who} near here).`;
  const kinds = filter.cars && !filter.bikes ? 'cars' : filter.bikes && !filter.cars ? 'bikes' : 'cars and bikes';
  const cls = filter.classes.length ? `, class ${classRange(filter.classes)}` : '';
  const mods = filter.minMods > 0 ? ` with ${plural(filter.minMods, 'mod')} or more` : '';
  const brands = filter.brands.length ? ` (${filter.brands.join(', ')})` : '';
  return `Invites ${kinds}${cls}${mods}${brands} within ${filter.radiusMiles} mi: ${who} ${n === 1 ? 'matches' : 'match'}.`;
}

/** Label above the value, as in every other form (REVIEW-7 inconsistency 13). */
function ReviewRow({ label, value, onEdit }: { label: string; value: string; onEdit: () => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingVertical: SPACING.sm, minHeight: 56 }}>
      <View style={{ flex: 1, gap: SPACING.xxs }}>
        <DsText v="label">{label}</DsText>
        <DsText v="body">{value}</DsText>
      </View>
      <Button tier="tertiary" size="sm" label="Edit" accessibilityLabel={`Edit ${label}`} onPress={onEdit} />
    </View>
  );
}

/** Where you are in the five steps. Earlier steps can be tapped to go back. */
function StepBar({ step, onGo }: { step: Step; onGo: (s: Step) => void }) {
  return (
    <View accessibilityRole="progressbar" accessibilityLabel={`Step ${step + 1} of ${STEPS.length}: ${STEPS[step]}`} style={{ gap: SPACING.sm }}>
      <View style={{ flexDirection: 'row', gap: SPACING.xs }}>
        {STEPS.map((s, i) => (
          <Press key={s} onPress={i < step ? () => onGo(i as Step) : undefined} disabled={i >= step} label={`Back to ${s}`} style={{ flex: 1, paddingVertical: SPACING.sm }}>
            <View style={{ height: 4, borderRadius: RADII.pill, backgroundColor: i <= step ? COLOR.action.primary : COLOR.surface.raisedHi }} />
          </Press>
        ))}
      </View>
      <DsText v="meta">
        Step {step + 1} of {STEPS.length}
      </DsText>
    </View>
  );
}
