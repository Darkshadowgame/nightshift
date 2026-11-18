import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import { useKeepAwake } from 'expo-keep-awake';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { chime, navDirectionsAvailable, route as fetchRoute, speak, stopSpeaking } from '../../modules/nav-directions';
import { DriveMap, type DriveMapStop } from '../components/DriveMap';
import {
  AlertPill,
  CompassGlyph,
  DriveBanner,
  DriveBar,
  IconPickerSheet,
  MapButton,
  RecentreGlyph,
  ReportButton,
  SpeakerGlyph,
  SubLine,
} from '../components/DriveHud';
import { openDirections } from '../components/NavLaunch';
import { ReportAlert, ReportGrid, StillTherePrompt, UndoBar } from '../components/RoadReportControls';
import { buzz, Button, DsText } from '../components/ds';
import { cameraIndex } from '../lib/cameraData';
import { CAMERA_CREDIT } from '../lib/cameras';
import { canCheckIn } from '../lib/events';
import { feel } from '../lib/feel';
import {
  arrivedByRoute,
  bannerFor,
  cameraHeading,
  canPan,
  isMoving,
  liveSpeed,
  nameLookupDue,
  navIconOf,
  overLimit,
  recentreDue,
  roadOnRoute,
  shownLimit,
  tripSummary,
  type MapOrientation,
} from '../lib/driveView';
import { compassHeading, driveFocus, pickHeading, smoothHeading } from '../lib/heading';
import { fetchRoads } from '../lib/roadLookup';
import { cellOf, lookupDue, OSM_CREDIT, pickWay, remember, roadInfo, type OsmWay, type RoadInfo } from '../lib/speedLimit';
import { currentPosition, streetAt } from '../lib/location';
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
import { speechRate } from '../lib/voices';
import type { LatLng } from '../lib/types';
import { COLOR, RADII, SPACING } from '../theme';

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
      <View style={[st.screen, st.centred, { paddingTop: insets.top + SPACING.xl }]}>
        <DsText v="heading" accessibilityRole="header">
          Nothing to navigate to
        </DsText>
        <DsText v="secondary" style={{ textAlign: 'center' }}>
          The meet point isn't shown to you yet, or it's gone.
        </DsText>
        <Button block label="Back" tier="secondary" size="lg" onPress={() => router.back()} />
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
    <View style={[st.screen, { paddingTop: insets.top + SPACING.xl, paddingHorizontal: SPACING.screen, gap: SPACING.md }]}>
      <DsText v="eyebrow" tone="action">
        Navigation
      </DsText>
      <DsText v="titleLg" accessibilityRole="header">
        Turn by turn needs the iPhone app
      </DsText>
      <DsText v="secondary">
        {Platform.OS === 'web'
          ? 'The web preview has no directions or voice. Open Nightshift on the iPhone, or use another app for now.'
          : 'This install is older than the navigation update. Install the latest IPA, or use another app for now.'}
        {plan.driveId ? " Other apps don't count a drive: back on the drive's page, Count it without directions does." : ''}
      </DsText>
      <DsText v="title">{plan.title}</DsText>
      <Button block label="Apple Maps" size="lg" onPress={() => openDirections('apple', to)} />
      <Button block label="Google Maps" tier="secondary" onPress={() => openDirections('google', to)} />
      <Button block label="Waze" tier="secondary" onPress={() => openDirections('waze', to)} />
      <Button block label="Back" tier="secondary" onPress={() => router.back()} />
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
  const { settings, setSettings } = store;
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
  /** Ticks every second: the ETA, "stopped" once fixes dry up, and recentring after a look round. */
  const [nowMs, setNowMs] = useState(() => Date.now());
  const orientation: MapOrientation = settings.navMap === 'north' ? 'north' : 'heading';
  const icon = useMemo(() => navIconOf(settings.navIcon), [settings.navIcon]);
  /** When you last panned the map (stopped only); null while it follows you. */
  const [pannedAt, setPannedAt] = useState<number | null>(null);
  const [iconOpen, setIconOpen] = useState(false);
  /** The road you're on from OpenStreetMap (name and limit), and the street from the phone's geocoder off the route. */
  const [osmRoad, setOsmRoad] = useState<RoadInfo | null>(null);
  const [geoStreet, setGeoStreet] = useState<string | null>(null);
  const roadCache = useRef(new Map<string, OsmWay[]>());
  const roadLookupAt = useRef(0);
  const roadLoading = useRef(false);
  const nameLookup = useRef<{ at: LatLng; t: number } | null>(null);

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

  // The voice and speed picked in Settings (read when speaking, so a change applies straight away).
  const voiceRef = useRef({ voice: settings.navVoiceId ?? null, rate: speechRate(settings.navVoiceRate) });
  voiceRef.current = { voice: settings.navVoiceId ?? null, rate: speechRate(settings.navVoiceRate) };
  const say = useCallback((text: string) => {
    if (!mutedRef.current) speak(text, voiceRef.current).catch(() => undefined);
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
        const msg = e instanceof Error ? e.message : "Couldn't plan the route.";
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

  /**
   * The road you're on from OpenStreetMap: the roads round each ~200 m square are
   * asked for once (Overpass, at most every 4 s) and kept; each fix picks yours from
   * them. Any failure just leaves the name and roundel as they were.
   */
  const lookUpRoad = useCallback((f: Fix) => {
    const cell = cellOf(f.at);
    const ways = roadCache.current.get(cell.key);
    if (ways) {
      const w = pickWay(ways, f.at, f.course ?? compassRef.current);
      const info = w ? roadInfo(w) : null;
      setOsmRoad((prev) => (prev?.wayId === info?.wayId ? prev : info));
      return;
    }
    if (roadLoading.current || !lookupDue(false, roadLookupAt.current, Date.now())) return;
    roadLoading.current = true;
    roadLookupAt.current = Date.now();
    fetchRoads(cell.centre)
      .then((list) => {
        if (list) remember(roadCache.current, cell.key, list);
      })
      .finally(() => {
        roadLoading.current = false;
      });
  }, []);

  const onFix = useCallback(
    (f: Fix) => {
      if (closed.current) return;
      fixRef.current = f;
      fixAt.current = Date.now();
      setFix(f);
      setReportCentre((c) => (!c || metresBetween(c, f.at) > 1500 ? f.at : c));
      lookUpRoad(f);
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
                .catch((e) => setDriveNote(e instanceof Error ? e.message : "Couldn't record the drive."));
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

      let reached = nextRef.current < stops.length ? reachedStop(stops, nextRef.current, f.at) : -1;
      // An address set back from the road: you reach the end of the route before you're within 80 m of the pin.
      if (reached < 0 && nextRef.current < stops.length && arrivedByRoute(a.stopAlong[nextRef.current], snap.along, snap.off, f.at, stops[nextRef.current])) {
        reached = nextRef.current;
      }
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
    [arrive, cameraAlerts, doRoute, detour, lookUpRoad, plan.driveId, say, simulate, stops, store],
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
        .catch((e) => setNotice(e instanceof Error ? e.message : "Couldn't send the report."));
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
    roads.answer(r.id, vote, fixRef.current?.at ?? null).catch((e) => setNotice(e instanceof Error ? e.message : "Couldn't send that."));
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
        { accuracy: Location.Accuracy.BestForNavigation, distanceInterval: 0, timeInterval: 1000 },
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
      // Closed (or sent to the background) while finding you: don't start a timer nothing will stop.
      if (closed.current || AppState.currentState !== 'active') return;
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
        setError("Couldn't read your location. Try again with a clear view of the sky.");
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
      buzz('success');
      setCheckedIn((c) => [...c, stop.id]);
      setCheckInAt(null);
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Couldn't check in.");
    }
  }

  // ---------------------------------------------------------------------------
  // Drawing
  // ---------------------------------------------------------------------------

  // The clock: ETA, "stopped" once fixes dry up, and going back to following you after a look round.
  useEffect(() => {
    const t = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const fixAge = fix ? nowMs - fixAt.current : Infinity;
  const speedNow = fix ? liveSpeed(fix.speed, fixAge) : null;
  const moving = isMoving(speedNow);
  const panOk = canPan(speedNow);

  useEffect(() => {
    if (recentreDue(pannedAt, nowMs, speedNow)) setPannedAt(null);
  }, [pannedAt, nowMs, speedNow]);

  const route = active?.route;
  const progress = hud?.progress;
  const routeRoad = route && progress ? roadOnRoute(route, progress) : null;

  // Off the route with no name from OpenStreetMap: the phone's geocoder, every 15 s or 150 m at most.
  useEffect(() => {
    if (!fix || routeRoad || osmRoad?.name) return;
    const now = Date.now();
    if (!nameLookupDue(nameLookup.current, fix.at, now)) return;
    nameLookup.current = { at: fix.at, t: now };
    let live = true;
    streetAt(fix.at).then((name) => live && setGeoStreet(name));
    return () => {
      live = false;
    };
  }, [fix, routeRoad, osmRoad]);

  // ---------------------------------------------------------------------------
  // Drawing
  // ---------------------------------------------------------------------------

  const mapStops = useMemo<DriveMapStop[]>(
    () =>
      stops.map((s, i) => ({
        id: s.id,
        at: s.at,
        glyph: s.role === 'checkpoint' ? 'drive' : plan.eventId ? 'cruise' : 'destination',
        colour: i < next ? COLOR.text.secondary : i === next ? COLOR.action.primary : COLOR.text.primary,
      })),
    [stops, next, plan.eventId],
  );
  // Less on the map: cameras only on the route ahead (within 2 miles), reports on the route and the few nearest you.
  const along = progress?.snap.along ?? 0;
  const alongBucket = Math.floor(along / 250);
  const mapCameras = useMemo(
    () =>
      active
        ? active.cameras.filter((c) => c.along >= alongBucket * 250 - 50 && c.along - alongBucket * 250 <= 3200).map((c) => ({ id: `${c.id}:${Math.round(c.along)}`, at: c.at }))
        : [],
    [active, alongBucket],
  );
  const reportCentreKey = fix ? `${fix.at.lat.toFixed(2)},${fix.at.lng.toFixed(2)}` : '';
  const mapReports = useMemo(() => {
    const ids = new Set(onRouteReports.map((x) => x.report.id));
    const here = fixRef.current?.at;
    const near = here
      ? roadReports
          .filter((r) => !ids.has(r.id) && metresBetween(here, r.at) <= 1500)
          .slice(0, 10)
      : [];
    return [
      ...onRouteReports.map((x) => ({ id: x.report.id, at: x.report.at, glyph: x.report.kind, onRoute: true })),
      ...near.map((r) => ({ id: r.id, at: r.at, glyph: r.kind, onRoute: false })),
    ];
    // Re-read when you've moved about a kilometre, not on every fix.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onRouteReports, roadReports, reportCentreKey]);

  const nextStop = next < stops.length ? stops[next] : null;
  const toNextStop =
    active && progress && nextStop && Number.isFinite(active.stopAlong[next]) ? Math.max(0, active.stopAlong[next] - progress.snap.along) : progress?.toLegEnd;
  const secsToNextStop =
    active && progress && nextStop && Number.isFinite(active.stopAlong[next])
      ? secondsBetween(active.route, progress.snap.along, active.stopAlong[next])
      : progress?.secondsToLegEnd;
  // On you; on the route only when you're moving along it and within a few metres (heading.ts).
  const focus = driveFocus(fix, progress?.snap);
  const mapHeading = cameraHeading(orientation, heading);
  const checkInStop = checkInAt !== null ? stops[checkInAt] : null;

  const banner = phase === 'driving' && route && progress ? bannerFor(route, progress) : null;
  let status: { arrow: string; title: string; distance?: string } | null = null;
  if (phase === 'arrived') status = { arrow: ARROWS.arrive, title: `You've arrived at ${stops[stops.length - 1].name}` };
  else if (phase === 'routing')
    status = { arrow: '…', title: legsDone && legsDone.total > 1 ? `Planning the route… ${legsDone.done} of ${legsDone.total} legs` : 'Planning the route…' };
  else if (phase === 'error') status = { arrow: '!', title: "Couldn't start navigation" };
  else if (phase === 'locating') status = { arrow: '…', title: 'Finding you…' };
  else if (!banner && route && progress) status = { arrow: ARROWS.straight, title: 'Follow the route', distance: formatDistance(progress.toEnd) };

  const roadName = routeRoad ?? osmRoad?.name ?? geoStreet;
  const limit = shownLimit(hud?.limit ?? null, osmRoad?.limit ?? null);
  const speedMph = mphOf(speedNow);
  const over = overLimit(speedNow, limit);
  const trip = phase === 'driving' && progress ? tripSummary(nowMs, progress.toEnd, progress.secondsToEnd) : null;

  // One alert at a time over the map: the zone you're in or coming to, else the next camera.
  let alertPill: string | null = null;
  if (hud?.zone) {
    alertPill = hud.zone.inside
      ? `AVG ZONE${hud.zone.zone.mph ? ` ${hud.zone.zone.mph}` : ''} · YOURS ${hud.zone.average ?? '–'} · ${formatDistance(hud.zone.zone.endAlong - along)} LEFT`
      : `AVG ZONE IN ${formatDistance(hud.zone.zone.startAlong - along)}${hud.zone.zone.mph ? ` · ${hud.zone.zone.mph} MPH` : ''}`;
  } else if (hud?.ahead[0]) {
    alertPill = `CAMERA IN ${formatDistance(hud.ahead[0].along - along)}${hud.ahead[0].mph ? ` · ${hud.ahead[0].mph} MPH` : ''}`;
  }
  const credits = [osmRoad ? OSM_CREDIT : null, cameraAlerts && mapCameras.length > 0 ? CAMERA_CREDIT : null].filter(Boolean).join(' · ');

  const toggleOrientation = () => {
    feel.tap();
    setSettings({ navMap: orientation === 'north' ? 'heading' : 'north' });
  };
  const toggleVoice = () => {
    const m = !muted;
    setMuted(m);
    if (m) stopSpeaking();
  };
  const onUserPan = useCallback(() => setPannedAt(Date.now()), []);
  const onPressYou = useCallback(() => {
    if (canPan(fixRef.current && Date.now() - fixAt.current < 4000 ? fixRef.current.speed : 0)) setIconOpen(true);
  }, []);
  const onLongPress = useCallback((at: LatLng) => {
    const you = fixRef.current?.at;
    if (you && metresBetween(you, at) <= 80) setIconOpen(true);
  }, []);

  const subLines = (
    <>
      {nextStop && stops.length - next > 1 && toNextStop !== undefined && secsToNextStop !== undefined && phase === 'driving' ? (
        <SubLine>
          Next: {nextStop.name} · {formatDistance(toNextStop)} · {etaClock(nowMs, secsToNextStop)}
        </SubLine>
      ) : null}
      {plan.driveId ? (
        <SubLine colour={driveNote?.startsWith('Drive complete') ? COLOR.state.success : undefined}>
          {driveNote ??
            (simulate ? "Demo drive: it doesn't count. Simulate the drive on its page to count it." : 'Pass every checkpoint in order and the drive counts.')}
        </SubLine>
      ) : null}
    </>
  );

  return (
    <View style={st.screen}>
      <DriveBanner top={insets.top} banner={banner} status={status} danger={over} />
      {alert ? <ReportAlert text={alert} /> : null}

      <View style={{ flex: 1 }}>
        <DriveMap
          route={route?.coords ?? []}
          stops={mapStops}
          cameras={cameraAlerts ? mapCameras : []}
          reports={mapReports}
          focus={focus}
          orientation={orientation}
          mapHeading={mapHeading}
          heading={heading}
          speed={speedNow}
          you={fix ? focus ?? fix.at : null}
          icon={icon}
          following={pannedAt == null}
          panEnabled={panOk}
          onUserPan={onUserPan}
          onPressYou={onPressYou}
          onLongPress={onLongPress}
        />
        <View pointerEvents="box-none" style={st.overlayTop}>
          <View pointerEvents="none" style={{ flex: 1, gap: SPACING.xs, alignItems: 'flex-start' }}>
            {alertPill ? <AlertPill text={alertPill} /> : null}
            {simulate ? (
              <View style={st.demo}>
                <DsText v="driveLabel" tone="action">
                  Demo drive · 4× speed
                </DsText>
              </View>
            ) : null}
          </View>
          <View style={{ gap: SPACING.sm }}>
            <MapButton
              onPress={toggleOrientation}
              label={orientation === 'north' ? 'North up. Switch to heading up' : 'Heading up. Switch to north up'}
            >
              <CompassGlyph mapHeading={mapHeading} mode={orientation} />
            </MapButton>
            <MapButton onPress={toggleVoice} label={muted ? 'Voice off. Turn voice on' : 'Voice on. Mute'} active={muted}>
              <SpeakerGlyph muted={muted} />
            </MapButton>
            {pannedAt != null ? (
              <MapButton onPress={() => setPannedAt(null)} label="Recentre on me" active>
                <RecentreGlyph />
              </MapButton>
            ) : null}
          </View>
        </View>
        <View pointerEvents="box-none" style={st.overlayBottom}>
          <ReportButton onPress={openReport} />
          {credits ? (
            <View pointerEvents="none" style={st.credit}>
              <DsText v="tag" tone="secondary" numberOfLines={2} style={{ textAlign: 'right', textTransform: 'none' }}>
                {credits}
              </DsText>
            </View>
          ) : null}
        </View>
        {notice ? (
          <View style={st.notice}>
            <DsText v="driveBody">{notice}</DsText>
          </View>
        ) : null}
      </View>

      {phase === 'error' ? (
        <View style={st.panel}>
          <DsText v="driveBody" accessibilityLiveRegion="polite">
            {error}
          </DsText>
          <Button block label="Try again" size="lg" onPress={retry} />
          <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
            <Button block label="Apple Maps" tier="secondary" style={{ flex: 1 }} onPress={() => openDirections('apple', stops[nextRef.current]?.at ?? stops[0].at)} />
            <Button block label="Google Maps" tier="secondary" style={{ flex: 1 }} onPress={() => openDirections('google', stops[nextRef.current]?.at ?? stops[0].at)} />
            <Button block label="Waze" tier="secondary" style={{ flex: 1 }} onPress={() => openDirections('waze', stops[nextRef.current]?.at ?? stops[0].at)} />
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
        <View style={[st.panel, { borderTopColor: COLOR.state.success }]}>
          <DsText v="driveBody">You're at {checkInStop.name}.</DsText>
          <Button block label={`Check in at ${checkInStop.name}`} size="lg" onPress={() => doCheckIn(checkInAt!)} />
          <Button block label="Not now" tier="secondary" size="lg" onPress={() => setCheckInAt(null)} />
        </View>
      ) : null}

      <DriveBar bottom={insets.bottom} road={roadName} speedMph={speedMph} over={over} limit={limit} trip={trip} sub={subLines} onEnd={end} />
      {gridOpen ? <ReportGrid onPick={pickReport} onClose={() => setGridOpen(false)} bottom={insets.bottom} /> : null}
      <IconPickerSheet
        visible={iconOpen}
        value={settings.navIcon}
        onChange={(v) => setSettings({ navIcon: v })}
        onClose={() => setIconOpen(false)}
        bottom={insets.bottom}
      />
    </View>
  );
}

const st = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLOR.surface.bg },
  centred: { alignItems: 'center', gap: SPACING.md, paddingHorizontal: SPACING.xl },
  panel: { backgroundColor: COLOR.surface.card, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, gap: SPACING.sm, borderTopWidth: 1, borderTopColor: COLOR.surface.border },
  overlayTop: { position: 'absolute', top: SPACING.sm, left: SPACING.sm, right: SPACING.sm, flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm },
  overlayBottom: { position: 'absolute', left: SPACING.sm, right: SPACING.sm, bottom: SPACING.sm, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: SPACING.sm },
  credit: { flexShrink: 1, backgroundColor: COLOR.surface.glass, borderRadius: RADII.tag, paddingHorizontal: SPACING.xs, paddingVertical: SPACING.xxs, marginLeft: 'auto' },
  demo: { backgroundColor: COLOR.surface.glass, borderRadius: RADII.tag, paddingHorizontal: SPACING.xs, paddingVertical: SPACING.xxs },
  notice: { position: 'absolute', left: SPACING.md, right: SPACING.md, bottom: 80, backgroundColor: COLOR.surface.glassRaised, borderRadius: RADII.card, padding: SPACING.md, borderWidth: 1, borderColor: COLOR.action.primary },
});
