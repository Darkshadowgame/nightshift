import { BAN_ZONES } from '../src/data/banZones';
import { PLACES } from '../src/data/places';
import { bundledSpots } from '../src/lib/placeStore';
import { inZone, pointInPolygon, zoneInfo, zoneKind, zonesAt, zoneShapes } from '../src/lib/zones';
import type { BanZone } from '../src/lib/types';

const byId = (id: string) => BAN_ZONES.find((z) => z.id === id)!;
const ids = (p: { lat: number; lng: number }) => zonesAt(p, BAN_ZONES).map((z) => z.id);

describe('zone shapes', () => {
  test('point in polygon', () => {
    const square = [{ lat: 0, lng: 0 }, { lat: 0, lng: 1 }, { lat: 1, lng: 1 }, { lat: 1, lng: 0 }];
    expect(pointInPolygon({ lat: 0.5, lng: 0.5 }, square)).toBe(true);
    expect(pointInPolygon({ lat: 1.5, lng: 0.5 }, square)).toBe(false);
  });

  test('the smallest zone a point is in comes first; circle and outline zones both count', () => {
    const big: BanZone = { id: 'big', name: 'Big', centre: { lat: 0.5, lng: 0.5 }, radiusMiles: 500, note: '' };
    const small: BanZone = { id: 'small', name: 'Small', centre: { lat: 0.5, lng: 0.5 }, radiusMiles: 1, note: '', polygons: [[{ lat: 0.4, lng: 0.4 }, { lat: 0.4, lng: 0.6 }, { lat: 0.6, lng: 0.6 }, { lat: 0.6, lng: 0.4 }]] };
    expect(zonesAt({ lat: 0.5, lng: 0.5 }, [big, small]).map((z) => z.id)).toEqual(['small', 'big']);
    const shapes = zoneShapes([big, small], '#f00');
    expect(shapes.circles.map((c) => c.id)).toEqual(['bz:big']);
    expect(shapes.polygons.map((c) => c.id)).toEqual(['bz:small:0']);
  });
});

describe('West Midlands orders (checked 17 Nov 2026)', () => {
  test('Birmingham is the whole city, edges included', () => {
    expect(ids({ lat: 52.479, lng: -1.898 })).toContain('bz-mw-birmingham'); // city centre
    expect(ids({ lat: 52.397, lng: -1.982 })).toContain('bz-mw-birmingham'); // Longbridge
    expect(ids({ lat: 52.567, lng: -1.823 })).toContain('bz-mw-birmingham'); // Sutton Coldfield
    expect(ids({ lat: 52.48, lng: -1.73 })).not.toContain('bz-mw-birmingham'); // Solihull, over the border
  });

  test('the Black Country order covers Wolverhampton, Sandwell and Walsall, not Dudley (its own PSPO)', () => {
    expect(ids({ lat: 52.586, lng: -2.128 })).toContain('bz-blackcountry'); // Wolverhampton
    expect(ids({ lat: 52.586, lng: -1.982 })).toContain('bz-blackcountry'); // Walsall
    expect(ids({ lat: 52.519, lng: -1.995 })).toContain('bz-blackcountry'); // West Bromwich
    const dudley = ids({ lat: 52.512, lng: -2.081 });
    expect(dudley).toContain('bz-mw-dudley');
    expect(dudley).not.toContain('bz-blackcountry');
  });

  test('venues inside an order carry the warning; Solihull has no current order', () => {
    const spot = (id: string) => bundledSpots().find((s) => s.id === id)!;
    expect(PLACES.some((p) => p.id === 'mw-v-coventry-transport-museum')).toBe(true);
    expect(spot('mw-v-coventry-transport-museum').banZoneIds).toContain('bz-mw-coventry');
    expect(spot('mw-v-national-motorcycle-museum').banZoneIds).toBeUndefined();
  });

  test('no nested duplicates: the old city-centre circle is gone and Norwich is not inside the districts round it', () => {
    expect(BAN_ZONES.some((z) => z.id === 'bz-bham')).toBe(false);
    expect(inZone(byId('bz-norwich').centre, byId('bz-broadland-south-norfolk'))).toBe(false);
    expect(ids({ lat: 52.66, lng: 1.12 })).toContain('bz-broadland-south-norfolk'); // Longwater
    expect(new Set(BAN_ZONES.map((z) => z.id)).size).toBe(BAN_ZONES.length);
  });
});

describe('the zone info card', () => {
  test('kind, plain-words bans, hours, source and the host note', () => {
    const bc = zoneInfo(byId('bz-blackcountry'));
    expect(bc.kind).toBe('Court injunction');
    expect(bc.hours).toBe('3pm to 7am');
    expect(bc.source).toMatch(/^https:/);
    expect(bc.sample).toMatch(/^Sample — check the current order\./);
    expect(bc.forHosts).toMatch(/only warns/);
    expect(bc.details).not.toMatch(/^Sample/);
    // Worked out from the note when the zone doesn't say.
    expect(zoneKind(byId('bz-medway'))).toBe('dispersal');
    expect(zoneKind(byId('bz-felixstowe'))).toBe('pspo');
    expect(zoneInfo(byId('bz-westminster')).hours).toBe('18:00–07:00');
    for (const z of BAN_ZONES) expect(zoneInfo(z).bans.length).toBeGreaterThan(20);
  });
});
