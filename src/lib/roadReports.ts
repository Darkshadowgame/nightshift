import { angleBetween, bearing, METRES_PER_MILE, METRES_PER_YARD, metresBetween, passesNear, pointAlong, type NavRoute } from './nav';
import { navRepFrom } from './navRep';
import type { LatLng } from './types';

/**
 * Community road reports (Waze-style): what drivers report from the driving
 * view, the "Still there?" answers that keep them honest, and the open-data
 * closures shown with them. Pure: no network, storage or clock of its own.
 * The server (supabase/migrations/20261117170000_road_reports.sql) has the
 * same rules; this file runs them for the demo and decides what the driving
 * view says and when.
 *
 * Police (owner decision, 17 Nov 2026): labelled "Police / speed check", only
 * ever shown in the driving view, 30 minutes and never extended, never on the
 * main map or on event, cruise or meet screens, and rep like every other
 * report. Nothing about speed is ever recorded or rewarded.
 *
 * Rep (owner decision, 19 Nov 2026): +2 for posting a report (10 a day), +10
 * once two other drivers confirm it (5 a day), +2 for answering "Still there?"
 * (10 a day), and -2 when two people clear it within 10 minutes of the report
 * without it ever being confirmed. Road-report rep never goes below 0.
 */

export type RoadReportKind = 'crash' | 'hazard' | 'roadworks' | 'closure' | 'traffic' | 'mobile_camera' | 'police';
export type RoadVote = 'still_there' | 'gone';
/** Where reports are being shown. Only the driving view asks for 'driving'. */
export type ReportContext = 'map' | 'driving';
/** A driver's report, or an imported open-data closure (credited, can't be answered). */
export type ReportSource = 'user' | 'tfl' | 'national_highways' | 'street_manager';

export interface RoadReport {
  id: string;
  kind: RoadReportKind;
  at: LatLng;
  /** Direction of travel when reported (0–359), so the other carriageway isn't warned. */
  heading: number | null;
  createdAt: string;
  expiresAt: string;
  status: 'active' | 'cleared' | 'expired';
  confirmCount: number;
  clearCount: number;
  /** You reported it (you can't answer for your own). */
  mine: boolean;
  myVote: RoadVote | null;
  source: ReportSource;
  /** Open data: what the authority says, the road, the direction, and the line it covers. */
  description?: string;
  road?: string;
  direction?: string;
  path?: LatLng[];
  /** Open data: the whole road is shut (rerouting), not just lanes. */
  fullClosure?: boolean;
  /** Demo bookkeeping: "gone" answers since the last "still there". */
  goneRun?: number;
  /** Demo bookkeeping: when it was cleared (for the wrong-report rule). */
  clearedAt?: string;
}

export interface KindInfo {
  /** On the button and the card. */
  label: string;
  /** Said and shown when one is ahead: "Crash reported ahead". */
  spoken: string;
  /** How long a report lasts, and how far confirmations can stretch it (minutes from the report). */
  ttlMin: number;
  capMin: number;
}

export const KIND_INFO: Record<RoadReportKind, KindInfo> = {
  crash: { label: 'Crash', spoken: 'Crash', ttlMin: 120, capMin: 240 },
  hazard: { label: 'Hazard', spoken: 'Hazard', ttlMin: 120, capMin: 240 },
  roadworks: { label: 'Roadworks', spoken: 'Roadworks', ttlMin: 1440, capMin: 4320 },
  closure: { label: 'Closure', spoken: 'Road closure', ttlMin: 1440, capMin: 4320 },
  traffic: { label: 'Traffic', spoken: 'Traffic', ttlMin: 30, capMin: 90 },
  mobile_camera: { label: 'Mobile camera', spoken: 'Mobile speed camera', ttlMin: 60, capMin: 120 },
  // Never extended: 30 minutes from the report.
  police: { label: 'Police / speed check', spoken: 'Police speed check', ttlMin: 30, capMin: 30 },
};

