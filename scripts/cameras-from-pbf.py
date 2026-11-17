#!/usr/bin/env python3
"""
Fallback for scripts/fetch-cameras.mjs when the public Overpass API is down or
refusing connections: read the same OpenStreetMap data (highway=speed_camera
nodes and type=enforcement relations) from a Geofabrik extract and write it
into the cache in Overpass's JSON shape, one file per region. Then build the
bundled file from the cache without asking Overpass:

    python3 -m venv /tmp/osm-venv && /tmp/osm-venv/bin/pip install osmium
    curl -LO https://download.geofabrik.de/europe/united-kingdom-latest.osm.pbf
    /tmp/osm-venv/bin/python scripts/cameras-from-pbf.py united-kingdom-latest.osm.pbf /tmp/osm
    node --import ./scripts/lib/resolve-ts.mjs scripts/fetch-cameras.mjs --cache /tmp/osm --cached-only

Data © OpenStreetMap contributors, ODbL 1.0. Regions already in the cache are
left alone, so answers from Overpass and from the extract can be mixed.
"""

import json
import os
import sys

import osmium

# Keep in step with REGIONS in scripts/fetch-cameras.mjs (south, west, north, east).
REGIONS = {
    'south-west': (49.8, -6.5, 52.0, -2.5),
    'south-central': (50.5, -2.5, 52.0, -0.5),
    'london-south-east-kent': (50.6, -0.5, 52.0, 1.5),
    'east-anglia': (52.0, -0.5, 53.2, 1.9),
    'midlands': (52.0, -3.2, 53.2, -0.5),
    'wales': (51.3, -5.5, 53.5, -3.2),
    'north-england': (53.2, -3.7, 55.9, 0.2),
    'scotland': (54.6, -5.3, 60.9, -1.5),
    'scottish-islands': (55.5, -7.8, 59.0, -5.3),
    # The UK extract stops at the border, so a box is enough here.
    'northern-ireland': (54.0, -8.2, 55.4, -5.3),
}


def inside(box, lat, lon):
    s, w, n, e = box
    return s <= lat <= n and w <= lon <= e


def main(pbf, cache):
    cameras = {}
    relations = {}
    for o in osmium.FileProcessor(pbf, osmium.osm.NODE | osmium.osm.RELATION):
        if o.is_node():
            if o.tags.get('highway') == 'speed_camera' and o.location.valid():
                cameras[o.id] = {'type': 'node', 'id': o.id, 'lat': o.location.lat, 'lon': o.location.lon, 'tags': dict(o.tags)}
        elif o.is_relation():
            if o.tags.get('type') == 'enforcement' and o.tags.get('enforcement') in ('maxspeed', 'average_speed'):
                relations[o.id] = {
                    'type': 'relation', 'id': o.id, 'tags': dict(o.tags),
                    'members': [{'type': {'n': 'node', 'w': 'way', 'r': 'relation'}[m.type], 'ref': m.ref, 'role': m.role} for m in o.members],
                }
    print(f'{len(cameras)} cameras, {len(relations)} enforcement relations')

    want_nodes = {m['ref'] for r in relations.values() for m in r['members'] if m['type'] == 'node'} - set(cameras)
    want_ways = {m['ref'] for r in relations.values() for m in r['members'] if m['type'] == 'way'}
    member_nodes = {}
    way_refs = {}
    for o in osmium.FileProcessor(pbf, osmium.osm.NODE | osmium.osm.WAY):
        if o.is_node() and o.id in want_nodes and o.location.valid():
            member_nodes[o.id] = {'type': 'node', 'id': o.id, 'lat': o.location.lat, 'lon': o.location.lon, 'tags': dict(o.tags)}
        elif o.is_way() and o.id in want_ways:
            way_refs[o.id] = [n.ref for n in o.nodes]
    need = {n for refs in way_refs.values() for n in refs}
    locs = {}
    if need:
        for o in osmium.FileProcessor(pbf, osmium.osm.NODE):
            if o.id in need and o.location.valid():
                locs[o.id] = (o.location.lat, o.location.lon)
    ways = {
        wid: {'type': 'way', 'id': wid, 'geometry': [{'lat': locs[n][0], 'lon': locs[n][1]} for n in refs if n in locs]}
        for wid, refs in way_refs.items()
    }

    def where(node_id):
        n = cameras.get(node_id) or member_nodes.get(node_id)
        return (n['lat'], n['lon']) if n else None

    os.makedirs(cache, exist_ok=True)
    for name, box in REGIONS.items():
        path = os.path.join(cache, f'cameras-{name}.json')
        if os.path.exists(path):
            print(f'{name}: already cached, left alone')
            continue
        cams = [c for c in cameras.values() if inside(box, c['lat'], c['lon'])]
        rels = []
        for r in relations.values():
            pts = [where(m['ref']) for m in r['members'] if m['type'] == 'node']
            if any(p and inside(box, *p) for p in pts):
                rels.append(r)
        node_ids = {m['ref'] for r in rels for m in r['members'] if m['type'] == 'node'}
        extra = [member_nodes[i] for i in node_ids if i in member_nodes] + [cameras[i] for i in node_ids if i in cameras and cameras[i] not in cams]
        way_ids = {m['ref'] for r in rels for m in r['members'] if m['type'] == 'way'}
        out = {'source': 'Geofabrik extract (OpenStreetMap)', 'elements': cams + rels + extra + [ways[w] for w in way_ids if w in ways]}
        with open(path, 'w') as f:
            json.dump(out, f)
        print(f'{name}: {len(cams)} cameras, {len(rels)} relations')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
