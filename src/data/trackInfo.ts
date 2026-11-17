/**
 * Circuit details for the track screen: current layouts with their lengths, and
 * official lap records as published on each circuit's Wikipedia page (the
 * infobox record for the layout, and the fastest motorcycle class in the page's
 * lap-record table). Read on 17 Nov 2026; each entry links its source.
 *
 * Only what the page states clearly is here. Where a page contradicts itself or
 * has no record (e.g. Shelsley Walsh's infobox and text disagree), the record
 * is left out rather than guessed. Hill climbs and sprints are timed runs up or
 * along a course, not laps.
 *
 * Self-contained data (no imports): scripts/fetch-circuits.mjs reads the main
 * layout's length to pick the right outline from OpenStreetMap.
 */

/** What runs at a venue: track days, racing or hire sessions. */
export type TrackVehicle = 'car' | 'bike' | 'kart';

export interface TrackLayout {
  name: string;
  km: number;
}

export interface LapRecord {
  /** "outright": the circuit's official lap record for the layout. "bike": the fastest motorcycle class. */
  kind: 'outright' | 'bike';
  layout: string;
  /** As published: "1:27.097", or seconds for hill climbs ("34.60"). */
  time: string;
  holder: string;
  vehicle?: string;
  /** Series or class the record was set in. */
  series?: string;
  year: number;
}

export interface TrackInfo {
  /** Wikipedia page (or the venue's site) the layouts and records come from. */
  source?: string;
  /** What runs here. When missing: cars and bikes, or karts for a kart venue (see tracks.ts). */
  vehicles?: TrackVehicle[];
  /** Spectator stadiums (oval stock cars, speedway): no track days, so no times. */
  spectator?: boolean;
  /** Kart venues: can the public turn up (or book) and drive the venue's own karts? Only set when the venue says so. */
  arriveAndDrive?: boolean;
  /** Where the vehicles and arrive-and-drive facts come from. */
  factSources?: string[];
  /** Current layouts. The first is the main one. */
  layouts: TrackLayout[];
  records: LapRecord[];
  /** Hill climbs and sprints are a single timed run, not a lap. */
  run?: boolean;
}

export const RECORDS_READ_ON = '17 Nov 2026';

const wiki = (page: string) => `https://en.wikipedia.org/wiki/${page}`;

