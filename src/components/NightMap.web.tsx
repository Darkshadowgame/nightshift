import { useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type * as Leaflet from 'leaflet';
import { pinLayer } from '../lib/hud';
import type { LatLng } from '../lib/types';
import { ART, BRAND } from '../theme';
import { Pin } from './Pin';
import { type MapCircle, type MapPath, type MapPolygon, type MapRegion, type NightMapProps } from './mapTypes';
import { Credit } from './webmap/Credit.web';
import { GridMap } from './webmap/GridMap.web';
import { loadLeaflet, longPress, makeMap, type L } from './webmap/leaflet.web';
import { PinFace, pinBox, pinLabel, useMarkers, type MarkerSpec } from './webmap/PinMarker.web';
import { TILE_CREDIT } from './webmap/tiles.web';
import { fitZoom } from './webmap/zoom.web';

const MILE_M = 1609.34;

/** The edge fade for small maps: fully clear for the first 3 px, solid by 18 px, on all four sides. */
const EDGE_FADE = 'transparent 0, transparent 3px, #000 18px, #000 calc(100% - 18px), transparent calc(100% - 3px), transparent 100%';
const EDGE_MASK = {
  maskImage: `linear-gradient(to bottom, ${EDGE_FADE}), linear-gradient(to right, ${EDGE_FADE})`,
  WebkitMaskImage: `linear-gradient(to bottom, ${EDGE_FADE}), linear-gradient(to right, ${EDGE_FADE})`,
  maskComposite: 'intersect',
  WebkitMaskComposite: 'source-in',
} as const;
const ll = (p: LatLng): [number, number] => [p.lat, p.lng];

/** What a Leaflet map shows now, in the app's terms. */
function regionOf(map: Leaflet.Map): MapRegion {
  const c = map.getCenter();
  const b = map.getBounds();
  return { centre: { lat: c.lat, lng: c.lng }, span: b.getNorth() - b.getSouth() };
}

/**
 * Web map: a real dark map (Leaflet + CARTO Dark Matter, tinted like Apple's dark map), with
 * the iPhone's pins, clusters, routes and outlines drawn the same. Honours the whole
 * NightMapProps contract. Falls back to the grid when Leaflet or the tiles can't load.
 */
export function NightMap(props: NightMapProps) {
  const [lf, setLf] = useState<{ L: L; map: Leaflet.Map } | null>(null);
  const [broken, setBroken] = useState(false);
  const [tiles, setTiles] = useState<string | null>(TILE_CREDIT);
  /** A tall map is a full-screen one with a sheet over its bottom: its credit goes top left so it stays visible. */
  const [tall, setTall] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const { ref, pins, paths = [], circles = [], polygons = [], centre, span = 0.6, onSelect, picked, follow, recentreKey, credit, appearance = 'dark' } = props;
  const setAppearanceRef = useRef<((a: 'light' | 'dark') => void) | null>(null);

  // Callbacks change every render on most screens: read them through a ref so Leaflet's handlers stay put.
  const latest = useRef(props);
  latest.current = props;
  const shown = useRef<MapRegion>({ centre, span });

  const goTo = (map: Leaflet.Map, c: LatLng, sp: number, animate: boolean) => {
    const s = map.getSize();
    // Fit the region into the part of the map nothing covers (Tonight's sheet over its bottom).
    const top = latest.current.padding?.top ?? 0;
    const bottom = latest.current.padding?.bottom ?? 0;
    const open = s.y - top - bottom;
    const fitted = open >= 40 ? { w: s.x, h: open } : { w: s.x, h: s.y };
    const z = fitZoom({ centre: c, span: sp }, fitted, { min: map.getMinZoom(), max: map.getMaxZoom() });
    // Then shift the view so the region's centre sits in the middle of that part.
    let target = ll(c);
    if (open >= 40 && (top || bottom)) {
      const p = map.project(target, z).add([0, (bottom - top) / 2]);
      const u = map.unproject(p, z);
      target = [u.lat, u.lng];
    }
    if (animate) map.flyTo(target, z, { duration: 0.45 });
    else map.setView(target, z, { animate: false });
  };

  // Make the map once.
  useEffect(() => {
    let gone = false;
    let made: ReturnType<typeof makeMap> | null = null;
    let hold: ReturnType<typeof longPress> | null = null;
    let resize: ResizeObserver | null = null;
    // Tell the screen where the map starts, before the first pan or zoom (as the iPhone map does).
    latest.current.onRegion?.({ centre, span });
    loadLeaflet().then(
      (L) => {
        const el = box.current;
        if (gone || !el) return;
        made = makeMap(L, el, { onTiles: setTiles, appearance: latest.current.appearance ?? 'dark' });
        setAppearanceRef.current = made.setAppearance;
        const map = made.map;
        let sized = el.clientWidth > 0 && el.clientHeight > 0;
        let touched = false;
        map.on('moveend', () => {
          shown.current = regionOf(map);
          latest.current.onMoved?.(shown.current.centre);
          latest.current.onRegion?.(shown.current);
        });
        map.on('dragstart zoomstart', () => {
          touched = true;
        });
        map.on('click', (e: Leaflet.LeafletMouseEvent) => {
          if (hold?.justHeld()) return;
          latest.current.onPressMap?.({ lat: e.latlng.lat, lng: e.latlng.lng });
        });
        hold = longPress(map, (at) => latest.current.onLongPress?.({ lat: at.lat, lng: at.lng }));
        // Where the screen wants it now (the props may have moved while Leaflet loaded).
        goTo(map, latest.current.centre, latest.current.span ?? 0.6, false);
        lastMove.current = moveKeyRef.current;
        resize = new ResizeObserver(() => {
          map.invalidateSize({ pan: false });
          // Laid out after the map was made (a tab that opened hidden): fit the region now.
          if (!sized && el.clientWidth > 0 && el.clientHeight > 0) {
            sized = true;
            if (!touched) goTo(map, latest.current.centre, latest.current.span ?? 0.6, false);
          }
        });
        resize.observe(el);
        setLf({ L, map });
      },
      () => !gone && setBroken(true),
    );
    return () => {
      gone = true;
      resize?.disconnect();
      hold?.remove();
      made?.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Day or night tiles.
  useEffect(() => {
    setAppearanceRef.current?.(appearance);
  }, [lf, appearance]);

  useImperativeHandle(
    ref,
    () => ({
      animateTo: (c, sp = span) => {
        if (lf) goTo(lf.map, c, sp, true);
      },
      region: () => (lf ? regionOf(lf.map) : shown.current),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lf, span],
  );

  // Like the iPhone map: the props only set where it opens, unless `follow` is on or `recentreKey` changes.
  const followKey = follow ? `${centre.lat},${centre.lng},${span}` : '';
  const moveKey = `${followKey}|${recentreKey ?? ''}`;
  const lastMove = useRef(moveKey);
  const moveKeyRef = useRef(moveKey);
  moveKeyRef.current = moveKey;
  useEffect(() => {
    if (!lf || lastMove.current === moveKey) return;
    lastMove.current = moveKey;
    goTo(lf.map, centre, span, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moveKey, lf]);

  useShapes(lf, paths, circles, polygons);

  const specs = useMemo<MarkerSpec[]>(() => {
    const out: MarkerSpec[] = pins.map((p) => ({
      id: p.id,
      lat: p.at.lat,
      lng: p.at.lng,
      size: pinBox(p),
      z: pinLayer(p),
      label: pinLabel(p),
      onClick: () => latest.current.onSelect?.(p.id),
      face: <PinFace pin={p} />,
    }));
    if (picked) out.push({ id: '__picked', lat: picked.lat, lng: picked.lng, size: 40, z: 9, face: <Pin glyph="you" colour={BRAND} size={40} /> });
    return out;
    // onSelect is read through `latest`; a new handler needn't redraw the pins.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pins, picked?.lat, picked?.lng, !!onSelect]);
  const { portals } = useMarkers(lf, specs);

  if (broken) return <GridMap {...props} />;
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: ART.mapBg }]} onLayout={(e) => setTall(e.nativeEvent.layout.height > 420)}>
      {/* A small map's tiles fade out at every edge into its frame (a CSS mask, Review 20 #4/#16): a road
          shield or label cut by the edge melts away instead of showing as a white sliver (Review 19 #5, #21). */}
      <div ref={box} style={{ position: 'absolute', inset: 0, ...(tall ? null : EDGE_MASK) }} />
      {portals}
      <Credit credit={credit} tiles={tiles} top={tall} />
    </View>
  );
}

/** Paths, circles and outlines, redrawn only when one of them changes (the same tests as the iPhone map). */
function useShapes(lf: { L: L; map: Leaflet.Map } | null, paths: MapPath[], circles: MapCircle[], polygons: MapPolygon[]) {
  const drawn = useRef(new Map<string, { key: unknown[]; layer: Leaflet.Layer }>());
  useEffect(() => {
    if (!lf) return;
    const { L, map } = lf;
    const want = new Map<string, { key: unknown[]; make: () => Leaflet.Layer }>();
    for (const p of polygons)
      want.set(`g:${p.id}`, {
        key: [p.coords, p.colour],
        make: () => L.polygon(p.coords.map(ll), { color: p.colour, opacity: 0.6, weight: 1.5, fillColor: p.colour, fillOpacity: 0.12, interactive: false }),
      });
    for (const c of circles)
      want.set(`c:${c.id}`, {
        key: [c.centre.lat, c.centre.lng, c.radiusMiles, c.colour],
        make: () => L.circle(ll(c.centre), { radius: c.radiusMiles * MILE_M, color: c.colour, opacity: 0.6, weight: 1.5, fillColor: c.colour, fillOpacity: 0.12, interactive: false }),
      });
    for (const p of paths)
      want.set(`p:${p.id}`, {
        key: [p.coords, p.colour, p.width, p.dashed],
        make: () =>
          L.polyline(p.coords.map(ll), { color: p.colour, weight: p.width ?? 4, dashArray: p.dashed ? '8 6' : undefined, lineCap: 'round', lineJoin: 'round', interactive: false }),
      });
    for (const [id, d] of drawn.current) {
      const w = want.get(id);
      if (!w || w.key.some((k, i) => k !== d.key[i])) {
        d.layer.remove();
        drawn.current.delete(id);
      }
    }
    // Outlines under circles under paths, in the order given (as on the iPhone).
    for (const [id, w] of want) {
      if (drawn.current.has(id)) continue;
      const layer = w.make().addTo(map);
      drawn.current.set(id, { key: w.key, layer });
    }
  }, [lf, paths, circles, polygons]);
}