/** The driving view's report grid, in order. */
export const REPORT_GRID: RoadReportKind[] = ['crash', 'hazard', 'roadworks', 'closure', 'traffic', 'mobile_camera', 'police'];

/** The same numbers as the server. */
export const ROAD_RULES = {
  /** A report must be within this of where you are. */
  reportWithinMiles: 0.5,
  /** Answering "Still there?" needs you within this of the report. */
  answerWithinMiles: 1,
  /** One report every 2 minutes, 30 a day. */
  gapMs: 2 * 60_000,
  perDay: 30,
  /** Confirmations from other drivers that make a report "confirmed" (reporter rep; closures reroute). */
  confirmedAt: 2,
  /** "Gone" answers in a row that clear a report. */
  clearAfterGone: 2,
  reporterRep: 10,
  reporterDailyCap: 5,
  /** Posting a report (merged ones count as an answer instead). */
  postRep: 2,
  postDailyCap: 10,
  /** Taken off when it's cleared this soon after the report, never confirmed. */
  wrongRep: 2,
  wrongWithinMin: 10,
  answerRep: 2,
  answerDailyCap: 10,
  /** Police reports are only ever shown this close, even in the driving view. */
  policeMiles: 10,
  /** The driving view: undo a report for 5 s before it's sent; "Still there?" goes after 8 s. */
  undoMs: 5000,
  promptMs: 8000,
} as const;

// ---------------------------------------------------------------------------
// What's shown where
// ---------------------------------------------------------------------------

/** Still on: active and not past its time. */
export function isLive(r: RoadReport, now: Date): boolean {
  return r.status === 'active' && new Date(r.expiresAt).getTime() > now.getTime();
}

/**
 * The reports for a screen: live ones only, and police only for the driving
 * view (within 10 miles of `from` when given). Every other screen passes 'map'.
 */
export function reportsFor(reports: RoadReport[], context: ReportContext, now: Date, from?: LatLng | null): RoadReport[] {
  return reports.filter((r) => {
    if (!isLive(r, now)) return false;
    if (r.kind !== 'police') return true;
    if (context !== 'driving') return false;
    return !from || metresBetween(from, r.at) <= ROAD_RULES.policeMiles * METRES_PER_MILE;
  });
}

/** "just now", "12 min ago", "3 h ago", "2 days ago". */
export function reportAge(createdAt: string, now: Date): string {
  const min = Math.floor((now.getTime() - new Date(createdAt).getTime()) / 60_000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min} min ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.floor(h / 24);
  return d === 1 ? '1 day ago' : `${d} days ago`;
}

/** Credit for open data, shown on the card. */
export function sourceCredit(r: RoadReport): string | null {
  switch (r.source) {
    case 'tfl':
      return 'Powered by TfL Open Data';
    case 'national_highways':
      return 'National Highways, Open Government Licence';
    case 'street_manager':
      return 'DfT Street Manager, Open Government Licence';
    default:
      return null;
  }
}

/** "Confirmed by 2 drivers", "Reported, not confirmed yet". */
export function confirmations(r: RoadReport): string {
  if (r.source !== 'user') return sourceCredit(r) ?? '';
  if (r.confirmCount === 0) return 'Not confirmed yet';
  return r.confirmCount === 1 ? 'Confirmed by 1 driver' : `Confirmed by ${r.confirmCount} drivers`;
}

// ---------------------------------------------------------------------------
// The rules (the demo runs them; the server runs the same)
// ---------------------------------------------------------------------------

/** Points are kept to 4 decimal places (about 10 m). */
export function snapPoint(at: LatLng): LatLng {
  return { lat: Math.round(at.lat * 1e4) / 1e4, lng: Math.round(at.lng * 1e4) / 1e4 };
}

export function inUk(at: LatLng): boolean {
  return at.lat >= 49.8 && at.lat <= 61 && at.lng >= -8.7 && at.lng <= 2;
}

