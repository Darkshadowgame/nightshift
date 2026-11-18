import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigation, usePreventRemove } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { BAN_ZONES } from '../data/seed';
import { appNow } from '../lib/appClock';
import { eventArea } from '../lib/area';
import { useNow } from '../lib/clock';
import { isCrewHost } from '../lib/crews';
import { banZoneAt, duplicateHosted, EVENT_LABELS, isPublicType, stopsFromDraft, type DraftStop } from '../lib/events';
import { fitRegion } from '../lib/geo';
import { leadText, locationSentence, MEET_POINT } from '../lib/glossary';
import { clearHostDraft, saveHostDraft, worthKeeping, type HostDraft } from '../lib/hostDraft';
import { DEFAULT_FILTER, fromVehicleSelection, hostLeftOut, inviteRows, invitees, leftOutMessage, normaliseFilter, vehicleSelection, type VehicleKey } from '../lib/invites';
import { geocoderAvailable, nameForPlace, townForPlace } from '../lib/location';
import { fallbackPointName, shouldAutoName } from '../lib/placeNames';
import { areaNameNear } from '../lib/profile';
import { visibleSpots } from '../lib/spots';
import { newId, useStore } from '../lib/store';
import type { LatLng } from '../lib/types';
import { CLASS_LETTERS, type ClassLetter, type EventType, type InviteFilter, type NightEvent } from '../lib/types';
import { clock, defaultStart, endFrom, MAX_DAYS_AHEAD, quickDays, startFrom, timeRange, whenLabel } from '../lib/when';
import { injunctionConfirmText, publishCheck, pspoConfirmText } from '../lib/zones';
import { COLOR, EVENT_COLOURS, RADII, SPACING } from '../theme';
import { BrandPicker } from './BrandPicker';
import { Callout, MediaFrame } from './Detail';
import { ActionBar, Button, ChipGroup, ChoiceGroup, ConfirmSheet, DateTimeField, displayHandle, DsText, ErrorState, Field, Icon, PAGE_WITH_BAR, Press, RowDivider, Section, StepHeading, SwitchRow, TextField } from './ds';
import { MapPicker } from './MapPicker';
import { NightMap } from './NightMap';
import { ZoneNotice } from './ZoneCard';

/** What a host can make (Redesign 2, 3.6): Show and Track day still display, but aren't made here. */
const TYPES: EventType[] = ['meet', 'cruise', 'rolling'];
const TYPE_HINTS: Record<EventType, string> = {
  meet: 'One meet point. Pick somewhere with permission, or a meet spot that welcomes meets.',
  cruise: 'A planned route with regroup points. People going see the whole route when the location shows.',
  rolling: 'A meet in several parts. People going see the one it is at; you move it on to the next.',
  show: 'A public show. The venue is visible to everyone.',
  trackday: 'A circuit or sprint venue. Public, and the only place lap times count.',
};
const REVEAL_CHOICES = [0, 30, 60, 120];
const RADIUS_CHOICES = [10, 25, 50, 100];
const HOUR = 3_600_000;
/** A new meet ends 3 hours after it starts unless the host says otherwise. */
const DEFAULT_LENGTH = 3 * HOUR;

const STEPS = ['What and when', 'Where', "Who it's for", 'Check and post'] as const;
type Step = 0 | 1 | 2 | 3;
const LAST: Step = 3;

/** What the form showed when it was sent: the invite count ("12", "fewer than 3", "…" while counting). */
export interface EventFormSent {
  invited: string;
}

/** The first start for a new meet: tonight at 20:00, or the next sensible evening time. */
function firstStart(now: Date): Date {
  const d = defaultStart(now);
  const r = startFrom(quickDays(now)[d.day], d.time, now);
  if (r.ok) return r.start;
  const t = new Date(now.getTime() + 2 * HOUR);
  t.setMinutes(0, 0, 0);
  return t;
}

/** A saved draft's start, if it's still to come (older drafts saved a day choice and a time). */
function draftStart(d: HostDraft, now: Date): Date | null {
  if (!d.day || !d.time) return null;
  const r = startFrom(d.day, d.time, now);
  return r.ok ? r.start : null;
}

