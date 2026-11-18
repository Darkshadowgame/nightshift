import type { Build, ChatMessage, Crew, LatLng, Mod, ModCategory, NightEvent, Spot, TuneStage, User } from '../lib/types';
import { DEFAULT_FILTER } from '../lib/invites';
import type { Vote } from '../lib/awards';
import { eventArea } from '../lib/area';
import { isPublicType } from '../lib/events';
import { nearestRegion } from '../lib/profile';
import { applySceneNames, nearest, translate, type SceneNames } from '../lib/scene';
import { PLACES, type PlaceSeed } from './places';

/**
 * Demo scene for Phase 1: made-up sample people and events, drawn round the
 * person's own (fuzzed) home area, with the real UK circuits, roads and photo
 * spots in places.ts nearby (read from the bundle, not seeded). Times are relative to `now` so the demo always has
 * something on tonight. The people and events are sample data, not real.
 */

export const ME = 'me';

/**
 * The made-up origin the sample scene is drawn round (Tamworth). Every sample
 * point is moved onto your home area keeping its distance and direction.
 * "Use the demo area" on first run still puts your home here, for testing.
 */
export const DEMO_HOME = { lat: 52.63, lng: -1.7 };
export const DEMO_REGION = 'Midlands';

/** Where the sample scene goes, and the geocoder's names for its stops (see scene.ts). */
export interface SceneOptions {
  home?: LatLng;
  names?: SceneNames;
}

type ModSpec = [ModCategory, string, number?];

interface BuildSpec {
  kind: 'car' | 'bike';
  make: string;
  model: string;
  year: number;
  stockBhp: number;
  weightKg: number;
  torque?: number;
  dyno?: number;
  nickname?: string;
  colour: string;
  mods: ModSpec[];
}

interface Person {
  id: string;
  handle: string;
  name: string;
  /** Where the sample person was drawn round the origin. Moved onto your area. */
  home: [number, number];
  crew?: string;
  builds: BuildSpec[];
}

