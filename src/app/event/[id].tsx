import { carShape } from '../../lib/buildShape';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Share, View } from 'react-native';
import { AwardsSection } from '../../components/AwardsSection';
import { BringPicker, BuildOption } from '../../components/BringPicker';
import { isStaffNow, openModerate, openReport } from '../../components/Community';
import { Callout, CheckInCelebration, DetailHero, MediaFrame, NotFoundState, PAGE, TextField } from '../../components/Detail';
import {
  Avatar,
  BuildThumb,
  Button,
  ConfirmSheet,
  displayHandle,
  DsText,
  EmptyState,
  ErrorState,
  ListRow,
  Press,
  RowDivider,
  screenHeader,
  Section,
  Sheet,
  SheetOption,
  StatBlock,
  SwitchRow,
  Tag,
  type Stat,
  useToast,
} from '../../components/ds';
import type { MapPath, MapPin } from '../../components/mapTypes';
import { UnlockReveal } from '../../components/motion';
import { NavLaunch } from '../../components/NavLaunch';
import { NightMap } from '../../components/NightMap';
import { allAwards, hasLegend } from '../../lib/awards';
import { areaRadius } from '../../lib/area';
import { broughtBuild, buildLine, canGoWith, checkInBuild, chosenBuild, defaultBuild, fitsInvite, ownBuilds } from '../../lib/bringing';
import { classOf } from '../../lib/classes';
import { useNow } from '../../lib/clock';
import { useCommunity } from '../../lib/communityStore';
import { isSeedEvent } from '../../lib/demoTime';
import { eventPrimary, mixLine, whenLine } from '../../lib/eventAction';
import {
  canChangePlan,
  canChangeVehicle,
  canCheckIn,
  canEditEvent,
  canSeeStop,
  EVENT_LABELS,
  isHost,
  isPublicType,
  moveOnAudience,
  phaseOf,
  revealTime,
  shareText,
} from '../../lib/events';
import { newlyUnlocked, roleOf } from '../../lib/eventView';
import { formatRelative, formatTime, formatWhen, plural } from '../../lib/format';
import { GOING, LOCATION, MEET_POINT, roleLabel } from '../../lib/glossary';
import { countdown } from '../../lib/hud';
import { describeFilter } from '../../lib/invites';
import { preciseFix } from '../../lib/location';
import { planForEvent } from '../../lib/navPlan';
import { askPermission, notificationsSupported } from '../../lib/notify';
import { REP } from '../../lib/rep';
import { lastPage, PAGE as LIST_PAGE } from '../../lib/paging';
import { useStore } from '../../lib/store';
import type { Build, LatLng } from '../../lib/types';
import { COLOR, EVENT_COLOURS, SPACING } from '../../theme';
import { photoSource } from '../../lib/photoSource';

/** Where an error shows: under the control that caused it (REVIEW-5 M10). */
type ErrorAt = 'checkin' | 'going' | 'request' | 'moveon' | 'menu' | 'answer' | 'chat' | 'cancel' | 'change';

/**
 * An event: the heart of the app. One hierarchy, top to bottom:
 * header (kind, name, when, where, hosts) → one primary action by state (I'm going with your
 * build → Navigate → Check in → Vote) → host tools (hosts only) → who's going → stops →
 * chat → votes and trophies. Everything else (share, edit, can't make it, report) is in ···.
 */
