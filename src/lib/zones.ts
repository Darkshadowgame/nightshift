import { milesBetween } from './geo';
import type { BanZone, LatLng, ZoneSourceKind } from './types';

/**
 * Ban zones: is a point inside one? A zone is either a circle (small PSPOs and
 * dispersal hotspots) or one or more simplified council-boundary polygons
 * (borough- or city-wide orders). Pure: the screens and the store share it.
 */

/** Each ring's bounding box, worked out once (the rings are module data): most points are nowhere near most zones. */
const ringBoxes = new WeakMap<readonly LatLng[], { s: number; n: number; w: number; e: number }>();
function ringBox(ring: readonly LatLng[]) {
  let b = ringBoxes.get(ring);
  if (!b) {
    b = { s: Infinity, n: -Infinity, w: Infinity, e: -Infinity };
    for (const q of ring) {
      if (q.lat < b.s) b.s = q.lat;
      if (q.lat > b.n) b.n = q.lat;
      if (q.lng < b.w) b.w = q.lng;
      if (q.lng > b.e) b.e = q.lng;
    }
    ringBoxes.set(ring, b);
  }
  return b;
}

/** Ray casting on lat/lng: fine at council scale (a few miles), well away from the poles. */
export function pointInPolygon(p: LatLng, ring: readonly LatLng[]): boolean {
  const b = ringBox(ring);
  if (p.lat < b.s || p.lat > b.n || p.lng < b.w || p.lng > b.e) return false;
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i];
    const b = ring[j];
    if (a.lat > p.lat !== b.lat > p.lat && p.lng < ((b.lng - a.lng) * (p.lat - a.lat)) / (b.lat - a.lat) + a.lng) inside = !inside;
  }
  return inside;
}

export function inZone(p: LatLng, z: BanZone): boolean {
  if (z.polygons?.length) return z.polygons.some((ring) => pointInPolygon(p, ring));
  // A degree of latitude is about 69 miles: far north or south of the circle, skip the trigonometry.
  if (Math.abs(p.lat - z.centre.lat) * 68 > z.radiusMiles) return false;
  return milesBetween(z.centre, p) <= z.radiusMiles;
}

/** Rough size in square miles, so the most specific zone comes first. */
export function zoneSize(z: BanZone): number {
  if (!z.polygons?.length) return Math.PI * z.radiusMiles * z.radiusMiles;
  let total = 0;
  for (const ring of z.polygons) {
    const lat0 = ring[0]?.lat ?? 0;
    const kx = 69.17 * Math.cos((lat0 * Math.PI) / 180);
    let a = 0;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) a += (ring[j].lng * kx) * (ring[i].lat * 69) - (ring[i].lng * kx) * (ring[j].lat * 69);
    total += Math.abs(a) / 2;
  }
  return total;
}

/** Every zone this point is inside, the most specific (smallest) first. */
export function zonesAt(p: LatLng, zones: readonly BanZone[]): BanZone[] {
  return zones.filter((z) => inZone(p, z)).sort((a, b) => zoneSize(a) - zoneSize(b));
}

/** Every zone any of these points is inside (each once), the most specific first. */
export function zonesForPoints(points: readonly LatLng[], zones: readonly BanZone[]): BanZone[] {
  const hit = new Set<BanZone>();
  for (const z of zones) if (points.some((p) => inZone(p, z))) hit.add(z);
  return [...hit].sort((a, b) => zoneSize(a) - zoneSize(b));
}

/** Map shapes for drawing the zones: circles for circle zones, outlines for polygon zones. */
export function zoneShapes(zones: readonly BanZone[], colour: string): {
  circles: { id: string; centre: LatLng; radiusMiles: number; colour: string }[];
  polygons: { id: string; coords: LatLng[]; colour: string }[];
} {
  const circles: { id: string; centre: LatLng; radiusMiles: number; colour: string }[] = [];
  const polygons: { id: string; coords: LatLng[]; colour: string }[] = [];
  for (const z of zones) {
    if (z.polygons?.length) z.polygons.forEach((ring, i) => polygons.push({ id: `bz:${z.id}:${i}`, coords: ring, colour }));
    else circles.push({ id: `bz:${z.id}`, centre: z.centre, radiusMiles: z.radiusMiles, colour });
  }
  return { circles, polygons };
}