/** Why you can't report this now, or null. `mine`: the times of your own reports. */
export function reportProblem(mine: string[], at: LatLng, from: LatLng | null, now: Date): string | null {
  if (!inUk(at)) return 'Reports are for UK roads only.';
  if (!from) return 'Reporting needs your current location.';
  if (metresBetween(from, at) > ROAD_RULES.reportWithinMiles * METRES_PER_MILE) return 'You can only report within half a mile of where you are.';
  const t = now.getTime();
  const times = mine.map((x) => new Date(x).getTime());
  if (times.some((x) => t - x < ROAD_RULES.gapMs)) return "You've just sent a report. Try again in a couple of minutes.";
  if (times.filter((x) => t - x < 86_400_000).length >= ROAD_RULES.perDay) return "That's the most reports for one day. Thanks for helping.";
  return null;
}

/** Why you can't answer "Still there?" for this one, or null. */
export function answerProblem(r: RoadReport, from: LatLng | null, now: Date): string | null {
  if (r.source !== 'user') return 'Closures from open data end on their own.';
  if (r.status === 'cleared') return 'That report has already been cleared.';
  if (!isLive(r, now)) return 'That report has already expired.';
  if (r.mine) return "You can't confirm your own report.";
  if (r.myVote) return "You've already answered for this one.";
  if (!from) return 'Answering needs your current location.';
  if (metresBetween(from, r.at) > ROAD_RULES.answerWithinMiles * METRES_PER_MILE) return 'You need to be within a mile of the report to answer.';
  return null;
}

/** A new report (the demo's; the server makes its own). */
export function newReport(id: string, kind: RoadReportKind, at: LatLng, heading: number | null, now: Date): RoadReport {
  return {
    id,
    kind,
    at: snapPoint(at),
    heading: heading == null || heading < 0 ? null : Math.round(heading) % 360,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + KIND_INFO[kind].ttlMin * 60_000).toISOString(),
    status: 'active',
    confirmCount: 0,
    clearCount: 0,
    mine: true,
    myVote: null,
    source: 'user',
  };
}

/** "Still there" gives it its usual time again from now, never past the cap (police: never extended). */
export function extendedExpiry(r: Pick<RoadReport, 'kind' | 'createdAt' | 'expiresAt'>, now: Date): string {
  const info = KIND_INFO[r.kind];
  const cap = new Date(r.createdAt).getTime() + info.capMin * 60_000;
  const wanted = Math.max(new Date(r.expiresAt).getTime(), now.getTime() + info.ttlMin * 60_000);
  return new Date(Math.min(cap, wanted)).toISOString();
}

/** An answer from someone (you, or in the demo a sample driver): counts, expiry, clearing. */
export function applyAnswer(r: RoadReport, vote: RoadVote, now: Date, mine = true): RoadReport {
  const myVote = mine ? vote : r.myVote;
  if (vote === 'still_there') {
    return { ...r, myVote, confirmCount: r.confirmCount + 1, goneRun: 0, expiresAt: extendedExpiry(r, now) };
  }
  const goneRun = (r.goneRun ?? 0) + 1;
  const cleared = goneRun >= ROAD_RULES.clearAfterGone && r.status !== 'cleared';
  return {
    ...r,
    myVote,
    clearCount: r.clearCount + 1,
    goneRun,
    status: cleared ? 'cleared' : r.status,
    ...(cleared ? { clearedAt: now.toISOString() } : {}),
  };
}

/** Cleared as wrong: two or more cleared it within 10 minutes of the report, and nobody had confirmed it. */
export function clearedAsWrong(r: Pick<RoadReport, 'status' | 'createdAt' | 'clearedAt' | 'clearCount' | 'confirmCount'>): boolean {
  if (r.status !== 'cleared' || !r.clearedAt || r.clearCount < ROAD_RULES.clearAfterGone) return false;
  if (r.confirmCount >= ROAD_RULES.confirmedAt) return false;
  return new Date(r.clearedAt).getTime() - new Date(r.createdAt).getTime() <= ROAD_RULES.wrongWithinMin * 60_000;
}

