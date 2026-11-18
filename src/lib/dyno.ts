import { appNow } from './appClock';
import { bhpText } from './format';
import { DYNO_MATCH, effectivePower, powerIsEstimate, sheetCrank, WHEEL_LOSS as LOSS } from './classes';
import type { Build, DynoRun, VehicleKind } from './types';

/**
 * A build's dyno runs (REVIEW-9 dyno section). Pure, so it's tested.
 *
 * REVIEW-10 #3: only a run with a photo of its sheet feeds Class (classes.ts sheetRun); a typed
 * figure with no sheet is kept in the history but never moves you up. Class uses that run's power
 * at the crank (flywheel). A crank figure is used as it is.
 * A wheel figure is turned into an estimated crank figure by adding typical drivetrain loss
 * (15% for cars, 10% for bikes), and the build page labels it "estimated from wheel power".
 * That keeps rolling-road (wheel) and engine-dyno (crank) owners on the same scale as everyone
 * else's standard (crank) figures.
 */

export const WHEEL_LOSS: Record<VehicleKind, number> = LOSS;
export const MAX_DYNO_RUNS = 20;

/** The power Class uses from a run: the crank figure, or an estimate from wheel power. */
export function crankBhp(run: Pick<DynoRun, 'powerBhp' | 'at'>, kind: VehicleKind): number {
  return run.at === 'crank' ? Math.round(run.powerBhp) : Math.round(run.powerBhp / (1 - WHEEL_LOSS[kind]));
}

/** Newest first: by date, then the one added later. */
export function runsNewestFirst(runs: readonly DynoRun[] | undefined): DynoRun[] {
  return (runs ?? []).map((r, i) => ({ r, i })).sort((a, b) => b.r.date.localeCompare(a.r.date) || b.i - a.i).map((x) => x.r);
}

export function latestRun(runs: readonly DynoRun[] | undefined): DynoRun | undefined {
  return runsNewestFirst(runs)[0];
}

/** The build with this run added (or replaced, by id), and `dynoBhp` from the latest. */
export function withRun(build: Build, run: DynoRun): Build {
  const others = (build.dynoRuns ?? []).filter((r) => r.id !== run.id);
  return withRuns(build, [...others, run].slice(-MAX_DYNO_RUNS));
}

export function withoutRun(build: Build, runId: string): Build {
  return withRuns(build, (build.dynoRuns ?? []).filter((r) => r.id !== runId));
}

function withRuns(build: Build, runs: DynoRun[]): Build {
  const next: Build = { ...build, dynoRuns: runs };
  // The newest run with a sheet sets it; with none, back to the claimed power.
  const crank = sheetCrank(next);
  if (crank) next.dynoBhp = crank;
  else delete next.dynoBhp;
  return next;
}

/** "12 Mar" (this year) or "12 Mar 2025". */
export function runDay(date: string, now: Date = appNow()): string {
  const [y, m, d] = date.split('-').map(Number);
  const when = new Date(y, (m || 1) - 1, d || 1);
  return when.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', ...(y !== now.getFullYear() ? { year: 'numeric' } : {}) });
}

/** "312 whp · 295 lb-ft · at the wheels · 12 Mar" (bhp at the crank). */
export function runSummary(run: DynoRun, now: Date = appNow()): string {
  // Wheel figures read whp: never a bigger number than the sheet's.
  return [`${Math.round(run.powerBhp)} ${run.at === 'wheels' ? 'whp' : 'bhp'}`, run.torqueLbFt ? `${Math.round(run.torqueLbFt)} lb-ft` : null, run.at === 'wheels' ? 'at the wheels' : 'at the crank', runDay(run.date, now)]
    .filter(Boolean)
    .join(' · ');
}

/**
 * Before and after against the previous run: "+18 bhp, +12 lb-ft". Like for like: when one run
 * is at the wheels and the other at the crank, both are compared at the crank (estimated).
 */
export function runChange(run: DynoRun, previous: DynoRun | undefined, kind: VehicleKind): { power: number; torque: number | null } | null {
  if (!previous) return null;
  const same = run.at === previous.at;
  const power = same ? run.powerBhp - previous.powerBhp : crankBhp(run, kind) - crankBhp(previous, kind);
  const torque = same && run.torqueLbFt && previous.torqueLbFt ? run.torqueLbFt - previous.torqueLbFt : null;
  return { power: Math.round(power), torque: torque === null ? null : Math.round(torque) };
}

export function changeText(c: { power: number; torque: number | null }): string {
  const sign = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : '±0');
  return [`${sign(c.power)} bhp`, c.torque !== null ? `${sign(c.torque)} lb-ft` : null].filter(Boolean).join(', ');
}

