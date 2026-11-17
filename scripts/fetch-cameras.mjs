#!/usr/bin/env node
// Build-time fetch of UK fixed speed cameras and average-speed zones from
// OpenStreetMap (Overpass API) into the bundled src/data/cameras.ts.
//
//   node --import ./scripts/lib/resolve-ts.mjs scripts/fetch-cameras.mjs [--cache DIR] [--cached-only]
//
// --cached-only builds the file from the regions already in the cache (no
// network); the file lists which regions it covers.
//
// Data © OpenStreetMap contributors, ODbL 1.0 (https://www.openstreetmap.org/copyright).
// It stays a separate dataset: never merge user reports into it.
//
// Polite by design: one batched query per region, run one after another, with
// a server-side timeout and backoff (scripts/lib/overpass.mjs). --cache keeps
// the raw answers so a rebuild doesn't ask Overpass again.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { encodeTiles, parseDirection, parseMaxspeed } from '../src/lib/cameraCodec.ts';
import { encodePolyline } from '../src/lib/polyline.ts';
import { zonePath } from '../src/lib/cameraZones.ts';
import { overpass } from './lib/overpass.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const cacheArg = process.argv.indexOf('--cache');
const cacheDir = cacheArg > 0 ? process.argv[cacheArg + 1] : null;
const cachedOnly = process.argv.includes('--cached-only');

/** Bounding boxes (south, west, north, east) that cover Great Britain without the Republic of Ireland or the Isle of Man. */
const REGIONS = [
  { name: 'south-west', bbox: [49.8, -6.5, 52.0, -2.5] },
  { name: 'south-central', bbox: [50.5, -2.5, 52.0, -0.5] },
  // East edge short of the French coast (Kent ends at about 1.45° E).
  { name: 'london-south-east-kent', bbox: [50.6, -0.5, 52.0, 1.5] },
  { name: 'east-anglia', bbox: [52.0, -0.5, 53.2, 1.9] },
  { name: 'midlands', bbox: [52.0, -3.2, 53.2, -0.5] },
  { name: 'wales', bbox: [51.3, -5.5, 53.5, -3.2] },
  { name: 'north-england', bbox: [53.2, -3.7, 55.9, 0.2] },
  { name: 'scotland', bbox: [54.6, -5.3, 60.9, -1.5] },
  { name: 'scottish-islands', bbox: [55.5, -7.8, 59.0, -5.3] },
  // Northern Ireland by its boundary, so cameras over the border stay out.
  { name: 'northern-ireland', area: 'GB-NIR' },
];

function query(region) {
  const scope = region.area ? '(area.a)' : '';
  const head = region.area
    ? `[out:json][timeout:120];area["ISO3166-2"="${region.area}"]->.a;`
    : `[out:json][timeout:120][bbox:${region.bbox.join(',')}];`;
  return `${head}
(
  node["highway"="speed_camera"]${scope};
  relation["type"="enforcement"]["enforcement"~"^(maxspeed|average_speed)$"]${scope};
)->.all;
.all out body;
rel.all->.rels;
node(r.rels)->.members;
.members out body;
way(r.rels)->.ways;
.ways out geom;`;
}

async function fetchRegion(region) {
  const file = cacheDir ? join(cacheDir, `cameras-${region.name}.json`) : null;
  if (file && existsSync(file)) return JSON.parse(readFileSync(file, 'utf8'));
  if (cachedOnly) return null;
  console.log(`Overpass: ${region.name}…`);
  const json = await overpass(query(region));
  if (file) {
    mkdirSync(cacheDir, { recursive: true });
    writeFileSync(file, JSON.stringify(json));
  }
  // Be gentle between regions.
  await new Promise((r) => setTimeout(r, 5_000));
  return json;
}

