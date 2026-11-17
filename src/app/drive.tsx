import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import { useKeepAwake } from 'expo-keep-awake';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { chime, navDirectionsAvailable, route as fetchRoute, speak, stopSpeaking } from '../../modules/nav-directions';
import { DriveMap, type DriveMapStop } from '../components/DriveMap';
import { openDirections } from '../components/NavLaunch';
import { ReportAlert, ReportGrid, StillTherePrompt, UndoBar } from '../components/RoadReportControls';
import { Button, Txt } from '../components/ui';
import { cameraIndex } from '../lib/cameraData';
import { CAMERA_CREDIT } from '../lib/cameras';
import { canCheckIn } from '../lib/events';
import { feel } from '../lib/feel';
import { compassHeading, driveFocus, pickHeading, smoothHeading } from '../lib/heading';
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
  metresBetween,
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
import {
  alertText,
  closureAhead,
  detourCandidates,
  dropViaArrivals,
  reportAlertDue,
  reportsOnRoute,
  routeAvoids,
  ROAD_CLOSED_SPOKEN,
  ROAD_CLOSED_WARNING,
  ROAD_RULES,
  stillTherePrompt,
  VIA_REACHED_METRES,
  withVias,
  type RoadReport,
  type RoadReportKind,
  type RoadVote,
  type RouteReport,
  type Via,
} from '../lib/roadReports';
import { useRoadReports, useRoads } from '../lib/roadStore';
import { advanceRun, NEW_RUN, runExpired, driveMiles, type DriveRun } from '../lib/spots';
import { useStore } from '../lib/store';
import type { LatLng } from '../lib/types';
import { BRAND, C, DRIVE_TYPE, F, FONT_SCALE, ROAD_COLOUR, STATE, SURFACE, TYPE } from '../theme';

