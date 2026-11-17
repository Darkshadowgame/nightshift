import { milesBetween } from './geo';
import type { LatLng, NightEvent } from './types';

/**
 * The sample scene is drawn once, round a made-up origin, then moved onto the
 * person's (already fuzzed) home area: every point keeps its distance and
 * direction from home. Sample stops get neutral names until the phone's
 * geocoder names them (see applySceneNames).
 */

const MILES_PER_DEG_LAT = 69.05;
const cosLat = (lat: number) => Math.cos((lat * Math.PI) / 180);
const round4 = (n: number) => Math.round(n * 10_000) / 10_000;

/** Move `p` from round `origin` to round `home`, keeping miles north and east. */
export function translate(p: LatLng, origin: LatLng, home: LatLng): LatLng {
  const north = (p.lat - origin.lat) * MILES_PER_DEG_LAT;
  const east = (p.lng - origin.lng) * MILES_PER_DEG_LAT * cosLat(p.lat);
  const lat = home.lat + north / MILES_PER_DEG_LAT;
  return { lat: round4(lat), lng: round4(home.lng + east / (MILES_PER_DEG_LAT * cosLat(lat))) };
}

/** The `n` places nearest to `home`, nearest first. */
export function nearest<T extends { at: LatLng }>(items: T[], home: LatLng, n = 1): T[] {
  return [...items].sort((a, b) => milesBetween(a.at, home) - milesBetween(b.at, home)).slice(0, n);
}

/** Same place, to about 10 m: has the home area changed enough to redraw the scene? */
export function sameHome(a: LatLng | undefined, b: LatLng): boolean {
  return !!a && Math.abs(a.lat - b.lat) < 0.0001 && Math.abs(a.lng - b.lng) < 0.0001;
}

/**
 * Names the geocoder found for sample stops, by stop id, plus `area:<eventId>`
 * for rough-area names. Only stops still at their seeded place and still with
 * their neutral seeded name are renamed, so a host's own edits are kept.
 */
export type SceneNames = Record<string, string>;

export function applySceneNames(
  events: NightEvent[],
  names: SceneNames,
  seeded: Map<string, { name: string; at?: LatLng; areaName: string }>,
): NightEvent[] {
  return events.map((e) => {
    let changed = false;
    const stops = e.stops.map((st) => {
      const orig = seeded.get(st.id);
      const name = names[st.id];
      if (!orig || !name || st.name !== orig.name) return st;
      if (orig.at && st.at && (orig.at.lat !== st.at.lat || orig.at.lng !== st.at.lng)) return st;
      changed = true;
      return { ...st, name: orig.name.includes(': ') ? `${orig.name.split(': ')[0]}: ${name}` : name };
    });
    const areaName = names[`area:${e.id}`];
    const firstStop = e.stops[0] ? seeded.get(e.stops[0].id) : undefined;
    const renameArea = !!areaName && !!firstStop && e.areaName === firstStop.areaName;
    if (!changed && !renameArea) return e;
    return { ...e, stops, ...(renameArea ? { areaName } : {}) };
  });
}

/** Seeded stops the geocoder still has to name: id and place. */
export function stopsToName(events: NightEvent[], seeded: Map<string, { name: string; at?: LatLng }>, names: SceneNames): { id: string; at: LatLng }[] {
  const out: { id: string; at: LatLng }[] = [];
  for (const e of events) {
    for (const st of e.stops) {
      const orig = seeded.get(st.id);
      if (orig?.at && st.at && !names[st.id] && st.name === orig.name) out.push({ id: st.id, at: st.at });
    }
  }
  return out;
}