const PEOPLE: Person[] = [
  // You start fresh: no car, no crew, no events. The sample people and events are there to try things on.
  { id: ME, handle: 'you', name: 'You', home: [52.63, -1.69], builds: [] },
  {
    id: 'dan', handle: 'dan_r', name: 'Dan', home: [52.63, -1.70], crew: 'nr',
    builds: [{ kind: 'car', make: 'BMW', model: 'M4 Competition', year: 2021, stockBhp: 503, weightKg: 1725, torque: 479, colour: '#ff9a2e',
      mods: [['engine', 'Stage 1 remap', 80], ['exhaust', 'Valved cat-back'], ['wheels', '20" forged'], ['body', 'Carbon front splitter']] }],
  },
  {
    id: 'aimee', handle: 'aimee.r1', name: 'Aimee', home: [52.68, -1.82], crew: 'nr',
    builds: [{ kind: 'bike', make: 'Yamaha', model: 'YZF-R1', year: 2020, stockBhp: 197, weightKg: 201, colour: '#3f6fff',
      mods: [['exhaust', 'Full titanium system', 8], ['engine', 'ECU flash', 5], ['other', 'Quickshifter'], ['body', 'Tail tidy']] }],
  },
  {
    id: 'kez', handle: 'kez_typer', name: 'Kez', home: [52.52, -1.47], crew: 'ts',
    builds: [{ kind: 'car', make: 'Honda', model: 'Civic Type R FK8', year: 2018, stockBhp: 316, weightKg: 1380, colour: '#ff4d4d',
      mods: [['intake', 'Carbon intake', 5], ['exhaust', 'Cat-back'], ['wheels', '19" flow-formed'], ['suspension', 'Lowering springs'], ['engine', 'Stage 1 map', 30]] }],
  },
  {
    id: 'jord', handle: 'jordST', name: 'Jordan', home: [52.80, -1.64],
    builds: [{ kind: 'car', make: 'Ford', model: 'Fiesta ST Mk7', year: 2016, stockBhp: 197, weightKg: 1163, colour: '#2ec4b6',
      mods: [['engine', 'Mountune MR230 pack', 33], ['intake', 'Induction kit'], ['suspension', 'Coilovers'], ['wheels', '17" Rotas']] }],
  },
  {
    id: 'mo', handle: 'mo.rs3', name: 'Mo', home: [52.57, -1.82], crew: 'nr',
    builds: [{ kind: 'car', make: 'Audi', model: 'RS3 8V', year: 2019, stockBhp: 395, weightKg: 1575, torque: 354, dyno: 470, colour: '#9b5de5',
      mods: [['engine', 'Stage 2+ remap'], ['turbo', 'Hybrid turbo'], ['intake', 'Turbo inlet'], ['exhaust', 'Decat downpipe'], ['wheels', '19" forged']] }],
  },
  {
    id: 'liv', handle: 'liv_on_two', name: 'Liv', home: [52.92, -1.48], crew: 'pk',
    builds: [{ kind: 'bike', make: 'Triumph', model: 'Street Triple RS', year: 2022, stockBhp: 128, weightKg: 188, colour: '#ff4fa3',
      mods: [['exhaust', 'Arrow end can', 3], ['other', 'Bar-end mirrors'], ['body', 'Fly screen']] }],
  },
  {
    id: 'sully', handle: 'sully_zx', name: 'Sully', home: [52.64, -1.13], crew: 'pk',
    builds: [{ kind: 'bike', make: 'Kawasaki', model: 'ZX-10R', year: 2021, stockBhp: 200, weightKg: 207, colour: '#9dfa5a',
      mods: [['exhaust', 'Akrapovič slip-on', 4], ['engine', 'ECU flash', 6], ['suspension', 'Öhlins shock'], ['other', 'Steering damper']] }],
  },
  {
    id: 'bex', handle: 'bex_gti', name: 'Bex', home: [52.41, -1.51], crew: 'ts',
    builds: [{ kind: 'car', make: 'Volkswagen', model: 'Golf GTI Mk7', year: 2017, stockBhp: 227, weightKg: 1375, colour: '#e9edf4',
      mods: [['engine', 'Stage 1 remap', 50], ['wheels', '18" Pretorias'], ['suspension', 'Air ride']] }],
  },
  {
    id: 'tay', handle: 'tay_subie', name: 'Tay', home: [52.81, -2.12],
    builds: [{ kind: 'car', make: 'Subaru', model: 'Impreza WRX STI', year: 2008, stockBhp: 296, weightKg: 1505, colour: '#3f6fff',
      mods: [['engine', 'Forged internals'], ['turbo', 'Twin-scroll turbo'], ['exhaust', 'Equal-length manifold'], ['brakes', 'Big brake kit'], ['body', 'Wing']], dyno: 420 }],
  },
  {
    id: 'raf', handle: 'raf.r6', name: 'Raf', home: [52.59, -1.98],
    builds: [{ kind: 'bike', make: 'Yamaha', model: 'YZF-R6', year: 2017, stockBhp: 117, weightKg: 190, colour: '#3fd6ff',
      mods: [['exhaust', 'Slip-on', 3], ['body', 'Race fairings'], ['other', 'Rearsets']] }],
  },
  {
    id: 'nina', handle: 'nina_mx5', name: 'Nina', home: [52.37, -1.26],
    builds: [{ kind: 'car', make: 'Mazda', model: 'MX-5 NB', year: 2003, stockBhp: 144, weightKg: 1065, colour: '#ff9a2e',
      mods: [['suspension', 'Coilovers'], ['wheels', '15" Enkei'], ['interior', 'Bucket seats'], ['body', 'Hardtop']] }],
  },
  {
    id: 'cal', handle: 'cal_focusrs', name: 'Cal', home: [52.54, -1.37], crew: 'ts',
    builds: [{ kind: 'car', make: 'Ford', model: 'Focus RS Mk3', year: 2017, stockBhp: 345, weightKg: 1599, colour: '#3f6fff',
      mods: [['engine', 'Stage 2 remap', 55], ['intake', 'Turbo inlet'], ['exhaust', 'Cat-back'], ['wheels', '19" forged']] }],
  },
  {
    id: 'ash', handle: 'ash.saxo', name: 'Ash', home: [52.69, -2.03],
    builds: [{ kind: 'car', make: 'Citroën', model: 'Saxo VTS', year: 2001, stockBhp: 100, weightKg: 935, colour: '#ffd166',
      mods: [['engine', 'Throttle bodies', 25], ['exhaust', '4-2-1 manifold'], ['suspension', 'Coilovers'], ['interior', 'Half cage']] }],
  },
  {
    id: 'deano', handle: 'deano_mt09', name: 'Dean', home: [52.75, -1.47], crew: 'pk',
    builds: [{ kind: 'bike', make: 'Yamaha', model: 'MT-09', year: 2021, stockBhp: 117, weightKg: 189, colour: '#7a7f8c',
      mods: [['exhaust', 'Full system', 6], ['engine', 'ECU flash', 4], ['other', 'Tail tidy']] }],
  },
  {
    id: 'priya', handle: 'priya.m140', name: 'Priya', home: [52.41, -1.78], crew: 'ts',
    builds: [{ kind: 'car', make: 'BMW', model: 'M140i', year: 2018, stockBhp: 335, weightKg: 1475, colour: '#e9edf4',
      mods: [['engine', 'Stage 2 remap', 65], ['intake', 'Charge pipe'], ['exhaust', 'Decat downpipe'], ['suspension', 'Coilovers']] }],
  },
  {
    id: 'gaz', handle: 'gaz_gsxr', name: 'Gaz', home: [52.53, -1.46], crew: 'pk',
    builds: [{ kind: 'bike', make: 'Suzuki', model: 'GSX-R750', year: 2016, stockBhp: 148, weightKg: 190, colour: '#3f6fff',
      mods: [['exhaust', 'Yoshimura can', 4], ['brakes', 'Braided lines'], ['other', 'Steering damper']] }],
  },
  {
    id: 'em', handle: 'em_i30n', name: 'Em', home: [52.69, -1.83],
    builds: [{ kind: 'car', make: 'Hyundai', model: 'i30 N', year: 2020, stockBhp: 271, weightKg: 1429, colour: '#3fd6ff',
      mods: [['engine', 'Stage 1 remap', 40], ['wheels', '19" Rotas']] }],
  },
  {
    id: 'tom', handle: 'tomtom_gr', name: 'Tom', home: [52.64, -1.68],
    builds: [{ kind: 'car', make: 'Toyota', model: 'GR Yaris', year: 2021, stockBhp: 257, weightKg: 1280, colour: '#ff4d4d',
      mods: [['engine', 'Stage 1 remap', 40], ['intake', 'Turbo inlet'], ['exhaust', 'Cat-back'], ['suspension', 'Coilovers'], ['wheels', '18" forged']] }],
  },
  {
    id: 'lew', handle: 'lew.ninja', name: 'Lewis', home: [52.81, -1.62],
    builds: [{ kind: 'bike', make: 'Kawasaki', model: 'Ninja 400', year: 2022, stockBhp: 45, weightKg: 168, colour: '#9dfa5a',
      mods: [['exhaust', 'Slip-on'], ['other', 'Tail tidy'], ['body', 'Double-bubble screen']] }],
  },
  {
    id: 'sam', handle: 'sam_e46', name: 'Sam', home: [52.31, -1.94],
    builds: [{ kind: 'car', make: 'BMW', model: 'M3 E46', year: 2004, stockBhp: 338, weightKg: 1495, colour: '#9b5de5',
      mods: [['exhaust', 'Straight-through system'], ['suspension', 'Coilovers'], ['wheels', '19" CSL replicas'], ['interior', 'Bucket seats']] }],
  },
];

