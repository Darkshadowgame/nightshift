import { changeText, crankBhp, latestRun, runChange, runProblem, runSummary, withoutRun, withRun } from '../src/lib/dyno';
import { effectivePower } from '../src/lib/classes';
import type { Build, DynoRun } from '../src/lib/types';

const build: Build = { id: 'b1', ownerId: 'me', kind: 'car', make: 'Honda', model: 'Civic Type R', stockBhp: 316, weightKg: 1380, mods: [], photos: [] };
const run = (id: string, date: string, powerBhp: number, at: DynoRun['at'], torqueLbFt?: number): DynoRun => ({ id, date, powerBhp, at, ...(torqueLbFt ? { torqueLbFt } : {}) });
const NOW = new Date(2026, 10, 18);

describe('dyno runs (REVIEW-9)', () => {
  test('a crank figure is used as it is; a wheel figure is an estimate with drivetrain loss', () => {
    expect(crankBhp(run('a', '2026-03-12', 330, 'crank'), 'car')).toBe(330);
    expect(crankBhp(run('a', '2026-03-12', 306, 'wheels'), 'car')).toBe(360);
    expect(crankBhp(run('a', '2026-03-12', 180, 'wheels'), 'bike')).toBe(200);
  });

  test('the newest run with a sheet sets the power Class uses; removing every run goes back to the claim', () => {
    const sheet = (r: DynoRun): DynoRun => ({ ...r, photo: 'p.jpg' });
    let b = withRun(build, sheet(run('a', '2026-03-12', 312, 'wheels', 295)));
    b = withRun(b, sheet(run('b', '2026-01-02', 300, 'crank')));
    expect(latestRun(b.dynoRuns)!.id).toBe('a');
    expect(effectivePower(b)).toBe(367);
    b = withoutRun(withoutRun(b, 'a'), 'b');
    expect(b.dynoBhp).toBeUndefined();
    expect(effectivePower(b)).toBe(316);
  });

  test('REVIEW-10 #3: a typed run with no sheet never changes Class', () => {
    const typed = withRun(build, run('a', '2026-03-12', 400, 'crank'));
    expect(typed.dynoBhp).toBeUndefined();
    expect(effectivePower(typed)).toBe(316);
    // A newer typed run doesn't replace the older sheet run Class uses.
    const both = withRun(withRun(build, { ...run('s', '2026-01-02', 330, 'crank'), photo: 'p.jpg' }), run('t', '2026-03-12', 450, 'crank'));
    expect(effectivePower(both)).toBe(330);
    // Staff taking the badge off the sheet takes it out of Class too.
    const removed = { ...both, dynoRuns: both.dynoRuns!.map((r) => ({ ...r, badgeRemoved: true })) };
    expect(effectivePower(removed)).toBe(316);
    // A dynoBhp with no sheet behind it (an old save, a hand edit) is ignored.
    expect(effectivePower({ ...build, dynoBhp: 500 })).toBe(316);
  });

  test('summary and before/after, like for like', () => {
    expect(runSummary(run('a', '2026-03-12', 312, 'wheels', 295), NOW)).toBe('312 whp · 295 lb-ft · at the wheels · 12 Mar');
    const c = runChange(run('a', '2026-03-12', 312, 'wheels', 295), run('b', '2026-01-02', 294, 'wheels', 283), 'car')!;
    expect(changeText(c)).toBe('+18 bhp, +12 lb-ft');
    expect(runChange(run('a', '2026-03-12', 312, 'wheels'), undefined, 'car')).toBeNull();
  });

  test('checks before saving', () => {
    expect(runProblem(run('a', '2026-03-12', 312, 'wheels'), NOW)).toBeNull();
    expect(runProblem(run('a', '2026-03-12', NaN, 'wheels'), NOW)).toMatch(/peak power/);
    expect(runProblem(run('a', '2027-03-12', 312, 'wheels'), NOW)).toMatch(/future/);
    expect(runProblem(run('a', '12/3/26', 312, 'wheels'), NOW)).toMatch(/day/);
  });
});

describe('the Dyno proven badge (owner rules)', () => {
  const { dynoBadge, powerText, whpText } = jest.requireActual('../src/lib/dyno') as typeof import('../src/lib/dyno');
  const sheet = (r: DynoRun): DynoRun => ({ ...r, photo: 'p1.jpg' });
  const withSheet = (r: DynoRun) => withRun(build, sheet(r));

  test('a recent run with its sheet, matching the power: proven, wheels shown as whp', () => {
    const b = withSheet(run('a', '2026-03-12', 312, 'wheels', 295));
    expect(dynoBadge(b, NOW)).toMatchObject({ state: 'proven', figure: 312, unit: 'whp' });
    // One power figure (REVIEW-10 #5): crank bhp, est. from wheels; whp as the secondary line.
    expect(powerText(b)).toBe('367 bhp est.');
    expect(whpText(b)).toBe('312 whp at the wheels on the dyno');
    expect(whpText(withRun(build, run('t', '2026-03-12', 300, 'wheels')))).toBe('300 whp at the wheels on the dyno (typed, no sheet)');
    expect(powerText(withSheet(run('c', '2026-03-12', 330, 'crank')))).toBe('330 bhp');
    expect(dynoBadge(withSheet(run('c', '2026-03-12', 330, 'crank')), NOW)).toMatchObject({ state: 'proven', unit: 'bhp' });
  });

  test('1: no sheet photo, no badge', () => {
    expect(dynoBadge(withRun(build, run('a', '2026-03-12', 312, 'wheels')), NOW)).toBeNull();
  });

  test('2 and 4: power edited by hand away from the run loses it, within 2% keeps it', () => {
    const b = withSheet(run('a', '2026-03-12', 330, 'crank'));
    expect(dynoBadge({ ...b, dynoBhp: 336 }, NOW)?.state).toBe('proven');
    expect(dynoBadge({ ...b, dynoBhp: 360 }, NOW)).toBeNull();
    expect(dynoBadge({ ...b, dynoBhp: 330 }, NOW)?.state).toBe('proven');
  });

  test('3: over two years old reads "Dyno 2023", muted', () => {
    expect(dynoBadge(withSheet(run('a', '2023-06-01', 330, 'crank')), NOW)).toMatchObject({ state: 'old', year: 2023 });
  });

  test('staff removal and the server have the last word', () => {
    const b = withSheet(run('a', '2026-03-12', 330, 'crank'));
    expect(dynoBadge({ ...b, dynoRuns: b.dynoRuns!.map((r) => ({ ...r, badgeRemoved: true })) }, NOW)).toBeNull();
    expect(dynoBadge({ ...b, dynoVerified: false }, NOW)).toBeNull();
    expect(dynoBadge({ ...b, dynoVerified: true }, NOW)?.state).toBe('proven');
  });

  test('a claimed figure: the bhp Class uses', () => {
    expect(powerText(build)).toBe('316 bhp');
  });
});
