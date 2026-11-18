import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { busyDrivers } from '../data/busyNight';
import { appNow } from '../lib/appClock';
import type { LatLng } from '../lib/types';
import { COLOR } from '../theme';
import { DsText } from './ds/Text';
import { NavIcon } from './NavIcon';

/** How often the demo drivers move on (ms). */
const STEP_MS = 2000;

export type DemoDriver = { id: string; at: LatLng; heading: number };

/**
 * Settings › Demo › Busy night only: a few made-up drivers moving along the demo routes in the
 * driving view, so it looks like a busy night. `around`: the demo's home area, or null for none.
 * They're never real people and never sent anywhere.
 */
export function useDemoDrivers(around: LatLng | null | undefined): DemoDriver[] {
  const [list, setList] = useState<DemoDriver[]>([]);
  const key = around ? `${around.lat},${around.lng}` : '';
  useEffect(() => {
    if (!around) {
      setList([]);
      return;
    }
    const step = () => setList(busyDrivers(around, appNow()));
    step();
    const t = setInterval(step, STEP_MS);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return list;
}

export const DEMO_DRIVER_SIZE = 40;
export const DEMO_DRIVER_LABEL = 'Demo driver, made up for the busy night';

/** A demo driver: a small grey icon, labelled DEMO so it never passes for a real person. */
export function DemoDriverIcon({ heading }: { heading: number }) {
  return (
    <View style={st.box} accessibilityLabel={DEMO_DRIVER_LABEL}>
      <NavIcon shape="hatch" colour={COLOR.text.secondary} size={24} rotation={heading} />
      <DsText v="tag" tone="secondary">
        Demo
      </DsText>
    </View>
  );
}

const st = StyleSheet.create({
  box: { width: DEMO_DRIVER_SIZE, height: DEMO_DRIVER_SIZE, alignItems: 'center', justifyContent: 'center' },
});
