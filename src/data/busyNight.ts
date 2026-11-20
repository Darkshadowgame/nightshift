import type { Build, ChatMessage, LatLng, Mod, ModCategory, NightEvent, User } from '../lib/types';
import type { ConnectionRow } from '../lib/connections';
import type { ForumReply, ForumThread, Listing } from '../lib/forum';
import type { Conversation, Message } from '../lib/messages';
import type { Post, PostComment } from '../lib/posts';
import { applyAnswer, KIND_INFO, snapPoint, type RoadReport, type RoadReportKind } from '../lib/roadReports';
import { DEFAULT_FILTER, buildMatches } from '../lib/invites';
import { eventArea } from '../lib/area';
import { isPublicType } from '../lib/events';
import { milesBetween } from '../lib/geo';
import { meetAt } from '../lib/postPrivacy';
import { areaNameNear, nearestRegion } from '../lib/profile';
import { nearest, translate } from '../lib/scene';
import { similarSample } from '../lib/similarPhoto';
import { SAMPLE_REF } from '../lib/photoSource';
import { STAND_IN_PHOTOS } from './standInPhotos';
import { modelLabel, type Variant } from '../lib/vehicles';
import { DEMO_ROADS, roadPoints } from './demoRoads';
import { PLACES, type PlaceSeed } from './places';
import { DEMO_HOME, demoTimes, ME, sceneAreaName } from './seed';
import { allVariants } from './vehicles';

/**
 * "Busy night" (Settings › Demo, off by default): a much fuller made-up scene on top of the
 * normal demo night, so the app can be seen populated. About 60 more sample people with real UK
 * modified cars and bikes from the vehicle data, about 20 more meets, cruises and rolling meets
 * round the home area, more posts, forum threads, For sale listings, chats and connection
 * requests, and plenty of road reports round the demo drive routes.
 *
 * Everything is invented (handles, names, places) and generated from a fixed seed, so it is the
 * same on every launch. It stays on the phone: it's only ever part of the local demo, never sent
 * to the server. Every id starts with `bz-` (road reports `demo-rr-bz-`), so turning it off takes
 * exactly this back out and leaves the normal demo night as it was.
 */

export const BUSY_PREFIX = 'bz-';
/** People asking to connect with you on the busy night: the Community badge's number when it's switched on. */
export const BUSY_REQUESTS = 3;
/** Is this id (person, build, event, post, thread, chat…) part of the busy scene? */
export function isBusyId(id: string | null | undefined): boolean {
  return !!id && (id.startsWith(BUSY_PREFIX) || id.startsWith(`b-${BUSY_PREFIX}`) || id.startsWith(`ev-${BUSY_PREFIX}`) || id.startsWith(`demo-rr-${BUSY_PREFIX}`));
}

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
const SEED = 0x6e5b11;

/** A small seeded random (mulberry32): the same numbers every time for the same seed. */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const MILES_PER_DEG = 69.05;
function offset(p: LatLng, miles: number, bearingDeg: number): LatLng {
  const b = (bearingDeg * Math.PI) / 180;
  const lat = p.lat + (miles * Math.cos(b)) / MILES_PER_DEG;
  const lng = p.lng + (miles * Math.sin(b)) / (MILES_PER_DEG * Math.cos((p.lat * Math.PI) / 180));
  return { lat: Math.round(lat * 1e4) / 1e4, lng: Math.round(lng * 1e4) / 1e4 };
}

// ---------------------------------------------------------------------------
// People and builds
// ---------------------------------------------------------------------------

/** A vehicle from the app's own vehicle data: make, the model as a build saves it, and the first model year. */
export type VehicleSpec = [make: string, model: string, from: number];

/**
 * The busy scene's vehicles: the modified cars and bikes you'd see at a UK meet. People 0–59 own
 * the first 60 (in order); the last 10 (bikes) are second vehicles for people 0–9.
 */
export const BUSY_VEHICLES: VehicleSpec[] = [
  ['Honda', 'Civic Type R FK2', 2015], ['Volkswagen', 'Golf R Mk7', 2014], ['Ford', 'Focus ST Mk3 ST250', 2012], ['Vauxhall', 'Astra VXR J', 2012],
  ['Vauxhall', 'Corsa VXR E', 2015], ['Renault', 'Clio RS Clio II 182', 2004], ['Renault', 'Megane RS Mk3 265', 2012], ['Mazda', 'MX-5 NA', 1994],
  ['Toyota', 'GT86 ZN6', 2012], ['Toyota', 'Supra Mk4 UK', 1993], ['Mitsubishi', 'Lancer Evolution Evo VIII', 2003], ['Subaru', 'Impreza WRX STI Hawkeye STI', 2006],
  ['BMW', 'M3 E46', 2000], ['BMW', 'M4 F82 Competition', 2016], ['BMW', 'M2 F87 Competition', 2018], ['Audi', 'S3 8V facelift', 2016],
  ['Audi', 'RS3 8V facelift', 2017], ['Nissan', '350Z Z33 HR', 2007], ['Nissan', 'GT-R R35 MY17', 2017], ['Nissan', 'Skyline R33 GTS-t', 1993],
  ['Mini', 'Cooper S R56', 2006], ['Mini', 'John Cooper Works F56', 2015], ['SEAT', 'Leon Cupra Mk3 280', 2014], ['Mercedes', 'A45 W176 facelift', 2016],
  ['Abarth', '595 Competizione 180', 2016], ['Volkswagen', 'Polo GTI AW', 2018], ['Honda', 'S2000 AP2', 2004], ['Honda', 'Integra DC5 Type S JDM', 2004],
  ['Toyota', 'Celica ST205 GT-Four', 1994], ['Ford', 'Mustang S550 GT', 2015], ['Audi', 'RS6 C7 Avant', 2013], ['Suzuki', 'Swift Sport ZC33S', 2018],
  ['Citroen', 'Saxo 1.1', 1996], ['Peugeot', '106 Ph2', 1996], ['Porsche', 'Cayman 987.2 S', 2009], ['Lotus', 'Elise S2 111R', 2004],
  ['Nissan', '370Z Z34', 2009], ['Skoda', 'Octavia vRS Mk3 facelift', 2017], ['Mercedes', 'A35 W177', 2019], ['Honda', 'Civic Type R FL5', 2023],
  ['Hyundai', 'i30 N PD facelift Performance', 2021], ['Honda', 'Civic Type R EP3', 2001], ['Subaru', 'BRZ Gen 1', 2012], ['Nissan', 'Skyline R34 GT-T', 1998],
  ['Mitsubishi', 'Lancer Evolution Evo VI', 1999], ['Ford', 'Fiesta ST Mk8', 2018], ['Ford', 'Focus RS Mk2 RS500', 2010], ['Toyota', 'GR Yaris Gen 2', 2024],
  ['Volkswagen', 'Golf GTI Mk2 16v', 1986], ['Porsche', '911 996 Carrera', 1998],
  ['Yamaha', 'MT-07', 2018], ['Yamaha', 'MT-09', 2021], ['Yamaha', 'YZF-R6', 2017], ['Yamaha', 'YZF-R1', 2015], ['Honda', 'CBR600RR PC40', 2013],
  ['Kawasaki', 'Z900', 2020], ['Kawasaki', 'ZX-6R 636', 2019], ['Triumph', 'Street Triple 765 RS', 2020], ['Ducati', 'Panigale V4 S', 2018], ['BMW', 'S1000RR K67', 2019],
  // Second vehicles for people 0–9.
  ['Suzuki', 'GSX-R1000 L7-', 2017], ['Suzuki', 'Hayabusa Gen2 ABS', 2013], ['Kawasaki', 'Ninja 400', 2018], ['KTM', '1290 Super Duke R Gen3', 2020],
  ['Aprilia', 'Tuono V4 1100', 2021], ['Yamaha', 'MT-10', 2022], ['Suzuki', 'SV650', 2016], ['Triumph', 'Speed Triple 1200 RS', 2021],
  ['Yamaha', 'Tracer 9 GT', 2021], ['Ducati', 'Monster 937', 2021],
];

