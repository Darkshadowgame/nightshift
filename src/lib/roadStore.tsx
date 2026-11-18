import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import { supabase } from './backend/client';
import { createRemoteRoads } from './backend/roads';
import { NO_ROAD_REP, reportsFor, type ReportContext, type RoadRep, type RoadReport, type RoadReportKind, type RoadVote } from './roadReports';
import { createLocalRoads, EMPTY_DEMO_ROADS, type DemoRoadState, type RoadsService } from './roadService';
import { useStore } from './store';
import type { LatLng } from './types';

/**
 * Road reports for the screens: the demo's on the phone, or the server's when
 * signed in (roadService.ts). Kept apart from the main store: reports are
 * short-lived, read by area, and only the driving view and the map's Road
 * reports layer use them.
 */

const DEMO_KEY = 'nightshift.roads.demo';

interface Roads {
  service: RoadsService | null;
  /** Bumped when something changed (your report, an answer, Realtime): readers re-read. */
  version: number;
  /** Road-report rep per person (for the rep ledger). */
  rep: Record<string, RoadRep>;
  report(kind: RoadReportKind, at: LatLng, heading: number | null, from: LatLng | null): Promise<{ id: string; merged: boolean }>;
  answer(id: string, vote: RoadVote, from: LatLng | null): Promise<void>;
  /** Demo: "skip the GPS check" is on, so distance checks are waived. */
  skipGps: boolean;
}

const Ctx = createContext<Roads | null>(null);

export function RoadsProvider({ children }: { children: ReactNode }) {
  const store = useStore();
  const { backend, me, ready, users } = store;
  const skipGps = backend === 'local' && store.settings.simulateGps;
  const skipRef = useRef(skipGps);
  skipRef.current = skipGps;
  const home = users.find((u) => u.id === me)?.home ?? null;
  const homeRef = useRef<LatLng | null>(home);
  homeRef.current = home && (home.lat !== 0 || home.lng !== 0) ? home : null;

  const [version, setVersion] = useState(0);
  const bump = useCallback(() => setVersion((v) => v + 1), []);

  // The demo's reports, kept on the phone.
  const demo = useRef<DemoRoadState>(EMPTY_DEMO_ROADS);
  const [demoLoaded, setDemoLoaded] = useState(false);
  useEffect(() => {
    if (backend !== 'local') return;
    let live = true;
    AsyncStorage.getItem(DEMO_KEY)
      .then((raw) => {
        if (live && raw) demo.current = { ...EMPTY_DEMO_ROADS, ...(JSON.parse(raw) as DemoRoadState) };
      })
      .catch(() => {})
      .finally(() => {
        if (!live) return;
        setDemoLoaded(true);
        bump();
      });
    return () => {
      live = false;
    };
  }, [backend, bump]);

  const service = useMemo<RoadsService | null>(() => {
    if (!ready) return null;
    if (backend === 'supabase') return createRemoteRoads(supabase());
    if (!demoLoaded) return null;
    return createLocalRoads({
      get: () => demo.current,
      set: (s) => {
        demo.current = s;
        AsyncStorage.setItem(DEMO_KEY, JSON.stringify(s)).catch(() => {});
      },
      home: () => homeRef.current,
      me,
      skipGps: () => skipRef.current,
    });
  }, [ready, backend, demoLoaded, me]);

  // Live changes near anyone: re-read, at most once a second.
  useEffect(() => {
    if (!service) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const stop = service.watch(() => {
      if (timer) return;
      timer = setTimeout(() => {
        timer = null;
        bump();
      }, 1000);
    });
    return () => {
      if (timer) clearTimeout(timer);
      stop();
    };
  }, [service, bump]);

  // Rep for everyone the app knows (counts only), after each change.
  const [rep, setRep] = useState<Record<string, RoadRep>>({});
  const userIds = users.map((u) => u.id).join(',');
  useEffect(() => {
    if (!service) return;
    let live = true;
    const ids = userIds ? userIds.split(',') : [];
    const t = setTimeout(() => {
      service
        .rep(ids.includes(me) ? ids : [...ids, me])
        .then((r) => {
          if (live) setRep(r);
        })
        .catch(() => {});
    }, 300);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [service, userIds, me, version]);

  const value = useMemo<Roads>(
    () => ({
      service,
      version,
      rep,
      skipGps,
      report: async (kind, at, heading, from) => {
        if (!service) throw new Error('Road reports are still loading. Try again in a moment.');
        const res = await service.report(kind, at, heading, from);
        bump();
        return res;
      },
      answer: async (id, vote, from) => {
        if (!service) throw new Error('Road reports are still loading. Try again in a moment.');
        await service.answer(id, vote, from);
        bump();
      },
    }),
    [service, version, rep, skipGps, bump],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

const NONE: Roads = {
  service: null,
  version: 0,
  rep: {},
  skipGps: false,
  report: async () => {
    throw new Error('Road reports are not available here.');
  },
  answer: async () => {
    throw new Error('Road reports are not available here.');
  },
};

export function useRoads(): Roads {
  return useContext(Ctx) ?? NONE;
}

export function useRoadRep(userId: string): RoadRep {
  return useRoads().rep[userId] ?? NO_ROAD_REP;
}

/** The one empty list a turned-off layer returns (the same array every render, so memos downstream hold). */
const NO_REPORTS: RoadReport[] = [];

/** Snap a centre to about 2 km, so a moving phone doesn't re-read on every fix. */
function areaKey(c: LatLng | null): string {
  return c ? `${Math.round(c.lat / 0.02)}:${Math.round(c.lng / 0.02)}` : '';
}

/**
 * Reports near a point for one screen. `context` 'driving' is only ever passed
 * by the driving view (police reports); everything else is 'map'. Re-reads when
 * the area changes, when anything changes (Realtime, your own reports), every
 * `refreshMs`, and when the app comes back to the front.
 */
export function useRoadReports(opts: { centre: LatLng | null; radiusMi: number; context: ReportContext; enabled: boolean; refreshMs?: number }): {
  reports: RoadReport[];
  error: string | null;
} {
  const { service, version } = useRoads();
  const { centre, radiusMi, context, enabled, refreshMs = 60_000 } = opts;
  const [reports, setReports] = useState<RoadReport[]>(NO_REPORTS);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const centreRef = useRef(centre);
  centreRef.current = centre;
  const key = areaKey(centre);

  useEffect(() => {
    if (!enabled) return;
    const t = setInterval(() => setTick((n) => n + 1), refreshMs);
    const sub = AppState.addEventListener('change', (st) => {
      if (st === 'active') setTick((n) => n + 1);
    });
    return () => {
      clearInterval(t);
      sub.remove();
    };
  }, [enabled, refreshMs]);

  useEffect(() => {
    const at = centreRef.current;
    if (!enabled || !service || !at) {
      // Keep the same empty list: a new [] would re-render the map and redo its pins.
      if (!enabled) setReports((r) => (r.length ? NO_REPORTS : r));
      return;
    }
    let live = true;
    service
      .near(at, radiusMi, context)
      .then((rs) => {
        if (!live) return;
        // The same rule on the phone: police only ever in the driving view.
        setReports(reportsFor(rs, context, new Date(), context === 'driving' ? at : null));
        setError(null);
      })
      .catch((e) => {
        if (live) setError(e instanceof Error ? e.message : "Couldn't load road reports.");
      });
    return () => {
      live = false;
    };
  }, [enabled, service, key, radiusMi, context, version, tick]);

  return { reports: enabled ? reports : NO_REPORTS, error };
}