// ---------------------------------------------------------------------------
// Rep
// ---------------------------------------------------------------------------

export interface RoadRep {
  /** Your reports two other drivers confirmed, and the rep they paid. */
  reportsConfirmed: number;
  reportedRep: number;
  /** "Still there?" answers, and the rep they paid. */
  reportsChecked: number;
  checkedRep: number;
  /** Reports you posted (+2 each, 10 a day). Older servers don't send these: 0. */
  reportsPosted?: number;
  postedRep?: number;
  /** Your reports cleared as wrong, and the rep they took (0 or less). */
  reportsWrong?: number;
  wrongRep?: number;
  /** Finished in-app navigations (navRep.ts) and their rep. */
  navigations?: number;
  navigationRep?: number;
  /** The demo's own ledger (simulated drives): labelled so. */
  demo?: boolean;
}

export const NO_ROAD_REP: RoadRep = { reportsConfirmed: 0, reportedRep: 0, reportsChecked: 0, checkedRep: 0 };

/** Day key for the daily caps (the phone's local day; the server uses Europe/London). */
const dayOf = (iso: string) => iso.slice(0, 10);

/** Rep for times under a daily cap: `each` for the first `cap` a day. */
function cappedRep(times: string[], cap: number, each: number): number {
  const perDay = new Map<string, number>();
  let rep = 0;
  for (const t of [...times].sort()) {
    const n = perDay.get(dayOf(t)) ?? 0;
    if (n < cap) rep += each;
    perDay.set(dayOf(t), n + 1);
  }
  return rep;
}

/**
 * Rep from road reports, as the server pays it: +10 per report of yours that
 * two others confirmed (5 a day), +2 per answer (10 a day), +2 per report
 * posted (10 a day), -2 per report cleared as wrong. `confirmedAt`: when each
 * of your reports was confirmed; `answeredAt`: when you answered. Navigation
 * rides along (the demo keeps both in one place).
 */
export function roadRepFrom(
  confirmedAt: string[],
  answeredAt: string[],
  more: { postedAt?: string[]; wrongAt?: string[]; navigatedAt?: string[]; demo?: boolean } = {},
): RoadRep {
  const posted = more.postedAt ?? [];
  const wrong = more.wrongAt ?? [];
  const nav = navRepFrom(more.navigatedAt ?? []);
  return {
    reportsConfirmed: confirmedAt.length,
    reportedRep: cappedRep(confirmedAt, ROAD_RULES.reporterDailyCap, ROAD_RULES.reporterRep),
    reportsChecked: answeredAt.length,
    checkedRep: cappedRep(answeredAt, ROAD_RULES.answerDailyCap, ROAD_RULES.answerRep),
    reportsPosted: posted.length,
    postedRep: cappedRep(posted, ROAD_RULES.postDailyCap, ROAD_RULES.postRep),
    reportsWrong: wrong.length,
    wrongRep: wrong.length ? -wrong.length * ROAD_RULES.wrongRep : 0,
    navigations: nav.navigations,
    navigationRep: nav.navigationRep,
    ...(more.demo ? { demo: true } : {}),
  };
}

/** Rep a new report pays for posting it now: 2, or 0 once 10 have paid today. `postedAt`: your earlier reports. */
export function postRepNow(postedAt: string[], now: Date): number {
  const today = dayOf(now.toISOString());
  return postedAt.filter((t) => dayOf(t) === today).length >= ROAD_RULES.postDailyCap ? 0 : ROAD_RULES.postRep;
}

