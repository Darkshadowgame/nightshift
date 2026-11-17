import { memo, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import MapView, { Circle, Marker, Polygon, Polyline } from 'react-native-maps';
import { StyleSheet, Text, View } from 'react-native';
import { BRAND, C, FONT_SCALE, RADIUS, SURFACE, TYPE } from '../theme';
import { pinLayer } from '../lib/hud';
import { PulseRing } from './motion';
import { Pin } from './Pin';
import type { MapCircle, MapPath, MapPin, MapPolygon, MapRegion, NightMapProps } from './mapTypes';
import type { LatLng } from '../lib/types';

const MILE_M = 1609.34;

/** Coordinates in the map's shape, worked out once per points array (the arrays are stable between renders). */
const coordCache = new WeakMap<readonly LatLng[], { latitude: number; longitude: number }[]>();
function toCoords(points: readonly LatLng[]) {
  let c = coordCache.get(points);
  if (!c) {
    c = points.map((x) => ({ latitude: x.lat, longitude: x.lng }));
    coordCache.set(points, c);
  }
  return c;
}

/**
 * One marker. Memoised on what it draws, so a new pins array (a pan, a new
 * event) only re-renders the markers that actually changed, and the coordinate
 * object stays the same unless the pin moved.
 */
const PinMarker = memo(
  function PinMarker({ pin, onSelect }: { pin: MapPin; onSelect: (id: string) => void }) {
    const coordinate = useMemo(() => ({ latitude: pin.at.lat, longitude: pin.at.lng }), [pin.at.lat, pin.at.lng]);
    const size = pin.size ?? 36;
    return (
      <Marker
        coordinate={coordinate}
        onPress={() => onSelect(pin.id)}
        tracksViewChanges={!!pin.live}
        zIndex={pinLayer(pin)}
        anchor={{ x: 0.5, y: 0.5 }}
        accessibilityLabel={pin.live ? `${pin.title}, live now` : pin.count ? `${pin.count} ${pin.title}. Zoom in` : pin.title}
      >
        {pin.live ? (
          <PulseRing live colour={pin.colour} size={size} pad>
            <Pin glyph={pin.glyph} colour={pin.colour} size={size} />
          </PulseRing>
        ) : (
          <Pin glyph={pin.glyph} colour={pin.colour} size={size} count={pin.count} badge={pin.badge} />
        )}
      </Marker>
    );
  },
  (a, b) =>
    a.onSelect === b.onSelect &&
    a.pin.id === b.pin.id &&
    a.pin.glyph === b.pin.glyph &&
    a.pin.colour === b.pin.colour &&
    a.pin.size === b.pin.size &&
    a.pin.live === b.pin.live &&
    a.pin.count === b.pin.count &&
    a.pin.badge === b.pin.badge &&
    a.pin.title === b.pin.title &&
    a.pin.at.lat === b.pin.at.lat &&
    a.pin.at.lng === b.pin.at.lng,
);

const PathLine = memo(function PathLine({ path }: { path: MapPath }) {
  return (
    <Polyline
      coordinates={toCoords(path.coords)}
      strokeColor={path.colour}
      strokeWidth={path.width ?? 4}
      lineDashPattern={path.dashed ? [8, 6] : undefined}
    />
  );
}, (a, b) => a.path.coords === b.path.coords && a.path.colour === b.path.colour && a.path.width === b.path.width && a.path.dashed === b.path.dashed);

const Ring = memo(function Ring({ c }: { c: MapCircle }) {
  const center = useMemo(() => ({ latitude: c.centre.lat, longitude: c.centre.lng }), [c.centre.lat, c.centre.lng]);
  return <Circle center={center} radius={c.radiusMiles * MILE_M} strokeColor={`${c.colour}99`} fillColor={`${c.colour}1f`} strokeWidth={1.5} />;
}, (a, b) => a.c.centre.lat === b.c.centre.lat && a.c.centre.lng === b.c.centre.lng && a.c.radiusMiles === b.c.radiusMiles && a.c.colour === b.c.colour);

const Outline = memo(function Outline({ p }: { p: MapPolygon }) {
  return <Polygon coordinates={toCoords(p.coords)} strokeColor={`${p.colour}99`} fillColor={`${p.colour}1f`} strokeWidth={1.5} />;
}, (a, b) => a.p.coords === b.p.coords && a.p.colour === b.p.colour);

/** iPhone map: Apple Maps in dark mode, so no map key is needed. */
export const NightMap = memo(function NightMap({
  ref, pins, paths = [], circles = [], polygons = [], centre, span = 0.6, onSelect, onLongPress, showsUser, picked, follow, recentreKey, onPressMap, onMoved,
  onRegion, credit,
}: NightMapProps) {
  const map = useRef<MapView>(null);
  /** The last region the map settled on, for the handle's region(). */
  const shown = useRef<MapRegion>({ centre, span });
  useImperativeHandle(ref, () => ({
    animateTo: (c, sp = span) =>
      map.current?.animateToRegion({ latitude: c.lat, longitude: c.lng, latitudeDelta: sp, longitudeDelta: sp * 1.2 }, 450),
    region: () => shown.current,
  }), [span]);
  // Markers get one stable press handler, so a new onSelect from the screen doesn't re-render them all.
  const selectRef = useRef(onSelect);
  selectRef.current = onSelect;
  const select = useMemo(() => (id: string) => selectRef.current?.(id), []);
  const first = useRef(true);
  // initialRegion only applies when the map mounts: move it when the place shown changes.
  const followKey = follow ? `${centre.lat},${centre.lng},${span}` : '';
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    map.current?.animateToRegion({ latitude: centre.lat, longitude: centre.lng, latitudeDelta: span, longitudeDelta: span * 1.2 }, 450);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [followKey, recentreKey]);
  // Tell the screen where the map starts, before the first pan or zoom.
  useEffect(() => {
    onRegion?.({ centre, span });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <View style={StyleSheet.absoluteFill}>
    <MapView
      ref={map}
      style={StyleSheet.absoluteFill}
      onPress={onPressMap ? (e) => {
        // iOS also reports taps on markers here; only a tap on the map itself counts.
        if (e.nativeEvent.action !== 'marker-press') onPressMap({ lat: e.nativeEvent.coordinate.latitude, lng: e.nativeEvent.coordinate.longitude });
      } : undefined}
      userInterfaceStyle="dark"
      initialRegion={{ latitude: centre.lat, longitude: centre.lng, latitudeDelta: span, longitudeDelta: span * 1.2 }}
      showsUserLocation={showsUser}
      showsMyLocationButton={false}
      onRegionChangeComplete={(r) => {
        shown.current = { centre: { lat: r.latitude, lng: r.longitude }, span: r.latitudeDelta };
        onMoved?.(shown.current.centre);
        onRegion?.(shown.current);
      }}
      // Traffic lines (red and amber) compete with cameras and events on a night map.
      showsTraffic={false}
      showsPointsOfInterests={false}
      showsCompass={false}
      pitchEnabled={false}
      onLongPress={onLongPress ? (e) => onLongPress({ lat: e.nativeEvent.coordinate.latitude, lng: e.nativeEvent.coordinate.longitude }) : undefined}
    >
      {polygons.map((p) => (
        <Outline key={p.id} p={p} />
      ))}
      {circles.map((c) => (
        <Ring key={c.id} c={c} />
      ))}
      {paths.map((p) => (
        <PathLine key={p.id} path={p} />
      ))}
      {pins.map((p) => (
        <PinMarker key={p.id} pin={p} onSelect={select} />
      ))}
      {picked ? (
        <Marker coordinate={{ latitude: picked.lat, longitude: picked.lng }} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
          <Pin glyph="you" colour={BRAND} size={40} />
        </Marker>
      ) : null}
    </MapView>
    {credit ? (
      <View pointerEvents="none" style={st.credit}>
        <Text style={st.creditText} maxFontSizeMultiplier={FONT_SCALE.chrome}>{credit}</Text>
      </View>
    ) : null}
    </View>
  );
});

const st = StyleSheet.create({
  credit: { position: 'absolute', right: 4, bottom: 4, backgroundColor: SURFACE.glass, borderRadius: RADIUS.tag, paddingHorizontal: 4, paddingVertical: 1 },
  creditText: { color: C.fog, fontSize: TYPE.micro },
});