/**
 * The driving view: turn-by-turn directions through an event's stops, a
 * drive's checkpoints or to one place. Full screen, dark, big text, voice,
 * and as little to touch as possible while moving.
 *
 * Safety (docs/SPEC.md, "Driving view"): foreground only, GPS stops when you
 * leave the screen or the app; your speed is shown live against a camera or
 * zone limit and never stored, scored or ranked; cameras are speed-limit
 * information only.
 *
 * Road reports (docs/SPEC.md, "Road reports"): REPORT then what, undo for 5 s;
 * reports ahead on the route are said and shown; "Still there?" after passing
 * one, gone after 8 s. This is the only screen that asks for police reports
 * ("Police / speed check", context 'driving'). Closures on the route are
 * driven round where MapKit finds a way that stays 100 m clear.
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
        <Txt v="h2" scale="drive">Nothing to navigate to</Txt>
        <Txt v="muted" scale="drive" style={{ textAlign: 'center' }}>The stop isn't unlocked for you yet, or it's gone.</Txt>
        <Button label="Back" kind="secondary" size="lg" onPress={() => router.back()} />
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
      <Txt v="eyebrow" scale="drive">Navigation</Txt>
      <Txt v="h1" scale="drive">Turn by turn needs the iPhone app</Txt>
      <Txt v="muted" scale="drive">
        {Platform.OS === 'web'
          ? 'The web preview has no directions or voice. Open Nightshift on the iPhone, or use another app for now.'
          : 'This install is older than the navigation update. Install the latest IPA, or use another app for now.'}
        {plan.driveId ? " Other apps don't count a drive: back on the drive's page, Count without directions does." : ''}
      </Txt>
      <Txt scale="drive">{plan.title}</Txt>
      <Button label="Apple Maps" size="lg" onPress={() => openDirections('apple', to)} />
      <Button label="Google Maps" kind="secondary" onPress={() => openDirections('google', to)} />
      <Button label="Waze" kind="secondary" onPress={() => openDirections('waze', to)} />
      <Button label="Back" kind="secondary" onPress={() => router.back()} />
    </View>
  );
}

interface Active {
  route: NavRoute;
  /** For each leg, which stop it ends at (-1: a detour point round a closure). */
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
  // The demo's simulated drive; signed in, the server judges real fixes only.
  const simulate = settings.simulateGps && store.backend === 'local';
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
  /** When the last fix arrived (phone clock): an old fix's course says nothing about now. */
  const fixAt = useRef(0);
  /** The compass (degrees), for which way to face when GPS course is no good (slow or stopped). */
  const compassRef = useRef<number | null>(null);
  /** Where you are on the route, for the heading's last resort. */
  const snapRef = useRef<{ bearing: number; off: number } | null>(null);
  const [heading, setHeading] = useState(0);
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

  // Road reports: read around you (re-read every couple of km, every minute and on any change).
  const roads = useRoads();
  const [reportCentre, setReportCentre] = useState<LatLng | null>(null);
  const { reports: roadReports } = useRoadReports({ centre: reportCentre, radiusMi: 15, context: 'driving', enabled: true, refreshMs: 60_000 });
  const routeReports = useRef<RouteReport[]>([]);
  const announced = useRef(new Set<string>());
  const asked = useRef(new Set<string>());
  const closuresTried = useRef(new Set<string>());
  const vias = useRef<Via[]>([]);
  const detouring = useRef(false);
  const [gridOpen, setGridOpen] = useState(false);
  const [pending, setPending] = useState<{ kind: RoadReportKind; at: LatLng; heading: number | null; until: number } | null>(null);
  const pendingRef = useRef(pending);
  pendingRef.current = pending;
  const [undoLeft, setUndoLeft] = useState(0);
  const [prompt, setPrompt] = useState<RoadReport | null>(null);
  const promptRef = useRef<RoadReport | null>(null);
  const [alert, setAlert] = useState<string | null>(null);

  const say = useCallback((text: string) => {
    if (!mutedRef.current) speak(text).catch(() => undefined);
  }, []);

  const doRoute = useCallback(
    async (from: LatLng, reason: 'start' | 'reroute' | 'detour') => {
      if (routing.current || closed.current) return;
      const base = routePoints(from, stops, nextRef.current);
      if (base.points.length < 2) return;
      // Detour points round a closure go in before the next stop.
      const { points, legStops } = withVias(base.points, base.legStops, vias.current.map((v) => v.at));
      routing.current = true;
      if (reason === 'start') setPhase('routing');
      else if (reason === 'detour') setNotice('Road closed ahead. Taking a way round…');
      else setNotice('Off the route. Finding a new way…');
      setLegsDone({ done: 0, total: points.length - 1 });
      try {
        const raw = await fetchRoute(points, { onProgress: (done, total) => setLegsDone({ done, total }) });
        if (!raw || closed.current) return;
        const r = dropViaArrivals(buildRoute(raw, legStops.map((i) => (i >= 0 ? stops[i].name : ''))), legStops);
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
          say(reason === 'detour' ? 'Road closed ahead. Taking a way round.' : 'Route updated.');
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

  /**
   * A closure on this leg: MapKit can't avoid a road, so try a detour point to
   * each side of it (near, then further out) and keep the first route that
   * stays 100 m clear. Otherwise say so and leave the route as it is.
   */
  const detour = useCallback(
    async (x: RouteReport, from: LatLng) => {
      const a = activeRef.current;
      const target = stops[nextRef.current];
      if (!a || !target || detouring.current) return;
      detouring.current = true;
      setNotice('Road closed ahead. Looking for a way round…');
      try {
        for (const wp of detourCandidates(a.route, x.along).slice(0, 4)) {
          if (closed.current) return;
          const raw = await fetchRoute([from, wp, target.at]).catch(() => null);
          if (!raw) continue;
          if (routeAvoids(buildRoute(raw).coords, x.report)) {
            vias.current = [{ closureId: x.report.id, at: wp }];
            detouring.current = false;
            await doRoute(fixRef.current?.at ?? from, 'detour');
            return;
          }
        }
        setNotice(ROAD_CLOSED_WARNING);
        say(ROAD_CLOSED_SPOKEN);
      } finally {
        detouring.current = false;
      }
    },
    [stops, doRoute, say],
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
      fixAt.current = Date.now();
      setFix(f);
      setReportCentre((c) => (!c || metresBetween(c, f.at) > 1500 ? f.at : c));
      if (vias.current.length) vias.current = vias.current.filter((v) => metresBetween(f.at, v.at) > VIA_REACHED_METRES);

      // Navigating a drive counts it: every checkpoint, in order (the same check as "Count without directions" on the drive's page).
      if (plan.driveId && !simulate && !runDone.current) {
        const spot = store.spots.find((s) => s.id === plan.driveId);
        if (spot?.path) {
          if (runExpired(run.current, driveMiles(spot), f.t)) {
            run.current = NEW_RUN;
          } else {
            run.current = advanceRun(run.current, spot.path, f.at, f.t);
            if (run.current.passed >= spot.path.length) {
              runDone.current = true;
              store
                .finishDrive(spot.id, run.current)
                .then((verdict) => {
                  if (verdict.ok) feel.success();
                  setDriveNote(verdict.ok ? 'Drive complete: every checkpoint passed. It counts.' : verdict.reason);
                })
                .catch((e) => setDriveNote(e instanceof Error ? e.message : 'Could not record the drive.'));
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
      snapRef.current = { bearing: snap.bearing, off: snap.off };
      const progress = progressOn(a.route, snap);

      const reached = nextRef.current < stops.length ? reachedStop(stops, nextRef.current, f.at) : -1;
      if (reached >= 0) arrive(reached);

      const off = checkOffRoute(offState.current, snap, f);
      offState.current = off.state;
      if (off.off && nextRef.current < stops.length && !routing.current && Date.now() - lastRoute.current > 20_000) {
        say(off.state.reason === 'wrongWay' ? 'Turn around when it is safe, or wait for a new route.' : 'Finding a new route.');
        // Off a detour too: start again from here, closures included.
        vias.current = [];
        closuresTried.current.clear();
        doRoute(f.at, 'reroute');
      }

      let spoke = false;
      if (snap.off < 60 && nextRef.current < stops.length) {
        const due = dueAnnouncement(a.route, progress, f.speed, said.current, `g${a.gen}`);
        if (due) {
          said.current.add(due.key);
          say(due.text);
          spoke = true;
        }
      }

      // Road reports ahead: said once each (after any turn instruction), shown for a few seconds.
      if (snap.off < 60) {
        const nowDate = new Date();
        const ahead = spoke ? null : reportAlertDue(routeReports.current, snap.along, announced.current);
        if (ahead) {
          announced.current.add(ahead.report.id);
          const t = alertText(ahead, snap.along);
          setAlert(t.banner);
          say(t.spoken);
        }
        // Just passed someone's report: still there?
        if (!promptRef.current) {
          const ask = stillTherePrompt(routeReports.current, snap.along, asked.current, nowDate);
          if (ask) {
            asked.current.add(ask.id);
            promptRef.current = ask;
            setPrompt(ask);
            feel.tap();
          }
        }
        // A closure on this leg: find a way round, once per closure.
        if (!routing.current && !detouring.current && nextRef.current < stops.length) {
          const legEnd = Number.isFinite(a.stopAlong[nextRef.current]) ? a.stopAlong[nextRef.current] : a.route.length;
          const blocked = closureAhead(routeReports.current, snap.along, legEnd, nowDate);
          if (blocked && !closuresTried.current.has(blocked.report.id)) {
            closuresTried.current.add(blocked.report.id);
            detour(blocked, f.at);
          }
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
    [arrive, cameraAlerts, doRoute, detour, plan.driveId, say, simulate, stops, store],
  );
  const onFixRef = useRef(onFix);

  // Reports on the route: worked out again for each new route and each new read.
  const [onRouteReports, setOnRouteReports] = useState<RouteReport[]>([]);
  useEffect(() => {
    const on = active ? reportsOnRoute(active.route, roadReports) : [];
    routeReports.current = on;
    setOnRouteReports(on);
  }, [active, roadReports]);

  // The alert strip goes after 10 s; "Still there?" after 8 s (ignoring it is fine).
  useEffect(() => {
    if (!alert) return;
    const t = setTimeout(() => setAlert(null), 10_000);
    return () => clearTimeout(t);
  }, [alert]);
  useEffect(() => {
    if (!prompt) return;
    const t = setTimeout(() => {
      promptRef.current = null;
      setPrompt(null);
    }, ROAD_RULES.promptMs);
    return () => clearTimeout(t);
  }, [prompt]);

  // A report waits 5 s for UNDO, then goes.
  const sendReport = useCallback(
    (p: { kind: RoadReportKind; at: LatLng; heading: number | null }) => {
      roads
        .report(p.kind, p.at, p.heading, fixRef.current?.at ?? p.at)
        .catch((e) => setNotice(e instanceof Error ? e.message : 'Could not send the report.'));
    },
    [roads],
  );
  const sendRef = useRef(sendReport);
  sendRef.current = sendReport;
  useEffect(() => {
    if (!pending) return;
    let sent = false;
    const tick = () => {
      if (sent) return;
      const left = pending.until - Date.now();
      if (left <= 0) {
        sent = true;
        pendingRef.current = null;
        setPending(null);
        sendRef.current(pending);
      } else setUndoLeft(Math.ceil(left / 1000));
    };
    tick();
    const t = setInterval(tick, 250);
    return () => clearInterval(t);
  }, [pending]);
  // Leaving inside the 5 s still sends it.
  useEffect(
    () => () => {
      const p = pendingRef.current;
      if (p) sendRef.current(p);
    },
    [],
  );

  function openReport() {
    if (!fixRef.current) {
      setNotice('Waiting for your location before you can report.');
      return;
    }
    feel.tap();
    setGridOpen(true);
  }

  function pickReport(kind: RoadReportKind) {
    setGridOpen(false);
    const f = fixRef.current;
    if (!f) return;
    feel.success();
    setPending({ kind, at: f.at, heading: f.course, until: Date.now() + ROAD_RULES.undoMs });
    say('Thanks, reported.');
  }

  function undoReport() {
    pendingRef.current = null;
    setPending(null);
    feel.tap();
    say('Report cancelled.');
  }

  function answerPrompt(vote: RoadVote) {
    const r = promptRef.current;
    promptRef.current = null;
    setPrompt(null);
    if (!r) return;
    feel.tap();
    roads.answer(r.id, vote, fixRef.current?.at ?? null).catch((e) => setNotice(e instanceof Error ? e.message : 'Could not send that.'));
  }
  onFixRef.current = onFix;

  // Which way the map faces: GPS course when moving, else the compass, else the route (heading.ts), eased.
  useEffect(() => {
    let shown: number | null = null;
    const t = setInterval(() => {
      const f = fixRef.current;
      const fresh = f && Date.now() - fixAt.current < 3000;
      const pick = pickHeading({
        course: fresh ? f.course : null,
        speed: fresh ? f.speed : null,
        compass: compassRef.current,
        route: snapRef.current,
      });
      const next = smoothHeading(shown, pick.heading);
      if (next != null && next !== shown) {
        shown = next;
        setHeading(next);
      }
    }, 400);
    return () => clearInterval(t);
  }, []);

  // GPS while this screen is open and the app is in front; nothing in the background.
  useEffect(() => {
    closed.current = false;
    let sub: Location.LocationSubscription | null = null;
    let compass: Location.LocationSubscription | null = null;
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
      await startCompass();
    }

    /** The compass, for facing the right way while slow or stopped. No compass (or it fails): GPS and the route only. */
    async function startCompass() {
      if (compass) return;
      try {
        const c = await Location.watchHeadingAsync((h) => {
          compassRef.current = compassHeading(h);
        });
        if (closed.current || AppState.currentState !== 'active') c.remove();
        else compass = c;
      } catch {
        compassRef.current = null;
      }
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
      await startCompass();
    }

    function stop() {
      sub?.remove();
      sub = null;
      compass?.remove();
      compass = null;
      compassRef.current = null;
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

  async function doCheckIn(i: number) {
    const stop = stops[i];
    const ev = store.events.find((e) => e.id === plan.eventId);
    if (!ev || stop.eventStop === undefined) return;
    // "Skip the GPS check" is the demo's only: signed in, the server always checks the distance.
    const skip = simulate;
    const at = fixRef.current?.at ?? null;
    const res = canCheckIn(ev, stop.eventStop, store.me, store.crews, new Date(), at, skip);
    if (!res.ok) {
      setNotice(res.reason);
      return;
    }
    try {
      await store.checkIn(ev.id, stop.eventStop, undefined, at);
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
        glyph: s.role === 'checkpoint' ? 'drive' : plan.eventId ? 'cruise' : 'destination',
        colour: i < next ? C.fog : i === next ? BRAND : C.chalk,
      })),
    [stops, next, plan.eventId],
  );
  const mapCameras = useMemo(() => (active ? active.cameras.map((c) => ({ id: `${c.id}:${Math.round(c.along)}`, at: c.at })) : []), [active]);
  // Reports on the route, and the nearest others around you.
  const mapReports = useMemo(() => {
    const ids = new Set(onRouteReports.map((x) => x.report.id));
    const rest = roadReports.filter((r) => !ids.has(r.id)).slice(0, 40);
    return [...onRouteReports.map((x) => x.report), ...rest].map((r) => ({ id: r.id, at: r.at, glyph: r.kind }));
  }, [onRouteReports, roadReports]);
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
  // On you; on the route only when you're moving along it and within a few metres (heading.ts).
  const focus = driveFocus(fix, progress?.snap);
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
      <View style={[st.banner, { paddingTop: insets.top + 8 }, over && { borderBottomColor: STATE.danger }]} accessibilityLiveRegion="polite">
        <Text style={st.arrow} allowFontScaling={false} accessibilityLabel={step ? step.kind : undefined}>{bannerArrow}</Text>
        <View style={{ flex: 1 }}>
          {bannerDistance ? <Text style={st.bannerDistance} maxFontSizeMultiplier={FONT_SCALE.drive}>{bannerDistance}</Text> : null}
          <Text style={st.bannerText} numberOfLines={3} maxFontSizeMultiplier={FONT_SCALE.drive}>{bannerText}</Text>
        </View>
      </View>
      {alert ? <ReportAlert text={alert} /> : null}

      <View style={{ flex: 1 }}>
        <DriveMap
          route={route?.coords ?? []}
          stops={mapStops}
          cameras={mapCameras}
          reports={mapReports}
          focus={focus}
          heading={heading}
          speed={fix?.speed ?? null}
          you={simulate ? fix?.at ?? null : null}
        />
        {cameraAlerts && mapCameras.length > 0 ? (
          <View pointerEvents="none" style={st.credit}>
            <Text style={st.creditText} maxFontSizeMultiplier={FONT_SCALE.drive}>{CAMERA_CREDIT}</Text>
          </View>
        ) : null}
        {simulate ? (
          <View pointerEvents="none" style={st.demo}>
            <Text style={st.demoText} maxFontSizeMultiplier={FONT_SCALE.drive}>DEMO DRIVE · 4× SPEED</Text>
          </View>
        ) : null}
        {notice ? (
          <View style={st.notice}>
            <Txt scale="drive" style={{ fontSize: DRIVE_TYPE.body }}>{notice}</Txt>
          </View>
        ) : null}
      </View>

      {phase === 'error' ? (
        <View style={[st.panel, { gap: 10 }]}>
          <Txt scale="drive" style={{ fontSize: DRIVE_TYPE.body }} accessibilityLiveRegion="polite">{error}</Txt>
          <Button label="Try again" size="lg" onPress={retry} />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Button label="Apple Maps" kind="secondary" style={{ flex: 1 }} onPress={() => openDirections('apple', stops[nextRef.current]?.at ?? stops[0].at)} />
            <Button label="Google Maps" kind="secondary" style={{ flex: 1 }} onPress={() => openDirections('google', stops[nextRef.current]?.at ?? stops[0].at)} />
            <Button label="Waze" kind="secondary" style={{ flex: 1 }} onPress={() => openDirections('waze', stops[nextRef.current]?.at ?? stops[0].at)} />
          </View>
        </View>
      ) : null}

      {pending ? (
        <UndoBar kind={pending.kind} secondsLeft={Math.max(1, undoLeft)} onUndo={undoReport} />
      ) : prompt ? (
        <StillTherePrompt
          report={prompt}
          onAnswer={answerPrompt}
          onDismiss={() => {
            promptRef.current = null;
            setPrompt(null);
          }}
        />
      ) : null}

      {checkInStop && !moving && !checkedIn.includes(checkInStop.id) ? (
        <View style={[st.panel, { gap: 10, borderTopColor: STATE.success }]}>
          <Txt scale="drive" style={{ fontSize: DRIVE_TYPE.body }}>You're at {checkInStop.name}.</Txt>
          <Button label={`Check in at ${checkInStop.name}`} size="lg" onPress={() => doCheckIn(checkInAt!)} />
          <Button label="Not now" kind="secondary" size="lg" onPress={() => setCheckInAt(null)} />
        </View>
      ) : null}

      <View style={[st.panel, { paddingBottom: insets.bottom + 10 }]}>
        <View style={st.row}>
          <View style={[st.speedBox, over && { borderColor: STATE.danger, backgroundColor: '#3a0d0d' }]} accessibilityLabel={speedMph != null ? `${speedMph} miles per hour` : 'Speed unknown'}>
            <Text style={[st.speed, over && { color: STATE.danger }]} maxFontSizeMultiplier={FONT_SCALE.drive}>{speedMph ?? '–'}</Text>
            <Text style={st.unit} maxFontSizeMultiplier={FONT_SCALE.drive}>MPH</Text>
          </View>
          {hud?.limit ? (
            <View style={st.limit} accessibilityLabel={`${hud.limit.source === 'zone' ? 'Average speed zone' : 'Speed camera'} limit ${hud.limit.mph} miles per hour`}>
              <Text style={st.limitText} allowFontScaling={false}>{hud.limit.mph}</Text>
            </View>
          ) : null}
          <View style={{ flex: 1, gap: 2 }}>
            {hud?.zone ? (
              <Text style={st.zone} numberOfLines={2} maxFontSizeMultiplier={FONT_SCALE.drive}>
                {hud.zone.inside
                  ? `AVG ZONE${hud.zone.zone.mph ? ` ${hud.zone.zone.mph}` : ''} · YOURS ${hud.zone.average ?? '–'} · ${formatDistance(hud.zone.zone.endAlong - (progress?.snap.along ?? 0))} LEFT`
                  : `AVG ZONE IN ${formatDistance(hud.zone.zone.startAlong - (progress?.snap.along ?? 0))}${hud.zone.zone.mph ? ` · ${hud.zone.zone.mph} MPH` : ''}`}
              </Text>
            ) : hud?.ahead[0] ? (
              <Text style={st.zone} maxFontSizeMultiplier={FONT_SCALE.drive}>
                CAMERA IN {formatDistance(hud.ahead[0].along - (progress?.snap.along ?? 0))}
                {hud.ahead[0].mph ? ` · ${hud.ahead[0].mph} MPH` : ''}
              </Text>
            ) : null}
            {nextStop && toNextStop !== undefined && secsToNextStop !== undefined && phase === 'driving' ? (
              <Text style={st.next} numberOfLines={1} maxFontSizeMultiplier={FONT_SCALE.drive}>
                {nextStop.name} · {formatDistance(toNextStop)} · {etaClock(nowMs, secsToNextStop)}
              </Text>
            ) : null}
            {progress && stops.length - next > 1 && phase === 'driving' ? (
              <Text style={st.sub} numberOfLines={1} maxFontSizeMultiplier={FONT_SCALE.drive}>
                {stops[stops.length - 1].name} · {formatDistance(progress.toEnd)} · {etaClock(nowMs, progress.secondsToEnd)}
              </Text>
            ) : null}
            {plan.driveId ? (
              <Text style={[st.sub, driveNote?.startsWith('Drive complete') && { color: STATE.success }]} maxFontSizeMultiplier={FONT_SCALE.drive}>
                {driveNote ??
                  (simulate
                    ? "Demo drive: it doesn't count. Simulate the drive on its page to count it."
                    : 'Pass every checkpoint in order and the drive counts.')}
              </Text>
            ) : null}
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
            <Text style={st.muteText} maxFontSizeMultiplier={FONT_SCALE.drive}>{muted ? 'VOICE OFF' : 'VOICE ON'}</Text>
          </Pressable>
          <Pressable
            onPress={openReport}
            accessibilityRole="button"
            accessibilityLabel="Report something on the road"
            style={({ pressed }) => [st.report, pressed && { opacity: 0.8 }]}
          >
            <Text style={st.reportText} maxFontSizeMultiplier={FONT_SCALE.drive}>REPORT</Text>
          </Pressable>
          <Pressable onPress={end} accessibilityRole="button" accessibilityLabel="End navigation" style={({ pressed }) => [st.end, pressed && { opacity: 0.8 }]}>
            <Text style={st.endText} maxFontSizeMultiplier={FONT_SCALE.drive}>END</Text>
          </Pressable>
        </View>
      </View>
      {gridOpen ? <ReportGrid onPick={pickReport} onClose={() => setGridOpen(false)} bottom={insets.bottom} /> : null}
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
    borderBottomColor: BRAND,
  },
  /** The turn arrow: brand, never the Drives layer's blue. */
  arrow: { fontSize: 64, lineHeight: 70, color: BRAND, width: 70, textAlign: 'center' },
  bannerDistance: { fontFamily: F.display, fontSize: DRIVE_TYPE.banner, color: C.chalk, fontVariant: ['tabular-nums'] },
  bannerText: { fontFamily: F.bodyBold, fontSize: DRIVE_TYPE.readout, lineHeight: 27, color: C.chalk },
  panel: { backgroundColor: C.tarmac, paddingHorizontal: 16, paddingTop: 12, gap: 12, borderTopWidth: 1, borderTopColor: C.kerb },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  speedBox: { minWidth: 92, alignItems: 'center', borderWidth: 2, borderColor: C.kerbHi, borderRadius: 12, paddingVertical: 4, paddingHorizontal: 8 },
  speed: { fontFamily: F.display, fontSize: DRIVE_TYPE.speed, lineHeight: 48, color: C.chalk, fontVariant: ['tabular-nums'] },
  unit: { fontFamily: F.labelBold, fontSize: TYPE.caption, color: C.fog, letterSpacing: 1.5 },
  limit: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#ffffff', borderWidth: 7, borderColor: '#d61f1f', alignItems: 'center', justifyContent: 'center' },
  limitText: { fontFamily: F.display, fontSize: 24, color: '#111111' },
  zone: { fontFamily: F.labelBold, fontSize: 16, color: STATE.warning, letterSpacing: 0.8 },
  next: { fontFamily: F.bodyBold, fontSize: DRIVE_TYPE.body, color: C.chalk },
  sub: { fontFamily: F.body, fontSize: TYPE.body, color: C.fog },
  mute: { flex: 1, height: 60, borderRadius: 12, borderWidth: 2, borderColor: C.kerbHi, alignItems: 'center', justifyContent: 'center' },
  muteText: { fontFamily: F.labelBold, fontSize: 18, color: C.chalk, letterSpacing: 1.5 },
  report: { flex: 1.5, height: 60, borderRadius: 12, backgroundColor: ROAD_COLOUR, alignItems: 'center', justifyContent: 'center' },
  reportText: { fontFamily: F.display, fontSize: 22, color: C.asphalt, letterSpacing: 1.5 },
  end: { flex: 1.3, height: 60, borderRadius: 12, backgroundColor: STATE.danger, alignItems: 'center', justifyContent: 'center' },
  /** Asphalt on red: 5.9:1, readable in sunlight (white was 3.3:1). */
  endText: { fontFamily: F.display, fontSize: 24, color: C.asphalt, letterSpacing: 2 },
  credit: { position: 'absolute', right: 4, bottom: 4, backgroundColor: SURFACE.glass, borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1 },
  creditText: { fontFamily: F.label, color: C.fog, fontSize: TYPE.micro },
  demo: { position: 'absolute', left: 8, top: 8, backgroundColor: SURFACE.glass, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  demoText: { fontFamily: F.labelBold, color: BRAND, fontSize: TYPE.label, letterSpacing: 1 },
  notice: { position: 'absolute', left: 12, right: 12, bottom: 12, backgroundColor: SURFACE.glassRaised, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: BRAND },
});
