import { PLACES, placeSpots } from '../data/places';
import { BAN_ZONES } from '../data/banZones';
import { zonesForPoints } from './zones';
import type { BanZone, Spot, SpotCompletion, SpotRating } from './types';

/**
 * Bundled places (circuits, drives, photo spots, venues) are read from the app
 * bundle every time, never copied into the save. So a corrected position, a new
 * warning or a ban zone added in an over-the-air update reaches every phone.
 *
 * What the save keeps per bundled place is only what people did there
 * (completions and ratings), keyed by place id. Places people suggest are kept
 * whole, as before.
 */

export interface PlaceProgress {
  completions: SpotCompletion[];
  ratings: SpotRating[];
}

/** Place id -> what people did there. Only places with something in them. */
export type ProgressMap = Record<string, PlaceProgress>;

/** "Added" date shown for every bundled place. Fixed, so it doesn't change with each launch. */
export const BUNDLED_AT = '2026-09-01T12:00:00.000Z';

export const BUNDLED_IDS: ReadonlySet<string> = new Set(PLACES.map((p) => p.id));

export function isBundled(id: string): boolean {
  return BUNDLED_IDS.has(id);
}

/** Ban-zone fields worked out from the current zones (the most specific zone's name, and every id). */
export function withZones(spot: Spot, zones: readonly BanZone[]): Spot {
  const found = zonesForPoints(spot.path?.length ? [spot.at, ...spot.path] : [spot.at], zones);
  const { banZone: _old, banZoneIds: _oldIds, ...rest } = spot;
  return found.length ? { ...rest, banZone: found[0].name, banZoneIds: found.map((z) => z.id) } : rest;
}

let bundled: Spot[] | null = null;

/** The bundled places as spots, built once per launch (the zones are checked then too). */
export function bundledSpots(): Spot[] {
  if (!bundled) bundled = placeSpots(BUNDLED_AT).map((s) => withZones(s, BAN_ZONES));
  return bundled;
}

function hasProgress(p: PlaceProgress | undefined): p is PlaceProgress {
  return !!p && (p.completions.length > 0 || p.ratings.length > 0);
}

/**
 * Everything on the map: bundled places with what people did there, then
 * places people suggested (their ban zones checked again against today's zones).
 * Spots without progress are the same objects every time, so memoised screens stay cheap.
 */
export function joinSpots(base: readonly Spot[], progress: ProgressMap, own: readonly Spot[], zones: readonly BanZone[] = BAN_ZONES): Spot[] {
  const out: Spot[] = base.map((s) => {
    const p = progress[s.id];
    return hasProgress(p) ? { ...s, completions: p.completions, ratings: p.ratings } : s;
  });
  for (const s of own) out.push(withZones(s, zones));
  return out;
}

/** Record a bundled place's progress after a change (an empty one is dropped). */
export function setProgress(progress: ProgressMap, spot: Spot): ProgressMap {
  const next = { ...progress };
  const p = { completions: spot.completions, ratings: spot.ratings };
  if (hasProgress(p)) next[spot.id] = p;
  else delete next[spot.id];
  return next;
}

/**
 * Older saves copied every bundled place into `spots`. Keep what people did
 * there as progress, and keep whole only the places that aren't bundled:
 * your own suggestions, and bundled places since taken out that someone had
 * visited or rated (so their history isn't lost). Anything else goes.
 */
export function splitSavedSpots(saved: readonly Spot[], me: string, bundledIds: ReadonlySet<string> = BUNDLED_IDS): { own: Spot[]; progress: ProgressMap } {
  const own: Spot[] = [];
  const progress: ProgressMap = {};
  for (const s of saved) {
    const p = { completions: s.completions ?? [], ratings: s.ratings ?? [] };
    if (bundledIds.has(s.id)) {
      if (hasProgress(p)) progress[s.id] = p;
    } else if (s.authorId === me || hasProgress(p)) {
      own.push(s);
    }
  }
  return { own, progress };
}