/** Invented handles and first names, one per person (not real people). */
const BUSY_HANDLES: [handle: string, name: string][] = [
  ['fk2_frankie', 'Frankie'], ['midnight.mk7', 'Josh'], ['st250_shaun', 'Shaun'], ['vxr_val', 'Val'], ['corsa.kian', 'Kian'],
  ['clio182_chloe', 'Chloe'], ['meg265_rhys', 'Rhys'], ['na_ollie', 'Ollie'], ['gt86_harvey', 'Harvey'], ['jza_jay', 'Jay'],
  ['evo8_connor', 'Connor'], ['hawkeye.hannah', 'Hannah'], ['e46_ellis', 'Ellis'], ['f82_marcus', 'Marcus'], ['m2_zara', 'Zara'],
  ['s3_sophie', 'Sophie'], ['rs3_ryan', 'Ryan'], ['z33_zak', 'Zak'], ['r35_robbie', 'Robbie'], ['r33_reece', 'Reece'],
  ['r56_millie', 'Millie'], ['jcw_jas', 'Jas'], ['cupra280_carl', 'Carl'], ['a45_amir', 'Amir'], ['abarth_izzy', 'Izzy'],
  ['polo.aw.ellie', 'Ellie'], ['s2k_sean', 'Sean'], ['dc5_dev', 'Dev'], ['gt4_gavin', 'Gavin'], ['pony_paige', 'Paige'],
  ['rs6_rachel', 'Rachel'], ['swifty_sid', 'Sid'], ['saxo.ben', 'Ben'], ['tia_106', 'Tia'], ['cayman.chris', 'Chris'],
  ['elise_eve', 'Eve'], ['z34_noah', 'Noah'], ['vrs_vince', 'Vince'], ['a35_aisha', 'Aisha'], ['fl5_finn', 'Finn'],
  ['i30n_imogen', 'Imogen'], ['ep3_eddie', 'Eddie'], ['brz_megan', 'Megan'], ['r34gtt_luke', 'Luke'], ['evo6_kai', 'Kai'],
  ['mk8st_jade', 'Jade'], ['rs500_rory', 'Rory'], ['gry_george', 'George'], ['mk2gti_alfie', 'Alfie'], ['996_oscar', 'Oscar'],
  ['mt07_molly', 'Molly'], ['cp3_charlie', 'Charlie'], ['r6_rosie', 'Rosie'], ['r1_reuben', 'Reuben'], ['cbr_callum', 'Callum'],
  ['z900_bella', 'Bella'], ['636_jack', 'Jack'], ['triple_tash', 'Tash'], ['v4_vinny', 'Vinny'], ['s1k_sasha', 'Sasha'],
];

export const BUSY_PEOPLE_COUNT = BUSY_HANDLES.length;
const personId = (i: number) => `${BUSY_PREFIX}${BUSY_HANDLES[i][0].replace(/[^a-z0-9]/gi, '').toLowerCase()}`;
/** Every busy person's id, in order. */
export const BUSY_PEOPLE: string[] = BUSY_HANDLES.map((_, i) => personId(i));

const COLOURS = ['#ff9a2e', '#3f6fff', '#ff4d4d', '#2ec4b6', '#9b5de5', '#ff4fa3', '#9dfa5a', '#e9edf4', '#ffd166', '#3fd6ff', '#7a7f8c', '#1b1d22'];

type ModSpec = [ModCategory, string, number?];
const CAR_TURBO_MODS: ModSpec[] = [
  ['engine', 'Stage 1 remap', 40], ['engine', 'Stage 2 remap', 70], ['intake', 'Turbo inlet'], ['intake', 'Induction kit'], ['exhaust', 'Cat-back'],
  ['exhaust', 'Decat downpipe'], ['turbo', 'Hybrid turbo'], ['suspension', 'Coilovers'], ['suspension', 'Lowering springs'], ['wheels', '18" flow-formed'],
  ['wheels', '19" forged'], ['brakes', 'Big brake kit'], ['body', 'Front splitter'], ['interior', 'Bucket seats'], ['lighting', 'LED headlights'],
];
const CAR_NA_MODS: ModSpec[] = [
  ['intake', 'Induction kit', 5], ['exhaust', '4-2-1 manifold', 8], ['exhaust', 'Cat-back'], ['engine', 'ECU map', 10], ['suspension', 'Coilovers'],
  ['suspension', 'Polybushes'], ['wheels', '17" Rotas'], ['wheels', '16" Team Dynamics'], ['brakes', 'Braided lines'], ['interior', 'Half cage'],
  ['body', 'Ducktail spoiler'], ['interior', 'Quick-release wheel'],
];
const BIKE_MODS: ModSpec[] = [
  ['exhaust', 'Slip-on end can', 3], ['exhaust', 'Full system', 6], ['engine', 'ECU flash', 5], ['other', 'Quickshifter'], ['other', 'Tail tidy'],
  ['body', 'Double-bubble screen'], ['suspension', 'Rear shock upgrade'], ['brakes', 'Braided lines'], ['other', 'Bar-end mirrors'], ['other', 'Rearsets'],
];