const nodes = new Map();
const relations = new Map();
const ways = new Map();
const covered = [];
for (const region of REGIONS) {
  const json = await fetchRegion(region);
  if (!json) continue;
  covered.push(region.name);
  const [s, w, n, e] = region.bbox ?? [-90, -180, 90, 180];
  for (const el of json.elements) {
    // Cameras outside the region's box (e.g. across the Channel in an older cached answer) stay out.
    if (el.type === 'node' && el.tags?.highway === 'speed_camera' && !(el.lat >= s && el.lat <= n && el.lon >= w && el.lon <= e)) continue;
    if (el.type === 'node') nodes.set(el.id, el);
    else if (el.type === 'relation') relations.set(el.id, el);
    else if (el.type === 'way') ways.set(el.id, el);
  }
}

// Speed limits and facing from enforcement relations fill gaps on their device nodes.
const relSpeed = new Map();
for (const rel of relations.values()) {
  const mph = parseMaxspeed(rel.tags?.maxspeed);
  if (!mph) continue;
  for (const m of rel.members) if (m.type === 'node' && m.role === 'device') relSpeed.set(m.ref, mph);
}

const cameras = [];
const seen = new Set();
for (const n of nodes.values()) {
  if (n.tags?.highway !== 'speed_camera') continue;
  // Same spot mapped twice (e.g. once per carriageway node): keep one per ~5 m.
  const key = `${n.lat.toFixed(4)},${n.lon.toFixed(4)}`;
  if (seen.has(key)) continue;
  seen.add(key);
  const mph = parseMaxspeed(n.tags.maxspeed) ?? relSpeed.get(n.id);
  const facing = parseDirection(n.tags.direction ?? n.tags['camera:direction']);
  cameras.push({ at: { lat: n.lat, lng: n.lon }, ...(mph ? { mph } : {}), ...(facing !== undefined ? { facing } : {}) });
}

const zones = [];
for (const rel of [...relations.values()].sort((a, b) => a.id - b.id)) {
  if (rel.tags?.enforcement !== 'average_speed') continue;
  const point = (m) => {
    if (m.type === 'node') {
      const n = nodes.get(m.ref);
      return n ? [{ lat: n.lat, lng: n.lon }] : [];
    }
    if (m.type === 'way') {
      const w = ways.get(m.ref);
      return w?.geometry ? w.geometry.map((g) => ({ lat: g.lat, lng: g.lon })) : [];
    }
    return [];
  };
  const pick = (role) => rel.members.filter((m) => m.role === role).flatMap(point);
  const path = zonePath({ from: pick('from'), to: pick('to'), devices: pick('device') });
  if (!path) continue;
  const mph = parseMaxspeed(rel.tags.maxspeed) ?? 0;
  const name = (rel.tags.name ?? rel.tags.description ?? '').slice(0, 60);
  zones.push([mph, name, encodePolyline(path)]);
}

const tiles = encodeTiles(cameras);
const generated = new Date().toISOString().slice(0, 10);
const withSpeed = cameras.filter((c) => c.mph).length;
const withFacing = cameras.filter((c) => c.facing !== undefined).length;
const out = `/* eslint-disable */
// Generated by scripts/fetch-cameras.mjs on ${generated}. Do not edit by hand: run the script again.
//
// UK fixed speed cameras (highway=speed_camera) and average-speed zones
// (type=enforcement relations, enforcement=average_speed) from OpenStreetMap.
// © OpenStreetMap contributors, ODbL 1.0: https://www.openstreetmap.org/copyright
// Kept as its own dataset, separate from anything people report in the app.
// Volunteer-mapped: it may be incomplete or out of date.
//
// ${cameras.length} cameras (${withSpeed} with a speed limit, ${withFacing} with a direction), ${zones.length} average-speed zones.
// Regions: ${covered.join(', ')}.
// Encoding: src/lib/cameraCodec.ts (tiles) and src/lib/polyline.ts (zones).

import type { CameraDataset } from '../lib/cameraCodec';

export const CAMERA_DATA: CameraDataset = ${JSON.stringify({ generated, count: cameras.length, regions: covered, tiles, zones })};
`;
writeFileSync(join(root, 'src/data/cameras.ts'), out);
console.log(`Wrote src/data/cameras.ts: ${cameras.length} cameras in ${Object.keys(tiles).length} tiles, ${zones.length} zones, ${out.length} bytes.`);
