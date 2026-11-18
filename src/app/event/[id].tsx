import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Share, TextInput, View } from 'react-native';
import { openReport, ReportLink } from '../../components/Community';
import { useCommunity } from '../../lib/communityStore';
import { AwardsSection } from '../../components/AwardsSection';
import { BringPicker } from '../../components/BringPicker';
import { CheckInMark, UnlockReveal } from '../../components/motion';
import { allAwards, hasLegend } from '../../lib/awards';
import { NightMap } from '../../components/NightMap';
import type { MapPath, MapPin } from '../../components/mapTypes';
import { Pin } from '../../components/Pin';
import { NavLaunch } from '../../components/NavLaunch';
import { UserLink } from '../../components/UserLink';
import { Button, Card, ClassBadge, ConfirmBox, InlineError, LegendTag, LinkText, NotFound, Row, SampleTag, Section, Stat, Tag, ToggleRow, Txt, s as ui } from '../../components/ui';
import { areaRadius } from '../../lib/area';
import { broughtBuild, buildLine, canGoWith, checkInBuild, chosenBuild, classMixText, defaultBuild, fitsInvite, ownBuilds } from '../../lib/bringing';
import { classOf } from '../../lib/classes';
import { canChangePlan, canChangeVehicle, canCheckIn, canEditEvent, checkInOpensAt, checkInWindowOpen, canSeeStop, EVENT_LABELS, hasRequested, isHost, isPublicType, moveOnAudience, phaseOf, revealTime, shareText } from '../../lib/events';
import { newlyUnlocked, roleOf, viewEvent } from '../../lib/eventView';
import { planForEvent } from '../../lib/navPlan';
import { isSeedEvent } from '../../lib/demoTime';
import { countdown, eventClock, unlocksIn } from '../../lib/hud';
import { feel } from '../../lib/feel';
import { formatRelative, formatTime, formatWhen } from '../../lib/format';
import { describeFilter } from '../../lib/invites';
import { askPermission } from '../../lib/notify';
import { preciseFix } from '../../lib/location';
import { useStore } from '../../lib/store';
import { useNow } from '../../lib/clock';
import type { Build, LatLng } from '../../lib/types';
import { GOING, roleLabel, roleTone, WHERE } from '../../lib/glossary';
import { BRAND, C, EVENT_COLOURS, STATE } from '../../theme';

