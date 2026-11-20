import * as Location from 'expo-location';
import { currentPosition, locationHelp, POSITION_TIMEOUT_MS, nameForPlace, searchDestinations, searchPlaces, SearchError, townForPlace } from '../src/lib/location';

jest.mock('expo-location', () => ({
  Accuracy: { Balanced: 3, High: 4 },
  getForegroundPermissionsAsync: jest.fn(),
  requestForegroundPermissionsAsync: jest.fn(),
  getLastKnownPositionAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  geocodeAsync: jest.fn(),
  reverseGeocodeAsync: jest.fn(),
}));

const L = Location as jest.Mocked<typeof Location>;
const granted = { granted: true, canAskAgain: true } as unknown as Location.LocationPermissionResponse;
const denied = { granted: false, canAskAgain: false } as unknown as Location.LocationPermissionResponse;
const fix = (lat: number, lng: number) => ({ coords: { latitude: lat, longitude: lng } }) as Location.LocationObject;

beforeEach(() => jest.resetAllMocks());

describe('current position', () => {
  test('asks once, then uses a recent fix', async () => {
    L.getForegroundPermissionsAsync.mockResolvedValue({ granted: false, canAskAgain: true } as never);
    L.requestForegroundPermissionsAsync.mockResolvedValue(granted);
    L.getLastKnownPositionAsync.mockResolvedValue(fix(52.6, -1.7));
    await expect(currentPosition()).resolves.toEqual({ ok: true, at: { lat: 52.6, lng: -1.7 } });
    expect(L.requestForegroundPermissionsAsync).toHaveBeenCalledTimes(1);
    expect(L.getCurrentPositionAsync).not.toHaveBeenCalled();
  });
  test('denied is reported, not thrown', async () => {
    L.getForegroundPermissionsAsync.mockResolvedValue(denied);
    await expect(currentPosition()).resolves.toEqual({ ok: false, reason: 'denied' });
    expect(L.requestForegroundPermissionsAsync).not.toHaveBeenCalled();
  });
  test('no fix: unavailable', async () => {
    L.getForegroundPermissionsAsync.mockResolvedValue(granted);
    L.getLastKnownPositionAsync.mockResolvedValue(null);
    L.getCurrentPositionAsync.mockRejectedValue(new Error('no gps'));
    await expect(currentPosition()).resolves.toEqual({ ok: false, reason: 'unavailable' });
  });
});

describe('place search', () => {
  test('names each UK hit and drops the rest', async () => {
    L.geocodeAsync.mockResolvedValue([
      { latitude: 52.62, longitude: -1.72 },
      { latitude: 40.7, longitude: -74 },
    ] as never);
    L.reverseGeocodeAsync.mockResolvedValue([{ street: 'Ventura Park Rd', city: 'Tamworth' }] as never);
    const hits = await searchPlaces('tamworth');
    expect(L.geocodeAsync).toHaveBeenCalledWith('tamworth, UK');
    expect(hits).toEqual([{ at: { lat: 52.62, lng: -1.72 }, label: 'Ventura Park Rd, Tamworth' }]);
  });
  test('too short: no lookup', async () => {
    await expect(searchPlaces('a')).resolves.toEqual([]);
    expect(L.geocodeAsync).not.toHaveBeenCalled();
  });
  test('no results is an empty list; a failure is a readable error', async () => {
    L.geocodeAsync.mockResolvedValueOnce([]);
    await expect(searchPlaces('zzzz')).resolves.toEqual([]);
    L.geocodeAsync.mockRejectedValueOnce(new Error('offline'));
    await expect(searchPlaces('Leeds')).rejects.toBeInstanceOf(SearchError);
  });
  test('a hit the geocoder cannot name keeps what was typed', async () => {
    L.geocodeAsync.mockResolvedValue([{ latitude: 53.4, longitude: -1.8 }] as never);
    L.reverseGeocodeAsync.mockRejectedValue(new Error('rate limited'));
    await expect(searchPlaces('Snake Pass')).resolves.toEqual([{ at: { lat: 53.4, lng: -1.8 }, label: 'Snake Pass' }]);
  });
});

describe('naming a dropped point', () => {
  test('street and town, or null when offline', async () => {
    L.reverseGeocodeAsync.mockResolvedValueOnce([{ name: '3 High St', street: 'High St', streetNumber: '3', city: 'Lichfield' }] as never);
    await expect(nameForPlace({ lat: 52.68, lng: -1.83 })).resolves.toBe('High St, Lichfield');
    L.reverseGeocodeAsync.mockRejectedValueOnce(new Error('offline'));
    await expect(nameForPlace({ lat: 52.68, lng: -1.83 })).resolves.toBeNull();
    L.reverseGeocodeAsync.mockResolvedValueOnce([{ street: 'High St', city: 'Lichfield' }] as never);
    await expect(townForPlace({ lat: 52.68, lng: -1.83 })).resolves.toBe('Lichfield');
  });
});

