/**
 * Web map maths: the app's regions (centre + span, degrees of latitude shown) to and from
 * Leaflet's Web Mercator zoom levels. Pure, so it's tested without a browser
 * (__tests__/webMap.test.ts).
 */

/** Leaflet's tile size: the whole world is TILE * 2^zoom pixels wide. */
const TILE = 256;
const MAX_LAT = 85.0511287798;
const clampLat = (lat: number) => Math.max(-MAX_LAT, Math.min(MAX_LAT, lat));

/** Latitude to a Mercator y at zoom 0 (0 at the top of the world, TILE at the bottom). */
function mercY(lat: number): number {
  const r = (clampLat(lat) * Math.PI) / 180;
  return (TILE / 2) * (1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI);
}

/** The inverse of mercY. */
function mercLat(y: number): number {
  const n = Math.PI * (1 - (2 * y) / TILE);
  return (Math.atan(Math.sinh(n)) * 180) / Math.PI;
}

/** Degrees of latitude a map `heightPx` tall shows at this zoom, centred on `lat`. */
export function zoomToSpan(zoom: number, lat: number, heightPx: number): number {
  const scale = 2 ** zoom;
  const yc = mercY(lat);
  const half = heightPx / 2 / scale;
  return mercLat(yc - half) - mercLat(yc + half);
}

/** Degrees of longitude a map `widthPx` wide shows at this zoom. */
export function zoomToLngSpan(zoom: number, widthPx: number): number {
  return (widthPx * 360) / (TILE * 2 ** zoom);
}

/** The zoom at which a map `heightPx` tall shows `span` degrees of latitude round `lat`. */
export function spanToZoom(span: number, lat: number, heightPx: number): number {
  if (!(span > 0) || !(heightPx > 0)) return 0;
  // Near enough for small spans; two corrections make it exact for big ones too.
  let z = Math.log2((360 * heightPx * Math.cos((clampLat(lat) * Math.PI) / 180)) / (TILE * span));
  for (let i = 0; i < 3; i++) z += Math.log2(zoomToSpan(z, lat, heightPx) / span);
  return z;
}

/**
 * The zoom that fits a region the way Apple Maps does: both the latitude span and the
 * longitude span (the native map asks for span * 1.2) must fit, so a narrow phone map
 * zooms out a little to fit the width.
 */
export function fitZoom(
  region: { centre: { lat: number }; span: number; lngSpan?: number },
  size: { w: number; h: number },
  limits: { min: number; max: number } = { min: 2, max: 19 },
): number {
  const lngSpan = region.lngSpan ?? region.span * 1.2;
  const byLat = spanToZoom(region.span, region.centre.lat, size.h);
  const byLng = size.w > 0 && lngSpan > 0 ? Math.log2((size.w * 360) / (TILE * lngSpan)) : byLat;
  const z = Math.min(byLat, byLng);
  return Math.max(limits.min, Math.min(limits.max, Number.isFinite(z) ? z : limits.min));
}

/** Metres per pixel at this zoom and latitude. */
export function metresPerPixel(zoom: number, lat: number): number {
  return (40075016.686 * Math.cos((clampLat(lat) * Math.PI) / 180)) / (TILE * 2 ** zoom);
}

/**
 * The zoom that looks like Apple's driving camera at `altitude` metres: Apple's camera
 * sees about as much ground top to bottom as it is high.
 */
export function altitudeToZoom(altitude: number, lat: number, heightPx: number): number {
  if (!(altitude > 0) || !(heightPx > 0)) return 16;
  return Math.log2((40075016.686 * Math.cos((clampLat(lat) * Math.PI) / 180) * heightPx) / (TILE * altitude));
}