/** The variant a spec names, from the app's vehicle data (undefined if the data changed). */
export function findBusyVariant(list: readonly Variant[], [make, model, from]: VehicleSpec): Variant | undefined {
  return list.find((v) => v.make === make && modelLabel(v) === model && v.from === from);
}

function pickMods(rand: () => number, pool: ModSpec[], n: number): ModSpec[] {
  const out: ModSpec[] = [];
  const left = [...pool];
  while (out.length < n && left.length) {
    const [m] = left.splice(Math.floor(rand() * left.length), 1);
    // One engine tune at a time.
    if (m[0] === 'engine' && out.some((x) => x[0] === 'engine')) continue;
    out.push(m);
  }
  return out;
}

function stageOf(mods: ModSpec[]): Build['tuneStage'] {
  const e = mods.find((m) => m[0] === 'engine')?.[1] ?? '';
  return /^Stage 1/.test(e) ? 'stage1' : /^Stage 2/.test(e) ? 'stage2' : undefined;
}

export interface BusyPeople {
  users: User[];
  builds: Build[];
}

/** The busy scene's people (homes round `home`) and their builds. */
export function busyPeople(home: LatLng): BusyPeople {
  const rand = seededRandom(SEED);
  const variants = allVariants();
  const region = nearestRegion(home);
  const users: User[] = [];
  const builds: Build[] = [];
  BUSY_HANDLES.forEach(([handle, name], i) => {
    const id = personId(i);
    // Most live within 12 miles, a few up to 40.
    const far = rand() < 0.15;
    const at = offset(home, far ? 15 + rand() * 25 : 1 + rand() * 11, rand() * 360);
    users.push({ id, handle, name, region, home: at });
    const specs = [BUSY_VEHICLES[i], ...(i < 10 ? [BUSY_VEHICLES[60 + i]] : [])];
    specs.forEach((spec, n) => {
      const v = findBusyVariant(variants, spec);
      if (!v) return;
      const bid = `b-${id}-${n}`;
      const pool = v.kind === 'bike' ? BIKE_MODS : v.asp === 't' || v.asp === 's' ? CAR_TURBO_MODS : CAR_NA_MODS;
      const specMods = pickMods(rand, pool, 1 + Math.floor(rand() * 5));
      const mods: Mod[] = specMods.map(([category, mname, bhpGain], k) => ({ id: `${bid}-m${k}`, category, name: mname, bhpGain }));
      const to = v.to ?? 2025;
      const year = v.from + Math.floor(rand() * (to - v.from + 1));
      const random = COLOURS[Math.floor(rand() * COLOURS.length)];
      // The colour of the stand-in photo it shows, when that's the same model (Review 20: words and photos agree).
      const pic = similarSample(v.make, modelLabel(v), v.kind, year);
      const paint = pic?.match === 'model' ? STAND_IN_PHOTOS.find((p) => p.key === pic.key)?.paint : undefined;
      builds.push({
        id: bid, ownerId: id, kind: v.kind, make: v.make, model: modelLabel(v), year,
        stockBhp: v.bhp, weightKg: v.weightKg, torqueLbFt: v.torqueLbFt, mods, photos: [], colour: paint ?? random,
        vehicleId: v.id, tuneStage: stageOf(specMods),
      });
    });
  });
  return { users, builds };
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

const JAPANESE = ['Honda', 'Toyota', 'Nissan', 'Subaru', 'Mitsubishi', 'Mazda', 'Suzuki'];
const VAG = ['Volkswagen', 'Audi', 'SEAT', 'Skoda'];
const PLACE_NAMES_POOL = [
  'Retail park car park', 'Business park car park', 'Leisure park car park', 'Garden centre car park', 'Industrial estate car park',
  'Cinema car park', 'Drive-thru car park', 'Services car park', 'Bowling alley car park', 'Trading estate car park', 'Superstore car park',
  'Country park car park', 'Truck stop', 'Diner car park', 'Bike café car park',
];

/**
 * `live`: started this many minutes ago. Always less than 40, so the demo night's own live meet
 * (started 40 minutes ago) stays the first live meet and Tonight's "Start here" pick.
 */
type When = { live: number } | { day: number; hour: number; minute?: number };
interface EventSpec {
  type: 'meet' | 'cruise' | 'rolling';
  title: string;
  description: string;
  when: When;
  hours: number;
  /** Miles from home and a bearing; cruises use a real drive instead. */
  miles: number;
  filter: Partial<typeof DEFAULT_FILTER>;
  going: number;
  reveal?: number;
  /**
   * A night photo of its own (samplePhotos.ts, Review 20 #39): evening and night meets that aren't
   * about one make. Without it (daytime and one-make meets) the card shows the host's build.
   */
  photo?: string;
}

const EVENT_SPECS: EventSpec[] = [
  { type: 'meet', title: 'Friday night meet', description: 'The big one. Park up, no revving, leave it clean.', when: { live: 35 }, hours: 3, miles: 4, filter: { everyone: true }, going: 46 , photo: 'bn-1' },
  { type: 'meet', title: 'JDM night', description: 'Japanese cars only. Arranged with the site.', when: { live: 30 }, hours: 3, miles: 7, filter: { cars: true, bikes: false, brands: JAPANESE }, going: 18 },
  { type: 'meet', title: 'Bike night', description: 'Bikes of every kind. Tea and bacon rolls inside till late.', when: { live: 25 }, hours: 3, miles: 9, filter: { cars: false, bikes: true }, going: 14 , photo: 'bn-bike' },
  { type: 'meet', title: 'Hot hatch takeover', description: 'Hot hatches, stock or modified.', when: { live: 15 }, hours: 3, miles: 12, filter: { cars: true, bikes: false, classes: ['A', 'B', 'C'] }, going: 41 , photo: 'bn-2' },
  { type: 'meet', title: 'VAG meet', description: 'VW, Audi, SEAT and Skoda. Quiet arrivals please.', when: { day: 0, hour: 22 }, hours: 2.5, miles: 5, filter: { cars: true, bikes: false, brands: VAG }, going: 22 },
  { type: 'rolling', title: 'Late rolling meet: east side', description: 'Three meet points. The host moves it on.', when: { day: 0, hour: 22, minute: 30 }, hours: 2.5, miles: 6, filter: { everyone: true }, going: 25, reveal: 30 , photo: 'bn-3' },
  { type: 'meet', title: 'Night photo meet', description: 'Bring a tripod. Modified only.', when: { day: 0, hour: 23 }, hours: 2, miles: 35, filter: { minMods: 1 }, going: 11 , photo: 'bn-4' },
  { type: 'cruise', title: 'Midnight cruise', description: 'Start to finish with a regroup halfway. Speed limits all the way.', when: { day: 0, hour: 23, minute: 30 }, hours: 2, miles: 0, filter: { classes: ['S', 'A', 'B'] }, going: 12, photo: 'bn-10' },
  { type: 'rolling', title: 'Rolling meet: north', description: 'Planned in advance, location shows half an hour before.', when: { day: 0, hour: 22, minute: 15 }, hours: 2.5, miles: 40, filter: { everyone: true }, going: 20, reveal: 30, photo: 'bn-9' },
  { type: 'meet', title: 'Saturday morning coffee', description: 'Coffee and cars. Daytime, family friendly.', when: { day: 1, hour: 9, minute: 30 }, hours: 3, miles: 8, filter: { everyone: true }, going: 30 },
  { type: 'cruise', title: 'Saturday afternoon cruise', description: 'A proper drive with a stop for food at the end.', when: { day: 1, hour: 14 }, hours: 3, miles: 0, filter: { minMods: 1 }, going: 16 },
  { type: 'meet', title: 'Ford owners night', description: 'Fiestas, Focuses and anything with a blue oval.', when: { day: 1, hour: 19 }, hours: 3, miles: 15, filter: { cars: true, bikes: false, brands: ['Ford'] }, going: 17 },
  { type: 'meet', title: 'Bikes and brews', description: 'Bikes only. Café open till ten.', when: { day: 1, hour: 18 }, hours: 3, miles: 28, filter: { cars: false, bikes: true }, going: 15 },
  { type: 'meet', title: 'Saturday night meet', description: 'Everyone welcome. Arranged with the site, marshals on.', when: { day: 1, hour: 20 }, hours: 3, miles: 10, filter: { everyone: true }, going: 52, photo: 'bn-11' },
  { type: 'meet', title: 'Big Saturday meet', description: 'The regional one. Worth the drive.', when: { day: 1, hour: 19, minute: 30 }, hours: 4, miles: 45, filter: { everyone: true }, going: 64, photo: 'bn-12' },
  { type: 'rolling', title: 'Rolling meet: west', description: 'Modified only, two mods or more.', when: { day: 1, hour: 21, minute: 30 }, hours: 2.5, miles: 9, filter: { minMods: 2 }, going: 19, reveal: 30 , photo: 'bn-7' },
  { type: 'cruise', title: 'Sunday breakfast ride', description: 'Bikes only. Breakfast at the finish.', when: { day: 2, hour: 8 }, hours: 3, miles: 0, filter: { cars: false, bikes: true }, going: 21 },
  { type: 'meet', title: 'BMW Sunday', description: 'BMWs of every age.', when: { day: 2, hour: 10 }, hours: 3, miles: 18, filter: { cars: true, bikes: false, brands: ['BMW'] }, going: 13 },
  { type: 'meet', title: 'Retro and classic Sunday', description: 'Anything older than 2005 at the front.', when: { day: 2, hour: 11 }, hours: 4, miles: 30, filter: { everyone: true }, going: 27 },
  { type: 'cruise', title: 'Sunday evening cruise', description: 'Classes A to C. Steady pace.', when: { day: 2, hour: 18 }, hours: 2, miles: 0, filter: { classes: ['A', 'B', 'C'] }, going: 18 },
  { type: 'meet', title: 'Midweek meet', description: 'Same place every Wednesday.', when: { day: 5, hour: 19, minute: 30 }, hours: 3, miles: 20, filter: { everyone: true }, going: 33, photo: 'bn-13' },
  { type: 'meet', title: 'Track prep and tea', description: 'Three mods or more. Talk tyres, pads and track days.', when: { day: 6, hour: 19 }, hours: 3, miles: 40, filter: { minMods: 3 }, going: 9 , photo: 'bn-8' },
];

/** Tonight at this clock time, the same way seed.ts lays the demo night out. */
function tonightAt(now: Date, day: number, hour: number, minute = 0): Date {
  const d = new Date(now);
  if (now.getHours() < 5) d.setDate(d.getDate() - 1);
  d.setDate(d.getDate() + day);
  d.setHours(hour, minute, 0, 0);
  return d;
}

const isDrive = (p: PlaceSeed) => p.kind === 'drive' && (p.path?.length ?? 0) > 1;

const CHAT_LINES = [
  'On my way, 10 minutes out.', 'Parked by the entrance, come say hi.', 'Anyone got a spare tyre gauge?', 'Plenty of room at the back.',
  'Running a bit late, save me a spot.', 'Lovely turnout already.', 'Remember: no revving, we want to keep this place.', 'Fuel up before, nothing open after.',
  'Bringing the other car tonight.', 'Who’s doing the photos?', 'Coffee van is here.', 'See you there.',
];

export interface BusyEvents {
  events: NightEvent[];
  chat: ChatMessage[];
}

/** The busy scene's events and their chat, laid out round `home` for the demo clock's `now`. */
export function busyEvents(now: Date, home: LatLng, people: BusyPeople, sampleUsers: readonly User[] = [], sampleBuilds: readonly Build[] = []): BusyEvents {
  const rand = seededRandom(SEED + 1);
  const t = demoTimes(now);
  const area = sceneAreaName(home);
  // Real drives near home for the cruises; the normal demo uses the nearest two.
  const drives = nearest(PLACES.filter(isDrive), home, 8).slice(2);
  // Everyone who could go: the busy people first, then the normal sample people (never you).
  const builds = [...people.builds, ...sampleBuilds.filter((b) => b.ownerId !== ME)];
  const who = [...people.users, ...sampleUsers.filter((u) => u.id !== ME)].map((u) => u.id);
  const events: NightEvent[] = [];
  const chat: ChatMessage[] = [];
  let cruise = 0;
  EVENT_SPECS.forEach((spec, i) => {
    const id = `ev-${BUSY_PREFIX}${i + 1}`;
    const filter = { ...DEFAULT_FILTER, minMods: 0, radiusMiles: spec.miles > 25 ? 100 : 40, ...spec.filter };
    const start =
      'live' in spec.when
        ? new Date(Math.floor((now.getTime() - spec.when.live * MIN) / (5 * MIN)) * 5 * MIN)
        : tonightAt(now, spec.when.day, spec.when.hour, spec.when.minute ?? 0);
    // Never before the demo night's own live meet started (it's the "Start here" pick).
    if (!('live' in spec.when) && start.getTime() <= now.getTime()) start.setTime(t.meetNow.start.getTime() + (i + 2) * 10 * MIN);
    const end = new Date(start.getTime() + spec.hours * HOUR);
    const bearing = rand() * 360;
    const sp = (n: number) => `${BUSY_PREFIX}${i + 1}-${n}`;
    const placeName = () => PLACE_NAMES_POOL[Math.floor(rand() * PLACE_NAMES_POOL.length)];
    let stops: NightEvent['stops'];
    let areaName = area;
    let routeMiles: number | undefined;
    if (spec.type === 'cruise' && drives.length) {
      const d = drives[cruise++ % drives.length];
      const path = d.path!;
      stops = [
        { id: sp(1), name: `Start: ${d.name}`, at: path[0] },
        { id: sp(2), name: 'Regroup: Halfway lay-by', at: path[Math.floor(path.length / 2)] },
        { id: sp(3), name: 'Finish: End of the road', at: path[path.length - 1] },
      ];
      areaName = d.region;
      routeMiles = Math.round(d.miles ?? 20);
    } else if (spec.type === 'rolling') {
      const first = offset(home, spec.miles, bearing);
      stops = [0, 1, 2].map((n) => ({ id: sp(n + 1), name: placeName(), at: n === 0 ? first : offset(first, 2 + n * 2, bearing + 90 * n + rand() * 40) }));
      stops[2] = { ...stops[2], note: 'Planned, hidden until you move on' };
    } else {
      stops = [{ id: sp(1), name: placeName(), at: offset(home, spec.miles + rand() * 1.5, bearing) }];
    }
    const placed = stops.flatMap((s) => (s.at ? [s.at] : []));
    const ea = eventArea(placed, id, isPublicType(spec.type));
    // A real town near the area (Review 18), not "Around Tamworth" for every busy meet.
    if (spec.type !== 'cruise') areaName = areaNameNear(ea.area);
    // Who's going: people with a build the invite lets in, in a shuffled order.
    const fits = new Map<string, string>();
    for (const b of builds) if (!fits.has(b.ownerId) && buildMatches(b, filter)) fits.set(b.ownerId, b.id);
    const order = who.filter((u) => fits.has(u)).map((u) => ({ u, k: rand() })).sort((a, b) => a.k - b.k).map((x) => x.u);
    const going = order.slice(0, spec.going);
    const host = going[0];
    const live = start.getTime() <= now.getTime();
    const checkIns: Record<string, string[]> = live ? Object.fromEntries(going.filter(() => rand() < 0.7).map((u) => [u, [stops[0].id]])) : {};
    events.push({
      id, type: spec.type, title: spec.title, description: spec.description, ...(spec.photo ? { photo: `${SAMPLE_REF}${spec.photo}` } : {}),
      startsAt: start.toISOString(), endsAt: end.toISOString(), areaName, ...(routeMiles ? { routeMiles } : {}),
      stops, currentStop: 0, revealMinutesBefore: spec.reveal ?? 60, hostIds: host ? [host] : [],
      filter, going, checkIns, vehicles: Object.fromEntries(going.map((u) => [u, fits.get(u)!])),
      ...ea,
    });
    // A few lines of chat from people going, before now.
    const lines = 2 + Math.floor(rand() * 3);
    for (let n = 0; n < lines && going.length; n++) {
      chat.push({
        id: `${BUSY_PREFIX}c${i + 1}-${n}`, eventId: id, userId: going[Math.floor(rand() * Math.min(going.length, 12))],
        text: CHAT_LINES[Math.floor(rand() * CHAT_LINES.length)], at: new Date(now.getTime() - (lines - n) * (8 + Math.floor(rand() * 20)) * MIN).toISOString(),
      });
    }
  });
  return { events, chat };
}

// ---------------------------------------------------------------------------
// The whole slice on the main store
// ---------------------------------------------------------------------------

export interface BusySlice {
  users: User[];
  builds: Build[];
  events: NightEvent[];
  chat: ChatMessage[];
}

export function busyScene(now: Date, home: LatLng = DEMO_HOME, sampleUsers: readonly User[] = [], sampleBuilds: readonly Build[] = []): BusySlice {
  const people = busyPeople(home);
  const { events, chat } = busyEvents(now, home, people, sampleUsers, sampleBuilds);
  return { users: people.users, builds: people.builds, events, chat };
}

interface StateLike extends BusySlice {
  votes: { eventId: string }[];
}

/** The state with everything from the busy scene taken back out (and busy people off other events). */
export function withoutBusy<S extends StateLike>(s: S): S {
  const scrub = (e: NightEvent): NightEvent => {
    if (!e.going.some(isBusyId) && !(e.requests ?? []).some(isBusyId) && !Object.keys(e.checkIns).some(isBusyId)) return e;
    const keep = (u: string) => !isBusyId(u);
    return {
      ...e,
      going: e.going.filter(keep),
      hostIds: e.hostIds.filter(keep),
      ...(e.requests ? { requests: e.requests.filter(keep) } : {}),
      ...(e.declined ? { declined: e.declined.filter(keep) } : {}),
      checkIns: Object.fromEntries(Object.entries(e.checkIns).filter(([u]) => keep(u))),
      ...(e.vehicles ? { vehicles: Object.fromEntries(Object.entries(e.vehicles).filter(([u]) => keep(u))) } : {}),
    };
  };
  return {
    ...s,
    users: s.users.filter((u) => !isBusyId(u.id)),
    builds: s.builds.filter((b) => !isBusyId(b.id) && !isBusyId(b.ownerId)),
    events: s.events.filter((e) => !isBusyId(e.id)).map(scrub),
    chat: s.chat.filter((m) => !isBusyId(m.eventId) && !isBusyId(m.userId)),
    votes: s.votes.filter((v) => !isBusyId(v.eventId)),
  };
}

/**
 * The state with the busy scene laid out (again) for `now`: any earlier busy scene comes out
 * first. Whether you said you're going to a busy event is kept across a re-lay.
 */
export function withBusy<S extends StateLike>(s: S, now: Date, home: LatLng): S {
  const mine = new Map(s.events.filter((e) => isBusyId(e.id)).map((e) => [e.id, e]));
  const base = withoutBusy(s);
  const scene = busyScene(now, home, base.users, base.builds);
  const events = scene.events.map((e) => {
    const was = mine.get(e.id);
    if (!was?.going.includes(ME)) return e;
    return { ...e, going: [...e.going, ME], ...(was.vehicles?.[ME] ? { vehicles: { ...e.vehicles, [ME]: was.vehicles[ME] } } : {}) };
  });
  return {
    ...base,
    users: [...base.users, ...scene.users],
    builds: [...base.builds, ...scene.builds],
    events: [...base.events, ...events],
    chat: [...base.chat, ...scene.chat],
  };
}

// ---------------------------------------------------------------------------
// Community
// ---------------------------------------------------------------------------

export interface BusyCommunity {
  connections: ConnectionRow[];
  threads: ForumThread[];
  replies: ForumReply[];
  posts: Post[];
  comments: PostComment[];
  conversations: Conversation[];
  messages: Message[];
  likes: Record<string, number>;
}

const POST_LINES: [string, string?][] = [
  ['Fresh from a wash, ready for tonight.'], ['New wheels on, finally.', 'Wheel shop'], ['Coilovers in, sits just right now.'],
  ['Rolling road day. Happy with the numbers.', 'Rolling road'], ['Early start, empty roads, perfect.', 'Viewpoint lay-by'],
  ['Detailed inside and out. Took all day.'], ['First meet with this one. Nervous!'], ['Who else is out tonight?'],
  ['Brakes done before any more power.'], ['Winter wheels on already.'], ['Sunset run with a few mates.', 'Hill road car park'],
  ['Tried the new café on the bypass, proper friendly to car folk.', 'Roadside café'], ['Service done, new plugs and oil.'],
  ['Tyres warmed, roads dry, good day.'], ['Spot the difference: new front lip.'], ['Garage night. Something’s rattling.'],
  ['Picked her up today. Plans already.'], ['Back on the road after six months.'], ['Clean car club.'], ['That light tonight though.', 'Reservoir car park'],
];
const THREAD_SPECS: [ForumThread['board'], string, string][] = [
  ['advice', 'Misfire under boost after a remap', 'Pulls fine off boost, misfires at about 4k under load. New plugs last month. Coil packs?'],
  ['advice', 'Best tyres for a daily in winter?', 'All-seasons or proper winters on a hot hatch? Midlands, mostly motorway.'],
  ['builds', 'Saxo build: year one', 'Bought it as a non-runner. Engine out, cleaned, back in. Pictures soon.'],
  ['builds', 'Evo VIII: the long road', 'Starting a thread for the Evo. Rust treated, new clutch, next is the turbo.'],
  ['cars', 'Most underrated hot hatch?', 'Mine is the Corsa VXR E. Cheap, quick and nobody looks twice.'],
  ['bikes', 'First big bike after an A2 licence', 'Torn between an MT-09 and a Street Triple. Thoughts?'],
  ['detailing', 'Best snow foam under £20?', 'Looking for something that actually clings. Pressure washer is a cheap one.'],
  ['meets', 'Saturday night meet: parking plan', 'Marshals on the gate from 7:30. Bikes at the front, overflow round the back.'],
  ['local', 'Quiet roads for photos near town?', 'Want somewhere safe to pull over for night photos. Not after a busy spot.'],
  ['advice', 'Insurance at 21 with mods declared', 'Every quote is mad. Which insurers are OK with modified cars?'],
  ['cars', 'Track day first timers: what to bring', 'First track day next month. Helmet, tyre gauge, what else?'],
  ['bikes', 'Chain cleaning: how often?', 'Doing it every 500 miles. Too much? Not enough?'],
];
const LISTING_SPECS: [string, string, Listing][] = [
  ['Coilovers, fit Golf Mk7', 'Around 20k miles, height adjustable, no knocks.', { kind: 'sale', pricePence: 45000, ono: true, condition: 'good', handover: 'collection' }],
  ['18" flow-formed wheels, 5x112', 'Light kerbing on one, tyres at 4 mm.', { kind: 'sale', pricePence: 60000, condition: 'good', handover: 'collection' }],
  ['Wanted: Civic EP3 front bumper', 'Any colour, needs to be uncracked.', { kind: 'wanted', pricePence: 15000, handover: 'either' }],
  ['Akrapovič end can, R6 2017-on', 'Road legal with the baffle in.', { kind: 'sale', pricePence: 32000, ono: true, condition: 'like_new', handover: 'either' }],
  ['Bucket seats with rails', 'Fits most hatches with the right brackets.', { kind: 'sale', pricePence: 25000, condition: 'fair', handover: 'collection' }],
  ['Wanted: Evo VIII rear wing', 'Genuine only.', { kind: 'wanted', handover: 'either' }],
  ['Paddock stands, front and rear', 'Used twice.', { kind: 'sale', pricePence: 6000, condition: 'like_new', handover: 'collection' }],
  ['Big brake kit, 4-pot', 'Came off my RS3, pads half worn.', { kind: 'sale', pricePence: 90000, ono: true, condition: 'good', handover: 'collection' }],
  ['Induction kit, Fiesta ST Mk7', 'Barely used.', { kind: 'sale', pricePence: 9000, condition: 'like_new', handover: 'postage' }],
  ['Wanted: Supra Mk4 headlights', 'Clear or tinted, need both.', { kind: 'wanted', pricePence: 40000, handover: 'either' }],
];
const REPLY_LINES = [
  'Had the same thing, it was the coil packs.', 'Check the boost leak first, cheaper than parts.', 'Go for it, you won’t regret it.', 'Following.',
  'Great work, keep the pictures coming.', 'All-seasons for a daily, every time.', 'Street Triple. Lighter and better brakes.', 'Ask a specialist insurer.',
  'Fluids, spare pads, a torque wrench and snacks.', 'Every 500 is about right.', 'Is it still available?', 'Would you post?',
];
const DM_LINES = ['You going tonight?', 'Saw your car at the meet, mint.', 'Where did you get the wheels?', 'Cheers for the help earlier.', 'Running the cruise Saturday?', 'See you there.'];

/**
 * The busy scene's Community: posts, threads, For sale, replies, chats and connection requests.
 * `events`: every event in the scene, so no post sits on a meet point that hasn't shown yet.
 */
export function busyCommunity(now: Date, home: LatLng, region: string, events: readonly NightEvent[], builds: readonly Build[]): BusyCommunity {
  const rand = seededRandom(SEED + 2);
  const ago = (ms: number) => new Date(now.getTime() - ms).toISOString();
  const who = () => BUSY_PEOPLE[Math.floor(rand() * BUSY_PEOPLE.length)];
  const firstBuild = new Map<string, Build>();
  for (const b of builds) if (isBusyId(b.ownerId) && !firstBuild.has(b.ownerId)) firstBuild.set(b.ownerId, b);

  // Connections: a handful you're already connected with, and some asking to connect.
  const connections: ConnectionRow[] = [
    ...BUSY_PEOPLE.slice(0, 6).map((u, i) => ({ from: i % 2 ? ME : u, to: i % 2 ? u : ME, status: 'accepted' as const, createdAt: ago((10 + i) * DAY), answeredAt: ago((9 + i) * DAY) })),
    ...BUSY_PEOPLE.slice(20, 20 + BUSY_REQUESTS).map((u, i) => ({ from: u, to: ME, status: 'pending' as const, createdAt: ago((1 + i * 5) * HOUR) })),
  ];

  // Posts: about their build (with its stand-in photo when it's the same model), some with a place.
  const posts: Post[] = [];
  const comments: PostComment[] = [];
  for (let i = 0; i < 36; i++) {
    const author = BUSY_PEOPLE[(i * 7) % BUSY_PEOPLE.length];
    const b = firstBuild.get(author);
    const [body, place] = POST_LINES[i % POST_LINES.length];
    const pic = b ? similarSample(b.make, b.model, b.kind, b.year) : null;
    let at: LatLng | undefined;
    if (place) {
      at = offset(home, 1 + rand() * 12, rand() * 360);
      // Never on a meet point (postPrivacy.ts): move it well clear.
      for (let k = 0; k < 8 && meetAt(at, events); k++) at = offset(at, 0.6, k * 45);
      if (meetAt(at, events)) at = undefined;
    }
    const id = `${BUSY_PREFIX}po${i + 1}`;
    const commentCount = Math.floor(rand() * 4);
    posts.push({
      id, authorId: author, body, photos: pic?.match === 'model' ? [`sample:${pic.key}`] : [], visibility: i % 11 === 5 ? 'connections' : 'public',
      ...(at ? { at, placeName: place } : {}), ...(b ? { buildId: b.id } : {}),
      createdAt: ago((1 + i * 2.5) * HOUR), likeCount: Math.floor(rand() * 40), commentCount, likedByMe: false, sample: true,
    });
    for (let c = 0; c < commentCount; c++) {
      comments.push({ id: `${id}-c${c}`, postId: id, authorId: who(), body: ['Clean.', 'Proper.', 'Mint that.', 'Need one.', 'What wheels are they?', 'See you tonight.'][Math.floor(rand() * 6)], createdAt: ago((i * 2.5 + 0.5 - c * 0.1) * HOUR), sample: true });
    }
  }

  // Forum threads and For sale listings, with replies.
  const threads: ForumThread[] = [];
  const replies: ForumReply[] = [];
  const thread = (id: string, board: ForumThread['board'], title: string, body: string, created: number, extra: Partial<ForumThread> = {}) => {
    const t: ForumThread = { id, board, authorId: who(), title, body, photos: [], createdAt: ago(created), lastActivityAt: ago(created), replyCount: 0, sample: true, ...extra };
    const n = Math.floor(rand() * 5);
    for (let r = 0; r < n; r++) {
      const at = created - (r + 1) * (created / (n + 2));
      replies.push({ id: `${id}-r${r}`, threadId: id, authorId: who(), body: REPLY_LINES[Math.floor(rand() * REPLY_LINES.length)], photos: [], createdAt: ago(at), helpfulCount: Math.floor(rand() * 5), helpfulByMe: false, sample: true });
      t.lastActivityAt = ago(at);
    }
    t.replyCount = n;
    threads.push(t);
  };
  THREAD_SPECS.forEach(([board, title, body], i) => thread(`${BUSY_PREFIX}ft${i + 1}`, board, title, body, (3 + i * 7) * HOUR, board === 'local' ? { region } : {}));
  LISTING_SPECS.forEach(([title, body, listing], i) => thread(`${BUSY_PREFIX}fs${i + 1}`, 'for_sale', title, body, (2 + i * 5) * HOUR, { listing }));

  // Chats: two groups you're in, and a 1-to-1 with someone you're connected with. Already read, so the
  // Community badge only counts the requests, which the switch's toast names (Review 19, Busy night).
  const friends = BUSY_PEOPLE.slice(0, 6);
  const conversations: Conversation[] = [];
  const messages: Message[] = [];
  const conv = (id: string, kind: Conversation['kind'], memberIds: string[], name: string | undefined, lines: [string, string][]) => {
    const last = ago(lines.length * 7 * MIN);
    conversations.push({ id, kind, ...(name ? { name } : {}), memberIds, adminIds: kind === 'group' ? [memberIds[0]] : [], lastMessageAt: last, unread: 0, canSend: true, sample: true, readUpTo: { [ME]: last } });
    lines.forEach(([sender, body], n) => messages.push({ id: `${id}-m${n}`, conversationId: id, senderId: sender, body, createdAt: ago((lines.length - n) * 9 * MIN), sample: true }));
  };
  conv(`${BUSY_PREFIX}cv-cruise`, 'group', [friends[0], ME, friends[1], friends[2], friends[3]], 'Saturday cruise crew', [
    [friends[0], 'Meeting at the start at 2, fuel up first.'], [friends[1], 'I’m in.'], [friends[2], 'Bringing the bike if it’s dry.'], [friends[3], 'Who’s got the route?'], [friends[0], 'Sending it now.'],
  ]);
  conv(`${BUSY_PREFIX}cv-jdm`, 'group', [friends[4], ME, friends[5], friends[0]], 'JDM lot', [
    [friends[4], 'JDM night tonight, who’s coming?'], [friends[5], 'On my way.'], [friends[0], 'Save me a spot.'],
  ]);
  conv(`${BUSY_PREFIX}cv-dm`, 'direct', [ME, friends[1]], undefined, [
    [friends[1], DM_LINES[0]], [ME, 'Should be, later on.'], [friends[1], DM_LINES[5]],
  ]);

  const likes: Record<string, number> = Object.fromEntries([...firstBuild.values()].map((b) => [b.id, Math.floor(rand() * 30)]));
  return { connections, threads, replies, posts, comments, conversations, messages, likes };
}

// ---------------------------------------------------------------------------
// Road reports ("traffic")
// ---------------------------------------------------------------------------

const ROUTE_KINDS: RoadReportKind[] = ['traffic', 'hazard', 'roadworks', 'mobile_camera', 'police', 'crash', 'traffic', 'closure', 'hazard', 'traffic'];
const AROUND_KINDS: RoadReportKind[] = ['traffic', 'roadworks', 'crash', 'closure', 'mobile_camera', 'hazard', 'police', 'traffic', 'roadworks', 'hazard'];

/**
 * Plenty of drivers' reports for the busy scene: along each demo drive route (from home to the
 * demo night's meet points) and round the home area. Closures on the routes stay unconfirmed, so
 * they warn without forcing a reroute. Ages stay inside each kind's life, so they're live now.
 */
export function busyRoadReports(home: LatLng, now: Date): RoadReport[] {
  const rand = seededRandom(SEED + 3);
  const t = now.getTime();
  let n = 0;
  const make = (kind: RoadReportKind, at: LatLng, confirms: number): RoadReport => {
    const minAgo = Math.floor(rand() * Math.min(KIND_INFO[kind].ttlMin * 0.6, 240));
    const createdAt = new Date(t - minAgo * MIN).toISOString();
    let r: RoadReport = {
      id: `demo-rr-${BUSY_PREFIX}${++n}`, kind, at: snapPoint(at), heading: null, createdAt,
      expiresAt: new Date(t - minAgo * MIN + KIND_INFO[kind].ttlMin * MIN).toISOString(),
      status: 'active', confirmCount: 0, clearCount: 0, mine: false, myVote: null, source: 'user',
    };
    for (let i = 0; i < confirms; i++) r = applyAnswer(r, 'still_there', new Date(t - Math.max(0, minAgo - 2 - i) * MIN), false);
    return r;
  };
  const out: RoadReport[] = [];
  const seen = new Set<string>();
  for (const road of Object.values(DEMO_ROADS)) {
    const key = road.coords.slice(-2).join(',');
    if (seen.has(key)) continue;
    seen.add(key);
    const pts = roadPoints(road).map((p) => translate(p, DEMO_HOME, home));
    const count = Math.max(2, Math.min(6, Math.round(road.metres / 3000)));
    for (let i = 0; i < count; i++) {
      const at = pts[Math.min(pts.length - 2, Math.max(1, Math.round(((i + 0.5) / count) * (pts.length - 1))))];
      const kind = ROUTE_KINDS[(out.length + i) % ROUTE_KINDS.length];
      out.push(make(kind, at, kind === 'closure' ? 0 : Math.floor(rand() * 3)));
    }
  }
  for (let i = 0; i < 24; i++) {
    const kind = AROUND_KINDS[i % AROUND_KINDS.length];
    out.push(make(kind, offset(home, 1 + rand() * 9, rand() * 360), Math.floor(rand() * 4)));
  }
  return out;
}

// ---------------------------------------------------------------------------
// Other drivers on the drive view (labelled demo)
// ---------------------------------------------------------------------------

/** Demo drivers moving along the demo routes, for the drive view. `along` 0–1 of their loop. */
export function busyDrivers(home: LatLng, now: Date): { id: string; at: LatLng; heading: number }[] {
  const roads = Object.values(DEMO_ROADS).map((r) => roadPoints(r).map((p) => translate(p, DEMO_HOME, home)));
  const out: { id: string; at: LatLng; heading: number }[] = [];
  roads.forEach((pts, i) => {
    if (pts.length < 3) return;
    for (let k = 0; k < 2; k++) {
      // Once along the road and back every few minutes, each at its own place on it.
      const period = (4 + i + k) * MIN;
      const phase = ((now.getTime() / period + (k * 0.5 + i * 0.13)) % 1 + 1) % 1;
      const back = phase > 0.5;
      const f = back ? (1 - phase) * 2 : phase * 2;
      const pos = f * (pts.length - 1);
      const j = Math.min(pts.length - 2, Math.floor(pos));
      const a = pts[j], b = pts[j + 1];
      const u = pos - j;
      const at = { lat: a.lat + (b.lat - a.lat) * u, lng: a.lng + (b.lng - a.lng) * u };
      const [from, to] = back ? [b, a] : [a, b];
      const heading = ((Math.atan2((to.lng - from.lng) * Math.cos((from.lat * Math.PI) / 180), to.lat - from.lat) * 180) / Math.PI + 360) % 360;
      out.push({ id: `${BUSY_PREFIX}dr${i}-${k}`, at, heading });
    }
  });
  return out;
}

/** Busy people within this of a point (for tests and the People screen). */
export function busyNear(users: readonly User[], at: LatLng, miles: number): User[] {
  return users.filter((u) => isBusyId(u.id) && milesBetween(u.home, at) <= miles);
}
