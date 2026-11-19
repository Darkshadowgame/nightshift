import { useEffect, useMemo, useRef, useState } from 'react';
import { realNowMs } from '../lib/appClock';
import { Pressable, StyleSheet, View } from 'react-native';
import type * as Leaflet from 'leaflet';
import { iconRotation } from '../lib/driveView';
import { CAMERA_FOLLOW_MS, CAMERA_JUMP_METRES, easeAngle, easeNumber, easeShare, predictAhead, roughMetres } from '../lib/heading';
import type { LatLng } from '../lib/types';
import { ART, BRAND, C, RADII, ROAD_COLOUR } from '../theme';
// Types only: on web './DriveMap' is this file, so values come from elsewhere.
import type { DriveMapProps } from './DriveMap';
import { OVERVIEW_PADDING } from './mapTypes';
import { NavIcon } from './NavIcon';
import { DEMO_DRIVER_LABEL, DEMO_DRIVER_SIZE, DemoDriverIcon, useDemoDrivers } from './DemoDrivers';
import { Pin } from './Pin';
import { Credit } from './webmap/Credit.web';
import { loadLeaflet, longPress, makeMap, type L } from './webmap/leaflet.web';
import { useMarkers, type MarkerSpec } from './webmap/PinMarker.web';
import { TILE_CREDIT } from './webmap/tiles.web';
import { altitudeToZoom } from './webmap/zoom.web';

/**
 * The driving view's map on web: Leaflet, dark, following you heading-up or north-up like the
 * iPhone's. Heading-up turns the whole map (a square the size of the screen's diagonal, so the
 * corners never show) and turns the pins back so they stay upright. Looking round the map
 * (stopped) goes north-up, so a drag moves the map the way your finger goes.
 * No tilt: the web map is flat. If Leaflet can't load, the screen stays plain asphalt.
 */
