#!/usr/bin/env python3
"""
Fallback for scripts/fetch-circuits.mjs when the public Overpass API is down:
read every highway=raceway way (and motorsport leisure=track way) from a
Geofabrik extract into the cache in Overpass's JSON shape, marked as covering
the venues listed in VENUES_JSON (an array of track ids). Then run
fetch-circuits.mjs with the same --cache and it won't ask Overpass.

    node --import ./scripts/lib/resolve-ts.mjs scripts/fetch-circuits.mjs --list-venues > /tmp/osm/venues.json
    /tmp/osm-venv/bin/python scripts/circuits-from-pbf.py united-kingdom-latest.osm.pbf /tmp/osm/venues.json /tmp/osm
    node --import ./scripts/lib/resolve-ts.mjs scripts/fetch-circuits.mjs --cache /tmp/osm

Data © OpenStreetMap contributors, ODbL 1.0.
"""

import json
import os
import re
import sys

import osmium

SPORT = re.compile(r'motor|karting|speedway|motocross|rallycross|drag|stock_car|autocross')


def wanted(tags):
    if tags.get('highway') == 'raceway':
        return True
    return tags.get('leisure') == 'track' and bool(SPORT.search(tags.get('sport', '')))


def main(pbf, venues_json, cache):
    venues = json.load(open(venues_json))
    ways = {}
    for o in osmium.FileProcessor(pbf, osmium.osm.WAY):
        if wanted(o.tags):
            ways[o.id] = {'type': 'way', 'id': o.id, 'nodes': [n.ref for n in o.nodes], 'tags': dict(o.tags)}
    need = {n for w in ways.values() for n in w['nodes']}
    locs = {}
    for o in osmium.FileProcessor(pbf, osmium.osm.NODE):
        if o.id in need and o.location.valid():
            locs[o.id] = (o.location.lat, o.location.lon)
    out = []
    for w in ways.values():
        if all(n in locs for n in w['nodes']):
            w['geometry'] = [{'lat': locs[n][0], 'lon': locs[n][1]} for n in w['nodes']]
            out.append(w)
    os.makedirs(cache, exist_ok=True)
    path = os.path.join(cache, 'circuits-pbf.json')
    with open(path, 'w') as f:
        json.dump({'source': 'Geofabrik extract (OpenStreetMap)', 'venues': venues, 'elements': out}, f)
    print(f'{len(out)} raceway and track ways for {len(venues)} venues -> {path}')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2], sys.argv[3])
