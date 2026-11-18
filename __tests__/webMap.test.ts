import { altitudeToZoom, fitZoom, metresPerPixel, spanToZoom, zoomToLngSpan, zoomToSpan } from '../src/components/webmap/zoom.web';
import { creditLine, TILE_CREDIT, TILE_SOURCES } from '../src/components/webmap/tiles.web';

describe('web map: span and zoom', () => {
  it('turns a span into a zoom and back', () => {
    for (const lat of [0, 51.5, 55.9, -33.9]) {
      for (const span of [0.005, 0.12, 0.6, 4]) {
        for (const h of [300, 700]) {
          const z = spanToZoom(span, lat, h);
          expect(zoomToSpan(z, lat, h)).toBeCloseTo(span, 6);
        }
      }
    }
  });

  it('shows a bigger span when zoomed out, and twice the span for one zoom level out', () => {
    const a = zoomToSpan(12, 52, 600);
    const b = zoomToSpan(11, 52, 600);
    expect(b).toBeGreaterThan(a);
    expect(b / a).toBeCloseTo(2, 2);
  });

  it('matches the known scale: zoom 0 shows the whole world 256 px wide', () => {
    expect(zoomToLngSpan(0, 256)).toBeCloseTo(360, 6);
    expect(metresPerPixel(0, 0)).toBeCloseTo(156543.03, 1);
  });

  it('a UK city-wide view lands on a sensible street-map zoom', () => {
    const z = spanToZoom(0.6, 52.5, 700);
    expect(z).toBeGreaterThan(9);
    expect(z).toBeLessThan(11);
  });

  it('fits the width as well as the height, like Apple Maps (span * 1.2 across)', () => {
    const region = { centre: { lat: 52.5, lng: -1.9 }, span: 0.6 };
    const tall = fitZoom(region, { w: 393, h: 700 });
    // A narrow phone map: the longitude span decides, so it zooms out from the height-only fit.
    expect(tall).toBeLessThan(spanToZoom(0.6, 52.5, 700));
    expect(zoomToLngSpan(tall, 393)).toBeCloseTo(0.72, 6);
    // A wide, short map: the latitude span decides.
    const wide = fitZoom(region, { w: 1200, h: 300 });
    expect(wide).toBeCloseTo(spanToZoom(0.6, 52.5, 300), 6);
  });

  it('keeps the zoom inside the limits, even for nonsense input', () => {
    expect(fitZoom({ centre: { lat: 52 }, span: 200 }, { w: 400, h: 700 })).toBe(2);
    expect(fitZoom({ centre: { lat: 52 }, span: 0.000001 }, { w: 400, h: 700 })).toBe(19);
    expect(fitZoom({ centre: { lat: 52 }, span: 0 }, { w: 0, h: 0 })).toBe(2);
  });

  it('turns the driving camera height into a street-level zoom', () => {
    const slow = altitudeToZoom(450, 52.5, 700);
    const fast = altitudeToZoom(1400, 52.5, 700);
    expect(slow).toBeGreaterThan(fast);
    expect(fast).toBeGreaterThan(14);
    expect(slow).toBeLessThan(19);
    // Shows about `altitude` metres top to bottom.
    expect(metresPerPixel(slow, 52.5) * 700).toBeCloseTo(450, 0);
  });
});

describe('web map: tiles', () => {
  it('only uses keyless https tile servers, best first', () => {
    expect(TILE_SOURCES.length).toBeGreaterThan(1);
    for (const t of TILE_SOURCES) for (const u of t.urls) expect(u).toMatch(/^https:\/\/[^/]+\/.*\{z\}.*\{[xy]\}/);
    expect(TILE_SOURCES.flatMap((t) => t.urls).join(' ')).not.toMatch(/cartocdn|key=|token=/i);
  });
});

describe('web map: credit', () => {
  it('always credits the tiles, and never says OpenStreetMap twice', () => {
    expect(creditLine()).toBe(TILE_CREDIT);
    expect(creditLine('© OpenStreetMap contributors')).toBe(TILE_CREDIT);
    expect(creditLine('Data: DVSA')).toBe(`Data: DVSA · ${TILE_CREDIT}`);
    for (const t of TILE_SOURCES) {
      expect(t.credit).toMatch(/© OpenStreetMap/);
      expect(creditLine('© OpenStreetMap contributors', t.credit)).toBe(t.credit);
    }
  });
});
