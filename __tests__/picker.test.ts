import { addPoint, crosshairAt, canFinish, crosshairStop, describePoint, formatLatLng, postPickerStart, gapTo, MIN_STEP_MILES, nearbyPlaces, pathSummary, roundAt, snapPlace, undoPoint } from '../src/lib/picker';
import { longGap, MAX_POINT_GAP_MILES } from '../src/lib/spots';
import { milesBetween } from '../src/lib/geo';

// Made-up points in open country; about 0.0145 degrees of latitude is a mile.
const A = { lat: 53.0, lng: -1.8 };
const nearA = { lat: 53.00005, lng: -1.8 }; // ~5 m
const B = { lat: 53.01, lng: -1.8 }; // ~0.7 mi north of A
const FAR = { lat: 53.04, lng: -1.8 }; // ~2.1 mi north of B

describe('adding and undoing points', () => {
  it('one place replaces the last', () => {
    expect(addPoint([A], B, 'point')).toEqual([B]);
    expect(addPoint([], A, 'point')).toEqual([A]);
  });

  it('a drive adds to the end', () => {
    expect(addPoint([A], B, 'path')).toEqual([A, B]);
  });

  it('ignores a second tap right on the last checkpoint', () => {
    expect(milesBetween(A, nearA)).toBeLessThan(MIN_STEP_MILES);
    const pts = [A];
    expect(addPoint(pts, nearA, 'path')).toBe(pts);
  });

  it('allows going back to an earlier point (an out-and-back road)', () => {
    expect(addPoint([A, B], A, 'path')).toEqual([A, B, A]);
  });

  it('rounds to about a metre', () => {
    expect(roundAt({ lat: 53.123456789, lng: -1.987654321 })).toEqual({ lat: 53.12346, lng: -1.98765 });
  });

  it('undo drops the last point and is safe on empty', () => {
    expect(undoPoint([A, B])).toEqual([A]);
    expect(undoPoint([])).toEqual([]);
  });

  it('Done needs one place, or a start and an end', () => {
    expect(canFinish([], 'point')).toBe(false);
    expect(canFinish([A], 'point')).toBe(true);
    expect(canFinish([A], 'path')).toBe(false);
    expect(canFinish([A, B], 'path')).toBe(true);
  });
});

describe('gap checks', () => {
  it('nothing to compare before the first point', () => {
    expect(gapTo([], A)).toBeNull();
  });

  it('warns when the next checkpoint would be over the limit, like the form does', () => {
    const ok = gapTo([A], B)!;
    expect(ok.tooFar).toBe(false);
    const far = gapTo([A, B], FAR)!;
    expect(far.miles).toBeGreaterThan(MAX_POINT_GAP_MILES);
    expect(far.tooFar).toBe(true);
    // The same rule the suggestion is checked against.
    expect(longGap([A, B, FAR])).toEqual({ index: 1, miles: far.miles });
  });

  it('summarises the drive', () => {
    expect(pathSummary([])).toBe('0 CHECKPOINTS');
    expect(pathSummary([A])).toBe('1 CHECKPOINT');
    expect(pathSummary([A, B])).toMatch(/^2 CHECKPOINTS · 0\.\d MI$/);
  });
});

describe('crosshair to stop', () => {
  const venue = { id: 'v1', name: 'Test Retail Park', at: { lat: 53.002, lng: -1.8 } }; // ~0.14 mi from A
  const other = { id: 'v2', name: 'Other Place', at: { lat: 53.2, lng: -1.8 } };

  it('snaps onto a known place under the crosshair, with its name', () => {
    // Zoomed out a bit: span 0.2 deg reaches ~0.41 mi, capped at 0.25 mi.
    expect(crosshairStop(A, [venue, other], 0.2)).toEqual({ at: venue.at, name: 'Test Retail Park' });
  });

  it("doesn't snap when zoomed right in and the place is off to one side", () => {
    // span 0.02 deg reaches ~0.04 mi.
    expect(snapPlace(A, [venue], 0.02)).toBeNull();
    expect(crosshairStop({ lat: 53.0000012, lng: -1.8000012 }, [venue], 0.02)).toEqual({ at: { lat: 53, lng: -1.8 } });
  });

  it('never snaps further than a quarter mile, however far out', () => {
    expect(snapPlace(A, [{ ...venue, at: { lat: 53.006, lng: -1.8 } }], 5)).toBeNull();
  });

  it('picks the nearest of several', () => {
    const closer = { id: 'v3', name: 'Closer', at: { lat: 53.001, lng: -1.8 } };
    expect(snapPlace(A, [venue, closer], 0.2)?.id).toBe('v3');
  });
});

describe('context places', () => {
  it('keeps the ones near the view, nearest first, capped', () => {
    const places = [
      { id: 'far', at: { lat: 54.5, lng: -1.8 } },
      { id: 'b', at: B },
      { id: 'a', at: nearA },
    ];
    expect(nearbyPlaces(places, A, 0.1).map((p) => p.id)).toEqual(['a', 'b']);
    expect(nearbyPlaces(places, A, 0.1, 1).map((p) => p.id)).toEqual(['a']);
    expect(nearbyPlaces(places, A, 3).map((p) => p.id)).toEqual(['a', 'b', 'far']);
  });

  it('labels a point with coordinates when there is no geocoder', () => {
    expect(formatLatLng({ lat: 52.63371, lng: -1.69222 })).toBe('52.6337° N, 1.6922° W');
  });
});

describe('readable picker labels and where the post picker opens (REVIEW-7)', () => {
  const known = [{ name: 'Ventura Park', at: { lat: 52.6205, lng: -1.7265 } }];
  test('names the nearest known place, else the region, never coordinates', () => {
    expect(describePoint({ lat: 52.6205, lng: -1.7265 }, known, 'West Midlands')).toBe('At Ventura Park');
    expect(describePoint({ lat: 52.63, lng: -1.7265 }, known, 'West Midlands')).toBe('Near Ventura Park (0.7 mi)');
    expect(describePoint({ lat: 53.5, lng: -1.7 }, known, 'Huddersfield')).toBe('Near Huddersfield');
    expect(describePoint({ lat: 53.5, lng: -1.7 }, known, 'Huddersfield')).not.toMatch(/°|Somewhere/);
  });
  test('the post picker never opens on home', () => {
    const home = { lat: 52.6, lng: -1.7 };
    const near = { lat: 52.601, lng: -1.7 };
    const away = { lat: 52.7, lng: -1.7 };
    expect(postPickerStart({ picked: null, lastView: away, here: null, home })).toEqual(away);
    expect(postPickerStart({ picked: null, lastView: near, here: away, home })).toEqual(away);
    const fallback = postPickerStart({ picked: null, lastView: home, here: near, home });
    expect(fallback).not.toEqual(home);
    expect(Math.abs(fallback.lat - home.lat)).toBeGreaterThan(0.015);
  });
});

describe('PLACE-STABLE: the saved point is the crosshair', () => {
  const c = { lat: 52.633, lng: -1.69 };
  it('uses the spot the map is flying to, not the stale centre', () => {
    const stale = { lat: 52.598, lng: -1.7 };
    expect(crosshairAt(c, stale)).toEqual(c);
    expect(crosshairAt(null, c)).toEqual(c);
  });
  it('saves exactly the crosshair (to a metre) when no known place is under it', () => {
    expect(crosshairStop(crosshairAt(c, A), [], 0.08).at).toEqual(roundAt(c));
    const far = [{ id: 'x', name: 'Far', at: { lat: 52.6, lng: -1.7 } }];
    expect(crosshairStop(c, far, 0.08)).toEqual({ at: roundAt(c) });
  });
});
