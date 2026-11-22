jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

import { DEMO_LAPS, demoAccessNotes, demoShots, demoTrackDays } from '../src/data/demoPlaceExtras';
import { PLACES } from '../src/data/places';
import { readExtras } from '../src/lib/extrasStore';
import {
  bestTimeline,
  classFocus,
  cleanSetup,
  gapText,
  leaderboard,
  makeLap,
  ordinal,
  placeInGroup,
  publicLap,
  rivalNews,
  rivalStanding,
  setupLine,
  setupProblem,
  type LapDraft,
  type LapTime,
} from '../src/lib/laptimes';
import {
  accessProblem,
  accessSummary,
  collectionProgress,
  COLLECTIONS,
  EMPTY_ACCESS,
  lightBadge,
  makeAccessNote,
  normaliseClock,
  notesFor,
  sampleShots,
  shotOfTheWeek,
  spotCollections,
  type AccessNote,
  type ShotLike,
} from '../src/lib/placeExtras';
import { bundledSpots } from '../src/lib/placeStore';
import { goldenHourState, goldenWindows, sunTimes } from '../src/lib/sun';
import { mergeTrackDays, trackDaysAt } from '../src/lib/trackDays';
import type { Build, NightEvent, Spot } from '../src/lib/types';

const NOW = new Date('2026-11-21T12:00:00Z');
const AT = { lat: 52.63, lng: -1.7 };

const photoSpot = (over: Partial<Spot> = {}): Spot => ({
  id: 'ps-test', kind: 'photo', name: 'Test seafront', at: AT, description: 'On the seafront.', status: 'approved', createdAt: NOW.toISOString(),
  completions: [], ratings: [], region: 'Essex', ...over,
});

describe('golden hour', () => {
  const s = sunTimes(NOW, AT);
  const sunset = Math.round(s.sunset!);
  test('windows are the hour after sunrise and the hour before sunset', () => {
    const w = goldenWindows(NOW, AT).filter((x) => x.start > NOW.getTime() - 86_400_000 && x.start < NOW.getTime() + 86_400_000);
    expect(w.some((x) => x.kind === 'evening' && Math.abs(x.end - sunset) < 2 && x.end - x.start === 3_600_000)).toBe(true);
    expect(w.some((x) => x.kind === 'morning' && Math.abs(x.start - s.sunrise!) < 2)).toBe(true);
  });
  test('inside the window it is "now", an hour or so before it is "soon", midday is neither', () => {
    expect(goldenHourState(new Date(sunset - 30 * 60_000), AT)?.state).toBe('now');
    expect(goldenHourState(new Date(sunset - 100 * 60_000), AT)?.state).toBe('soon');
    expect(goldenHourState(new Date(sunset + 5 * 3_600_000), AT)).toBeNull();
  });
  test('badge wording follows the time rules: a countdown only under an hour', () => {
    expect(lightBadge(new Date(sunset - 30 * 60_000), AT)?.text).toMatch(/^Golden hour until \d\d:\d\d$/);
    expect(lightBadge(new Date(sunset - 100 * 60_000), AT)?.text).toMatch(/^Good light from \d\d:\d\d \(in (39|40|41) min\)$/);
    expect(lightBadge(new Date(sunset - 170 * 60_000), AT)?.text).toMatch(/^Good light from \d\d:\d\d$/);
  });
  test('no golden hour in polar night', () => {
    expect(goldenHourState(new Date('2026-12-21T12:00:00Z'), { lat: 80, lng: 0 })).toBeNull();
  });
});

describe('example shots', () => {
  test('the suggester first, then check-ins newest first, each photo once, up to three', () => {
    const spot = photoSpot({
      photo: 'a.jpg',
      authorId: 'u1',
      completions: [
        { userId: 'u2', on: '2026-10-01', photo: 'b.jpg' },
        { userId: 'u3', on: '2026-11-01', photo: 'c.jpg' },
        { userId: 'u4', on: '2026-11-10', photo: 'a.jpg' },
        { userId: 'u5', on: '2026-11-15', photo: 'd.jpg' },
        { userId: 'u6', on: '2026-11-16' },
      ],
    });
    expect(sampleShots(spot).map((s) => s.ref)).toEqual(['a.jpg', 'd.jpg', 'c.jpg']);
  });
  test('a spot with no photos has none, and extras fill in', () => {
    expect(sampleShots(photoSpot())).toEqual([]);
    expect(sampleShots(photoSpot(), [{ ref: 'x', on: '2026-11-01' }, { ref: 'y', on: '2026-11-05' }]).map((s) => s.ref)).toEqual(['y', 'x']);
  });
});

