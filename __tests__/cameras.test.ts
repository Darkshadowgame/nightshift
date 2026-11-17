import {
  compassName,
  decodeTile,
  encodeRecord,
  encodeTiles,
  parseDirection,
  parseMaxspeed,
  RECORD_LENGTH,
  tileKey,
  type CameraDataset,
} from '../src/lib/cameraCodec';
import { zonePath, MAX_ZONE_METRES } from '../src/lib/cameraZones';
import { CameraIndex, CAMERA_MAX_SPAN, camerasForView, describeCamera, describeZone, tilesFor, viewBox, zoneMidpoint } from '../src/lib/cameras';
import { encodePolyline } from '../src/lib/polyline';

describe('camera encoding', () => {
  test('each camera is 8 characters and round-trips to about a metre', () => {
    const recs = [
      { at: { lat: 52.63721, lng: 1.29874 }, mph: 30, facing: 45 },
      { at: { lat: 52.00001, lng: 1.99999 } },
      { at: { lat: 51.50735, lng: -0.12776 }, mph: 20, facing: 359 },
    ];
    for (const r of recs) expect(encodeRecord(r)).toHaveLength(RECORD_LENGTH);
    const tiles = encodeTiles(recs);
    expect(Object.keys(tiles).sort()).toEqual(['51_-1', '52_1']);
    const back = Object.entries(tiles).flatMap(([k, s]) => decodeTile(k, s));
    expect(back).toHaveLength(3);
    const norwich = back.find((c) => c.mph === 30)!;
    expect(norwich.at.lat).toBeCloseTo(52.63721, 5);
    expect(norwich.at.lng).toBeCloseTo(1.29874, 5);
    expect(norwich.facing).toBe(48); // 6° steps
    const bare = back.find((c) => c.at.lat === 52.00001)!;
    expect(bare.mph).toBeUndefined();
    expect(bare.facing).toBeUndefined();
    // 359° rounds to north, not off the end.
    expect(back.find((c) => c.mph === 20)!.facing).toBe(0);
    expect(back.map((c) => c.id)).toEqual(expect.arrayContaining(['51_-1:0']));
  });

  test('tile keys west of Greenwich floor correctly', () => {
    expect(tileKey({ lat: 51.5, lng: -0.1 })).toBe('51_-1');
    expect(tileKey({ lat: 51.5, lng: 0.1 })).toBe('51_0');
  });

  test('speed limits from OSM tags, leaving out anything unclear', () => {
    expect(parseMaxspeed('30 mph')).toBe(30);
    expect(parseMaxspeed('70mph')).toBe(70);
    expect(parseMaxspeed('UK:nsl_single')).toBe(60);
    expect(parseMaxspeed('GB:nsl_dual')).toBe(70);
    expect(parseMaxspeed('48')).toBe(30); // km/h, a clean UK limit
    expect(parseMaxspeed('64 km/h')).toBe(40);
    expect(parseMaxspeed('50')).toBeUndefined(); // 50 km/h or a mistagged 50 mph? Unclear.
    expect(parseMaxspeed('signals')).toBeUndefined();
    expect(parseMaxspeed('33 mph')).toBeUndefined();
    expect(parseMaxspeed(undefined)).toBeUndefined();
  });

  test('direction from degrees or compass points only', () => {
    expect(parseDirection('270')).toBe(270);
    expect(parseDirection('NE')).toBe(45);
    expect(parseDirection('ssw')).toBe(202.5);
    expect(parseDirection('forward')).toBeUndefined();
    expect(parseDirection('90-180')).toBeUndefined();
    expect(compassName(44)).toBe('north-east');
    expect(compassName(350)).toBe('north');
  });
});

