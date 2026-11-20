import { marksNearRoute } from '../lib/driveView';
import { OVERVIEW_PADDING } from './mapTypes';
import { memo, useEffect, useMemo, useRef } from 'react';
import { realNowMs } from '../lib/appClock';
import { Pressable, StyleSheet, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { iconRotation, type MapOrientation, type NavIconShape } from '../lib/driveView';
import { MAP_POIS, MAP_TYPE } from '../lib/mapAppearance';
import type { MapAppearance } from '../lib/sun';
import { CAMERA_JUMP_METRES, CAMERA_FOLLOW_MS, easeAngle, easeNumber, easeShare, predictAhead, roughMetres } from '../lib/heading';
import type { LatLng } from '../lib/types';
import { ART, BRAND, C, RADII, ROAD_COLOUR } from '../theme';

/** The route options you didn't pick, in the preview: grey under the chosen one. */
export const OTHER_ROUTE = ART.routeOther;
import { NavIcon } from './NavIcon';
import { DemoDriverIcon, useDemoDrivers } from './DemoDrivers';
import { Pin, type Glyph } from './Pin';

export interface DriveMapStop {
  id: string;
  at: LatLng;
  glyph: Glyph;
  colour: string;
}

export interface DriveMapProps {
  route: LatLng[];
  stops: DriveMapStop[];
  /** Cameras ahead on the route: drawn small. */
  cameras: { id: string; at: LatLng }[];
  /** Drivers' reports and closures on or near the route (roadReports.ts): drawn small. */
  reports?: { id: string; at: LatLng; glyph: Glyph; onRoute: boolean }[];
  /** Where the camera centres (you) while following. */
  focus: LatLng | null;
  orientation: MapOrientation;
  /** Which way the map's top faces: your heading (heading-up) or 0 (north-up). */
  mapHeading: number;
  /** Which way you're heading (eased: heading.ts), for your icon. */
  heading: number;
  /** m/s: the map pulls back a little at speed. */
  speed: number | null;
  /** Where to draw you (null before the first fix). */
  you: LatLng | null;
  icon: { shape: NavIconShape; hex: string; photo?: string | null };
  /** Light (day) or dark (night) map. Dark by default. */
  appearance?: MapAppearance;
  /**
   * The route preview before you start: every option (the chosen one drawn in the brand colour,
   * the others grey, tap one to pick it), and the map fitted to show them all.
   */
  overview?: { routes: LatLng[][]; selected: number; onSelect?: (i: number) => void; /** The routes are drawn and fitted on screen (the auto-start countdown waits for it). */ onShown?: () => void } | null;
  /** Following you; false while you look round the map (stopped only). */
  following: boolean;
  /** Panning and zooming allowed (only while stopped). */
  panEnabled: boolean;
  onUserPan?: () => void;
  /** Tapping your icon, or a long press next to it (stopped only): change the icon. */
  onPressYou?: () => void;
  onLongPress?: (at: LatLng) => void;
  /**
   * The screen's own map credit (roads, cameras): on web it joins the tile credit in the one chip
   * (Review 19: one credit chip per map). The iPhone's Apple map keeps its own legal label, so the
   * screen draws this one itself there.
   */
  credit?: string;
  /** Demo, Busy night only: made-up drivers move along the demo routes round this home area (labelled DEMO). */
  demoAround?: LatLng | null;
}

/** The camera loop's step (ms). */
const CAMERA_TICK_MS = 100;

const toCoords = (pts: LatLng[]) => pts.map((p) => ({ latitude: p.lat, longitude: p.lng }));

/**
 * The driving view's map: Apple Maps, dark, following you heading-up or
 * north-up. Stopped, you can look round (it comes back after a few seconds or
 * when you move off); moving, the map can't be touched.
 */
export const DriveMap = memo(function DriveMap({
  route,
  stops,
  cameras,
  reports = [],
  focus,
  orientation,
  mapHeading,
  heading,
  speed,
  you,
  icon,
  following,
  panEnabled,
  onUserPan,
  onPressYou,
  onLongPress,
  demoAround,
  appearance = 'dark',
  overview,
}: DriveMapProps) {
  const map = useRef<MapView>(null);
  const others = useDemoDrivers(demoAround);
  const line = useMemo(() => toCoords(route), [route]);
  const first = route[0] ?? focus ?? { lat: 52.5, lng: -1.5 };
  const northUp = orientation === 'north';

  // The camera runs its own steady loop (heading.ts, "camera's smoothing"): it eases towards the
  // latest fix and heading and guesses ahead between fixes, so the map glides instead of jumping
  // every time GPS or the compass updates. Nothing here re-renders React.
  const target = useRef({ focus, mapHeading, heading, speed, following, northUp, since: realNowMs() });
  const lastFocus = useRef<LatLng | null>(null);
  if (focus !== lastFocus.current) {
    lastFocus.current = focus;
    target.current.since = realNowMs();
  }
  target.current = { focus, mapHeading, heading, speed, following, northUp, since: target.current.since };

  useEffect(() => {
    let cam: { at: LatLng; heading: number; altitude: number; pitch: number } | null = null;
    let last = realNowMs();
    const id = setInterval(() => {
      const now = realNowMs();
      const dt = Math.min(500, now - last);
      last = now;
      const t = target.current;
      if (!t.focus || !t.following) {
        cam = null;
        return;
      }
      const v = t.speed != null && t.speed > 0 ? t.speed : 0;
      const want = predictAhead(t.focus, t.speed, t.heading, now - t.since);
      const altitude = Math.min(1400, 450 + v * 25);
      // Heading-up tilts the map so Apple's 3D buildings stand up ahead of you.
      const pitch = t.northUp ? 0 : 50;
      if (!cam || roughMetres(cam.at, want) > CAMERA_JUMP_METRES) {
        cam = { at: want, heading: t.mapHeading, altitude, pitch };
        map.current?.setCamera({ center: { latitude: want.lat, longitude: want.lng }, heading: cam.heading, pitch, altitude });
        return;
      }
      const k = easeShare(dt, CAMERA_FOLLOW_MS);
      cam = {
        at: { lat: cam.at.lat + (want.lat - cam.at.lat) * k, lng: cam.at.lng + (want.lng - cam.at.lng) * k },
        heading: easeAngle(cam.heading, t.mapHeading, dt),
        altitude: easeNumber(cam.altitude, altitude, dt, 1500),
        pitch: easeNumber(cam.pitch, pitch, dt, 300),
      };
      // Each step lasts one tick, so the steps join up into one smooth move.
      map.current?.animateCamera(
        { center: { latitude: cam.at.lat, longitude: cam.at.lng }, heading: cam.heading, pitch: cam.pitch, altitude: cam.altitude },
        { duration: CAMERA_TICK_MS },
      );
    }, CAMERA_TICK_MS);
    return () => clearInterval(id);
  }, []);

  // The preview: fit every option on screen (once per new set of routes, and when the pick changes).
  const fitKey = overview ? `${overview.routes.length}:${overview.routes.map((r) => r.length).join(',')}` : '';
  useEffect(() => {
    if (!overview) return;
    const all = overview.routes.flat();
    if (all.length < 2) return;
    // Every 8th point is plenty to fit the view.
    // Plus where you are: the "You" marker needn't sit on the route's first point.
    const pts = [...all.filter((_, i) => i % 8 === 0 || i === all.length - 1), ...(you ? [you] : []), ...marksNearRoute(all, cameras, reports)].map((p) => ({ latitude: p.lat, longitude: p.lng }));
    const t = setTimeout(() => map.current?.fitToCoordinates(pts, { edgePadding: { ...OVERVIEW_PADDING }, animated: true }), 50);
    // Fitted (the animation runs about half a second): the route is on screen.
    const shown = setTimeout(() => overview.onShown?.(), 650);
    return () => {
      clearTimeout(t);
      clearTimeout(shown);
    };
    // Fitted again once where you are is known (the first fix can come after the route).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitKey, !!you]);

  return (
    <View style={StyleSheet.absoluteFill}>
      <MapView
        ref={map}
        style={StyleSheet.absoluteFill}
        userInterfaceStyle={appearance}
        mapType={MAP_TYPE}
        showsBuildings
        initialCamera={{ center: { latitude: first.lat, longitude: first.lng }, heading: 0, pitch: 50, altitude: 900 }}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        // Apple's live traffic on the driving view (BACKLOG 3: "Live traffic from Apple's layer").
        // Tonight's map keeps it off (REVIEW-4 m16: it competes with the pins there).
        showsTraffic
        pointsOfInterestFilter={MAP_POIS}
        scrollEnabled={panEnabled}
        zoomEnabled={panEnabled}
        rotateEnabled={false}
        pitchEnabled={false}
        onPanDrag={panEnabled ? onUserPan : undefined}
        onRegionChange={(_r, details) => {
          if (panEnabled && details?.isGesture) onUserPan?.();
        }}
        onLongPress={panEnabled && onLongPress ? (e) => onLongPress({ lat: e.nativeEvent.coordinate.latitude, lng: e.nativeEvent.coordinate.longitude }) : undefined}
      >
        {overview
          ? overview.routes.map((r, i) =>
              i === overview.selected || r.length < 2 ? null : (
                <Polyline
                  key={`alt${i}`}
                  coordinates={toCoords(r)}
                  strokeColor={OTHER_ROUTE}
                  strokeWidth={7}
                  tappable={!!overview.onSelect}
                  onPress={() => overview.onSelect?.(i)}
                />
              ),
            )
          : null}
        {line.length > 1 ? <Polyline key={overview ? `sel${overview.selected}` : 'route'} coordinates={line} strokeColor={BRAND} strokeWidth={8} zIndex={2} /> : null}
        {cameras.map((c) => (
          <Marker key={c.id} coordinate={{ latitude: c.at.lat, longitude: c.at.lng }} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
            <View style={st.camera} />
          </Marker>
        ))}
        {reports.map((r) => (
          <Marker key={r.id} coordinate={{ latitude: r.at.lat, longitude: r.at.lng }} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
            <Pin glyph={r.glyph} colour={ROAD_COLOUR} size={r.onRoute ? 24 : 18} />
          </Marker>
        ))}
        {others.map((d) => (
          // Re-drawn when it turns (markers don't track their views).
          <Marker key={`${d.id}:${Math.round((d.heading - mapHeading) / 30)}`} coordinate={{ latitude: d.at.lat, longitude: d.at.lng }} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
            <DemoDriverIcon heading={d.heading - mapHeading} />
          </Marker>
        ))}
        {stops.map((s) => (
          <Marker key={s.id} coordinate={{ latitude: s.at.lat, longitude: s.at.lng }} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
            <Pin glyph={s.glyph} colour={s.colour} size={30} />
          </Marker>
        ))}
        {you && !following ? (
          <Marker
            coordinate={{ latitude: you.lat, longitude: you.lng }}
            anchor={{ x: 0.5, y: 0.5 }}
            zIndex={1000}
            onPress={onPressYou}
            accessibilityLabel="You. Stopped, tap to change your icon"
          >
            <NavIcon shape={icon.shape} colour={icon.hex} photo={icon.photo} size={50} rotation={iconRotation(heading, mapHeading)} />
          </Marker>
        ) : null}
      </MapView>
      {you && following ? (
        // Following, you're always where the camera centres: draw yourself there, fixed on screen,
        // so the icon glides with the map instead of hopping once a second as a map marker.
        <View pointerEvents="box-none" style={st.centre}>
          <Pressable onPress={onPressYou} hitSlop={12} accessibilityRole="button" accessibilityLabel="You. Tap to change your icon">
            <NavIcon shape={icon.shape} colour={icon.hex} photo={icon.photo} size={50} rotation={iconRotation(heading, mapHeading)} />
          </Pressable>
        </View>
      ) : null}
    </View>
  );
});

const st = StyleSheet.create({
  centre: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center' },
  camera: { width: 9, height: 9, borderRadius: RADII.pill, backgroundColor: C.alert, borderWidth: 1.5, borderColor: C.chalk },
});
