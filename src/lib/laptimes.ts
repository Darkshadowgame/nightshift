import { classOf } from './classes';
import type { TrackVehicle } from '../data/trackInfo';
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

/** Karts aren't in the garage: they're grouped as the venue's hire karts or your own. */
export type KartClass = 'Hire' | 'Own';
export const KART_CLASSES: KartClass[] = ['Hire', 'Own'];

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
  /** Cars and bikes: the build that set it. Karts have none. */
  buildId?: string;
  /** What it was set in, as it was then: "VW Golf R", "Hire kart". */
  vehicle: string;
  kind: TrackVehicle;
  /** Cars and bikes: the build's class (S–D) when the time was entered. Karts: Hire or Own. */
  cls: ClassLetter | KartClass;
  /** Stored photo name of the timing sheet or screenshot (plate-blurred, no metadata). */
  proof: string;
  status: LapStatus;
  submittedAt: string;
}

export interface LapDraft {
  trackId: string;
  layout: string;
  on: string;
  /** As typed: "1:23.456" or "58.9". */
  time: string;
  kind: TrackVehicle;
  /** Cars and bikes. */
  buildId?: string;
  /** Karts. */
  kartClass?: KartClass;
  proof?: string;
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
 * Only bundled tracks take times: never a drive, photo spot, venue or anything
 * someone suggested. Spectator stadiums (oval stock cars, speedway) don't run
 * track days, so they take none either.
 */
export function canTimeAt(spot: Spot | undefined, spectatorOnly = false): { ok: true } | { ok: false; reason: string } {
  if (!spot || spot.kind !== 'track' || spot.authorId)
    return { ok: false, reason: 'Times only count at a real circuit, kart track, sprint course or hill climb. Drives and roads are never timed.' };
  if (spectatorOnly) return { ok: false, reason: "This is a spectator venue with no track days, so there are no times to enter." };
  return { ok: true };
}

export const VEHICLE_LABELS: Record<TrackVehicle, string> = { car: 'Cars', bike: 'Bikes', kart: 'Karts' };

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
    spectatorOnly?: boolean;
    builds: Build[];
    me: string;
    now: Date;
    fastestMs?: number | null;
  },
): string | null {
  const where = canTimeAt(ctx.track, ctx.spectatorOnly);
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
  if (d.kind === 'kart') {
    if (!d.kartClass || !KART_CLASSES.includes(d.kartClass)) return 'Say whether it was a hire kart or your own.';
  } else {
    const build = ctx.builds.find((b) => b.id === d.buildId);
    if (!build || build.ownerId !== ctx.me) return `Pick the ${d.kind} from your garage that set the time.`;
    if (build.kind !== d.kind) return `That build is a ${build.kind}, not a ${d.kind}.`;
  }
  if (!d.proof) return 'Add a photo of the timing sheet or timing app screen as proof.';
  return null;
}

/** Turn a checked draft into a saved, unverified time. Throws with the reason if it isn't ready. */
export function makeLap(d: LapDraft, ctx: Parameters<typeof lapProblem>[1], id: string): LapTime {
  const problem = lapProblem(d, ctx);
  if (problem) throw new Error(problem);
  const base = { id, trackId: d.trackId, layout: d.layout, on: d.on, ms: parseLapTime(d.time)!, userId: ctx.me, proof: d.proof! };
  const build = d.kind === 'kart' ? undefined : ctx.builds.find((b) => b.id === d.buildId)!;
  return {
    ...base,
    ...(build
      ? { buildId: build.id, vehicle: buildLabel(build), kind: build.kind, cls: classOf(build) }
      : { vehicle: d.kartClass === 'Own' ? 'Own kart' : 'Hire kart', kind: 'kart' as const, cls: d.kartClass! }),
    status: 'unverified',
    submittedAt: ctx.now.toISOString(),
  };
}

export interface LeaderGroup {
  key: string;
  kind: TrackVehicle;
  cls: ClassLetter | KartClass;
  /** Best time per person, quickest first. */
  entries: LapTime[];
}

const ORDER: Record<TrackVehicle, (ClassLetter | KartClass)[]> = {
  car: ['S', 'A', 'B', 'C', 'D'],
  bike: ['S', 'A', 'B', 'C', 'D'],
  kart: KART_CLASSES,
};

/**
 * The leaderboard for one track and layout: one group per vehicle type and
 * class (cars S to D, bikes S to D, then hire and own karts), limited to the
 * vehicle types asked for. Each person appears once per group, with their
 * best time. Rejected times never show.
 */
export function leaderboard(laps: LapTime[], trackId: string, layout: string, kinds: TrackVehicle[] = ['car', 'bike', 'kart']): LeaderGroup[] {
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
  for (const kind of ['car', 'bike', 'kart'] as TrackVehicle[])
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
