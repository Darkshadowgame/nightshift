import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { TrophiesSection, VoteSheet, voteCategories } from '../../components/AwardsSection';
import { bhpLine, BringSheet, shortBuildName } from '../../components/BringPicker';
import { isStaffNow, openModerate, openReport } from '../../components/Community';
import { CheckInCelebration, MediaFrame, NotFoundState, TextField } from '../../components/Detail';
import {
  ActionBar,
  Button,
  ConfirmSheet,
  displayHandle,
  DsText,
  EmptyState,
  ErrorState,
  GoingStrip,
  Hero,
  ListRow,
  LocationLine,
  PAGE_WITH_BAR,
  Press,
  RowDivider,
  screenHeader,
  Section,
  Sheet,
  SheetOption,
  useToast,
  type ActionBarButton,
} from '../../components/ds';
import type { MapPath, MapPin } from '../../components/mapTypes';
import { UnlockReveal } from '../../components/motion';
import { useNavLaunch } from '../../components/NavLaunch';
import { NightMap } from '../../components/NightMap';
import { PhotoCredit } from '../../components/PhotoCredit';
import { useShareLink } from '../../components/ShareLink';
import { usePhotoFlow } from '../../components/PhotoFlow';
import { eventPhotoRef, statusTag } from '../../components/TonightCards';
import { appNow } from '../../lib/appClock';
import { areaRadius } from '../../lib/area';
import { categoryInfo, votingCloses, type AwardCategory } from '../../lib/awards';
import { broughtBuild, canGoWith, checkInBuild, chosenBuild, defaultBuild, fitsInvite, ownBuilds } from '../../lib/bringing';
import { useNow } from '../../lib/clock';
import { useCommunity, useCommunityQuery } from '../../lib/communityStore';
import { eventPrimary, goingMix, statusLine } from '../../lib/eventAction';
import { canChangePlan, canCheckIn, canEditEvent, canSeeStop, endTime, EVENT_LABELS, isHost, moveOnAudience, phaseOf, revealTime } from '../../lib/events';
import { myEventStatus, newlyUnlocked, roleOf } from '../../lib/eventView';
import { formatTime, goingSummary, plural } from '../../lib/format';
import { aroundArea, GOING, MEET_POINT } from '../../lib/glossary';
import { describeFilter } from '../../lib/invites';
import { preciseFix } from '../../lib/location';
import { planForEvent } from '../../lib/navPlan';
import { askPermission, notificationsSupported } from '../../lib/notify';
import { lastPage, PAGE as LIST_PAGE } from '../../lib/paging';
import { milesBetween } from '../../lib/geo';
import { photoSource } from '../../lib/photoSource';
import { REP } from '../../lib/rep';
import { eventSharePayload } from '../../lib/share';
import { useStore } from '../../lib/store';
import type { Build, LatLng } from '../../lib/types';
import { clock, endedLabel, timeRange } from '../../lib/when';
import { COLOR, EVENT_COLOURS, RADII, SPACING } from '../../theme';

/** Demo meets whose results preview has played (Review 12, L4): it stays on the page this session. */
const previewed = new Set<string>();

/** The event map's height, and the room the ActionBar takes at the bottom (for scrolling the map into view). */
const MAP_H = 180;
const BAR_ROOM = 140;

/** Where an error shows: under the control that caused it. */
type ErrorAt = 'checkin' | 'going' | 'moveon' | 'menu' | 'answer' | 'chat' | 'cancel' | 'photo';

/**
 * An event (Redesign 2, 3.5, template T3). One fixed order in every state:
 * Hero → status line (the one countdown) → who's going → map → photos → vote → chat → hosting →
 * about → ActionBar (the one primary). Everything else is in ··· (Can't make it, Open in another
 * app, Report; hosts: Edit, Change the plan, Plan changes, Cancel).
 */
