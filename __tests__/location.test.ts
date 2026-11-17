import * as Location from 'expo-location';
import { currentPosition, nameForPlace, searchPlaces, SearchError, townForPlace } from '../src/lib/location';

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
