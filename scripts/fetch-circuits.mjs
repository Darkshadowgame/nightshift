#!/usr/bin/env node
// Build-time fetch of circuit outlines from OpenStreetMap (Overpass API) into
// the bundled src/data/circuits.ts.
//
//   node --import ./scripts/lib/resolve-ts.mjs scripts/fetch-circuits.mjs [--cache DIR] [--list-venues]
//
// When Overpass is down, scripts/circuits-from-pbf.py fills the cache from a Geofabrik extract.
//
// One batched query for every bundled track (highway=raceway ways, and
// leisure=track ways for motorsport), then src/lib/outline.ts picks each
// venue's main layout: the loop closest to the published length of the main
// layout in src/data/trackInfo.ts, or the longest loop (longest line for hill
// climbs and drag strips).
//
// Data © OpenStreetMap contributors, ODbL 1.0 (https://www.openstreetmap.org/copyright).

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PLACES } from '../src/data/places.ts';
import { TRACK_INFO } from '../src/data/trackInfo.ts';
import { pickOutline } from '../src/lib/outline.ts';
import { encodePolyline, simplify } from '../src/lib/polyline.ts';
import { overpass } from './lib/overpass.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const cacheArg = process.argv.indexOf('--cache');
const cacheDir = cacheArg > 0 ? process.argv[cacheArg + 1] : null;

const tracks = PLACES.filter((p) => p.kind === 'track');
// For scripts/circuits-from-pbf.py: which venues to mark as covered.
if (process.argv.includes('--list-venues')) {
  console.log(JSON.stringify(tracks.map((t) => t.id)));
  process.exit(0);
}

/** Big circuits spread further from their pin than a kart track or a stadium oval. */
const radius = (t) => (t.id.startsWith('tr-') ? 2500 : 1200);

/**
 * Cached answers list the venues they covered, so adding venues later only
 * asks Overpass about the new ones.
 */
function cachedAnswers() {
  if (!cacheDir || !existsSync(cacheDir)) return [];
  return readdirSync(cacheDir)
    .filter((f) => /^circuits.*\.json$/.test(f))
    .map((f) => JSON.parse(readFileSync(join(cacheDir, f), 'utf8')));
}

async function fetchWays() {
  const cached = cachedAnswers();
  const covered = new Set(cached.flatMap((c) => c.venues ?? []));
  const missing = tracks.filter((t) => !covered.has(t.id));
  const answers = [...cached];
  if (missing.length) {
    const parts = missing.flatMap((t) => {
      const around = `around:${radius(t)},${t.at.lat},${t.at.lng}`;
      return [
        `way(${around})["highway"="raceway"];`,
        `way(${around})["leisure"="track"]["sport"~"motor|karting|speedway|motocross|rallycross|drag|stock_car|autocross"];`,
      ];
    });
    const query = `[out:json][timeout:180];\n(\n${parts.join('\n')}\n);\nout geom;`;
    console.log(`Overpass: ${missing.length} venues in one query…`);
    const json = { ...(await overpass(query)), venues: missing.map((t) => t.id) };
    if (cacheDir) {
      mkdirSync(cacheDir, { recursive: true });
      writeFileSync(join(cacheDir, `circuits-${Date.now()}.json`), JSON.stringify(json));
    }
    answers.push(json);
  }
  const byId = new Map();
  for (const a of answers) for (const el of a.elements) byId.set(`${el.type}/${el.id}`, el);
  return { elements: [...byId.values()] };
}

const json = await fetchWays();
const keyOf = (g) => Math.round(g.lat * 1e7) * 1e8 + Math.round(g.lon * 1e7);
const ways = json.elements
  .filter((el) => el.type === 'way' && el.geometry?.length >= 2)
  .map((el) => ({
    id: el.id,
    // OSM node ids when Overpass sends them; otherwise points at the same spot are the same node.
    nodes: el.nodes?.length === el.geometry.length ? el.nodes : el.geometry.map(keyOf),
    geometry: el.geometry.map((g) => ({ lat: g.lat, lng: g.lon })),
    tags: el.tags ?? {},
  }));
console.log(`${ways.length} ways.`);

const outlines = {};
const report = [];
const stadium = (id) => TRACK_INFO[id]?.spectator;
for (const t of tracks) {
  const info = TRACK_INFO[t.id];
  const main = info?.layouts[0];
  const karting = /kart/i.test(t.name) || !!info?.vehicles?.every((v) => v === 'kart');
  const outline = pickOutline(ways, t.at, { targetMetres: main ? main.km * 1000 : undefined, maxMetres: radius(t), karting });
  if (!outline) {
    report.push(`${t.id}: no outline`);
    continue;
  }
  // Leave out guesses: an airfield with many possible loops and no published length to aim
  // for, or a tiny loop at a circuit (usually a kart track next door).
  if (!main && outline.loops > 3) {
    report.push(`${t.id}: skipped, ${outline.loops} possible loops and no published length`);
    continue;
  }
  if (outline.closed && outline.metres < 500 && !karting && !stadium(t.id)) {
    report.push(`${t.id}: skipped, ${outline.metres} m loop is too small for this venue`);
    continue;
  }
  const thin = simplify(outline.path, 3);
  const p = encodePolyline(thin);
  // Two venues next to each other can find the same track: it belongs to the nearer one.
  const other = Object.entries(outlines).find(([, o]) => o.p === p);
  if (other) {
    report.push(`${t.id}: skipped, same outline as ${other[0]}`);
    continue;
  }
  outlines[t.id] = { p, closed: outline.closed, m: outline.metres };
  const vs = main ? ` (published ${Math.round(main.km * 1000)} m, ${(((outline.metres - main.km * 1000) / (main.km * 1000)) * 100).toFixed(1)}%)` : '';
  report.push(`${t.id}: ${outline.closed ? 'loop' : 'line'} ${outline.metres} m${vs}, ${thin.length} points, ${outline.loops} loops`);
}
console.log(report.join('\n'));

const generated = new Date().toISOString().slice(0, 10);
const out = `/* eslint-disable */
// Generated by scripts/fetch-circuits.mjs on ${generated}. Do not edit by hand: run the script again.
//
// Circuit outlines (main layout) from OpenStreetMap highway=raceway and
// motorsport leisure=track ways. © OpenStreetMap contributors, ODbL 1.0:
// https://www.openstreetmap.org/copyright
// p: encoded polyline (src/lib/polyline.ts), closed: a loop (not a hill climb or strip), m: length in metres.

export const CIRCUIT_OUTLINES: Record<string, { p: string; closed: boolean; m: number }> = ${JSON.stringify(outlines, null, 1)};
`;
writeFileSync(join(root, 'src/data/circuits.ts'), out);
console.log(`Wrote src/data/circuits.ts: ${Object.keys(outlines).length} outlines, ${out.length} bytes.`);
