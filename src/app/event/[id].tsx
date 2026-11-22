import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, useWindowDimensions, View } from 'react-native';
import { TrophiesSection, VoteProgress, VoteSheet, voteCategories } from '../../components/AwardsSection';
import { bhpLine, BringSheet, shortBuildName } from '../../components/BringPicker';
import { isStaffNow, openModerate, openReport, personMark } from '../../components/Community';
import { CheckInCelebration, MediaFrame, NotFoundState, TextField } from '../../components/Detail';
import {
  ActionBar,
  Avatar,
  Button,
  ConfirmSheet,
  displayHandle,
  DsText,
  EmptyState,
  ErrorState,
  FitImage,
  GoingStrip,
  Gradient,
  Hero,
  Icon,
  ListRow,
  LocationLine,
  PAGE_WITH_BAR,
  Press,
  RowDivider,
  screenHeader,
  Section,
  Sheet,
  SheetOption,
  SwitchRow,
  useToast,
  type ActionBarButton,
} from '../../components/ds';
import { rgba } from '../../components/ds/logic';
import type { MapPath, MapPin } from '../../components/mapTypes';
import { FoldAway, UnlockReveal } from '../../components/motion';
import { useNavLaunch } from '../../components/NavLaunch';
import { NightMap } from '../../components/NightMap';
import { PhotoCredit } from '../../components/PhotoCredit';
import { useShareLink } from '../../components/ShareLink';
import { InviteSheet } from '../../components/InviteSheet';
import { canInvite, INVITE_WORDS, inviterOf } from '../../lib/eventInvites';
import { usePhotoFlow } from '../../components/PhotoFlow';
import { eventPhotoRef, eventStandIn, statusTag } from '../../components/TonightCards';
import { PhotoViewer } from '../../components/PhotoGallery';
import { appNow } from '../../lib/appClock';
import { areaRadius } from '../../lib/area';
import { categoryInfo, votingCloses, type AwardCategory } from '../../lib/awards';
import { broughtBuild, canGoWith, checkInBuild, chosenBuild, defaultBuild, fitsInvite, ownBuilds } from '../../lib/bringing';
import { useNow } from '../../lib/clock';
import { idsWithoutBlocked } from '../../lib/blocking';
import { useCommunity, useCommunityQuery } from '../../lib/communityStore';
import { eventPrimary, goingMix, statusLine } from '../../lib/eventAction';
import { canChangePlan, canCheckIn, canEditEvent, canSeeStop, endTime, EVENT_LABELS, isHost, moveOnAudience, phaseOf, revealTime } from '../../lib/events';
import { myEventStatus, newlyUnlocked, roleOf, STATUS_LABELS } from '../../lib/eventView';
import { formatTime, goingSummary, plural } from '../../lib/format';
import { aroundArea, GOING, LEAVE_MEET, MEET_POINT } from '../../lib/glossary';
import { inviteRows } from '../../lib/invites';
import { preciseFix } from '../../lib/location';
import { planForEvent } from '../../lib/navPlan';
import { askPermission, notificationsSupported } from '../../lib/notify';
import { lastPage, PAGE as LIST_PAGE } from '../../lib/paging';
import { milesBetween } from '../../lib/geo';
import { photoSource, SAMPLE_REF } from '../../lib/photoSource';
import { REP } from '../../lib/rep';
import { eventSharePayload } from '../../lib/share';
import { useStore } from '../../lib/store';
import type { Build, LatLng, User } from '../../lib/types';
import { endedLabel, liveLabel, timeRange } from '../../lib/when';
import { COLOR, EVENT_COLOURS, MOTION, RADII, SPACING } from '../../theme';

/** The soft top edge on the event map, in points. */
const EDGE_FADE = 10;

/** The hero's meta line sits under its title: past this much above the hero's bottom, the title is out of view. */
const HERO_TITLE_CLEAR = 72;

/** A host's Navigate becomes the primary this close to the start (else Invite or Share is). */
const ON_THE_DAY_HOURS = 6;

/** The night meet photo when a demo meet has no build photo or stand-in (as on "It's up"). */
const NIGHT_MEET_ART = `${SAMPLE_REF}hero-night-meet`;

/** The demo's trophy cover waits this long after the vote sheet closes, so the page has scrolled to it. */
const REVEAL_DELAY_MS = 450;

/** How long the "+150 rep" moment stays after check-in before it folds away. */
const REP_MOMENT_MS = 6000;

