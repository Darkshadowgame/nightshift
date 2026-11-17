import { memo, useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { iconRotation, type MapOrientation, type NavIconShape } from '../lib/driveView';
import type { LatLng } from '../lib/types';
import { BRAND, C, ROAD_COLOUR } from '../theme';
import { NavIcon } from './NavIcon';
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
  icon: { shape: NavIconShape; hex: string };
  /** Following you; false while you look round the map (stopped only). */
  following: boolean;
  /** Panning and zooming allowed (only while stopped). */
  panEnabled: boolean;
  onUserPan?: () => void;
  /** Tapping your icon, or a long press next to it (stopped only): change the icon. */
  onPressYou?: () => void;
  onLongPress?: (at: LatLng) => void;
}

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
}: DriveMapProps) {
  const map = useRef<MapView>(null);
  const line = useMemo(() => toCoords(route), [route]);
  const first = route[0] ?? focus ?? { lat: 52.5, lng: -1.5 };
  const northUp = orientation === 'north';

  useEffect(() => {
    if (!focus || !following) return;
    const v = speed != null && speed > 0 ? speed : 0;
    map.current?.animateCamera(
      {
        center: { latitude: focus.lat, longitude: focus.lng },
        heading: mapHeading,
        pitch: northUp ? 0 : 45,
        altitude: Math.min(1400, 450 + v * 25),
      },
      // Heading changes come eased, a few a second (heading.ts): short moves keep up without spinning.
      { duration: 600 },
    );
  }, [focus, mapHeading, speed, following, northUp]);

  return (
    <View style={StyleSheet.absoluteFill}>
      <MapView
        ref={map}
        style={StyleSheet.absoluteFill}
        userInterfaceStyle="dark"
        initialCamera={{ center: { latitude: first.lat, longitude: first.lng }, heading: 0, pitch: 45, altitude: 900 }}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        showsTraffic={false}
        showsPointsOfInterests={false}
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
        {line.length > 1 ? <Polyline coordinates={line} strokeColor={BRAND} strokeWidth={8} /> : null}
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
        {stops.map((s) => (
          <Marker key={s.id} coordinate={{ latitude: s.at.lat, longitude: s.at.lng }} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
            <Pin glyph={s.glyph} colour={s.colour} size={30} />
          </Marker>
        ))}
        {you ? (
          <Marker
            coordinate={{ latitude: you.lat, longitude: you.lng }}
            anchor={{ x: 0.5, y: 0.5 }}
            zIndex={1000}
            onPress={onPressYou}
            accessibilityLabel="You. Stopped, tap to change your icon"
          >
            <NavIcon shape={icon.shape} colour={icon.hex} size={50} rotation={iconRotation(heading, mapHeading)} />
          </Marker>
        ) : null}
      </MapView>
    </View>
  );
});

const st = StyleSheet.create({
  camera: { width: 9, height: 9, borderRadius: 4.5, backgroundColor: C.alert, borderWidth: 1.5, borderColor: C.chalk },
});