const crewOf = (id: string) => PEOPLE.filter((p) => p.crew === id).map((p) => p.id);
/** Each crew has an owner and a couple of hosts. You aren't in one until you join or start one. */
const CREWS: Crew[] = [
  { id: 'nr', name: 'NightRunners', tag: 'NR', memberIds: crewOf('nr'), ownerId: 'dan', hostIds: ['mo'] },
  { id: 'pk', name: 'Peak Chasers', tag: 'PKC', memberIds: crewOf('pk'), ownerId: 'sully', hostIds: ['liv'] },
  { id: 'ts', name: 'Torque Street', tag: 'TQS', memberIds: crewOf('ts'), ownerId: 'kez', hostIds: ['cal'] },
];

/**
 * The tune stage a sample build's engine mod names ("Stage 2 remap", "Stage 1 map"), so the build
 * page shows Stage 2 rather than Stock. The seed names its remaps as people would; the app's own
 * stage mod is "Stage N tune" (tune.ts), which stageFromMods reads.
 */
export function seedStage(specs: ModSpec[]): TuneStage | undefined {
  for (const [category, name] of specs) {
    if (category !== 'engine') continue;
    const n = /^stage (1|2\+|2|3|4)\s.*\b(re)?map\b/i.exec(name.trim())?.[1];
    if (n) return n === '1' ? 'stage1' : n === '2' ? 'stage2' : n === '2+' ? 'stage2plus' : n === '3' ? 'stage3' : 'stage4';
  }
  return undefined;
}

