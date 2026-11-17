import { decodePolyline, encodePolyline, lineMetres, metresBetween, simplify } from '../src/lib/polyline';

describe('encoded polylines', () => {
  test('decodes the reference example', () => {
    expect(decodePolyline('_p~iF~ps|U_ulLnnqC_mqNvxq`@')).toEqual([
      { lat: 38.5, lng: -120.2 },
      { lat: 40.7, lng: -120.95 },
      { lat: 43.252, lng: -126.453 },
    ]);
  });

  test('round trip at 1e-5 degrees, including the Greenwich meridian', () => {
    const pts = [
      { lat: 52.07181, lng: -1.01431 },
      { lat: 52.07, lng: 0 },
      { lat: 51.35751, lng: 0.26003 },
      { lat: 51.35749, lng: 0.25998 },
    ];
    expect(decodePolyline(encodePolyline(pts))).toEqual(pts);
    expect(decodePolyline('')).toEqual([]);
    // A truncated string stops cleanly.
    expect(decodePolyline(encodePolyline(pts).slice(0, -1)).length).toBe(3);
  });

  test('distances', () => {
    expect(metresBetween({ lat: 52, lng: 0 }, { lat: 52.001, lng: 0 })).toBeCloseTo(111.2, 0);
    expect(lineMetres([{ lat: 52, lng: 0 }, { lat: 52.001, lng: 0 }, { lat: 52.002, lng: 0 }])).toBeCloseTo(222.4, 0);
  });

  test('simplify drops points on a straight line and keeps corners', () => {
    const line = Array.from({ length: 11 }, (_, i) => ({ lat: 52 + i * 0.0001, lng: 0 }));
    const corner = [...line, { lat: 52.001, lng: 0.002 }];
    expect(simplify(line, 2)).toEqual([line[0], line[10]]);
    expect(simplify(corner, 2)).toEqual([line[0], line[10], corner[11]]);
    expect(simplify([line[0]], 2)).toEqual([line[0]]);
  });
});