// ---------------------------------------------------------------------------
// What a zone is, in plain words (the info card hosts and place pages open)
// ---------------------------------------------------------------------------

export type ZoneKind = 'injunction' | 'pspo' | 'dispersal';

export const ZONE_KIND_LABELS: Record<ZoneKind, string> = {
  injunction: 'Court injunction',
  pspo: 'Public spaces protection order (PSPO)',
  dispersal: 'Police dispersal orders',
};

const DEFAULT_BANS: Record<ZoneKind, string> = {
  injunction:
    'Taking part in a car cruise, street racing or stunt driving (as a driver, rider, passenger or, often, a spectator), and organising or promoting one. Breaking it is contempt of court: prison, a fine or seizure of assets.',
  pspo:
    'Car meets and anti-social driving in the area: racing, stunts, revving, loud music and gathering to watch. Breaking it can mean a fixed penalty (often £100) or a fine.',
  dispersal:
    'Not a standing ban: police have used 48-hour dispersal orders here against planned meets, ordering people to leave and stay away.',
};

export const ZONE_SAMPLE_NOTE = 'Sample — check the current order.';

/** What it means for someone hosting there. */
export const ZONE_HOST_NOTE =
  "Nightshift only warns: it never stops you placing a meet point here. As the host you're responsible for checking the current order and for where you send people.";

export function zoneKind(z: Pick<BanZone, 'kind' | 'note'>): ZoneKind {
  if (z.kind) return z.kind;
  if (/injunction/i.test(z.note)) return 'injunction';
  if (/dispersal/i.test(z.note)) return 'dispersal';
  return 'pspo';
}

/** "18:00–07:00" or "3pm to 7am" from the zone, or its note. */
export function zoneHours(z: Pick<BanZone, 'hours' | 'note'>): string | undefined {
  if (z.hours) return z.hours;
  const m = z.note.match(/\b(\d{1,2}[:.]\d{2}\s*[–-]\s*\d{1,2}[:.]\d{2})\b/) ?? z.note.match(/\b(\d{1,2}\s?(?:am|pm)\s*(?:to|and|–|-)\s*\d{1,2}\s?(?:am|pm))\b/i);
  return m?.[1];
}

const COURT_HOSTS = /(^|\.)(judiciary\.uk|bailii\.org|caselaw\.nationalarchives\.gov\.uk)$/;
const POLICE_HOSTS = /(^|\.)police\.uk$/;

/** Who published a zone's evidence link: the zone says, or its web address does. */
export function zoneSourceKind(z: Pick<BanZone, 'source' | 'sourceKind'>): ZoneSourceKind | undefined {
  if (z.sourceKind) return z.sourceKind;
  if (!z.source) return undefined;
  let host = '';
  try {
    host = new URL(z.source).hostname.toLowerCase();
  } catch {
    return undefined;
  }
  if (COURT_HOSTS.test(host)) return 'court';
  if (POLICE_HOSTS.test(host)) return 'police';
  return 'council';
}

/** The evidence link's label, by who published it. */
export function zoneSourceLabel(kind: ZoneSourceKind, authority?: string): string {
  switch (kind) {
    case 'council':
      return authority ? `Read ${authority}'s order ›` : "Read the council's order ›";
    case 'court':
      return 'Read the court order ›';
    case 'police':
      return 'See the police notice ›';
    case 'news':
      return 'News report (no official page found) ›';
  }
}

export interface ZoneInfo {
  id: string;
  name: string;
  kind: string;
  bans: string;
  hours?: string;
  /** The zone's own note, without the sample line it starts with. */
  details: string;
  source?: string;
  /** The evidence link's label ("Read the council's order ›" and so on). */
  sourceLabel?: string;
  /** A news report, shown as a quieter second link beside an official source. */
  newsSource?: string;
  checked?: string;
  sample: string;
  forHosts: string;
}

export function zoneInfo(z: BanZone): ZoneInfo {
  const kind = zoneKind(z);
  const sourceKind = zoneSourceKind(z);
  return {
    id: z.id,
    name: z.name,
    kind: ZONE_KIND_LABELS[kind],
    bans: z.bans ?? DEFAULT_BANS[kind],
    hours: zoneHours(z),
    details: z.note.replace(ZONE_SAMPLE_NOTE, '').trim(),
    source: z.source,
    sourceLabel: sourceKind ? zoneSourceLabel(sourceKind, z.authority) : undefined,
    newsSource: sourceKind === 'news' ? undefined : z.newsSource,
    checked: z.checked,
    sample: ZONE_SAMPLE_NOTE,
    forHosts: ZONE_HOST_NOTE,
  };
}

