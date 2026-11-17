import { activeStopIndex, canSeeStop } from './events';
import type { NavStop } from './nav';
import type { Crew, LatLng, NightEvent, Spot } from './types';

/**
 * What "Start navigation" routes through, from the screen it was started on.
 * Only places you can already see on that screen go in: an event's visible
 * stops (for a rolling meet only the stop it's at now, once revealed to you),
 * a drive's start and checkpoints, or one place.
 */

/** How the driving view finds its plan: passed as route params. */
export type NavTarget =
  | { kind: 'event'; id: string }
  | { kind: 'spot'; id: string }
  | { kind: 'place'; name: string; lat: number; lng: number };

export interface NavPlan {
  title: string;
  stops: NavStop[];
  /** Events: the event; drives: the spot. */
  eventId?: string;
  driveId?: string;
}

export function planForEvent(ev: NightEvent, me: string, crews: Crew[], now: Date): NavPlan | null {
  if (ev.cancelled) return null;
  const active = activeStopIndex(ev);
  const indices =
    ev.type === 'rolling'
      ? [active].filter((i) => canSeeStop(ev, i, me, crews, now))
      : ev.stops.map((_, i) => i).filter((i) => canSeeStop(ev, i, me, crews, now));
  const stops: NavStop[] = indices.flatMap((i) => {
    const st = ev.stops[i];
    if (!st?.at) return [];
    return [{ id: st.id, name: st.name, at: st.at, role: 'stop' as const, eventStop: i, checkIn: i === active }];
  });
  if (stops.length === 0) return null;
  stops[stops.length - 1] = { ...stops[stops.length - 1], role: 'destination' };
  return { title: ev.title, stops, eventId: ev.id };
}

/** A drive: to the start, then through every checkpoint. Any other place: straight there. */
export function planForSpot(spot: Spot): NavPlan | null {
  if (spot.status !== 'approved') return null;
  if (spot.kind === 'drive' && spot.path && spot.path.length > 1) {
    const last = spot.path.length - 1;
    const stops: NavStop[] = spot.path.map((at, i) => ({
      id: `cp${i}`,
      name: i === 0 ? 'Start' : i === last ? 'Finish' : `Checkpoint ${i + 1}`,
      at,
      role: 'checkpoint' as const,
    }));
    return { title: spot.name, stops, driveId: spot.id };
  }
  return planForPlace(spot.name, spot.at);
}

export function planForPlace(name: string, at: LatLng): NavPlan {
  return { title: name, stops: [{ id: 'place', name, at, role: 'destination' }] };
}

/** Route params for the driving view (all strings, as Expo Router wants). */
export function targetParams(t: NavTarget): Record<string, string> {
  if (t.kind === 'place') return { kind: 'place', name: t.name, lat: String(t.lat), lng: String(t.lng) };
  return { kind: t.kind, id: t.id };
}

/** Back from route params; null when they don't make sense. */
export function targetFromParams(p: Record<string, string | string[] | undefined>): NavTarget | null {
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const kind = one(p.kind);
  if ((kind === 'event' || kind === 'spot') && one(p.id)) return { kind, id: one(p.id)! };
  if (kind === 'place') {
    const lat = Number(one(p.lat));
    const lng = Number(one(p.lng));
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
    return { kind, name: one(p.name) || 'Destination', lat, lng };
  }
  return null;
}
