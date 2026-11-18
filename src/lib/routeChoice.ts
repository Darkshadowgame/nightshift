import { formatDistance, formatDuration, type NavRoute } from './nav';
import { isBlockingClosure, isLive, KIND_INFO, reportsOnRoute, type RoadReport, type RouteReport } from './roadReports';

/**
 * The route preview before you start (src/app/drive.tsx): one route, or up to three from Apple
 * (build 15 on), each with a short label ("Fastest", "via A5") and what it avoids or runs into
 * from drivers' reports and open-data closures. Pure.
 */

export interface RouteOption {
  route: NavRoute;
  /** Apple's name for the route, usually its main road ("A5", "M6 Toll"). Empty when unknown. */
  name: string;
  /** Seconds, Apple's estimate for leaving now (traffic included on build 15 on). */
  time: number;
  /** Metres. */
  distance: number;
  /** Apple's notices (tolls, restrictions). */
  advisories: string[];
  hasTolls?: boolean;
  hasHighways?: boolean;
}

/** Reports that matter when choosing: closures that shut the road, and jams or crashes. */
export type Trouble = 'closure' | 'jam';

export interface RouteTrouble {
  report: RoadReport;
  kind: Trouble;
  along: number;
}

export interface RouteCard {
  index: number;
  /** "Fastest · 18 min", "via A5 · 21 min". */
  title: string;
  /** "Avoids the M6 closure", "Road closed on this route", or null. */
  note: string | null;
  /** The note is good news (avoids something), bad news (runs into it), or neither. */
  tone: 'good' | 'bad' | null;
  fastest: boolean;
  /** "7.2 mi". */
  distance: string;
  troubles: RouteTrouble[];
}

/** The reports on a route that matter for choosing it, in order along it. */
export function troublesOn(route: NavRoute, reports: RoadReport[], now: Date): RouteTrouble[] {
  const on: RouteReport[] = reportsOnRoute(route, reports.filter((r) => isLive(r, now)));
  const out: RouteTrouble[] = [];
  for (const x of on) {
    if (isBlockingClosure(x.report)) out.push({ report: x.report, kind: 'closure', along: x.along });
    else if (x.report.kind === 'traffic' || x.report.kind === 'crash') out.push({ report: x.report, kind: 'jam', along: x.along });
  }
  return out;
}

/** "the M6 closure", "a reported closure", "the A5 traffic", "reported traffic". */
function troubleName(t: RouteTrouble): string {
  const road = t.report.road?.trim();
  if (t.kind === 'closure') return road ? `the ${road} closure` : 'a reported closure';
  const what = t.report.kind === 'crash' ? 'crash' : 'traffic';
  return road ? `the ${road} ${what}` : t.report.kind === 'crash' ? 'a reported crash' : 'reported traffic';
}

/**
 * The cards for the preview: the fastest is "Fastest", the others "via {name}" (or "Route 2").
 * A route that avoids a closure or jam that another option runs into says so; one that runs into
 * a closure says that instead. Closures count before jams.
 */
export function routeCards(options: RouteOption[], reports: RoadReport[], now: Date): RouteCard[] {
  if (options.length === 0) return [];
  const troubles = options.map((o) => troublesOn(o.route, reports, now));
  let fastest = 0;
  options.forEach((o, i) => {
    if (o.time < options[fastest].time) fastest = i;
  });
  const names = options.map((o) => o.name.trim());
  return options.map((o, i) => {
    const mine = troubles[i];
    const ids = new Set(mine.map((t) => t.report.id));
    const others = troubles.flatMap((t, k) => (k === i ? [] : t));
    const closure = mine.find((t) => t.kind === 'closure');
    const avoided = options.length > 1 ? others.filter((t) => !ids.has(t.report.id)).sort((a, b) => (a.kind === b.kind ? 0 : a.kind === 'closure' ? -1 : 1))[0] : undefined;
    let note: string | null = null;
    let tone: RouteCard['tone'] = null;
    if (closure) {
      note = closure.report.road ? `${closure.report.road} closed on this route` : 'Road closed on this route';
      tone = 'bad';
    } else if (avoided) {
      note = `Avoids ${troubleName(avoided)}`;
      tone = 'good';
    } else if (mine.some((t) => t.kind === 'jam')) {
      const jam = mine.find((t) => t.kind === 'jam')!;
      note = `${KIND_INFO[jam.report.kind].label} reported on this route`;
      tone = 'bad';
    } else if (o.hasTolls) {
      note = 'Has tolls';
    }
    // Two routes with the same name are told apart by number.
    const sameName = names[i] && names.filter((n) => n === names[i]).length > 1;
    const label = i === fastest ? 'Fastest' : names[i] && !sameName ? `via ${names[i]}` : `Route ${i + 1}`;
    return {
      index: i,
      title: `${label} · ${formatDuration(o.time)}`,
      note,
      tone,
      fastest: i === fastest,
      distance: formatDistance(o.distance),
      troubles: mine,
    };
  });
}

/** The route picked to start with: the quickest that doesn't run into a closure, else the fastest. */
export function defaultChoice(cards: RouteCard[], options: RouteOption[]): number {
  const open = cards.filter((c) => !c.troubles.some((t) => t.kind === 'closure'));
  const pool = open.length ? open : cards;
  let best = pool[0]?.index ?? 0;
  for (const c of pool) if (options[c.index].time < options[best].time) best = c.index;
  return best;
}

/** One line per report on the chosen route for the preview: "Crash reported · 1.2 mi ahead". */
export function troubleLines(route: NavRoute, reports: RoadReport[], now: Date, max = 3): string[] {
  return reportsOnRoute(route, reports.filter((r) => isLive(r, now)))
    .slice(0, max)
    .map((x) => {
      const what = x.report.kind === 'closure' ? (isBlockingClosure(x.report) ? 'Road closed' : 'Closure reported') : `${KIND_INFO[x.report.kind].label}${x.report.source === 'user' ? ' reported' : ''}`;
      const road = x.report.road ? ` on the ${x.report.road}` : '';
      return `${what}${road} · ${formatDistance(x.along)} along`;
    });
}
