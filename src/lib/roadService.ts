import { metresBetween, METRES_PER_MILE } from './nav';
import {
  answerProblem,
  applyAnswer,
  DEMO_CONFIRM_MS,
  demoReports,
  isLive,
  newReport,
  NO_ROAD_REP,
  reportProblem,
  reportsFor,
  roadRepFrom,
  ROAD_RULES,
  type ReportContext,
  type RoadRep,
  type RoadReport,
  type RoadReportKind,
  type RoadVote,
} from './roadReports';
import type { LatLng } from './types';

/**
 * Road reports behind one interface, like the Repository: the demo keeps them
 * on the phone (below), signed in they go to the server
 * (src/lib/backend/roads.ts). Every method rejects with a sentence the screen
 * can show as it is.
 */
export interface RoadsService {
  readonly kind: 'local' | 'supabase';
  /** Live reports and open-data closures near a point. Police only for 'driving'. */
  near(at: LatLng, radiusMi: number, context: ReportContext): Promise<RoadReport[]>;
  /** `from`: where the phone is now (compared with the report, never stored). */
  report(kind: RoadReportKind, at: LatLng, heading: number | null, from: LatLng | null): Promise<{ id: string; merged: boolean }>;
  /** "Still there?" `from`: where the phone is now (within a mile of the report). */
  answer(id: string, vote: RoadVote, from: LatLng | null): Promise<void>;
  /** Rep from road reports for these people. */
  rep(userIds: string[]): Promise<Record<string, RoadRep>>;
  /** Something changed near someone (Realtime). Returns the unsubscribe. */
  watch(onChange: () => void): () => void;
}

/** What the demo keeps (AsyncStorage `nightshift.roads.demo`). */
export interface DemoRoadState {
  /** The sample reports, laid out around the home area. */
  samples: RoadReport[];
  /** The home area they were laid out around (a new home lays them out again). */
  samplesAround?: LatLng | null;
  /** Your own reports. */
  mine: RoadReport[];
  /** When each of your reports was confirmed (sample drivers confirm it after a few seconds). */
  confirmedAt: Record<string, string>;
  /** When you answered "Still there?". */
  answeredAt: string[];
}

export const EMPTY_DEMO_ROADS: DemoRoadState = { samples: [], mine: [], confirmedAt: {}, answeredAt: [] };

/**
 * The demo: what the server would do, on the phone. Samples are laid out
 * again around the home area when most of them have run out, or when the home
 * area moves (e.g. set on the first-run screen). Your reports are
 * "confirmed by two sample drivers" 20 s after you send them, so the rep shows.
 */
export function settleDemo(s: DemoRoadState, home: LatLng | null, now: Date): DemoRoadState {
  let next = s;
  const moved = !!home && (!s.samplesAround || metresBetween(home, s.samplesAround) > 3 * METRES_PER_MILE);
  if (home && (moved || s.samples.filter((r) => isLive(r, now)).length < 3)) {
    next = { ...next, samples: demoReports(home, now), samplesAround: home };
  }
  const due = next.mine.filter((r) => r.status === 'active' && !next.confirmedAt[r.id] && now.getTime() - new Date(r.createdAt).getTime() >= DEMO_CONFIRM_MS);
  if (due.length) {
    const confirmedAt = { ...next.confirmedAt };
    const mine = next.mine.map((r) => {
      if (!due.includes(r)) return r;
      confirmedAt[r.id] = now.toISOString();
      let x = r;
      while (x.confirmCount < ROAD_RULES.confirmedAt) x = applyAnswer(x, 'still_there', now, false);
      return x;
    });
    next = { ...next, mine, confirmedAt };
  }
  return next;
}

export interface LocalRoadsOptions {
  get(): DemoRoadState;
  set(s: DemoRoadState): void;
  /** The demo's home area, where the samples go. */
  home(): LatLng | null;
  me: string;
  now?: () => Date;
  /** Demo: skip the GPS check (Me): distance checks are waived. */
  skipGps?: () => boolean;
  /** Let the samples' answers be seen as changes (re-read). */
  changed?: () => void;
}

export function createLocalRoads(o: LocalRoadsOptions): RoadsService {
  const now = () => (o.now ? o.now() : new Date());
  const settled = () => {
    const s = settleDemo(o.get(), o.home(), now());
    if (s !== o.get()) o.set(s);
    return s;
  };
  let seq = 0;
  const id = () => `demo-mine-${now().getTime().toString(36)}-${(seq++).toString(36)}`;

  return {
    kind: 'local',
    async near(at, radiusMi, context) {
      const s = settled();
      const max = Math.min(50, Math.max(0.1, radiusMi)) * METRES_PER_MILE;
      const all = [...s.samples, ...s.mine].filter((r) => metresBetween(at, r.at) <= max);
      return reportsFor(all, context, now(), at).sort((a, b) => metresBetween(at, a.at) - metresBetween(at, b.at));
    },
    async report(kind, at, heading, from) {
      const s = settled();
      const t = now();
      const position = o.skipGps?.() ? at : from;
      const problem = reportProblem(s.mine.map((r) => r.createdAt), at, position, t);
      if (problem) throw new Error(problem);
      const r = newReport(id(), kind, at, heading, t);
      o.set({ ...s, mine: [r, ...s.mine].slice(0, 100) });
      return { id: r.id, merged: false };
    },
    async answer(reportId, vote, from) {
      const s = settled();
      const t = now();
      const r = [...s.samples, ...s.mine].find((x) => x.id === reportId);
      if (!r) throw new Error('That report has gone.');
      const position = o.skipGps?.() ? r.at : from;
      const problem = answerProblem(r, position, t);
      if (problem) throw new Error(problem);
      const updated = applyAnswer(r, vote, t);
      o.set({
        ...s,
        samples: s.samples.map((x) => (x.id === reportId ? updated : x)),
        mine: s.mine.map((x) => (x.id === reportId ? updated : x)),
        answeredAt: [...s.answeredAt, t.toISOString()].slice(-500),
      });
    },
    async rep(userIds) {
      const s = settled();
      const out: Record<string, RoadRep> = {};
      for (const u of userIds) out[u] = u === o.me ? roadRepFrom(Object.values(s.confirmedAt), s.answeredAt) : NO_ROAD_REP;
      return out;
    },
    watch(onChange) {
      // Sample drivers confirm your report a few seconds later: check now and then.
      const t = setInterval(() => {
        const before = o.get();
        const after = settled();
        if (after !== before) onChange();
      }, 5000);
      return () => clearInterval(t);
    },
  };
}