describe('access notes', () => {
  const draft = { ...EMPTY_ACCESS, barrier: true, closes: '2200', security: 'patrols' as const, lowCars: 'ok' as const, text: 'Quiet by the far fence.' };
  test('a time reads in several ways, or not at all', () => {
    expect(normaliseClock('2200')).toBe('22:00');
    expect(normaliseClock('9.30')).toBe('09:30');
    expect(normaliseClock('25:00')).toBeNull();
    expect(normaliseClock('late')).toBeNull();
  });
  test('needs a fact, a barrier for a closing time, and kind words', () => {
    expect(accessProblem(EMPTY_ACCESS)).toMatch(/at least one/);
    expect(accessProblem({ ...EMPTY_ACCESS, closes: '22:00', security: 'none' })).toMatch(/barrier/);
    expect(accessProblem({ ...EMPTY_ACCESS, barrier: true, closes: 'soon' })).toMatch(/closing time/);
    expect(accessProblem({ ...EMPTY_ACCESS, text: 'x'.repeat(121) })).toMatch(/120/);
    expect(accessProblem({ ...EMPTY_ACCESS, text: 'police spotted here' })).not.toBeNull();
    expect(accessProblem(draft)).toBeNull();
  });
  test('a note keeps only what was said, with the time tidied', () => {
    const n = makeAccessNote(draft, { id: 'n1', spotId: 'ps-test', userId: 'me', on: '2026-11-21' });
    expect(n).toMatchObject({ barrier: true, closes: '22:00', security: 'patrols', lowCars: 'ok', text: 'Quiet by the far fence.' });
    const bare = makeAccessNote({ ...EMPTY_ACCESS, lowCars: 'scrapes' }, { id: 'n2', spotId: 'ps-test', userId: 'me', on: '2026-11-21' });
    expect(bare).toEqual({ id: 'n2', spotId: 'ps-test', userId: 'me', on: '2026-11-21', lowCars: 'scrapes' });
    expect(() => makeAccessNote(EMPTY_ACCESS, { id: 'n3', spotId: 'ps-test', userId: 'me', on: '2026-11-21' })).toThrow();
  });
  test('one note per person, newest first; the summary takes the safest reading', () => {
    const base = { spotId: 's', on: '2026-11-01' };
    const notes: AccessNote[] = [
      { ...base, id: '1', userId: 'a', barrier: true, closes: '23:00', lowCars: 'ok' },
      { ...base, id: '2', userId: 'a', on: '2026-11-10', barrier: true, closes: '22:30', lowCars: 'ok' },
      { ...base, id: '3', userId: 'b', on: '2026-11-05', security: 'patrols', lowCars: 'scrapes' },
      { ...base, id: '4', userId: 'c', spotId: 'other', barrier: true },
    ];
    const mine = notesFor(notes, 's');
    expect(mine.map((n) => n.id)).toEqual(['2', '3']);
    expect(accessSummary(mine)).toBe('Barrier shuts 22:30 · Security patrols · Low cars may scrape');
    expect(accessSummary([])).toBeNull();
  });
});

