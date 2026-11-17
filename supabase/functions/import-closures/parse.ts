// Pure parsers for the open-data closure feeds (no Deno or network here, so
// Jest tests them too: __tests__/importClosures.test.ts).
//
//  * TfL Unified API, GET /Road/all/Street/Disruption?startDate&endDate:
//    street segments with `closure: "Closed"`, a `lineString` "[[lng,lat],…]"
//    and the direction. Works without a key (50 requests a minute).
//  * National Highways "Road and Lane Closures v2" (DATEX II 3.4, JSON with
//    X-Response-MediaType: application/json): D2Payload.situation[].situationRecord[]
//    with the geometry in locLinearLocation.gmlLineString.locGmlLineString.posList
//    ("lat lng lat lng …"), or several under locLocationGroupByList, or a point
//    in locPointLocation. Shapes from the portal's own examples (Nov 2026).
//
// Both are Open Government Licence data: the app credits the source on every closure.

export type ClosureSource = 'national_highways' | 'street_manager' | 'tfl';

export interface ClosureRow {
  source: ClosureSource;
  source_id: string;
  /** 'road_closure' (the road or carriageway is shut) or 'lane_closure'. */
  kind: 'road_closure' | 'lane_closure';
  full_closure: boolean;
  description: string | null;
  road: string | null;
  direction: string | null;
  /** EWKT, e.g. "SRID=4326;LINESTRING(-0.12 51.5, -0.13 51.51)". PostGIS parses it into geography. */
  geom: string;
  starts_at: string | null;
  ends_at: string | null;
  updated_at: string;
}

type Json = Record<string, unknown>;
const isObj = (v: unknown): v is Json => typeof v === 'object' && v !== null && !Array.isArray(v);
const str = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v.trim() : null);
const clip = (s: string | null, n = 500) => (s && s.length > n ? `${s.slice(0, n - 1)}…` : s);

/** Inside Great Britain and Northern Ireland, roughly (also catches swapped lat/lng). */
export function inUk(lat: number, lng: number): boolean {
  return Number.isFinite(lat) && Number.isFinite(lng) && lat >= 49.8 && lat <= 61 && lng >= -8.7 && lng <= 2;
}

/** EWKT for one point or a line of [lat, lng] pairs (a line of one point becomes a point). */
export function toEwkt(points: [number, number][]): string | null {
  const ok = points.filter(([lat, lng]) => inUk(lat, lng));
  if (ok.length === 0) return null;
  if (ok.length === 1) return `SRID=4326;POINT(${ok[0][1]} ${ok[0][0]})`;
  return `SRID=4326;LINESTRING(${ok.map(([lat, lng]) => `${lng} ${lat}`).join(', ')})`;
}

// ---------------------------------------------------------------------------
// TfL
// ---------------------------------------------------------------------------

/** "[A222] ELM ROAD (DA14 )" → "A222 Elm Road". */
export function tflStreetName(raw: string | null): string | null {
  if (!raw) return null;
  const road = /^\[([A-Z]\d+[A-Z]?)\]/.exec(raw)?.[1];
  const name = raw
    .replace(/^\[[^\]]*\]\s*/, '')
    .replace(/\s*\([^)]*\)\s*$/, '')
    .toLowerCase()
    .replace(/\b[a-z]/g, (c) => c.toUpperCase())
    .trim();
  return [road, name].filter(Boolean).join(' ') || null;
}

export function parseTflStreets(items: unknown, now: string): ClosureRow[] {
  if (!Array.isArray(items)) return [];
  const out: ClosureRow[] = [];
  for (const d of items) {
    if (!isObj(d) || d.closure !== 'Closed') continue;
    const id = str(d.distruptedStreetId) ?? str(d.disruptedStreetId);
    if (!id) continue;
    let pts: [number, number][] = [];
    try {
      const line = typeof d.lineString === 'string' ? (JSON.parse(d.lineString) as unknown) : null;
      if (Array.isArray(line)) {
        pts = line.flatMap((p) => (Array.isArray(p) && typeof p[0] === 'number' && typeof p[1] === 'number' ? [[p[1], p[0]] as [number, number]] : []));
      }
    } catch {
      pts = [];
    }
    if (pts.length === 0 && typeof d.startLat === 'number' && typeof d.startLon === 'number') pts = [[d.startLat, d.startLon]];
    const geom = toEwkt(pts);
    if (!geom) continue;
    out.push({
      source: 'tfl',
      source_id: id,
      kind: 'road_closure',
      full_closure: true,
      description: clip(str(d.comments)),
      road: tflStreetName(str(d.streetName)),
      direction: str(d.directions),
      geom,
      starts_at: str(d.startDateTime),
      ends_at: str(d.endDateTime),
      updated_at: now,
    });
  }
  return out;
}

// ---------------------------------------------------------------------------
// National Highways (DATEX II)
// ---------------------------------------------------------------------------

