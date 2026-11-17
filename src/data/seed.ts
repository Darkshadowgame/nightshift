import type { BanZone, Build, ChatMessage, Crew, Mod, ModCategory, NightEvent, Spot, User } from '../lib/types';
import { DEFAULT_FILTER } from '../lib/invites';
import type { Vote } from '../lib/awards';

/**
 * Demo scene for Phase 1: a made-up Midlands crowd, real roads and venues.
 * Times are relative to `now` so the demo always has something on tonight.
 * Everything here is sample data, not real people.
 */

export const ME = 'me';

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
  region: string;
  home: [number, number];
  crew?: string;
  builds: BuildSpec[];
}

const PEOPLE: Person[] = [
  {
    id: ME, handle: 'you', name: 'You', region: 'Midlands', home: [52.63, -1.69], crew: 'nr',
    builds: [{
      kind: 'car', make: 'Volkswagen', model: 'Golf R Mk7.5', year: 2019, stockBhp: 296, weightKg: 1500, torque: 370,
      dyno: 388, nickname: 'Example build (edit me)', colour: '#3fd6ff',
      mods: [['engine', 'Stage 2 remap', 60], ['exhaust', 'Turbo-back exhaust', 10], ['intake', 'Cold air intake', 8],
        ['suspension', 'Coilovers, -40 mm'], ['wheels', '19" forged wheels'], ['lighting', 'Smoked rear lights']],
    }],
  },
  {
    id: 'dan', handle: 'dan_r', name: 'Dan', region: 'Tamworth', home: [52.63, -1.70], crew: 'nr',
    builds: [{ kind: 'car', make: 'BMW', model: 'M4 Competition', year: 2021, stockBhp: 503, weightKg: 1725, torque: 479, colour: '#ff9a2e',
      mods: [['engine', 'Stage 1 remap', 80], ['exhaust', 'Valved cat-back'], ['wheels', '20" forged'], ['body', 'Carbon front splitter']] }],
  },
  {
    id: 'aimee', handle: 'aimee.r1', name: 'Aimee', region: 'Lichfield', home: [52.68, -1.82], crew: 'nr',
    builds: [{ kind: 'bike', make: 'Yamaha', model: 'YZF-R1', year: 2020, stockBhp: 197, weightKg: 201, colour: '#3f6fff',
      mods: [['exhaust', 'Full titanium system', 8], ['engine', 'ECU flash', 5], ['other', 'Quickshifter'], ['body', 'Tail tidy']] }],
  },
  {
    id: 'kez', handle: 'kez_typer', name: 'Kez', region: 'Nuneaton', home: [52.52, -1.47],
    builds: [{ kind: 'car', make: 'Honda', model: 'Civic Type R FK8', year: 2018, stockBhp: 316, weightKg: 1380, colour: '#ff4d4d',
      mods: [['intake', 'Carbon intake', 5], ['exhaust', 'Cat-back'], ['wheels', '19" flow-formed'], ['suspension', 'Lowering springs'], ['engine', 'Stage 1 map', 30]] }],
  },
  {
    id: 'jord', handle: 'jordST', name: 'Jordan', region: 'Burton', home: [52.80, -1.64],
    builds: [{ kind: 'car', make: 'Ford', model: 'Fiesta ST Mk7', year: 2016, stockBhp: 197, weightKg: 1163, colour: '#2ec4b6',
      mods: [['engine', 'Mountune MR230 pack', 33], ['intake', 'Induction kit'], ['suspension', 'Coilovers'], ['wheels', '17" Rotas']] }],
  },
  {
    id: 'mo', handle: 'mo.rs3', name: 'Mo', region: 'Sutton Coldfield', home: [52.57, -1.82], crew: 'nr',
    builds: [{ kind: 'car', make: 'Audi', model: 'RS3 8V', year: 2019, stockBhp: 395, weightKg: 1575, torque: 354, dyno: 470, colour: '#9b5de5',
      mods: [['engine', 'Stage 2+ remap'], ['turbo', 'Hybrid turbo'], ['intake', 'Turbo inlet'], ['exhaust', 'Decat downpipe'], ['wheels', '19" forged']] }],
  },
  {
    id: 'liv', handle: 'liv_on_two', name: 'Liv', region: 'Derby', home: [52.92, -1.48],
    builds: [{ kind: 'bike', make: 'Triumph', model: 'Street Triple RS', year: 2022, stockBhp: 128, weightKg: 188, colour: '#ff4fa3',
      mods: [['exhaust', 'Arrow end can', 3], ['other', 'Bar-end mirrors'], ['body', 'Fly screen']] }],
  },
  {
    id: 'sully', handle: 'sully_zx', name: 'Sully', region: 'Leicester', home: [52.64, -1.13],
    builds: [{ kind: 'bike', make: 'Kawasaki', model: 'ZX-10R', year: 2021, stockBhp: 200, weightKg: 207, colour: '#9dfa5a',
      mods: [['exhaust', 'Akrapovič slip-on', 4], ['engine', 'ECU flash', 6], ['suspension', 'Öhlins shock'], ['other', 'Steering damper']] }],
  },
  {
    id: 'bex', handle: 'bex_gti', name: 'Bex', region: 'Coventry', home: [52.41, -1.51],
    builds: [{ kind: 'car', make: 'Volkswagen', model: 'Golf GTI Mk7', year: 2017, stockBhp: 227, weightKg: 1375, colour: '#e9edf4',
      mods: [['engine', 'Stage 1 remap', 50], ['wheels', '18" Pretorias'], ['suspension', 'Air ride']] }],
  },
  {
    id: 'tay', handle: 'tay_subie', name: 'Tay', region: 'Stafford', home: [52.81, -2.12],
    builds: [{ kind: 'car', make: 'Subaru', model: 'Impreza WRX STI', year: 2008, stockBhp: 296, weightKg: 1505, colour: '#3f6fff',
      mods: [['engine', 'Forged internals'], ['turbo', 'Twin-scroll turbo'], ['exhaust', 'Equal-length manifold'], ['brakes', 'Big brake kit'], ['body', 'Wing']], dyno: 420 }],
  },
  {
    id: 'raf', handle: 'raf.r6', name: 'Raf', region: 'Walsall', home: [52.59, -1.98],
    builds: [{ kind: 'bike', make: 'Yamaha', model: 'YZF-R6', year: 2017, stockBhp: 117, weightKg: 190, colour: '#3fd6ff',
      mods: [['exhaust', 'Slip-on', 3], ['body', 'Race fairings'], ['other', 'Rearsets']] }],
  },
  {
    id: 'nina', handle: 'nina_mx5', name: 'Nina', region: 'Rugby', home: [52.37, -1.26],
    builds: [{ kind: 'car', make: 'Mazda', model: 'MX-5 NB', year: 2003, stockBhp: 144, weightKg: 1065, colour: '#ff9a2e',
      mods: [['suspension', 'Coilovers'], ['wheels', '15" Enkei'], ['interior', 'Bucket seats'], ['body', 'Hardtop']] }],
  },
  {
    id: 'cal', handle: 'cal_focusrs', name: 'Cal', region: 'Hinckley', home: [52.54, -1.37],
    builds: [{ kind: 'car', make: 'Ford', model: 'Focus RS Mk3', year: 2017, stockBhp: 345, weightKg: 1599, colour: '#3f6fff',
      mods: [['engine', 'Stage 2 remap', 55], ['intake', 'Turbo inlet'], ['exhaust', 'Cat-back'], ['wheels', '19" forged']] }],
  },
  {
    id: 'ash', handle: 'ash.saxo', name: 'Ash', region: 'Cannock', home: [52.69, -2.03],
    builds: [{ kind: 'car', make: 'Citroën', model: 'Saxo VTS', year: 2001, stockBhp: 100, weightKg: 935, colour: '#ffd166',
      mods: [['engine', 'Throttle bodies', 25], ['exhaust', '4-2-1 manifold'], ['suspension', 'Coilovers'], ['interior', 'Half cage']] }],
  },
  {
    id: 'deano', handle: 'deano_mt09', name: 'Dean', region: 'Ashby', home: [52.75, -1.47],
    builds: [{ kind: 'bike', make: 'Yamaha', model: 'MT-09', year: 2021, stockBhp: 117, weightKg: 189, colour: '#7a7f8c',
      mods: [['exhaust', 'Full system', 6], ['engine', 'ECU flash', 4], ['other', 'Tail tidy']] }],
  },
  {
    id: 'priya', handle: 'priya.m140', name: 'Priya', region: 'Solihull', home: [52.41, -1.78],
    builds: [{ kind: 'car', make: 'BMW', model: 'M140i', year: 2018, stockBhp: 335, weightKg: 1475, colour: '#e9edf4',
      mods: [['engine', 'Stage 2 remap', 65], ['intake', 'Charge pipe'], ['exhaust', 'Decat downpipe'], ['suspension', 'Coilovers']] }],
  },
  {
    id: 'gaz', handle: 'gaz_gsxr', name: 'Gaz', region: 'Nuneaton', home: [52.53, -1.46],
    builds: [{ kind: 'bike', make: 'Suzuki', model: 'GSX-R750', year: 2016, stockBhp: 148, weightKg: 190, colour: '#3f6fff',
      mods: [['exhaust', 'Yoshimura can', 4], ['brakes', 'Braided lines'], ['other', 'Steering damper']] }],
  },
  {
    id: 'em', handle: 'em_i30n', name: 'Em', region: 'Lichfield', home: [52.69, -1.83],
    builds: [{ kind: 'car', make: 'Hyundai', model: 'i30 N', year: 2020, stockBhp: 271, weightKg: 1429, colour: '#3fd6ff',
      mods: [['engine', 'Stage 1 remap', 40], ['wheels', '19" Rotas']] }],
  },
  {
    id: 'tom', handle: 'tomtom_gr', name: 'Tom', region: 'Tamworth', home: [52.64, -1.68],
    builds: [{ kind: 'car', make: 'Toyota', model: 'GR Yaris', year: 2021, stockBhp: 257, weightKg: 1280, colour: '#ff4d4d',
      mods: [['engine', 'Stage 1 remap', 40], ['intake', 'Turbo inlet'], ['exhaust', 'Cat-back'], ['suspension', 'Coilovers'], ['wheels', '18" forged']] }],
  },
  {
    id: 'lew', handle: 'lew.ninja', name: 'Lewis', region: 'Burton', home: [52.81, -1.62],
    builds: [{ kind: 'bike', make: 'Kawasaki', model: 'Ninja 400', year: 2022, stockBhp: 45, weightKg: 168, colour: '#9dfa5a',
      mods: [['exhaust', 'Slip-on'], ['other', 'Tail tidy'], ['body', 'Double-bubble screen']] }],
  },
  {
    id: 'sam', handle: 'sam_e46', name: 'Sam', region: 'Redditch', home: [52.31, -1.94],
    builds: [{ kind: 'car', make: 'BMW', model: 'M3 E46', year: 2004, stockBhp: 338, weightKg: 1495, colour: '#9b5de5',
      mods: [['exhaust', 'Straight-through system'], ['suspension', 'Coilovers'], ['wheels', '19" CSL replicas'], ['interior', 'Bucket seats']] }],
  },
];