/** Small tappable pins at each zone's centre, for host maps (tap: the zone's info card). */
export function zonePins(zones: readonly BanZone[], colour: string): { id: string; at: LatLng; glyph: 'area'; colour: string; title: string; size: number }[] {
  return zones.map((z) => ({ id: `zone:${z.id}`, at: z.centre, glyph: 'area' as const, colour, title: `${z.name}: car-meet order area`, size: 24 }));
}

// ---------------------------------------------------------------------------
// Hosting inside a meet ban: warn only, but ask before publishing (owner, Review 8)
// ---------------------------------------------------------------------------

/**
 * A zone's name for a sentence: any trailing bracket dropped, so "Birmingham (whole city)" reads
 * "Birmingham's court injunction", never "(Birmingham (whole city))".
 */
export function zoneShortName(z: Pick<BanZone, 'name'>): string {
  return z.name.replace(/\s*\([^()]*\)\s*$/, '').trim() || z.name;
}

export interface PublishCheck {
  /** The first meet point inside a court injunction: publishing needs an explicit "Publish anyway". */
  injunction: { zone: BanZone; stop: string } | null;
  /** PSPOs any meet point is inside (each once): a lighter "I've checked it" on the Review step. */
  pspos: BanZone[];
}

/**
 * What a host must confirm before publishing these meet points. Every zone a point is inside
 * counts (a small PSPO inside a city-wide injunction still triggers the injunction). Dispersal
 * orders aren't standing bans: the inline warning is enough.
 */
export function publishCheck(stops: readonly { name: string; at?: LatLng }[], zones: readonly BanZone[]): PublishCheck {
  let injunction: PublishCheck['injunction'] = null;
  const pspos: BanZone[] = [];
  for (const st of stops) {
    if (!st.at) continue;
    for (const z of zonesAt(st.at, zones)) {
      const kind = zoneKind(z);
      if (kind === 'injunction' && !injunction) injunction = { zone: z, stop: st.name };
      if (kind === 'pspo' && !pspos.includes(z)) pspos.push(z);
    }
  }
  return { injunction, pspos };
}

/** The confirm sheet's words for a court injunction. */
export function injunctionConfirmText(zone: Pick<BanZone, 'name'>, verb = 'Publish'): string {
  return `This spot is inside ${zoneShortName(zone)}'s court injunction. Organising or attending a meet here can be contempt of court. ${verb} anyway?`;
}

/** The confirm sheet's words for one or more PSPOs. */
export function pspoConfirmText(zones: readonly Pick<BanZone, 'name'>[], verb = 'Publish'): string {
  return `This spot is inside ${zones.map(zoneShortName).join(' and ')}'s PSPO, which can fine car meets and people gathering to watch. Check the order first. ${verb} anyway?`;
}

/** The meet-ban confirm's words for whatever zone a spot is in (court injunction first). */
export function banConfirmText(zone: BanZone, verb = 'Publish'): string {
  const kind = zoneKind(zone);
  if (kind === 'injunction') return injunctionConfirmText(zone, verb);
  if (kind === 'pspo') return pspoConfirmText([zone], verb);
  return `This spot is inside ${zoneShortName(zone)}'s dispersal-order hotspot, where police can move people on. ${verb} anyway?`;
}

/** The meet-point placer's line: "Inside a court injunction area: Birmingham (whole city)". One bracket at most. */
export function zoneLine(z: BanZone): string {
  const kind = zoneKind(z);
  const what = kind === 'injunction' ? 'a court injunction area' : kind === 'pspo' ? 'a PSPO area' : 'a dispersal-order hotspot';
  return `Inside ${what}: ${z.name}`;
}

/** Of the zones a point is in, the one to warn about first: a court injunction, else the most specific. */
export function worstZone(zones: readonly BanZone[]): BanZone | undefined {
  return zones.find((z) => zoneKind(z) === 'injunction') ?? zones[0];
}