/**
 * The host flow (Redesign 2, 3.6), four steps: What and when → Where → Who it's for → Check and
 * post. Used to create an event and to edit one before it starts. `onSubmit` gets the finished
 * event and may throw with a readable reason.
 *
 * - The header's back goes to the step before. On the first step, leaving with changes asks
 *   first (4.2): "Discard this meet?" or "Discard your changes?", Discard it / Keep editing. A new
 *   meet is saved as a draft as you go, so a closed app still carries on where it left off.
 * - Next and Post live in the ActionBar and are never disabled. What's missing shows in the one
 *   message slot of the thing that needs it (a field's error replaces its hint), never in a band
 *   over the page (Review 12 decision 1).
 * - Where: one way to set a meet point, the map card ("Tap to place the meet point"); its name
 *   field appears once it's placed, and the area name starts as the nearest town.
 * - Meet bans warn, never block (owner): a court injunction or a PSPO asks before posting, with
 *   "Change location" as the main button.
 * - Invites follow the chip rule: nothing picked in a row means everyone in it.
 */
export function EventForm({
  initial,
  draft,
  submitLabel,
  onSubmit,
}: {
  initial?: NightEvent;
  /** A new event: the saved draft to carry on with (REVIEW-10 decision 2). */
  draft?: HostDraft | null;
  submitLabel?: string;
  onSubmit: (event: NightEvent, sent: EventFormSent) => void | Promise<void>;
}) {
  const store = useStore();
  const { users, builds, me, crews } = store;
  const now = useNow();
  const meUser = users.find((u) => u.id === me)!;
  const myCrew = crews.find((c) => c.id === meUser.crewId);
  /** Only crew owners and hosts can put an event under the crew. */
  const canCrewHost = isCrewHost(myCrew, me);
  const editing = !!initial;
  const scroll = useRef<{ scrollTo: (o: { y: number; animated?: boolean }) => void } | null>(null);

  const d0 = !initial ? draft : null;
  const [step, setStep] = useState<Step>(() => (d0 ? (Math.min(Math.max(d0.step, 0), LAST) as Step) : 0));
  const [type, setType] = useState<EventType>(initial?.type ?? (d0 && TYPES.includes(d0.type) ? d0.type : 'meet'));
  const [title, setTitle] = useState(initial?.title ?? d0?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? d0?.description ?? '');
  const [areaName, setAreaName] = useState(initial?.areaName ?? d0?.areaName ?? '');
  const [start, setStartRaw] = useState<Date>(() => (initial ? new Date(initial.startsAt) : (d0 && draftStart(d0, now)) || firstStart(now)));
  const [end, setEnd] = useState<Date | null>(() => {
    if (initial) return initial.endsAt ? new Date(initial.endsAt) : null;
    const s = (d0 && draftStart(d0, now)) || firstStart(now);
    if (d0 && draftStart(d0, now)) return endFrom(s, d0.endTime) ?? new Date(s.getTime() + DEFAULT_LENGTH);
    return new Date(s.getTime() + DEFAULT_LENGTH);
  });
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
  /** "Limit who can come" and "More options" are open. */
  const [limiting, setLimiting] = useState(() => !normaliseFilter(filter).everyone);
  const [more, setMore] = useState(false);
  /** What's missing, and where it shows: a field (`name`, `start`, `end`, `point`, `stop:<i>`) or the form. */
  const [error, setErrorRaw] = useState<{ at: string; message: string } | null>(null);
  const setError = (e: { at: string; message: string } | string | null) => setErrorRaw(typeof e === 'string' ? { at: 'form', message: e } : e);
  const errorAt = (at: string) => (error?.at === at ? error.message : null);
  /** Typing in a field clears its own error. */
  const clearAt = (at: string) => error?.at === at && setErrorRaw(null);
  const [saving, setSaving] = useState(false);
  /** The meet-ban confirm before posting is open. */
  const [askBan, setAskBan] = useState(false);

  /** A new start keeps the length the meet had (3 h to begin with). */
  function setStart(d: Date) {
    const length = end ? Math.max(15 * 60_000, end.getTime() - start.getTime()) : editing ? 0 : DEFAULT_LENGTH;
    setStartRaw(d);
    if (length) setEnd(new Date(d.getTime() + length));
  }

  // ---------------------------------------------------------------------------
  // The draft (REVIEW-10 decision 2): saved as you go, so a closed app carries on where it left off.
  // ---------------------------------------------------------------------------
  const draftNow: HostDraft = {
    step,
    type,
    title,
    description,
    areaName,
    day: { label: whenLabel(start, now), days: 0, date: start.toISOString() },
    time: clock(start),
    endTime: end ? clock(end) : null,
    reveal,
    stops,
    filter,
    crewOwned,
    coHosts,
    savedAt: '',
  };
  const draftKey = JSON.stringify(draftNow);
  const [startKey] = useState(draftKey);
  /** Set once the event is sent (or the draft kept or thrown away), so leaving never asks again. */
  const finished = useRef(false);
  useEffect(() => {
    if (editing || finished.current || !worthKeeping(draftNow)) return;
    const t = setTimeout(() => {
      if (!finished.current) saveHostDraft(me, { ...draftNow, savedAt: appNow().toISOString() });
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftKey, editing, me]);
  const navigation = useNavigation();
  const [leaveAction, setLeaveAction] = useState<{ type: string } | null>(null);
  /** Leaving is allowed (sent, kept or discarded); `action` is the navigation to finish once the guard is off. */
  const [exit, setExit] = useState<{ action: { type: string } | null } | null>(null);
  const changed = editing ? draftKey !== startKey : worthKeeping(draftNow);
  // Back (the header's, a swipe) goes to the step before; on the first step, a meet with anything
  // in it asks first (Discard it / Keep editing, 4.2).
  usePreventRemove(!exit && (step > 0 || changed), ({ data }) => {
    // Dispatching from inside the guard would be stopped again (and loop): turn it off first.
    if (finished.current) return setExit({ action: data.action });
    if (step > 0) return go((step - 1) as Step);
    setLeaveAction(data.action);
  });
  useEffect(() => {
    if (exit?.action) navigation.dispatch(exit.action as never);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exit]);
  function discard() {
    const action = leaveAction;
    setLeaveAction(null);
    finished.current = true;
    if (!editing) clearHostDraft(me);
    setExit({ action });
  }

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
  // The nearest town from the bundled list when there's no geocoder (the web preview): never the region.
  const suggestedAreaName = placed.length ? (town ?? areaNameNear(area)) : areaNameNear(meUser.home);
  // Once a point is placed, the area name starts as that town; a name the host typed is kept.
  const autoArea = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (!placed.length) return;
    if (areaName.trim() && areaName !== autoArea.current) return;
    autoArea.current = suggestedAreaName;
    if (areaName !== suggestedAreaName) setAreaName(suggestedAreaName);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suggestedAreaName, placed.length]);
  const shownArea = areaName.trim() || suggestedAreaName;
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
  const peopleCount = !remote ? String(localMatches.userIds.length) : serverCount === 'loading' ? '…' : serverCount === 'offline' ? '?' : serverCount.people === null ? 'fewer than 3' : String(serverCount.people);
  // Warn only (owner): a court injunction or a PSPO asks before posting.
  const check = publishCheck(placed, BAN_ZONES);
  const verb = editing ? 'Save' : 'Post';
  const friends = meUser.crewId ? users.filter((u) => u.id !== me && u.crewId === meUser.crewId) : [];
  const myBuilds = builds.filter((b) => b.ownerId === me);
  const leftOut = !isPublicType(type) && hostLeftOut(filter, myBuilds);
  const leftOutWhy = leftOut ? leftOutMessage(filter, myBuilds) : null;
  const postLabel = submitLabel ?? `Post ${EVENT_LABELS[type].toLowerCase()}`;

  function setStop(i: number, patch: Partial<DraftStop>) {
    setStops((xs) => xs.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  }

  /** Which meet point the full-screen map picker is placing, if it's open. */
  const [picking, setPicking] = useState<number | null>(null);
  /** The last name the geocoder gave each meet point, so a name the host typed is never overwritten. */
  const autoNames = useRef<Record<string, string>>({});

  /**
   * Drop a meet point, then name it after the street and town (the host can edit it). With no
   * geocoder (the web preview) or no answer, it's named from the nearest known place or town, so
   * the name is filled in before Next (Review 13).
   */
  function placeStop(i: number, at: LatLng, knownName?: string) {
    const key = stops[i]?.key;
    if (!key) return;
    if (knownName) {
      setStop(i, { at, name: shouldAutoName(stops[i].name, autoNames.current[key]) ? knownName : stops[i].name });
      autoNames.current[key] = knownName;
      return;
    }
    setStop(i, { at });
    nameForPlace(at).then((found) => {
      const name = found ?? fallbackPointName(at, visibleSpots(store.spots, me), areaNameNear(at));
      setStops((xs) =>
        xs.map((x) => {
          if (x.key !== key || x.at !== at || !shouldAutoName(x.name, autoNames.current[key])) return x;
          autoNames.current[key] = name;
          return { ...x, name };
        }),
      );
    });
  }

  function pointLabel(i: number, n: number) {
    if (type === 'cruise') return i === 0 ? 'Start' : i === n - 1 ? 'Finish' : `Regroup ${i}`;
    if (type === 'rolling') return `Meet point ${i + 1}`;
    if (type === 'show') return 'Venue';
    if (type === 'trackday') return 'Circuit';
    return 'Meet point';
  }

  /** What's missing on a step, if anything, and the field it belongs to (Next is never disabled). */
  function problem(s: Step): { at: string; message: string } | null {
    if (s === 0) {
      if (!title.trim()) return { at: 'name', message: 'Give the meet a name.' };
      if (start.getTime() <= appNow().getTime()) return { at: 'start', message: 'Pick a start time in the future.' };
      if (start.getTime() - appNow().getTime() > (MAX_DAYS_AHEAD + 1) * 86_400_000) return { at: 'start', message: `Pick a date in the next ${MAX_DAYS_AHEAD} days.` };
      if (end && end.getTime() <= start.getTime()) return { at: 'end', message: 'Pick an end after the start.' };
    }
    if (s === 1) {
      if (!visibleStops[0]?.at) return { at: 'point', message: `Tap the map to place the ${pointLabel(0, visibleStops.length).toLowerCase()}.` };
      if (type === 'cruise' && placed.length < 2) return { at: 'point', message: 'A cruise needs at least a start and a finish.' };
      if (type === 'rolling' && visibleStops.some((x) => !x.at)) return { at: 'point', message: 'Place every meet point on the map, or remove the empty one.' };
      const unnamed = visibleStops.findIndex((x) => x.at && !x.name.trim());
      if (unnamed >= 0) return { at: `stop:${unnamed}`, message: 'Name it the way people know it, e.g. the car park or venue.' };
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

  /** Post: checks every step, then asks before a meet ban (warn only, never blocked). */
  function save() {
    if (saving) return;
    for (const s of [0, 1] as Step[]) {
      const p = problem(s);
      if (p) {
        go(s);
        return setError(p);
      }
    }
    if (check.injunction || check.pspos.length) return setAskBan(true);
    return publish();
  }

  async function publish() {
    setAskBan(false);
    if (saving) return;
    const used = visibleStops;
    const id = initial?.id ?? newId('ev');
    const finalStops = stopsFromDraft(id, used, initial?.stops ?? [], pointLabel);
    // The area is fuzzed from the meet points with the event's own id, so it never sits on one.
    const where = eventArea(finalStops.map((st) => st.at!), id, isPublicType(type));
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
      areaName: shownArea,
      stops: finalStops,
      currentStop: initial?.currentStop ?? 0,
      revealMinutesBefore: isPublicType(type) ? 0 : reveal,
      hostIds,
      crewId: crewOwned ? (initial?.crewId ?? (canCrewHost ? myCrew?.id : undefined)) : undefined,
      // Nothing narrowed is "everyone" (the DB's invite_everyone): "Open to anyone within X mi".
      filter: normaliseFilter(filter),
      going: initial?.going ?? [me],
      checkIns: initial?.checkIns ?? {},
    };
    if (end) event.endsAt = end.toISOString();
    else delete event.endsAt;
    const twin = !initial ? duplicateHosted(store.events, event, me) : undefined;
    if (twin) return setError(`You already host ${twin.title} at that time. Change the name or the time.`);
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

  const typeColour = EVENT_COLOURS[type];
  const pointPins = (active: number | null) =>
    visibleStops.flatMap((st, i) =>
      st.at && i !== (active === null ? -1 : active)
        ? [{ id: `st:${i}`, at: st.at, glyph: type, colour: i === activeStop ? typeColour : COLOR.text.primary, title: st.name || pointLabel(i, visibleStops.length), size: active === null ? 36 : 28 }]
        : [],
    );
  const routePaths = type === 'cruise' && placed.length > 1 ? [{ id: 'r', coords: placed.map((p) => p.at!), colour: typeColour, dashed: true }] : [];
  // The preview frames the meet points placed so far, or opens on home.
  const preview = fitRegion(placed.map((p) => p.at!), 0.1) ?? { centre: meUser.home, span: 0.9 };
  function openPicker(i: number) {
    setActiveStop(i);
    setPicking(i);
  }

  const whenText = timeRange(start, end, now);
  // The host form of the location line (4.11), as on the "It's up" page: "People going see it at 09:00 (1 h before)."
  const revealText = isPublicType(type) ? 'Everyone sees where it is' : locationSentence({ state: 'host', time: clock(new Date(start.getTime() - reveal * 60_000)), leadMinutes: reveal });
  const coHostNames = coHosts.map((h) => displayHandle(users.find((u) => u.id === h)?.handle ?? h));
  const vehicles = vehicleSelection(filter);
  // Two plain rows, never one (Review 14 decision 1): who may come, then who we'll tell (the radius).
  const rows = inviteRows(normaliseFilter(filter), peopleCount);

  // ---------------------------------------------------------------------------
  // Steps
  // ---------------------------------------------------------------------------

  const whatWhen = (
    <>
      <ChoiceGroup
        label="Type"
        options={(editing ? [type] : TYPES).map((t) => ({ key: t, label: EVENT_LABELS[t] }))}
        value={type}
        onChange={(t) => !editing && setType(t)}
      />
      <DsText v="secondary">{TYPE_HINTS[type]}</DsText>
      <Field label="Name" error={errorAt('name')}>
        <TextField
          value={title}
          onChangeText={(t) => {
            setTitle(t);
            clearAt('name');
          }}
          placeholder="e.g. Sunday coffee and cars"
          maxLength={60}
          accessibilityLabel="Name"
        />
      </Field>
      <DateTimeField
        label="Starts"
        error={errorAt('start')}
        value={start}
        onChange={(d) => {
          setStart(d);
          clearAt('start');
          clearAt('end');
        }}
        minDate={now}
        maxDate={new Date(now.getTime() + MAX_DAYS_AHEAD * 86_400_000)}
        days={14}
        stepMinutes={15}
      />
      <DateTimeField
        label="Ends"
        error={errorAt('end')}
        value={end}
        onChange={(d) => {
          setEnd(d);
          clearAt('end');
        }}
        after={start} placeholder="No set end" minDate={new Date(start.getTime() + 15 * 60_000)} maxDate={new Date(start.getTime() + 24 * HOUR)} stepMinutes={15} />
      <Field label="Details (optional)">
        <TextField value={description} onChangeText={setDescription} placeholder="Anything people should know" multiline multilineHeight={88} accessibilityLabel="Details" />
      </Field>
    </>
  );

  // The map card is the one way to place a point: it opens on the next point still to place.
  const nextToPlace = singlePlace ? 0 : Math.max(0, visibleStops.findIndex((x) => !x.at));
  const cardTarget = visibleStops.every((x) => x.at) ? activeStop : nextToPlace;
  const cardLabel = pointLabel(cardTarget, visibleStops.length).toLowerCase();
  const whereStep = (
    <>
      <View style={{ gap: SPACING.xs }}>
        <Press
          onPress={() => {
            clearAt('point');
            openPicker(cardTarget);
          }}
          label={placed.length && visibleStops[cardTarget]?.at ? `Move the ${cardLabel} on the map` : `Place the ${cardLabel} on the map`}
          feedback="card"
        >
          <MediaFrame height={180} style={errorAt('point') ? { borderColor: COLOR.state.danger } : undefined}>
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
              {/* Only your own points: meet bans show in the picker, with their legend, and under a point that's in one (Review 13). */}
              <NightMap pins={pointPins(null)} paths={routePaths} centre={preview.centre} span={preview.span} follow />
            </View>
            {placed.length === 0 ? (
              <View pointerEvents="none" style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', gap: SPACING.xs, backgroundColor: COLOR.surface.scrim }]}>
                <Icon name="pin" size={24} colour={COLOR.text.primary} />
                <DsText v="bodyStrong">{`Tap to place the ${cardLabel}`}</DsText>
              </View>
            ) : (
              <View pointerEvents="none" style={{ position: 'absolute', left: SPACING.sm, top: SPACING.sm, flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xxs, borderRadius: RADII.pill, backgroundColor: COLOR.surface.glass }}>
                <Icon name="pin" size={14} colour={COLOR.text.primary} />
                <DsText v="meta" style={{ color: COLOR.text.primary }}>
                  {visibleStops[cardTarget]?.at ? `Tap to move the ${cardLabel}` : `Tap to place the ${cardLabel}`}
                </DsText>
              </View>
            )}
          </MediaFrame>
        </Press>
        {errorAt('point') ? (
          <DsText v="caption" tone="danger" accessibilityLiveRegion="polite">
            {errorAt('point')}
          </DsText>
        ) : null}
      </View>
      {visibleStops.map((st, i) => {
        const zone = st.at ? banZoneAt(st.at, BAN_ZONES) : undefined;
        const label = pointLabel(i, visibleStops.length);
        const removable = !singlePlace && visibleStops.length > 2;
        const remove = () => {
          setStops((xs) => xs.filter((_, j) => j !== i));
          setActiveStop(0);
        };
        // A point not placed yet has no field (nothing to type until it's on the map).
        if (!st.at) {
          if (singlePlace) return null;
          return (
            <View key={st.key} style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
              <DsText v="label" style={{ flex: 1 }}>{`${label}: not placed yet`}</DsText>
              {removable ? <Button label="Remove" tier="tertiary" size="sm" accessibilityLabel={`Remove the ${label.toLowerCase()}`} onPress={remove} /> : null}
            </View>
          );
        }
        return (
          <View key={st.key} style={{ gap: SPACING.sm }}>
            {i > 0 ? <RowDivider /> : null}
            <Field label={singlePlace ? `${label} name` : label} hint="Needed. What people know it by, e.g. the car park or venue." error={errorAt(`stop:${i}`)}>
              <TextField
                value={st.name}
                onChangeText={(name) => {
                  setStop(i, { name });
                  clearAt(`stop:${i}`);
                }}
                onFocus={() => setActiveStop(i)}
                placeholder={geocoderAvailable ? 'Naming it from the map…' : `Name this ${MEET_POINT.one}`}
                accessibilityLabel={`${label} name`}
              />
            </Field>
            {!singlePlace ? (
              <View style={{ flexDirection: 'row', gap: SPACING.sm, alignItems: 'center' }}>
                <Button label="Move" tier="tertiary" size="sm" accessibilityLabel={`Move the ${label.toLowerCase()} on the map`} onPress={() => openPicker(i)} />
                {removable ? <Button label="Remove" tier="tertiary" size="sm" accessibilityLabel={`Remove the ${label.toLowerCase()}`} onPress={remove} /> : null}
              </View>
            ) : null}
            {zone ? <ZoneNotice zone={zone} subject={st.name || label} compact /> : null}
          </View>
        );
      })}
      {!singlePlace ? (
        <Button
          label={type === 'cruise' ? 'Add a regroup point' : `Add another ${MEET_POINT.one}`}
          icon="plus"
          tier="tertiary"
          style={{ alignSelf: 'flex-start' }}
          onPress={() => {
            const insertAt = type === 'cruise' ? stops.length - 1 : stops.length;
            const next = [...stops];
            next.splice(insertAt, 0, { key: newId('s'), name: '' });
            setStops(next);
            setActiveStop(insertAt);
          }}
        />
      ) : null}
      {placed.length ? (
        <Field label="Area name" hint={isPublicType(type) ? 'Shown with the event.' : `Before the location shows, people see “Around ${shownArea}” and ${areaCircle(areaRadiusMiles)}.`}>
          <TextField value={areaName} onChangeText={setAreaName} placeholder={suggestedAreaName} maxLength={30} accessibilityLabel="Area name" />
        </Field>
      ) : null}
    </>
  );

  const whoStep = (
    <>
      <View style={{ gap: SPACING.sm }} accessibilityLiveRegion="polite">
        <DsText v="body">
          <DsText v="bodyStrong">Who can come: </DsText>
          {rows.come}
        </DsText>
        <DsText v="body">
          <DsText v="bodyStrong">Who we'll tell: </DsText>
          {rows.tell}
        </DsText>
        {remote && serverCount === 'offline' ? <DsText v="caption">Can't count while offline.</DsText> : null}
      </View>
      {leftOut && leftOutWhy ? <DsText v="secondary" tone="warning">{leftOutWhy}</DsText> : null}
      {limiting ? (
        <>
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
          <BrandPicker vehicles={vehicles} selected={filter.brands} onChange={(brands) => setFilter((f) => ({ ...f, brands }))} />
          <ChoiceGroup label="Within" options={RADIUS_CHOICES.map((r) => ({ key: String(r), label: `${r} mi` }))} value={String(filter.radiusMiles)} onChange={(k) => setFilter((f) => ({ ...f, radiusMiles: Number(k) }))} />
          <Button
            label="Open to everyone again"
            tier="tertiary"
            size="sm"
            style={{ alignSelf: 'flex-start' }}
            onPress={() => {
              setFilter((f) => ({ ...DEFAULT_FILTER, radiusMiles: f.radiusMiles }));
              setLimiting(false);
            }}
          />
        </>
      ) : (
        <Button label="Limit who can come" tier="tertiary" size="sm" style={{ alignSelf: 'flex-start' }} onPress={() => setLimiting(true)} />
      )}
      <RowDivider />
      {more ? (
        <Section title="More options">
          {!isPublicType(type) ? (
            <ChoiceGroup
              label="Location shows"
              options={REVEAL_CHOICES.map((m) => ({ key: String(m), label: m === 0 ? 'At the start' : `${leadText(m)} before` }))}
              value={String(reveal)}
              onChange={(k) => setReveal(Number(k))}
            />
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
          ) : null}
        </Section>
      ) : (
        <Button
          label="More options"
          tier="tertiary"
          size="sm"
          style={{ alignSelf: 'flex-start' }}
          accessibilityHint={isPublicType(type) ? 'Co-hosts' : `When the location shows (now ${leadText(reveal)} before) and co-hosts`}
          onPress={() => setMore(true)}
        />
      )}
    </>
  );

  const review = (
    <>
      <View>
        <ReviewRow label="What" value={`${EVENT_LABELS[type]} · ${title.trim() || 'No name yet'}`} onEdit={() => go(0)} />
        <RowDivider />
        <ReviewRow label="When" value={whenText} onEdit={() => go(0)} />
        <RowDivider />
        <ReviewRow
          label="Where"
          value={`${placed.length ? placed.map((p, i) => p.name || pointLabel(i, visibleStops.length)).join(' → ') : 'Nothing placed'} · shown as “Around ${shownArea}”`}
          onEdit={() => go(1)}
        />
        <RowDivider />
        <ReviewRow label="Who can come" value={rows.come} onEdit={() => go(2)} />
        <RowDivider />
        <ReviewRow label="Who we'll tell" value={rows.tell.charAt(0).toUpperCase() + rows.tell.slice(1)} onEdit={() => go(2)} />
        <RowDivider />
        <ReviewRow label="Location" value={revealText} onEdit={() => { setMore(true); go(2); }} />
        {coHosts.length || crewOwned ? (
          <>
            <RowDivider />
            <ReviewRow
              label="Hosts"
              value={crewOwned && myCrew ? `${myCrew.name} crew with ${['you', ...coHostNames].join(', ')}` : ['You', ...coHostNames].join(', ')}
              onEdit={() => { setMore(true); go(2); }}
            />
          </>
        ) : null}
      </View>
      {leftOut ? (
        <Callout tone="warning" title="Your own car or bike can't come" right={<Button tier="tertiary" size="sm" label="Change" onPress={() => go(2)} />}>
          {leftOutWhy ?? undefined}
        </Callout>
      ) : null}
      {placed.map((st, i) => {
        const zone = banZoneAt(st.at!, BAN_ZONES);
        return zone ? <ZoneNotice key={st.key} zone={zone} subject={st.name || pointLabel(i, visibleStops.length)} compact /> : null;
      })}
    </>
  );

  const body = [whatWhen, whereStep, whoStep, review][step];
  const banWords = check.injunction
    ? injunctionConfirmText(check.injunction.zone, verb)
    : check.pspos.length
      ? pspoConfirmText(check.pspos, verb)
      : '';

  return (
    <View style={{ flex: 1, backgroundColor: COLOR.surface.bg }}>
      <ScrollView
        ref={scroll as never}
        contentContainerStyle={PAGE_WITH_BAR}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        automaticallyAdjustKeyboardInsets
      >
        <StepHeading step={step + 1} of={STEPS.length} title={STEPS[step]} />
        <View style={{ gap: SPACING.lg }}>{body}</View>
      </ScrollView>
      {/* A field's error sits in that field's message slot. Only an error with no field (a clash
          with a meet you already host, a save that failed) shows here, above the ActionBar. */}
      {error?.at === 'form' ? (
        <View style={{ paddingHorizontal: SPACING.screen, paddingVertical: SPACING.sm, backgroundColor: COLOR.surface.bg, borderTopWidth: 1, borderTopColor: COLOR.surface.border }}>
          <ErrorState title={error.message} />
        </View>
      ) : null}
      <ActionBar
        primary={step === LAST ? { label: editing ? (submitLabel ?? 'Save changes') : postLabel, onPress: save, busy: saving, haptic: 'success' } : { label: 'Next', onPress: nextStep }}
      />

      <MapPicker
        visible={picking !== null}
        mode="point"
        title={picking !== null ? `Place the ${pointLabel(picking, visibleStops.length).toLowerCase()}` : ''}
        hint="Move the map to put the crosshair on it."
        confirmLabel={picking !== null ? `${visibleStops[picking]?.at ? 'Move' : 'Set'} ${pointLabel(picking, visibleStops.length).toLowerCase()} here` : ''}
        start={(picking !== null && (visibleStops[picking]?.at ?? [...visibleStops.slice(0, picking)].reverse().find((x) => x.at)?.at)) || placed[0]?.at || meUser.home}
        span={0.08}
        initial={picking !== null && visibleStops[picking]?.at ? [visibleStops[picking].at!] : []}
        showKinds={['venue', 'track', 'photo']}
        snap
        zones
        extraPins={pointPins(picking)}
        extraPaths={routePaths}
        colour={typeColour}
        onDone={([spot]) => {
          if (picking !== null && spot) placeStop(picking, spot.at, spot.name);
          setPicking(null);
        }}
        onCancel={() => setPicking(null)}
      />

      <ConfirmSheet
        visible={leaveAction !== null}
        title={editing ? 'Discard your changes?' : 'Discard this meet?'}
        message={editing ? `Your changes to ${initial?.title ?? 'this event'} aren't saved yet.` : `${title.trim() || 'Your meet'} isn't posted yet.`}
        verb="Discard"
        cancelLabel="Keep editing"
        onConfirm={discard}
        onCancel={() => setLeaveAction(null)}
      />

      {/* The meet-ban warning (owner decision 9.3): warn, never block, with Change location as the main button. */}
      <ConfirmSheet
        visible={askBan}
        title={check.injunction ? 'Court injunction' : 'Meet ban'}
        message={banWords}
        verb={verb}
        confirmLabel={`${verb} anyway`}
        cancelLabel="Change location"
        safeFirst
        busy={saving}
        onConfirm={publish}
        onCancel={() => {
          setAskBan(false);
          go(1);
        }}
        onDismiss={() => setAskBan(false)}
      >
        <DsText v="caption">Nightshift only warns: you're responsible for where you send people.</DsText>
      </ConfirmSheet>
    </View>
  );
}

/** One wording for the area on Where and Check: its size across, as people see it on the map. */
function areaCircle(radiusMiles: number): string {
  return `a circle about ${radiusMiles * 2} mi across`;
}

/** Label above the value, with Edit (REVIEW-7 inconsistency 13). */
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