export default function EventScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const store = useStore();
  const { events, me, crews, users, builds, chat, settings, votes } = store;
  const now = useNow();
  const toast = useToast();
  const community = useCommunity();
  const e = events.find((x) => x.id === id);
  const [message, setMessage] = useState('');
  const [error, setErrorState] = useState<{ at: ErrorAt; text: string } | null>(null);
  const setError = (at: ErrorAt, text: string | null) => setErrorState(text ? { at, text } : null);
  const errorAt = (at: ErrorAt) => (error?.at === at ? error.text : null);
  const [busy, setBusy] = useState(false);
  const [justCheckedIn, setJustCheckedIn] = useState(false);
  const [reminded, setReminded] = useState(false);
  const [unlock, setUnlock] = useState<string | null>(null);
  const [menu, setMenu] = useState(false);
  const [changesOpen, setChangesOpen] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  /** The trophy the vote sheet is open on (null: closed). */
  const [voteCat, setVoteCat] = useState<AwardCategory | null>(null);
  const sharer = useShareLink();
  const [chatOpen, setChatOpen] = useState(false);
  /** The "What are you bringing?" sheet: before I'm going, to change it, or at check-in. */
  const [bring, setBring] = useState<null | 'go' | 'change' | 'checkin'>(null);
  /** At check-in: the build they turned up in, if it isn't the one they said. */
  const [checkInPick, setCheckInPick] = useState<string | undefined>();
  const scroll = useRef<{ scrollTo: (o: { y: number; animated?: boolean }) => void } | null>(null);
  const photosAt = useRef(0);
  const mapAt = useRef(0);
  const viewH = useRef(0);
  /** The going toast waits for the location-shows moment to finish, so it never covers it (L4). */
  const pendingToast = useRef<Parameters<typeof toast>[0] | null>(null);
  const unlocking = useRef(false);
  const trophiesAt = useRef(0);
  const [preview, setPreview] = useState(() => !!id && previewed.has(id));

  // "Location shown": the first time this person can see a meet point, play the reveal once.
  const fresh = e ? newlyUnlocked(e, me, crews, now, store.unlockSeen[e.id] ?? []) : [];
  const freshKey = fresh.join(',');
  const { markUnlockSeen } = store;
  useEffect(() => {
    if (!e || fresh.length === 0) return;
    const names = fresh.map((sid) => e.stops.find((x) => x.id === sid)?.name ?? '');
    setUnlock(e.type === 'cruise' && fresh.length > 1 ? 'The route' : names[names.length - 1]);
    unlocking.current = true;
    markUnlockSeen(e.id, fresh);
    // Bring the map into view for the moment (it sits under the hero on a meet with a photo).
    if (mapAt.current > 0) {
      const room = Math.max(SPACING.screen, (viewH.current - MAP_H - BAR_ROOM) / 2);
      setTimeout(() => scroll.current?.scrollTo({ y: Math.max(0, mapAt.current - room), animated: true }), 50);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [freshKey, e?.id]);

  const { blocked } = community;
  const messages = useMemo(() => chat.filter((m) => m.eventId === id && !blocked.has(m.userId)), [chat, id, blocked]);
  const [chatShown, setChatShown] = useState(LIST_PAGE * 2);
  const chatPage = lastPage(messages, chatOpen ? chatShown : 2);

  // Signed in: live chat, who's going, check-ins and the meet moving on, while this screen is open.
  const remote = store.remote;
  useEffect(() => {
    if (!remote || !id) return;
    return remote.watchEvent(id);
  }, [remote, id]);

  // Photos from the meet: posts placed at the meet point while it was on (and the day after).
  const meetPoint = e ? (e.stops[e.type === 'rolling' ? e.currentStop : 0]?.at ?? null) : null;
  const posts = useCommunityQuery(
    (s) => (meetPoint ? s.postsInBox({ south: meetPoint.lat - 0.004, north: meetPoint.lat + 0.004, west: meetPoint.lng - 0.006, east: meetPoint.lng + 0.006 }) : Promise.resolve([])),
    [meetPoint?.lat, meetPoint?.lng],
  );

  const flow = usePhotoFlow({
    onPhoto: (ref) => postPhoto(ref),
    onError: (m) => setError('photo', m),
    plates: 'ifFound',
  });

  // Navigate: through the meet points you can see (a rolling meet: only the one it's at now).
  const navPlan = e && phaseOf(e, now) !== 'over' && phaseOf(e, now) !== 'cancelled' ? planForEvent(e, me, crews, now) : null;
  const navTo = navPlan ? (navPlan.stops.find((s) => s.checkIn) ?? navPlan.stops[0]) : null;
  const nav = useNavLaunch({
    target: { kind: 'event', id: e?.id ?? '' },
    to: navTo?.at ?? e?.area ?? { lat: 0, lng: 0 },
    toName: navTo?.name,
    otherAppsNote: e?.type === 'rolling' && navTo ? `Other apps go to ${navTo.name}, the ${MEET_POINT.one} it's at now.` : undefined,
  });

  async function attempt(at: ErrorAt, run: () => Promise<unknown>, fallback: string): Promise<boolean> {
    setErrorState(null);
    try {
      await run();
      return true;
    } catch (err) {
      setError(at, err instanceof Error ? err.message : fallback);
      return false;
    }
  }

  if (!e) return <NotFoundState what="Event" message="It may have been cancelled and removed, or the link is old." />;

  const ev = e;
  const colour = EVENT_COLOURS[ev.type];
  const host = isHost(ev, me, crews);
  const role = roleOf(ev, me, crews, users, builds);
  const going = ev.going.includes(me);
  const phase = phaseOf(ev, now);
  const closed = phase === 'over' || phase === 'cancelled';
  const crew = ev.crewId ? crews.find((c) => c.id === ev.crewId) : undefined;
  const myCheckIns = ev.checkIns[me] ?? [];
  const current = ev.type === 'rolling' ? ev.currentStop : 0;
  const currentStop = ev.stops[current];
  const nextStop = ev.stops[ev.currentStop + 1];
  const audience = moveOnAudience(ev, ev.currentStop).length;
  const handleOf = (uid: string) => users.find((u) => u.id === uid)?.handle ?? uid;
  const userLabel = (uid: string) => (uid === me ? 'You' : displayHandle(handleOf(uid)));
  const openUser = (uid: string) => router.push({ pathname: '/user/[id]', params: { id: uid } });
  const skipGps = store.backend === 'local';

  // The vehicle you're bringing (bringing.ts).
  const mine = ownBuilds(me, builds);
  const chosen = chosenBuild(ev, me, builds);
  const bringing = broughtBuild(ev, me, builds);
  const atCheckIn = checkInBuild(ev, me, builds, checkInPick);
  const defaultPick = defaultBuild(ev, me, builds, events) ?? mine[0];
  const goesWith = (b?: Build) => canGoWith(ev, me, crews, users, builds, b);

  const state = eventPrimary(ev, me, role, crews, builds, now, votes);
  const status = statusLine(ev, state, { me, crews, builds, users, votes, now });

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------
  async function commitGoing(buildId?: string, passenger = false) {
    setErrorState(null);
    const wasGoing = going;
    setBring(null);
    setBusy(true);
    try {
      const result = await store.setGoing(ev.id, true, buildId);
      if (result === 'going' && !wasGoing && settings.reminders) askPermission().then((ok) => ok && store.refreshReminders()).catch(() => {});
      const b = mine.find((x) => x.id === buildId);
      if (result === 'requested') toast({ message: 'Asked the host. You’ll hear when they say yes.' });
      else if (!wasGoing) {
        const going = {
          message: b ? `You're going with your ${shortBuildName(b)}` : passenger ? "You're going as a passenger" : "You're going",
          action: mine.length > 0 ? { label: 'Change', onPress: () => setBring('change') } : undefined,
        };
        // Saying you're going shows the meet point: the location moment plays first, then this toast.
        const reveals = result === 'going' && newlyUnlocked({ ...ev, going: [...ev.going, me] }, me, crews, appNow(), store.unlockSeen[ev.id] ?? []).length > 0;
        if (reveals) {
          pendingToast.current = going;
          // If the moment doesn't start after all, the toast still shows.
          setTimeout(() => !unlocking.current && flushToast(), 800);
        } else toast(going);
      } else if (b) toast({ message: `Bringing your ${shortBuildName(b)}` });
    } catch (err) {
      setError('going', err instanceof Error ? err.message : "Couldn't change that.");
    } finally {
      setBusy(false);
    }
  }

  function flushToast() {
    const t = pendingToast.current;
    pendingToast.current = null;
    if (t) toast(t);
  }

  /** I'm going: one build goes straight in; two or more ask which; none offers Add your car or a passenger seat. */
  function imGoing() {
    if (mine.length === 1) return commitGoing(mine[0].id);
    setBring('go');
  }

  async function doCheckIn() {
    setErrorState(null);
    setBusy(true);
    try {
      let pos: LatLng | null = null;
      if (!skipGps) {
        const fix = await preciseFix();
        if (!fix.ok) {
          setError('checkin', fix.reason === 'denied' ? 'Check-in needs your location. Allow it for Nightshift in Settings.' : "Couldn't read your location. Try again outside.");
          return;
        }
        pos = fix.at;
      }
      const result = canCheckIn(ev, current, me, crews, appNow(), pos, skipGps);
      if (!result.ok) return setError('checkin', result.reason);
      const news = !!atCheckIn && (chosen ? atCheckIn.id !== chosen.id : myCheckIns.length === 0);
      await store.checkIn(ev.id, current, news ? atCheckIn!.id : undefined, pos);
      setCheckInPick(undefined);
      setJustCheckedIn(true);
      toast({ message: 'Checked in' });
    } catch (err) {
      setError('checkin', err instanceof Error ? err.message : "Couldn't check in.");
    } finally {
      setBusy(false);
    }
  }

  async function remindMe(at: string) {
    const time = formatTime(at);
    if (!settings.reminders) store.setSettings({ reminders: true });
    const allowed = notificationsSupported ? await askPermission().catch(() => false) : false;
    store.refreshReminders();
    setReminded(true);
    toast({ message: allowed || !notificationsSupported ? `We'll remind you at ${time}` : `Allow notifications in Settings to get it at ${time}` });
  }

  /** Share: the share sheet, else "Link copied", else the link to copy (src/lib/share.ts). Never a dead end. */
  function doShare() {
    setMenu(false);
    return sharer.share(eventSharePayload(ev, timeRange(ev.startsAt, ev.endsAt, now)));
  }

  async function postPhoto(ref: string) {
    if (!currentStop?.at) return;
    setErrorState(null);
    try {
      await community.run((s) =>
        s.createPost({ body: `At ${ev.title}`, photos: [ref], at: currentStop.at, placeName: currentStop.name, visibility: 'public', buildId: bringing?.id }),
      );
      posts.reload();
      toast({ message: 'Photo posted here and in Community' });
      setTimeout(() => scroll.current?.scrollTo({ y: Math.max(0, photosAt.current - SPACING.lg), animated: true }), 100);
    } catch (err) {
      setError('photo', err instanceof Error ? err.message : "Couldn't post that photo.");
    }
  }

  function leave() {
    setConfirmLeave(false);
    setErrorState(null);
    const was = chosen?.id;
    attempt('menu', () => store.setGoing(ev.id, false), "Couldn't change that.").then((ok) => {
      if (ok) toast({ message: `You're not going to ${ev.title}`, action: { label: 'Undo', onPress: () => store.setGoing(ev.id, true, was).catch(() => {}) } });
    });
  }

  // Photos: posts at the meet point during the meet, then the builds that checked in.
  const from = new Date(ev.startsAt).getTime() - 30 * 60_000;
  const to = endTime(ev).getTime() + 24 * 3_600_000;
  // Your own photos at the meet point always show (posts may be stamped on the real clock in the demo).
  const postPhotos = (posts.data ?? []).filter((p) => p.photo && (p.authorId === me || (new Date(p.createdAt).getTime() >= from && new Date(p.createdAt).getTime() <= to)));
  const buildPhotos = Object.entries(ev.checkIns)
    .filter(([, s]) => s.length > 0)
    .map(([uid]) => broughtBuild(ev, uid, builds))
    .filter((b): b is Build => !!b && b.photos.length > 0);
  function shownPhotosCount() {
    return postPhotos.length + buildPhotos.length;
  }
  const showPhotos = phase === 'live' || phase === 'over';
  const canAddPhoto = myCheckIns.length > 0 && !closed;
  const tiles = [
    ...postPhotos.map((p) => ({ key: `p:${p.id}`, ref: p.photo!, open: () => router.push({ pathname: '/post/[id]', params: { id: p.id } }), label: `Photo by ${userLabel(p.authorId)}`, kind: 'car' as const })),
    ...buildPhotos.map((b) => ({ key: `b:${b.id}`, ref: b.photos[0], open: () => router.push({ pathname: '/build/[id]', params: { id: b.id } }), label: `${b.make} ${b.model}`, kind: b.kind })),
  ].slice(0, 9);

  // ---------------------------------------------------------------------------
  // The ActionBar, by state (3.5 table).
  // ---------------------------------------------------------------------------
  const cats = voteCategories(ev, builds, me, now);
  const voted = (cat: string) => votes.find((v) => v.eventId === ev.id && v.voterId === me && v.category === cat)?.buildId;
  const votedCats = cats.filter((c) => !!voted(c));
  const toVote = cats.filter((c) => !voted(c));
  const firstUnvoted = cats.find((c) => !votes.some((v) => v.eventId === ev.id && v.voterId === me && v.category === c)) ?? cats[0];
  const addPhoto: ActionBarButton = { label: 'Add a photo', onPress: () => flow.pick(), busy: flow.busy };
  let primary: ActionBarButton | null = null;
  let secondary: ActionBarButton | null = null;
  // No status pill that repeats the status line (C5, Review 12): the line says when the location
  // shows; the ActionBar only adds what's new (the reminder you set).
  let pill: string | null = null;
  /** Going (not hosting) and nothing to do yet: "Can't make it" is the bar's secondary (Review 11). */
  const leaveInBar = going && !host && (state.kind === 'waiting' || state.kind === 'navigate');
  const leaveButton: ActionBarButton = { label: GOING.leave, onPress: () => setConfirmLeave(true) };
  const canRemind = state.kind === 'waiting' && !state.placing && new Date(state.at) > now && !reminded;
  switch (state.kind) {
    case 'join':
      primary = { label: state.request ? 'Ask to go' : "I'm going", onPress: state.request ? () => (mine.length > 1 ? setBring('go') : commitGoing(defaultPick?.id)) : imGoing, busy, haptic: 'success' };
      break;
    case 'waiting':
      if (leaveInBar) secondary = leaveButton;
      else if (canRemind) secondary = { label: 'Remind me', onPress: () => remindMe(state.at) };
      if (reminded) pill = `Reminder at ${formatTime(state.at)}`;
      break;
    case 'navigate':
      if (navTo) primary = { label: nav.label, onPress: nav.open };
      if (leaveInBar) secondary = leaveButton;
      break;
    case 'checkin':
      primary = { label: 'Check in', onPress: doCheckIn, busy, haptic: 'success' };
      if (navTo) secondary = { label: nav.label, onPress: nav.open };
      break;
    case 'checkedIn':
      if (navTo && phase !== 'live') secondary = { label: nav.label, onPress: nav.open };
      else if (phase === 'live') secondary = addPhoto;
      break;
    case 'vote':
      primary = { label: 'Vote', onPress: () => setVoteCat(firstUnvoted ?? null) };
      secondary = addPhoto;
      break;
    case 'voted':
      primary = addPhoto;
      break;
    case 'ended':
      secondary = shownPhotosCount() > 0 ? { label: 'See photos', onPress: () => scroll.current?.scrollTo({ y: Math.max(0, photosAt.current - SPACING.lg), animated: true }) } : null;
      break;
    default:
      break;
  }

  const barHasPhoto = primary === addPhoto || secondary === addPhoto;

  // ---------------------------------------------------------------------------
  // Pieces
  // ---------------------------------------------------------------------------
  const photoRef = eventPhotoRef(ev, builds);
  const placeShown = currentStop?.at && canSeeStop(ev, current, me, crews, now);
  // The area is said once (C5): in the meta line, as "Around Tamworth" (the one form), unless the
  // status line already names the town with the meet point.
  const where = placeShown && ev.areaName && status.text.includes(ev.areaName) ? null : aroundArea(ev.areaName);
  const time =
    phase === 'cancelled'
      ? `Cancelled · ${timeRange(ev.startsAt, ev.endsAt, now)}`
      : phase === 'over'
        ? endedLabel(endTime(ev), now)
        : phase === 'live'
          ? `Until ${clock(endTime(ev))}`
          : timeRange(ev.startsAt, ev.endsAt, now);
  const meta = [time, where, ev.routeMiles ? `${ev.routeMiles} mi route` : null].filter(Boolean).join(' · ');
  // Your status, once (K3, C5): the same tag as Tonight's card and Me (myEventStatus).
  const heroTag = statusTag(myEventStatus(ev, me, crews, now)) ?? null;

  const goingPeople = [...ev.going].sort((a, b) => (a === me ? -1 : b === me ? 1 : 0)).map((uid) => {
    const u = users.find((x) => x.id === uid);
    return { id: uid, name: u?.name, handle: u?.handle };
  });
  const mix = goingMix(ev, builds);

  // Map: the area circle until the meet point shows, then the pin(s).
  const visibleStops = ev.stops.map((st, i) => ({ st, i, visible: canSeeStop(ev, i, me, crews, now) }));
  const mapPins: MapPin[] = visibleStops
    .filter((x) => x.visible && x.st.at)
    .map((x) => ({ id: x.st.id, at: x.st.at!, glyph: ev.type, colour: x.i === current ? colour : COLOR.text.secondary, title: x.st.name, size: x.i === current ? 40 : 30, live: x.i === current && phase === 'live' }));
  const mapPaths: MapPath[] = ev.type === 'cruise' && mapPins.length > 1 ? [{ id: 'route', coords: mapPins.map((p) => p.at), colour, dashed: true }] : [];
  const anyVisible = mapPins.length > 0;
  const mapCentre = anyVisible ? (mapPins.find((p) => p.id === currentStop?.id)?.at ?? mapPins[0].at) : ev.area;
  const areaMiles = areaRadius(ev);

  const hostIds = ev.hostIds;
  const hostLine = [crew ? `${crew.name} crew` : null, hostIds.map((h) => (h === me ? 'you' : userLabel(h))).join(', ')].filter(Boolean).join(' with ');
  const canEdit = host && canEditEvent(ev, now).ok;
  const canPlan = host && canChangePlan(ev, now).ok && phase !== 'upcoming';
  const requests = ev.requests ?? [];

  type MenuOption = { label: string; detail?: string; destructive?: boolean; onPress: () => void };
  const menuOptions: MenuOption[] = ([
    going && !host && !closed && !leaveInBar ? { label: GOING.leave, destructive: true, onPress: () => (setMenu(false), setConfirmLeave(true)) } : null,
    leaveInBar && canRemind && state.kind === 'waiting' ? { label: `Remind me at ${formatTime(state.at)}`, onPress: () => (setMenu(false), remindMe(state.at)) } : null,
    (going || host) && !closed && mine.length > 0 ? { label: 'Change what you’re bringing', onPress: () => (setMenu(false), setBring('change')) } : null,
    ev.requests?.includes(me) ? { label: GOING.cancelRequest, onPress: () => (setMenu(false), attempt('menu', () => store.setGoing(ev.id, false), "Couldn't change that.")) } : null,
    navTo ? { label: 'Open in another app', onPress: () => (setMenu(false), nav.openOther()) } : null,
    canEdit ? { label: 'Edit', onPress: () => (setMenu(false), router.push({ pathname: '/event/edit', params: { id: ev.id } })) } : null,
    canPlan ? { label: 'Change the plan', onPress: () => (setMenu(false), router.push({ pathname: '/event/plan', params: { id: ev.id } })) } : null,
    host && (ev.changes?.length ?? 0) > 0 ? { label: 'Plan changes', onPress: () => (setMenu(false), setChangesOpen(true)) } : null,
    host && !closed ? { label: 'Cancel', destructive: true, onPress: () => (setMenu(false), setConfirmCancel(true)) } : null,
    !host ? { label: 'Report', onPress: () => (setMenu(false), openReport('event', ev.id, undefined, 'event')) } : null,
  ] as (MenuOption | null)[]).filter((x): x is MenuOption => !!x);

  // Earlier meets at the same meet point with their trophies out (Last week's meet): one row in About.
  const earlier = currentStop?.at
    ? events.filter((x) => x.id !== ev.id && phaseOf(x, now) === 'over' && !x.cancelled && now >= votingCloses(x) && x.stops.some((st) => st.at && milesBetween(st.at, currentStop.at!) < 0.2))
    : [];
  // A meet with no photo shows the real map at the top, not a drawing (L1): then it isn't repeated below.
  const mapOnTop = !photoRef;
  const map = (
    <>
      <NightMap
        pins={anyVisible ? mapPins : []}
        paths={mapPaths}
        // The area in a quiet grey: colour is for the pin (accent rule, Review 13).
        circles={anyVisible ? [] : [{ id: 'area', centre: ev.area, radiusMiles: areaMiles, colour: COLOR.text.secondary }]}
        centre={mapCentre}
        span={anyVisible ? (ev.type === 'cruise' ? 0.25 : 0.06) : Math.max(0.12, (areaMiles * 2.6) / 69)}
        follow
      />
      {unlock ? (
        <UnlockReveal
          glyph={ev.type}
          colour={colour}
          title={unlock}
          onDone={() => {
            setUnlock(null);
            unlocking.current = false;
            flushToast();
          }}
        />
      ) : null}
    </>
  );


  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: COLOR.surface.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <Stack.Screen options={screenHeader({ action: { label: 'Share', accessibilityLabel: 'Share this event', onPress: doShare }, onMenu: () => setMenu(true) })} />
      <ScrollView ref={scroll as never} contentContainerStyle={PAGE_WITH_BAR} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} onLayout={(l) => (viewH.current = l.nativeEvent.layout.height)}>
        <Hero
          bleed
          photo={photoRef ? photoSource(photoRef) : null}
          media={mapOnTop ? <View style={{ aspectRatio: 16 / 9, overflow: 'hidden' }}>{map}</View> : undefined}
          overlay={photoRef ? <PhotoCredit photoRef={photoRef} overlay corner="topRight" /> : undefined}
          eyebrow={EVENT_LABELS[ev.type]}
          live={phase === 'live'}
          title={ev.title}
          meta={meta}
          tag={heroTag}
        />

        <View style={{ gap: SPACING.md }}>
          <LocationLine text={status.text} done={status.done} />
          {justCheckedIn ? (
            <CheckInCelebration play title={`+${REP.attended} rep`} body="For turning up." />
          ) : null}
          {errorAt('checkin') ? <ErrorState title={errorAt('checkin')!} /> : null}
          {errorAt('going') ? <ErrorState title={errorAt('going')!} /> : null}
          {errorAt('menu') ? <ErrorState title={errorAt('menu')!} /> : null}
          <GoingStrip
            people={goingPeople}
            summary={goingSummary(ev.going.length, mix.cars, mix.bikes)}
            onPress={ev.going.length ? () => router.push({ pathname: '/event/going', params: { id: ev.id } }) : undefined}
          />
        </View>

        {!ev.cancelled && (preview || now >= votingCloses(ev)) ? (
          <View onLayout={(l) => (trophiesAt.current = l.nativeEvent.layout.y)}>
            <TrophiesSection event={ev} preview={preview && now < votingCloses(ev)} />
          </View>
        ) : null}

        {mapOnTop ? null : (
          <View onLayout={(l) => (mapAt.current = l.nativeEvent.layout.y)}>
            <MediaFrame height={MAP_H}>{map}</MediaFrame>
          </View>
        )}

        {showPhotos && (tiles.length > 0 || canAddPhoto) ? (
          <View onLayout={(l) => (photosAt.current = l.nativeEvent.layout.y)}>
            {/* Add a photo is said once (C5): in the ActionBar when it's there, else here. */}
            <Section title="Photos" right={canAddPhoto && !barHasPhoto ? <Button tier="tertiary" size="sm" label="+ Add a photo" onPress={() => flow.pick()} /> : undefined}>
              {tiles.length === 0 ? (
                <EmptyState variant="inline" title="No photos yet. Add the first one." />
              ) : (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs }}>
                  {tiles.map((t) => (
                    <Press key={t.key} onPress={t.open} label={t.label} feedback="card" style={{ width: '32%', flexGrow: 1, maxWidth: '33%', aspectRatio: 1, borderRadius: RADII.control, overflow: 'hidden', backgroundColor: COLOR.surface.media }}>
                      <PhotoTile photoRef={t.ref} />
                      <PhotoCredit photoRef={t.ref} kind={t.kind} overlay />
                    </Press>
                  ))}
                </View>
              )}
              {errorAt('photo') ? <ErrorState title={errorAt('photo')!} /> : null}
            </Section>
          </View>
        ) : null}

        {votedCats.length > 0 && (state.kind === 'vote' || state.kind === 'voted') ? (
          // Only the trophies you voted in, then one line for the rest (Review 13).
          <Section title="You voted">
            <View>
              {votedCats.map((c, i) => {
                const b = builds.find((x) => x.id === voted(c));
                const owner = b ? users.find((u) => u.id === b.ownerId) : undefined;
                return (
                  <View key={c}>
                    {i > 0 ? <RowDivider inset /> : null}
                    <ListRow
                      leading={{ icon: 'success', colour: COLOR.state.success }}
                      title={categoryInfo(c).label}
                      subtitle={b ? `${b.make} ${b.model}${owner ? ` · ${displayHandle(owner.handle)}` : ''}` : undefined}
                      onPress={() => setVoteCat(c)}
                      accessibilityHint="Change your vote"
                    />
                  </View>
                );
              })}
              {toVote.length > 0 ? (
                <View>
                  <RowDivider inset />
                  <ListRow
                    leading={{ icon: 'plus', colour: COLOR.text.secondary }}
                    title={`${toVote.length} more to vote`}
                    subtitle={toVote.map((c) => categoryInfo(c).label).join(', ')}
                    onPress={() => setVoteCat(toVote[0])}
                  />
                </View>
              ) : null}
            </View>
          </Section>
        ) : null}

        {going || host ? (
          <Section title="Chat">
            <ChatLines lines={chatPage.items} earlier={chatOpen ? chatPage.earlier : 0} onEarlier={() => setChatShown((n) => n + LIST_PAGE)} me={me} label={userLabel} />
            {!chatOpen && messages.length > 2 ? <Button tier="tertiary" size="sm" label={`See all ${messages.length} messages`} onPress={() => setChatOpen(true)} style={{ alignSelf: 'flex-start' }} /> : null}
            {!closed ? (
              <View style={{ flexDirection: 'row', gap: SPACING.sm, alignItems: 'flex-start' }}>
                <TextField
                  value={message}
                  onChangeText={setMessage}
                  placeholder="Message everyone going"
                  accessibilityLabel="Message everyone going"
                  style={{ flex: 1 }}
                  returnKeyType="send"
                  onSubmitEditing={() => {
                    const text = message.trim();
                    if (text) attempt('chat', () => store.sendChat(ev.id, text), "Couldn't send that.").then((ok) => ok && toast({ message: 'Sent' }));
                    setMessage('');
                  }}
                />
                {message.trim() ? (
                  <Button
                    label="Send"
                    tier="secondary"
                    size="md"
                    haptic="success"
                    onPress={() => {
                      const text = message.trim();
                      if (text) attempt('chat', () => store.sendChat(ev.id, text), "Couldn't send that.").then((ok) => ok && toast({ message: 'Sent' }));
                      setMessage('');
                    }}
                  />
                ) : null}
              </View>
            ) : null}
            {errorAt('chat') ? <ErrorState title={errorAt('chat')!} /> : null}
          </Section>
        ) : null}

        {host && !closed ? (
          <Section title="Hosting">
            {requests.map((uid, i) => {
              const b = broughtBuild(ev, uid, builds);
              const u = users.find((x) => x.id === uid);
              return (
                <View key={uid} style={{ gap: SPACING.xs }}>
                  {i > 0 ? <RowDivider /> : null}
                  <ListRow leading={{ avatar: { name: u?.name, handle: u?.handle } }} title={userLabel(uid)} subtitle={b ? `${b.make} ${b.model} · ${bhpLine(b)}` : 'No car or bike'} meta="Asked to go" onPress={() => openUser(uid)} />
                  <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
                    <Button label="Say yes" tier="secondary" size="sm" haptic="success" style={{ flex: 1 }} block accessibilityLabel={`Say yes to ${userLabel(uid)}`} onPress={() => attempt('answer', () => store.answerRequest(ev.id, uid, true), "Couldn't approve that.")} />
                    <Button label="Say no" tier="tertiary" size="sm" style={{ flex: 1 }} block accessibilityLabel={`Say no to ${userLabel(uid)}`} onPress={() => attempt('answer', () => store.answerRequest(ev.id, uid, false), "Couldn't decline that.")} />
                  </View>
                </View>
              );
            })}
            {errorAt('answer') ? <ErrorState title={errorAt('answer')!} /> : null}
            {ev.type === 'rolling' && phase === 'live' && nextStop?.at ? (
              <View style={{ gap: SPACING.xs }}>
                <Button label={`Move on to ${nextStop.name}`} tier="secondary" block haptic="warning" onPress={() => attempt('moveon', () => store.moveOn(ev.id), "Couldn't move on.")} />
                {errorAt('moveon') ? <ErrorState title={errorAt('moveon')!} /> : null}
                <DsText v="caption">{`Everyone going sees the next ${MEET_POINT.one}; ${plural(audience, 'person')} checked in here get a notice.`}</DsText>
              </View>
            ) : null}
            <DsText v="secondary">{`${plural(requests.length, 'request')} · ${describeFilter(ev.filter)}`}</DsText>
          </Section>
        ) : null}

        <Section title="About">
          {ev.description ? <DsText v="body">{ev.description}</DsText> : null}
          <ListRow
            leading={{ avatar: { name: users.find((u) => u.id === hostIds[0])?.name, handle: users.find((u) => u.id === hostIds[0])?.handle } }}
            title={`Hosted by ${hostLine}`}
            onPress={crew ? () => router.push({ pathname: '/crew/[id]', params: { id: crew.id } }) : hostIds[0] && hostIds[0] !== me ? () => openUser(hostIds[0]) : undefined}
          />
          <DsText v="secondary">{`Open to: ${describeFilter(ev.filter)}`}</DsText>
          {earlier.map((x) => (
            <ListRow
              key={x.id}
              leading={{ icon: 'success', colour: COLOR.state.success }}
              title={x.title}
              subtitle={`${endedLabel(endTime(x), now)} · Trophies`}
              onPress={() => router.push({ pathname: '/event/[id]', params: { id: x.id } })}
            />
          ))}
        </Section>
      </ScrollView>

      <ActionBar primary={primary} secondary={secondary} status={primary ? null : pill} />

      {nav.sheet}
      {flow.view}

      <BringSheet
        visible={bring !== null}
        title={bring === 'checkin' ? 'What did you turn up in?' : 'What are you bringing?'}
        builds={mine}
        picked={bring === 'checkin' ? atCheckIn?.id : bring === 'change' ? bringing?.id : undefined}
        fits={(b) => goesWith(b) && fitsInvite(ev, b)}
        lockUnfit={bring === 'checkin'}
        onPick={(bid) => {
          if (bring === 'checkin') {
            setCheckInPick(bid);
            setBring(null);
          } else commitGoing(bid);
        }}
        onAddCar={() => {
          setBring(null);
          router.push('/build/edit');
        }}
        onPassenger={() => commitGoing(undefined, true)}
        onClose={() => setBring(null)}
      />

      <VoteSheet
        event={ev}
        category={voteCat}
        onClose={(votedNow) => {
          setVoteCat(null);
          // The demo's trophy moment (L4): straight after you vote, the results flip in here.
          if (votedNow && store.backend === 'local' && !preview) {
            previewed.add(ev.id);
            setPreview(true);
            setTimeout(() => scroll.current?.scrollTo({ y: Math.max(0, trophiesAt.current - SPACING.lg), animated: true }), 350);
          }
        }}
      />
      {sharer.sheet}

      <Sheet visible={menu} title="Event options" onClose={() => setMenu(false)}>
        <View>
          {menuOptions.map((o) => (
            <SheetOption key={o.label} label={o.label} detail={o.detail} destructive={o.destructive} onPress={o.onPress} />
          ))}
        </View>
      </Sheet>

      <Sheet visible={changesOpen} title="Plan changes" onClose={() => setChangesOpen(false)}>
        <View style={{ gap: SPACING.md }}>
          {[...(ev.changes ?? [])].reverse().map((c) => (
            <View key={c.id} style={{ gap: SPACING.xxs }}>
              <DsText v="meta">{`${userLabel(c.by)} · ${formatTime(c.at)}`}</DsText>
              <DsText v="body">{c.text}</DsText>
            </View>
          ))}
        </View>
      </Sheet>

      <ConfirmSheet
        visible={confirmCancel}
        title="Cancel event"
        message={`Cancel ${ev.title}? Everyone going sees it as cancelled and gets no more reminders.${errorAt('cancel') ? `\n\n${errorAt('cancel')}` : ''}`}
        verb="Cancel"
        onCancel={() => setConfirmCancel(false)}
        onConfirm={() => {
          attempt('cancel', () => store.cancelEvent(ev.id), "Couldn't cancel it.").then((ok) => {
            if (!ok) return;
            setConfirmCancel(false);
            toast({ message: 'Cancelled' });
          });
        }}
      />
      {/* One confirm pattern (4.5): "Leave it" / "Keep it", no header Cancel. */}
      <ConfirmSheet
        visible={confirmLeave}
        title={GOING.leave}
        message={`Take yourself off ${ev.title}? You won't get its reminders. You can undo it straight after.`}
        verb="Leave"
        onCancel={() => setConfirmLeave(false)}
        onConfirm={leave}
      />
    </KeyboardAvoidingView>
  );
}

