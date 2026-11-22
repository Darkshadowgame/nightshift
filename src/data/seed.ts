import type { Build, ChatMessage, Crew, LatLng, Mod, ModCategory, NightEvent, Spot, TuneStage, User } from '../lib/types';
import { DEFAULT_FILTER } from '../lib/invites';
import type { Vote } from '../lib/awards';
import { eventArea } from '../lib/area';
import { landSnapper } from '../lib/landSafe';
import { isPublicType } from '../lib/events';
import { areaNameNear, nearestRegion } from '../lib/profile';
import { applySceneNames, nearest, translate, type SceneNames } from '../lib/scene';
import { PLACES, type PlaceSeed } from './places';
import { SAMPLE_PHOTOS } from './samplePhotos';
import { SAMPLE_REF } from '../lib/photoSource';
import { appNow } from '../lib/appClock';

/**
 * Demo scene for Phase 1: made-up sample people and events, drawn round the
 * person's own (fuzzed) home area, with the real UK circuits, roads and photo
 * spots in places.ts nearby (read from the bundle, not seeded). Times are relative to `now` so the demo always has
 * something on tonight. The people and events are sample data, not real.
 */

export const ME = 'me';

/**
 * Meets the demo says you're going to before you've tapped anything (Sunday coffee and cars, for
 * task 10's "Can't make it"). Said "You're going (demo)" on their row and in the Demo night sheet,
 * so it's never a surprise (Review 20 problem 2).
 */
