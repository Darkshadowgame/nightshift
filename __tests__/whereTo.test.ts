import {
  clearRecent,
  destinationLabel,
  distanceNote,
  MAX_RECENT,
  NO_PLACES,
  rememberRecent,
  savedPlaces,
  setSlot,
  tidyDestinations,
  whereQueries,
  type Destination,
} from '../src/lib/whereTo';

const place = (n: number, extra: Partial<Destination> = {}): Destination => ({
  at: { lat: 52 + n * 0.01, lng: -1 },
  name: `Place ${n}`,
  address: 'Somewhere',
  ...extra,
});

describe('queries', () => {
  test('UK first, then as typed', () => {
    expect(whereQueries('10 Downing Street, London')).toEqual({ uk: '10 Downing Street, London, UK', anywhere: '10 Downing Street, London' });
  });
  test('a postcode only searches the UK', () => {
    expect(whereQueries('b797nd')).toEqual({ uk: 'B79 7ND, UK', anywhere: null });
  });
  test('already says UK: one search', () => {
    expect(whereQueries('Tamworth, England')).toEqual({ uk: 'Tamworth, England', anywhere: null });
  });
  test('too short', () => {
    expect(whereQueries(' a ')).toBeNull();
  });
});

describe('labels', () => {
  test('an address: house number and street, then town and postcode', () => {
    expect(
      destinationLabel({ name: '12 High Street', streetNumber: '12', street: 'High Street', city: 'Tamworth', postalCode: 'B79 7ND', isoCountryCode: 'GB' }, '12 high st'),
    ).toEqual({ name: '12 High Street', address: 'Tamworth, B79 7ND' });
  });
  test('a named place keeps its name, with the street underneath', () => {
    expect(
      destinationLabel({ name: 'Caffeine and Machine', street: 'Banbury Road', city: 'Ettington', postalCode: 'CV37 7PN', isoCountryCode: 'GB' }, 'caffeine'),
    ).toEqual({ name: 'Caffeine and Machine', address: 'Banbury Road, Ettington, CV37 7PN' });
  });
  test('abroad: the country is added', () => {
    expect(destinationLabel({ name: 'Nürburgring', city: 'Nürburg', isoCountryCode: 'DE', country: 'Germany' }, 'nurburgring')).toEqual({
      name: 'Nürburgring',
      address: 'Nürburg, Germany',
    });
  });
  test('a town only', () => {
    expect(destinationLabel({ name: 'Tamworth', city: 'Tamworth', isoCountryCode: 'GB' }, 'tamworth')).toEqual({ name: 'Tamworth', address: '' });
  });
  test('nothing back: what was typed', () => {
    expect(destinationLabel(null, ' Some place ')).toEqual({ name: 'Some place', address: '' });
  });
});

describe('tidy results', () => {
  test('UK first, duplicates dropped, limited', () => {
    const hits = [
      { at: { lat: 40.7, lng: -74 }, id: 'ny' },
      { at: { lat: 52.6, lng: -1.7 }, id: 'a' },
      { at: { lat: 52.6001, lng: -1.7001 }, id: 'a-again' },
      { at: { lat: 53, lng: -2 }, id: 'b' },
    ];
    expect(tidyDestinations(hits).map((h) => h.id)).toEqual(['a', 'b', 'ny']);
    expect(tidyDestinations(hits, 1).map((h) => h.id)).toEqual(['a']);
  });
});

describe('recent and saved', () => {
  test('newest first, no repeats, at most ten', () => {
    let p = NO_PLACES;
    for (let i = 0; i < 12; i++) p = rememberRecent(p, place(i));
    expect(p.recent).toHaveLength(MAX_RECENT);
    expect(p.recent[0].name).toBe('Place 11');
    p = rememberRecent(p, place(5));
    expect(p.recent[0].name).toBe('Place 5');
    expect(p.recent.filter((r) => r.name === 'Place 5')).toHaveLength(1);
    expect(p.recent).toHaveLength(MAX_RECENT);
  });
  test('clear leaves Home and Work', () => {
    const p = setSlot(rememberRecent(NO_PLACES, place(1)), 'home', place(2));
    const cleared = clearRecent(p);
    expect(cleared.recent).toEqual([]);
    expect(cleared.home?.name).toBe('Place 2');
  });
  test('Home and Work can be set and forgotten', () => {
    let p = setSlot(NO_PLACES, 'work', place(3));
    expect(p.work?.name).toBe('Place 3');
    p = setSlot(p, 'work', null);
    expect(p.work).toBeUndefined();
  });
  test('older saves and junk read as empty', () => {
    expect(savedPlaces(undefined)).toEqual({ recent: [] });
    expect(savedPlaces({ recent: [{ name: 'x' } as unknown as Destination, place(1)] }).recent).toHaveLength(1);
  });
});

describe('distance', () => {
  test('miles from you', () => {
    expect(distanceNote(null, place(1).at)).toBeNull();
    expect(distanceNote(place(0).at, place(0).at)).toBe('Here');
    expect(distanceNote({ lat: 52, lng: -1 }, { lat: 52.1, lng: -1 })).toBe('6.9 mi away');
  });
});
