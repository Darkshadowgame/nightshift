import { classOf } from './classes';
import { TRACK_INFO, type TrackVehicle } from '../data/trackInfo';
import type { Build, ClassLetter, Spot } from './types';

/**
 * Track times: lap (or hill-climb run) times people enter after a real track
 * day, with a photo of the timing sheet or timing app as proof.
 *
 * Only ever at a real circuit, sprint course or hill climb (the bundled
 * tracks). Drives, photo spots and anything on a public road are never timed:
 * there is no way to enter a time for them. Times are typed in by hand, never
 * worked out from the phone's GPS.
 *
 * Kept on the phone for now and marked unverified. Checking the proof against
 * the timing sheet arrives with the server.
 */

export type LapStatus = 'unverified' | 'verified' | 'rejected';

export type { TrackVehicle };

export interface LapTime {
  id: string;
  trackId: string;
  layout: string;
  /** Day of the track day, YYYY-MM-DD. */
  on: string;
  /** Lap or run time in milliseconds. */
  ms: number;
  userId: string;
  /** The build that set it. */
  buildId?: string;
  /** What it was set in, as it was then: "VW Golf R". */
  vehicle: string;
  kind: TrackVehicle;
  /** The build's class (S–D) when the time was entered. */
  cls: ClassLetter;
  /** Stored photo name of the timing sheet or screenshot (plate-blurred, no metadata). */
  proof: string;
  status: LapStatus;
  submittedAt: string;
  /** Tyres, pressures and weather. Private: only the person who set the lap sees it (publicLap strips it). */
  setup?: LapSetup;
}

export type Weather = 'dry' | 'damp' | 'wet';
export const WEATHER_LABELS: Record<Weather, string> = { dry: 'Dry', damp: 'Damp', wet: 'Wet' };

/** What the car or bike was running on the lap. All optional, all private. */
export interface LapSetup {
  tyres?: string;
  /** Front and rear pressures in psi, as typed ("32"). */
  frontPsi?: string;
  rearPsi?: string;
  weather?: Weather;
}

export interface LapDraft {
  trackId: string;
  layout: string;
  on: string;
  /** As typed: "1:23.456" or "58.9". */
  time: string;
  kind: TrackVehicle;
  buildId?: string;
  proof?: string;
  setup?: LapSetup;
}

/** A layout name for tracks with no published layouts. */
export const MAIN_LAYOUT = 'Main layout';
/** Times older than this can't be entered. */
export const MAX_AGE_DAYS = 730;
export const MIN_LAP_MS = 10_000;
export const MAX_LAP_MS = 15 * 60_000;