/** The "Road reports" line: posting, confirmations and wrong ones together, never below 0. */
export function roadReportsLine(r: RoadRep): { count: number; rep: number } {
  return {
    count: Math.max(r.reportsPosted ?? 0, r.reportsConfirmed),
    rep: Math.max(0, (r.postedRep ?? 0) + r.reportedRep + (r.wrongRep ?? 0)),
  };
}

// ---------------------------------------------------------------------------
// The driving view: what's on the route, alerts ahead, "Still there?"
// ---------------------------------------------------------------------------

/** Reports count as on the route within this many metres of it. */
export const REPORT_CORRIDOR_METRES = 40;
/** Alerts start this far ahead: about three quarters of a mile. */
export const REPORT_ALERT_METRES = 1200;
/** "Still there?" is asked once you're this far past a report (and not later than PROMPT_UNTIL). */
export const PROMPT_FROM_METRES = 25;
export const PROMPT_UNTIL_METRES = 400;

export interface RouteReport {
  report: RoadReport;
  /** Metres from the start of the route to the report (its first point, for a closed stretch). */
  along: number;
}

/** The points that stand for a report: the closed stretch for open data, else the report. */
export function reportPoints(r: RoadReport): LatLng[] {
  if (!r.path || r.path.length === 0) return [r.at];
  if (r.path.length <= 12) return r.path;
  const step = (r.path.length - 1) / 11;
  return Array.from({ length: 12 }, (_, i) => r.path![Math.round(i * step)]);
}

/**
 * Reports on the route, in order. A report made heading the other way (more
 * than 100° off the route there) is on the other carriageway and left out.
 */
export function reportsOnRoute(route: NavRoute, reports: RoadReport[], corridor = REPORT_CORRIDOR_METRES): RouteReport[] {
  if (route.coords.length < 2) return [];
  const out: RouteReport[] = [];
  for (const r of reports) {
    let first: number | null = null;
    for (const p of reportPoints(r)) {
      for (const pass of passesNear(route, p, corridor)) {
        if (r.heading != null && angleBetween(r.heading, pass.bearing) > 100) continue;
        if (first === null || pass.along < first) first = pass.along;
      }
    }
    if (first !== null) out.push({ report: r, along: first });
  }
  return out.sort((a, b) => a.along - b.along);
}

/** The next report ahead within alert range that hasn't been announced yet. */
export function reportAlertDue(onRoute: RouteReport[], along: number, announced: ReadonlySet<string>, range = REPORT_ALERT_METRES): RouteReport | null {
  return onRoute.find((x) => x.along > along && x.along - along <= range && !announced.has(x.report.id)) ?? null;
}

/** "half a mile", "a quarter of a mile", "300 yards", "1 mile". */
export function roughDistance(metres: number): string {
  const mi = metres / METRES_PER_MILE;
  if (mi >= 0.9 && mi < 1.15) return '1 mile';
  if (mi >= 1.15) return `${Math.round(mi * 2) / 2} miles`;
  if (mi >= 0.6) return 'three quarters of a mile';
  if (mi >= 0.4) return 'half a mile';
  if (mi >= 0.2) return 'a quarter of a mile';
  return `${Math.max(50, Math.round(metres / METRES_PER_YARD / 50) * 50)} yards`;
}

/** What to say and show for a report ahead: "Crash reported ahead, half a mile". */
export function alertText(x: RouteReport, along: number): { spoken: string; banner: string } {
  const d = Math.max(0, x.along - along);
  const what = KIND_INFO[x.report.kind].spoken;
  const verb = x.report.source === 'user' ? 'reported ahead' : 'ahead';
  const mi = d / METRES_PER_MILE;
  const short = mi < 0.1 ? `${Math.max(10, Math.round(d / METRES_PER_YARD / 10) * 10)} YD` : `${mi.toFixed(1)} MI`;
  return { spoken: `${what} ${verb}, ${roughDistance(d)}`, banner: `${what.toUpperCase()} ${verb.toUpperCase()} · ${short}` };
}