describe('collections', () => {
  const mk = (id: string, name: string, done = false): Spot => photoSpot({ id, name, description: '', completions: done ? [{ userId: 'me', on: '2026-11-01' }] : [] });
  test('a set needs three places, and counts yours', () => {
    const coast = COLLECTIONS.find((c) => c.key === 'coast')!;
    const two = [mk('a', 'North seafront'), mk('b', 'South esplanade')];
    expect(collectionProgress(coast, two, 'me')).toBeNull();
    const three = [...two, mk('c', 'Harbour pier', true), mk('d', 'Town centre car park')];
    const p = collectionProgress(coast, three, 'me')!;
    expect([p.done, p.total]).toEqual([1, 3]);
    expect(spotCollections(three[2], three, 'me').map((x) => x.def.key)).toEqual(['coast']);
    expect(spotCollections(three[3], three, 'me')).toEqual([]);
  });
  test('the bundled places make real sets', () => {
    const spots = bundledSpots();
    const found = COLLECTIONS.map((c) => collectionProgress(c, spots, 'me')).filter(Boolean);
    expect(found.length).toBeGreaterThanOrEqual(3);
    for (const f of found) expect(f!.total).toBeGreaterThanOrEqual(3);
  });
});

describe('shot of the week', () => {
  const spots = [
    photoSpot({ id: 'a', photo: 'a.jpg', region: 'Essex' }),
    photoSpot({ id: 'b', photo: 'b.jpg', region: 'Essex' }),
    photoSpot({ id: 'c', photo: 'c.jpg', region: 'Kent' }),
  ];
  const ago = (days: number) => new Date(NOW.getTime() - days * 86_400_000).toISOString();
  const like = (ref: string, userId: string, days: number): ShotLike => ({ ref, userId, at: ago(days) });
  test('the most-liked shot in the last 7 days, in that region only', () => {
    const likes = [like('a.jpg', 'u1', 1), like('b.jpg', 'u1', 2), like('b.jpg', 'u2', 3), like('c.jpg', 'u1', 1), like('c.jpg', 'u2', 1), like('c.jpg', 'u3', 1)];
    expect(shotOfTheWeek('Essex', spots, [], likes, NOW)).toMatchObject({ ref: 'b.jpg', spotId: 'b', likes: 2 });
    expect(shotOfTheWeek('Kent', spots, [], likes, NOW)?.ref).toBe('c.jpg');
  });
  test('old likes do not count, one person counts once, and no likes means none', () => {
    expect(shotOfTheWeek('Essex', spots, [], [like('a.jpg', 'u1', 9), like('a.jpg', 'u2', 12)], NOW)).toBeNull();
    expect(shotOfTheWeek('Essex', spots, [], [like('a.jpg', 'u1', 1), like('a.jpg', 'u1', 2), like('b.jpg', 'u1', 1), like('b.jpg', 'u2', 1)], NOW)?.ref).toBe('b.jpg');
    expect(shotOfTheWeek('Essex', spots, [], [], NOW)).toBeNull();
    expect(shotOfTheWeek(undefined, spots, [], [], NOW)).toBeNull();
  });
  test('the demo has a winner in East Sussex, from this week', () => {
    const d = demoShots(NOW);
    const spotsDemo = bundledSpots();
    const w = shotOfTheWeek('East Sussex', spotsDemo, d.shots, d.likes, NOW);
    expect(w?.ref).toBe('sample:si-golf-r-mk7');
    expect(w?.spotId).toBe('ps-beachy-head-car-park');
  });
});

describe('demo place extras point at real places', () => {
  test('example shots and notes are on bundled photo spots', () => {
    const ids = new Set(PLACES.filter((p) => p.kind === 'photo').map((p) => p.id));
    expect(demoShots(NOW).shots.every((s) => ids.has(s.spotId))).toBe(true);
    expect(demoAccessNotes(NOW).every((n) => ids.has(n.spotId))).toBe(true);
  });
  test('sample lap times are on real layouts and kinds', () => {
    const tracks = new Set(PLACES.filter((p) => p.kind === 'track').map((p) => p.id));
    expect(DEMO_LAPS.every((l) => tracks.has(l.trackId))).toBe(true);
    expect(leaderboard(DEMO_LAPS, 'tr-donington', 'National', ['car']).length).toBeGreaterThanOrEqual(2);
  });
  test('demo track days are upcoming', () => {
    for (const r of demoTrackDays('tr-donington', NOW)) expect(Date.parse(r.startsAt)).toBeGreaterThan(NOW.getTime());
  });
});

