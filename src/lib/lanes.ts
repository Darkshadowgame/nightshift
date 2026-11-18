import { angleBetween, bearing, metresBetween, projectOnSegment, type Manoeuvre } from './nav';
import { pickWay, type OsmWay } from './speedLimit';
import type { LatLng } from './types';

/**
 * Lane guidance for the driving view's banner: which lanes are for the next manoeuvre. Apple's
 * directions don't give lanes, so they come from OpenStreetMap's `turn:lanes` tags on the road
 * you approach the junction on (and `destination:lanes` for signed exits). Pure: the driving
 * screen fetches the roads round the junction (laneLookup.ts) and asks here what to draw.
 *
 * Rule one: never guess. No tags, tags that don't fit the road, or no lane that fits the
 * manoeuvre: nothing is shown (a roundabout still shows its exit number).
 */

/** The arrows OSM uses on lanes. "none" is a lane with no arrow painted. */
export type LaneArrow =
  | 'through'
  | 'left'
  | 'slight_left'
  | 'sharp_left'
  | 'right'
  | 'slight_right'
  | 'sharp_right'
  | 'reverse'
  | 'merge_to_left'
  | 'merge_to_right'
  | 'none';

const KNOWN = new Set<LaneArrow>(['through', 'left', 'slight_left', 'sharp_left', 'right', 'slight_right', 'sharp_right', 'reverse', 'merge_to_left', 'merge_to_right', 'none']);

/** Most roads have 1 to 6 lanes; anything past 8 is a tagging mistake. */
const MAX_LANES = 8;

/**
 * "left|through;right|right" → [['left'], ['through', 'right'], ['right']], lanes from left to
 * right as you drive. An empty lane is "none". Null for an empty tag, too many lanes, or a value
 * OSM doesn't define (a typo is a reason not to trust the rest).
 */
export function parseTurnLanes(tag: string | null | undefined): LaneArrow[][] | null {
  if (tag == null) return null;
  const t = tag.trim();
  if (!t) return null;
  const lanes = t.split('|');
  if (lanes.length > MAX_LANES) return null;
  const out: LaneArrow[][] = [];
  for (const lane of lanes) {
    const arrows = lane
      .split(';')
      .map((a) => a.trim().toLowerCase())
      .filter((a) => a.length > 0);
    if (arrows.length === 0) {
      out.push(['none']);
      continue;
    }
    if (!arrows.every((a) => KNOWN.has(a as LaneArrow))) return null;
    out.push(arrows as LaneArrow[]);
  }
  return out;
}

/** "Tamworth|Tamworth;Lichfield|" → [['tamworth'], ['tamworth', 'lichfield'], []]. */
export function parseDestinationLanes(tag: string | null | undefined, count: number): string[][] | null {
  if (!tag) return null;
  const lanes = tag.split('|');
  if (lanes.length !== count) return null;
  return lanes.map((l) =>
    l
      .split(';')
      .map((d) => d.trim().toLowerCase())
      .filter(Boolean),
  );
}

/** Which way you drive along a way: with its nodes ('forward') or against them ('backward'). */
export type WayDirection = 'forward' | 'backward';

/**
 * The tags for your direction: `turn:lanes:forward` / `:backward`, or plain `turn:lanes` on a
 * one-way road (or a motorway, which OSM treats as one-way). Plain `turn:lanes` on a two-way road
 * is ambiguous, so it's left out.
 */
export function lanesTag(tags: Record<string, string> | undefined, dir: WayDirection): { turn: string | null; destination: string | null } {
  const t = tags ?? {};
  const oneway = t.oneway === 'yes' || t.oneway === '1' || t.highway === 'motorway' || t.highway === 'motorway_link' || t.junction === 'roundabout';
  const reversed = t.oneway === '-1';
  if (dir === 'forward') {
    return {
      turn: t['turn:lanes:forward'] ?? (oneway ? t['turn:lanes'] ?? null : null),
      destination: t['destination:lanes:forward'] ?? (oneway ? t['destination:lanes'] ?? null : null),
    };
  }
  return {
    turn: t['turn:lanes:backward'] ?? (reversed ? t['turn:lanes'] ?? null : null),
    destination: t['destination:lanes:backward'] ?? (reversed ? t['destination:lanes'] ?? null : null),
  };
}

/** "first", "2nd", "third exit" → 1, 2, 3. Null when the instruction names no exit. */
export function roundaboutExit(text: string): number | null {
  const words: Record<string, number> = { first: 1, second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6, seventh: 7, eighth: 8 };
  const m = /\b(first|second|third|fourth|fifth|sixth|seventh|eighth|(\d)(?:st|nd|rd|th))\s+exit\b/i.exec(text);
  if (!m) return null;
  return m[2] ? Number(m[2]) : words[m[1].toLowerCase()] ?? null;
}

/** The place a step heads for: "Take exit 10 towards Tamworth" → "tamworth". */
export function towardsOf(text: string): string | null {
  const m = /\btowards?\s+(.+?)(?:[.,]|$)/i.exec(text);
  return m ? m[1].trim().toLowerCase() : null;
}

