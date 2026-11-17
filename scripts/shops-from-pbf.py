#!/usr/bin/env python3
"""
Fallback for scripts/fetch-shops.mjs when the public Overpass API is down or
at capacity: read the same OpenStreetMap features (car and bike businesses,
and cafés that might be biker- or motorist-friendly) from a Geofabrik extract
and write them into the cache in Overpass's JSON shape (ways get a `center`,
as with `out center`), one file per region. Then build the bundled file from
the cache without asking Overpass:

    python3 -m venv /tmp/osm-venv && /tmp/osm-venv/bin/pip install osmium
    curl -LO https://download.geofabrik.de/europe/united-kingdom-latest.osm.pbf
    /tmp/osm-venv/bin/python scripts/shops-from-pbf.py united-kingdom-latest.osm.pbf /tmp/osm
    node --import ./scripts/lib/resolve-ts.mjs scripts/fetch-shops.mjs --cache /tmp/osm --cached-only

This only picks candidates. Which category each one lands in (or whether it's
dropped) is decided by src/lib/shopCategories.ts in the Node script, so the app
and the data always agree. Only public business details are kept: name, brand,
opening hours, website and phone where tagged, and the tags the categories need.

Data © OpenStreetMap contributors, ODbL 1.0. Regions already in the cache are
left alone, so answers from Overpass and from the extract can be mixed.
"""

import json
import os
import re
import sys

import osmium
import osmium.filter

# Keep in step with REGIONS in scripts/fetch-shops.mjs (south, west, north, east).
REGIONS = {
    'south-west': (49.8, -6.5, 52.0, -2.5),
    'south-central': (50.5, -2.5, 52.0, -0.5),
    'london-south-east-kent': (50.6, -0.5, 52.0, 1.5),
    'east-anglia': (52.0, -0.5, 53.2, 1.9),
    'midlands': (52.0, -3.2, 53.2, -0.5),
    'wales': (51.3, -5.5, 53.5, -3.2),
    'north-england': (53.2, -3.7, 55.9, 0.2),
    'scotland': (54.6, -5.3, 60.9, -0.7),
    'scottish-islands': (55.5, -7.8, 59.0, -5.3),
    'northern-ireland': (54.0, -8.2, 55.4, -5.3),
}

SHOPS = {
    'car_repair', 'car_parts', 'car', 'motorcycle', 'motorcycle_repair', 'motorcycle_parts', 'tyres', 'tuning',
    'car_tuning', 'car_detailing', 'detailing', 'car_wash', 'vehicle_wrap', 'window_tinting', 'car_accessories', 'wheels',
}
GEAR_SHOPS = {'clothes', 'sports', 'outdoor'}
CRAFTS = {'car_painter', 'vehicle_wrap', 'car_repair', 'window_tinting'}
VEHICLE_AMENITIES = {'car_wash', 'vehicle_inspection'}
FOOD = {'cafe', 'restaurant', 'pub', 'fast_food'}

# A broad first pass for cafés and kit shops; shopCategories.ts makes the real decision.
MEET_HINT = re.compile(r'biker|motorcycl|motorbik|\bmoto\b|motorist|petrolhead|caffeine|ace caf|truck ?stop|transport caf|drive[- ]?in|route \d|pit ?stop|car ?meet', re.I)
GEAR_HINT = re.compile(r'motorcycl|motorbik|biker|helmet|leathers', re.I)

KEEP = re.compile(
    r'^(name|name:en|brand|operator|description|shop|amenity|craft|leisure|clothes|opening_hours|website|contact:website|url|phone|contact:phone|'
    r'car_repair|meeting_point|service:vehicle:.*|motorcycle:.*|biker.*|bikers.*|motorcycle_friendly|motorbike_friendly)$'
)


def wanted(tags):
    shop = tags.get('shop')
    amenity = tags.get('amenity')
    if shop in SHOPS or tags.get('craft') in CRAFTS or amenity in VEHICLE_AMENITIES or tags.get('leisure') == 'dyno':
        return True
    text = ' '.join(tags.get(k, '') for k in ('name', 'brand', 'description'))
    if shop in GEAR_SHOPS:
        return bool(GEAR_HINT.search(text) or GEAR_HINT.search(tags.get('clothes', '')))
    if amenity in FOOD:
        if any(('biker' in k or 'motorcycle' in k or 'motorbike' in k) for k in tags.keys()):
            return True
        return bool(MEET_HINT.search(text) or MEET_HINT.search(tags.get('meeting_point', '')))
    return False


def slim(tags):
    return {k: v for k, v in tags.items() if KEEP.match(k)}


def inside(box, lat, lon):
    s, w, n, e = box
    return s <= lat <= n and w <= lon <= e


def main(pbf, cache):
    keys = osmium.filter.KeyFilter('shop', 'amenity', 'craft', 'leisure')
    found = []
    way_refs = {}
    for o in osmium.FileProcessor(pbf, osmium.osm.NODE | osmium.osm.WAY).with_filter(keys):
        tags = dict(o.tags)
        if not wanted(tags):
            continue
        if o.is_node():
            if o.location.valid():
                found.append({'type': 'node', 'id': o.id, 'lat': o.location.lat, 'lon': o.location.lon, 'tags': slim(tags)})
        elif o.is_way():
            refs = [n.ref for n in o.nodes]
            if refs:
                way_refs[o.id] = (refs, slim(tags))
    print(f'{len(found)} nodes, {len(way_refs)} ways')

    need = {r for refs, _ in way_refs.values() for r in refs}
    locs = {}
    if need:
        for o in osmium.FileProcessor(pbf, osmium.osm.NODE).with_filter(osmium.filter.IdFilter(need)):
            if o.location.valid():
                locs[o.id] = (o.location.lat, o.location.lon)
    for wid, (refs, tags) in way_refs.items():
        pts = [locs[r] for r in dict.fromkeys(refs) if r in locs]
        if not pts:
            continue
        lat = sum(p[0] for p in pts) / len(pts)
        lon = sum(p[1] for p in pts) / len(pts)
        found.append({'type': 'way', 'id': wid, 'center': {'lat': lat, 'lon': lon}, 'tags': tags})

    os.makedirs(cache, exist_ok=True)
    for name, box in REGIONS.items():
        path = os.path.join(cache, f'shops-{name}.json')
        if os.path.exists(path):
            print(f'{name}: already cached, left alone')
            continue
        els = []
        for e in found:
            lat = e['lat'] if 'lat' in e else e['center']['lat']
            lon = e['lon'] if 'lon' in e else e['center']['lon']
            if inside(box, lat, lon):
                els.append(e)
        with open(path, 'w') as f:
            json.dump({'source': 'Geofabrik extract (OpenStreetMap)', 'elements': els}, f)
        print(f'{name}: {len(els)} features')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