/** Where an error shows: under the control that caused it (REVIEW-5 M10). */
type ErrorAt = 'checkin' | 'going' | 'request' | 'moveon' | 'share' | 'answer' | 'chat' | 'cancel' | 'change';

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
  const [unlock, setUnlock] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  /** Hosts: show the map as invited people see it before the reveal. */
  const [asGuest, setAsGuest] = useState(false);
  /** Which vehicle picker is open: going (or asking), changing it, or at check-in. */
  const [picking, setPicking] = useState<null | 'go' | 'change' | 'checkin'>(null);
  const [picked, setPicked] = useState<string | undefined>();
  /** At check-in: the build they turned up in, if it isn't the one they said. */
  const [checkInPick, setCheckInPick] = useState<string | undefined>();

  // "Event unlocked": the first time this person can see a stop, play the reveal once.
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

  // Signed in: live chat, who's going, check-ins and the meet moving on, while this screen is open.
  const remote = store.remote;
  useEffect(() => {
    if (!remote || !id) return;
    return remote.watchEvent(id);
  }, [remote, id]);

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

  if (!e) return <NotFound what="Event" message="It may have been cancelled and removed, or the link is old." />;

  const ev = e;
  const colour = EVENT_COLOURS[ev.type];
  const host = isHost(ev, me, crews);
  const role = roleOf(ev, me, crews, users, builds);
  const going = ev.going.includes(me);
  const requested = hasRequested(ev, me);
  const declined = !!ev.declined?.includes(me);
  const requests = ev.requests ?? [];
  const phase = phaseOf(ev, now);
  const crew = ev.crewId ? crews.find((c) => c.id === ev.crewId) : undefined;
  const hostNames = ev.hostIds.map((h) => (h === me ? 'You' : `@${users.find((u) => u.id === h)?.handle ?? h}`));
  const myCheckIns = ev.checkIns[me] ?? [];
  const current = ev.type === 'rolling' ? ev.currentStop : 0;
  const nextStop = ev.stops[ev.currentStop + 1];
  const audience = moveOnAudience(ev, ev.currentStop).length;

  // The vehicle you're bringing (see bringing.ts).
  const mine = ownBuilds(me, builds);
  const chosen = chosenBuild(ev, me, builds);
  const bringing = broughtBuild(ev, me, builds);
  const goesWith = (b?: Build) => canGoWith(ev, me, crews, users, builds, b);
  const pickedBuild = mine.find((b) => b.id === picked);
  const canChange = (going || requested) && mine.length > 0 && (mine.length > 1 || !chosen) && canChangeVehicle(ev, me, now).ok;
  // At check-in: what you've just picked, else what you said, else the same build "You're bringing" shows (bringing.ts).
  const atCheckIn = checkInBuild(ev, me, builds, checkInPick);

  // While the check-in button shows, its own line says what you're checking in with: no second "You're bringing" card.
  const checkInShown =
    !(phase === 'over' || phase === 'cancelled') && (going || host) && checkInWindowOpen(ev, now) && canSeeStop(ev, current, me, crews, now) &&
    !myCheckIns.includes(ev.stops[current]?.id) && !!atCheckIn;
  const canPreview = host && !isPublicType(ev.type) && phase !== 'over' && phase !== 'cancelled';
  const guestView = canPreview && asGuest;
  // Seeing as a guest: every stop shows locked, as for invited people before the reveal.
  const visibleStops = ev.stops.map((st, i) => ({ st, i, visible: !guestView && canSeeStop(ev, i, me, crews, now) }));
  const mapPins: MapPin[] = visibleStops
    .filter((x) => x.visible && x.st.at)
    .map((x) => ({
      id: x.st.id, at: x.st.at!, glyph: ev.type, colour: x.i === current ? colour : C.fog, title: x.st.name,
      size: x.i === current ? 40 : 30, live: x.i === current && phase === 'live',
    }));
  const mapPaths: MapPath[] =
    ev.type === 'cruise' && mapPins.length > 1 ? [{ id: 'route', coords: mapPins.map((p) => p.at), colour, dashed: true }] : [];
  const anyVisible = mapPins.length > 0;
  const closed = phase === 'over' || phase === 'cancelled';
  // Start navigation: through the stops you can see (a rolling meet: only the one it's at now).
  const navPlan = !closed && !guestView ? planForEvent(ev, me, crews, now) : null;

  // "Skip the GPS check" is the demo's only: signed in, the server checks the distance itself.
  const skipGps = settings.simulateGps && store.backend === 'local';

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
              ? `Check-in needs your location. Allow it for Nightshift in Settings${store.backend === 'local' ? ` (or, for testing, ${WHERE.demoSkipGps}: skip the GPS check)` : ''}.`
              : 'Could not read your location. Try again outside.',
          );
          return;
        }
        pos = fix.at;
      }
      const result = canCheckIn(ev, current, me, crews, new Date(), pos, skipGps);
      if (!result.ok) setError('checkin', result.reason);
      else {
        try {
          // Only send a build when it's news: a different one, or the first pick on record.
          await store.checkIn(ev.id, current, atCheckIn && atCheckIn.id !== chosen?.id ? atCheckIn.id : undefined, pos);
        } catch (err) {
          setError('checkin', err instanceof Error ? err.message : 'Could not check in.');
          return;
        }
        setCheckInPick(undefined);
        setJustCheckedIn(true);
        feel.success();
      }
    } catch {
      setError('checkin', 'Could not read your location. Try again outside.');
    } finally {
      setBusy(false);
    }
  }

  /** I'm going / Request to go: two or more builds open the picker, one is used as it is, none asks first. */
  function startGoing() {
    setErrorState(null);
    if (mine.length === 1) return commitGoing(mine[0].id);
    setPicked(defaultBuild(ev, me, builds, events)?.id);
    setPicking('go');
  }

  async function commitGoing(buildId?: string) {
    setErrorState(null);
    const wasGoing = going;
    try {
      const result = await store.setGoing(ev.id, true, buildId);
      setPicking(null);
      feel.tap();
      // First Going is the moment reminders make sense, so ask then (iOS only asks once).
      // Once they answer, schedule again: the first sync ran while the prompt was still up.
      if (result === 'going' && !wasGoing && settings.reminders) askPermission().then((ok) => ok && store.refreshReminders()).catch(() => {});
    } catch (err) {
      setError('going', err instanceof Error ? err.message : 'Could not change that.');
    }
  }

  async function doMoveOn() {
    setErrorState(null);
    try {
      await store.moveOn(ev.id);
      feel.warning();
    } catch (err) {
      setError('moveon', err instanceof Error ? err.message : 'Could not move on.');
    }
  }

  async function doShare() {
    setErrorState(null);
    try {
      await Share.share({ message: shareText(ev, formatWhen(ev.startsAt, new Date())), title: ev.title });
    } catch {
      setError('share', 'Could not open the share sheet.');
    }
  }

  const canEdit = host && canEditEvent(ev, now).ok;
  const canPlan = host && canChangePlan(ev, now).ok && phase !== 'upcoming';
  const userLabel = (uid: string) => (uid === me ? 'You' : `@${users.find((u) => u.id === uid)?.handle ?? uid}`);

  const view = viewEvent(ev, me, crews, users, builds, now);
  const clock = eventClock(view, now);
  const unlockIn = unlocksIn(view, now);
  const checkedIn = Object.values(ev.checkIns).filter((x) => x.length > 0).length;
  const roleText = roleLabel(role);
  const awards = <AwardsSection event={ev} />;

  const mapCentre = anyVisible ? (mapPins.find((p) => p.id === ev.stops[current]?.id)?.at ?? mapPins[0]?.at ?? ev.area) : ev.area;
  const areaMiles = areaRadius(ev);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 18, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <View style={{ gap: 6 }}>
          <Row gap={6}>
            <Txt v="eyebrow" style={{ color: colour }}>{EVENT_LABELS[ev.type]}</Txt>
            {phase === 'live' ? <Tag label="● Live now" tone="live" /> : null}
            {phase === 'cancelled' ? <Tag label="Cancelled" tone="danger" /> : null}
            {phase === 'over' ? <Tag label="Finished" tone="muted" /> : null}
            {isSeedEvent(ev.id) ? <SampleTag /> : null}
            {roleText && !closed ? (
              <View style={{ marginLeft: 'auto' }}>
                <Tag label={roleText} tone={roleTone(role)} />
              </View>
            ) : null}
          </Row>
          <Txt v="h1">{ev.title}</Txt>
          <Txt v="mono" scale="chrome" style={{ color: C.chalk }}>
            {formatWhen(ev.startsAt, now)}
            {ev.endsAt ? ` – ${formatTime(ev.endsAt)}` : ''} · {ev.areaName}
            {ev.routeMiles ? ` · ${ev.routeMiles} mi` : ''}
          </Txt>
          {ev.description ? <Txt v="muted">{ev.description}</Txt> : null}
        </View>

        {!closed ? (
          <Row gap={8} style={{ flexWrap: 'nowrap' }}>
            <Stat label={clock.label} value={clock.value} colour={clock.live ? STATE.live : C.chalk} />
            {unlockIn ? (
              <Stat label="Stop unlocks in" value={unlockIn} colour={colour} />
            ) : ev.type === 'rolling' && phase === 'live' ? (
              <Stat label="Stop" value={`${ev.currentStop + 1} of ${ev.stops.length}`} colour={colour} />
            ) : null}
            <Stat label={phase === 'live' ? 'Checked in' : 'Going'} value={phase === 'live' ? `${checkedIn}/${ev.going.length}` : `${ev.going.length}`} />
          </Row>
        ) : null}

        <View style={{ height: 220, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: C.kerb }}>
          <NightMap
            pins={anyVisible ? mapPins : [{ id: 'area', at: ev.area, glyph: 'locked', colour, title: ev.areaName }]}
            paths={mapPaths}
            circles={anyVisible ? [] : [{ id: 'area', centre: ev.area, radiusMiles: areaRadius(ev), colour }]}
            centre={mapCentre}
            span={anyVisible ? (ev.type === 'cruise' ? 0.25 : 0.12) : Math.max(0.12, (areaMiles * 2.6) / 69)}
            follow
          />
          {unlock ? <UnlockReveal glyph={ev.type} colour={colour} title={unlock} onDone={() => setUnlock(null)} /> : null}
        </View>

        {closed ? awards : null}

        {canPreview ? (
          <View style={{ gap: 4 }}>
            <ToggleRow label="See as a guest" value={asGuest} onValueChange={setAsGuest} />
            {guestView ? (
              <Txt v="caption" accessibilityLiveRegion="polite">
                Invited people see this locked circle, about {Math.round(areaMiles * 2)} mi across and never centred on your stop.
                For people going, the stop unlocks {ev.revealMinutesBefore > 0 ? `${ev.revealMinutesBefore} min before the start` : 'at the start'}
                {ev.type === 'rolling' ? ', and later stops only when you move on' : ''}.
              </Txt>
            ) : null}
          </View>
        ) : null}

        {!closed ? (
          <View style={{ gap: 10 }}>
            {(going || host) && !checkInWindowOpen(ev, now) ? (
              <Card>
                <Txt v="muted">Check-in opens in {countdown(checkInOpensAt(ev), now)}, 30 minutes before the start.</Txt>
              </Card>
            ) : null}
            {(going || host) && checkInWindowOpen(ev, now) && canSeeStop(ev, current, me, crews, now) ? (
              myCheckIns.includes(ev.stops[current]?.id) ? (
                <Card accent={STATE.success}>
                  <Row style={{ flexWrap: 'nowrap' }} gap={12}>
                    <CheckInMark play={justCheckedIn} />
                    <Txt style={{ flex: 1 }} accessibilityLiveRegion="polite">
                      Checked in at {ev.stops[current].name}.{ev.type === 'rolling' ? " The next stop unlocks for you when the hosts move on." : ''}
                    </Txt>
                  </Row>
                </Card>
              ) : (
                <View style={{ gap: 6 }}>
                  {picking === 'checkin' ? (
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
                  ) : null}
                  <Button label={busy ? 'Checking…' : `Check in at ${ev.stops[current]?.name ?? 'the stop'}`} onPress={doCheckIn} busy={busy} />
                  <InlineError message={errorAt('checkin')} />
                  {atCheckIn && picking !== 'checkin' ? (
                    <Row style={{ flexWrap: 'nowrap' }} gap={8}>
                      <ClassBadge letter={classOf(atCheckIn)} size="sm" />
                      <Txt v="muted" style={{ flex: 1 }} numberOfLines={2}>Checking in with the {buildLine(atCheckIn)}</Txt>
                      {mine.length > 1 ? (
                        <LinkText
                          label="Something else? ›"
                          accessibilityLabel="Turned up in something else? Change the vehicle"
                          onPress={() => {
                            setErrorState(null);
                            setPicked(atCheckIn.id);
                            setPicking('checkin');
                          }}
                        />
                      ) : null}
                    </Row>
                  ) : null}
                </View>
              )
            ) : null}
            {(going || requested) && (bringing || mine.length === 0) && picking !== 'change' && !checkInShown ? (
              <Card>
                <Row style={{ flexWrap: 'nowrap' }} gap={10}>
                  {bringing ? <ClassBadge letter={classOf(bringing)} size="sm" /> : <View style={{ width: 22 }} />}
                  <View style={{ flex: 1 }}>
                    <Txt v="label">{going ? "You're bringing" : 'You requested with'}</Txt>
                    <Txt numberOfLines={2}>{bringing ? buildLine(bringing) : 'No vehicle (passenger)'}</Txt>
                  </View>
                  {canChange ? (
                    <Button
                      label="Change"
                      kind="secondary"
                      size="sm"
                      accessibilityLabel="Change vehicle"
                      onPress={() => {
                        setErrorState(null);
                        setPicked(bringing?.id ?? defaultBuild(ev, me, builds, events)?.id);
                        setPicking('change');
                      }}
                    />
                  ) : null}
                </Row>
                {mine.length === 0 && going ? (
                  <Button label="+ Add a car or bike" kind="secondary" onPress={() => router.push('/build/edit')} />
                ) : null}
                <InlineError message={errorAt('change')} />
              </Card>
            ) : null}
            {(picking === 'go' || picking === 'change') && mine.length > 0 ? (
              <BringPicker
                title={picking === 'change' ? 'Change vehicle' : 'What are you bringing?'}
                builds={mine}
                picked={picked}
                fits={(b) => fitsInvite(ev, b)}
                onPick={setPicked}
                confirmLabel={
                  goesWith(pickedBuild) ? (picking === 'change' ? 'Bring this one' : GOING.join) : going ? 'Change and request again' : GOING.request
                }
                note={
                  !pickedBuild || goesWith(pickedBuild)
                    ? null
                    : going
                      ? `The ${pickedBuild.make} ${pickedBuild.model} doesn't match the invite, so you'd go back to asking a host.`
                      : fitsInvite(ev, pickedBuild)
                        ? `Your home area is outside this invite (${ev.filter.radiusMiles} mi), so a host has to say yes.`
                        : `The ${pickedBuild.make} ${pickedBuild.model} doesn't match the invite, so a host has to say yes.`
                }
                onConfirm={() => commitGoing(picked)}
                onCancel={() => setPicking(null)}
              />
            ) : null}
            {(picking === 'go' || picking === 'change') && mine.length > 0 ? <InlineError message={errorAt('going')} /> : null}
            {picking === 'go' && mine.length === 0 ? (
              <Card accent={BRAND}>
                <Txt v="eyebrow">What are you bringing?</Txt>
                <Txt v="muted">Your garage is empty. Add your car or bike so the hosts know what's coming, or go along as a passenger.</Txt>
                <Button label="+ Add a car or bike" onPress={() => router.push('/build/edit')} />
                <Row style={{ flexWrap: 'nowrap' }}>
                  <Button label={role === 'invited' || role === 'public' ? 'Go without one' : 'Request without one'} kind="secondary" style={{ flex: 1 }} onPress={() => commitGoing()} />
                  <Button label="Not now" kind="secondary" onPress={() => setPicking(null)} />
                </Row>
                <InlineError message={errorAt('going')} />
              </Card>
            ) : null}
            {!host && picking !== 'go' ? (
              going ? null : requested ? (
                <Card accent={STATE.warning}>
                  <Txt>{GOING.requestSent}. A host will say yes or no.</Txt>
                  <Txt v="muted">
                    If they say yes, the stop unlocks for you with everyone else going.
                    {role === 'invited' && mine.length > 1 ? ' Bring a build the invite covers and you can go straight in.' : ''}
                  </Txt>
                  <Button label={GOING.cancelRequest} kind="secondary" onPress={() => attempt('request', () => store.setGoing(ev.id, false), 'Could not change that.')} />
                  <InlineError message={errorAt('request')} />
                </Card>
              ) : role === 'invited' || role === 'public' ? (
                <View style={{ gap: 6 }}>
                  <Button label={GOING.join} kind={checkInShown ? 'secondary' : 'primary'} onPress={startGoing} />
                  {picking === null ? <InlineError message={errorAt('going')} /> : null}
                </View>
              ) : declined ? (
                <Card>
                  <Txt v="muted">A host said no to this one. Keep an eye out for the next.</Txt>
                </Card>
              ) : (
                <View style={{ gap: 6 }}>
                  <Button label={GOING.request} onPress={startGoing} />
                  {picking === null ? <InlineError message={errorAt('going')} /> : null}
                  <Txt v="caption">
                    Your builds or home area don't match this invite ({describeFilter(ev.filter)}). A host can still say yes.
                  </Txt>
                </View>
              )
            ) : null}
            {host && ev.type === 'rolling' && phase === 'live' ? (
              nextStop?.at ? (
                <View style={{ gap: 4 }}>
                  <Button label={`Move on to ${nextStop.name}`} kind={checkInShown ? 'secondary' : 'primary'} onPress={doMoveOn} />
                  <InlineError message={errorAt('moveon')} />
                  <Txt v="caption">The next stop unlocks only for the {audience} people checked in here.</Txt>
                </View>
              ) : (
                <Card>
                  <Txt v="muted">This is the last planned stop.</Txt>
                </Card>
              )
            ) : null}
            {canPlan ? (
              <Button label="Change the plan" kind="secondary" onPress={() => router.push({ pathname: '/event/plan', params: { id: ev.id } })} />
            ) : null}
            {navPlan ? <NavLaunch target={{ kind: 'event', id: ev.id }} to={navPlan.stops[0].at} /> : null}
            <Row style={{ flexWrap: 'nowrap' }}>
              {going && !host ? (
                <Button
                  label={GOING.leave}
                  kind="secondary"
                  style={{ flex: 1 }}
                  accessibilityHint="Takes you off the going list and cancels your reminders"
                  onPress={() => attempt('share', () => store.setGoing(ev.id, false), 'Could not change that.')}
                />
              ) : null}
              {canEdit ? (
                <Button label="Edit" kind="secondary" style={{ flex: 1 }} onPress={() => router.push({ pathname: '/event/edit', params: { id: ev.id } })} />
              ) : null}
              <Button label="Share" kind="secondary" style={{ flex: 1 }} onPress={doShare} />
            </Row>
            <InlineError message={errorAt('share')} />
          </View>
        ) : null}

        <Section title={ev.type === 'cruise' ? 'Route' : ev.type === 'rolling' ? 'Stops' : 'Stop'}>
          <Card>
            {visibleStops.map(({ st, i, visible }) => {
              const done = myCheckIns.includes(st.id);
              const isCurrent = ev.type === 'rolling' && i === ev.currentStop;
              const label = visible
                ? st.name
                : st.at
                  ? ev.type === 'rolling' && i > 0
                    ? 'Unlocks when the hosts move on'
                    : `Unlocks ${formatRelative(revealTime(ev).toISOString(), now)} for people going`
                  : 'Not placed yet';
              return (
                <Row key={st.id} style={{ flexWrap: 'nowrap', alignItems: 'flex-start' }} gap={10}>
                  <Pin glyph={visible ? ev.type : 'locked'} colour={isCurrent ? colour : visible ? C.chalk : C.fog} size={26} />
                  <View style={{ flex: 1 }}>
                    <Txt style={!visible ? { color: C.fog } : undefined}>{label}</Txt>
                    <Txt v="mono" scale="chrome">
                      {[
                        isCurrent ? 'Here now' : null,
                        done ? 'Checked in' : null,
                        st.revealedAt && host ? `Moved on ${formatRelative(st.revealedAt, now)}` : null,
                        host && st.note ? st.note : null,
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
              Hosted by {crew ? `${crew.name} (crew hosts) with ` : ''}
              {hostNames.join(', ')}
            </Txt>
            {crew ? (
              <View style={{ alignSelf: 'flex-start' }}>
                <LinkText label={`[${crew.tag}] ${crew.name} crew ›`} onPress={() => router.push({ pathname: '/crew/[id]', params: { id: crew.id } })} />
              </View>
            ) : null}
          </Card>
        </Section>

        {host && requests.length > 0 && !closed ? (
          <Section title={`Requests (${requests.length})`}>
            <Card accent={STATE.warning}>
              <Txt v="muted">They don't match the invite. Say yes and the stop unlocks for them with everyone going.</Txt>
              {requests.map((uid) => {
                const b = broughtBuild(ev, uid, builds);
                return (
                  <View key={uid} style={{ gap: 6 }}>
                    <UserLink id={uid} label={`Open ${userLabel(uid)}`}>
                      <Row style={{ flexWrap: 'nowrap' }} gap={10}>
                        {b ? <ClassBadge letter={classOf(b)} size="sm" /> : <View style={{ width: 22 }} />}
                        <View style={{ flex: 1 }}>
                          <Txt numberOfLines={1}>{userLabel(uid)}</Txt>
                          <Txt v="muted" numberOfLines={2}>
                            {b ? `${buildLine(b)} · ${b.mods.length} mods${fitsInvite(ev, b) ? '' : " · doesn't match"}` : 'No vehicle'}
                          </Txt>
                        </View>
                      </Row>
                    </UserLink>
                    <Row style={{ flexWrap: 'nowrap' }}>
                      <Button
                        label="Approve"
                        kind="secondary"
                        size="sm"
                        style={{ flex: 1 }}
                        accessibilityLabel={`Approve ${userLabel(uid)}`}
                        onPress={() => {
                          attempt('answer', () => store.answerRequest(ev.id, uid, true), 'Could not approve that.').then((ok) => ok && feel.success());
                        }}
                      />
                      <Button
                        label="Decline"
                        kind="danger"
                        size="sm"
                        style={{ flex: 1 }}
                        accessibilityLabel={`Decline ${userLabel(uid)}`}
                        onPress={() => attempt('answer', () => store.answerRequest(ev.id, uid, false), 'Could not decline that.')}
                      />
                    </Row>
                  </View>
                );
              })}
              <InlineError message={errorAt('answer')} />
            </Card>
          </Section>
        ) : null}

        <Section title={`Going (${ev.going.length})`} right={classMixText(ev, builds) ? <Txt v="mono" scale="chrome">{classMixText(ev, builds)}</Txt> : undefined}>
          <Card>
            {ev.going.length === 0 ? <Txt v="muted">Nobody yet. Share it to get people along.</Txt> : null}
            {ev.going.map((uid) => {
              const u = users.find((x) => x.id === uid);
              const b = broughtBuild(ev, uid, builds);
              const checked = (ev.checkIns[uid] ?? []).length;
              return (
                <UserLink key={uid} id={uid} label={`Open ${userLabel(uid)}`}>
                <Row style={{ flexWrap: 'nowrap' }} gap={10}>
                  {b ? <ClassBadge letter={classOf(b)} size="sm" /> : <View style={{ width: 22 }} />}
                  <View style={{ flex: 1 }}>
                    <Row gap={6} style={{ flexWrap: 'nowrap' }}>
                      <Txt numberOfLines={1} style={{ flexShrink: 1 }}>{uid === me ? 'You' : `@${u?.handle ?? uid}`}</Txt>
                      {hasLegend(awardsSoFar, uid, now) ? <LegendTag /> : null}
                    </Row>
                    <Txt v="muted" numberOfLines={1}>{b ? buildLine(b) : 'No vehicle'}</Txt>
                  </View>
                  {checked > 0 ? <Txt v="mono" scale="chrome" style={{ color: STATE.success }} accessibilityLabel={`Checked in at ${checked}`}>{checked} ✓</Txt> : null}
                </Row>
                </UserLink>
              );
            })}
          </Card>
        </Section>

        {!closed ? awards : null}

        {host && (ev.changes?.length ?? 0) > 0 ? (
          <Section title="Plan changes (hosts only)">
            <Card>
              {[...(ev.changes ?? [])].reverse().map((c) => (
                <View key={c.id} style={{ gap: 2 }}>
                  <Txt v="label">
                    <Txt v="label" style={{ textTransform: 'none' }}>{userLabel(c.by)}</Txt> · {formatTime(c.at)}
                  </Txt>
                  <Txt>{c.text}</Txt>
                  {c.banZone ? <Txt v="mono" style={{ color: STATE.warning }}>In the {c.banZone} ban zone</Txt> : null}
                </View>
              ))}
            </Card>
          </Section>
        ) : null}

        <Section title="Chat">
          {closed && (host || going) ? (
            <Card>
              {messages.length === 0 ? <Txt v="muted">No messages.</Txt> : null}
              {messages.map((m) => (
                <View key={m.id} style={{ gap: 2 }}>
                  <Txt v="label" style={{ color: m.system ? C.chalk : C.fog }}>
                    {m.system ? m.text : <Txt v="label" style={{ textTransform: 'none', color: C.fog }}>{userLabel(m.userId)}</Txt>} · {formatTime(m.at)}
                  </Txt>
                  {m.system ? null : <Txt>{m.text}</Txt>}
                </View>
              ))}
              <Txt v="caption">
                {phase === 'cancelled' ? 'Chat closed when the event was cancelled.' : 'Chat closed when the event finished.'}
              </Txt>
            </Card>
          ) : !host && !going ? (
            <Card>
              <Txt v="muted">Chat is for the hosts and people going. It can carry details of where to park, so it opens once you're in.</Txt>
            </Card>
          ) : (
          <Card>
            {messages.length === 0 ? <Txt v="muted">No messages yet.</Txt> : null}
            {messages.map((m) =>
              m.system ? (
                <View key={m.id} style={{ borderLeftWidth: 2, borderLeftColor: C.kerbHi, paddingLeft: 8 }}>
                  <Txt v="label" style={{ color: C.chalk }}>
                    {m.text} · {formatTime(m.at)}
                  </Txt>
                </View>
              ) : (
                <View key={m.id} style={{ gap: 2 }}>
                  <UserLink id={m.userId} style={{ alignSelf: 'flex-start' }}>
                    <Txt v="label" style={{ color: m.userId === me ? C.chalk : BRAND }}>
                      <Txt v="label" style={{ color: m.userId === me ? C.chalk : BRAND, textTransform: 'none' }}>{userLabel(m.userId)}</Txt>
                      {' · '}{formatTime(m.at)}
                    </Txt>
                  </UserLink>
                  <Pressable
                    onLongPress={m.userId === me ? undefined : () => openReport('chat', m.id, m.userId, 'chat message')}
                    accessibilityHint={m.userId === me ? undefined : 'Long press to report this message'}
                  >
                    <Txt>{m.text}</Txt>
                  </Pressable>
                </View>
              ),
            )}
            <Row style={{ flexWrap: 'nowrap' }}>
              <TextInput
                value={message}
                onChangeText={setMessage}
                placeholder="Message everyone going"
                placeholderTextColor={C.fog}
                style={[ui.input, { flex: 1 }]}
                returnKeyType="send"
                onSubmitEditing={() => {
                  const text = message.trim();
                  if (text) attempt('chat', () => store.sendChat(ev.id, text), 'Could not send that.');
                  setMessage('');
                }}
              />
              <Button
                label="Send"
                kind="secondary"
                size="sm"
                onPress={() => {
                  const text = message.trim();
                  if (text) attempt('chat', () => store.sendChat(ev.id, text), 'Could not send that.');
                  setMessage('');
                }}
              />
            </Row>
            <InlineError message={errorAt('chat')} />
            <Txt v="caption">
              {store.backend === 'supabase' ? 'Everyone going and the hosts see the chat, live.' : 'Demo: chat stays on this phone.'}
            </Txt>
          </Card>
          )}
        </Section>

        {host && !closed ? (
          confirmCancel ? (
            <ConfirmBox
              message={`Cancel ${ev.title}? Everyone going will see it as cancelled and their reminders stop.`}
              verb="Cancel"
              error={errorAt('cancel')}
              onCancel={() => setConfirmCancel(false)}
              onConfirm={() => {
                attempt('cancel', () => store.cancelEvent(ev.id), 'Could not cancel it.').then((ok) => {
                  if (!ok) return;
                  feel.warning();
                  router.back();
                });
              }}
            />
          ) : (
            <Button label="Cancel event" kind="danger" onPress={() => setConfirmCancel(true)} />
          )
        ) : null}
        {!host ? <ReportLink target="event" id={ev.id} what="event" /> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
