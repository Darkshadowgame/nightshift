/**
 * The open-data closure parsers in supabase/functions/import-closures/parse.ts
 * (pure TypeScript, shared with the Edge Function), against a real TfL answer
 * and National Highways' own example payloads.
 */
import nh from './fixtures/nh-closures.json';
import tfl from './fixtures/tfl-streets.json';
import { parseNationalHighways, parsePosList, parseTflStreets, tflStreetName, toEwkt } from '../supabase/functions/import-closures/parse';

const NOW = '2026-11-17T21:00:00.000Z';

describe('TfL street disruptions (keyless)', () => {
  const rows = parseTflStreets(tfl.items, NOW);

  it('keeps closed segments with their line, and skips open ones', () => {
    expect(rows.map((r) => r.source_id)).toEqual(['TIMS-234009328614', expect.any(String)]);
    expect(rows[0]).toMatchObject({
      source: 'tfl', kind: 'road_closure', full_closure: true, road: 'A222 Elm Road', direction: 'Northbound',
      geom: 'SRID=4326;LINESTRING(0.100909 51.426483, 0.1009 51.425924)',
      starts_at: '2026-08-29T07:00:00Z', ends_at: '2026-11-26T18:00:00Z', updated_at: NOW,
    });
    expect(rows[0].description).toMatch(/road is closed/);
  });

  it('falls back to the start point when the line is unreadable', () => {
    expect(rows[1].geom).toMatch(/^SRID=4326;POINT\(/);
  });

  it('tidies street names', () => {
    expect(tflStreetName('[A222] ELM ROAD (DA14 )')).toBe('A222 Elm Road');
    expect(tflStreetName('HIGH STREET (SW19)')).toBe('High Street');
  });
});

describe('National Highways closures (DATEX II, needs a key)', () => {
  it('reads a planned closure with several locations, one row each', () => {
    const rows = parseNationalHighways(nh.planned, NOW);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      source: 'national_highways', source_id: '1-1742368657-0985c698-d765-4085-b9c7-4c4d28205328#0', kind: 'lane_closure', full_closure: false,
      road: 'A120', direction: 'eastBound', starts_at: '2025-03-14T08:00:00Z', ends_at: '2025-03-15T06:00:00Z',
      geom: 'SRID=4326;LINESTRING(0.525233 51.868835, 0.525917 51.869)',
    });
    expect(rows[0].description).toMatch(/A120 eastbound/);
    expect(rows[1].source_id).toMatch(/#1$/);
  });

  it('reads an unplanned lane closure on one stretch', () => {
    const rows = parseNationalHighways(nh.unplanned, NOW);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ kind: 'lane_closure', road: 'M6', starts_at: '2025-03-21T06:01:57Z' });
    expect(rows[0].geom.startsWith('SRID=4326;LINESTRING(-2.118535 52.777935,')).toBe(true);
    expect(rows[0].description).toMatch(/M6 southbound between J14 and J13/);
  });

  it('reads a point location', () => {
    const rows = parseNationalHighways(nh.incident, NOW);
    expect(rows[0].geom).toBe('SRID=4326;POINT(-2.3784728 53.489254)');
    expect(rows[0].road).toBe('M62');
  });

  it('marks a whole-road closure as a road closure', () => {
    const closed = JSON.parse(JSON.stringify(nh.unplanned));
    closed.D2Payload.situation[0].situationRecord[0].sitRoadOrCarriagewayOrLaneManagement.roadOrCarriagewayOrLaneManagementType.value = 'roadClosed';
    expect(parseNationalHighways(closed, NOW)[0]).toMatchObject({ kind: 'road_closure', full_closure: true });
  });

  it('ignores junk', () => {
    expect(parseNationalHighways({}, NOW)).toEqual([]);
    expect(parseNationalHighways({ D2Payload: { situation: [{ situationRecord: [{ x: { idG: 'a' } }] }] } }, NOW)).toEqual([]);
  });
});

describe('geometry', () => {
  it('reads DATEX posLists (lat lng pairs)', () => {
    expect(parsePosList('51.1 0.5 51.2 0.6 51.3')).toEqual([[51.1, 0.5], [51.2, 0.6]]);
  });
  it('writes EWKT with longitude first, UK points only', () => {
    expect(toEwkt([[51.5, -0.12]])).toBe('SRID=4326;POINT(-0.12 51.5)');
    expect(toEwkt([[-0.12, 51.5]])).toBeNull();
  });
});
