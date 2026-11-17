import { memo, useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import type { LatLng } from '../lib/types';
import { C } from '../theme';
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
  cameras: { id: string; at: LatLng }[];
  /** Where to centre the camera (you), and which way is up. */
  focus: LatLng | null;
  heading: number;
  /** m/s: the map pulls back a little at speed. */
  speed: number | null;
  /** Draw "you" ourselves (the demo drive), instead of the phone's blue dot. */
  you?: LatLng | null;
}

const toCoords = (pts: LatLng[]) => pts.map((p) => ({ latitude: p.lat, longitude: p.lng }));

/**
 * The driving view's map: Apple Maps, dark, heading-up, following you. No
 * panning or zooming: there's nothing to do on the map while driving.
 */
export const DriveMap = memo(function DriveMap({ route, stops, cameras, focus, heading, speed, you }: DriveMapProps) {
  const map = useRef<MapView>(null);
  const line = useMemo(() => toCoords(route), [route]);
  const first = route[0] ?? focus ?? { lat: 52.5, lng: -1.5 };

  useEffect(() => {
    if (!focus) return;
    const v = speed != null && speed > 0 ? speed : 0;
    map.current?.animateCamera(
      { center: { latitude: focus.lat, longitude: focus.lng }, heading, pitch: 45, altitude: Math.min(1400, 450 + v * 25) },
      { duration: 900 },
    );
  }, [focus, heading, speed]);

  return (
    <View style={StyleSheet.absoluteFill}>
      <MapView
        ref={map}
        style={StyleSheet.absoluteFill}
        userInterfaceStyle="dark"
        initialCamera={{ center: { latitude: first.lat, longitude: first.lng }, heading: 0, pitch: 45, altitude: 900 }}
        showsUserLocation={!you}
        showsMyLocationButton={false}
        showsCompass={false}
        showsTraffic={false}
        showsPointsOfInterests={false}
        scrollEnabled={false}
        zoomEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
      >
        {line.length > 1 ? <Polyline coordinates={line} strokeColor={C.neon} strokeWidth={7} /> : null}
        {cameras.map((c) => (
          <Marker key={c.id} coordinate={{ latitude: c.at.lat, longitude: c.at.lng }} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
            <View style={st.camera} />
          </Marker>
        ))}
        {stops.map((s) => (
          <Marker key={s.id} coordinate={{ latitude: s.at.lat, longitude: s.at.lng }} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
            <Pin glyph={s.glyph} colour={s.colour} size={30} />
          </Marker>
        ))}
        {you ? (
          <Marker coordinate={{ latitude: you.lat, longitude: you.lng }} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
            <Pin glyph="you" colour={C.neon} size={30} />
          </Marker>
        ) : null}
      </MapView>
    </View>
  );
});

const st = StyleSheet.create({
  camera: { width: 12, height: 12, borderRadius: 6, backgroundColor: C.alert, borderWidth: 2, borderColor: C.chalk },
});