/** The first thing wrong with a run before saving, or null. */
export function runProblem(run: Pick<DynoRun, 'powerBhp' | 'torqueLbFt' | 'date' | 'shop'>, today: Date = appNow()): string | null {
  if (!Number.isFinite(run.powerBhp) || run.powerBhp < 20 || run.powerBhp > 2500) return 'Type the peak power from the sheet (20 to 2,500 bhp).';
  if (run.torqueLbFt !== undefined && (!Number.isFinite(run.torqueLbFt) || run.torqueLbFt < 10 || run.torqueLbFt > 2000)) return 'Torque looks wrong: 10 to 2,000 lb-ft, or leave it empty.';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(run.date)) return 'Pick the day of the run.';
  const t = new Date(`${run.date}T00:00:00`);
  if (Number.isNaN(t.getTime()) || t.getTime() > today.getTime() + 86_400_000) return "The run can't be in the future.";
  if (run.shop && run.shop.trim().length > 60) return 'Keep the shop name to 60 characters.';
  return null;
}

/** Today as YYYY-MM-DD, local. */
export function isoDay(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ---------------------------------------------------------------------------
// The "Dyno proven" badge (owner rules, 18 Nov 2026). Mirrored on the server in
// public.dyno_badges(), which decides it for signed-in builds.
// ---------------------------------------------------------------------------

/** A run counts for the badge for two years. */
export const BADGE_DAYS = 730;
/** The power shown must match the run within 2%. */
export const BADGE_TOLERANCE = DYNO_MATCH;

export type DynoBadge =
  /** Backed by a recent run with its sheet: "✓ Dyno". `figure` is from the run (whp at the wheels). */
  | { state: 'proven'; run: DynoRun; figure: number; unit: 'whp' | 'bhp' }
  /** A run with its sheet, more than two years old: "Dyno 2023", muted. */
  | { state: 'old'; run: DynoRun; year: number };

const dayMs = 86_400_000;
function runTime(date: string): number {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1).getTime();
}

/**
 * The badge for a build's power, or null (a claimed figure). Rules:
 * 1. the latest run has a sheet photo (and staff haven't taken the badge off it);
 * 2. the power the build uses matches that run within 2% (edit bhp by hand and it goes, until it matches again);
 * 3. the run is under two years old, else "Dyno 2023" in a muted style;
 * 4. signed in, the server's `dynoVerified` must agree.
 * Wheel runs show as whp, never inflated; Class's crank estimate is labelled "est." where it shows.
 */
export function dynoBadge(build: Pick<Build, 'kind' | 'dynoBhp' | 'dynoRuns' | 'dynoVerified'>, now: Date = appNow()): DynoBadge | null {
  const run = latestRun(build.dynoRuns);
  if (!run || !run.photo || run.badgeRemoved) return null;
  const crank = crankBhp(run, build.kind);
  if (!build.dynoBhp || Math.abs(build.dynoBhp - crank) > crank * BADGE_TOLERANCE) return null;
  if (now.getTime() - runTime(run.date) > BADGE_DAYS * dayMs) return { state: 'old', run, year: Number(run.date.slice(0, 4)) };
  if (build.dynoVerified === false) return null;
  return { state: 'proven', run, figure: Math.round(run.powerBhp), unit: run.at === 'wheels' ? 'whp' : 'bhp' };
}

/**
 * The one headline power (REVIEW-10 #5): bhp at the crank, the figure Class and bhp/tonne use,
 * "est." when it's worked out from a wheels run. `whp` is the latest wheels run's figure, shown as
 * secondary text ("221 whp on the dyno") when there is one.
 */
export function headlinePower(build: Build): { bhp: number; est: boolean; whp: number | null } {
  const run = latestRun(build.dynoRuns);
  return { bhp: Math.round(effectivePower(build)), est: powerIsEstimate(build), whp: run && run.at === 'wheels' ? Math.round(run.powerBhp) : null };
}

/** "583 bhp", or "260 bhp est." from a wheels run. */
export function powerText(build: Build): string {
  const p = headlinePower(build);
  return `${bhpText(p.bhp)}${p.est ? '\u00a0est.' : ''}`;
}

/** The secondary wheels line, or null: "221 whp on the dyno". */
export function whpText(build: Build): string | null {
  const p = headlinePower(build);
  if (!p.whp) return null;
  const run = latestRun(build.dynoRuns);
  return `${p.whp} whp at the wheels on the dyno${run && !run.photo ? ' (typed, no sheet)' : ''}`;
}