export default function EventScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const store = useStore();
  const { events, me, crews, users, builds, chat, settings, votes } = store;
  const now = useNow();
  const awardsSoFar = useMemo(() => allAwards(votes, events, builds, now), [votes, events, builds, now]);
  const e = events.find((x) => x.id === id);
  const [message, setMessage] = useState('');
  const [error, setErrorState] = useState<{ at: ErrorAt; text: string } | null>(null);
  const setError = (at: ErrorAt, text: string | null) => setErrorState(text ? { at, text } : null);
  const errorAt = (at: ErrorAt) => (error?.at === at ? error.text : null);
  const [busy, setBusy] = useState(false);
  const [justCheckedIn, setJustCheckedIn] = useState(false);
  const [reminded, setReminded] = useState(false);
  const toast = useToast();
  const [unlock, setUnlock] = useState<string | null>(null);
  const [menu, setMenu] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  /** Hosts: show the map as invited people see it before the reveal. */
  const [asGuest, setAsGuest] = useState(false);
  /** Which vehicle picker is open: changing it, or at check-in. Going picks inline without opening anything. */
  const [picking, setPicking] = useState<null | 'change' | 'checkin'>(null);
  const [picked, setPicked] = useState<string | undefined>();
  /** At check-in: the build they turned up in, if it isn't the one they said. */
  const [checkInPick, setCheckInPick] = useState<string | undefined>();
  const [voteOpen, setVoteOpen] = useState(false);
  const scroll = useRef<{ scrollTo: (o: { y: number; animated?: boolean }) => void } | null>(null);
  const votesAt = useRef(0);

  // "Location shown": the first time this person can see a meet point, play the reveal once.
  const fresh = e ? newlyUnlocked(e, me, crews, now, store.unlockSeen[e.id] ?? []) : [];
  const freshKey = fresh.join(',');
  const { markUnlockSeen } = store;
  useEffect(() => {
    if (!e || fresh.length === 0) return;
    const names = fresh.map((sid) => e.stops.find((x) => x.id === sid)?.name ?? '');
    setUnlock(e.type === 'cruise' && fresh.length > 1 ? 'The route' : names[names.length - 1]);
    markUnlockSeen(e.id, fresh);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [freshKey, e?.id]);

  const { blocked } = useCommunity();
  // Lines from people you blocked are hidden (the server leaves them out too).
  const messages = useMemo(() => chat.filter((m) => m.eventId === id && !blocked.has(m.userId)), [chat, id, blocked]);
  // The newest messages, more on request: a long meet chat would otherwise redraw every line on each keystroke here.
  const [chatShown, setChatShown] = useState(LIST_PAGE * 2);
  const chatPage = lastPage(messages, chatShown);

  // Signed in: live chat, who's going, check-ins and the meet moving on, while this screen is open.
  const remote = store.remote;
  useEffect(() => {
    if (!remote || !id) return;
    return remote.watchEvent(id);
  }, [remote, id]);

  // The default build to go with: picked inline, before tapping "I'm going".
  const defaultPick = e ? defaultBuild(e, me, builds, events)?.id : undefined;
  const [goPick, setGoPick] = useState<string | undefined>(undefined);

  /** Run an action and show its reason if it's refused. */
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
  const requested = !!ev.requests?.includes(me);
  const requests = ev.requests ?? [];
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

  // The vehicle you're bringing (see bringing.ts).
  const mine = ownBuilds(me, builds);
  const chosen = chosenBuild(ev, me, builds);
  const bringing = broughtBuild(ev, me, builds);
  const goesWith = (b?: Build) => canGoWith(ev, me, crews, users, builds, b);
  const pickedBuild = mine.find((b) => b.id === picked);
  const canChange = (going || requested) && mine.length > 0 && (mine.length > 1 || !chosen) && canChangeVehicle(ev, me, now).ok;
  // At check-in: what you've just picked, else what you said, else the same build "You're bringing" shows (bringing.ts).
  const atCheckIn = checkInBuild(ev, me, builds, checkInPick);
  const goWith = mine.find((b) => b.id === (goPick ?? defaultPick)) ?? mine[0];

  const primary = eventPrimary(ev, me, role, crews, builds, now);
  const canPreview = host && !isPublicType(ev.type) && !closed;
  const guestView = canPreview && asGuest;
  // Seeing as a guest: every stop shows locked, as for invited people before the reveal.
  const visibleStops = ev.stops.map((st, i) => ({ st, i, visible: !guestView && canSeeStop(ev, i, me, crews, now) }));
  const mapPins: MapPin[] = visibleStops
    .filter((x) => x.visible && x.st.at)
    .map((x) => ({
      id: x.st.id,
      at: x.st.at!,
      glyph: ev.type,
      colour: x.i === current ? colour : COLOR.text.secondary,
      title: x.st.name,
      size: x.i === current ? 40 : 30,
      live: x.i === current && phase === 'live',
    }));
  const mapPaths: MapPath[] = ev.type === 'cruise' && mapPins.length > 1 ? [{ id: 'route', coords: mapPins.map((p) => p.at), colour, dashed: true }] : [];
  const anyVisible = mapPins.length > 0;
  // Navigate: through the stops you can see (a rolling meet: only the one it's at now).
  const navPlan = !closed && !guestView ? planForEvent(ev, me, crews, now) : null;
  // Other apps take one point: the meet point Check in names (a rolling meet's current one), else the first.
  const navTo = navPlan ? (navPlan.stops.find((s) => s.checkIn) ?? navPlan.stops[0]) : null;
  const navToNote = navTo
    ? ev.type === 'rolling'
      ? `Other apps go to ${navTo.name}, the ${MEET_POINT.one} it's at now. Come back here when it moves on.`
      : navPlan!.stops.length > 1
        ? `Other apps get ${navTo.name} only, not the rest of the route.`
        : undefined
    : undefined;
  const mapCentre = anyVisible ? (mapPins.find((p) => p.id === currentStop?.id)?.at ?? mapPins[0]?.at ?? ev.area) : ev.area;
  const areaMiles = areaRadius(ev);
  const currentVisible = visibleStops[current]?.visible;

  // The demo never blocks a check-in on distance (there's no way to be at a sample meet point).
  // Signed in, the distance check always runs, here and again on the server.
  const skipGps = store.backend === 'local';

  async function doCheckIn() {
    setErrorState(null);
    setBusy(true);
    try {
      let pos: LatLng | null = null;
      if (!skipGps) {
        // Real GPS: one precise fix, used for the distance check and never stored.
        const fix = await preciseFix();
        if (!fix.ok) {
          setError(
            'checkin',
            fix.reason === 'denied'
              ? 'Check-in needs your location. Allow it for Nightshift in Settings.'
              : "Couldn't read your location. Try again outside.",
          );
          return;
        }
        pos = fix.at;
      }
      const result = canCheckIn(ev, current, me, crews, new Date(), pos, skipGps);
      if (!result.ok) setError('checkin', result.reason);
      else {
        try {
          // Only send a build when it's news: a different one, or the first pick on record before the first check-in.
          const news = !!atCheckIn && (chosen ? atCheckIn.id !== chosen.id : myCheckIns.length === 0);
          await store.checkIn(ev.id, current, news ? atCheckIn!.id : undefined, pos);
        } catch (err) {
          setError('checkin', err instanceof Error ? err.message : "Couldn't check in.");
          return;
        }
        setCheckInPick(undefined);
        setJustCheckedIn(true); // The celebration buzzes success.
      }
    } catch {
      setError('checkin', "Couldn't read your location. Try again outside.");
    } finally {
      setBusy(false);
    }
  }

  async function commitGoing(buildId?: string) {
    setErrorState(null);
    const wasGoing = going;
    setBusy(true);
    try {
      const result = await store.setGoing(ev.id, true, buildId);
      setPicking(null);
      // First Going is the moment reminders make sense, so ask then (iOS only asks once).
      // Once they answer, schedule again: the first sync ran while the prompt was still up.
      if (result === 'going' && !wasGoing && settings.reminders) askPermission().then((ok) => ok && store.refreshReminders()).catch(() => {});
      // Say it worked (REVIEW-8: the button just changed, with no confirmation).
      if (result === 'going' && !wasGoing) toast({ message: "You're going. Check in when you get there." });
    } catch (err) {
      setError(picking === 'change' ? 'change' : 'going', err instanceof Error ? err.message : "Couldn't change that.");
    } finally {
      setBusy(false);
    }
  }

  /** "Remind me" while the location is hidden: turn reminders on, ask once, and say when. */
  async function remindMe(at: string) {
    const time = formatTime(at);
    if (!settings.reminders) store.setSettings({ reminders: true });
    const allowed = notificationsSupported ? await askPermission().catch(() => false) : false;
    store.refreshReminders();
    setReminded(true);
    toast({
      message: allowed
        ? `We'll remind you at ${time}.`
        : notificationsSupported
          ? `Allow notifications for Nightshift in Settings to get it on your lock screen. It'll be in Notifications at ${time}.`
          : `It'll be in Notifications at ${time}.`,
    });
  }

  async function doShare() {
    setMenu(false);
    try {
      await Share.share({ message: shareText(ev, formatWhen(ev.startsAt, new Date())), title: ev.title });
    } catch {
      setError('menu', "Couldn't open the share sheet.");
    }
  }

  function openVotes() {
    setVoteOpen(true);
    setTimeout(() => scroll.current?.scrollTo({ y: Math.max(0, votesAt.current - SPACING.lg), animated: true }), 50);
  }

  const canEdit = host && canEditEvent(ev, now).ok;
  const canPlan = host && canChangePlan(ev, now).ok && phase !== 'upcoming';
  const when = whenLine(ev, now);
  const unlockAt = revealTime(ev);
  const where = currentVisible && currentStop
    ? ev.type === 'cruise'
      ? ev.stops[0].name
      : `At ${currentStop.name}`
    : `${ev.areaName} · ${(going || host) && unlockAt > now ? LOCATION.showsAt(formatTime(unlockAt.toISOString())).toLowerCase() : LOCATION.hidden}`;
  const checkedIn = Object.values(ev.checkIns).filter((x) => x.length > 0).length;
  const roleText = roleLabel(role);
  const status =
    phase === 'live'
      ? { label: 'Live', tone: 'live' as const }
      : phase === 'cancelled'
        ? { label: 'Cancelled', tone: 'danger' as const }
        : phase === 'over'
          ? { label: 'Finished', tone: 'neutral' as const }
          : roleText
            ? { label: roleText, tone: role === 'host' ? ('selected' as const) : role === 'going' ? ('success' as const) : role === 'requested' ? ('warning' as const) : role === 'declined' ? ('danger' as const) : ('info' as const) }
            : null;

  const stats: Stat[] = closed
    ? []
    : [
        phase === 'live' ? { label: 'Ends in', value: countdown(ev.endsAt ?? new Date(new Date(ev.startsAt).getTime() + 3 * 3600_000).toISOString(), now), tone: 'live' } : { label: 'Starts in', value: countdown(ev.startsAt, now) },
        phase === 'live' ? { label: 'Checked in', value: `${checkedIn}/${ev.going.length}` } : { label: 'Going', value: String(ev.going.length) },
        ev.type === 'rolling' || ev.type === 'cruise'
          ? { label: ev.type === 'cruise' ? 'Points' : 'Point', value: ev.type === 'cruise' ? String(ev.stops.length) : `${ev.currentStop + 1} of ${ev.stops.length}` }
          : !isPublicType(ev.type) && unlockAt > now
            ? { label: 'Location in', value: countdown(unlockAt, now) }
            : { label: 'Location', value: currentVisible ? LOCATION.shown : LOCATION.hiddenValue },
      ];

  const hostIds = ev.hostIds;
  const hostLine = [crew ? `${crew.name} crew` : null, hostIds.map((h) => (h === me ? 'you' : userLabel(h))).join(', ')].filter(Boolean).join(' with ');

  // ---------------------------------------------------------------------------
  // The primary action, by state.
  // ---------------------------------------------------------------------------
  const bringingRow =
    (going || requested) && picking !== 'change' ? (
      <View style={{ gap: SPACING.xs }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <DsText v="label">{going ? "You're bringing" : 'You asked with'}</DsText>
          {canChange ? (
            <Button
              tier="tertiary"
              size="sm"
              label="Change"
              accessibilityLabel="Change vehicle"
              onPress={() => {
                setErrorState(null);
                setPicked(bringing?.id ?? defaultPick);
                setPicking('change');
              }}
            />
          ) : null}
        </View>
        {bringing ? (
          <BuildOption build={bringing} on={false} fits={fitsInvite(ev, bringing)} />
        ) : (
          <EmptyState variant="inline" title="No car or bike (passenger)" action={mine.length === 0 ? { label: 'Add a car or bike', onPress: () => router.push('/build/edit') } : undefined} />
        )}
        {errorAt('change') ? <ErrorState title={errorAt('change')!} /> : null}
      </View>
    ) : null;

  const changePicker =
    picking === 'change' ? (
      <BringPicker
        title="Change vehicle"
        builds={mine}
        picked={picked}
        fits={(b) => fitsInvite(ev, b)}
        onPick={setPicked}
        busy={busy}
        confirmLabel={goesWith(pickedBuild) ? 'Bring this one' : going ? 'Change and request again' : GOING.request}
        note={
          !pickedBuild || goesWith(pickedBuild)
            ? null
            : going
              ? `The ${pickedBuild.make} ${pickedBuild.model} doesn't match the invite, so you'd go back to asking a host.`
              : `The ${pickedBuild.make} ${pickedBuild.model} doesn't match the invite, so a host has to say yes.`
        }
        onConfirm={() => commitGoing(picked)}
        onCancel={() => setPicking(null)}
      />
    ) : null;

  function joinBlock(request: boolean) {
    const label = request ? GOING.request : GOING.join;
    const fits = goWith ? goesWith(goWith) : undefined;
    const note = request
      ? mine.length === 0
        ? `The invite is for ${describeFilter(ev.filter).replace(/^Cars and bikes/, 'cars and bikes').replace(/^Cars/, 'cars').replace(/^Bikes/, 'bikes')}. With nothing in your garage, a host has to say yes.`
        : `Your builds or home area don't match this invite (${describeFilter(ev.filter)}). A host can still say yes.`
      : goWith && !fits
        ? `The ${goWith.make} ${goWith.model} doesn't match the invite, so a host has to say yes.`
        : null;
    if (mine.length === 0) {
      return (
        <View style={{ gap: SPACING.md }}>
          <Callout tone="info" title="What are you bringing?">
            Your garage is empty. Add your car or bike so the hosts know what's coming, or go along as a passenger.
          </Callout>
          <Button label={label} size="lg" block busy={busy} onPress={() => commitGoing()} />
          <Button label="Add a car or bike" tier="secondary" block onPress={() => router.push('/build/edit')} />
          {note ? <DsText v="caption">{note}</DsText> : null}
        </View>
      );
    }
    return (
      <View style={{ gap: SPACING.md }}>
        {mine.length > 1 ? (
          <View accessibilityRole="radiogroup" accessibilityLabel="What are you bringing?" style={{ gap: SPACING.sm }}>
            <DsText v="label">What are you bringing?</DsText>
            {mine.map((b) => (
              <BuildOption key={b.id} build={b} on={b.id === goWith?.id} fits={goesWith(b)} onPress={() => setGoPick(b.id)} />
            ))}
          </View>
        ) : (
          <View style={{ gap: SPACING.xs }}>
            <DsText v="label">Going with</DsText>
            <BuildOption build={mine[0]} on={false} fits={goesWith(mine[0])} />
          </View>
        )}
        <Button
          label={!request && goWith && !goesWith(goWith) ? GOING.request : label}
          size="lg"
          block
          busy={busy}
          haptic="success"
          onPress={() => commitGoing(goWith?.id)}
        />
        {note ? <DsText v="caption">{note}</DsText> : null}
        {errorAt('going') ? <ErrorState title={errorAt('going')!} /> : null}
      </View>
    );
  }

  const checkInLine = atCheckIn ? (
    picking === 'checkin' ? (
      <BringPicker
        title="What did you turn up in?"
        builds={mine}
        picked={picked}
        fits={goesWith}
        lockUnfit
        onPick={setPicked}
        confirmLabel="Check in with this one"
        onConfirm={() => {
          setCheckInPick(picked);
          setPicking(null);
        }}
        onCancel={() => setPicking(null)}
      />
    ) : (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
        <DsText v="secondary" numberOfLines={2} style={{ flex: 1 }}>
          With the {buildLine(atCheckIn)}
        </DsText>
        {mine.length > 1 ? (
          <Button
            tier="tertiary"
            size="sm"
            label="Something else?"
            accessibilityLabel="Turned up in something else? Change the vehicle"
            onPress={() => {
              setErrorState(null);
              setPicked(atCheckIn.id);
              setPicking('checkin');
            }}
          />
        ) : null}
      </View>
    )
  ) : null;

  const checkedInTitle = currentStop ? `Checked in at ${currentStop.name}` : 'Checked in';
  const checkedInBody =
    ev.type === 'rolling' && nextStop
      ? 'When the hosts move on, the next meet point shows here and you get a notice.'
      : phase === 'live'
        ? 'Vote for trophies from the builds that turned up.'
        : 'Voting for trophies opens when it starts.';

  let primaryBlock: ReactNode = null;
  switch (primary.kind) {
    case 'join':
      primaryBlock = picking === 'change' ? changePicker : joinBlock(primary.request);
      break;
    case 'requested':
      primaryBlock = (
        <View style={{ gap: SPACING.md }}>
          <Callout tone="warning" title={`${GOING.requestSent}. A host will say yes or no.`}>
            {`If they say yes, you'll see the ${MEET_POINT.one} with everyone else going.${role === 'invited' && mine.length > 1 ? ' Bring a build the invite covers and you can go straight in.' : ''}`}
          </Callout>
          {changePicker ?? bringingRow}
          <Button
            label={GOING.cancelRequest}
            tier="secondary"
            block
            onPress={() => attempt('request', () => store.setGoing(ev.id, false), "Couldn't change that.")}
          />
          {errorAt('request') ? <ErrorState title={errorAt('request')!} /> : null}
        </View>
      );
      break;
    case 'declined':
      primaryBlock = <Callout tone="neutral">A host said no to this one. Keep an eye out for the next.</Callout>;
      break;
    case 'waiting':
      // Locked: a plain state line and a secondary Remind me, never a greyed-out primary (REVIEW-7 problem 5).
      primaryBlock = (
        <View style={{ gap: SPACING.md }}>
          <View style={{ gap: SPACING.xxs }} accessibilityRole="text">
            <DsText v="bodyStrong">{primary.line}</DsText>
            <DsText v="secondary">{primary.detail}</DsText>
          </View>
          {new Date(primary.at) > now ? (
            reminded ? (
              <DsText v="caption" accessibilityLiveRegion="polite">
                Reminder on for {formatTime(primary.at)}.
              </DsText>
            ) : (
              <Button label="Remind me" tier="secondary" block onPress={() => remindMe(primary.at)} />
            )
          ) : null}
          {changePicker ?? bringingRow}
        </View>
      );
      break;
    case 'navigate':
      primaryBlock = (
        <View style={{ gap: SPACING.md }}>
          {navTo ? <NavLaunch target={{ kind: 'event', id: ev.id }} to={navTo.at} toName={navTo.name} otherAppsNote={navToNote} kind="primary" /> : null}
          <DsText v="caption">{primary.hint}</DsText>
          {changePicker ?? bringingRow}
        </View>
      );
      break;
    case 'checkin':
      primaryBlock = (
        <View style={{ gap: SPACING.md }}>
          <Button
            label={`Check in at ${currentStop?.name ?? `the ${MEET_POINT.one}`}`}
            size="lg"
            block
            busy={busy}
            onPress={doCheckIn}
            accessibilityHint={skipGps ? undefined : `Checks you are within half a mile of the ${MEET_POINT.one}`}
          />
          <DsText v="caption">{`Checking in earns ${REP.attended} rep and lets you vote for the best builds.${skipGps ? ' Demo: location check skipped.' : ''}`}</DsText>
          {errorAt('checkin') ? <ErrorState title={errorAt('checkin')!} /> : null}
          {checkInLine}
          {navTo ? <NavLaunch target={{ kind: 'event', id: ev.id }} to={navTo.at} toName={navTo.name} otherAppsNote={navToNote} kind="secondary" /> : null}
        </View>
      );
      break;
    case 'checkedIn':
      primaryBlock = <CheckInCelebration play={justCheckedIn} title={checkedInTitle} body={checkedInBody} />;
      break;
    case 'vote':
      primaryBlock = (
        <View style={{ gap: SPACING.md }}>
          {!closed && myCheckIns.includes(currentStop?.id ?? '') ? <CheckInCelebration play={justCheckedIn} title={checkedInTitle} body={checkedInBody} /> : null}
          <Button label="Vote for trophies" size="lg" block onPress={openVotes} />
        </View>
      );
      break;
    default:
      primaryBlock = phase === 'cancelled' ? <Callout tone="danger" title="This event was cancelled.">Everyone going was told, and their reminders stopped.</Callout> : null;
  }

  // ---------------------------------------------------------------------------
  // Menu: everything that isn't the primary.
  // ---------------------------------------------------------------------------
  type MenuOption = { label: string; detail?: string; destructive?: boolean; onPress: () => void };
  const menuOptions: MenuOption[] = ([
    { label: 'Share', onPress: doShare },
    canEdit ? { label: 'Edit event', onPress: () => (setMenu(false), router.push({ pathname: '/event/edit', params: { id: ev.id } })) } : null,
    going && !host && !closed ? { label: GOING.leave, detail: 'Takes you off the going list and cancels your reminders', destructive: true, onPress: () => (setMenu(false), setConfirmLeave(true)) } : null,
    host && !closed ? { label: 'Cancel event', destructive: true, onPress: () => (setMenu(false), setConfirmCancel(true)) } : null,
    !host ? { label: 'Report this event', onPress: () => (setMenu(false), openReport('event', ev.id, undefined, 'event')) } : null,
  ] as (MenuOption | null)[]).filter((x): x is MenuOption => !!x);

  const awards = (
    <View onLayout={(l) => (votesAt.current = l.nativeEvent.layout.y)}>
      <AwardsSection event={ev} expanded={voteOpen} onExpand={() => setVoteOpen(true)} />
    </View>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: COLOR.surface.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <Stack.Screen options={screenHeader({ onMenu: () => setMenu(true) })} />
      <ScrollView ref={scroll as never} contentContainerStyle={PAGE} keyboardShouldPersistTaps="handled">
        <DetailHero
          kind={EVENT_LABELS[ev.type]}
          colour={colour}
          glyph={ev.type}
          sample={isSeedEvent(ev.id)}
          status={status}
          title={ev.title}
          lines={[`${when.relative} · ${when.absolute}`, `${where}${ev.routeMiles ? ` · ${ev.routeMiles} mi` : ''}`]}
        >
          <Press
            onPress={crew ? () => router.push({ pathname: '/crew/[id]', params: { id: crew.id } }) : hostIds[0] && hostIds[0] !== me ? () => openUser(hostIds[0]) : undefined}
            label={`Hosted by ${hostLine}`}
            role={crew || (hostIds[0] && hostIds[0] !== me) ? 'link' : 'text'}
            style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, minHeight: 44 }}
          >
            <View style={{ flexDirection: 'row' }}>
              {hostIds.slice(0, 3).map((h, i) => {
                const u = users.find((x) => x.id === h);
                return (
                  <View key={h} style={{ marginLeft: i ? -SPACING.sm : 0 }}>
                    <Avatar name={u?.name} handle={u?.handle} size="sm" />
                  </View>
                );
              })}
            </View>
            <DsText v="secondary" numberOfLines={2} style={{ flex: 1 }}>
              Hosted by {hostLine}
            </DsText>
          </Press>
          {ev.description ? <DsText v="secondary">{ev.description}</DsText> : null}
        </DetailHero>

        {stats.length ? <StatBlock stats={stats} /> : null}

        {primaryBlock ? <View style={{ gap: SPACING.md }}>{primaryBlock}</View> : null}
        {/* Leaving is one tap away, not only in the ··· menu (REVIEW-8). */}
        {going && !host && !closed && (primary.kind === 'navigate' || primary.kind === 'checkin' || primary.kind === 'waiting') ? (
          <Button label={GOING.leave} tier="tertiary" size="sm" style={{ alignSelf: 'center' }} onPress={() => setConfirmLeave(true)} />
        ) : null}
        {errorAt('menu') ? <ErrorState title={errorAt('menu')!} /> : null}

        {closed ? awards : null}

        {host && !closed ? (
          <Section title="Hosting">
            {requests.length > 0 ? (
              <View style={{ gap: SPACING.sm }}>
                <DsText v="bodyStrong">
                  {plural(requests.length, 'request')} to go
                </DsText>
                <DsText v="secondary">They don't match the invite. Say yes and they see the {MEET_POINT.one} with everyone going.</DsText>
                {requests.map((uid, i) => {
                  const b = broughtBuild(ev, uid, builds);
                  const u = users.find((x) => x.id === uid);
                  return (
                    <View key={uid} style={{ gap: SPACING.xs }}>
                      {i > 0 ? <RowDivider /> : null}
                      <ListRow
                        leading={{ avatar: { name: u?.name, handle: u?.handle } }}
                        title={userLabel(uid)}
                        subtitle={b ? `${b.make} ${b.model} · Class\u00a0${classOf(b)} · ${plural(b.mods.length, 'mod')}` : 'No car or bike'}
                        meta={b && !fitsInvite(ev, b) ? "Doesn't match the invite" : undefined}
                        onPress={() => openUser(uid)}
                      />
                      <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
                        <Button
                          label="Say yes"
                          tier="secondary"
                          size="sm"
                          haptic="success"
                          style={{ flex: 1 }}
                          block
                          accessibilityLabel={`Say yes to ${userLabel(uid)}`}
                          onPress={() => attempt('answer', () => store.answerRequest(ev.id, uid, true), "Couldn't approve that.")}
                        />
                        <Button
                          label="Decline"
                          tier="destructive"
                          size="sm"
                          style={{ flex: 1 }}
                          block
                          accessibilityLabel={`Decline ${userLabel(uid)}`}
                          onPress={() => attempt('answer', () => store.answerRequest(ev.id, uid, false), "Couldn't decline that.")}
                        />
                      </View>
                    </View>
                  );
                })}
                {errorAt('answer') ? <ErrorState title={errorAt('answer')!} /> : null}
              </View>
            ) : null}
            {ev.type === 'rolling' && phase === 'live' ? (
              nextStop?.at ? (
                <View style={{ gap: SPACING.xs }}>
                  <Button label={`Move on to ${nextStop.name}`} tier="secondary" block haptic="warning" onPress={() => attempt('moveon', () => store.moveOn(ev.id), "Couldn't move on.")} />
                  {errorAt('moveon') ? <ErrorState title={errorAt('moveon')!} /> : null}
                  <DsText v="caption">{`Everyone going sees the next ${MEET_POINT.one}. ${audience === 1 ? 'The 1 person checked in here also gets a notice.' : `The ${audience} people checked in here also get a notice.`}`}</DsText>
                </View>
              ) : (
                <DsText v="secondary">This is the last planned {MEET_POINT.one}.</DsText>
              )
            ) : null}
            <View>
              {canPlan ? <ListRow leading={{ icon: 'plus' }} title="Change the plan" subtitle="Rename, move, add or remove meet points" onPress={() => router.push({ pathname: '/event/plan', params: { id: ev.id } })} /> : null}
              {canEdit ? <ListRow leading={{ icon: 'edit' }} title="Edit event" subtitle="Name, time, meet points and the invite" onPress={() => router.push({ pathname: '/event/edit', params: { id: ev.id } })} /> : null}
            </View>
            <DsText v="secondary">Invite: {describeFilter(ev.filter)}</DsText>
            {canPreview ? (
              <View style={{ gap: SPACING.xs }}>
                <SwitchRow label="See as a guest" hint="The map as invited people see it before the location shows" value={asGuest} onValueChange={setAsGuest} />
                {guestView ? (
                  <DsText v="caption" accessibilityLiveRegion="polite">
                    Invited people see a circle about {Math.round(areaMiles * 2)} mi across, never centred on your {MEET_POINT.one}. {LOCATION.toGoing},{' '}
                    {LOCATION.lead(ev.revealMinutesBefore).replace(/^Location shows /, '')}
                    {ev.type === 'rolling' ? ', and each later one when you move on' : ''}.
                  </DsText>
                ) : null}
              </View>
            ) : null}
            {(ev.changes?.length ?? 0) > 0 ? (
              <View style={{ gap: SPACING.sm }}>
                <DsText v="label">Plan changes (hosts only)</DsText>
                {[...(ev.changes ?? [])].reverse().map((c) => (
                  <View key={c.id} style={{ gap: SPACING.xxs }}>
                    <DsText v="meta">
                      {userLabel(c.by)} · {formatTime(c.at)}
                    </DsText>
                    <DsText v="body">{c.text}</DsText>
                    {c.banZone ? (
                      <DsText v="caption" tone="warning">
                        In the {c.banZone} meet ban
                      </DsText>
                    ) : null}
                  </View>
                ))}
              </View>
            ) : null}
          </Section>
        ) : null}

        <Section title={`Going (${ev.going.length})`}>
          {mixLine(ev, builds) ? <DsText v="secondary">{mixLine(ev, builds)}</DsText> : null}
          {ev.going.length > 0 ? (
            <Press onPress={() => router.push('/help')} role="link" label="What class and Legend mean, in How Nightshift works" style={{ minHeight: 32, justifyContent: 'center' }}>
              <DsText v="caption">Class S to D is a build's power to weight. Legend is this week's best in show. More in How Nightshift works ›</DsText>
            </Press>
          ) : null}
          {ev.going.length === 0 ? (
            <EmptyState variant="inline" title="Nobody yet. Share it to get people along." action={{ label: 'Share', onPress: doShare }} />
          ) : (
            <View>
              {ev.going.map((uid, i) => {
                const u = users.find((x) => x.id === uid);
                const b = broughtBuild(ev, uid, builds);
                const checked = (ev.checkIns[uid] ?? []).length;
                return (
                  <View key={uid}>
                    {i > 0 ? <RowDivider inset /> : null}
                    <ListRow
                      leading={{ avatar: { name: u?.name, handle: u?.handle } }}
                      title={userLabel(uid)}
                      subtitle={b ? `${b.make} ${b.model} · Class\u00a0${classOf(b)}` : 'No car or bike yet'}
                      meta={[hostIds.includes(uid) ? 'Hosting' : null, hasLegend(awardsSoFar, uid, now) ? 'Legend this week' : null, checked > 0 ? `Checked in${ev.stops.length > 1 ? ` ×${checked}` : ''}` : null].filter(Boolean).join(' · ') || undefined}
                      trailing={b ? <BuildThumb photo={b.photos[0] ? photoSource(b.photos[0]) : null} kind={b.kind} shape={carShape(b)} size={30} /> : undefined}
                      onPress={() => openUser(uid)}
                    />
                  </View>
                );
              })}
            </View>
          )}
        </Section>

        <Section title={ev.type === 'cruise' ? 'Route' : ev.type === 'rolling' ? 'Meet points' : 'Meet point'}>
          <MediaFrame height={200}>
            <NightMap
              pins={anyVisible ? mapPins : [{ id: 'area', at: ev.area, glyph: 'locked', colour, title: ev.areaName }]}
              paths={mapPaths}
              circles={anyVisible ? [] : [{ id: 'area', centre: ev.area, radiusMiles: areaRadius(ev), colour }]}
              centre={mapCentre}
              span={anyVisible ? (ev.type === 'cruise' ? 0.25 : 0.12) : Math.max(0.12, (areaMiles * 2.6) / 69)}
              follow
            />
            {unlock ? <UnlockReveal glyph={ev.type} colour={colour} title={unlock} onDone={() => setUnlock(null)} /> : null}
          </MediaFrame>
          {!anyVisible && !closed ? (
            <DsText v="secondary">
              {going || host
                ? unlockAt > now
                  ? `${LOCATION.showsAt(formatTime(unlockAt.toISOString()))} (in ${countdown(unlockAt, now)}). Until then you see the area, ${ev.areaName}.`
                  : `You see the area, ${ev.areaName}.`
                : phase === 'live' || unlockAt <= now
                  ? `${LOCATION.toGoing}. Say you're going to see it.`
                  : `${LOCATION.toGoing}, ${LOCATION.lead(ev.revealMinutesBefore).replace(/^Location shows /, '')}. Until then everyone sees the area.`}
            </DsText>
          ) : null}
          <View>
            {visibleStops.map(({ st, i, visible }) => {
              const done = myCheckIns.includes(st.id);
              const isCurrent = ev.type === 'rolling' && i === ev.currentStop;
              // A hidden point says why in plain words, and never in the past tense while it's still hidden.
              const revealsLater = revealTime(ev) > now;
              const title = visible
                ? st.name
                : !st.at
                  ? 'Not placed yet'
                  : ev.type === 'rolling' && i > ev.currentStop
                    ? 'Shows when the hosts move on'
                    : ev.type === 'rolling' && i < ev.currentStop
                      ? 'Already left'
                      : (going || host) && revealsLater
                        ? LOCATION.showsAt(formatTime(revealTime(ev).toISOString()))
                        : going || host
                          ? 'Location hidden'
                          : LOCATION.toGoing;
              return (
                <View key={st.id}>
                  {i > 0 ? <RowDivider inset /> : null}
                  <ListRow
                    leading={{ pin: visible ? ev.type : 'locked', colour: isCurrent ? colour : visible ? COLOR.text.primary : COLOR.text.secondary }}
                    title={title}
                    meta={
                      [
                        isCurrent ? 'Here now' : null,
                        st.revealedAt && host ? `Moved on ${formatRelative(st.revealedAt, now)}` : null,
                        host && st.note ? st.note : null,
                      ]
                        .filter(Boolean)
                        .join(' · ') || undefined
                    }
                    trailing={done ? <Tag label="Checked in" tone="success" /> : undefined}
                  />
                </View>
              );
            })}
          </View>
          {!host ? <DsText v="caption">Invite: {describeFilter(ev.filter)}</DsText> : null}
        </Section>

        <Section title="Chat">
          {closed && (host || going) ? (
            <View style={{ gap: SPACING.md }}>
              <ChatLines lines={chatPage.items} earlier={chatPage.earlier} onEarlier={() => setChatShown((n) => n + LIST_PAGE)} me={me} label={userLabel} />
              <DsText v="caption">{phase === 'cancelled' ? 'Chat closed when the event was cancelled.' : 'Chat closed when the event finished.'}</DsText>
            </View>
          ) : !host && !going ? (
            <DsText v="secondary">Chat is for the hosts and people going. It can carry details of where to park, so it opens once you're in.</DsText>
          ) : (
            <View style={{ gap: SPACING.md }}>
              <ChatLines lines={chatPage.items} earlier={chatPage.earlier} onEarlier={() => setChatShown((n) => n + LIST_PAGE)} me={me} label={userLabel} />
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
                    if (text) attempt('chat', () => store.sendChat(ev.id, text), "Couldn't send that.");
                    setMessage('');
                  }}
                />
                <Button
                  label="Send"
                  tier="secondary"
                  size="md"
                  haptic="success"
                  disabled={!message.trim()}
                  onPress={() => {
                    const text = message.trim();
                    if (text) attempt('chat', () => store.sendChat(ev.id, text), "Couldn't send that.");
                    setMessage('');
                  }}
                />
              </View>
              {errorAt('chat') ? <ErrorState title={errorAt('chat')!} /> : null}
              <DsText v="caption">{store.backend === 'supabase' ? 'Everyone going and the hosts see the chat, live.' : 'Demo: chat stays on this phone.'}</DsText>
            </View>
          )}
        </Section>

        {!closed ? awards : null}
      </ScrollView>

      <Sheet visible={menu} title="Event options" onClose={() => setMenu(false)}>
        <View>
          {menuOptions.map((o) => (
            <SheetOption key={o.label} label={o.label} detail={o.detail} destructive={o.destructive} onPress={o.onPress} />
          ))}
        </View>
      </Sheet>
      <ConfirmSheet
        visible={confirmCancel}
        title="Cancel event"
        message={`Cancel ${ev.title}? Everyone going will see it as cancelled and their reminders stop.${errorAt('cancel') ? `\n\n${errorAt('cancel')}` : ''}`}
        verb="Cancel"
        onCancel={() => setConfirmCancel(false)}
        onConfirm={() => {
          attempt('cancel', () => store.cancelEvent(ev.id), "Couldn't cancel it.").then((ok) => {
            if (!ok) return;
            setConfirmCancel(false);
            router.back();
          });
        }}
      />
      <ConfirmSheet
        visible={confirmLeave}
        title={GOING.leave}
        message={`Take yourself off ${ev.title}? Your reminders for it stop. You can say you're going again while it's open.`}
        verb="Leave"
        onCancel={() => setConfirmLeave(false)}
        onConfirm={() => {
          setConfirmLeave(false);
          attempt('menu', () => store.setGoing(ev.id, false), "Couldn't change that.");
        }}
      />
    </KeyboardAvoidingView>
  );
}

type Line = { id: string; userId: string; text: string; at: string; system?: boolean };

/** Chat lines: a system line is a quiet caption; a person is their handle (as typed) and the time, then the text. */
function ChatLines({ lines, earlier, onEarlier, me, label }: { lines: readonly Line[]; earlier: number; onEarlier: () => void; me: string; label: (uid: string) => string }) {
  if (lines.length === 0) return <EmptyState variant="inline" title="No messages yet." />;
  return (
    <View style={{ gap: SPACING.md }}>
      {earlier > 0 ? <Button tier="tertiary" size="sm" label={`Show ${earlier} earlier ›`} onPress={onEarlier} /> : null}
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
            <DsText v="meta" style={m.userId === me ? undefined : { color: COLOR.text.primary }}>
              {label(m.userId)} · {formatTime(m.at)}
            </DsText>
            <DsText v="body">{m.text}</DsText>
          </Press>
        ),
      )}
    </View>
  );
}