/** The event map's height, and the room the ActionBar takes at the bottom (for scrolling the map into view). */
const MAP_H = 180;
const BAR_ROOM = 140;
/** The ActionBar line that says you're going. */
const BAR_STATE_H = 32;

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
  const [galleryAt, setGalleryAt] = useState<number | null>(null);
  const [error, setErrorState] = useState<{ at: ErrorAt; text: string } | null>(null);
  const setError = (at: ErrorAt, text: string | null) => setErrorState(text ? { at, text } : null);
  const errorAt = (at: ErrorAt) => (error?.at === at ? error.text : null);
  const [busy, setBusy] = useState(false);
  const [justCheckedIn, setJustCheckedIn] = useState(false);
  /** The "+150 rep" card is folding away (fade, then its height closes: never over the going row). */
  const [repLeaving, setRepLeaving] = useState(false);
  // "+150 rep" is a moment, not page content (Review 15 decision 7): it shows once, then folds away.
  useEffect(() => {
    if (!justCheckedIn) return;
    setRepLeaving(false);
    const t = setTimeout(() => setRepLeaving(true), REP_MOMENT_MS);
    return () => clearTimeout(t);
  }, [justCheckedIn]);
  const [unlock, setUnlock] = useState<string | null>(null);
  const [menu, setMenu] = useState(false);
  const [changesOpen, setChangesOpen] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  /** The trophy the vote sheet is open on (null: closed). */
  const [voteCat, setVoteCat] = useState<AwardCategory | null>(null);
  const sharer = useShareLink();
  /** Invite connections (InviteSheet): from the Bring your mates row while going, and from ···. */
  const [inviting, setInviting] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  /** The "What are you bringing?" sheet: before I'm going, to change it, or at check-in. */
  const [bring, setBring] = useState<null | 'go' | 'change' | 'checkin'>(null);
  /** At check-in: the build they turned up in, if it isn't the one they said. */
  const [checkInPick, setCheckInPick] = useState<string | undefined>();
  const scroll = useRef<{ scrollTo: (o: { y: number; animated?: boolean }) => void } | null>(null);
  const photosAt = useRef(0);
  const mapAt = useRef(0);
  const viewH = useRef(0);
  const trophiesAt = useRef(0);
  /** Where the hero's title has scrolled out of view (content y), and whether it has. */
  const heroBottom = useRef(0);
  const [titleUp, setTitleUp] = useState(false);
  const screenW = useWindowDimensions().width;

  // "Location shown": the first time this person can see a meet point, play the reveal once.
  const fresh = e ? newlyUnlocked(e, me, crews, now, store.unlockSeen[e.id] ?? []) : [];
  const freshKey = fresh.join(',');
  const { markUnlockSeen } = store;
  useEffect(() => {
    if (!e || fresh.length === 0) return;
    const names = fresh.map((sid) => e.stops.find((x) => x.id === sid)?.name ?? '');
    setUnlock(e.type === 'cruise' && fresh.length > 1 ? 'The route' : names[names.length - 1]);
    markUnlockSeen(e.id, fresh);
    // Bring the map into view for the moment (it sits under the hero on a meet with a photo): only as
    // far as the map needs, so the place line stays on screen; the ActionBar says you're going (Review 14).
    if (mapAt.current > 0) {
      const y = mapAt.current + MAP_H + SPACING.md - (viewH.current - BAR_ROOM - BAR_STATE_H);
      if (y > 0) setTimeout(() => scroll.current?.scrollTo({ y, animated: true }), 50);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [freshKey, e?.id]);

  const { blocked } = community;
  // A cancelled meet says so once, in its place line (C5, Review 20 problem 6): not again in the chat.
  const cancelledNow = !!e?.cancelled;
  const messages = useMemo(
    () => chat.filter((m) => m.eventId === id && !blocked.has(m.userId) && !(cancelledNow && m.system && /cancel/i.test(m.text))),
    [chat, id, blocked, cancelledNow],
  );
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

  // Invites need the server's invite_connections() signed in (store.remote.invitesLive()); the demo always has them.
  const invitesLive = store.backend === 'local' || !!store.remote?.invitesLive();
  const inviteOn = invitesLive && canInvite(ev, me, crews, now);
  const state = eventPrimary(ev, me, role, crews, builds, now, votes);
  const demo = store.backend === 'local';
  const cats = voteCategories(ev, builds, me, now);
  // The demo's trophy moment (owner decision, Review 19; L4): each trophy you vote in shows its
  // result as soon as the vote sheet closes, under "Demo: how Best car went", with "2 more to vote"
  // for the rest. Inside task 6, no extra taps. Signed in, results come at the real time.
  const votedCount = cats.filter((c) => votes.some((v) => v.eventId === ev.id && v.voterId === me && v.category === c)).length;
  const resultsIn = demo && votedCount > 0 && voteCat === null && !ev.cancelled && phase !== 'over';
  // The demo never promises a time it won't keep (Review 15 decision 2): no vote line, the results show.
  const status = statusLine(ev, state, { me, crews, builds, users, votes, now, resultsIn, demo: demo && phase !== 'over', trophies: cats.length });

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
      if (result === 'requested') toast({ message: 'Asked the host', tone: 'info' });
      else if (!wasGoing) {
        // Straight away and on one line (4.7, Review 14). No tap in a toast but Undo (Review 17): which
        // car is said in the ActionBar, and changed from the ··· menu.
        toast({ message: passenger ? "You're going as a passenger" : "You're going" });
        // Bring your mates is a row on the page, never a sheet that opens by itself (Review 18): the
        // toast, the going moment and the location moment are never covered.
      } else if (b) toast({ message: `Bringing your ${shortBuildName(b)}` });
    } catch (err) {
      setError('going', err instanceof Error ? err.message : "Couldn't change that.");
    } finally {
      setBusy(false);
    }
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
          setError('checkin', fix.reason === 'denied' ? 'Check-in needs your location. Allow it for Slipstream in Settings.' : "Couldn't read your location. Try again outside.");
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

  /** The "Remind me at 21:30" switch in the location block: the event reminders setting, said where it matters. */
  async function setRemind(on: boolean, at: string) {
    const time = formatTime(at);
    if (!on) {
      store.setSettings({ reminders: false });
      toast({ message: 'Reminders off', tone: 'info' });
      return;
    }
    store.setSettings({ reminders: true });
    const allowed = notificationsSupported ? await askPermission().catch(() => false) : false;
    store.refreshReminders();
    toast(allowed || !notificationsSupported ? { message: `We'll remind you at ${time}` } : { message: 'Allow notifications in Settings', tone: 'info' });
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
      toast({ message: 'Photo posted' });
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
      if (ok) toast({ message: 'Not going', tone: 'info', action: { label: 'Undo', onPress: () => store.setGoing(ev.id, true, was).catch(() => {}) } });
    });
  }

  // Photos: posts at the meet point during the meet, then the builds that checked in.
  const from = new Date(ev.startsAt).getTime() - 30 * 60_000;
  const to = endTime(ev).getTime() + 24 * 3_600_000;
  // Your own photos at the meet point always show (posts may be stamped on the real clock in the demo).
  const postPhotos = (posts.data ?? []).filter((p) => p.photo && (p.authorId === me || (new Date(p.createdAt).getTime() >= from && new Date(p.createdAt).getTime() <= to)));
  // A sample meet's own photos (Review 20 #13) stand in for the builds' photos, which show elsewhere.
  const meetPhotos = ev.gallery ?? [];
  const buildPhotos = meetPhotos.length ? [] : Object.entries(ev.checkIns)
    .filter(([, s]) => s.length > 0)
    .map(([uid]) => broughtBuild(ev, uid, builds))
    .filter((b): b is Build => !!b && b.photos.length > 0);
  function shownPhotosCount() {
    return postPhotos.length + meetPhotos.length + buildPhotos.length;
  }
  const showPhotos = phase === 'live' || phase === 'over';
  const canAddPhoto = myCheckIns.length > 0 && !closed;
  const tiles = [
    ...postPhotos.map((p) => ({ key: `p:${p.id}`, ref: p.photo!, open: () => router.push({ pathname: '/post/[id]', params: { id: p.id } }), label: `Photo by ${userLabel(p.authorId)}`, kind: 'car' as const })),
    ...meetPhotos.map((ref, i) => ({ key: `g:${i}`, ref, open: () => setGalleryAt(i), label: `Photo ${i + 1} from the meet`, kind: 'car' as const })),
    ...buildPhotos.map((b) => ({ key: `b:${b.id}`, ref: b.photos[0], open: () => router.push({ pathname: '/build/[id]', params: { id: b.id } }), label: `${b.make} ${b.model}`, kind: b.kind })),
  ].slice(0, 9);

  // ---------------------------------------------------------------------------
  // The ActionBar, by state (3.5 table).
  // ---------------------------------------------------------------------------
  const voted = (cat: string) => votes.find((v) => v.eventId === ev.id && v.voterId === me && v.category === cat)?.buildId;
  const votedCats = cats.filter((c) => !!voted(c));
  const toVote = cats.filter((c) => !voted(c));
  const firstUnvoted = cats.find((c) => !votes.some((v) => v.eventId === ev.id && v.voterId === me && v.category === c)) ?? cats[0];
  // "2 more to vote · Best bike next": always clear which trophies still need your vote (Reviews 15, 19).
  const voteProgress = <VoteProgress cats={cats} voted={(c) => !!voted(c)} onVote={setVoteCat} />;
  const addPhoto: ActionBarButton = { label: 'Add a photo', onPress: () => flow.pick(), busy: flow.busy };
  let primary: ActionBarButton | null = null;
  let secondary: ActionBarButton | null = null;
  // Going, location hidden (3.5, 4.3; Review 16 problem 1): no primary yet, so the bar shows a status
  // pill that just says "Going" (the time is said once, in the status line) and Can't make it, the
  // way out. Remind me is a switch in the location block.
  let pill: string | null = null;
  // "On the day": it starts today, or within the next few hours (a 01:00 start the evening before).
  const startMs = new Date(ev.startsAt).getTime();
  const onTheDay = new Date(ev.startsAt).toDateString() === now.toDateString() || startMs - now.getTime() < ON_THE_DAY_HOURS * 3_600_000;
  const canRemind = state.kind === 'waiting' && !state.placing && going && !host && new Date(state.at) > now;
  switch (state.kind) {
    case 'join':
      primary = { label: state.request ? 'Ask to go' : "I'm going", onPress: state.request ? () => (mine.length > 1 ? setBring('go') : commitGoing(defaultPick?.id)) : imGoing, busy, haptic: 'success' };
      break;
    case 'waiting':
      if (going && !host) {
        pill = STATUS_LABELS.going;
        secondary = { label: GOING.leave, onPress: () => setConfirmLeave(true) };
      }
      break;
    case 'navigate':
      // A host before the day (Review 19): the next job is getting people there, not driving yet.
      // Navigate is the primary on the day; before it, it waits in ··· (Open in another app).
      if (host && !onTheDay) primary = inviteOn ? { label: INVITE_WORDS.open, onPress: () => setInviting(true) } : { label: 'Share', onPress: () => void doShare() };
      else if (navTo) primary = { label: nav.label, onPress: nav.open };
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
      // Once you've voted, Vote steps down to the secondary while trophies are left (Review 19):
      // the next thing is the photo, and the result already shows (the demo) or comes at its time.
      primary = addPhoto;
      if (toVote.length > 0 && phase !== 'over') secondary = { label: 'Vote', onPress: () => setVoteCat(firstUnvoted ?? null) };
      break;
    case 'ended':
      secondary = shownPhotosCount() > 0 ? { label: 'See photos', onPress: () => scroll.current?.scrollTo({ y: Math.max(0, photosAt.current - SPACING.lg), animated: true }) } : null;
      break;
    default:
      break;
  }

  const barHasPhoto = primary === addPhoto || secondary === addPhoto;
  /** Invite connections is the ActionBar's (a host before the day): not a row or a ··· item as well. */
  const invitePrimary = primary?.label === INVITE_WORDS.open;
  // Going is said once, in the same place on every event (C5, Review 18): the ActionBar. Its pill
  // ("Going") while there's no primary yet, else this line over the buttons; never a tag on the photo.
  const myStatus = myEventStatus(ev, me, crews, now);
  const goingState = myStatus === 'going';
  const barState =
    myStatus === 'checkedIn' && !closed
      ? STATUS_LABELS.checkedIn
      : going && !pill && goingState
        ? bringing
          ? `Going with your ${shortBuildName(bringing)}`
          : "You're going"
        : null;

  // ---------------------------------------------------------------------------
  // Pieces
  // ---------------------------------------------------------------------------
  // One look for every meet (K3, Review 22): in the demo a meet with no photo of its own gets the host's
  // stand-in, then the night meet art, as the cards and "It's up" do, never a map hero with the title under it.
  const ownPhoto = eventPhotoRef(ev, builds);
  const standIn = !ownPhoto && demo ? eventStandIn(ev, builds) : null;
  const photoRef = ownPhoto ?? standIn?.ref ?? (demo ? NIGHT_MEET_ART : null);
  const placeShown = currentStop?.at && canSeeStop(ev, current, me, crews, now);
  // The area is said once (C5): in the meta line, as "Around Tamworth" (the one form), unless the
  // status line already names the town with the meet point.
  const where = ev.areaName && status.text.includes(ev.areaName) ? null : aroundArea(ev.areaName);
  const time =
    // Cancelled is said once, in the place line (C5, Review 20 problem 6): the meta keeps only the time.
    phase === 'cancelled'
      ? timeRange(ev.startsAt, ev.endsAt, now)
      : phase === 'over'
        ? endedLabel(endTime(ev), now)
        : phase === 'live'
          ? liveLabel(endTime(ev))
          : timeRange(ev.startsAt, ev.endsAt, now);
  const meta = [time, where, ev.routeMiles ? `${ev.routeMiles} mi route` : null].filter(Boolean).join(' · ');
  // Your status, once (K3, C5): the same tag as Tonight's card and Me (myEventStatus).
  // Going is the ActionBar's to say (4.3 owns where you stand), so the photo never has a Going tag (C5, Reviews 17 and 18).
  // Checked in is the ActionBar's line too (Review 20 problem 4); a cancelled meet has no HOSTING tag (problem 6).
  const heroTag = pill || goingState || myStatus === 'checkedIn' || phase === 'cancelled' ? null : (statusTag(myStatus) ?? null);

  // Someone you blocked is not in the going row or its count.
  const goingNow = idsWithoutBlocked(ev.going, blocked);
  const goingPeople = [...goingNow].sort((a, b) => (a === me ? -1 : b === me ? 1 : 0)).map((uid) => {
    const u = users.find((x) => x.id === uid);
    return { id: uid, name: u?.name, handle: u?.handle };
  });
  const mix = goingMix({ ...ev, going: goingNow }, builds);

  // Map: the area circle until the meet point shows, then the pin(s).
  const visibleStops = ev.stops.map((st, i) => ({ st, i, visible: canSeeStop(ev, i, me, crews, now) }));
  const mapPins: MapPin[] = visibleStops
    .filter((x) => x.visible && x.st.at)
    .map((x) => ({ id: x.st.id, at: x.st.at!, glyph: ev.type, colour: x.i === current && phase !== 'cancelled' ? colour : COLOR.text.secondary, title: x.st.name, size: x.i === current ? 40 : 30, live: x.i === current && phase === 'live' }));
  const mapPaths: MapPath[] = ev.type === 'cruise' && mapPins.length > 1 ? [{ id: 'route', coords: mapPins.map((p) => p.at), colour, dashed: true }] : [];
  const anyVisible = mapPins.length > 0;
  const mapCentre = anyVisible ? (mapPins.find((p) => p.id === currentStop?.id)?.at ?? mapPins[0].at) : ev.area;
  const areaMiles = areaRadius(ev);

  const hostIds = ev.hostIds;
  const hostLine = [crew ? `${crew.name} crew` : null, hostIds.map((h) => (h === me ? 'you' : userLabel(h))).join(', ')].filter(Boolean).join(' with ');
  const canEdit = host && canEditEvent(ev, now).ok;
  const canPlan = host && canChangePlan(ev, now).ok && phase !== 'upcoming';
  const requests = ev.requests ?? [];
  const invite = inviteRows(ev.filter);

  type MenuOption = { label: string; detail?: string; destructive?: boolean; onPress: () => void };
  const menuOptions: MenuOption[] = ([
    going && !host && !closed ? { label: GOING.leave, destructive: true, onPress: () => (setMenu(false), setConfirmLeave(true)) } : null,
    (going || host) && !closed && mine.length > 0 ? { label: 'Change what you’re bringing', onPress: () => (setMenu(false), setBring('change')) } : null,
    ev.requests?.includes(me) ? { label: GOING.cancelRequest, onPress: () => (setMenu(false), attempt('menu', () => store.setGoing(ev.id, false), "Couldn't change that.")) } : null,
    inviteOn && !invitePrimary ? { label: INVITE_WORDS.open, onPress: () => (setMenu(false), setInviting(true)) } : null,
    navTo ? { label: 'Open in another app', onPress: () => (setMenu(false), nav.openOther()) } : null,
    canEdit ? { label: 'Edit', onPress: () => (setMenu(false), router.push({ pathname: '/event/edit', params: { id: ev.id } })) } : null,
    canPlan ? { label: 'Change the plan', onPress: () => (setMenu(false), router.push({ pathname: '/event/plan', params: { id: ev.id } })) } : null,
    host && (ev.changes?.length ?? 0) > 0 ? { label: 'Plan changes', onPress: () => (setMenu(false), setChangesOpen(true)) } : null,
    // Says what it cancels (Review 19, 4.5): a bare "Cancel" in a sheet reads as "close this".
    host && !closed ? { label: `Cancel this ${EVENT_LABELS[ev.type].toLowerCase()}…`, destructive: true, onPress: () => (setMenu(false), setConfirmCancel(true)) } : null,
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
        labels={false}
        // While "Location shown" plays, its own pin is the only one (no second pin under it, Review 15).
        // The pin stays put under it (Review 20 problem 5): the moment's own pin is drawn exactly over it.
        pins={anyVisible ? mapPins : []}
        paths={mapPaths}
        // The area in a quiet grey: colour is for the pin (accent rule, Review 13).
        circles={anyVisible ? [] : [{ id: 'area', centre: ev.area, radiusMiles: areaMiles, colour: COLOR.text.secondary }]}
        centre={mapCentre}
        span={anyVisible ? (ev.type === 'cruise' ? 0.25 : 0.06) : Math.max(0.12, (areaMiles * 2.6) / 69)}
        follow
      />
      {/* A road label cut by the frame's edge showed as a white sliver (Review 19): the top and bottom edges fade into the frame. */}
      <Gradient to="top" colours={[rgba(COLOR.surface.media, 0), COLOR.surface.media]} style={{ position: 'absolute', left: 0, right: 0, top: 0, height: EDGE_FADE }} />
      <Gradient colours={[rgba(COLOR.surface.media, 0), COLOR.surface.media]} style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: EDGE_FADE / 2 }} />
      {unlock ? (
        <UnlockReveal
          glyph={ev.type}
          colour={colour}
          pinSize={mapPins.find((p) => p.id === currentStop?.id)?.size ?? 40}
          title={unlock}
          onDone={() => setUnlock(null)}
        />
      ) : null}
    </>
  );


  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: COLOR.surface.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <Stack.Screen
        options={{
          // Nothing to share on a cancelled meet (Review 21 gap 9).
          ...screenHeader({ action: phase === 'cancelled' ? undefined : { label: 'Share', accessibilityLabel: 'Share this meet', onPress: doShare }, onMenu: () => setMenu(true) }),
          // The hero carries the title; once it has scrolled away (the location moment scrolls to the
          // map) the header keeps a compact copy, so you always know which meet this is (4.1, Review 19).
          headerTitle: titleUp
            ? () => (
                // Body size, up to two lines: never cut, at any text size (L2).
                <DsText v="body" numberOfLines={2} style={{ maxWidth: Math.max(140, screenW - 200) }}>
                  {ev.title}
                </DsText>
              )
            : () => null,
        }}
      />
      <ScrollView
        ref={scroll as never}
        scrollEventThrottle={32}
        onScroll={(e) => {
          const up = heroBottom.current > 0 && e.nativeEvent.contentOffset.y > heroBottom.current;
          if (up !== titleUp) setTitleUp(up);
        }}
        contentContainerStyle={PAGE_WITH_BAR}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        onLayout={(l) => (viewH.current = l.nativeEvent.layout.height)}
      >
        <View onLayout={(l) => (heroBottom.current = l.nativeEvent.layout.y + l.nativeEvent.layout.height - HERO_TITLE_CLEAR)}>
        <Hero
          bleed
          photo={photoRef ? photoSource(photoRef) : null}
          media={mapOnTop ? <View style={{ aspectRatio: 16 / 9, overflow: 'hidden' }}>{map}</View> : undefined}
          overlay={photoRef ? <PhotoCredit photoRef={photoRef} standIn={standIn?.standIn} overlay corner="topRight" /> : undefined}
          eyebrow={EVENT_LABELS[ev.type]}
          live={phase === 'live'}
          title={ev.title}
          meta={meta}
          tag={heroTag}
        />
        </View>

        <View style={{ gap: SPACING.md }}>
          {/* The place line says only where (4.11); the next step is its own line, said once (Review 14). */}
          <View style={{ gap: SPACING.xxs }}>
            <LocationLine text={status.text} done={status.done} />
            {status.note ? (
              <DsText v="secondary" style={{ paddingLeft: 18 + SPACING.sm }} accessibilityLiveRegion="polite">
                {status.note}
              </DsText>
            ) : null}
            {status.eligibility ? (
              // Who can come is its own row with its own mark (4.11, Review 19), never the place line's pin.
              <View accessible accessibilityLabel={status.eligibility} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm, paddingTop: SPACING.xs }}>
                <View style={{ paddingTop: SPACING.xxs }} aria-hidden>
                  <Icon name="info" size={18} colour={COLOR.text.secondary} />
                </View>
                <DsText v="body" style={{ flex: 1 }}>
                  {status.eligibility}
                </DsText>
              </View>
            ) : null}
            {canRemind && state.kind === 'waiting' ? (
              <View style={{ paddingLeft: 18 + SPACING.sm }}>
                {/* The time is said once, in the line above (C5, Review 17). */}
                <SwitchRow label="Remind me" value={settings.reminders} onValueChange={(v) => setRemind(v, state.at)} />
              </View>
            ) : null}
          </View>
          {justCheckedIn ? (
            <FoldAway shown={!repLeaving} gap={SPACING.md} onGone={() => setJustCheckedIn(false)}>
              <CheckInCelebration play title={`+${REP.attended} rep`} body="For turning up. It shows on your profile." />
            </FoldAway>
          ) : null}
          {errorAt('checkin') ? <ErrorState title={errorAt('checkin')!} /> : null}
          {errorAt('going') ? <ErrorState title={errorAt('going')!} /> : null}
          {errorAt('menu') ? <ErrorState title={errorAt('menu')!} /> : null}
          <GoingStrip
            people={goingPeople}
            summary={`${phase === 'cancelled' ? 'Was ' : ''}${goingSummary(goingNow.length, mix.cars, mix.bikes, phase === 'over' ? 'went' : 'going')}`}
            onPress={goingNow.length ? () => router.push({ pathname: '/event/going', params: { id: ev.id } }) : undefined}
          />
          {/* Bring your mates (Review 18): a row while you're going, never a sheet that opens by itself. */}
          {going && !closed && !invitePrimary ? (
            <ListRow leading={{ icon: 'share' }} title="Bring your mates" subtitle="Invite connections or share" onPress={() => setInviting(true)} />
          ) : null}
        </View>

        {!ev.cancelled && (resultsIn || now >= votingCloses(ev)) ? (
          <View onLayout={(l) => (trophiesAt.current = l.nativeEvent.layout.y)}>
            <TrophiesSection
              event={ev}
              preview={resultsIn && now < votingCloses(ev)}
              // The cover rises once the page has scrolled to it.
              delay={resultsIn ? REVEAL_DELAY_MS : 0}
              progress={resultsIn && toVote.length > 0 ? voteProgress : undefined}
            />
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
            <PhotoViewer photos={meetPhotos} start={galleryAt} onClose={() => setGalleryAt(null)} />
          </View>
        ) : null}

        {votedCats.length > 0 && !resultsIn && (state.kind === 'vote' || state.kind === 'voted') ? (
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
                  {voteProgress}
                </View>
              ) : null}
            </View>
          </Section>
        ) : null}

        {/* A cancelled meet keeps its chat only if people said something; it never asks you to say hello (Review 21 gap 9). */}
        {(going || host) && !(phase === 'cancelled' && messages.length === 0) ? (
          <Section title="Chat">
            <ChatLines lines={chatPage.items} earlier={chatOpen ? chatPage.earlier : 0} onEarlier={() => setChatShown((n) => n + LIST_PAGE)} me={me} label={userLabel} users={users} closed={closed} />
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
                  <ListRow leading={{ avatar: { name: u?.name, handle: u?.handle } }} title={userLabel(uid)} subtitle={b ? `${b.make} ${b.model} · ${bhpLine(b)}` : 'No car or bike'} meta={inviterOf(ev, uid) ? `Asked to go · ${inviterOf(ev, uid) === me ? 'you' : displayHandle(handleOf(inviterOf(ev, uid)!))} sent it` : 'Asked to go'} onPress={() => openUser(uid)} />
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
            {requests.length === 0 && !ev.filter.everyone ? <DsText v="secondary">No requests to go yet.</DsText> : null}
            {/* The host form's two rows, word for word (Review 15 decision 1). Said here for hosts, in About for everyone else. */}
            <InviteRows rows={invite} />
          </Section>
        ) : null}

        <Section title="About">
          {ev.description ? <DsText v="body">{ev.description}</DsText> : null}
          <ListRow
            leading={{ avatar: { name: users.find((u) => u.id === hostIds[0])?.name, handle: users.find((u) => u.id === hostIds[0])?.handle } }}
            title={`Hosted by ${hostLine}`}
            onPress={crew ? () => router.push({ pathname: '/crew/[id]', params: { id: crew.id } }) : hostIds[0] && hostIds[0] !== me ? () => openUser(hostIds[0]) : undefined}
          />
          {host && !closed ? null : <InviteRows rows={invite} ended={closed} />}
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

      {barState ? (
        // Going, and the page moved to the map for the location moment: the state is said here while
        // the hero's tag is out of view (Review 14), above the same buttons.
        <ActionBar>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }} accessible accessibilityLabel={barState}>
            <Icon name="success" size={18} colour={COLOR.state.success} />
            <DsText v="secondary" tone="primary" numberOfLines={2} style={{ flex: 1 }}>
              {barState}
            </DsText>
          </View>
          {primary ? <Button tier="primary" size="md" block label={primary.label} onPress={primary.onPress} busy={primary.busy} haptic={primary.haptic} /> : null}
          {secondary ? <Button tier="secondary" size="md" block label={secondary.label} onPress={secondary.onPress} busy={secondary.busy} haptic={secondary.haptic} /> : null}
        </ActionBar>
      ) : (
        <ActionBar primary={primary} secondary={secondary} status={primary ? null : pill} statusIcon={pill ? 'success' : undefined} />
      )}

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
          // The demo's trophy moment (L4, Review 19): any vote makes its result show; it flips in here.
          if (votedNow && demo) setTimeout(() => scroll.current?.scrollTo({ y: Math.max(0, trophiesAt.current - SPACING.lg), animated: true }), 350);
        }}
      />
      {sharer.sheet}
      <InviteSheet event={ev} visible={inviting} onClose={() => setInviting(false)} onShareOther={() => void doShare()} />

      <Sheet visible={menu} title="Meet options" onClose={() => setMenu(false)}>
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
        title={`Cancel the ${EVENT_LABELS[ev.type].toLowerCase()}?`}
        message={`Everyone going to ${ev.title} sees it as cancelled and gets no more reminders.${errorAt('cancel') ? `\n\n${errorAt('cancel')}` : ''}`}
        verb="Cancel"
        onCancel={() => setConfirmCancel(false)}
        onConfirm={() => {
          attempt('cancel', () => store.cancelEvent(ev.id), "Couldn't cancel it.").then((ok) => {
            if (!ok) return;
            setConfirmCancel(false);
            toast({ message: `${EVENT_LABELS[ev.type]} cancelled`, tone: 'info' });
          });
        }}
      />
      {/* One confirm pattern (4.5): "Leave it" is ambiguous here, so both outcomes in plain words. */}
      <ConfirmSheet
        visible={confirmLeave}
        title={GOING.leave}
        message={`Take yourself off ${ev.title}? You won't get its reminders. You can undo it straight after.`}
        verb="Leave"
        confirmLabel={LEAVE_MEET.confirm}
        cancelLabel={LEAVE_MEET.cancel}
        onCancel={() => setConfirmLeave(false)}
        onConfirm={leave}
      />
    </KeyboardAvoidingView>
  );
}

