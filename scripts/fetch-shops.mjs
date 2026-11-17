#!/usr/bin/env node
// Build-time fetch of UK car and bike businesses from OpenStreetMap (Overpass
// API) into the bundled src/data/shops.ts, for the map's Shops layer.
//
//   node --import ./scripts/lib/resolve-ts.mjs scripts/fetch-shops.mjs [--cache DIR] [--cached-only]
//
// --cached-only builds the file from the regions already in the cache (no
// network). If Overpass is down, fill the cache from a Geofabrik extract with
// scripts/shops-from-pbf.py first.
//
// What's kept, per business: name, categories, position, and opening hours,
// website, phone and brand only where they're tagged (public business details).
// Categories come from src/lib/shopCategories.ts, the same rules the app uses.
//
// Data © OpenStreetMap contributors, ODbL 1.0 (https://www.openstreetmap.org/copyright).
// It stays a separate dataset: never merge anything people type in the app into it.
//
// Polite by design: one query per region, one after another, with a server-side
// timeout and backoff (scripts/lib/overpass.mjs). --cache keeps the raw answers.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { categoriesFromTags, toMask, CATEGORY_ORDER } from '../src/lib/shopCategories.ts';
import { clean, encodeDataset, packPhone, packWebsite } from '../src/lib/shopCodec.ts';
import { overpass } from './lib/overpass.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const cacheArg = process.argv.indexOf('--cache');
const cacheDir = cacheArg > 0 ? process.argv[cacheArg + 1] : null;
const cachedOnly = process.argv.includes('--cached-only');

/** Keep in step with REGIONS in scripts/shops-from-pbf.py (south, west, north, east). */
const REGIONS = [
  { name: 'south-west', bbox: [49.8, -6.5, 52.0, -2.5] },
  { name: 'south-central', bbox: [50.5, -2.5, 52.0, -0.5] },
  // East edge short of the French coast (Kent ends at about 1.45° E).
  { name: 'london-south-east-kent', bbox: [50.6, -0.5, 52.0, 1.5] },
  { name: 'east-anglia', bbox: [52.0, -0.5, 53.2, 1.9] },
  { name: 'midlands', bbox: [52.0, -3.2, 53.2, -0.5] },
  { name: 'wales', bbox: [51.3, -5.5, 53.5, -3.2] },
  { name: 'north-england', bbox: [53.2, -3.7, 55.9, 0.2] },
  { name: 'scotland', bbox: [54.6, -5.3, 60.9, -0.7] },
  { name: 'scottish-islands', bbox: [55.5, -7.8, 59.0, -5.3] },
  // Northern Ireland by its boundary, so shops over the border stay out.
  { name: 'northern-ireland', area: 'GB-NIR' },
];

const SHOPS = 'car_repair|car_parts|car|motorcycle|motorcycle_repair|motorcycle_parts|tyres|tuning|car_tuning|car_detailing|detailing|car_wash|vehicle_wrap|window_tinting|car_accessories|wheels';
const MEET = 'biker|motorcycl|motorbik|moto\\b|motorist|petrolhead|caffeine|ace caf|truck ?stop|transport caf|drive[- ]?in|route [0-9]|pit ?stop|car ?meet';

function query(region) {
  const scope = region.area ? '(area.a)' : '';
  const head = region.area
    ? `[out:json][timeout:180];area["ISO3166-2"="${region.area}"]->.a;`
    : `[out:json][timeout:180][bbox:${region.bbox.join(',')}];`;
  return `${head}
(
  nw["shop"~"^(${SHOPS})$"]${scope};
  nw["craft"~"^(car_painter|vehicle_wrap|car_repair|window_tinting)$"]${scope};
  nw["amenity"~"^(car_wash|vehicle_inspection)$"]${scope};
  nw["leisure"="dyno"]${scope};
  nw["shop"~"^(clothes|sports|outdoor)$"]["name"~"motorcycl|motorbik|biker|helmet|leathers",i]${scope};
  nw["shop"~"^(clothes|sports|outdoor)$"]["clothes"~"motorcycle",i]${scope};
  nw["amenity"~"^(cafe|restaurant|pub|fast_food)$"]["name"~"${MEET}",i]${scope};
  nw["amenity"~"^(cafe|restaurant|pub|fast_food)$"][~"biker|motorcycle_friendly|motorbike_friendly"~"yes"]${scope};
);
out center tags;`;
}

async function fetchRegion(region) {
  const file = cacheDir ? join(cacheDir, `shops-${region.name}.json`) : null;
  if (file && existsSync(file)) return JSON.parse(readFileSync(file, 'utf8'));
  if (cachedOnly) return null;
  console.log(`Overpass: ${region.name}…`);
  const json = await overpass(query(region));
  if (file) {
    mkdirSync(cacheDir, { recursive: true });
    writeFileSync(file, JSON.stringify(json));
  }
  await new Promise((r) => setTimeout(r, 5_000));
  return json;
}

