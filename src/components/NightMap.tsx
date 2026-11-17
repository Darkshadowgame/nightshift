import MapView, { Circle, Marker, Polyline } from 'react-native-maps';
import { StyleSheet } from 'react-native';
import { C } from '../theme';
import { Pin } from './Pin';
import type { NightMapProps } from './mapTypes';

const MILE_M = 1609.34;

/** iPhone map: Apple Maps in dark mode, so no map key is needed. */
export function NightMap({ pins, paths = [], circles = [], centre, span = 0.6, onSelect, onLongPress, showsUser, picked }: NightMapProps) {
  return (
    <MapView
      style={StyleSheet.absoluteFill}
      userInterfaceStyle="dark"
      initialRegion={{ latitude: centre.lat, longitude: centre.lng, latitudeDelta: span, longitudeDelta: span * 1.2 }}
      showsUserLocation={showsUser}
      showsPointsOfInterests={false}
      showsCompass={false}
      pitchEnabled={false}
      onLongPress={onLongPress ? (e) => onLongPress({ lat: e.nativeEvent.coordinate.latitude, lng: e.nativeEvent.coordinate.longitude }) : undefined}
    >
      {circles.map((c) => (
        <Circle
          key={c.id}
          center={{ latitude: c.centre.lat, longitude: c.centre.lng }}
          radius={c.radiusMiles * MILE_M}
          strokeColor={`${c.colour}99`}
          fillColor={`${c.colour}1f`}
          strokeWidth={1.5}
        />
      ))}
      {paths.map((p) => (
        <Polyline
          key={p.id}
          coordinates={p.coords.map((x) => ({ latitude: x.lat, longitude: x.lng }))}
          strokeColor={p.colour}
          strokeWidth={4}
          lineDashPattern={p.dashed ? [8, 6] : undefined}
        />
      ))}
      {pins.map((p) => (
        <Marker
          key={p.id}
          coordinate={{ latitude: p.at.lat, longitude: p.at.lng }}
          onPress={() => onSelect?.(p.id)}
          tracksViewChanges={false}
          anchor={{ x: 0.5, y: 0.5 }}
          accessibilityLabel={p.title}
        >
          <Pin glyph={p.glyph} colour={p.colour} size={p.size ?? 36} />
        </Marker>
      ))}
      {picked ? (
        <Marker coordinate={{ latitude: picked.lat, longitude: picked.lng }} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
          <Pin glyph="you" colour={C.neon} size={40} />
        </Marker>
      ) : null}
    </MapView>
  );
}
