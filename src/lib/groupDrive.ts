import { APP_SCHEME } from './events';
import { pathMiles } from './spots';
import type { LatLng, Spot } from './types';

/**
 * Group drive, the smallest honest version: the leader shares the drive with regroup points
 * through the share sheet (into any chat or group). It does not track anyone, so there is no
 * "lost the pack" alert: that needs live location on a server, which Slipstream does not keep.
 */
export interface RegroupPoint {
  /** 1-based checkpoint number. */
  checkpoint: number;
  /** Miles from the start. */
  mile: number;
}

/** One regroup point about every `every` miles, never at the start or the finish. */
export function regroupPoints(path: readonly LatLng[], every = 10): RegroupPoint[] {
  if (path.length < 3) return [];
  const out: RegroupPoint[] = [];
  let sofar = 0;
  let last = 0;
  const total = pathMiles([...path]);
  for (let i = 1; i < path.length - 1; i++) {
    sofar += pathMiles([path[i - 1], path[i]]);
    if (sofar - last >= every && total - sofar >= every / 2) {
      out.push({ checkpoint: i + 1, mile: Math.round(sofar) });
      last = sofar;
    }
  }
  return out;
}

export function groupDriveLink(spotId: string): string {
  return `${APP_SCHEME}://spot/${spotId}`;
}

export function groupDriveShare(spot: Spot): { title: string; text: string; url: string } {
  const path = spot.path ?? [];
  const miles = pathMiles([...path]);
  const stops = regroupPoints(path);
  const regroup = stops.length ? `Regroup at checkpoint ${stops.map((s) => `${s.checkpoint} (mile ${s.mile})`).join(', ')}.` : 'A short one: meet at the finish.';
  return {
    title: spot.name,
    text: `Group drive: ${spot.name}, ${miles.toFixed(1)} mi. ${regroup} If you lose the pack, head for the next regroup point.`,
    url: groupDriveLink(spot.id),
  };
}