/** For each manoeuvre, the arrows that fit it, best first: the first group any lane has wins. */
const FITS: Partial<Record<Manoeuvre, LaneArrow[][]>> = {
  straight: [['through']],
  left: [['left', 'sharp_left'], ['slight_left']],
  sharpLeft: [['sharp_left'], ['left']],
  slightLeft: [['slight_left'], ['left']],
  keepLeft: [['slight_left'], ['left']],
  right: [['right', 'sharp_right'], ['slight_right']],
  sharpRight: [['sharp_right'], ['right']],
  slightRight: [['slight_right'], ['right']],
  keepRight: [['slight_right'], ['right']],
  uturn: [['reverse']],
};

export interface LaneShown {
  arrows: LaneArrow[];
  /** A lane for the next manoeuvre. */
  on: boolean;
}

/** What the banner draws: the lanes (null for "exit number only") and a roundabout's exit. */
export interface LaneStrip {
  lanes: LaneShown[] | null;
  exit?: number;
}

/**
 * The lanes for a manoeuvre. Roundabouts (UK, clockwise): the first exit is the left lane, but
 * only when a lane is marked left; any other exit shows just its number. With destinations
 * signed per lane and a "towards" in the instruction, only the lanes signed for it stay lit.
 * Null when nothing can be said.
 */
export function matchLanes(lanes: LaneArrow[][] | null, kind: Manoeuvre, text: string, destinations?: string[][] | null): LaneStrip | null {
  if (kind === 'roundabout') {
    const exit = roundaboutExit(text);
    if (exit === 1 && lanes) {
      const on = lanes.map((l) => l.includes('left') || l.includes('slight_left'));
      if (on.some(Boolean)) return { lanes: lanes.map((arrows, i) => ({ arrows, on: on[i] })), exit };
    }
    return exit ? { lanes: null, exit } : null;
  }
  if (!lanes || lanes.length === 0) return null;
  const groups = FITS[kind];
  if (!groups) return null;
  let on: boolean[] | null = null;
  for (const g of groups) {
    const hit = lanes.map((l) => l.some((a) => g.includes(a)));
    if (hit.some(Boolean)) {
      on = hit;
      break;
    }
  }
  if (!on) return null;
  const to = towardsOf(text);
  if (to && destinations && destinations.length === lanes.length) {
    const signed = on.map((v, i) => v && destinations[i].some((d) => d.includes(to) || to.includes(d)));
    if (signed.some(Boolean)) on = signed;
  }
  return { lanes: lanes.map((arrows, i) => ({ arrows, on: on![i] })), exit: undefined };
}

/** The road you're on near a point, and which way along it you're driving. */
function directionOn(way: OsmWay, at: LatLng, travel: number): WayDirection | null {
  const g = way.geometry ?? [];
  let best = Infinity;
  let dir = 0;
  for (let i = 0; i + 1 < g.length; i++) {
    const a = { lat: g[i].lat, lng: g[i].lon };
    const b = { lat: g[i + 1].lat, lng: g[i + 1].lon };
    const { off } = projectOnSegment(at, a, b);
    if (off < best) {
      best = off;
      dir = bearing(a, b);
    }
  }
  const d = angleBetween(dir, travel);
  if (d < 60) return 'forward';
  if (d > 120) return 'backward';
  return null;
}

/** The approach way has to reach the junction: its end in your direction within this (m). */
export const JUNCTION_REACH_M = 40;

/**
 * Lanes for a step from the roads round its junction: the way you're on `approach` (a point a
 * little before the junction, with your direction there), its lane tags for your direction, and
 * the match for the manoeuvre. The way must end at the junction, so its lanes are for this
 * junction and not the next one along.
 */
export function lanesAtJunction(
  ways: OsmWay[],
  junction: LatLng,
  approach: { at: LatLng; bearing: number },
  kind: Manoeuvre,
  text: string,
): LaneStrip | null {
  const roundaboutOnly = kind === 'roundabout' ? matchLanes(null, kind, text) : null;
  const way = pickWay(ways, approach.at, approach.bearing);
  if (!way?.geometry || way.geometry.length < 2) return roundaboutOnly;
  const dir = directionOn(way, approach.at, approach.bearing);
  if (!dir) return roundaboutOnly;
  const g = way.geometry;
  const end = dir === 'forward' ? g[g.length - 1] : g[0];
  if (metresBetween({ lat: end.lat, lng: end.lon }, junction) > JUNCTION_REACH_M) return roundaboutOnly;
  const tags = lanesTag(way.tags, dir);
  const lanes = parseTurnLanes(tags.turn);
  if (!lanes) return roundaboutOnly;
  return matchLanes(lanes, kind, text, parseDestinationLanes(tags.destination, lanes.length)) ?? roundaboutOnly;
}

/** Lanes show from this far before the manoeuvre (m). */
export const LANES_FROM_M = 1000;

/** Look the junction's lanes up from this far ahead, so they're ready when they show. */
export const LANES_LOOKUP_M = 1600;

/** For the screen reader: "Lanes: 3 lanes, use lane 2 or 3." */
export function laneLabel(strip: LaneStrip): string {
  const exit = strip.exit ? `Exit ${strip.exit}` : '';
  if (!strip.lanes) return exit;
  const on = strip.lanes.map((l, i) => (l.on ? i + 1 : 0)).filter(Boolean);
  const use = on.length === 1 ? `use lane ${on[0]}` : `use lanes ${on.slice(0, -1).join(', ')} or ${on[on.length - 1]}`;
  const lanes = `${strip.lanes.length} lanes, ${use} from the left`;
  return exit ? `${exit}. ${lanes}` : lanes;
}