/** One square photo in the event's Photos grid. */
function PhotoTile({ photoRef }: { photoRef: string }) {
  return <Image source={photoSource(photoRef)} style={{ width: '100%', height: '100%' }} resizeMode="cover" accessibilityIgnoresInvertColors />;
}

type Line = { id: string; userId: string; text: string; at: string; system?: boolean };

/** Chat lines: a system line is a quiet caption; a person is their handle and the time, then the text. */
function ChatLines({ lines, earlier, onEarlier, me, label }: { lines: readonly Line[]; earlier: number; onEarlier: () => void; me: string; label: (uid: string) => string }) {
  if (lines.length === 0) return <EmptyState variant="inline" title="No messages yet. Say hello." />;
  return (
    <View style={{ gap: SPACING.md }}>
      {earlier > 0 ? <Button tier="tertiary" size="sm" label={`Show ${earlier} earlier`} onPress={onEarlier} /> : null}
      {lines.map((m) =>
        m.system ? (
          <DsText key={m.id} v="caption" style={{ textAlign: 'center' }}>
            {m.text} · {formatTime(m.at)}
          </DsText>
        ) : (
          <Press
            key={m.id}
            onLongPress={m.userId === me ? undefined : () => (isStaffNow() ? openModerate(m.userId) : openReport('chat', m.id, m.userId, 'chat message'))}
            role="text"
            hint={m.userId === me ? undefined : isStaffNow() ? 'Long press to moderate this person' : 'Long press to report this message'}
            feedback="none"
            style={{ gap: SPACING.xxs }}
          >
            <DsText v="meta">
              {label(m.userId)} · {formatTime(m.at)}
            </DsText>
            <DsText v="body">{m.text}</DsText>
          </Press>
        ),
      )}
    </View>
  );
}