describe('average-speed zone lines', () => {
  const from = { lat: 52.0, lng: 0.0 };
  const to = { lat: 52.1, lng: 0.0 };
  test('start, cameras in order along the road, end', () => {
    const path = zonePath({ from: [from], to: [to], devices: [{ lat: 52.08, lng: 0.001 }, { lat: 52.03, lng: -0.001 }] })!;
    expect(path.map((p) => p.lat)).toEqual([52, 52.03, 52.08, 52.1]);
  });
  test('two cameras on one gantry are one point; no start or end uses the furthest cameras', () => {
    const path = zonePath({ from: [], to: [], devices: [{ lat: 52.05, lng: 0 }, { lat: 52.0, lng: 0 }, { lat: 52.0001, lng: 0 }, { lat: 52.1, lng: 0 }] })!;
    expect(path).toHaveLength(3);
    expect(path[0].lat).toBe(52);
    expect(path[2].lat).toBe(52.1);
  });
  test('nothing to draw, or an implausibly long zone', () => {
    expect(zonePath({ from: [from], to: [], devices: [] })).toBeNull();
    expect(zonePath({ from: [], to: [], devices: [] })).toBeNull();
    expect(MAX_ZONE_METRES).toBe(250_000);
    expect(zonePath({ from: [from], to: [{ lat: 55, lng: 0 }], devices: [] })).toBeNull();
  });
});

describe('camera layer', () => {
  const recs = [
    { at: { lat: 52.6, lng: 1.29 }, mph: 30 },
    { at: { lat: 52.61, lng: 1.3 }, mph: 40, facing: 90 },
    { at: { lat: 52.9, lng: 1.3 } },
    { at: { lat: 51.5, lng: -0.12 }, mph: 20 },
  ];
  const data: CameraDataset = {
    generated: '2026-11-17',
    count: recs.length,
    regions: ['test'],
    tiles: encodeTiles(recs),
    zones: [[50, 'A11 test zone', encodePolyline([{ lat: 52.55, lng: 1.2 }, { lat: 52.58, lng: 1.25 }, { lat: 52.62, lng: 1.3 }])], [0, '', '']],
  };

  test('tiles are decoded only when they come into view', () => {
    const index = new CameraIndex(data);
    expect(index.decodedTiles).toBe(0);
    const view = camerasForView(index, { lat: 52.6, lng: 1.29 }, 0.1);
    expect(view.tooWide).toBe(false);
    expect(view.cameras.map((c) => c.mph)).toEqual([30, 40]);
    expect(index.decodedTiles).toBe(1);
    expect(view.zones.map((z) => z.name)).toEqual(['A11 test zone']);
  });

  test('nothing when zoomed out past driving distance', () => {
    const index = new CameraIndex(data);
    const view = camerasForView(index, { lat: 52.6, lng: 1.29 }, CAMERA_MAX_SPAN + 0.01);
    expect(view).toEqual({ cameras: [], zones: [], tooWide: true });
    expect(index.decodedTiles).toBe(0);
  });

  test('nearest the middle first, capped', () => {
    const index = new CameraIndex(data);
    const view = camerasForView(index, { lat: 52.611, lng: 1.301 }, 0.5, 1);
    expect(view.cameras).toHaveLength(1);
    expect(view.cameras[0].mph).toBe(40);
  });

  test('find by id and describe as speed-limit information', () => {
    const index = new CameraIndex(data);
    const [c] = camerasForView(index, { lat: 52.61, lng: 1.3 }, 0.02).cameras;
    expect(index.find(c.id)).toEqual(c);
    expect(describeCamera(c)).toBe('Speed camera · 40 mph · faces east');
    expect(describeCamera({ id: 'x', at: c.at })).toBe('Speed camera · limit not recorded');
    const z = index.zones()[0];
    expect(index.zones()).toHaveLength(1); // the empty one is skipped
    expect(describeZone(z)).toMatch(/^Average speed zone · 50 mph · about \d+\.\d mi$/);
    expect(zoneMidpoint(z)).toEqual({ lat: 52.58, lng: 1.25 });
    expect(index.findZone(z.id)).toBe(z);
  });

  test('view box and the tiles under it', () => {
    const b = viewBox({ lat: 52.5, lng: 0 }, 0.5);
    expect(b.north - b.south).toBeCloseTo(0.6);
    expect(b.east - b.west).toBeGreaterThan(0.6);
    expect(tilesFor(b).sort()).toEqual(['52_-1', '52_0']);
  });
});
