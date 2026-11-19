import { PLACES, type PlaceSeed } from './places';

/**
 * Photo spots are for photographing cars and bikes (owner, 17 Nov 2026), not
 * any scenic viewpoint. A bundled photo spot shows on the map only with some
 * evidence that people photograph or meet with cars or bikes there:
 *
 * - a source that is a car or bike publication or route guide (PistonHeads,
 *   Porsche Roads, BestBikingRoads, The Biker Guide and the like), or
 * - its description says so (car shots, bikers' stop, a meet), or
 * - it's on the short list below of well-known car and bike photo locations,
 *   each with the reason, or
 * - its source is local knowledge of the car scene (LOCAL_SCENE_SOURCE): a spot
 *   the owner names as a known meet or photo spot. The source says only that,
 *   never who or why.
 *
 * Local scene sources look like "Local car scene (owner-reported, Nov 2026)".
 *
 * The rest stay in the data (the regional files are other people's research)
 * but are hidden from the map until someone adds evidence here or in their
 * sources. People's own suggested spots are never hidden: they need a photo
 * with a car or bike in it to be suggested at all.
 */

const VEHICLE_SOURCES =
  /pistonheads|roads\.porsche|bestbikingroads|thebikerguide|evo\.co\.uk|topgear|autocar|carthrottle|motorcyclenews|bikesocial|bikerguide|driving\.co\.uk|petrolped|drivetribe|speedhunters|classicdriver/i;

const VEHICLE_WORDS =
  /\b(shots? of (your )?cars?|car[- ](meets?|shows?|shoots?|photos?|photography|photoshoots?|cruises?|cruising|clubs?|enthusiasts|displays?|parades?|gatherings?)|cars and bikes|classic[- ]cars?|modified[- ]cars?|drag rac\w*|motorcycl\w*|bikers?|motorbikes?|supercars?|petrolheads?|convoy photos?|bike (meets?|nights?))\b/i;

/** A local-knowledge source: the car scene's own knowledge of a spot, reported by the owner. No names, nothing personal. */
export const LOCAL_SCENE_SOURCE = /^Local car scene \(owner-reported, [A-Z][a-z]{2} \d{4}\)$/;

/** Well-known car and bike photo locations without a car or bike source in the data yet. */
export const KNOWN_VEHICLE_SPOTS: Record<string, string> = {
  'ph-mam-nick': 'Below Winnats Pass and Mam Tor, a classic backdrop for car and bike shoots and magazine road tests.',
  'ph-rest-and-be-thankful': 'Top of the A83, used for decades in car adverts and road tests.',
  'ph-bealach-viewpoint': 'Bealach na Bà summit: a staple of car adverts and motoring magazine shoots.',
  'ph-hartside': 'Hartside Top: a famous bikers\' stop at the top of the A686.',
  'ph-box-hill': 'Box Hill and the Zig Zag Road: long-standing weekend car and bike gathering spot.',
  'ph-sutton-bank': 'Top of the A170 climb: popular bikers\' stop.',
  'ph-cheddar': 'Cheddar Gorge: a regular location for car adverts and road tests (park in the pay car parks).',
};

export interface PhotoEvidence {
  kind: 'source' | 'local' | 'description' | 'known';
  note: string;
}

/** Why a bundled photo spot counts as a car or bike photo location, or null if nothing says so. */
export function photoEvidence(p: Pick<PlaceSeed, 'id' | 'description' | 'warnings' | 'sources'>): PhotoEvidence | null {
  const source = p.sources.find((s) => VEHICLE_SOURCES.test(s));
  if (source) return { kind: 'source', note: source };
  const local = p.sources.find((s) => LOCAL_SCENE_SOURCE.test(s));
  if (local) return { kind: 'local', note: local };
  // "Car park" says where to park, not that cars are photographed there.
  const text = [p.description, ...(p.warnings ?? [])].join(' ').replace(/\bcar[- ]?parks?\b|\bcar parking\b/gi, '');
  if (VEHICLE_WORDS.test(text)) return { kind: 'description', note: text.match(VEHICLE_WORDS)![0] };
  const known = KNOWN_VEHICLE_SPOTS[p.id];
  return known ? { kind: 'known', note: known } : null;
}

/** Bundled photo spots with no evidence: hidden from the map. */
export const UNVETTED_PHOTO_SPOTS: ReadonlySet<string> = new Set(
  PLACES.filter((p) => p.kind === 'photo' && !photoEvidence(p)).map((p) => p.id),
);