describe('where to', () => {
  test('UK first, with two readable lines', async () => {
    L.geocodeAsync.mockResolvedValue([{ latitude: 52.63, longitude: -1.69 }] as never);
    L.reverseGeocodeAsync.mockResolvedValue([{ name: '12 High Street', streetNumber: '12', street: 'High Street', city: 'Tamworth', postalCode: 'B79 7ND', isoCountryCode: 'GB' }] as never);
    await expect(searchDestinations('12 high street tamworth')).resolves.toEqual([
      { at: { lat: 52.63, lng: -1.69 }, name: '12 High Street', address: 'Tamworth, B79 7ND' },
    ]);
    expect(L.geocodeAsync).toHaveBeenCalledTimes(1);
    expect(L.geocodeAsync).toHaveBeenCalledWith('12 high street tamworth, UK');
  });
  test('nothing in the UK: searches as typed, abroad allowed', async () => {
    L.geocodeAsync.mockResolvedValueOnce([]).mockResolvedValueOnce([{ latitude: 50.33, longitude: 6.95 }] as never);
    L.reverseGeocodeAsync.mockResolvedValue([{ name: 'Nürburgring', city: 'Nürburg', isoCountryCode: 'DE', country: 'Germany' }] as never);
    const hits = await searchDestinations('Nurburgring');
    expect(L.geocodeAsync).toHaveBeenLastCalledWith('Nurburgring');
    expect(hits).toEqual([{ at: { lat: 50.33, lng: 6.95 }, name: 'Nürburgring', address: 'Nürburg, Germany' }]);
  });
  test('a failed lookup is a SearchError', async () => {
    L.geocodeAsync.mockRejectedValue(new Error('offline'));
    await expect(searchDestinations('somewhere')).rejects.toBeInstanceOf(SearchError);
  });
});

describe('live suggestions', () => {
  test('without the build 11 module: null, so the screen uses the geocoder', async () => {
    const { suggestDestinations, liveSearchAvailable } = jest.requireActual('../src/lib/location') as typeof import('../src/lib/location');
    expect(liveSearchAvailable).toBe(false);
    await expect(suggestDestinations('tesco tamworth')).resolves.toBeNull();
  });
});

describe('live suggestions on build 11', () => {
  test('suggests, then resolves to two readable lines', async () => {
    const searchPlaces = jest.fn().mockResolvedValue([{ id: '1:0', title: 'Tesco Extra', subtitle: 'Ventura Park Road, Tamworth' }]);
    const resolvePlace = jest.fn().mockResolvedValue({
      lat: 52.62, lng: -1.72, name: 'Tesco Extra', street: 'Ventura Park Road', streetNumber: '', district: '', city: 'Tamworth',
      subregion: '', region: '', postalCode: 'B78 3HB', isoCountryCode: 'GB', country: 'United Kingdom',
    });
    let mod!: typeof import('../src/lib/location');
    jest.isolateModules(() => {
      jest.doMock('../modules/nav-directions', () => ({ placeSearchAvailable: true, searchPlaces, resolvePlace }));
      mod = require('../src/lib/location');
    });
    const near = { lat: 52.6, lng: -1.7 };
    const list = await mod.suggestDestinations('  tesco  tamworth ', near);
    expect(searchPlaces).toHaveBeenCalledWith('tesco tamworth', near);
    expect(list).toHaveLength(1);
    await expect(mod.resolveSuggestion(list![0])).resolves.toEqual({
      at: { lat: 52.62, lng: -1.72 },
      name: 'Tesco Extra',
      address: 'Ventura Park Road, Tamworth, B78 3HB',
    });
    resolvePlace.mockRejectedValueOnce(Object.assign(new Error('x'), { code: 'ERR_PLACE_STALE' }));
    await expect(mod.resolveSuggestion(list![0])).rejects.toThrow('That result has gone. Search again.');
  });
});

describe('never silent (Review 14)', () => {
  test('a prompt that never gets an answer gives up as unavailable', async () => {
    jest.useFakeTimers();
    L.getForegroundPermissionsAsync.mockResolvedValue({ granted: false, canAskAgain: true } as never);
    L.requestForegroundPermissionsAsync.mockReturnValue(new Promise(() => {}));
    const p = currentPosition();
    await jest.advanceTimersByTimeAsync(POSITION_TIMEOUT_MS + 1);
    await expect(p).resolves.toEqual({ ok: false, reason: 'unavailable' });
    jest.useRealTimers();
  });
  test('says why and how to turn it on', () => {
    expect(locationHelp('denied', true)).toMatch(/browser's site settings/);
    expect(locationHelp('denied', false)).toMatch(/Settings → Slipstream → Location/);
    expect(locationHelp('unavailable', true)).toMatch(/try again/);
  });
});
