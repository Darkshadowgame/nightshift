import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import { useKeepAwake } from 'expo-keep-awake';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { chime, navDirectionsAvailable, route as fetchRoute, speak, stopSpeaking } from '../../modules/nav-directions';
import { DriveMap, type DriveMapStop } from '../components/DriveMap';
import { openDirections } from '../components/NavLaunch';
import { Button, Txt } from '../components/ui';
import { cameraIndex } from '../lib/cameraData';
import { CAMERA_CREDIT } from '../lib/cameras';
import { canCheckIn } from '../lib/events';
import { feel } from '../lib/feel';
import { currentPosition } from '../lib/location';
import {
  activeLimit,
  ARROWS,
  buildRoute,
  cameraAnnouncement,
  camerasAhead,
  camerasOnRoute,
  checkOffRoute,
  dueAnnouncement,
  etaClock,
  formatDistance,
  isOver,
  mphOf,
  ON_ROUTE,
  pointAlong,
  progressOn,
  reachedStop,
  routeBox,
  routePoints,
  secondsBetween,
  snapToRoute,
  spokenDistance,
  stopAlongs,
  zoneAverageMph,
  ZONE_END_ANNOUNCEMENT,
  zonesOnRoute,
  zoneStartAnnouncement,
  zoneStatus,
  type Fix,
  type Limit,
  type NavRoute,
  type NavStop,
  type OffRouteState,
  type Progress,
  type RouteCamera,
  type RouteZone,
  type ZoneRun,
} from '../lib/nav';
import { planForEvent, planForPlace, planForSpot, targetFromParams, type NavPlan } from '../lib/navPlan';
import { advanceRun, NEW_RUN, runExpired, driveMiles, type DriveRun } from '../lib/spots';
import { useStore } from '../lib/store';
import type { LatLng } from '../lib/types';
import { C, F } from '../theme';

/**
 * The driving view: turn-by-turn directions through an event's stops, a
 * drive's checkpoints or to one place. Full screen, dark, big text, voice,
 * and as little to touch as possible while moving.
 *
 * Safety (docs/SPEC.md, "Driving view"): foreground only, GPS stops when you
 * leave the screen or the app; your speed is shown live against a camera or
 * zone limit and never stored, scored or ranked; cameras are speed-limit
 * information only, and there's nothing about police.
 */
export default function DriveScreen() {
  const params = useLocalSearchParams();
  const store = useStore();
  const [plan] = useState<NavPlan | null>(() => {
    const t = targetFromParams(params as Record<string, string | string[] | undefined>);
    if (!t) return null;
    if (t.kind === 'place') return planForPlace(t.name, { lat: t.lat, lng: t.lng });
    if (t.kind === 'spot') {
      const spot = store.spots.find((s) => s.id === t.id);
      return spot ? planForSpot(spot) : null;
    }
    const ev = store.events.find((e) => e.id === t.id);
    return ev ? planForEvent(ev, store.me, store.crews, new Date()) : null;
  });
  const insets = useSafeAreaInsets();

  if (!plan) {
    return (
      <View style={[st.screen, st.centred, { paddingTop: insets.top + 24 }]}>
        <Txt v="h2">Nothing to navigate to</Txt>
        <Txt v="muted" style={{ textAlign: 'center' }}>The place isn't visible to you yet, or it's gone.</Txt>
        <Button label="Back" kind="ghost" onPress={() => router.back()} />
      </View>
    );
  }
  if (Platform.OS !== 'ios' || !navDirectionsAvailable) return <NeedsApp plan={plan} />;
  return <DriveSession plan={plan} />;
}

/** Web preview and builds without the native module: say so, and offer other apps. */
function NeedsApp({ plan }: { plan: NavPlan }) {
  const insets = useSafeAreaInsets();
  const to = plan.stops[0].at;
  return (
    <View style={[st.screen, { paddingTop: insets.top + 24, paddingHorizontal: 20, gap: 14 }]}>
      <Txt v="eyebrow" style={{ color: C.neon }}>Navigation</Txt>
      <Txt v="h1">Turn by turn needs the iPhone app</Txt>
      <Txt v="muted">
        {Platform.OS === 'web'
          ? 'The web preview has no directions or voice. Open Nightshift on the iPhone, or use another app for now.'
          : 'This install is older than the navigation update. Install the latest IPA, or use another app for now.'}
      </Txt>
      <Txt>{plan.title}</Txt>
      <Button label="Apple Maps" kind="neon" onPress={() => openDirections('apple', to)} />
      <Button label="Google Maps" kind="ghost" onPress={() => openDirections('google', to)} />
      <Button label="Waze" kind="ghost" onPress={() => openDirections('waze', to)} />
      <Button label="Back" kind="ghost" onPress={() => router.back()} />
    </View>
  );
}

