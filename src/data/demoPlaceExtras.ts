import { classOf } from '../lib/classes';
import type { AccessNote, ShotLike, SpotShot } from '../lib/placeExtras';
import type { LapTime } from '../lib/laptimes';
import type { Build, ClassLetter } from '../lib/types';
import type { TrackVehicle } from './trackInfo';

/**
 * The demo's made-up extras for photo spots and tracks (Level-up, places): example shots, access
 * notes, likes, lap times and track days from the demo's sample people. Nothing here is real: the
 * photos are the bundled Wikimedia Commons samples (credited through the ⓘ), the people are the
 * demo's. Only ever shown in the demo (store.backend === 'local').
 */

const DAY_MS = 86_400_000;
const isoDay = (ms: number) => new Date(ms).toISOString().slice(0, 10);

// ---------------------------------------------------------------------------
// Example shots and likes (East Sussex has enough spots for a shot of the week)
// ---------------------------------------------------------------------------

export const DEMO_SHOT_SPOTS: Record<string, { ref: string; by: string; daysAgo: number; likes: number }[]> = {
  'ps-madeira-drive-seafront-brighton': [
    { ref: 'sample:si-golf-gti-mk7', by: 'bex', daysAgo: 12, likes: 5 },
    { ref: 'sample:si-civic-fk8', by: 'kez', daysAgo: 4, likes: 6 },
    { ref: 'sample:si-polo-gti', by: 'jord', daysAgo: 30, likes: 1 },
  ],
  'ps-brighton-marina-asda-car-park': [
    { ref: 'sample:si-focus-st-mk4', by: 'cal', daysAgo: 9, likes: 3 },
    { ref: 'sample:si-i30n', by: 'em', daysAgo: 20, likes: 2 },
  ],
  'ps-beachy-head-car-park': [
    { ref: 'sample:si-golf-r-mk7', by: 'priya', daysAgo: 2, likes: 9 },
    { ref: 'sample:si-golf-gti-mk8', by: 'tom', daysAgo: 15, likes: 4 },
  ],
};

/** Likes spread over the last week (and a few older) so the shot of the week has a real winner. */
const LIKERS = ['dan', 'aimee', 'kez', 'jord', 'mo', 'liv', 'sully', 'bex', 'raf', 'cal'];

export function demoShots(now: Date): { shots: (SpotShot & { spotId: string })[]; likes: ShotLike[] } {
  const shots: (SpotShot & { spotId: string })[] = [];
  const likes: ShotLike[] = [];
  for (const [spotId, list] of Object.entries(DEMO_SHOT_SPOTS)) {
    for (const s of list) {
      shots.push({ spotId, ref: s.ref, userId: s.by, on: isoDay(now.getTime() - s.daysAgo * DAY_MS) });
      // Likes land inside the last week for the recent shots, and long ago for the old ones.
      for (let i = 0; i < s.likes; i++) {
        const ago = s.daysAgo > 7 ? 8 + i : Math.min(6, 0.5 + i * 0.7);
        likes.push({ ref: s.ref, userId: LIKERS[i % LIKERS.length], at: new Date(now.getTime() - ago * DAY_MS).toISOString() });
      }
    }
  }
  return { shots, likes };
}

// ---------------------------------------------------------------------------
// Access notes
// ---------------------------------------------------------------------------

export function demoAccessNotes(now: Date): AccessNote[] {
  const on = (daysAgo: number) => isoDay(now.getTime() - daysAgo * DAY_MS);
  return [
    { id: 'dn-1', spotId: 'ps-brighton-marina-asda-car-park', userId: 'kez', on: on(6), barrier: true, closes: '23:00', security: 'patrols', lowCars: 'ok', text: 'Quiet by the far fence.' },
    { id: 'dn-2', spotId: 'ps-brighton-marina-asda-car-park', userId: 'bex', on: on(21), barrier: true, closes: '22:30', lowCars: 'ok' },
    { id: 'dn-3', spotId: 'ps-beachy-head-car-park', userId: 'priya', on: on(3), security: 'none', lowCars: 'scrapes', text: 'Rough surface near the edge.' },
    { id: 'dn-4', spotId: 'ps-madeira-drive-seafront-brighton', userId: 'tom', on: on(10), security: 'moves-on', lowCars: 'ok', text: 'Fine in daylight, busy on event days.' },
  ];
}

// ---------------------------------------------------------------------------
// Lap times: Donington National (cars) and Cadwell Full circuit (bikes)
// ---------------------------------------------------------------------------

type Rider = { id: string; vehicle: string; kind: TrackVehicle; build: Pick<Build, 'stockBhp' | 'weightKg' | 'mods' | 'kind'> };
const car = (id: string, vehicle: string, stockBhp: number, weightKg: number): Rider => ({ id, vehicle, kind: 'car', build: { stockBhp, weightKg, mods: [], kind: 'car' } });
const bike = (id: string, vehicle: string, stockBhp: number, weightKg: number): Rider => ({ id, vehicle, kind: 'bike', build: { stockBhp, weightKg, mods: [], kind: 'bike' } });