/** "51.868835 0.525233 51.869 0.525917" → [[51.868835, 0.525233], [51.869, 0.525917]]. */
export function parsePosList(posList: unknown): [number, number][] {
  if (typeof posList !== 'string') return [];
  const n = posList.trim().split(/\s+/).map(Number);
  const out: [number, number][] = [];
  for (let i = 0; i + 1 < n.length; i += 2) if (Number.isFinite(n[i]) && Number.isFinite(n[i + 1])) out.push([n[i], n[i + 1]]);
  return out;
}

interface NhLocation {
  points: [number, number][];
  road: string | null;
  direction: string | null;
  description: string | null;
  /** Lanes still open on the carriageway, when given. */
  openLanes: number | null;
}

function dig(o: unknown, ...path: string[]): unknown {
  let cur = o;
  for (const k of path) {
    if (!isObj(cur)) return undefined;
    cur = cur[k];
  }
  return cur;
}

function nhLocation(loc: Json): NhLocation | null {
  let points: [number, number][] = [];
  const linear = dig(loc, 'locLinearLocation');
  const pointLoc = dig(loc, 'locPointLocation');
  if (isObj(linear)) points = parsePosList(dig(linear, 'gmlLineString', 'locGmlLineString', 'posList'));
  if (points.length === 0 && isObj(pointLoc)) {
    const c = dig(pointLoc, 'pointByCoordinates', 'pointCoordinates');
    if (isObj(c) && typeof c.latitude === 'number' && typeof c.longitude === 'number') points = [[c.latitude, c.longitude]];
  }
  if (points.length === 0) return null;
  const where = isObj(linear) ? linear : isObj(pointLoc) ? pointLoc : {};
  const supp = dig(where, 'supplementaryPositionalDescription');
  const carriageways = Array.isArray(dig(supp, 'carriageway')) ? (dig(supp, 'carriageway') as unknown[]) : [];
  let openLanes: number | null = null;
  for (const c of carriageways) {
    const n = dig(c, 'carriagewayExtensionG', 'impactOnCarriageway', 'numberOfOperationalLanes');
    if (typeof n === 'number') openLanes = (openLanes ?? 0) + n;
  }
  const single = dig(loc, 'locSingleRoadLinearLocation', 'linearWithinLinearElement');
  const along = Array.isArray(single) ? single[0] : Array.isArray(dig(pointLoc, 'pointAlongLinearElement')) ? (dig(pointLoc, 'pointAlongLinearElement') as unknown[])[0] : undefined;
  return {
    points,
    road: str(dig(along, 'linearElement', 'locLinearElementByCode', 'roadName')),
    direction: str(dig(along, 'directionOnLinearSection')) ?? str(dig(along, 'directionAtPoint')),
    description: str(dig(supp, 'locationDescription')),
    openLanes,
  };
}

const FULL_TYPES = new Set(['roadClosed', 'carriagewayClosures']);

export function parseNationalHighways(payload: unknown, now: string): ClosureRow[] {
  const situations = dig(payload, 'D2Payload', 'situation');
  if (!Array.isArray(situations)) return [];
  const out: ClosureRow[] = [];
  for (const s of situations) {
    const records = dig(s, 'situationRecord');
    if (!Array.isArray(records)) continue;
    for (const wrapper of records) {
      if (!isObj(wrapper)) continue;
      // Each record is wrapped in its DATEX type, e.g. { sitRoadOrCarriagewayOrLaneManagement: {...} }.
      for (const rec of Object.values(wrapper)) {
        if (!isObj(rec)) continue;
        const id = str(rec.idG);
        if (!id) continue;
        if (dig(rec, 'validity', 'validityStatus') === 'suspended') continue;
        const type = str(dig(rec, 'roadOrCarriagewayOrLaneManagementType', 'value'));
        const comments = dig(rec, 'generalPublicComment');
        const comment = Array.isArray(comments) ? comments.map((c) => str(dig(c, 'comment'))).filter(Boolean).join(' ') : null;
        const lr = dig(rec, 'locationReference');
        const group = dig(lr, 'locLocationGroupByList', 'locationContainedInGroup');
        const locs = (Array.isArray(group) ? group : [lr]).filter(isObj).map(nhLocation).filter((l): l is NhLocation => !!l);
        locs.forEach((loc, i) => {
          const geom = toEwkt(loc.points);
          if (!geom) return;
          const full = (type !== null && FULL_TYPES.has(type)) || loc.openLanes === 0;
          out.push({
            source: 'national_highways',
            source_id: locs.length > 1 ? `${id}#${i}` : id,
            kind: full ? 'road_closure' : 'lane_closure',
            full_closure: full,
            description: clip([loc.description, comment && comment !== type ? comment : null].filter(Boolean).join('. ') || null),
            road: loc.road,
            direction: loc.direction,
            geom,
            starts_at: str(dig(rec, 'validity', 'validityTimeSpecification', 'overallStartTime')),
            ends_at: str(dig(rec, 'validity', 'validityTimeSpecification', 'overallEndTime')),
            updated_at: now,
          });
        });
      }
    }
  }
  return out;
}
