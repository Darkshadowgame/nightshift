// Imports UK road closures from open data into public.road_closures, so the
// driving view can warn about them and route around them, and the map's Road
// reports layer can show them (docs/BACKEND.md, "Road reports").
//
//  * TfL (London): ON. GET /Road/all/Street/Disruption needs no key (50
//    requests a minute); TFL_APP_KEY, if set, raises the limit to 500.
//  * National Highways (England's motorways and major A roads): OFF until the
//    owner registers on the Developer Portal and sets NATIONAL_HIGHWAYS_KEY
//    (self-service sign-up, 10 calls a minute per key). The code path is
//    written against the portal's published examples; check it with the first
//    real response.
//  * DfT Street Manager (England local roads) pushes through AWS SNS and needs
//    its own endpoint: not built.
//
// Parsing lives in parse.ts (pure, tested with Jest). All three sources are
// Open Government Licence: the app credits the source on each closure.
//
// Secrets (`npx supabase secrets set ...`, never committed): CRON_SECRET,
// optional TFL_APP_KEY and NATIONAL_HIGHWAYS_KEY. Schedule: every 15 minutes
// from pg_cron (docs/BACKEND.md section 7).
import { adminClient, json, requireCronSecret } from '../_shared/admin.ts';
import { type ClosureRow, parseNationalHighways, parseTflStreets } from './parse.ts';

const DAY_MS = 86_400_000;

async function fetchTfl(key: string | undefined, now: Date): Promise<ClosureRow[]> {
  const params = new URLSearchParams({ startDate: now.toISOString(), endDate: new Date(now.getTime() + DAY_MS).toISOString() });
  if (key) params.set('app_key', key);
  const res = await fetch(`https://api.tfl.gov.uk/Road/all/Street/Disruption?${params}`, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`TfL ${res.status}`);
  return parseTflStreets(await res.json(), now.toISOString());
}

/** One closure type, following the x-next pages (at most 4: the key allows 10 calls a minute). */
async function fetchNhType(key: string, type: 'planned' | 'unplanned', now: Date): Promise<ClosureRow[]> {
  const iso = (d: Date) => d.toISOString().slice(0, 19);
  const params = new URLSearchParams({ closureType: type, startDateTime: iso(now), endDateTime: iso(new Date(now.getTime() + DAY_MS)) });
  if (type === 'unplanned') params.set('startDateTime', iso(new Date(now.getTime() - 6 * 3600_000)));
  let url: string | null = `https://api.data.nationalhighways.co.uk/roads/v2.0/closures?${params}`;
  const rows: ClosureRow[] = [];
  for (let page = 0; url && page < 4; page++) {
    const res: Response = await fetch(url, {
      headers: { 'Ocp-Apim-Subscription-Key': key, 'X-Response-MediaType': 'application/json', Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`National Highways ${type} ${res.status}`);
    rows.push(...parseNationalHighways(await res.json(), now.toISOString()));
    const next = res.headers.get('x-next');
    url = next && next.startsWith('https://api.data.nationalhighways.co.uk/') ? next : null;
  }
  return rows;
}

async function fetchNationalHighways(key: string, now: Date): Promise<ClosureRow[]> {
  const planned = await fetchNhType(key, 'planned', now);
  const unplanned = await fetchNhType(key, 'unplanned', now);
  return [...planned, ...unplanned];
}

Deno.serve(async (req) => {
  const denied = requireCronSecret(req);
  if (denied) return denied;
  const db = adminClient();
  const now = new Date();
  const errors: string[] = [];
  const counts: Record<string, number> = {};

  const sources: { name: ClosureRow['source']; run: () => Promise<ClosureRow[]> }[] = [
    { name: 'tfl', run: () => fetchTfl(Deno.env.get('TFL_APP_KEY') || undefined, now) },
  ];
  const nhKey = Deno.env.get('NATIONAL_HIGHWAYS_KEY');
  if (nhKey) sources.push({ name: 'national_highways', run: () => fetchNationalHighways(nhKey, now) });

  for (const source of sources) {
    let rows: ClosureRow[];
    try {
      rows = await source.run();
    } catch (e) {
      errors.push(String(e));
      continue;
    }
    // One row per source id (a feed can repeat a segment).
    const unique = [...new Map(rows.map((r) => [r.source_id, r])).values()];
    let failed = false;
    for (let i = 0; i < unique.length; i += 500) {
      const { error } = await db.from('road_closures').upsert(unique.slice(i, i + 500), { onConflict: 'source,source_id' });
      if (error) {
        errors.push(`${source.name}: ${error.message}`);
        failed = true;
      }
    }
    counts[source.name] = unique.length;
    // Gone from a complete pull means lifted early: drop it.
    if (!failed) await db.from('road_closures').delete().eq('source', source.name).lt('updated_at', now.toISOString());
  }
  // Closures that ended more than a day ago.
  await db.from('road_closures').delete().lt('ends_at', new Date(now.getTime() - DAY_MS).toISOString());

  return json({ imported: counts, nationalHighways: nhKey ? 'on' : 'off (no NATIONAL_HIGHWAYS_KEY)', errors }, errors.length ? 207 : 200);
});
