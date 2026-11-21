import { addFavourite, asDestination, DEMO_FAVOURITES, favouritesOf, findFavourite, MAX_FAVOURITES, removeFavourite, renameFavourite, toggleFavourite } from '../src/lib/favourites';
import { describedFeels, filterByFeel, setFeels, topFeels, toggleFeel, canTagFeel, savedFeelTags } from '../src/lib/driveFeel';
import { driveSun, QUIET_WINDOW } from '../src/lib/driveTimes';
import { addLogEntry, driveLog, savedLog } from '../src/lib/driveLog';
import { groupDriveShare, regroupPoints } from '../src/lib/groupDrive';
import type { Spot } from '../src/lib/types';

const dest = (n: number) => ({ at: { lat: 52 + n * 0.1, lng: -1.5 }, name: `Place ${n}`, address: 'Somewhere' });
const drive = (over: Partial<Spot> = {}): Spot => ({
  id: 'd1', kind: 'drive', name: 'Test road', at: { lat: 52.5, lng: -1.5 }, description: 'Twisty bends with big views.', status: 'approved', createdAt: '2026-01-01', completions: [], ratings: [], ...over,
});

describe('favourites', () => {
  it('adds, dedupes, renames, removes and toggles', () => {
    let l = addFavourite([], dest(1), 'Home');
    expect(l[0].label).toBe('Home');
    expect(addFavourite(l, dest(1))).toHaveLength(1);
    l = addFavourite(l, dest(2));
    expect(l.map((f) => f.name)).toEqual(['Place 2', 'Place 1']);
    l = renameFavourite(l, l[1].id, "Sam's");
    expect(l[1].label).toBe("Sam's");
    expect(findFavourite(l, dest(2))).toBeTruthy();
    expect(toggleFavourite(l, dest(2))).toHaveLength(1);
    expect(toggleFavourite(l, dest(3))).toHaveLength(3);
    expect(removeFavourite(l, l[0].id)).toHaveLength(1);
  });
  it('caps the list and starts the demo with made-up places only', () => {
    let l: ReturnType<typeof addFavourite> = [];
    for (let i = 0; i < MAX_FAVOURITES + 5; i++) l = addFavourite(l, dest(i));
    expect(l).toHaveLength(MAX_FAVOURITES);
    expect(favouritesOf(undefined, true)).toHaveLength(DEMO_FAVOURITES.length);
    expect(favouritesOf(undefined, false)).toEqual([]);
    expect(favouritesOf([], true)).toEqual([]);
    expect(favouritesOf([{ bad: 1 } as never], false)).toEqual([]);
    expect(DEMO_FAVOURITES.every((f) => f.address === 'Made-up place')).toBe(true);
    expect(asDestination(l[0]).name).toBe(l[0].name);
  });
});

describe('drive feels', () => {
  it('reads feels from the description and puts yours first', () => {
    const s = drive();
    expect(describedFeels(s)).toEqual(['twisty', 'scenic']);
    expect(topFeels(s, { d1: ['quiet'] }).map((x) => x.feel)).toEqual(['quiet', 'twisty', 'scenic']);
    expect(topFeels(s, {}, 1)).toHaveLength(1);
  });
  it('tags, untags and filters by every chosen feel', () => {
    let t = toggleFeel({}, 'd1', 'smooth');
    expect(t.d1).toEqual(['smooth']);
    t = toggleFeel(t, 'd1', 'smooth');
    expect(t).toEqual({});
    expect(setFeels({}, 'd1', ['quiet', 'twisty']).d1).toEqual(['twisty', 'quiet']);
    const a = drive();
    const b = drive({ id: 'd2', description: 'A plain road.' });
    expect(filterByFeel([a, b], [], {})).toHaveLength(2);
    expect(filterByFeel([a, b], ['twisty'], {}).map((s) => s.id)).toEqual(['d1']);
    expect(filterByFeel([a, b], ['quiet'], { d2: ['quiet'] }).map((s) => s.id)).toEqual(['d2']);
    expect(filterByFeel([a, b], ['twisty', 'quiet'], {})).toEqual([]);
    expect(savedFeelTags({ x: ['twisty', 'nope'], y: 'z' })).toEqual({ x: ['twisty'] });
  });
  it('lets only people who did the drive tag it', () => {
    expect(canTagFeel(drive(), 'me')).toBe(false);
    expect(canTagFeel(drive({ completions: [{ userId: 'me', on: '2026-11-01' }] }), 'me')).toBe(true);
  });
});

describe('best time', () => {
  it('gives UK sunrise and sunset and a quiet window', () => {
    const t = driveSun(new Date('2026-06-21T12:00:00Z'), { lat: 52.5, lng: -1.5 });
    expect(t.sunrise).toMatch(/^0[3-5]:\d\d$/);
    expect(t.sunset).toMatch(/^2[01]:\d\d$/);
    expect(QUIET_WINDOW).toMatch(/weekdays/);
  });
});

describe('drive log', () => {
  it('keeps newest first and adds finished drives the log lacks', () => {
    const spot = drive({ miles: 12, completions: [{ userId: 'me', on: '2026-11-02' }, { userId: 'other', on: '2026-11-05' }] });
    const log = addLogEntry([], { spotId: 'd1', name: 'Test road', on: '2026-11-10', vehicle: 'Golf GTI' });
    const rows = driveLog(log, [spot], 'me');
    expect(rows.map((r) => r.on)).toEqual(['2026-11-10', '2026-11-02']);
    expect(rows[1].vehicle).toBeUndefined();
    // The same day is not counted twice.
    const same = driveLog(addLogEntry([], { spotId: 'd1', name: 'Test road', on: '2026-11-02' }), [spot], 'me');
    expect(same).toHaveLength(1);
    expect(savedLog([{ spotId: 1 }, { spotId: 'a', name: 'n', on: '2026-01-01' }])).toHaveLength(1);
  });
});

describe('group drive', () => {
  const path = Array.from({ length: 12 }, (_, i) => ({ lat: 52 + i * 0.05, lng: -1.5 }));
  it('picks regroup points that are never the start or finish', () => {
    const pts = regroupPoints(path);
    expect(pts.length).toBeGreaterThan(0);
    expect(pts.every((p) => p.checkpoint > 1 && p.checkpoint < path.length)).toBe(true);
    expect(regroupPoints(path.slice(0, 2))).toEqual([]);
  });
  it('shares the drive with its regroup points and no tracking promise', () => {
    const s = groupDriveShare(drive({ path }));
    expect(s.text).toMatch(/Regroup at checkpoint/);
    expect(s.url).toMatch(/spot\/d1$/);
  });
});