/**
 * The report to ask "Still there?" about: a driver's report (not yours, not
 * answered, not asked before) that you've just driven past.
 */
export function stillTherePrompt(onRoute: RouteReport[], along: number, asked: ReadonlySet<string>, now: Date): RoadReport | null {
  for (const x of onRoute) {
    const past = along - x.along;
    if (past < PROMPT_FROM_METRES || past > PROMPT_UNTIL_METRES) continue;
    const r = x.report;
    if (r.source !== 'user' || r.mine || r.myVote || asked.has(r.id) || !isLive(r, now)) continue;
    return r;
  }
  return null;
}

/** "Crash still there?" */
export function promptText(r: RoadReport): string {
  return r.kind === 'police' ? 'Police check still there?' : `${KIND_INFO[r.kind].label} still there?`;
}

// ---------------------------------------------------------------------------
// Closures and rerouting
// ---------------------------------------------------------------------------

export const ROAD_CLOSED_WARNING = 'Road closed ahead — follow diversion signs';
export const ROAD_CLOSED_SPOKEN = 'Road closed ahead. Follow diversion signs.';
/** A new route must keep at least this far from the closure. */
export const CLOSURE_CLEARANCE_METRES = 100;

/** A closure that should change the route: a driver's closure confirmed by 2 others, or an open-data full closure. */
export function isBlockingClosure(r: RoadReport): boolean {
  if (r.kind !== 'closure' || r.status !== 'active') return false;
  return r.source === 'user' ? r.confirmCount >= ROAD_RULES.confirmedAt : r.fullClosure !== false;
}

/** The first blocking closure ahead on the route, before `until` (the end of this leg). */
export function closureAhead(onRoute: RouteReport[], along: number, until: number, now: Date): RouteReport | null {
  return onRoute.find((x) => x.along > along + 30 && x.along <= until && isBlockingClosure(x.report) && isLive(x.report, now)) ?? null;
}

/** Shortest distance from a point to a line of points, in metres (flat projection, fine over a few km). */
function distanceToLine(p: LatLng, line: LatLng[]): number {
  if (line.length === 0) return Infinity;
  if (line.length === 1) return metresBetween(p, line[0]);
  const k = Math.cos((p.lat * Math.PI) / 180);
  let best = Infinity;
  for (let i = 0; i < line.length - 1; i++) {
    const a = line[i], b = line[i + 1];
    const ax = a.lng * k, ay = a.lat, bx = b.lng * k, by = b.lat, px = p.lng * k, py = p.lat;
    const dx = bx - ax, dy = by - ay;
    const len2 = dx * dx + dy * dy;
    const t = len2 > 0 ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2)) : 0;
    best = Math.min(best, metresBetween(p, { lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t }));
  }
  return best;
}

/** True when the route never comes within `clearance` metres of the closure. */
export function routeAvoids(coords: LatLng[], closure: RoadReport, clearance = CLOSURE_CLEARANCE_METRES): boolean {
  return reportPoints(closure).every((p) => distanceToLine(p, coords) > clearance);
}

/** The point `metres` from `at` towards `bearingDeg`. */
export function offsetPoint(at: LatLng, bearingDeg: number, metres: number): LatLng {
  const R = 6371008.8;
  const d = metres / R;
  const b = (bearingDeg * Math.PI) / 180;
  const lat1 = (at.lat * Math.PI) / 180;
  const lng1 = (at.lng * Math.PI) / 180;
  const lat2 = Math.asin(Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(b));
  const lng2 = lng1 + Math.atan2(Math.sin(b) * Math.sin(d) * Math.cos(lat1), Math.cos(d) - Math.sin(lat1) * Math.sin(lat2));
  return { lat: (lat2 * 180) / Math.PI, lng: (lng2 * 180) / Math.PI };
}

