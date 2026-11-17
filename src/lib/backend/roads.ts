import type { SupabaseClient } from '@supabase/supabase-js';
import { NO_ROAD_REP, type ReportSource, type RoadRep, type RoadReport, type RoadReportKind, type RoadVote } from '../roadReports';
import type { RoadsService } from '../roadService';
import { isUuid } from './mapping';
import { isNetworkError, OFFLINE } from './outbox';

/**
 * Road reports on the server (docs/BACKEND.md, "Road reports"): the RPCs in
 * supabase/migrations/20261117170000_road_reports.sql, and Realtime on
 * road_reports (police reports never come through it: RLS keeps them out, so
 * the driving view also re-reads every minute).
 */

export interface RoadReportRow {
  id: string;
  kind: RoadReportKind;
  lat: number;
  lng: number;
  heading: number | null;
  created_at: string;
  expires_at: string;
  confirm_count: number;
  clear_count: number;
  mine: boolean;
  my_vote: RoadVote | null;
}

export interface RoadClosureRow {
  id: string;
  source: string;
  kind: string;
  description: string | null;
  road: string | null;
  direction: string | null;
  full_closure: boolean | null;
  lat: number;
  lng: number;
  path: { lat: number; lng: number }[] | null;
  starts_at: string | null;
  ends_at: string | null;
}

export interface RoadRepRow {
  user_id: string;
  reports_confirmed: number;
  reports_checked: number;
  reported_rep: number;
  checked_rep: number;
}

export function reportFromRow(r: RoadReportRow): RoadReport {
  return {
    id: r.id,
    kind: r.kind,
    at: { lat: r.lat, lng: r.lng },
    heading: r.heading ?? null,
    createdAt: r.created_at,
    expiresAt: r.expires_at,
    status: 'active',
    confirmCount: r.confirm_count ?? 0,
    clearCount: r.clear_count ?? 0,
    mine: !!r.mine,
    myVote: r.my_vote ?? null,
    source: 'user',
  };
}

const SOURCES: ReportSource[] = ['tfl', 'national_highways', 'street_manager'];
/** Open data has no end time sometimes: show it as on for a day from now. */
const OPEN_ENDED_MS = 86_400_000;

/** An open-data closure as a report: a full closure is a Closure, lanes only are Roadworks. */
export function closureFromRow(c: RoadClosureRow, now: Date): RoadReport | null {
  const source = SOURCES.find((s) => s === c.source);
  if (!source || !Number.isFinite(c.lat) || !Number.isFinite(c.lng)) return null;
  const full = c.full_closure !== false;
  return {
    id: `oc:${c.id}`,
    kind: full ? 'closure' : 'roadworks',
    at: { lat: c.lat, lng: c.lng },
    heading: null,
    createdAt: c.starts_at ?? now.toISOString(),
    expiresAt: c.ends_at ?? new Date(now.getTime() + OPEN_ENDED_MS).toISOString(),
    status: 'active',
    confirmCount: 0,
    clearCount: 0,
    mine: false,
    myVote: null,
    source,
    fullClosure: full,
    ...(c.description ? { description: c.description } : {}),
    ...(c.road ? { road: c.road } : {}),
    ...(c.direction ? { direction: c.direction } : {}),
    ...(c.path && c.path.length > 1 ? { path: c.path.map((p) => ({ lat: p.lat, lng: p.lng })) } : {}),
  };
}

export function repFromRow(r: RoadRepRow): RoadRep {
  return {
    reportsConfirmed: r.reports_confirmed ?? 0,
    reportedRep: r.reported_rep ?? 0,
    reportsChecked: r.reports_checked ?? 0,
    checkedRep: r.checked_rep ?? 0,
  };
}

type Result<T> = { data: T | null; error: { message: string } | null };

export function createRemoteRoads(client: SupabaseClient, now: () => Date = () => new Date()): RoadsService {
  async function rpc<T>(name: string, args: Record<string, unknown>): Promise<T> {
    let res: Result<T>;
    try {
      res = (await client.rpc(name, args)) as unknown as Result<T>;
    } catch (e) {
      throw new Error(isNetworkError(e) ? OFFLINE : e instanceof Error ? e.message : String(e));
    }
    if (res.error) throw new Error(isNetworkError(res.error) ? OFFLINE : res.error.message);
    return res.data as T;
  }

  return {
    kind: 'supabase',
    async near(at, radiusMi, context) {
      const [reports, closures] = await Promise.all([
        rpc<RoadReportRow[]>('road_reports_near', { p_lat: at.lat, p_lng: at.lng, p_radius_mi: radiusMi, p_context: context }),
        // Closures are extra: without them the reports still show.
        rpc<RoadClosureRow[]>('road_closures_near', { p_lat: at.lat, p_lng: at.lng, p_radius_mi: radiusMi }).catch(() => [] as RoadClosureRow[]),
      ]);
      const t = now();
      return [
        ...(reports ?? []).map(reportFromRow).filter((r) => context === 'driving' || r.kind !== 'police'),
        ...(closures ?? []).map((c) => closureFromRow(c, t)).filter((r): r is RoadReport => !!r),
      ];
    },
    async report(kind, at, heading, from) {
      const res = await rpc<{ id: string; merged: boolean }>('report_road', {
        p_kind: kind,
        p_lat: at.lat,
        p_lng: at.lng,
        p_heading: heading,
        p_from_lat: from?.lat ?? null,
        p_from_lng: from?.lng ?? null,
      });
      return { id: res.id, merged: !!res.merged };
    },
    async answer(id, vote, from) {
      await rpc('vote_road_report', { p_report_id: id, p_vote: vote, p_lat: from?.lat ?? null, p_lng: from?.lng ?? null });
    },
    async rep(userIds) {
      const ids = Array.from(new Set(userIds.filter(isUuid)));
      const out: Record<string, RoadRep> = {};
      if (ids.length === 0) return out;
      const rows = await rpc<RoadRepRow[]>('road_rep_for', { p_user_ids: ids });
      for (const id of ids) out[id] = NO_ROAD_REP;
      for (const r of rows ?? []) out[r.user_id] = repFromRow(r);
      return out;
    },
    watch(onChange) {
      const channel = client
        .channel(`road-reports:${Math.random().toString(36).slice(2)}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'road_reports' }, () => onChange())
        .subscribe();
      return () => {
        client.removeChannel(channel).catch(() => {});
      };
    },
  };
}
