import { CAMERA_DATA } from '../src/data/cameras';
import { decodeTile } from '../src/lib/cameraCodec';
import { CameraIndex, camerasForView, inBox } from '../src/lib/cameras';
import { inUk } from '../src/lib/placeNames';

const all = Object.entries(CAMERA_DATA.tiles).flatMap(([k, s]) => decodeTile(k, s));
const count = (b: { south: number; west: number; north: number; east: number }) => all.filter((c) => inBox(c.at, b)).length;

describe('bundled speed cameras (OpenStreetMap)', () => {
  test('decodes every camera, all in the UK', () => {
    expect(all.length).toBe(CAMERA_DATA.count);
    for (const c of all) expect(inUk(c.at)).toBe(true);
    for (const c of all) if (c.mph) expect(c.mph % 5 === 0 && c.mph >= 5 && c.mph <= 70).toBe(true);
  });

  test('covers each region it lists: East Anglia, London, Kent and the Midlands among them', () => {
    const has = (r: string) => CAMERA_DATA.regions.includes(r);
    if (has('east-anglia')) expect(count({ south: 52.0, west: 0.15, north: 53.0, east: 1.8 })).toBeGreaterThan(30); // Norfolk and Suffolk
    if (has('london-south-east-kent')) {
      expect(count({ south: 51.28, west: -0.51, north: 51.7, east: 0.33 })).toBeGreaterThan(50); // Greater London
      expect(count({ south: 50.9, west: 0.03, north: 51.48, east: 1.45 })).toBeGreaterThan(20); // Kent
    }
    if (has('midlands')) expect(count({ south: 52.3, west: -2.2, north: 52.9, east: -1.3 })).toBeGreaterThan(30); // Birmingham to Tamworth (demo area)
    expect(CAMERA_DATA.regions.length).toBeGreaterThan(0);
  });

  test('average-speed zones decode to lines', () => {
    const index = new CameraIndex(CAMERA_DATA);
    expect(index.zones().length).toBeGreaterThan(3);
    for (const z of index.zones()) {
      expect(z.path.length).toBeGreaterThanOrEqual(2);
      for (const p of z.path) expect(inUk(p)).toBe(true);
    }
    const view = camerasForView(index, { lat: 51.5, lng: -0.12 }, 0.3); // central London
    expect(view.tooWide).toBe(false);
    expect(view.cameras.length).toBeGreaterThan(0);
  });
});