/**
 * Detour points to try, in order: to the left and right of the closure,
 * square to the road, near first and then further out. MapKit can't be told
 * to avoid a road, so the driving view routes through each in turn and keeps
 * the first route that stays 100 m clear (routeAvoids()).
 */
export function detourCandidates(route: NavRoute, closureAlong: number, offsets: number[] = [500, 1000, 1800]): LatLng[] {
  const here = pointAlong(route, closureAlong);
  // The road's direction over the stretch either side of the closure, not just one segment.
  const before = pointAlong(route, Math.max(0, closureAlong - 150)).at;
  const after = pointAlong(route, Math.min(route.length, closureAlong + 150)).at;
  const dir = metresBetween(before, after) > 20 ? bearing(before, after) : here.bearing;
  const out: LatLng[] = [];
  for (const d of offsets) {
    out.push(offsetPoint(here.at, (dir + 270) % 360, d));
    out.push(offsetPoint(here.at, (dir + 90) % 360, d));
  }
  return out;
}

/** A detour point the route goes through, until you reach it. */
export interface Via {
  /** The closure it avoids. */
  closureId: string;
  at: LatLng;
}

/** You're at the detour point: it's done. */
export const VIA_REACHED_METRES = 250;

/**
 * Route points with detour points put in before the next stop. A leg that ends
 * at a detour point has -1 in `legStops` (no stop, nothing said on arrival).
 */
export function withVias(points: LatLng[], legStops: number[], vias: LatLng[]): { points: LatLng[]; legStops: number[] } {
  if (vias.length === 0 || points.length < 2) return { points, legStops };
  return { points: [points[0], ...vias, ...points.slice(1)], legStops: [...vias.map(() => -1), ...legStops] };
}

/** Arriving at a detour point isn't a thing to say: drop those steps. */
export function dropViaArrivals(route: NavRoute, legStops: number[]): NavRoute {
  return { ...route, steps: route.steps.filter((s) => !(s.kind === 'arrive' && legStops[s.leg] === -1)) };
}

// ---------------------------------------------------------------------------
// The demo's sample reports
// ---------------------------------------------------------------------------

/**
 * A handful of reports around a point (the demo's home area), so the map layer
 * and the driving view can be tried without an account. Made-up, and labelled
 * as samples on the card.
 */
export function demoReports(home: LatLng, now: Date): RoadReport[] {
  const t = now.getTime();
  const near = (north: number, east: number) => ({ lat: home.lat + north / 69, lng: home.lng + east / (69 * Math.cos((home.lat * Math.PI) / 180)) });
  const make = (n: number, kind: RoadReportKind, at: LatLng, minAgo: number, confirms: number): RoadReport => {
    const createdAt = new Date(t - minAgo * 60_000).toISOString();
    let r: RoadReport = {
      id: `demo-rr-${n}`, kind, at: snapPoint(at), heading: null, createdAt,
      expiresAt: new Date(t - minAgo * 60_000 + KIND_INFO[kind].ttlMin * 60_000).toISOString(),
      status: 'active', confirmCount: 0, clearCount: 0, mine: false, myVote: null, source: 'user',
    };
    for (let i = 0; i < confirms; i++) r = applyAnswer(r, 'still_there', new Date(t - Math.max(0, minAgo - 2 - i) * 60_000), false);
    return r;
  };
  return [
    make(1, 'crash', near(0.6, 0.1), 12, 1),
    make(2, 'roadworks', near(0.2, 1.5), 300, 3),
    make(3, 'hazard', near(-0.1, -0.9), 25, 0),
    make(4, 'traffic', near(-2.2, 0.2), 8, 1),
    make(5, 'mobile_camera', near(0.8, 0.9), 20, 1),
    make(6, 'closure', near(1.3, -1.2), 40, 2),
    make(7, 'police', near(-0.6, 0.6), 6, 0),
  ];
}

/** Demo: your own report counts as confirmed by two sample drivers this long after you send it. */
export const DEMO_CONFIRM_MS = 20_000;