const CREWS: Crew[] = [
  { id: 'nr', name: 'NightRunners', tag: 'NR', memberIds: PEOPLE.filter((p) => p.crew === 'nr').map((p) => p.id) },
];

function makeMods(buildId: string, specs: ModSpec[]): Mod[] {
  return specs.map(([category, name, bhpGain], i) => ({ id: `${buildId}-m${i}`, category, name, bhpGain }));
}

export const SPOTS: Spot[] = [
  { id: 'sp-ladybower', kind: 'photo', name: 'Ladybower viaduct', at: { lat: 53.387, lng: -1.724 }, description: 'Reservoir and stone viaduct. Best at blue hour.' },
  { id: 'sp-winnats', kind: 'photo', name: 'Winnats Pass', at: { lat: 53.341, lng: -1.818 }, description: 'Limestone gorge road. Pull fully off the road for photos.' },
  { id: 'sp-digbeth', kind: 'photo', name: 'Digbeth street art', at: { lat: 52.4757, lng: -1.8838 }, description: 'Murals and arches. Quiet late on a Sunday.' },
  { id: 'sp-curborough-ph', kind: 'photo', name: 'Cannock Chase forest roads', at: { lat: 52.745, lng: -1.990 }, description: 'Pines and long straights for rolling shots.' },
  {
    id: 'sr-snake', kind: 'drive', name: 'Snake Pass (A57)', miles: 12.4, at: { lat: 53.4325, lng: -1.8689 },
    description: 'Glossop to Ladybower over the moors. Rep for completing it at the speed limit. Never timed.',
    path: [{ lat: 53.444, lng: -1.929 }, { lat: 53.4325, lng: -1.8689 }, { lat: 53.413, lng: -1.813 }, { lat: 53.395, lng: -1.765 }, { lat: 53.379, lng: -1.727 }],
  },
  {
    id: 'sr-catfiddle', kind: 'drive', name: 'Cat and Fiddle (A537)', miles: 7.8, at: { lat: 53.2393, lng: -2.0114 },
    description: 'Macclesfield to Buxton. Average-speed cameras the whole way.',
    path: [{ lat: 53.258, lng: -2.08 }, { lat: 53.247, lng: -2.045 }, { lat: 53.2393, lng: -2.0114 }, { lat: 53.247, lng: -1.965 }, { lat: 53.255, lng: -1.93 }],
  },
  { id: 'tr-donington', kind: 'track', name: 'Donington Park', at: { lat: 52.8306, lng: -1.3797 }, description: 'Track days most weeks. Lap times count here.' },
  { id: 'tr-curborough', kind: 'track', name: 'Curborough Sprint Course', at: { lat: 52.7097, lng: -1.8053 }, description: 'Short sprint course near Lichfield.' },
  { id: 'tr-mallory', kind: 'track', name: 'Mallory Park', at: { lat: 52.5986, lng: -1.3378 }, description: 'Club circuit, popular with bikes.' },
  { id: 'tr-silverstone', kind: 'track', name: 'Silverstone', at: { lat: 52.0786, lng: -1.0169 }, description: 'National and GP circuits.' },
];