export const TRACK_INFO: Record<string, TrackInfo> = {
  'tr-silverstone': {
    factSources: ['https://www.silverstone.co.uk/track-and-testing/bike-track-days', 'https://www.kart.silverstone.co.uk/'],
    vehicles: ['car', 'bike', 'kart'],
    source: wiki('Silverstone_Circuit'),
    layouts: [
      { name: 'Grand Prix (Arena)', km: 5.891 },
      { name: 'Motorcycle circuit', km: 5.9 },
      { name: 'International', km: 2.979 },
      { name: 'National', km: 2.639 },
    ],
    records: [
      { kind: 'outright', layout: 'Grand Prix (Arena)', time: '1:27.097', holder: 'Max Verstappen', vehicle: 'Red Bull RB16', series: 'Formula One', year: 2020 },
      { kind: 'bike', layout: 'Motorcycle circuit', time: '1:58.457', holder: 'Raúl Fernández', vehicle: 'Aprilia RS-GP26', series: 'MotoGP', year: 2026 },
    ],
  },
  'tr-brands-hatch': {
    source: wiki('Brands_Hatch'),
    layouts: [
      { name: 'Grand Prix', km: 3.916 },
      { name: 'Indy', km: 1.944 },
    ],
    records: [
      { kind: 'outright', layout: 'Grand Prix', time: '1:12.276', holder: 'Adam Carroll', vehicle: 'A1GP Ferrari', series: 'A1GP', year: 2009 },
      { kind: 'bike', layout: 'Grand Prix', time: '1:24.066', holder: 'Kyle Ryde', vehicle: 'Ducati Panigale V4 R', series: 'British Superbike', year: 2026 },
      { kind: 'outright', layout: 'Indy', time: '0:38.032', holder: 'Scott Mansell', vehicle: 'Benetton B197 Judd', series: 'EuroBOSS', year: 2004 },
    ],
  },
  'tr-donington': {
    source: wiki('Donington_Park'),
    layouts: [
      { name: 'Grand Prix', km: 4.02 },
      { name: 'National', km: 3.149 },
    ],
    records: [
      { kind: 'outright', layout: 'Grand Prix', time: '1:17.707', holder: 'Kimiya Sato', vehicle: 'Lola B05/52', series: 'Auto GP', year: 2013 },
      { kind: 'bike', layout: 'Grand Prix', time: '1:28.714', holder: 'Dani Pedrosa', vehicle: 'Honda RC211V', series: 'MotoGP', year: 2006 },
      { kind: 'outright', layout: 'National', time: '0:57.221', holder: 'Marijn van Kalmthout', vehicle: 'Benetton B197', series: 'Formula One car', year: 2011 },
      { kind: 'bike', layout: 'National', time: '1:05.723', holder: 'Kyle Ryde', vehicle: 'Yamaha YZF-R1', series: 'British Superbike', year: 2022 },
    ],
  },
  'tr-oulton': {
    source: wiki('Oulton_Park'),
    layouts: [
      { name: 'International', km: 4.307 },
      { name: 'Island', km: 3.616 },
      { name: 'Fosters', km: 2.656 },
    ],
    records: [
      { kind: 'outright', layout: 'International', time: '1:28.619', holder: 'Joseph Loake', vehicle: 'Tatuus MSV-022', series: 'GB3', year: 2023 },
      { kind: 'bike', layout: 'International', time: '1:32.817', holder: 'Leon Haslam', vehicle: 'Ducati Panigale V4 R', series: 'British Superbike', year: 2025 },
    ],
  },
  'tr-snetterton': {
    source: wiki('Snetterton_Circuit'),
    layouts: [
      { name: 'Snetterton 300', km: 4.779 },
      { name: 'Snetterton 200', km: 3.219 },
      { name: 'Snetterton 100', km: 1.577 },
    ],
    records: [
      { kind: 'outright', layout: 'Snetterton 300', time: '1:39.933', holder: 'Felipe Nasr', vehicle: 'Dallara F308', series: 'British F3', year: 2011 },
      { kind: 'bike', layout: 'Snetterton 300', time: '1:46.404', holder: 'Kyle Ryde', vehicle: 'Ducati Panigale V4 R', series: 'British Superbike', year: 2026 },
    ],
  },
  'tr-thruxton': {
    factSources: ['https://thruxtonracing.co.uk/karting'],
    vehicles: ['car', 'bike', 'kart'],
    source: wiki('Thruxton_Circuit'),
    layouts: [{ name: 'Main circuit', km: 3.793 }],
    records: [
      { kind: 'outright', layout: 'Main circuit', time: '1:01.960', holder: 'Earl Goddard', vehicle: 'Reynard 95D', series: 'F3000', year: 2000 },
      { kind: 'bike', layout: 'Main circuit', time: '1:14.539', holder: 'Bradley Ray', vehicle: 'Yamaha YZF-R1', series: 'British Superbike', year: 2025 },
    ],
  },
  'tr-castle-combe': {
    factSources: ['https://castlecombecircuit.co.uk/motorcycle-track-days/'],
    source: wiki('Castle_Combe_Circuit'),
    layouts: [{ name: 'Full circuit with chicanes', km: 2.977 }],
    records: [
      { kind: 'outright', layout: 'Full circuit with chicanes', time: '0:58.596', holder: 'Stefano Leaney', vehicle: 'Dallara F317', series: 'F3', year: 2021 },
    ],
  },
  'tr-cadwell': {
    source: wiki('Cadwell_Park'),
    layouts: [
      { name: 'Full circuit', km: 3.502 },
      { name: 'Motorcycle full circuit', km: 3.508 },
      { name: 'Club', km: 2.375 },
      { name: 'Woodlands', km: 1.365 },
    ],
    records: [
      { kind: 'outright', layout: 'Full circuit', time: '1:21.036', holder: 'Sam Moss', vehicle: 'Anderson CSK', series: 'Superkart', year: 2021 },
      { kind: 'bike', layout: 'Motorcycle full circuit', time: '1:25.472', holder: 'Bradley Ray', vehicle: 'Yamaha YZF-R1', series: 'British Superbike', year: 2025 },
    ],
  },
  'tr-croft': {
    source: wiki('Croft_Circuit'),
    layouts: [
      { name: 'Main circuit', km: 3.423 },
      { name: "Club 'A'", km: 1.997 },
    ],
    records: [
      { kind: 'outright', layout: 'Main circuit', time: '1:13.656', holder: 'Sergio Pérez', vehicle: 'Dallara F308', series: 'British F3', year: 2008 },
      { kind: 'bike', layout: 'Main circuit', time: '1:19.695', holder: 'Ryuichi Kiyonari', vehicle: 'Honda CBR1000RR', series: 'British Superbike', year: 2007 },
    ],
  },
  'tr-knockhill': {
    factSources: ['https://www.knockhill.com/trackdays/BikeTrackday', 'https://www.knockhill.com/karting/'],
    vehicles: ['car', 'bike', 'kart'],
    source: wiki('Knockhill'),
    layouts: [
      { name: 'International (clockwise)', km: 2.039 },
      { name: 'International (anticlockwise)', km: 2.039 },
      { name: 'National', km: 1.609 },
    ],
    records: [
      { kind: 'outright', layout: 'International (clockwise)', time: '0:41.880', holder: 'Heather Calder', vehicle: 'Gould GR55', series: 'British Sprint Championship', year: 2018 },
      { kind: 'bike', layout: 'International (clockwise)', time: '0:47.126', holder: 'Rory Skinner', vehicle: 'Kawasaki ZX-10RR', series: 'British Superbike', year: 2022 },
    ],
  },
  'tr-anglesey': {
    source: wiki('Anglesey_Circuit'),
    layouts: [
      { name: 'International GP', km: 3.38 },
      { name: 'Coastal', km: 2.494 },
      { name: 'National', km: 1.931 },
      { name: 'Club', km: 1.287 },
    ],
    records: [
      { kind: 'outright', layout: 'International GP', time: '1:21.287', holder: 'Sean Walkinshaw', vehicle: 'Dallara F302', series: 'F3', year: 2012 },
    ],
  },
  'tr-goodwood': {
    vehicles: ['car'],
    source: wiki('Goodwood_Circuit'),
    layouts: [{ name: 'Full circuit', km: 3.862 }],
    records: [{ kind: 'outright', layout: 'Full circuit', time: '1:18.217', holder: 'Nick Padmore', vehicle: 'Lola T70', series: 'Group 7', year: 2015 }],
  },
  'tr-mallory': {
    source: wiki('Mallory_Park'),
    layouts: [
      { name: 'Car circuit', km: 2.173 },
      { name: 'Superbike circuit', km: 2.269 },
      { name: 'Motorcycle short circuit', km: 2.237 },
    ],
    records: [
      { kind: 'outright', layout: 'Car circuit', time: '0:37.920', holder: 'Nick Algar', vehicle: 'Gould GR55', series: 'British Sprint Championship', year: 2009 },
      { kind: 'bike', layout: 'Superbike circuit', time: '0:55.845', holder: 'Ryuichi Kiyonari', vehicle: 'Honda CBR1000RR', series: 'British Superbike', year: 2007 },
      { kind: 'bike', layout: 'Motorcycle short circuit', time: '0:50.660', holder: 'Bradley Ray', vehicle: 'Suzuki GSX-R1000', series: 'Superbike', year: 2017 },
    ],
  },
  'tr-lydden': {
    factSources: ['https://lyddenhill.co.uk/trackdays/bikes/', 'https://lyddenhill.co.uk/trackdays/cars/'],
    source: wiki('Lydden_Hill_Race_Circuit'),
    layouts: [
      { name: 'Full circuit', km: 1.609 },
      { name: 'Rallycross', km: 1.4 },
    ],
    records: [{ kind: 'outright', layout: 'Full circuit', time: '0:38.300', holder: 'Rob Cox', vehicle: 'Lola LC88', series: 'Formula One car', year: 1989 }],
  },
  'tr-pembrey': {
    factSources: ['https://www.pembreycircuit.co.uk/'],
    vehicles: ['car', 'bike', 'kart'],
    source: wiki('Pembrey_Circuit'),
    layouts: [{ name: 'Full circuit', km: 2.343 }],
    records: [
      { kind: 'outright', layout: 'Full circuit', time: '0:50.079', holder: 'Brian Smith', vehicle: 'Dallara F397', series: 'British F3', year: 1997 },
      { kind: 'bike', layout: 'Full circuit', time: '0:59.280', holder: 'Jim Moodie', vehicle: 'Yamaha YZF750', series: 'Superbike', year: 1994 },
    ],
  },
  'tr-kirkistown': {
    factSources: ['https://kirkistown.com/events/category/kart-events/'],
    vehicles: ['car', 'bike', 'kart'],
    source: wiki('Kirkistown_Circuit'),
    layouts: [{ name: 'Full circuit', km: 2.433 }],
    records: [{ kind: 'outright', layout: 'Full circuit', time: '0:50.782', holder: 'Philip Shields', vehicle: 'Dallara', series: 'GP2 car', year: 2013 }],
  },
  'tr-aintree': {
    source: wiki('Aintree_Motor_Racing_Circuit'),
    layouts: [{ name: 'Club circuit', km: 2.47 }],
    records: [],
  },
  'tr-llandow': {
    source: wiki('Llandow_Circuit'),
    layouts: [{ name: 'Circuit', km: 1.45 }],
    records: [],
  },
  'tr-three-sisters': {
    arriveAndDrive: true,
    factSources: ['https://threesisterscircuit.co.uk/adults/adult-karting-sessions', 'https://threesisterscircuit.co.uk/bikes', 'https://threesisterscircuit.co.uk/cars/car-track-days'],
    vehicles: ['car', 'bike', 'kart'],
    source: wiki('Three_Sisters_Circuit'),
    layouts: [
      { name: 'Circuit', km: 1.497 },
      { name: 'Kart club circuit', km: 1.0 },
    ],
    records: [],
  },
  'tr-shelsley': {
    vehicles: ['car'],
    source: wiki('Shelsley_Walsh_Speed_Hill_Climb'),
    layouts: [{ name: 'Hill (1,000 yd)', km: 0.914 }],
    records: [],
    run: true,
  },
  'tr-prescott': {
    vehicles: ['car'],
    source: wiki('Prescott_Speed_Hill_Climb'),
    layouts: [{ name: 'Long course (1,128 yd)', km: 1.031 }],
    records: [{ kind: 'outright', layout: 'Long course (1,128 yd)', time: '34.60', holder: 'Matthew Ryder', vehicle: 'Gould GR59', series: 'British Hill Climb Championship', year: 2024 }],
    run: true,
  },
  'tr-harewood': {
    vehicles: ['car'],
    source: wiki('Harewood_speed_Hillclimb'),
    layouts: [{ name: 'Hill (1,584 yd)', km: 1.448 }],
    records: [{ kind: 'outright', layout: 'Hill (1,584 yd)', time: '46.39', holder: 'Matthew Ryder', series: 'British Hill Climb Championship', year: 2022 }],
    run: true,
  },
  'tr-gurston': {
    vehicles: ['car'],
    source: wiki('Gurston_Down_Motorsport_Hillclimb'),
    layouts: [{ name: 'Hill (1,058 yd)', km: 0.967 }],
    records: [{ kind: 'outright', layout: 'Hill (1,058 yd)', time: '25.00', holder: 'Alex Summers', vehicle: 'DJ Firestorm', series: 'British Hill Climb Championship', year: 2022 }],
    run: true,
  },
  'tr-teesside': {
    vehicles: ['car', 'bike', 'kart'],
    arriveAndDrive: true,
    factSources: ['https://teessidemotorsports.co.uk/karting/public-hire/arrive-drive/', 'https://teessidemotorsports.co.uk/autodrome/'],
    layouts: [],
    records: [],
  },
  'tr-curborough': { vehicles: ['car'], layouts: [], records: [], run: true },
  'tr-loton': { vehicles: ['car'], layouts: [], records: [], run: true },
  'tr-forrestburn': { vehicles: ['car'], layouts: [], records: [], run: true },
  'tr-crimond': { vehicles: ['car'], layouts: [], records: [], run: true },
  // Regional venues (src/data/places.ts, REGIONAL): what runs there, from their descriptions.
  'ea-t-adrian-flux': { vehicles: ['car', 'bike'], spectator: true, layouts: [], records: [] },
  'ea-t-foxhall': { vehicles: ['car', 'bike'], spectator: true, layouts: [], records: [] },
  'ea-t-yarmouth-stadium': { vehicles: ['car'], spectator: true, layouts: [], records: [] },
  'ea-t-swaffham': { vehicles: ['car'], spectator: true, layouts: [], records: [] },
  'ea-t-mildenhall': { vehicles: ['car'], spectator: true, layouts: [], records: [] },
  'ea-t-bentwaters': { vehicles: ['car'], layouts: [], records: [] },
  'ea-t-hit-the-dirt': { vehicles: ['bike'], layouts: [], records: [] },
  'ea-t-santa-pod': { vehicles: ['car', 'bike'], layouts: [{ name: 'Quarter mile', km: 0.402 }], records: [], run: true },
  // Kart circuits (src/data/kartTracks.ts, plus Buckmore Park and Ellough Park). From each venue's own site, read 17 Nov 2026.
  'k-t-buckmore': { vehicles: ['kart'], arriveAndDrive: true, factSources: ['https://www.buckmore.co.uk/adults'], layouts: [], records: [] },
  'ea-t-ellough': {
    vehicles: ['kart'], arriveAndDrive: true, factSources: ['https://www.elloughpark.co.uk/hire-karts', 'https://www.elloughpark.co.uk/owner-drivers'],
    layouts: [{ name: 'Circuit', km: 1.1 }], records: [],
  },
  'kt-pf-international': {
    vehicles: ['kart'], arriveAndDrive: true, factSources: ['https://kartpfi.com/arrive-n-drive', 'https://kartpfi.com/the-circuit'],
    layouts: [{ name: 'Circuit', km: 1.382 }], records: [],
  },
  'kt-whilton-mill': {
    vehicles: ['kart'], arriveAndDrive: true, factSources: ['https://www.whiltonmill.co.uk/individuals/arrive-drive/', 'https://www.whiltonmill.co.uk/individuals/owner-practice/'],
    layouts: [{ name: 'International', km: 1.2 }, { name: 'National', km: 0.96 }], records: [],
  },
  'kt-shenington': {
    vehicles: ['kart'], arriveAndDrive: false, source: 'https://sheningtonkrc.co.uk/lap-records', factSources: ['https://sheningtonkrc.co.uk/start-karting.html'],
    layouts: [{ name: 'Direct drive', km: 1.018 }, { name: 'Gearbox', km: 1.211 }],
    records: [{ kind: 'outright', layout: 'Direct drive', time: '39.94', holder: 'Mark Litchfield', series: 'Super KF (all-time fastest, class no longer run)', year: 2010 }],
  },
  'kt-rowrah': { vehicles: ['kart'], arriveAndDrive: true, factSources: ['https://www.cumbriakrc.co.uk/arrive-and-drive'], layouts: [], records: [] },
  'kt-larkhall': {
    vehicles: ['kart'], arriveAndDrive: true, factSources: ['https://larkhallcircuit.com/arrive-and-drive/', 'https://larkhallcircuit.com/'],
    layouts: [{ name: 'Circuit', km: 1.14 }], records: [],
  },
  'kt-fulbeck': { vehicles: ['kart'], factSources: ['https://www.fulbeckkartclub.co.uk/'], layouts: [], records: [] },
  'kt-clay-pigeon': {
    vehicles: ['kart'], arriveAndDrive: true, factSources: ['https://www.claypigeonraceway.com/hire-karts'],
    layouts: [{ name: 'Circuit', km: 0.815 }], records: [],
  },
  'kt-glan-y-gors': {
    vehicles: ['kart'], arriveAndDrive: true, factSources: ['https://gygkarting.com/familyfun/arrive-and-drive/', 'https://gygkarting.com/dragon-kart-club-dkc/'],
    layouts: [{ name: 'Circuit', km: 1.1 }], records: [],
  },
  'kt-llandow': {
    vehicles: ['kart'], arriveAndDrive: false, factSources: ['https://www.llandow.com/karting/'],
    layouts: [{ name: 'Kart circuit', km: 1.05 }], records: [],
  },
  'kt-rissington': { vehicles: ['kart'], factSources: ['https://rissingtonkartclub.co.uk/'], layouts: [], records: [] },
  'kt-forest-edge': {
    vehicles: ['kart'], source: 'https://fekc.co.uk/track.html', factSources: ['https://fekc.co.uk/practice.html'], layouts: [],
    records: [{ kind: 'outright', layout: 'Circuit', time: '36.42', holder: 'James Beacroft', series: 'KZ2', year: 2026 }],
  },
  'kt-kimbolton': {
    vehicles: ['kart'], arriveAndDrive: false, source: 'https://hkrc.co.uk/lap-records/', factSources: ['https://hkrc.co.uk/hkrc-faqs/'], layouts: [],
    records: [{ kind: 'outright', layout: 'Circuit 1', time: '34.79', holder: 'Noah Wolfe', series: 'KZ UK', year: 2026 }],
  },
  'kt-lydd': {
    vehicles: ['kart'], arriveAndDrive: true, factSources: ['https://lyddkartcircuit.com/hire-karts/', 'https://lyddkartcircuit.com/owner-drivers/'],
    layouts: [{ name: 'Senior circuit', km: 1.04 }], records: [],
  },
  'kt-bayford-meadows': {
    vehicles: ['kart'], arriveAndDrive: true, factSources: ['https://bayfordmeadows.co.uk/adult-karting/adult-karting-options', 'https://bayfordmeadows.co.uk/owner-drivers/circuit-rules'],
    layouts: [{ name: 'Circuit', km: 1.1 }], records: [],
  },
};