describe('lap setup notes', () => {
  const me: Build = { id: 'b1', ownerId: 'me', kind: 'car', make: 'VW', model: 'Golf R', stockBhp: 316, weightKg: 1500, mods: [], photos: [] };
  const track: Spot = { id: 'tr-donington', kind: 'track', name: 'Donington Park', at: { lat: 52.83, lng: -1.38 }, description: '', status: 'approved', createdAt: NOW.toISOString(), completions: [], ratings: [] };
  const ctx = { track, layouts: ['Grand Prix', 'National'], vehicles: ['car' as const, 'bike' as const], builds: [me], me: 'me', now: NOW };
  const draft: LapDraft = { trackId: 'tr-donington', layout: 'National', on: '2026-11-10', time: '1:18.500', kind: 'car', buildId: 'b1', proof: 'p.jpg' };
  test('setup is optional, tidied, and checked', () => {
    expect(setupProblem(undefined)).toBeNull();
    expect(setupProblem({ frontPsi: 'lots' })).toMatch(/psi/);
    expect(setupProblem({ rearPsi: '99' })).toMatch(/psi/);
    expect(setupProblem({ tyres: 'x'.repeat(41) })).toMatch(/40/);
    expect(cleanSetup({ tyres: '  ', frontPsi: '' })).toBeUndefined();
    expect(cleanSetup({ tyres: ' PS4S ', frontPsi: '32', weather: 'dry' })).toEqual({ tyres: 'PS4S', frontPsi: '32', weather: 'dry' });
    expect(setupLine({ tyres: 'PS4S', frontPsi: '32', rearPsi: '30', weather: 'damp' })).toBe('PS4S · 32 / 30 psi · Damp');
  });
  test('a lap keeps its setup, a bad setup stops it, and the shareable copy has none', () => {
    const lap = makeLap({ ...draft, setup: { tyres: 'PS4S', frontPsi: '32', rearPsi: '30', weather: 'dry' } }, ctx, 'l1');
    expect(lap.setup).toEqual({ tyres: 'PS4S', frontPsi: '32', rearPsi: '30', weather: 'dry' });
    expect(publicLap(lap).setup).toBeUndefined();
    expect(makeLap(draft, ctx, 'l2').setup).toBeUndefined();
    expect(() => makeLap({ ...draft, setup: { frontPsi: 'x' } }, ctx, 'l3')).toThrow(/psi/);
  });
});

