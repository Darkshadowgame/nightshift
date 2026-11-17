#!/usr/bin/env node
// Prints simplified council boundaries for borough-wide ban zones, ready to paste
// into src/data/zoneBoundaries.ts.
//
//   node --import ./scripts/lib/resolve-ts.mjs scripts/fetch-zone-boundaries.mjs E07000171=BASSETLAW E06000042=MILTON_KEYNES
//
// Each argument is a council's GSS code (ref:gss, e.g. E07000171 for Bassetlaw),
// optionally followed by =CONST_NAME, e.g. E07000171=BASSETLAW. The outer ways are joined into
// rings and simplified to about 350 m (src/lib/polyline.ts).
// Pass --file PATH (a GeoJSON Polygon or MultiPolygon in WGS84) to simplify a
// council's own published order map instead; --tolerance METRES sets the simplification
// (use about 60 for a small order area).
//
// Data © OpenStreetMap contributors, ODbL 1.0 (https://www.openstreetmap.org/copyright).

import { readFileSync } from 'node:fs';
import { simplify } from '../src/lib/polyline.ts';
import { overpass } from './lib/overpass.mjs';

const tolArg = process.argv.indexOf('--tolerance');
const TOLERANCE_M = tolArg > 0 ? Number(process.argv[tolArg + 1]) : 350;
const r4 = (n) => Math.round(n * 1e4) / 1e4;
const constName = (s) => s.toUpperCase().replace(/ (DISTRICT|BOROUGH|CITY)$/,'').replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, '');

function printRings(name, rings) {
  console.log(`export const ${constName(name)}: LatLng[][] = [`);
  for (const ring of rings) {
    const s = simplify(ring, TOLERANCE_M);
    if (s.length < 4) continue;
    console.log(`  ring([${s.map((p) => `[${r4(p.lat)},${r4(p.lng)}]`).join(',')}]),`);
  }
  console.log('];');
}

// Join way segments (each a list of points) into closed rings.
function joinRings(ways) {
  const key = (p) => `${p.lat},${p.lng}`;
  const left = ways.map((w) => w.slice());
  const rings = [];
  while (left.length) {
    let ring = left.shift();
    let grown = true;
    while (key(ring[0]) !== key(ring[ring.length - 1]) && grown) {
      grown = false;
      for (let i = 0; i < left.length; i++) {
        const w = left[i];
        const end = key(ring[ring.length - 1]);
        if (key(w[0]) === end) ring = ring.concat(w.slice(1));
        else if (key(w[w.length - 1]) === end) ring = ring.concat(w.slice().reverse().slice(1));
        else continue;
        left.splice(i, 1);
        grown = true;
        break;
      }
    }
    rings.push(ring);
  }
  return rings;
}

const args = process.argv.slice(2).filter((a, i, all) => a !== '--tolerance' && all[i - 1] !== '--tolerance');
const fileArg = args.indexOf('--file');
if (fileArg >= 0) {
  const geo = JSON.parse(readFileSync(args[fileArg + 1], 'utf8'));
  const name = args.find((a, i) => i !== fileArg && i !== fileArg + 1) ?? 'ZONE';
  const polys = [];
  for (const f of geo.features ?? [geo]) {
    const g = f.geometry ?? f;
    if (g.type === 'Polygon') polys.push(g.coordinates[0]);
    if (g.type === 'MultiPolygon') for (const p of g.coordinates) polys.push(p[0]);
  }
  printRings(name, polys.map((r) => r.map(([lng, lat]) => ({ lat, lng }))));
} else {
  for (const arg of args) {
    const [gss, name = gss] = arg.split('=');
    const q = `[out:json][timeout:180];relation["boundary"="administrative"]["ref:gss"="${gss}"];out geom;`;
    const json = await overpass(q);
    const rel = json.elements.find((e) => e.type === 'relation');
    if (!rel) {
      console.error(`No boundary relation with ref:gss ${gss}`);
      continue;
    }
    const ways = rel.members
      .filter((m) => m.type === 'way' && (m.role === 'outer' || m.role === '') && m.geometry)
      .map((m) => m.geometry.map(({ lat, lon }) => ({ lat, lng: lon })));
    console.log(`// ${rel.tags.name} (${gss}): OSM relation ${rel.id}, admin_level ${rel.tags.admin_level}`);
    printRings(name, joinRings(ways));
  }
}