/** Rough UK bounds, and not the Republic of Ireland or the French coast. */
function inUK(lat, lng) {
  if (lat < 49.8 || lat > 61 || lng < -8.7 || lng > 1.9) return false;
  if (lat < 51.3 && lng > 1.5) return false; // France
  // The Republic of Ireland, south of Northern Ireland (Cornwall and the Scillies are further south).
  if (lng < -5.45 && lat > 51.2 && lat < 54.0) return false;
  return true;
}

const elements = new Map();
const used = [];
for (const region of REGIONS) {
  const json = await fetchRegion(region);
  if (!json) continue;
  used.push(region.name);
  for (const e of json.elements ?? []) elements.set(`${e.type}/${e.id}`, e);
}

const records = [];
const counts = Object.fromEntries(CATEGORY_ORDER.map((c) => [c, 0]));
let unnamed = 0;
let skipped = 0;
for (const e of elements.values()) {
  const lat = e.lat ?? e.center?.lat;
  const lng = e.lon ?? e.center?.lon;
  if (typeof lat !== 'number' || typeof lng !== 'number' || !inUK(lat, lng)) continue;
  const t = e.tags ?? {};
  const cats = categoriesFromTags(t);
  if (!cats.length) {
    skipped++;
    continue;
  }
  const name = clean(t.name || t.brand);
  if (!name) {
    unnamed++;
    continue;
  }
  const brand = clean(t.brand);
  records.push({
    at: { lat, lng },
    mask: toMask(cats),
    name,
    // The brand only when it adds something ("Kwik Fit" named "Kwik Fit" doesn't need it twice).
    ...(brand && !name.toLowerCase().includes(brand.toLowerCase()) ? { brand } : {}),
    ...(t.opening_hours ? { hours: clean(t.opening_hours).slice(0, 200) } : {}),
    ...(packWebsite(t.website || t['contact:website'] || t.url) ? { website: packWebsite(t.website || t['contact:website'] || t.url).slice(0, 120) } : {}),
    ...(packPhone(t.phone || t['contact:phone']) ? { phone: packPhone(t.phone || t['contact:phone']) } : {}),
  });
}

// The same business mapped twice (a point and its building): keep the one with more detail.
function score(r) {
  return (r.hours ? 1 : 0) + (r.website ? 1 : 0) + (r.phone ? 1 : 0);
}
records.sort((a, b) => score(b) - score(a));
const kept = [];
const grid = new Map();
const cell = (p) => `${Math.round(p.lat * 200)}_${Math.round(p.lng * 200)}`;
for (const r of records) {
  const k = cell(r.at);
  const [la, ln] = k.split('_').map(Number);
  let dup = false;
  for (let i = -1; i <= 1 && !dup; i++)
    for (let j = -1; j <= 1 && !dup; j++)
      for (const o of grid.get(`${la + i}_${ln + j}`) ?? [])
        if (o.name.toLowerCase() === r.name.toLowerCase() && Math.abs(o.at.lat - r.at.lat) < 0.0006 && Math.abs(o.at.lng - r.at.lng) < 0.001) {
          o.mask |= r.mask;
          dup = true;
          break;
        }
  if (dup) continue;
  kept.push(r);
  grid.set(k, [...(grid.get(k) ?? []), r]);
}
for (const r of kept) for (const c of CATEGORY_ORDER) if (r.mask & toMask([c])) counts[c]++;

const today = new Date().toISOString().slice(0, 10);
const data = encodeDataset(kept, today, counts);
const summary = CATEGORY_ORDER.map((c) => `${c} ${counts[c]}`).join(', ');
const body = `/* eslint-disable */
// Generated by scripts/fetch-shops.mjs on ${today}. Do not edit by hand: run the script again.
//
// UK car and bike businesses from OpenStreetMap for the map's Shops layer: tuners, parts,
// bike gear, dealers, tyres, detailers, dynos, garages and MOT, and biker/motorist cafés.
// © OpenStreetMap contributors, ODbL 1.0: https://www.openstreetmap.org/copyright
// Kept as its own dataset, separate from anything people type in the app.
// Volunteer-mapped: it may be incomplete or out of date. Only public business details.
//
// ${kept.length} businesses (${summary}).
// Regions: ${used.join(', ')}.
// Encoding: src/lib/shopCodec.ts.

import type { ShopDataset } from '../lib/shopCodec';

export const SHOP_DATA: ShopDataset = ${JSON.stringify(data)};
`;
const out = join(root, 'src/data/shops.ts');
writeFileSync(out, body);
console.log(`${elements.size} features read, ${skipped} not ours, ${unnamed} unnamed, ${records.length - kept.length} duplicates.`);
console.log(`Wrote ${kept.length} shops (${summary}), ${data.dict.length} shared strings, ${Object.keys(data.tiles).length} tiles, ${(body.length / 1024).toFixed(0)} KB.`);