export function DriveMap(props: DriveMapProps) {
  const { route, stops, cameras, reports = [], focus, heading, mapHeading, you, icon, following, panEnabled, onPressYou, demoAround, appearance = 'dark', overview, credit } = props;
  const others = useDemoDrivers(demoAround);
  const [lf, setLf] = useState<{ L: L; map: Leaflet.Map } | null>(null);
  const [tiles, setTiles] = useState<string | null>(TILE_CREDIT);
  const outer = useRef<HTMLDivElement>(null);
  const turn = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const latest = useRef(props);
  latest.current = props;
  /** The map's turn on screen right now (degrees the top faces), for your icon when it's a marker. */
  const [shownTurn, setShownTurn] = useState(0);

  useEffect(() => {
    let gone = false;
    let made: ReturnType<typeof makeMap> | null = null;
    let hold: ReturnType<typeof longPress> | null = null;
    let frame = 0;
    let resize: ResizeObserver | null = null;
    const user = () => {
      if (latest.current.panEnabled) latest.current.onUserPan?.();
    };
    const pinch = (e: TouchEvent) => {
      if (e.touches.length > 1) user();
    };
    loadLeaflet().then((L) => {
      const el = box.current;
      const out = outer.current;
      if (gone || !el || !out) return;
      // Quarter zoom steps: each zoom change redraws the tiles, so it only changes when the speed does.
      made = makeMap(L, el, { zoomSnap: 0.25, onTiles: setTiles, appearance: latest.current.appearance ?? 'dark' });
      setAppearanceRef.current = made.setAppearance;
      const map = made.map;
      const p = latest.current;
      const first = p.route[0] ?? p.focus ?? { lat: 52.5, lng: -1.5 };
      map.setView([first.lat, first.lng], Math.round(altitudeToZoom(900, first.lat, out.clientHeight || 700) * 4) / 4, { animate: false });
      map.on('dragstart', user);
      el.addEventListener('wheel', user, { passive: true });
      el.addEventListener('touchstart', pinch, { passive: true });
      hold = longPress(map, (at) => {
        const q = latest.current;
        if (q.panEnabled) q.onLongPress?.({ lat: at.lat, lng: at.lng });
      });
      resize = new ResizeObserver(() => map.invalidateSize({ pan: false }));
      resize.observe(el);

      // The camera: the iPhone's loop (heading.ts, "camera's smoothing"), stepped every frame.
      let cam: { at: LatLng; zoom: number } | null = null;
      let rot = 0;
      let shown = 0;
      let last = performance.now();
      const step = (now: number) => {
        frame = requestAnimationFrame(step);
        const dt = Math.min(500, now - last);
        last = now;
        const t = latest.current;
        const following = !!t.focus && t.following;
        // Turn the map: towards your heading (heading-up) while following, north-up otherwise. The
        // first frame that follows you turns straight there, so the route never starts off sideways.
        rot = following && !cam ? t.mapHeading : easeAngle(rot, following ? t.mapHeading : 0, dt);
        const deg = ((rot % 360) + 360) % 360;
        if (turn.current) {
          turn.current.style.transform = `translate(-50%, -50%) rotate(${-deg}deg)`;
          turn.current.style.setProperty('--ns-counter', `${deg}deg`);
        }
        if (Math.abs(deg - shown) > 1) {
          shown = deg;
          setShownTurn(Math.round(deg));
        }
        if (!following || !t.focus) {
          cam = null;
          return;
        }
        if ((map as unknown as { _animatingZoom?: boolean })._animatingZoom) return;
        const v = t.speed != null && t.speed > 0 ? t.speed : 0;
        const want = predictAhead(t.focus, t.speed, t.heading, realNowMs() - since.current);
        const h = out.clientHeight || 700;
        const zoom = altitudeToZoom(Math.min(1400, 450 + v * 25), want.lat, h);
        if (!cam || roughMetres(cam.at, want) > CAMERA_JUMP_METRES) {
          cam = { at: want, zoom };
          map.setView([want.lat, want.lng], Math.round(zoom * 4) / 4, { animate: false });
          return;
        }
        const k = easeShare(dt, CAMERA_FOLLOW_MS);
        cam = {
          at: { lat: cam.at.lat + (want.lat - cam.at.lat) * k, lng: cam.at.lng + (want.lng - cam.at.lng) * k },
          zoom: easeNumber(cam.zoom, zoom, dt, 1500),
        };
        const z = Math.round(cam.zoom * 4) / 4;
        if (Math.abs(z - map.getZoom()) >= 0.25) map.setView([cam.at.lat, cam.at.lng], z, { animate: true });
        else map.setView([cam.at.lat, cam.at.lng], map.getZoom(), { animate: false });
      };
      frame = requestAnimationFrame(step);
      setLf({ L, map });
    }, () => undefined);
    return () => {
      gone = true;
      cancelAnimationFrame(frame);
      resize?.disconnect();
      hold?.remove();
      box.current?.removeEventListener('wheel', user);
      box.current?.removeEventListener('touchstart', pinch);
      made?.remove();
    };
  }, []);

  // Day or night tiles.
  const setAppearanceRef = useRef<((a: 'light' | 'dark') => void) | null>(null);
  useEffect(() => {
    setAppearanceRef.current?.(appearance);
  }, [lf, appearance]);

  // The preview: the options you didn't pick in grey (tap to pick), and every option fitted on screen.
  const altLines = useRef<Leaflet.Polyline[]>([]);
  useEffect(() => {
    for (const l of altLines.current) l.remove();
    altLines.current = [];
    if (!lf || !overview) return;
    overview.routes.forEach((r, i) => {
      if (i === overview.selected || r.length < 2) return;
      const l = lf.L.polyline(
        r.map((p) => [p.lat, p.lng] as [number, number]),
        { color: ART.routeOther, weight: 7, opacity: 0.9, lineCap: 'round', lineJoin: 'round', interactive: !!overview.onSelect },
      ).addTo(lf.map);
      l.on('click', () => overview.onSelect?.(i));
      l.bringToBack();
      altLines.current.push(l);
    });
    return () => {
      for (const l of altLines.current) l.remove();
      altLines.current = [];
    };
  }, [lf, overview]);
  const fitKey = overview ? `${overview.routes.length}:${overview.routes.map((r) => r.length).join(',')}` : '';
  useEffect(() => {
    if (!lf || !overview) return;
    const all = overview.routes.flat();
    if (all.length < 2) return;
    // The map is a square as big as the screen's diagonal (so it can turn): fit the routes into
    // the part that shows, by padding out the rest.
    const square = box.current;
    const view = outer.current;
    const padX = square && view ? Math.max(0, (square.clientWidth - view.clientWidth) / 2) : 0;
    const padY = square && view ? Math.max(0, (square.clientHeight - view.clientHeight) / 2) : 0;
    // Clear of the buttons down the right and the credit chip at the top left (Review 19).
    const pad = OVERVIEW_PADDING;
    lf.map.fitBounds(lf.L.latLngBounds(all.map((p) => [p.lat, p.lng] as [number, number])), {
      paddingTopLeft: [padX + pad.left, padY + pad.top],
      paddingBottomRight: [padX + pad.right, padY + pad.bottom],
      animate: false,
    });
    // Drawn and fitted: the next frame shows it (the auto-start countdown waits for this).
    const frame = requestAnimationFrame(() => overview.onShown?.());
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lf, fitKey]);

  // When the latest fix arrived, for guessing ahead between fixes.
  const since = useRef(realNowMs());
  const lastFocus = useRef<LatLng | null>(null);
  if (focus !== lastFocus.current) {
    lastFocus.current = focus;
    since.current = realNowMs();
  }

  // Look round only while stopped.
  useEffect(() => {
    if (!lf) return;
    const m = lf.map;
    for (const h of [m.dragging, m.touchZoom, m.scrollWheelZoom, m.doubleClickZoom, m.keyboard]) {
      if (panEnabled) h.enable();
      else h.disable();
    }
  }, [lf, panEnabled]);

  // The route still to drive (drive.tsx passes only the way ahead): one line, its points updated.
  const line = useRef<Leaflet.Polyline | null>(null);
  useEffect(() => {
    if (!lf) return;
    line.current = lf.L.polyline([], { color: BRAND, weight: 8, lineCap: 'round', lineJoin: 'round', interactive: false }).addTo(lf.map);
    return () => {
      line.current?.remove();
      line.current = null;
    };
  }, [lf]);
  useEffect(() => {
    line.current?.setLatLngs(route.length >= 2 ? route.map((p) => [p.lat, p.lng] as [number, number]) : []);
  }, [lf, route]);

  const specs = useMemo<MarkerSpec[]>(() => {
    const out: MarkerSpec[] = [];
    for (const c of cameras) out.push({ id: `cam:${c.id}`, lat: c.at.lat, lng: c.at.lng, size: 12, z: 0, face: <View style={st.camera} /> });
    for (const r of reports) {
      const size = r.onRoute ? 24 : 18;
      out.push({ id: `rep:${r.id}`, lat: r.at.lat, lng: r.at.lng, size, z: 1, face: <Pin glyph={r.glyph} colour={ROAD_COLOUR} size={size} /> });
    }
    for (const d of others)
      out.push({ id: `demo:${d.id}`, lat: d.at.lat, lng: d.at.lng, size: DEMO_DRIVER_SIZE, z: 1, label: DEMO_DRIVER_LABEL, face: <DemoDriverIcon heading={d.heading - mapHeading} /> });
    for (const s of stops) out.push({ id: `stop:${s.id}`, lat: s.at.lat, lng: s.at.lng, size: 30, z: 2, face: <Pin glyph={s.glyph} colour={s.colour} size={30} /> });
    if (you && !following)
      out.push({
        id: 'you',
        lat: you.lat,
        lng: you.lng,
        size: 50,
        z: 9,
        label: 'You. Stopped, tap to change your icon',
        onClick: () => latest.current.onPressYou?.(),
        face: <NavIcon shape={icon.shape} colour={icon.hex} photo={icon.photo} size={50} rotation={iconRotation(heading, shownTurn)} />,
      });
    return out;
  }, [cameras, reports, others, mapHeading, stops, you, following, icon.shape, icon.hex, icon.photo, heading, shownTurn]);
  const { portals } = useMarkers(lf, specs);

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: C.asphalt, overflow: 'hidden' }]}>
      <div ref={outer} style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {/* A square as big as the screen's diagonal, so turning it never shows a corner. */}
        <div
          ref={turn}
          style={{ position: 'absolute', left: '50%', top: '50%', width: '142vmax', height: '142vmax', transform: 'translate(-50%, -50%)', background: appearance === 'light' ? ART.mapBgLight : ART.mapBg }}
        >
          <div ref={box} style={{ position: 'absolute', inset: 0 }} />
        </div>
      </div>
      {portals}
      {you && following ? (
        // Following, you're always where the camera centres: drawn fixed on screen, like the iPhone.
        <View pointerEvents="box-none" style={st.centre}>
          <Pressable onPress={onPressYou} hitSlop={12} accessibilityRole="button" accessibilityLabel="You. Tap to change your icon">
            <NavIcon shape={icon.shape} colour={icon.hex} photo={icon.photo} size={50} rotation={iconRotation(heading, mapHeading)} />
          </Pressable>
        </View>
      ) : null}
      {/* One chip: the tiles' credit and the screen's (roads, cameras), top left, clear of the route's fit. */}
      {/* Both lines whole (Credit's own merge drops a second OpenStreetMap holder such as OSRM); short form, full on tap. */}
      <Credit top tiles={credit ? null : tiles} credit={credit ? [tiles, credit].filter(Boolean).join(' · ') : undefined} />
    </View>
  );
}

const st = StyleSheet.create({
  centre: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center' },
  camera: { width: 9, height: 9, borderRadius: RADII.pill, backgroundColor: C.alert, borderWidth: 1.5, borderColor: C.chalk },
});
