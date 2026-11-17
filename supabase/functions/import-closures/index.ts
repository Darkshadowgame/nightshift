// PHASE 2 SKETCH: import UK road closures and roadworks from open data into
// public.road_closures, so the app can warn when a cruise route or drive
// crosses one (docs/research/data-sources.md, section 4).
//
// Sources (all free; credit each one in the app):
//  * TfL Unified API, road disruptions (London). Free key, 500 requests/min.
//    Endpoint below is from the TfL docs as I understand them: CHECK before use.
//  * National Highways Developer Portal, "Road and Lane Closures v2" (England
//    motorways and major A roads). Self-service key, 10 calls/min. The exact
//    endpoint and payload (DATEX II aligned) must be taken from the portal
//    after sign-up, so that part is left as a TODO.
//  * DfT Street Manager (England local roads) PUSHES via AWS SNS to an HTTPS
//    endpoint, so it needs its own small function that verifies SNS
//    signatures. Not sketched here.
//
// Secrets (set with `npx supabase secrets set ...`, never committed):
//   TFL_APP_KEY, NATIONAL_HIGHWAYS_KEY
// Schedule: every 10-15 minutes from pg_cron (docs/BACKEND.md).
import { adminClient, json, requireCronSecret } from '../_shared/admin.ts';

interface ClosureRow {
  source: 'national_highways' | 'street_manager' | 'tfl';
  source_id: string;
  kind: string;
  description: string | null;
  /** EWKT, e.g. "SRID=4326;POINT(-0.12 51.5)". PostGIS parses it into geography. */
  geom: string;
  starts_at: string | null;
  ends_at: string | null;
  updated_at: string;
}

// TfL: GET /Road/all/Disruption. Fields used (check against the live response):
// id, category, severity, comments, startDateTime, endDateTime, point "[lng,lat]".
async function fetchTfl(key: string): Promise<ClosureRow[]> {
  const url = `https://api.tfl.gov.uk/Road/all/Disruption?app_key=${encodeURIComponent(key)}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`TfL ${res.status}`);
  const items = (await res.json()) as Array<Record<string, unknown>>;
  const now = new Date().toISOString();
  return items.flatMap((d) => {
    const point = typeof d.point === 'string' ? (JSON.parse(d.point) as [number, number]) : null;
    if (!point || typeof d.id !== 'string') return [];
    return [{
      source: 'tfl' as const,
      source_id: d.id,
      kind: String(d.category ?? 'disruption'),
      description: typeof d.comments === 'string' ? d.comments.slice(0, 500) : null,
      geom: `SRID=4326;POINT(${point[0]} ${point[1]})`,
      starts_at: typeof d.startDateTime === 'string' ? d.startDateTime : null,
      ends_at: typeof d.endDateTime === 'string' ? d.endDateTime : null,
      updated_at: now,
    }];
  });
}

// National Highways: TODO once the portal key exists. Keep to 10 calls a
// minute per key; one paged pull per run is plenty. Map each closure's
// location (point or line) to EWKT and its planned/actual window to starts_at/ends_at.
function fetchNationalHighways(_key: string): Promise<ClosureRow[]> {
  return Promise.resolve([]);
}

Deno.serve(async (req) => {
  const denied = requireCronSecret(req);
  if (denied) return denied;
  const db = adminClient();
  const rows: ClosureRow[] = [];
  const errors: string[] = [];

  const tflKey = Deno.env.get('TFL_APP_KEY');
  if (tflKey) rows.push(...(await fetchTfl(tflKey).catch((e) => (errors.push(String(e)), []))));
  const nhKey = Deno.env.get('NATIONAL_HIGHWAYS_KEY');
  if (nhKey) rows.push(...(await fetchNationalHighways(nhKey).catch((e) => (errors.push(String(e)), []))));

  for (let i = 0; i < rows.length; i += 500) {
    const { error } = await db.from('road_closures').upsert(rows.slice(i, i + 500), { onConflict: 'source,source_id' });
    if (error) errors.push(error.message);
  }
  // Drop closures that ended more than a day ago.
  await db.from('road_closures').delete().lt('ends_at', new Date(Date.now() - 86_400_000).toISOString());

  return json({ imported: rows.length, errors }, errors.length ? 207 : 200);
});