function makeMods(buildId: string, specs: ModSpec[]): Mod[] {
  return specs.map(([category, name, bhpGain], i) => ({ id: `${buildId}-m${i}`, category, name, bhpGain }));
}

export { BAN_ZONES } from './banZones';

function at(now: Date, dayOffset: number, hour: number, minute = 0): string {
  const d = new Date(now);
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

/** The most recent Sunday at least `minDaysBack` days ago, at this time of day. */
function lastSunday(now: Date, minDaysBack: number, hour: number, minute = 0): string {
  let back = now.getDay(); // days since Sunday
  if (back < minDaysBack) back += 7;
  return at(now, -back, hour, minute);
}

function minutesFrom(now: Date, minutes: number): string {
  return new Date(now.getTime() + minutes * 60_000).toISOString();
}

/** Seed event ids: everything else in the events list was made on the phone. */
export const SEED_EVENT_IDS = [
  'ev-rolling-live', 'ev-rolling-host', 'ev-meet-soon', 'ev-cruise-peak', 'ev-meet-tam', 'ev-bike-cat', 'ev-past-snowdome', 'ev-show-don', 'ev-track-curb',
];

/** Rough areas are worked out the same way as for events made in the app: fuzzed, never on a stop. */
function withAreas(list: NightEvent[]): NightEvent[] {
  return list.map((e) => {
    const placed = e.stops.flatMap((st) => (st.at ? [st.at] : []));
    return { ...e, ...eventArea(placed, e.id, isPublicType(e.type)) };
  });
}

/** Neutral area name until the geocoder names the town (not "Near you": it reads as a place in notices). */
export const NEAR_YOU = 'Sample area';

/** Start, halfway and finish of a real drive, for the sample cruises. */
function driveStops(prefix: string, d: PlaceSeed) {
  const path = d.path ?? [d.at];
  return [
    { id: `${prefix}-1`, name: `Start: ${d.name}`, at: path[0] },
    { id: `${prefix}-2`, name: 'Regroup: Halfway lay-by', at: path[Math.floor(path.length / 2)] },
    { id: `${prefix}-3`, name: 'Finish: End of the road', at: path[path.length - 1] },
  ];
}

const isCircuit = (p: PlaceSeed) => p.kind === 'track' && p.trackType === 'circuit';
// Sprint courses and hill climbs only: not kart tracks or oval stadiums.
const isSprint = (p: PlaceSeed) => p.kind === 'track' && (p.trackType === 'sprint' || p.trackType === 'hillclimb');

/** Sample events: meets moved onto your area, cruises on the nearest real drives, shows and track days at the nearest real venues. */
function events(now: Date, home: LatLng): NightEvent[] {
  const here = (lat: number, lng: number) => translate({ lat, lng }, DEMO_HOME, home);
  const [d1, d2] = nearest(PLACES.filter((p) => p.kind === 'drive'), home, 2);
  const [circuit] = nearest(PLACES.filter(isCircuit), home, 1);
  const [sprint] = nearest(PLACES.filter(isSprint), home, 1);
  return withAreas([
    {
      id: 'ev-rolling-live', type: 'rolling', title: 'Late rolling meet',
      description: 'Three stops, all planned in advance. Check in at each stop to unlock the next one.',
      startsAt: minutesFrom(now, -45), endsAt: minutesFrom(now, 180),
      area: home, areaName: NEAR_YOU,
      stops: [
        { id: 'rl-1', name: 'Retail park car park', at: here(52.6842, -1.8105), revealedAt: minutesFrom(now, -105) },
        { id: 'rl-2', name: 'Shopping park car park', at: here(52.6205, -1.7265), revealedAt: minutesFrom(now, -10) },
        { id: 'rl-3', name: 'Business park car park', at: here(52.5156, -1.7072), note: 'Planned, hidden until you move on' },
      ],
      // Open to any car or bike: the live one a brand-new demo user can say they're going to and check in at.
      currentStop: 1, revealMinutesBefore: 60, hostIds: ['dan'], filter: { ...DEFAULT_FILTER, minMods: 0, radiusMiles: 30 },
      going: ['dan', 'kez', 'tom', 'em', 'aimee', 'jord'],
      checkIns: { dan: ['rl-1', 'rl-2'], tom: ['rl-1', 'rl-2'], em: ['rl-1'], aimee: ['rl-1'] },
    },
    {
      id: 'ev-rolling-host', type: 'rolling', title: 'NightRunners late one',
      description: 'Crew-run rolling meet. NightRunners hosts move it on.',
      startsAt: minutesFrom(now, 30), endsAt: minutesFrom(now, 240),
      area: home, areaName: NEAR_YOU,
      stops: [
        { id: 'rh-1', name: 'Leisure centre car park', at: here(52.6302, -1.6962) },
        { id: 'rh-2', name: 'Country park car park', at: here(52.5711, -1.6745), note: 'Planned, hidden until you move on' },
      ],
      currentStop: 0, revealMinutesBefore: 60, hostIds: ['mo'], crewId: 'nr',
      filter: { ...DEFAULT_FILTER, classes: ['S', 'A', 'B'], radiusMiles: 25 },
      going: ['mo', 'dan', 'aimee', 'priya', 'cal'], checkIns: {},
      requests: ['ash'],
    },
    {
      // An invite a few hours away that you aren't going to yet: tap Going to try the reminders and the reveal.
      id: 'ev-meet-soon', type: 'meet', title: 'Coffee and cars, late edition',
      description: 'Open to any car or bike nearby. Arranged with the site. Park up, no revving, leave it clean.',
      startsAt: minutesFrom(now, 180), endsAt: minutesFrom(now, 330),
      area: home, areaName: NEAR_YOU,
      stops: [{ id: 'ms-1', name: 'Town centre car park', at: here(52.6333, -1.6951) }],
      currentStop: 0, revealMinutesBefore: 60, hostIds: ['tom'],
      // No mod minimum, so a stock car or bike matches.
      filter: { ...DEFAULT_FILTER, minMods: 0, radiusMiles: 30 },
      going: ['tom', 'em', 'jord', 'bex'], checkIns: {},
    },
    {
      id: 'ev-cruise-peak', type: 'cruise', title: `Night cruise: ${d1.name}`,
      description: `${d1.name}, start to finish with a regroup halfway. Speed limits all the way.`,
      startsAt: at(now, 2, 22, 30), area: d1.at, areaName: d1.region, routeMiles: Math.round(d1.miles ?? 20),
      stops: driveStops('pc', d1),
      currentStop: 0, revealMinutesBefore: 60, hostIds: ['dan'], crewId: 'nr',
      filter: { ...DEFAULT_FILTER, classes: ['S', 'A'], radiusMiles: 100 },
      going: ['dan', 'mo', 'aimee', 'sully', 'cal'], checkIns: {},
      requests: ['jord', 'nina'],
    },
    {
      // This week's open one: A and B class, no mod minimum, so a typical hot hatch (a stock Civic
      // Type R, a Golf GTI, an i30 N) is invited from the first run.
      id: 'ev-meet-tam', type: 'meet', title: 'Late hot hatch meet',
      description: 'Hot hatches, A and B class, stock or modified. Arranged with the site. Park up, no revving, leave it clean.',
      startsAt: at(now, 5, 23, 0), area: home, areaName: NEAR_YOU,
      stops: [{ id: 'mt-1', name: 'Shopping park car park', at: here(52.6205, -1.7265) }],
      currentStop: 0, revealMinutesBefore: 60, hostIds: ['kez'], crewId: 'ts',
      filter: { ...DEFAULT_FILTER, cars: true, bikes: false, classes: ['A', 'B'], minMods: 0, radiusMiles: 25 },
      going: ['kez', 'cal', 'priya', 'em', 'bex'], checkIns: {},
    },
    {
      id: 'ev-bike-cat', type: 'cruise', title: `Sunrise ride: ${d2.name}`,
      description: 'Bikes only. Breakfast at the finish.',
      startsAt: at(now, 6, 6, 0), area: d2.at, areaName: d2.region, routeMiles: Math.round(d2.miles ?? 20),
      stops: driveStops('bc', d2),
      currentStop: 0, revealMinutesBefore: 120, hostIds: ['aimee', 'sully'], crewId: 'pk',
      filter: { ...DEFAULT_FILTER, cars: false, bikes: true, classes: ['S', 'A', 'B'], minMods: 0, radiusMiles: 100 },
      going: ['aimee', 'sully', 'liv', 'gaz'], checkIns: {},
    },
    {
      id: 'ev-past-snowdome', type: 'meet', title: 'Sunday night meet',
      description: 'Sunday night meet. Voting has closed, trophies are out.',
      startsAt: lastSunday(now, 2, 19, 0), endsAt: lastSunday(now, 2, 22, 0), area: home, areaName: NEAR_YOU,
      stops: [{ id: 'ps-1', name: 'Leisure centre car park', at: here(52.6302, -1.6962) }],
      currentStop: 0, revealMinutesBefore: 60, hostIds: ['tom'],
      filter: { ...DEFAULT_FILTER, minMods: 2, radiusMiles: 30 },
      going: ['tom', 'dan', 'kez', 'aimee', 'mo', 'em', 'sully', 'jord', 'priya'],
      checkIns: Object.fromEntries(['tom', 'dan', 'kez', 'aimee', 'mo', 'em', 'sully', 'jord', 'priya'].map((u) => [u, ['ps-1']])),
    },
    {
      id: 'ev-show-don', type: 'show', title: 'Modified show day',
      description: 'Sample event: show-and-shine, club stands and a trade area. Real shows are booked through the venue.',
      startsAt: at(now, 12, 9, 0), endsAt: at(now, 12, 17, 0), area: circuit.at, areaName: circuit.name,
      stops: [{ id: 'sd-1', name: circuit.name, at: circuit.at }],
      currentStop: 0, revealMinutesBefore: 0, hostIds: ['cal'],
      filter: { ...DEFAULT_FILTER, everyone: true, minMods: 0, radiusMiles: 100 },
      going: ['cal', 'jord', 'nina', 'bex', 'em'], checkIns: {},
    },
    {
      id: 'ev-track-curb', type: 'trackday', title: `${sprint.name} evening`,
      description: 'Sample event: an evening run by the venue. Helmets required, noise limits apply. Book through the venue.',
      startsAt: at(now, 9, 17, 30), endsAt: at(now, 9, 21, 0), area: sprint.at, areaName: sprint.name,
      stops: [{ id: 'tc-1', name: sprint.name, at: sprint.at }],
      currentStop: 0, revealMinutesBefore: 0, hostIds: ['tom'],
      filter: { ...DEFAULT_FILTER, everyone: true, minMods: 0, radiusMiles: 100 },
      going: ['tom', 'ash', 'nina'], checkIns: {},
    },
  ]);
}

/** The seeded name, place and area name of every sample stop, by stop id (what the geocoder may rename). */
export function seededStops(home: LatLng = DEMO_HOME): Map<string, { name: string; at?: LatLng; areaName: string; eventId: string }> {
  const out = new Map<string, { name: string; at?: LatLng; areaName: string; eventId: string }>();
  for (const e of events(new Date(0), home)) for (const st of e.stops) out.set(st.id, { name: st.name, at: st.at, areaName: e.areaName, eventId: e.id });
  return out;
}

function chat(now: Date): ChatMessage[] {
  const m = (id: string, eventId: string, userId: string, text: string, minsAgo: number): ChatMessage => ({
    id, eventId, userId, text, at: minutesFrom(now, -minsAgo),
  });
  return [
    m('c1', 'ev-rolling-live', 'dan', 'Moving on in 5. Check in if you have not, or you will not get the next spot.', 16),
    m('c2', 'ev-rolling-live', 'tom', 'Here, parked at the far end.', 8),
    m('c3', 'ev-rolling-live', 'em', 'Stuck at the lights, 5 mins.', 6),
    m('c4', 'ev-cruise-peak', 'mo', 'Fuel up before the start, nothing open after.', 300),
    m('c5', 'ev-cruise-peak', 'aimee', 'Bringing the R1, will sit at the back.', 120),
  ];
}

function votes(now: Date): Vote[] {
  const when = lastSunday(now, 2, 21, 30);
  const v = (voterId: string, category: Vote['category'], buildId: string): Vote => ({ eventId: 'ev-past-snowdome', voterId, category, buildId, at: when });
  return [
    v('tom', 'best-in-show', 'b-dan-0'), v('kez', 'best-in-show', 'b-dan-0'), v('em', 'best-in-show', 'b-dan-0'), v('priya', 'best-in-show', 'b-dan-0'), v('jord', 'best-in-show', 'b-aimee-0'),
    v('tom', 'best-car', 'b-mo-0'), v('aimee', 'best-car', 'b-mo-0'), v('sully', 'best-car', 'b-mo-0'), v('priya', 'best-car', 'b-kez-0'),
    v('tom', 'best-bike', 'b-aimee-0'), v('dan', 'best-bike', 'b-aimee-0'), v('mo', 'best-bike', 'b-aimee-0'),
    v('dan', 'cleanest', 'b-em-0'), v('kez', 'cleanest', 'b-em-0'), v('mo', 'cleanest', 'b-em-0'),
    v('tom', 'sound', 'b-kez-0'), v('em', 'sound', 'b-kez-0'), v('jord', 'sound', 'b-kez-0'),
  ];
}

export interface SeedState {
  votes: Vote[];
  users: User[];
  builds: Build[];
  crews: Crew[];
  events: NightEvent[];
  chat: ChatMessage[];
  spots: Spot[];
}

/** Sample people's ids: everyone in the scene but you. */
export const SAMPLE_PEOPLE = PEOPLE.filter((p) => p.id !== ME).map((p) => p.id);

/** Sample people's rough homes, moved onto your area. Never shown to anyone. */
export function sampleHomes(home: LatLng): Map<string, LatLng> {
  return new Map(PEOPLE.map((p) => [p.id, translate({ lat: p.home[0], lng: p.home[1] }, DEMO_HOME, home)]));
}

export function seed(now: Date = new Date(), scene: SceneOptions = {}): SeedState {
  const home = scene.home ?? DEMO_HOME;
  const homes = sampleHomes(home);
  const region = nearestRegion(home);
  const users: User[] = PEOPLE.map((p) => ({
    id: p.id, handle: p.handle, name: p.name, region, crewId: p.crew,
    home: homes.get(p.id)!,
  }));
  const builds: Build[] = PEOPLE.flatMap((p) =>
    p.builds.map((b, i) => {
      const id = `b-${p.id}-${i}`;
      return {
        id, ownerId: p.id, kind: b.kind, make: b.make, model: b.model, year: b.year, nickname: b.nickname,
        stockBhp: b.stockBhp, weightKg: b.weightKg, torqueLbFt: b.torque, dynoBhp: b.dyno,
        mods: makeMods(id, b.mods), tuneStage: seedStage(b.mods), photos: [], colour: b.colour,
      };
    }),
  );
  const evs = events(now, home);
  const named = scene.names && Object.keys(scene.names).length ? applySceneNames(evs, scene.names, seededStops(home)) : evs;
  // Bundled places aren't part of the save: the store reads them from the bundle (placeStore.ts).
  const spots: Spot[] = [];
  return { users, builds, crews: CREWS, events: named, chat: chat(now), votes: votes(now), spots };
}