/** Who can come, then who we'll tell: the host form's two rows (`inviteRows`), never "Anyone within 25 mi". */
function InviteRows({ rows, ended }: { rows: { come: string; tell: string }; ended?: boolean }) {
  return (
    <View style={{ gap: SPACING.xxs }}>
      <DsText v="secondary">
        <DsText v="secondary" tone="primary">Who can come: </DsText>
        {rows.come}
      </DsText>
      {/* Nobody is told about a meet that's over (Review 17). */}
      {ended ? null : (
        <DsText v="secondary">
          <DsText v="secondary" tone="primary">Who we'll tell: </DsText>
          {rows.tell}
        </DsText>
      )}
    </View>
  );
}

/** One square photo in the event's Photos grid: cover-fit like every tile, never letterboxed (Review 19). */
function PhotoTile({ photoRef }: { photoRef: string }) {
  // FitImage sizes the photo to the tile (100% by 100%): a bare Image takes a bundled photo's own
  // 1200 x 900 size on web and shows only its corner (Review 20 problem 1).
  return <FitImage fit="cover" source={photoSource(photoRef)} frameAspect={1} />;
}

type Line = { id: string; userId: string; text: string; at: string; system?: boolean };

/** Chat lines: a system line is a quiet caption; a person is their handle and the time, then the text. */
function ChatLines({ lines, earlier, onEarlier, me, label, users, closed }: { lines: readonly Line[]; earlier: number; onEarlier: () => void; me: string; label: (uid: string) => string; users: readonly User[]; closed?: boolean }) {
  if (lines.length === 0) return <EmptyState variant="inline" title={closed ? 'No messages.' : 'No messages yet. Say hello.'} />;
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
            {/* A person is always avatar + @handle (K3, Review 15): the group chat's sender row. */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
              <Avatar {...personMark(users.find((u) => u.id === m.userId))} size="sm" />
              <DsText v="secondary" numberOfLines={1} style={{ flexShrink: 1 }}>
                {label(m.userId)}
              </DsText>
              <DsText v="meta">· {formatTime(m.at)}</DsText>
            </View>
            <DsText v="body">{m.text}</DsText>
          </Press>
        ),
      )}
    </View>
  );
}
