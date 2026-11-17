import { StyleSheet, View } from 'react-native';
import { C } from '../theme';
import type { DriveMapProps } from './DriveMap';

/** Web preview: no map (the driving view needs the iPhone app). */
export function DriveMap(_props: DriveMapProps) {
  return <View style={[StyleSheet.absoluteFill, { backgroundColor: C.asphalt }]} />;
}