const clsOf = (r: Rider): ClassLetter => classOf(r.build);

function lap(trackId: string, layout: string, r: Rider, on: string, ms: number): LapTime {
  return {
    id: `demo-${trackId}-${r.id}-${on}`,
    trackId,
    layout,
    on,
    ms,
    userId: r.id,
    vehicle: r.vehicle,
    kind: r.kind,
    cls: clsOf(r),
    proof: 'sample:timing-sheet',
    status: 'unverified',
    submittedAt: `${on}T20:00:00.000Z`,
  };
}

const M4 = car('dan', 'BMW M4 Competition', 503, 1725);
const FK8 = car('kez', 'Honda Civic Type R FK8', 316, 1380);
const FIESTA = car('jord', 'Ford Fiesta ST Mk7', 197, 1163);
const RS3 = car('mo', 'Audi RS3 8V', 395, 1575);
const GTI = car('bex', 'Volkswagen Golf GTI Mk7', 227, 1375);
const FOCUS = car('cal', 'Ford Focus RS Mk3', 345, 1599);
const M140 = car('priya', 'BMW M140i', 335, 1475);
const R1 = bike('aimee', 'Yamaha YZF-R1', 197, 201);
const ZX10 = bike('sully', 'Kawasaki ZX-10R', 200, 207);
const TRIPLE = bike('liv', 'Triumph Street Triple RS', 128, 188);
const R6 = bike('raf', 'Yamaha YZF-R6', 117, 190);

/** Sample people's times. Not shown with anything but the layout, day, vehicle and time. */
export const DEMO_LAPS: LapTime[] = [
  lap('tr-donington', 'National', M4, '2026-09-13', 70_940),
  lap('tr-donington', 'National', M4, '2026-06-21', 71_820),
  lap('tr-donington', 'National', FK8, '2026-10-04', 73_210),
  lap('tr-donington', 'National', FK8, '2026-07-12', 74_080),
  lap('tr-donington', 'National', FOCUS, '2026-10-18', 74_650),
  lap('tr-donington', 'National', RS3, '2026-08-30', 75_330),
  lap('tr-donington', 'National', M140, '2026-09-27', 75_900),
  lap('tr-donington', 'National', GTI, '2026-10-25', 79_420),
  lap('tr-donington', 'National', FIESTA, '2026-09-06', 80_560),
  lap('tr-donington', 'National', FIESTA, '2026-05-17', 82_110),
  lap('tr-cadwell', 'Full circuit', ZX10, '2026-09-20', 107_380),
  lap('tr-cadwell', 'Full circuit', R1, '2026-10-11', 108_240),
  lap('tr-cadwell', 'Full circuit', R1, '2026-07-26', 109_900),
  lap('tr-cadwell', 'Full circuit', TRIPLE, '2026-10-11', 112_050),
  lap('tr-cadwell', 'Full circuit', R6, '2026-08-09', 113_700),
];

// ---------------------------------------------------------------------------
// Track days
// ---------------------------------------------------------------------------

export interface TrackDayRow {
  id: string;
  title: string;
  startsAt: string;
  /** People from the app going (user ids). */
  going: string[];
  /** The real meet it opens, when it is one in the store. */
  eventId?: string;
}

const DEMO_TRACK_DAY_PLANS: Record<string, { title: string; dayOffset: number; hour: number; going: string[] }[]> = {
  'tr-donington': [
    { title: 'Open pit lane track day', dayOffset: 9, hour: 9, going: ['kez', 'cal', 'jord'] },
    { title: 'Evening sessions', dayOffset: 23, hour: 17, going: ['dan', 'bex'] },
  ],
  'tr-silverstone': [{ title: 'National circuit track day', dayOffset: 16, hour: 9, going: ['mo', 'priya', 'tom', 'em'] }],
  'tr-cadwell': [{ title: 'Bike track day, all groups', dayOffset: 12, hour: 9, going: ['aimee', 'sully', 'raf'] }],
  'tr-oulton': [{ title: 'Open track day', dayOffset: 30, hour: 9, going: ['dan'] }],
  'tr-brands-hatch': [{ title: 'Indy circuit track day', dayOffset: 19, hour: 9, going: ['liv', 'gaz'] }],
};

/** The demo's upcoming track days at a circuit (made up; real ones come from meets of type Track day). */
export function demoTrackDays(trackId: string, now: Date): TrackDayRow[] {
  return (DEMO_TRACK_DAY_PLANS[trackId] ?? []).map((p, i) => {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + p.dayOffset, p.hour, 0, 0);
    return { id: `demo-td-${trackId}-${i}`, title: p.title, startsAt: d.toISOString(), going: p.going };
  });
}