export const DEMO_SEEDED_GOING: ReadonlySet<string> = new Set(['ev-meet-soon']);

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
    builds: [{ kind: 'car', make: 'BMW', model: 'M4 Competition', year: 2021, stockBhp: 503, weightKg: 1725, torque: 479, colour: '#1f4fa8',
      mods: [['engine', 'Stage 1 remap', 80], ['exhaust', 'Valved cat-back'], ['wheels', '20" forged'], ['body', 'Carbon front splitter']] }],
  },
  {
    id: 'aimee', handle: 'aimee.r1', name: 'Aimee', home: [52.68, -1.82], crew: 'nr',
    builds: [{ kind: 'bike', make: 'Yamaha', model: 'YZF-R1', year: 2020, stockBhp: 197, weightKg: 201, colour: '#1f4fa8',
      mods: [['exhaust', 'Full titanium system', 8], ['engine', 'ECU flash', 5], ['other', 'Quickshifter'], ['body', 'Tail tidy']] }],
  },
  {
    id: 'kez', handle: 'kez_typer', name: 'Kez', home: [52.52, -1.47], crew: 'ts',
    builds: [{ kind: 'car', make: 'Honda', model: 'Civic Type R FK8', year: 2018, stockBhp: 316, weightKg: 1380, colour: '#c8102e',
      mods: [['intake', 'Carbon intake', 5], ['exhaust', 'Cat-back'], ['wheels', '19" flow-formed'], ['suspension', 'Lowering springs'], ['engine', 'Stage 1 map', 30]] }],
  },
  {
    id: 'jord', handle: 'jordST', name: 'Jordan', home: [52.80, -1.64],
    builds: [{ kind: 'car', make: 'Ford', model: 'Fiesta ST Mk7', year: 2016, stockBhp: 197, weightKg: 1163, colour: '#1b1f27',
      mods: [['engine', 'Mountune MR230 pack', 33], ['intake', 'Induction kit'], ['suspension', 'Coilovers'], ['wheels', '17" Rotas']] }],
  },
  {
    id: 'mo', handle: 'mo.rs3', name: 'Mo', home: [52.57, -1.82], crew: 'nr',
    builds: [{ kind: 'car', make: 'Audi', model: 'RS3 8V', year: 2019, stockBhp: 395, weightKg: 1575, torque: 354, dyno: 470, colour: '#7a7f8a',
      mods: [['engine', 'Stage 2+ remap'], ['turbo', 'Hybrid turbo'], ['intake', 'Turbo inlet'], ['exhaust', 'Decat downpipe'], ['wheels', '19" forged']] }],
  },
  {
    id: 'liv', handle: 'liv_on_two', name: 'Liv', home: [52.92, -1.48], crew: 'pk',
    builds: [{ kind: 'bike', make: 'Triumph', model: 'Street Triple RS', year: 2022, stockBhp: 128, weightKg: 188, colour: '#1b1f27',
      mods: [['exhaust', 'Arrow end can', 3], ['other', 'Bar-end mirrors'], ['body', 'Fly screen']] }],
  },
  {
    id: 'sully', handle: 'sully_zx', name: 'Sully', home: [52.64, -1.13], crew: 'pk',
    builds: [{ kind: 'bike', make: 'Kawasaki', model: 'ZX-10R', year: 2021, stockBhp: 200, weightKg: 207, colour: '#2f7d4f',
      mods: [['exhaust', 'Akrapovič slip-on', 4], ['engine', 'ECU flash', 6], ['suspension', 'Öhlins shock'], ['other', 'Steering damper']] }],
  },
  {
    id: 'bex', handle: 'bex_gti', name: 'Bex', home: [52.41, -1.51], crew: 'ts',
    builds: [{ kind: 'car', make: 'Volkswagen', model: 'Golf GTI Mk7', year: 2017, stockBhp: 227, weightKg: 1375, colour: '#c8102e',
      mods: [['engine', 'Stage 1 remap', 50], ['wheels', '18" Pretorias'], ['suspension', 'Air ride']] }],
  },
  {
    id: 'tay', handle: 'tay_subie', name: 'Tay', home: [52.81, -2.12],
    builds: [{ kind: 'car', make: 'Subaru', model: 'Impreza WRX STI', year: 2008, stockBhp: 296, weightKg: 1505, colour: '#1b1f27',
      mods: [['engine', 'Forged internals'], ['turbo', 'Twin-scroll turbo'], ['exhaust', 'Equal-length manifold'], ['brakes', 'Big brake kit'], ['body', 'Wing']], dyno: 420 }],
  },
  {
    id: 'raf', handle: 'raf.r6', name: 'Raf', home: [52.59, -1.98],
    builds: [{ kind: 'bike', make: 'Yamaha', model: 'YZF-R6', year: 2017, stockBhp: 117, weightKg: 190, colour: '#e9edf4',
      mods: [['exhaust', 'Slip-on', 3], ['body', 'Race fairings'], ['other', 'Rearsets']] }],
  },
  {
    id: 'nina', handle: 'nina_mx5', name: 'Nina', home: [52.37, -1.26],
    builds: [{ kind: 'car', make: 'Mazda', model: 'MX-5 NB', year: 2003, stockBhp: 144, weightKg: 1065, colour: '#1f4fa8',
      mods: [['suspension', 'Coilovers'], ['wheels', '15" Enkei'], ['interior', 'Bucket seats'], ['body', 'Hardtop']] }],
  },
  {
    id: 'cal', handle: 'cal_focusrs', name: 'Cal', home: [52.54, -1.37], crew: 'ts',
    builds: [{ kind: 'car', make: 'Ford', model: 'Focus RS Mk3', year: 2017, stockBhp: 345, weightKg: 1599, colour: '#1f4fa8',
      mods: [['engine', 'Stage 2 remap', 55], ['intake', 'Turbo inlet'], ['exhaust', 'Cat-back'], ['wheels', '19" forged']] }],
  },
  {
    id: 'ash', handle: 'ash.saxo', name: 'Ash', home: [52.69, -2.03],
    builds: [{ kind: 'car', make: 'Citroen', model: 'Saxo VTS', year: 2001, stockBhp: 100, weightKg: 935, colour: '#7a7f8a',
      mods: [['engine', 'Throttle bodies', 25], ['exhaust', '4-2-1 manifold'], ['suspension', 'Coilovers'], ['interior', 'Half cage']] }],
  },
  {
    id: 'deano', handle: 'deano_mt09', name: 'Dean', home: [52.75, -1.47], crew: 'pk',
    builds: [{ kind: 'bike', make: 'Yamaha', model: 'MT-09', year: 2021, stockBhp: 117, weightKg: 189, colour: '#7a7f8a',
      mods: [['exhaust', 'Full system', 6], ['engine', 'ECU flash', 4], ['other', 'Tail tidy']] }],
  },
  {
    id: 'priya', handle: 'priya.m140', name: 'Priya', home: [52.41, -1.78], crew: 'ts',
    builds: [{ kind: 'car', make: 'BMW', model: 'M140i', year: 2018, stockBhp: 335, weightKg: 1475, colour: '#e9edf4',
      mods: [['engine', 'Stage 2 remap', 65], ['intake', 'Charge pipe'], ['exhaust', 'Decat downpipe'], ['suspension', 'Coilovers']] }],
  },
  {
    id: 'gaz', handle: 'gaz_gsxr', name: 'Gaz', home: [52.53, -1.46], crew: 'pk',
    builds: [{ kind: 'bike', make: 'Suzuki', model: 'GSX-R750', year: 2016, stockBhp: 148, weightKg: 190, colour: '#1b1f27',
      mods: [['exhaust', 'Yoshimura can', 4], ['brakes', 'Braided lines'], ['other', 'Steering damper']] }],
  },
  {
    id: 'em', handle: 'em_i30n', name: 'Em', home: [52.69, -1.83],
    builds: [{ kind: 'car', make: 'Hyundai', model: 'i30 N', year: 2020, stockBhp: 271, weightKg: 1429, colour: '#7a7f8a',
      mods: [['engine', 'Stage 1 remap', 40], ['wheels', '19" Rotas']] }],
  },
  {
    id: 'tom', handle: 'tomtom_gr', name: 'Tom', home: [52.64, -1.68],
    builds: [{ kind: 'car', make: 'Toyota', model: 'GR Yaris', year: 2021, stockBhp: 257, weightKg: 1280, colour: '#1b1f27',
      mods: [['engine', 'Stage 1 remap', 40], ['intake', 'Turbo inlet'], ['exhaust', 'Cat-back'], ['suspension', 'Coilovers'], ['wheels', '18" forged']] }],
  },
  {
    id: 'lew', handle: 'lew.ninja', name: 'Lewis', home: [52.81, -1.62],
    builds: [{ kind: 'bike', make: 'Kawasaki', model: 'Ninja 400', year: 2022, stockBhp: 45, weightKg: 168, colour: '#2f7d4f',
      mods: [['exhaust', 'Slip-on'], ['other', 'Tail tidy'], ['body', 'Double-bubble screen']] }],
  },
  {
    id: 'sam', handle: 'sam_e46', name: 'Sam', home: [52.31, -1.94],
    builds: [{ kind: 'car', make: 'BMW', model: 'M3 E46', year: 2004, stockBhp: 338, weightKg: 1495, colour: '#1b1f27',
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

/** A sample build's or post's real photo from Wikimedia Commons (samplePhotos.ts), as a `sample:` ref. */
export function samplePhotoRefs(id: string): string[] {
  return SAMPLE_PHOTOS[id] ? [`sample:${id}`] : [];
}

function at(now: Date, dayOffset: number, hour: number, minute = 0): string {
  const d = new Date(now);
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function minutesFrom(now: Date, minutes: number): string {
  return new Date(now.getTime() + minutes * 60_000).toISOString();
}

const MIN = 60_000;

/** Tonight at this clock time (hours past 23 run into the small hours). Before 5am, tonight began yesterday. */
function tonightAt(now: Date, hour: number, minute = 0, addDays = 0): Date {
  const d = new Date(now);
  if (now.getHours() < 5) d.setDate(d.getDate() - 1);
  d.setDate(d.getDate() + addDays);
  d.setHours(hour, minute, 0, 0);
  return d;
}

/**
 * The demo night (Redesign 2, 3.1). The demo runs on a virtual clock that starts on a Friday at
 * 21:10 (demoTime.ts), and the sample events are laid out round that moment:
 *
 * | Event                         | Time                         | Why it's there                          |
 * |-------------------------------|------------------------------|-----------------------------------------|
 * | Car park meet-up (meet)       | live, 20:30–23:00, shown     | going, check in and vote work at once   |
 * | Late rolling meet             | 22:00–00:30, location 21:30  | the location countdown, then Move on    |
 * | Saturday night cruise         | tomorrow 20:00, Class S, A   | "Not open to your car" for slow builds  |
 * | Sunday coffee and cars (meet) | Sun 10:00, you're going      | a daytime meet; "Can't make it" (task 10)|
 * | Last week's meet              | ended a week ago             | results, trophies and photos            |
 *
 * Laid out relative to `now`, so `seed(now)` works at any time (tests, older saves): the live meet
 * started 40 minutes ago (to the 5 minutes) and runs two and a half hours.
 */
export function demoTimes(now: Date): Record<'meetNow' | 'rollingLate' | 'cruise' | 'coffee' | 'lastWeek', { start: Date; end: Date }> {
  const start = new Date(Math.floor((now.getTime() - 40 * MIN) / (5 * MIN)) * 5 * MIN);
  const meetNow = { start, end: new Date(start.getTime() + 150 * MIN) };
  const lateStart = new Date(start.getTime() + 90 * MIN);
  const cruiseStart = tonightAt(now, 20, 0, 1);
  const coffee = nextSunday(now);
  const DAY = 7 * 24 * 60 * MIN;
  return {
    meetNow,
    rollingLate: { start: lateStart, end: new Date(lateStart.getTime() + 150 * MIN) },
    cruise: { start: cruiseStart, end: new Date(cruiseStart.getTime() + 150 * MIN) },
    coffee: { start: coffee, end: new Date(coffee.getTime() + 180 * MIN) },
    lastWeek: { start: new Date(start.getTime() - DAY), end: new Date(meetNow.end.getTime() - DAY) },
  };
}

/** The next Sunday at 10:00 that is at least an hour away. */
function nextSunday(now: Date): Date {
  for (let i = 0; i < 9; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    d.setHours(10, 0, 0, 0);
    if (d.getDay() === 0 && d.getTime() > now.getTime() + 60 * MIN) return d;
  }
  return tonightAt(now, 10, 0, 7);
}

/** How far the sample rolling meet has got: moved on to its second meet point 35 minutes in. */
function rollingProgress(now: Date, start: Date): { live: boolean; movedOn: boolean } {
  const m = (now.getTime() - start.getTime()) / MIN;
  return { live: m >= 0, movedOn: m >= 35 };
}

/**
 * Seed event ids: everything else in the events list was made on the phone. The ones after
 * `ev-past-snowdome` are no longer seeded (older saves may still hold them; a refresh drops them).
 */
export const SEED_EVENT_IDS = [
  'ev-meet-now', 'ev-rolling-late', 'ev-cruise-peak', 'ev-meet-soon', 'ev-meet-tam', 'ev-bike-cat', 'ev-show-don', 'ev-org-cars', 'ev-org-track', 'ev-past-snowdome',
  'ev-rolling-live', 'ev-rolling-host', 'ev-track-curb',
];

/** Rough areas are worked out the same way as for events made in the app: fuzzed, never on a meet point. */
function withAreas(list: NightEvent[]): NightEvent[] {
  return list.map((e) => {
    const placed = e.stops.flatMap((st) => (st.at ? [st.at] : []));
    return { ...e, ...eventArea(placed, e.id, isPublicType(e.type)) };
  });
}

/** Is this the sample scene's own home? Its hand-placed points are known land; elsewhere they're snapped to land (landSafe.ts). */
export function isSampleHome(home: LatLng): boolean {
  return Math.abs(home.lat - DEMO_HOME.lat) < 0.02 && Math.abs(home.lng - DEMO_HOME.lng) < 0.02;
}

/** The demo's own town: the sample scene is drawn round Tamworth unless you set another home. */
export const DEMO_TOWN = 'Tamworth';

/** The area name sample meets use until the geocoder names the town: Tamworth for the demo home, else your region. */
export function sceneAreaName(home: LatLng): string {
  return isSampleHome(home) ? DEMO_TOWN : areaNameNear(home);
}

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
const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** Sample events: the demo night's five, plus a few later in the week so This week and Later aren't empty. */
function events(now: Date, home: LatLng): NightEvent[] {
  const t = demoTimes(now);
  const iso = (d: Date, plusMin = 0) => new Date(d.getTime() + plusMin * MIN).toISOString();
  const roll = rollingProgress(now, t.rollingLate.start);
  // Moved onto your area, then onto a real place on land (a coastal home would put a raw offset in the sea).
  const snap = landSnapper(isSampleHome(home));
  const here = (lat: number, lng: number) => snap(translate({ lat, lng }, DEMO_HOME, home));
  const area = sceneAreaName(home);
  const [d1, d2] = nearest(PLACES.filter((p) => p.kind === 'drive'), home, 2);
  const [circuit, circuit2 = circuit] = nearest(PLACES.filter(isCircuit), home, 2);
  const meetGoing = ['em', 'dan', 'jord', 'bex', 'lew', 'cal', 'nina', 'raf', 'ash', 'liv'];
  const lastGoing = ['tom', 'dan', 'kez', 'aimee', 'mo', 'em', 'sully', 'jord', 'priya'];
  return withAreas([
    {
      // The "Start here" pick: live, open to anyone, location shown. Going, check in and vote work at once.
      photo: `${SAMPLE_REF}ev-meet-now`,
      // Photos from tonight's meet of its own (Review 20 #13), not the builds' photos again.
      gallery: ['g-now-1', 'g-now-2', 'g-now-3'].map((k) => `${SAMPLE_REF}${k}`),
      id: 'ev-meet-now', type: 'meet', title: 'Car park meet-up',
      description: 'Park up at the far end, no revving, leave it clean.',
      startsAt: iso(t.meetNow.start), endsAt: iso(t.meetNow.end),
      area: home, areaName: area,
      stops: [{ id: 'mn-1', name: 'Leisure park car park', at: here(52.6105, -1.6720) }],
      currentStop: 0, revealMinutesBefore: 60, hostIds: ['em'],
      filter: { ...DEFAULT_FILTER, everyone: true, minMods: 0, radiusMiles: 30 },
      // Enough cars and bikes that each trophy shows a different few.
      going: meetGoing,
      checkIns: Object.fromEntries(meetGoing.map((u) => [u, ['mn-1']])),
      // Who's here (most recent first) and the house rules: demo data for the meet page extras.
      arrivals: Object.fromEntries(meetGoing.map((u, i) => [u, iso(t.meetNow.start, 4 * i)])),
      rules: ['no-revving', 'litter', 'park-nicely'],
    },
    {
      // Later tonight: the location shows at 21:30 (20 minutes into the demo), then the host moves it on.
      photo: `${SAMPLE_REF}ev-rolling-late`,
      id: 'ev-rolling-late', type: 'rolling', title: 'Late rolling meet',
      description: 'Three meet points, planned in advance. The host moves it on, and everyone going sees where it is now.',
      startsAt: iso(t.rollingLate.start), endsAt: iso(t.rollingLate.end),
      area: home, areaName: area,
      stops: [
        { id: 'rl-1', name: 'Retail park car park', at: here(52.6842, -1.8105) },
        { id: 'rl-2', name: 'Shopping park car park', at: here(52.6205, -1.7265), ...(roll.movedOn ? { revealedAt: iso(t.rollingLate.start, 35) } : {}) },
        { id: 'rl-3', name: 'Business park car park', at: here(52.5156, -1.7072), note: 'Planned, hidden until you move on' },
      ],
      currentStop: roll.movedOn ? 1 : 0, revealMinutesBefore: 30, hostIds: ['dan'],
      filter: { ...DEFAULT_FILTER, everyone: true, minMods: 0, radiusMiles: 30 },
      going: ['dan', 'kez', 'tom', 'aimee'],
      checkIns: roll.movedOn ? { dan: ['rl-1', 'rl-2'], tom: ['rl-1', 'rl-2'] } : roll.live ? { dan: ['rl-1'], tom: ['rl-1'] } : {},
    },
    {
      // Class S and A only: a stock hot hatch sees "Not open to your car".
      photo: `${SAMPLE_REF}ev-cruise-peak`,
      id: 'ev-cruise-peak', type: 'cruise', title: `${WEEKDAY_NAMES[t.cruise.start.getDay()]} night cruise`,
      description: `${d1.name}, start to finish with a regroup halfway. Speed limits all the way.`,
      startsAt: iso(t.cruise.start), endsAt: iso(t.cruise.end), area: d1.at, areaName: d1.region, routeMiles: Math.round(d1.miles ?? 20),
      stops: driveStops('pc', d1),
      currentStop: 0, revealMinutesBefore: 60, hostIds: ['dan'],
      filter: { ...DEFAULT_FILTER, classes: ['S', 'A'], minMods: 0, radiusMiles: 100 },
      going: ['dan', 'mo', 'aimee', 'sully', 'cal'], checkIns: {},
    },
    {
      photo: `${SAMPLE_REF}ev-meet-soon`,
      id: 'ev-meet-soon', type: 'meet', title: 'Sunday coffee and cars',
      description: 'Arranged with the site. Park up, no revving, leave it clean.',
      startsAt: iso(t.coffee.start), endsAt: iso(t.coffee.end),
      area: home, areaName: area,
      stops: [{ id: 'ms-1', name: 'Town centre car park', at: here(52.6333, -1.6951) }],
      currentStop: 0, revealMinutesBefore: 60, hostIds: ['tom'],
      filter: { ...DEFAULT_FILTER, everyone: true, minMods: 0, radiusMiles: 30 },
      // You're going (Review 11): "You can't make it after all" (scorecard task 10) has something to undo.
      going: ['tom', 'em', 'jord', 'bex', ME], checkIns: {},
      rules: ['no-revving', 'litter', 'respect-venue'],
      // One-tap status: the host and people going see it.
      status: { jord: 'late' },
    },
    {
      // Later in the week: A and B class, so a typical hot hatch can go.
      photo: `${SAMPLE_REF}ev-meet-tam`,
      id: 'ev-meet-tam', type: 'meet', title: 'Hot hatch meet',
      description: 'Hot hatches, stock or modified. Arranged with the site.',
      startsAt: at(now, 5, 20, 0), endsAt: at(now, 5, 23, 0), area: home, areaName: area,
      stops: [{ id: 'mt-1', name: 'Shopping park car park', at: here(52.6205, -1.7265) }],
      currentStop: 0, revealMinutesBefore: 60, hostIds: ['kez'],
      filter: { ...DEFAULT_FILTER, cars: true, bikes: false, classes: ['A', 'B'], minMods: 0, radiusMiles: 25 },
      going: ['kez', 'cal', 'priya', 'em', 'bex'], checkIns: {},
      // Four places besides the host, all taken: the next person joins the waitlist.
      capacity: 4, waitlist: ['nina'],
    },
    {
      photo: `${SAMPLE_REF}ev-bike-cat`,
      // An evening ride (Review 20: its photo is a bike at a bike night, not a sunrise).
      id: 'ev-bike-cat', type: 'cruise', title: `Evening ride: ${d2.name}`,
      description: 'Bikes only. Tea and a bacon roll at the finish.',
      startsAt: at(now, 6, 19, 0), endsAt: at(now, 6, 22, 0), area: d2.at, areaName: d2.region, routeMiles: Math.round(d2.miles ?? 20),
      stops: driveStops('bc', d2),
      currentStop: 0, revealMinutesBefore: 120, hostIds: ['aimee', 'sully'],
      filter: { ...DEFAULT_FILTER, cars: false, bikes: true, classes: ['S', 'A', 'B'], minMods: 0, radiusMiles: 100 },
      going: ['aimee', 'sully', 'liv', 'gaz'], checkIns: {},
      // Bring your mates: @aimee.r1 (a connection) invited you. It's bikes only, so you'd ask to go.
      invitedBy: { [ME]: 'aimee' },
    },
    {
      photo: `${SAMPLE_REF}ev-show-don`,
      id: 'ev-show-don', type: 'show', title: 'Modified show day',
      description: 'Show-and-shine, club stands and a trade area. Tickets through the venue.',
      startsAt: at(now, 12, 9, 0), endsAt: at(now, 12, 17, 0), area: circuit.at, areaName: circuit.name,
      stops: [{ id: 'sd-1', name: circuit.name, at: circuit.at }],
      currentStop: 0, revealMinutesBefore: 0, hostIds: ['cal'],
      filter: { ...DEFAULT_FILTER, everyone: true, minMods: 0, radiusMiles: 100 },
      going: ['cal', 'jord', 'nina', 'bex', 'em'], checkIns: {},
      // Organised events (organised.ts), all made up: an organiser, sponsors (one is a sample partner's shop page) and tickets.
      organised: true,
      organiser: 'Sample Show Events',
      sponsors: [{ name: 'Sample Detailing Studio', shop: 'partner:demo-partner-detailing' }, { name: 'Sample Tyres Direct' }],
      ticketPence: 1200,
      ticketUrl: 'https://example.com/tickets/show-day',
    },
    {
      // A sponsored street-side meet run by an organiser, tonight: sits beside the local meets, in its own group.
      id: 'ev-org-cars', type: 'meet', title: 'Autumn cars and coffee',
      description: 'A planned evening with a coffee van and a prize for the best paint. Sample meet, made up for the demo.',
      startsAt: tonightAt(now, 22, 15).toISOString(), endsAt: tonightAt(now, 23, 59).toISOString(),
      area: home, areaName: area,
      stops: [{ id: 'oc-1', name: 'Business park car park', at: here(52.5156, -1.7072) }],
      currentStop: 0, revealMinutesBefore: 0, hostIds: ['kez'],
      filter: { ...DEFAULT_FILTER, everyone: true, minMods: 0, radiusMiles: 30 },
      going: ['kez', 'cal', 'priya'], checkIns: {},
      organised: true,
      organiser: 'Sample Events Co',
      sponsors: [{ name: 'Sample Rolling Road', shop: 'partner:demo-partner-rolling-road' }],
    },
    {
      // A ticketed track evening at the nearest circuit.
      id: 'ev-org-track', type: 'trackday', title: 'Sample track evening',
      description: 'Open pit lane, briefing at the start. Sample meet, made up for the demo.',
      startsAt: at(now, 9, 17, 0), endsAt: at(now, 9, 21, 0), area: circuit2.at, areaName: circuit2.name,
      stops: [{ id: 'ot-1', name: circuit2.name, at: circuit2.at }],
      currentStop: 0, revealMinutesBefore: 0, hostIds: ['cal'],
      filter: { ...DEFAULT_FILTER, everyone: true, minMods: 0, radiusMiles: 100 },
      going: ['cal', 'nina'], checkIns: {},
      organised: true,
      organiser: 'Sample Track Days',
      sponsors: [{ name: 'Sample Rolling Road', shop: 'partner:demo-partner-rolling-road' }],
      ticketPence: 9500,
      ticketUrl: 'https://example.com/tickets/track-evening',
    },
    {
      // Ended a week ago, voting closed: results, trophies and photos.
      photo: `${SAMPLE_REF}ev-past-snowdome`,
      gallery: ['g-past-1', 'g-past-2', 'g-past-3'].map((k) => `${SAMPLE_REF}${k}`),
      id: 'ev-past-snowdome', type: 'meet', title: "Last week's meet",
      description: 'Same car park, last Friday.',
      startsAt: iso(t.lastWeek.start), endsAt: iso(t.lastWeek.end), area: home, areaName: area,
      stops: [{ id: 'ps-1', name: 'Leisure park car park', at: here(52.6105, -1.6720) }],
      // Not Tom (Review 14): his build is the Sunday meet's photo, and a past meet needs its own.
      currentStop: 0, revealMinutesBefore: 60, hostIds: ['priya'],
      filter: { ...DEFAULT_FILTER, everyone: true, minMods: 0, radiusMiles: 30 },
      // You went too (Review 17): Me counts it as a meet, and your Past list says "Went".
      going: [...lastGoing, ME],
      checkIns: Object.fromEntries([...lastGoing, ME].map((u) => [u, ['ps-1']])),
      arrivals: Object.fromEntries([...lastGoing, ME].map((u, i) => [u, iso(t.lastWeek.start, 6 * i)])),
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
    m('c1', 'ev-meet-now', 'em', "We're at the far end by the lights. Plenty of room.", 25),
    m('c2', 'ev-meet-now', 'jord', 'Here. Parked next to the white Golf.', 12),
    m('c3', 'ev-rolling-late', 'dan', 'First meet point shows at half nine. Check in at each one.', 40),
    m('c4', 'ev-cruise-peak', 'mo', 'Fuel up before the start, nothing open after.', 300),
    m('c5', 'ev-cruise-peak', 'aimee', 'Bringing the R1, will sit at the back.', 120),
  ];
}

/** Last week's three trophies: Best in show, Best car, Best bike (Redesign 2: no other trophies). */
function votes(now: Date): Vote[] {
  const when = new Date(demoTimes(now).lastWeek.end.getTime() - 20 * MIN).toISOString();
  const v = (voterId: string, category: Vote['category'], buildId: string): Vote => ({ eventId: 'ev-past-snowdome', voterId, category, buildId, at: when });
  return [
    v('tom', 'best-in-show', 'b-dan-0'), v('kez', 'best-in-show', 'b-dan-0'), v('em', 'best-in-show', 'b-dan-0'), v('priya', 'best-in-show', 'b-dan-0'), v('jord', 'best-in-show', 'b-aimee-0'),
    v('tom', 'best-car', 'b-mo-0'), v('aimee', 'best-car', 'b-mo-0'), v('sully', 'best-car', 'b-mo-0'), v('priya', 'best-car', 'b-kez-0'),
    v('tom', 'best-bike', 'b-aimee-0'), v('dan', 'best-bike', 'b-aimee-0'), v('mo', 'best-bike', 'b-aimee-0'),
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

export function seed(now: Date = appNow(), scene: SceneOptions = {}): SeedState {
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
        mods: makeMods(id, b.mods), tuneStage: seedStage(b.mods), photos: samplePhotoRefs(id), colour: b.colour,
      };
    }),
  );
  const evs = events(now, home);
  const named = scene.names && Object.keys(scene.names).length ? applySceneNames(evs, scene.names, seededStops(home)) : evs;
  // Bundled places aren't part of the save: the store reads them from the bundle (placeStore.ts).
  const spots: Spot[] = [];
  return { users, builds, crews: CREWS, events: named, chat: chat(now), votes: votes(now), spots };
}