/** "1:23.456", "1.23.456", "83.456" or "58" to milliseconds. Null if it isn't a time. */
export function parseLapTime(text: string): number | null {
  const t = text.trim().replace(/\s+/g, '');
  // "1:23.456", or "1.23.456" as some timing sheets print it. "58.96" alone is seconds.
  const m = t.match(/^(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?$/) ?? t.match(/^(\d{1,2})\.(\d{2})\.(\d{1,3})$/);
  if (m) {
    const secs = Number(m[2]);
    if (secs >= 60) return null;
    return Number(m[1]) * 60_000 + secs * 1000 + Number((m[3] ?? '0').padEnd(3, '0'));
  }
  const s = t.match(/^(\d{1,3})(?:\.(\d{1,3}))?$/);
  if (s) return Number(s[1]) * 1000 + Number((s[2] ?? '0').padEnd(3, '0'));
  return null;
}

/** 83456 → "1:23.456"; under a minute → "58.596". */
export function formatLapTime(ms: number): string {
  const total = Math.round(ms);
  const mins = Math.floor(total / 60_000);
  const rest = total - mins * 60_000;
  const secs = Math.floor(rest / 1000);
  const frac = String(rest % 1000).padStart(3, '0');
  return mins > 0 ? `${mins}:${String(secs).padStart(2, '0')}.${frac}` : `${secs}.${frac}`;
}

/** Published records look like "1:27.097", "0:58.596" or "34.60". */
export function recordMs(time: string): number | null {
  return parseLapTime(time.replace(/^0:/, ''));
}

/**
 * Only bundled tracks with known track details take times: never a drive,
 * photo spot, venue or anything someone suggested. Spectator venues (oval
 * stock cars, speedway, racing on closed public roads) don't run track days,
 * so they take none either. Fails closed: the venue's own facts decide, not
 * the caller, so the rule the backend copies can't be skipped by mistake.
 */
export function canTimeAt(spot: Spot | undefined): { ok: true } | { ok: false; reason: string } {
  if (!spot || spot.kind !== 'track' || spot.authorId)
    return { ok: false, reason: 'Times only count at a real circuit, sprint course or hill climb. Drives and roads are never timed.' };
  const info = TRACK_INFO[spot.id];
  if (!info) return { ok: false, reason: "We don't have this track's details yet, so times can't be entered here." };
  if (info.spectator) return { ok: false, reason: 'This is a spectator venue with no track days, so there are no times to enter.' };
  return { ok: true };
}

export const VEHICLE_LABELS: Record<TrackVehicle, string> = { car: 'Cars', bike: 'Bikes' };

export function buildLabel(b: Pick<Build, 'make' | 'model' | 'nickname'>): string {
  return `${b.make} ${b.model}`.trim() || b.nickname || 'Build';
}

const DAY = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * What's wrong with a lap time before it can be saved, or null. `layouts` are
 * the track's layout names; `fastestMs` is the published outright record for
 * that layout, if there is one (a time quicker than it is a typo).
 */
export function lapProblem(
  d: LapDraft,
  ctx: {
    track: Spot | undefined;
    layouts: string[];
    /** What runs at the track. */
    vehicles: TrackVehicle[];
    builds: Build[];
    me: string;
    now: Date;
    fastestMs?: number | null;
  },
): string | null {
  const where = canTimeAt(ctx.track);
  if (!where.ok) return where.reason;
  if (!ctx.vehicles.includes(d.kind)) return `${VEHICLE_LABELS[d.kind]} don't run here.`;
  const allowed = ctx.layouts.length ? ctx.layouts : [MAIN_LAYOUT];
  if (!allowed.includes(d.layout)) return 'Pick the layout you drove or rode.';
  const day = d.on.match(DAY);
  const date = day ? new Date(Date.UTC(Number(day[1]), Number(day[2]) - 1, Number(day[3]))) : null;
  if (!date || Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== d.on) return 'Enter the track day date as YYYY-MM-DD.';
  const today = ctx.now.toISOString().slice(0, 10);
  if (d.on > today) return "That date hasn't happened yet.";
  if (ctx.now.getTime() - date.getTime() > MAX_AGE_DAYS * 86_400_000) return 'Only times from the last two years can be entered.';
  const ms = parseLapTime(d.time);
  if (ms === null) return 'Enter the time as minutes:seconds, e.g. 1:23.456.';
  if (ms < MIN_LAP_MS || ms > MAX_LAP_MS) return 'That time is outside what a lap or run here could be. Check it against the timing sheet.';
  if (ctx.fastestMs && ms < ctx.fastestMs) return "That's quicker than the outright record for this layout. Check it against the timing sheet.";
  const setup = setupProblem(d.setup);
  if (setup) return setup;
  const build = ctx.builds.find((b) => b.id === d.buildId);
  if (!build || build.ownerId !== ctx.me) return `Pick the ${d.kind} from your garage that set the time.`;
  if (build.kind !== d.kind) return `That build is a ${build.kind}, not a ${d.kind}.`;
  if (!d.proof) return 'Add a photo of the timing sheet or timing app screen as proof.';
  return null;
}

/** Turn a checked draft into a saved, unverified time. Throws with the reason if it isn't ready. */
export function makeLap(d: LapDraft, ctx: Parameters<typeof lapProblem>[1], id: string): LapTime {
  const problem = lapProblem(d, ctx);
  if (problem) throw new Error(problem);
  const base = { id, trackId: d.trackId, layout: d.layout, on: d.on, ms: parseLapTime(d.time)!, userId: ctx.me, proof: d.proof! };
  const build = ctx.builds.find((b) => b.id === d.buildId)!;
  return {
    ...base,
    buildId: build.id, vehicle: buildLabel(build), kind: build.kind, cls: classOf(build),
    status: 'unverified',
    submittedAt: ctx.now.toISOString(),
    ...(cleanSetup(d.setup) ? { setup: cleanSetup(d.setup) } : {}),
  };
}

export const MAX_TYRES = 40;
const PSI = /^\d{1,2}(\.\d)?$/;

/** What's wrong with the setup notes, or null. Nothing is required. */
export function setupProblem(s: LapSetup | undefined): string | null {
  if (!s) return null;
  if (s.tyres && s.tyres.trim().length > MAX_TYRES) return `Keep the tyres to ${MAX_TYRES} characters.`;
  for (const p of [s.frontPsi, s.rearPsi]) {
    if (p && p.trim() && (!PSI.test(p.trim()) || Number(p) < 5 || Number(p) > 60)) return 'Enter tyre pressures in psi, like 32 or 28.5.';
  }
  return null;
}

/** The setup with blanks dropped; undefined when nothing was entered. */
export function cleanSetup(s: LapSetup | undefined): LapSetup | undefined {
  if (!s) return undefined;
  const tyres = s.tyres?.trim();
  const front = s.frontPsi?.trim();
  const rear = s.rearPsi?.trim();
  const out: LapSetup = { ...(tyres ? { tyres } : {}), ...(front ? { frontPsi: front } : {}), ...(rear ? { rearPsi: rear } : {}), ...(s.weather ? { weather: s.weather } : {}) };
  return Object.keys(out).length ? out : undefined;
}

/** "Michelin Pilot Sport 4S · 32 / 30 psi · Dry". */
export function setupLine(s: LapSetup | undefined): string {
  if (!s) return '';
  const psi = s.frontPsi && s.rearPsi ? `${s.frontPsi} / ${s.rearPsi} psi` : s.frontPsi ? `${s.frontPsi} psi front` : s.rearPsi ? `${s.rearPsi} psi rear` : null;
  return [s.tyres, psi, s.weather ? WEATHER_LABELS[s.weather] : null].filter(Boolean).join(' · ');
}

/**
 * A lap as anyone else may see it. Setup notes stay private: they're only ever on the phone, and
 * this is the one place a lap is turned into something shareable (the server copy has no setup).
 */
export function publicLap(l: LapTime): LapTime {
  const { setup: _private, ...rest } = l;
  return rest;
}

export interface LeaderGroup {
  key: string;
  kind: TrackVehicle;
  cls: ClassLetter;
  /** Best time per person, quickest first. */
  entries: LapTime[];
}

const ORDER: Record<TrackVehicle, ClassLetter[]> = {
  car: ['S', 'A', 'B', 'C', 'D'],
  bike: ['S', 'A', 'B', 'C', 'D'],
};

/**
 * The leaderboard for one track and layout: one group per vehicle type and
 * class (cars S to D, then bikes S to D), limited to the
 * vehicle types asked for. Each person appears once per group, with their
 * best time. Rejected times never show.
 */
export function leaderboard(laps: LapTime[], trackId: string, layout: string, kinds: TrackVehicle[] = ['car', 'bike']): LeaderGroup[] {
  const groups = new Map<string, Map<string, LapTime>>();
  for (const l of laps) {
    if (l.trackId !== trackId || l.layout !== layout || l.status === 'rejected' || !kinds.includes(l.kind)) continue;
    const key = `${l.kind}-${l.cls}`;
    const best = groups.get(key) ?? new Map<string, LapTime>();
    const mine = best.get(l.userId);
    if (!mine || l.ms < mine.ms || (l.ms === mine.ms && l.submittedAt < mine.submittedAt)) best.set(l.userId, l);
    groups.set(key, best);
  }
  const out: LeaderGroup[] = [];
  for (const kind of ['car', 'bike'] as TrackVehicle[])
    for (const cls of ORDER[kind]) {
      const g = groups.get(`${kind}-${cls}`);
      if (!g) continue;
      const entries = [...g.values()].sort((a, b) => a.ms - b.ms || a.submittedAt.localeCompare(b.submittedAt));
      out.push({ key: `${kind}-${cls}`, kind, cls, entries });
    }
  return out;
}

/** Layouts anyone has entered times for at this track, most-used first, after the published ones. */
export function layoutsWithTimes(laps: LapTime[], trackId: string, published: string[]): string[] {
  const base = published.length ? published : [MAIN_LAYOUT];
  const extra = [...new Set(laps.filter((l) => l.trackId === trackId && !base.includes(l.layout)).map((l) => l.layout))];
  return [...base, ...extra];
}

/** Kart times were dropped with the kart circuits (Nov 2026): saved ones go, and anything else not a car or bike. */
export function keepLap(l: { kind?: string }): boolean {
  return l.kind === 'car' || l.kind === 'bike';
}

// ---------------------------------------------------------------------------
// Class focus, personal bests and the rival
// ---------------------------------------------------------------------------

/**
 * Compare against similar vehicles, not everything: the groups for the vehicle type and class of
 * your own builds that fit this track. With no builds (or none matching), every group.
 */
export function classFocus(groups: LeaderGroup[], classes: { kind: TrackVehicle; cls: ClassLetter }[]): LeaderGroup[] {
  if (!classes.length) return groups;
  const focused = groups.filter((g) => classes.some((c) => c.kind === g.kind && c.cls === g.cls));
  return focused.length ? focused : groups;
}

/** Your place in a group: "2nd of 5", or null when you're not in it. */
export function placeInGroup(g: LeaderGroup, me: string): { place: number; of: number } | null {
  const i = g.entries.findIndex((l) => l.userId === me);
  return i < 0 ? null : { place: i + 1, of: g.entries.length };
}

const ORDINAL = ['th', 'st', 'nd', 'rd'];
/** 1 -> "1st", 2 -> "2nd", 11 -> "11th". */
export function ordinal(n: number): string {
  const v = n % 100;
  return `${n}${ORDINAL[(v - 20) % 10] ?? ORDINAL[v] ?? ORDINAL[0]}`;
}

export interface BestPoint {
  /** Day, YYYY-MM-DD. */
  on: string;
  ms: number;
  /** The best so far, up to and including this lap. */
  best: number;
  /** True when this lap set a new personal best. */
  isBest: boolean;
}

/**
 * Your times at one track and layout, oldest first, each with the best up to that day, for the
 * personal-best timeline. Rejected times never count; the same day keeps its quickest lap.
 */
export function bestTimeline(laps: LapTime[], trackId: string, layout: string, me: string): BestPoint[] {
  const byDay = new Map<string, number>();
  for (const l of laps) {
    if (l.userId !== me || l.trackId !== trackId || l.layout !== layout || l.status === 'rejected') continue;
    const prev = byDay.get(l.on);
    if (prev === undefined || l.ms < prev) byDay.set(l.on, l.ms);
  }
  let best = Infinity;
  return [...byDay.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([on, ms]) => {
      const isBest = ms < best;
      if (isBest) best = ms;
      return { on, ms, best, isBest };
    });
}

/** A person's best lap at a track and layout. */
export function bestOf(laps: LapTime[], trackId: string, layout: string, userId: string): LapTime | undefined {
  let best: LapTime | undefined;
  for (const l of laps) {
    if (l.userId !== userId || l.trackId !== trackId || l.layout !== layout || l.status === 'rejected') continue;
    if (!best || l.ms < best.ms) best = l;
  }
  return best;
}

/** "+0.412" when behind, "-0.412" when ahead, to the thousandth; minutes only past a minute. */
export function gapText(gapMs: number): string {
  const abs = Math.abs(Math.round(gapMs));
  const body = abs >= 60_000 ? formatLapTime(abs) : `${Math.floor(abs / 1000)}.${String(abs % 1000).padStart(3, '0')}`;
  return `${gapMs > 0 ? '+' : gapMs < 0 ? '-' : ''}${body}`;
}

export interface RivalStanding {
  mine?: LapTime;
  theirs?: LapTime;
  /** My best minus theirs: positive when I'm slower. */
  gapMs?: number;
}

export function rivalStanding(laps: LapTime[], trackId: string, layout: string, me: string, rival: string): RivalStanding {
  const mine = bestOf(laps, trackId, layout, me);
  const theirs = bestOf(laps, trackId, layout, rival);
  return { mine, theirs, ...(mine && theirs ? { gapMs: mine.ms - theirs.ms } : {}) };
}

/**
 * What changed since you last looked: who got quicker on this layout. `seen` is the best times
 * from last time (none the first time, so nothing is announced then).
 */
export function rivalNews(seen: { me?: number; them?: number } | undefined, now: { me?: number; them?: number }, rivalName: string): string[] {
  if (!seen) return [];
  const out: string[] = [];
  if (now.me !== undefined && seen.me !== undefined && now.me < seen.me) out.push(`You went quicker: ${formatLapTime(now.me)} (was ${formatLapTime(seen.me)}).`);
  if (now.them !== undefined && seen.them !== undefined && now.them < seen.them) out.push(`${rivalName} went quicker: ${formatLapTime(now.them)} (was ${formatLapTime(seen.them)}).`);
  return out;
}