describe('class focus, personal bests and rival', () => {
  const lap = (id: string, userId: string, ms: number, on: string, cls: LapTime['cls'] = 'A', kind: LapTime['kind'] = 'car'): LapTime => ({
    id, trackId: 't', layout: 'L', on, ms, userId, vehicle: 'V', kind, cls, proof: 'p', status: 'unverified', submittedAt: `${on}T10:00:00Z`,
  });
  const laps = [lap('1', 'me', 80_000, '2026-01-01'), lap('2', 'me', 79_000, '2026-02-01'), lap('3', 'me', 79_500, '2026-03-01'), lap('4', 'me', 78_000, '2026-04-01'), lap('5', 'dan', 77_500, '2026-02-01'), lap('6', 'kez', 90_000, '2026-02-01', 'C'), lap('7', 'liv', 100_000, '2026-02-01', 'A', 'bike')];

  test('compares with your own class, or everything when you have none', () => {
    const groups = leaderboard(laps, 't', 'L');
    expect(groups.map((g) => g.key)).toEqual(['car-A', 'car-C', 'bike-A']);
    expect(classFocus(groups, [{ kind: 'car', cls: 'A' }]).map((g) => g.key)).toEqual(['car-A']);
    expect(classFocus(groups, [])).toHaveLength(3);
    expect(classFocus(groups, [{ kind: 'bike', cls: 'S' }])).toHaveLength(3);
    expect(placeInGroup(groups[0], 'me')).toEqual({ place: 2, of: 2 });
    expect(placeInGroup(groups[0], 'kez')).toBeNull();
    expect(ordinal(1) + ordinal(2) + ordinal(3) + ordinal(4) + ordinal(11) + ordinal(22)).toBe('1st2nd3rd4th11th22nd');
  });
  test('the timeline is your best per day, oldest first, flagging new bests', () => {
    const t = bestTimeline([...laps, lap('8', 'me', 81_000, '2026-01-01')], 't', 'L', 'me');
    expect(t.map((p) => [p.on, p.ms, p.best, p.isBest])).toEqual([
      ['2026-01-01', 80_000, 80_000, true],
      ['2026-02-01', 79_000, 79_000, true],
      ['2026-03-01', 79_500, 79_000, false],
      ['2026-04-01', 78_000, 78_000, true],
    ]);
    expect(bestTimeline(laps, 't', 'L', 'nobody')).toEqual([]);
    expect(bestTimeline([{ ...lap('9', 'me', 70_000, '2026-05-01'), status: 'rejected' }], 't', 'L', 'me')).toEqual([]);
  });
  test('the rival gap is your best minus theirs', () => {
    const s = rivalStanding(laps, 't', 'L', 'me', 'dan');
    expect(s.gapMs).toBe(500);
    expect(gapText(500)).toBe('+0.500');
    expect(gapText(-1234)).toBe('-1.234');
    expect(gapText(61_000)).toBe('+1:01.000');
    expect(rivalStanding(laps, 't', 'L', 'nobody', 'dan').gapMs).toBeUndefined();
  });
  test('news says who got quicker, and nothing the first time', () => {
    expect(rivalNews(undefined, { me: 1, them: 2 }, '@dan')).toEqual([]);
    expect(rivalNews({ me: 80_000, them: 77_500 }, { me: 78_000, them: 77_500 }, '@dan')).toEqual(['You went quicker: 1:18.000 (was 1:20.000).']);
    expect(rivalNews({ me: 80_000, them: 77_500 }, { me: 80_000, them: 76_900 }, '@dan')).toEqual(['@dan went quicker: 1:16.900 (was 1:17.500).']);
    expect(rivalNews({ me: 80_000, them: 77_500 }, { me: 80_500, them: 77_500 }, '@dan')).toEqual([]);
  });
});

describe('track days', () => {
  const DONNINGTON = { lat: 52.8284, lng: -1.3793 };
  const ev = (id: string, over: Partial<NightEvent> = {}): NightEvent => ({
    id, type: 'trackday', title: id, startsAt: '2026-12-05T09:00:00Z', area: DONNINGTON, areaName: 'Donington', stops: [{ id: 's', name: 'Donington Park', at: DONNINGTON }], currentStop: 0,
    revealMinutesBefore: 60, hostIds: [], filter: { everyone: true, cars: true, bikes: true, classes: [], minMods: 0, brands: [], radiusMiles: 50 }, going: ['a', 'b'], checkIns: {}, ...over,
  });
  test('upcoming Track day meets at that circuit, soonest first', () => {
    const events = [
      ev('late', { startsAt: '2026-12-20T09:00:00Z' }),
      ev('soon'),
      ev('past', { startsAt: '2026-11-01T09:00:00Z' }),
      ev('cancelled', { cancelled: true }),
      ev('meet', { type: 'meet' }),
      ev('elsewhere', { stops: [{ id: 's', name: 'Elsewhere', at: { lat: 51.5, lng: -0.1 } }] }),
      ev('unplaced', { stops: [{ id: 's', name: 'Hidden' }] }),
    ];
    const days = trackDaysAt(events, DONNINGTON, NOW);
    expect(days.map((d) => d.id)).toEqual(['soon', 'late']);
    expect(days[0].going).toEqual(['a', 'b']);
    expect(mergeTrackDays(days, [{ id: 'x', title: 'x', startsAt: '2026-12-10T09:00:00Z', going: [] }]).map((d) => d.id)).toEqual(['soon', 'x', 'late']);
  });
});

describe('phone saves', () => {
  test('a damaged save is dropped, not trusted', () => {
    expect(readExtras(null)).toEqual({ notes: [], likes: [], rivals: {} });
    expect(readExtras({ notes: [{ nope: 1 }, { id: 'n', spotId: 's' }], likes: 'x', rivals: 3 }).notes).toHaveLength(1);
    expect(readExtras({ likes: [{ ref: 'r', userId: 'u', at: 'a' }, null] }).likes).toHaveLength(1);
  });
});
