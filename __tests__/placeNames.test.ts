import { inUk, looksLikePostcode, placeKey, placeLabel, searchQuery, shouldAutoName, tidyHits, tidyPostcode, townLabel } from '../src/lib/placeNames';

describe('search queries', () => {
  test('postcodes are recognised and tidied', () => {
    expect(looksLikePostcode('b797nd')).toBe(true);
    expect(looksLikePostcode('SW1A 1AA')).toBe(true);
    expect(looksLikePostcode('B79')).toBe(true);
    expect(looksLikePostcode('Tamworth')).toBe(false);
    expect(tidyPostcode('b797nd')).toBe('B79 7ND');
    expect(tidyPostcode(' sw1a1aa ')).toBe('SW1A 1AA');
    expect(tidyPostcode('b79')).toBe('B79');
  });

  test('searches stay in the UK and ignore one-letter input', () => {
    expect(searchQuery(' ')).toBeNull();
    expect(searchQuery('a')).toBeNull();
    expect(searchQuery('Tamworth')).toBe('Tamworth, UK');
    expect(searchQuery('b797nd')).toBe('B79 7ND, UK');
    expect(searchQuery('Cardiff, Wales')).toBe('Cardiff, Wales');
    expect(searchQuery('  Snake   Pass ')).toBe('Snake Pass, UK');
  });
});

describe('place names from the geocoder', () => {
  test('street and town, never a house number', () => {
    expect(placeLabel({ name: '12 Ventura Park Rd', street: 'Ventura Park Rd', streetNumber: '12', city: 'Tamworth' })).toBe('Ventura Park Rd, Tamworth');
  });
  test('a named place wins over the street', () => {
    expect(placeLabel({ name: 'Snowdome', street: 'Riverdrive', city: 'Tamworth' })).toBe('Snowdome, Tamworth');
  });
  test('no city: falls back to district or subregion, then the wider area', () => {
    expect(placeLabel({ street: 'A57', subregion: 'Derbyshire' })).toBe('A57, Derbyshire');
    expect(placeLabel({ region: 'Scotland' })).toBe('Scotland');
    expect(placeLabel({})).toBeNull();
  });
  test('a postcode as the name is not used', () => {
    expect(placeLabel({ name: 'B79 7ND', street: 'Bolebridge St', city: 'Tamworth' })).toBe('Bolebridge St, Tamworth');
  });
  test('long names are trimmed', () => {
    const label = placeLabel({ name: 'A very long name for a retail park car park somewhere', city: 'Somewhere Else' })!;
    expect(label.length).toBeLessThanOrEqual(40);
  });
  test('town label never includes a street', () => {
    expect(townLabel({ street: 'High St', city: 'Lichfield' })).toBe('Lichfield');
    expect(townLabel({ street: 'High St' })).toBeNull();
  });
});

describe('results', () => {
  test('outside the UK and near-duplicates are dropped', () => {
    const hits = tidyHits([
      { at: { lat: 52.63, lng: -1.69 }, label: 'a' },
      { at: { lat: 52.631, lng: -1.691 }, label: 'dup' },
      { at: { lat: 48.85, lng: 2.35 }, label: 'Paris' },
      { at: { lat: 54.6, lng: -5.93 }, label: 'Belfast' },
    ]);
    expect(hits.map((h) => h.label)).toEqual(['a', 'Belfast']);
    expect(inUk({ lat: 60.15, lng: -1.15 })).toBe(true);
  });
  test('place keys round to about 100 m', () => {
    expect(placeKey({ lat: 52.63021, lng: -1.69618 })).toBe('52.630,-1.696');
  });
  test('auto names only replace empty or automatic names', () => {
    expect(shouldAutoName('', undefined)).toBe(true);
    expect(shouldAutoName('High St, Tamworth', 'High St, Tamworth')).toBe(true);
    expect(shouldAutoName('Far end of the car park', 'High St, Tamworth')).toBe(false);
  });
});
