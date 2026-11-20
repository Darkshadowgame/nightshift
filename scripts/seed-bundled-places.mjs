#!/usr/bin/env node
// Slipstream's own drives and photo spots on the server (docs/BACKEND.md, section 7a-4).
//
//   node --import ./scripts/lib/resolve-ts.mjs scripts/seed-bundled-places.mjs            # writes supabase/seed_bundled_places.sql
//   set -a; . ~/.config/homelab-secrets.env; set +a
//   node --import ./scripts/lib/resolve-ts.mjs scripts/seed-bundled-places.mjs --apply    # also runs it on the hosted project
//
// The SQL comes from src/data/places.ts through src/lib/backend/bundledSeed.ts,
// so the app's list and the database's stay in step: run it again after
// changing a bundled drive or photo spot. It is an upsert on spots.bundled_id.
// --apply uses the Management API with SUPABASE_ACCESS_TOKEN and never prints it.

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { PLACES, ROAD_LIMIT_MPH } from '../src/data/places.ts';
import { bundledSeedSql } from '../src/lib/backend/bundledSeed.ts';

const REF = 'vuftzeianmqjboivqmws';
const out = fileURLToPath(new URL('../supabase/seed_bundled_places.sql', import.meta.url));
const sql = bundledSeedSql(PLACES, ROAD_LIMIT_MPH);
writeFileSync(out, sql);
console.log(`Wrote ${out.replace(/.*\/supabase\//, 'supabase/')}`);

if (process.argv.includes('--apply')) {
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  if (!token) throw new Error('SUPABASE_ACCESS_TOKEN is not set (load the secrets file first).');
  const query = async (q) => {
    const res = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ query: q }),
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`Management API ${res.status}: ${text.slice(0, 300)}`);
    return JSON.parse(text);
  };
  await query(sql);
  const counts = await query(
    "select kind::text, count(*)::int as n from public.spots where bundled_id is not null group by kind order by kind",
  );
  console.log('Bundled rows on the hosted project:', counts.map((r) => `${r.kind} ${r.n}`).join(', '));
}