interface Active {
  route: NavRoute;
  /** For each leg, which stop it ends at. */
  legStops: number[];
  /** Bumped on every new route, so announcements are said once per route. */
  gen: number;
  cameras: RouteCamera[];
  zones: RouteZone[];
  stopAlong: number[];
}

interface Hud {
  progress: Progress;
  ahead: RouteCamera[];
  zone: { zone: RouteZone; inside: boolean; average: number | null } | null;
  limit: Limit | null;
  over: boolean;
}

function DriveSession({ plan }: { plan: NavPlan }) {
  useKeepAwake('drive');
  const insets = useSafeAreaInsets();
  const store = useStore();
  const { settings } = store;
  const stops = plan.stops;
  const simulate = settings.simulateGps;
  const cameraAlerts = settings.navCameraAlerts !== false;

  const [phase, setPhase] = useState<'locating' | 'routing' | 'driving' | 'arrived' | 'error'>('locating');
  const [legsDone, setLegsDone] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [active, setActive] = useState<Active | null>(null);
  const [fix, setFix] = useState<Fix | null>(null);
  const [hud, setHud] = useState<Hud | null>(null);
  const [next, setNext] = useState(0);
  const [muted, setMuted] = useState(settings.navVoice === false);
  const [checkInAt, setCheckInAt] = useState<number | null>(null);
  const [checkedIn, setCheckedIn] = useState<string[]>([]);
  const [driveNote, setDriveNote] = useState<string | null>(null);

  const activeRef = useRef<Active | null>(null);
  const nextRef = useRef(0);
  const mutedRef = useRef(muted);
  mutedRef.current = muted;
  const fixRef = useRef<Fix | null>(null);
  const said = useRef(new Set<string>());
  const camSaid = useRef(new Map<string, number>());
  const hint = useRef<number | undefined>(undefined);
  const offState = useRef<OffRouteState>(ON_ROUTE);
  const zoneRun = useRef<ZoneRun | null>(null);
  const routing = useRef(false);
  const lastRoute = useRef(0);
  const overRef = useRef(false);
  const lastChime = useRef(0);
  const closed = useRef(false);
  const run = useRef<DriveRun>(NEW_RUN);
  const runDone = useRef(false);

  const say = useCallback((text: string) => {
    if (!mutedRef.current) speak(text).catch(() => undefined);
  }, []);

  const doRoute = useCallback(
    async (from: LatLng, reason: 'start' | 'reroute') => {
      if (routing.current || closed.current) return;
      const { points, legStops } = routePoints(from, stops, nextRef.current);
      if (points.length < 2) return;
      routing.current = true;
      if (reason === 'start') setPhase('routing');
      else setNotice('Off the route. Finding a new way…');
      setLegsDone({ done: 0, total: points.length - 1 });
      try {
        const raw = await fetchRoute(points, { onProgress: (done, total) => setLegsDone({ done, total }) });
        if (!raw || closed.current) return;
        const r = buildRoute(raw, legStops.map((i) => stops[i].name));
        const box = routeBox(r);
        const idx = cameraAlerts ? cameraIndex() : null;
        const fresh: Active = {
          route: r,
          legStops,
          gen: (activeRef.current?.gen ?? 0) + 1,
          cameras: idx ? camerasOnRoute(r, idx.inBox(box)) : [],
          zones: idx ? zonesOnRoute(r, idx.zonesIn(box)) : [],
          stopAlong: stopAlongs(r, stops, nextRef.current),
        };
        activeRef.current = fresh;
        hint.current = undefined;
        offState.current = ON_ROUTE;
        zoneRun.current = null;
        setActive(fresh);
        setNotice(null);
        setPhase((p) => (p === 'arrived' ? p : 'driving'));
        const first = r.steps[0];
        if (reason === 'start') {
          const target = stops[nextRef.current];
          say(`Starting route to ${target.name}.${first ? ` ${first.text}, in ${spokenDistance(first.along)}.` : ''}`);
        } else {
          say('Route updated.');
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Could not plan the route.';
        if (reason === 'start' && !activeRef.current) {
          setError(msg);
          setPhase('error');
        } else {
          setNotice("Couldn't find a new route. Keep to the line, or end and try again.");
        }
      } finally {
        routing.current = false;
        lastRoute.current = Date.now();
        setLegsDone(null);
      }
    },
    [stops, say, cameraAlerts],
  );

  const arrive = useCallback(
    (i: number) => {
      const stop = stops[i];
      nextRef.current = i + 1;
      setNext(i + 1);
      const last = i === stops.length - 1;
      if (stop.role === 'checkpoint') {
        say(i === 0 ? "You're at the start. Follow the line through the checkpoints." : last ? `Finish. That's the end of ${plan.title}.` : `Checkpoint ${i + 1} of ${stops.length}.`);
      } else if (last) {
        say(`You've arrived at ${stop.name}.`);
      } else {
        say(`You've reached ${stop.name}.${stop.checkIn ? ' Check in once you have parked.' : ''}`);
      }
      if (stop.checkIn) setCheckInAt(i);
      if (last) {
        setPhase('arrived');
        feel.success();
      }
    },
    [stops, say, plan.title],
  );

  const onFix = useCallback(
    (f: Fix) => {
      if (closed.current) return;
      fixRef.current = f;
      setFix(f);

      // A drive counts the same way as Start drive on the drive's screen: every checkpoint, in order.
      if (plan.driveId && !simulate && !runDone.current) {
        const spot = store.spots.find((s) => s.id === plan.driveId);
        if (spot?.path) {
          if (runExpired(run.current, driveMiles(spot), f.t)) {
            run.current = NEW_RUN;
          } else {
            run.current = advanceRun(run.current, spot.path, f.at, f.t);
            if (run.current.passed >= spot.path.length) {
              runDone.current = true;
              const verdict = store.finishDrive(spot.id, run.current);
              setDriveNote(verdict.ok ? 'Drive complete: every checkpoint passed.' : verdict.reason);
            }
          }
        }
      }

      const a = activeRef.current;
      if (!a) {
        if (!routing.current && Date.now() - lastRoute.current > 15_000) doRoute(f.at, 'start');
        return;
      }

      const snap = snapToRoute(a.route, f.at, hint.current, f.course);
      hint.current = snap.along;
      const progress = progressOn(a.route, snap);

      const reached = nextRef.current < stops.length ? reachedStop(stops, nextRef.current, f.at) : -1;
      if (reached >= 0) arrive(reached);

      const off = checkOffRoute(offState.current, snap, f);
      offState.current = off.state;
      if (off.off && nextRef.current < stops.length && !routing.current && Date.now() - lastRoute.current > 20_000) {
        say(off.state.reason === 'wrongWay' ? 'Turn around when it is safe, or wait for a new route.' : 'Finding a new route.');
        doRoute(f.at, 'reroute');
      }

      if (snap.off < 60 && nextRef.current < stops.length) {
        const due = dueAnnouncement(a.route, progress, f.speed, said.current, `g${a.gen}`);
        if (due) {
          said.current.add(due.key);
          say(due.text);
        }
      }

      const ahead = cameraAlerts ? camerasAhead(a.cameras, snap.along) : [];
      const zs = zoneStatus(a.zones, snap.along);
      if (cameraAlerts) {
        // Each camera once per pass: a new route doesn't repeat it, but driving past it again later does.
        const cam = ahead[0];
        if (cam && !zs.inside && f.t - (camSaid.current.get(cam.id) ?? -Infinity) > 180_000) {
          camSaid.current.set(cam.id, f.t);
          say(cameraAnnouncement(cam));
        }
        if (zs.inside && zoneRun.current?.zoneId !== zs.inside.id) {
          zoneRun.current = { zoneId: zs.inside.id, enteredAlong: snap.along, enteredAt: f.t };
          say(zoneStartAnnouncement(zs.inside));
        } else if (!zs.inside && zoneRun.current) {
          zoneRun.current = null;
          say(ZONE_END_ANNOUNCEMENT);
        }
      }

      const limit = activeLimit(zs, ahead);
      const over = isOver(f.speed, limit);
      if (over && !overRef.current && Date.now() - lastChime.current > 10_000) {
        lastChime.current = Date.now();
        chime();
        feel.warning();
      }
      overRef.current = over;

      const zoneShown = zs.inside ?? zs.ahead;
      setHud({
        progress,
        ahead,
        zone: zoneShown
          ? {
              zone: zoneShown,
              inside: !!zs.inside,
              average: zs.inside && zoneRun.current ? zoneAverageMph(zoneRun.current, snap.along, f.t) : null,
            }
          : null,
        limit,
        over,
      });
    },
    [arrive, cameraAlerts, doRoute, plan.driveId, say, simulate, stops, store],
  );
  const onFixRef = useRef(onFix);
  onFixRef.current = onFix;

  // GPS while this screen is open and the app is in front; nothing in the background.
  useEffect(() => {
    closed.current = false;
    let sub: Location.LocationSubscription | null = null;
    let timer: ReturnType<typeof setInterval> | null = null;
    let starting = false;

    async function startReal() {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (!perm.granted) {
        setError('Navigation needs your location while the app is open. Allow it for Nightshift in Settings.');
        setPhase('error');
        return;
      }
      const s = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.BestForNavigation, distanceInterval: 3, timeInterval: 1000 },
        (loc) =>
          onFixRef.current({
            at: { lat: loc.coords.latitude, lng: loc.coords.longitude },
            speed: loc.coords.speed != null && loc.coords.speed >= 0 ? loc.coords.speed : null,
            course: loc.coords.heading != null && loc.coords.heading >= 0 ? loc.coords.heading : null,
            accuracy: loc.coords.accuracy ?? null,
            t: loc.timestamp || Date.now(),
          }),
      );
      if (closed.current || AppState.currentState !== 'active') s.remove();
      else sub = s;
    }

    /** Demo: skip the GPS check (Me) drives the route for you, four times faster than life, at Apple's pace for each leg. */
    async function startSim() {
      const here = await currentPosition(true);
      let origin: LatLng = here.ok ? here.at : { lat: stops[0].at.lat - 0.01, lng: stops[0].at.lng };
      let along = 0;
      let gen = 0;
      let t = Date.now();
      timer = setInterval(() => {
        const a = activeRef.current;
        if (!a) {
          onFixRef.current({ at: origin, speed: 0, course: null, accuracy: 5, t });
          return;
        }
        if (a.gen !== gen) {
          gen = a.gen;
          along = 0;
        }
        const leg = a.route.legs.find((l) => l.endAlong > along) ?? a.route.legs[a.route.legs.length - 1];
        const v = leg && leg.time > 0 ? Math.min(31, Math.max(6, (leg.length / leg.time) * 1.05)) : 13;
        along = Math.min(a.route.length, along + v);
        t += 1000;
        const p = pointAlong(a.route, along);
        origin = p.at;
        onFixRef.current({ at: p.at, speed: along >= a.route.length ? 0 : v, course: p.bearing, accuracy: 5, t });
      }, 250);
    }

    function stop() {
      sub?.remove();
      sub = null;
      if (timer) clearInterval(timer);
      timer = null;
    }

    async function start() {
      if (starting || sub || timer) return;
      starting = true;
      try {
        if (simulate) await startSim();
        else await startReal();
      } catch {
        setError('Could not read your location. Try again with a clear view of the sky.');
        setPhase('error');
      } finally {
        starting = false;
      }
    }

    start();
    const app = AppState.addEventListener('change', (state) => {
      if (state === 'active') start();
      else {
        stop();
        stopSpeaking();
      }
    });
    return () => {
      closed.current = true;
      stop();
      app.remove();
      stopSpeaking();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function end() {
    closed.current = true;
    stopSpeaking();
    router.back();
  }

  function retry() {
    setError(null);
    setPhase('locating');
    lastRoute.current = 0;
    const f = fixRef.current;
    if (f) doRoute(f.at, 'start');
  }

  function doCheckIn(i: number) {
    const stop = stops[i];
    const ev = store.events.find((e) => e.id === plan.eventId);
    if (!ev || stop.eventStop === undefined) return;
    const res = canCheckIn(ev, stop.eventStop, store.me, store.crews, new Date(), fixRef.current?.at ?? null, settings.simulateGps);
    if (!res.ok) {
      setNotice(res.reason);
      return;
    }
    try {
      store.checkIn(ev.id, stop.eventStop);
      feel.success();
      setCheckedIn((c) => [...c, stop.id]);
      setCheckInAt(null);
    } catch (e) {
      setNotice(e instanceof Error ? e.message : 'Could not check in.');
    }
  }

  // ---------------------------------------------------------------------------
  // Drawing
  // ---------------------------------------------------------------------------

  const mapStops = useMemo<DriveMapStop[]>(
    () =>
      stops.map((s, i) => ({
        id: s.id,
        at: s.at,
        glyph: s.role === 'checkpoint' ? 'drive' : plan.eventId ? 'cruise' : 'venue',
        colour: i < next ? C.fog : i === next ? C.sodium : C.chalk,
      })),
    [stops, next, plan.eventId],
  );
  const mapCameras = useMemo(() => (active ? active.cameras.map((c) => ({ id: `${c.id}:${Math.round(c.along)}`, at: c.at })) : []), [active]);
  const route = active?.route;
  const progress = hud?.progress;
  const step = route && progress && progress.stepIndex >= 0 ? route.steps[progress.stepIndex] : null;
  const speedMph = mphOf(fix?.speed);
  const moving = (fix?.speed ?? 0) > 2.5;
  const nextStop = next < stops.length ? stops[next] : null;
  const nowMs = Date.now();
  const toNextStop =
    active && progress && nextStop && Number.isFinite(active.stopAlong[next]) ? Math.max(0, active.stopAlong[next] - progress.snap.along) : progress?.toLegEnd;
  const secsToNextStop =
    active && progress && nextStop && Number.isFinite(active.stopAlong[next])
      ? secondsBetween(active.route, progress.snap.along, active.stopAlong[next])
      : progress?.secondsToLegEnd;
  const heading = fix?.course ?? progress?.snap.bearing ?? 0;
  const focus = fix ? (progress && progress.snap.off < 30 ? progress.snap.at : fix.at) : null;
  const over = !!hud?.over;
  const checkInStop = checkInAt !== null ? stops[checkInAt] : null;

  let bannerArrow = '…';
  let bannerDistance = '';
  let bannerText = 'Finding you…';
  if (phase === 'arrived') {
    bannerArrow = ARROWS.arrive;
    bannerText = `You've arrived at ${stops[stops.length - 1].name}`;
  } else if (phase === 'routing') {
    bannerText = legsDone && legsDone.total > 1 ? `Planning the route… ${legsDone.done} of ${legsDone.total} legs` : 'Planning the route…';
  } else if (phase === 'error') {
    bannerArrow = '!';
    bannerText = "Couldn't start navigation";
  } else if (step && progress) {
    bannerArrow = ARROWS[step.kind];
    bannerDistance = formatDistance(progress.toStep);
    bannerText = step.text;
  } else if (route && progress) {
    bannerArrow = ARROWS.straight;
    bannerDistance = formatDistance(progress.toEnd);
    bannerText = 'Follow the route';
  }

  return (
    <View style={st.screen}>
      <View style={[st.banner, { paddingTop: insets.top + 8 }, over && { borderBottomColor: C.alert }]} accessibilityLiveRegion="polite">
        <Text style={st.arrow} accessibilityLabel={step ? step.kind : undefined}>{bannerArrow}</Text>
        <View style={{ flex: 1 }}>
          {bannerDistance ? <Text style={st.bannerDistance}>{bannerDistance}</Text> : null}
          <Text style={st.bannerText} numberOfLines={2}>{bannerText}</Text>
        </View>
      </View>

      <View style={{ flex: 1 }}>
        <DriveMap
          route={route?.coords ?? []}
          stops={mapStops}
          cameras={mapCameras}
          focus={focus}
          heading={heading}
          speed={fix?.speed ?? null}
          you={simulate ? fix?.at ?? null : null}
        />
        {cameraAlerts && mapCameras.length > 0 ? (
          <View pointerEvents="none" style={st.credit}>
            <Text style={st.creditText}>{CAMERA_CREDIT}</Text>
          </View>
        ) : null}
        {simulate ? (
          <View pointerEvents="none" style={st.demo}>
            <Text style={st.demoText}>DEMO DRIVE · 4× SPEED</Text>
          </View>
        ) : null}
        {notice ? (
          <View style={st.notice}>
            <Txt style={{ fontSize: 17 }}>{notice}</Txt>
          </View>
        ) : null}
      </View>

      {phase === 'error' ? (
        <View style={[st.panel, { gap: 10 }]}>
          <Txt style={{ fontSize: 17 }}>{error}</Txt>
          <Button label="Try again" kind="neon" onPress={retry} />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Button label="Apple Maps" kind="ghost" style={{ flex: 1 }} onPress={() => openDirections('apple', stops[nextRef.current]?.at ?? stops[0].at)} />
            <Button label="Google Maps" kind="ghost" style={{ flex: 1 }} onPress={() => openDirections('google', stops[nextRef.current]?.at ?? stops[0].at)} />
            <Button label="Waze" kind="ghost" style={{ flex: 1 }} onPress={() => openDirections('waze', stops[nextRef.current]?.at ?? stops[0].at)} />
          </View>
        </View>
      ) : null}

      {checkInStop && !moving && !checkedIn.includes(checkInStop.id) ? (
        <View style={[st.panel, { gap: 10, borderTopColor: C.lime }]}>
          <Txt style={{ fontSize: 18 }}>You're at {checkInStop.name}.</Txt>
          <Button label={`Check in at ${checkInStop.name}`} kind="neon" onPress={() => doCheckIn(checkInAt!)} />
          <Button label="Not now" kind="ghost" onPress={() => setCheckInAt(null)} />
        </View>
      ) : null}

      <View style={[st.panel, { paddingBottom: insets.bottom + 10 }]}>
        <View style={st.row}>
          <View style={[st.speedBox, over && { borderColor: C.alert, backgroundColor: '#3a0d0d' }]} accessibilityLabel={speedMph != null ? `${speedMph} miles per hour` : 'Speed unknown'}>
            <Text style={[st.speed, over && { color: C.alert }]}>{speedMph ?? '–'}</Text>
            <Text style={st.unit}>MPH</Text>
          </View>
          {hud?.limit ? (
            <View style={st.limit} accessibilityLabel={`${hud.limit.source === 'zone' ? 'Average speed zone' : 'Speed camera'} limit ${hud.limit.mph} miles per hour`}>
              <Text style={st.limitText}>{hud.limit.mph}</Text>
            </View>
          ) : null}
          <View style={{ flex: 1, gap: 2 }}>
            {hud?.zone ? (
              <Text style={st.zone} numberOfLines={2}>
                {hud.zone.inside
                  ? `AVG ZONE${hud.zone.zone.mph ? ` ${hud.zone.zone.mph}` : ''} · YOURS ${hud.zone.average ?? '–'} · ${formatDistance(hud.zone.zone.endAlong - (progress?.snap.along ?? 0))} LEFT`
                  : `AVG ZONE IN ${formatDistance(hud.zone.zone.startAlong - (progress?.snap.along ?? 0))}${hud.zone.zone.mph ? ` · ${hud.zone.zone.mph} MPH` : ''}`}
              </Text>
            ) : hud?.ahead[0] ? (
              <Text style={st.zone}>
                CAMERA IN {formatDistance(hud.ahead[0].along - (progress?.snap.along ?? 0))}
                {hud.ahead[0].mph ? ` · ${hud.ahead[0].mph} MPH` : ''}
              </Text>
            ) : null}
            {nextStop && toNextStop !== undefined && secsToNextStop !== undefined && phase === 'driving' ? (
              <Text style={st.next} numberOfLines={1}>
                {nextStop.name} · {formatDistance(toNextStop)} · {etaClock(nowMs, secsToNextStop)}
              </Text>
            ) : null}
            {progress && stops.length - next > 1 && phase === 'driving' ? (
              <Text style={st.sub} numberOfLines={1}>
                {stops[stops.length - 1].name} · {formatDistance(progress.toEnd)} · {etaClock(nowMs, progress.secondsToEnd)}
              </Text>
            ) : null}
            {driveNote ? <Text style={st.sub}>{driveNote}</Text> : simulate && plan.driveId ? <Text style={st.sub}>Demo drives don't count as finishing it.</Text> : null}
          </View>
        </View>
        <View style={st.row}>
          <Pressable
            onPress={() => {
              const m = !muted;
              setMuted(m);
              if (m) stopSpeaking();
            }}
            accessibilityRole="button"
            accessibilityLabel={muted ? 'Voice off. Turn voice on' : 'Voice on. Mute'}
            style={({ pressed }) => [st.mute, pressed && { opacity: 0.7 }]}
          >
            <Text style={st.muteText}>{muted ? 'VOICE OFF' : 'VOICE ON'}</Text>
          </Pressable>
          <Pressable onPress={end} accessibilityRole="button" accessibilityLabel="End navigation" style={({ pressed }) => [st.end, pressed && { opacity: 0.8 }]}>
            <Text style={st.endText}>END</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.asphalt },
  centred: { alignItems: 'center', gap: 12, paddingHorizontal: 24 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: C.tarmac,
    borderBottomWidth: 3,
    borderBottomColor: C.neon,
  },
  arrow: { fontSize: 64, lineHeight: 70, color: C.neon, width: 70, textAlign: 'center' },
  bannerDistance: { fontFamily: F.display, fontSize: 38, color: C.chalk, fontVariant: ['tabular-nums'] },
  bannerText: { fontFamily: F.bodyBold, fontSize: 22, lineHeight: 27, color: C.chalk },
  panel: { backgroundColor: C.tarmac, paddingHorizontal: 16, paddingTop: 12, gap: 12, borderTopWidth: 1, borderTopColor: C.kerb },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  speedBox: { minWidth: 92, alignItems: 'center', borderWidth: 2, borderColor: C.kerbHi, borderRadius: 12, paddingVertical: 4, paddingHorizontal: 8 },
  speed: { fontFamily: F.display, fontSize: 44, lineHeight: 48, color: C.chalk, fontVariant: ['tabular-nums'] },
  unit: { fontFamily: F.labelBold, fontSize: 13, color: C.fog, letterSpacing: 1.5 },
  limit: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#ffffff', borderWidth: 7, borderColor: '#d61f1f', alignItems: 'center', justifyContent: 'center' },
  limitText: { fontFamily: F.display, fontSize: 24, color: '#111111' },
  zone: { fontFamily: F.labelBold, fontSize: 16, color: C.sodium, letterSpacing: 0.8 },
  next: { fontFamily: F.bodyBold, fontSize: 18, color: C.chalk },
  sub: { fontFamily: F.body, fontSize: 15, color: C.fog },
  mute: { flex: 1, height: 60, borderRadius: 12, borderWidth: 2, borderColor: C.kerbHi, alignItems: 'center', justifyContent: 'center' },
  muteText: { fontFamily: F.labelBold, fontSize: 18, color: C.chalk, letterSpacing: 1.5 },
  end: { flex: 2, height: 60, borderRadius: 12, backgroundColor: C.alert, alignItems: 'center', justifyContent: 'center' },
  endText: { fontFamily: F.display, fontSize: 24, color: '#ffffff', letterSpacing: 2 },
  credit: { position: 'absolute', right: 4, bottom: 4, backgroundColor: 'rgba(11,15,23,0.75)', borderRadius: 3, paddingHorizontal: 4, paddingVertical: 1 },
  creditText: { color: C.fog, fontSize: 9 },
  demo: { position: 'absolute', left: 8, top: 8, backgroundColor: 'rgba(11,15,23,0.8)', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  demoText: { fontFamily: F.labelBold, color: C.sodium, fontSize: 12, letterSpacing: 1 },
  notice: { position: 'absolute', left: 12, right: 12, bottom: 12, backgroundColor: 'rgba(19,26,38,0.95)', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: C.sodium },
});