/** Sample zones only. Councils change these; check the current order before relying on it. */
export const BAN_ZONES: BanZone[] = [
  { id: 'bz-bham', name: 'Birmingham city centre', centre: { lat: 52.48, lng: -1.89 }, radiusMiles: 4, note: 'Sample zone based on the West Midlands car-cruising injunction. Check the current order.' },
  { id: 'bz-blackcountry', name: 'Black Country', centre: { lat: 52.55, lng: -2.06 }, radiusMiles: 6, note: 'Sample zone based on the Black Country street-racing injunction. Check the current order.' },
];

function at(now: Date, dayOffset: number, hour: number, minute = 0): string {
  const d = new Date(now);
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function minutesFrom(now: Date, minutes: number): string {
  return new Date(now.getTime() + minutes * 60_000).toISOString();
}

function events(now: Date): NightEvent[] {
  return [
    {
      id: 'ev-rolling-live', type: 'rolling', title: 'Lichfield rolling meet',
      description: 'Three spots, all planned in advance. Check in at each spot to get the next one.',
      startsAt: minutesFrom(now, -45), endsAt: minutesFrom(now, 180),
      area: { lat: 52.67, lng: -1.76 }, areaName: 'Lichfield / Tamworth',
      stops: [
        { id: 'rl-1', name: 'Lichfield retail park', at: { lat: 52.6842, lng: -1.8105 }, revealedAt: minutesFrom(now, -105) },
        { id: 'rl-2', name: 'Ventura Park, Tamworth', at: { lat: 52.6205, lng: -1.7265 }, revealedAt: minutesFrom(now, -10) },
        { id: 'rl-3', name: 'Hams Hall retail park', at: { lat: 52.5156, lng: -1.7072 }, note: 'Planned, hidden until you move on' },
      ],
      currentStop: 1, revealMinutesBefore: 60, hostIds: ['dan'], filter: { ...DEFAULT_FILTER, minMods: 3, radiusMiles: 30 },
      going: [ME, 'dan', 'kez', 'tom', 'em', 'aimee', 'jord'],
      checkIns: { [ME]: ['rl-1'], dan: ['rl-1', 'rl-2'], tom: ['rl-1', 'rl-2'], em: ['rl-1'], aimee: ['rl-1'] },
    },
    {
      id: 'ev-rolling-host', type: 'rolling', title: 'NightRunners late one',
      description: 'Crew-run rolling meet. Any NightRunners member can move it on.',
      startsAt: minutesFrom(now, 30), endsAt: minutesFrom(now, 240),
      area: { lat: 52.63, lng: -1.69 }, areaName: 'Tamworth',
      stops: [
        { id: 'rh-1', name: 'Tamworth Snowdome car park', at: { lat: 52.6302, lng: -1.6962 } },
        { id: 'rh-2', name: 'Kingsbury water park entrance', at: { lat: 52.5711, lng: -1.6745 }, note: 'Planned, hidden until you move on' },
      ],
      currentStop: 0, revealMinutesBefore: 60, hostIds: ['mo'], crewId: 'nr',
      filter: { ...DEFAULT_FILTER, classes: ['S', 'A', 'B'], radiusMiles: 25 },
      going: ['mo', 'dan', 'aimee', 'priya', 'cal'], checkIns: {},
    },
    {
      id: 'ev-cruise-peak', type: 'cruise', title: 'Peak District night cruise',
      description: 'Ladybower to Glossop over Snake Pass, regroup at the top. Speed limits all the way.',
      startsAt: at(now, 2, 22, 30), area: { lat: 53.40, lng: -1.80 }, areaName: 'Peak District', routeMiles: 48,
      stops: [
        { id: 'pc-1', name: 'Start: Ladybower car park', at: { lat: 53.3786, lng: -1.7271 } },
        { id: 'pc-2', name: 'Regroup: Snake Pass summit lay-by', at: { lat: 53.4325, lng: -1.8689 } },
        { id: 'pc-3', name: 'Finish: Glossop retail park', at: { lat: 53.4437, lng: -1.9505 } },
      ],
      currentStop: 0, revealMinutesBefore: 60, hostIds: [ME], crewId: 'nr',
      filter: { ...DEFAULT_FILTER, classes: ['S', 'A'], radiusMiles: 60 },
      going: [ME, 'dan', 'mo', 'aimee', 'sully', 'cal'], checkIns: {},
    },
    {
      id: 'ev-meet-tam', type: 'meet', title: 'Retail park takeover',
      description: 'S and A class only. Park up, no revving, leave clean.',
      startsAt: at(now, 5, 23, 0), area: { lat: 52.62, lng: -1.72 }, areaName: 'Tamworth',
      stops: [{ id: 'mt-1', name: 'Ventura Park, Tamworth', at: { lat: 52.6205, lng: -1.7265 } }],
      currentStop: 0, revealMinutesBefore: 60, hostIds: ['kez'],
      filter: { ...DEFAULT_FILTER, classes: ['S', 'A'], radiusMiles: 25 },
      going: ['kez', 'cal', 'priya'], checkIns: {},
    },
    {
      id: 'ev-bike-cat', type: 'cruise', title: 'Cat and Fiddle sunrise ride',
      description: 'Bikes only. Breakfast at the finish.',
      startsAt: at(now, 6, 6, 0), area: { lat: 53.25, lng: -2.0 }, areaName: 'Macclesfield / Buxton', routeMiles: 22,
      stops: [
        { id: 'bc-1', name: 'Start: Macclesfield services', at: { lat: 53.258, lng: -2.08 } },
        { id: 'bc-2', name: 'Regroup: Cat and Fiddle summit', at: { lat: 53.2393, lng: -2.0114 } },
        { id: 'bc-3', name: 'Finish: Buxton café', at: { lat: 53.2587, lng: -1.9112 } },
      ],
      currentStop: 0, revealMinutesBefore: 120, hostIds: ['aimee', 'sully'],
      filter: { ...DEFAULT_FILTER, cars: false, bikes: true, classes: ['S', 'A', 'B'], minMods: 0, radiusMiles: 70 },
      going: ['aimee', 'sully', 'liv', 'gaz'], checkIns: {},
    },
    {
      id: 'ev-past-snowdome', type: 'meet', title: 'Snowdome Sunday meet',
      description: 'Last weekend. Voting has closed, trophies are out.',
      startsAt: at(now, -3, 19, 0), endsAt: at(now, -3, 22, 0), area: { lat: 52.63, lng: -1.70 }, areaName: 'Tamworth',
      stops: [{ id: 'ps-1', name: 'Tamworth Snowdome car park', at: { lat: 52.6302, lng: -1.6962 } }],
      currentStop: 0, revealMinutesBefore: 60, hostIds: ['tom'],
      filter: { ...DEFAULT_FILTER, minMods: 2, radiusMiles: 30 },
      going: [ME, 'tom', 'dan', 'kez', 'aimee', 'mo', 'em', 'sully', 'jord', 'priya'],
      checkIns: Object.fromEntries([ME, 'tom', 'dan', 'kez', 'aimee', 'mo', 'em', 'sully', 'jord', 'priya'].map((u) => [u, ['ps-1']])),
    },
    {
      id: 'ev-show-don', type: 'show', title: 'Midlands Modified Show',
      description: 'Show-and-shine, club stands and a trade area. Public event.',
      startsAt: at(now, 12, 9, 0), endsAt: at(now, 12, 17, 0), area: { lat: 52.8306, lng: -1.3797 }, areaName: 'Donington Park',
      stops: [{ id: 'sd-1', name: 'Donington Park', at: { lat: 52.8306, lng: -1.3797 } }],
      currentStop: 0, revealMinutesBefore: 0, hostIds: ['cal'],
      filter: { ...DEFAULT_FILTER, everyone: true, minMods: 0, radiusMiles: 100 },
      going: ['cal', 'jord', 'nina', 'bex', 'em'], checkIns: {},
    },
    {
      id: 'ev-track-curb', type: 'trackday', title: 'Curborough sprint evening',
      description: 'Timed runs on the sprint course. Helmets required. Lap times go on the leaderboard.',
      startsAt: at(now, 9, 17, 30), endsAt: at(now, 9, 21, 0), area: { lat: 52.7097, lng: -1.8053 }, areaName: 'Lichfield',
      stops: [{ id: 'tc-1', name: 'Curborough Sprint Course', at: { lat: 52.7097, lng: -1.8053 } }],
      currentStop: 0, revealMinutesBefore: 0, hostIds: ['tom'],
      filter: { ...DEFAULT_FILTER, everyone: true, minMods: 0, radiusMiles: 80 },
      going: ['tom', 'ash', 'nina'], checkIns: {},
    },
  ];
}

function chat(now: Date): ChatMessage[] {
  const m = (id: string, eventId: string, userId: string, text: string, minsAgo: number): ChatMessage => ({
    id, eventId, userId, text, at: minutesFrom(now, -minsAgo),
  });
  return [
    m('c1', 'ev-rolling-live', 'dan', 'Moving on in 5. Check in if you have not, or you will not get the next spot.', 16),
    m('c2', 'ev-rolling-live', 'tom', 'Here, parked at the far end.', 8),
    m('c3', 'ev-rolling-live', 'em', 'Stuck at the lights, 5 mins.', 6),
    m('c4', 'ev-cruise-peak', 'mo', 'Fuel up before Ladybower, nothing open after.', 300),
    m('c5', 'ev-cruise-peak', 'aimee', 'Bringing the R1, will sit at the back.', 120),
  ];
}

function votes(now: Date): Vote[] {
  const when = at(now, -3, 21, 30);
  const v = (voterId: string, category: Vote['category'], buildId: string): Vote => ({ eventId: 'ev-past-snowdome', voterId, category, buildId, at: when });
  return [
    v('tom', 'best-in-show', 'b-dan-0'), v('kez', 'best-in-show', 'b-dan-0'), v('em', 'best-in-show', 'b-dan-0'), v(ME, 'best-in-show', 'b-dan-0'), v('jord', 'best-in-show', 'b-aimee-0'),
    v('tom', 'best-car', 'b-me-0'), v('aimee', 'best-car', 'b-me-0'), v('sully', 'best-car', 'b-me-0'), v('priya', 'best-car', 'b-mo-0'),
    v('tom', 'best-bike', 'b-aimee-0'), v('dan', 'best-bike', 'b-aimee-0'), v('mo', 'best-bike', 'b-aimee-0'),
    v('dan', 'cleanest', 'b-me-0'), v('kez', 'cleanest', 'b-me-0'), v('mo', 'cleanest', 'b-me-0'),
    v(ME, 'sound', 'b-kez-0'), v('em', 'sound', 'b-kez-0'), v('jord', 'sound', 'b-kez-0'),
  ];
}

export interface SeedState {
  votes: Vote[];
  users: User[];
  builds: Build[];
  crews: Crew[];
  events: NightEvent[];
  chat: ChatMessage[];
}

export function seed(now: Date = new Date()): SeedState {
  const users: User[] = PEOPLE.map((p) => ({
    id: p.id, handle: p.handle, name: p.name, region: p.region, crewId: p.crew,
    home: { lat: p.home[0], lng: p.home[1] },
  }));
  const builds: Build[] = PEOPLE.flatMap((p) =>
    p.builds.map((b, i) => {
      const id = `b-${p.id}-${i}`;
      return {
        id, ownerId: p.id, kind: b.kind, make: b.make, model: b.model, year: b.year, nickname: b.nickname,
        stockBhp: b.stockBhp, weightKg: b.weightKg, torqueLbFt: b.torque, dynoBhp: b.dyno,
        mods: makeMods(id, b.mods), photos: [], colour: b.colour,
      };
    }),
  );
  return { users, builds, crews: CREWS, events: events(now), chat: chat(now), votes: votes(now) };
}
