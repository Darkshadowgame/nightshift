import fixture from './fixtures/commons-geosearch.json';
import { cacheKey, CACHE_TTL_MS, commonsUrl, isFresh, isIrrelevant, MAX_RADIUS_M, parseCommons, plainText, radiusFor } from '../src/lib/commons';

const SNAKE = { lat: 53.3974, lng: -1.7646 };

describe('Wikimedia Commons nearby photos', () => {
  test('one request with only the coordinates of the place', () => {
    const url = commonsUrl(SNAKE, 1500);
    expect(url.startsWith('https://commons.wikimedia.org/w/api.php?')).toBe(true);
    const q = new URL(url).searchParams;
    expect(q.get('generator')).toBe('geosearch');
    expect(q.get('ggsnamespace')).toBe('6');
    expect(q.get('ggscoord')).toBe('53.39740|-1.76460');
    expect(q.get('ggsradius')).toBe('1500');
    expect(q.get('prop')).toBe('imageinfo|coordinates');
    expect(q.get('iiextmetadatafilter')).toContain('Artist');
    expect(q.get('iiextmetadatafilter')).toContain('LicenseShortName');
    expect(q.get('origin')).toBe('*');
    // Commons caps the radius at 10 km.
    expect(new URL(commonsUrl(SNAKE, 50_000)).searchParams.get('ggsradius')).toBe(String(MAX_RADIUS_M));
  });

  test('parses photos with credit and licence, drops maps, SVGs, tiny and broken entries', () => {
    const photos = parseCommons(fixture, SNAKE, 'Snake Pass (A57)');
    expect(photos.map((p) => p.page)).toEqual([
      // Names the place, so it comes first even though it's further away.
      'https://commons.wikimedia.org/wiki/File:Snake_Pass_summit_in_snow.jpg',
      'https://commons.wikimedia.org/wiki/File:Lay-by_on_the_moor_road_-_example_1.jpg',
      // No coordinates: last.
      'https://commons.wikimedia.org/wiki/File:Woodland_near_the_road.jpg',
    ]);
    const [snow, layby, wood] = photos;
    expect(snow.author).toBe('B. Snapper & friends');
    expect(snow.licence).toBe('CC BY 4.0');
    expect(layby.author).toBe('A. Photographer');
    expect(layby.licence).toBe('CC BY-SA 2.0');
    expect(layby.licenceUrl).toBe('https://creativecommons.org/licenses/by-sa/2.0');
    expect(layby.title).toBe('Lay-by on the moor road - example 1');
    expect(layby.thumb).toMatch(/^https:\/\/upload\.wikimedia\.org\//);
    expect(layby.width).toBe(360);
    expect(layby.miles).toBeGreaterThan(0);
    expect(layby.miles).toBeLessThan(1);
    expect(wood.author).toBe('Unknown author');
    expect(wood.licence).toBe('See the file page');
    expect(wood.title).toBe('Woodland near the road');
  });

  test('a broken or empty answer gives no photos instead of throwing', () => {
    expect(parseCommons(null, SNAKE)).toEqual([]);
    expect(parseCommons({}, SNAKE)).toEqual([]);
    expect(parseCommons({ query: {} }, SNAKE)).toEqual([]);
    expect(parseCommons({ query: { pages: { '1': { title: 'File:x.jpg' } } } }, SNAKE)).toEqual([]);
    expect(parseCommons('<html>', SNAKE)).toEqual([]);
  });

  test('plain text from Commons HTML', () => {
    expect(plainText('<a href="x">Jo&nbsp;Bloggs</a> <b>&amp;</b> co &#233; &#x41;')).toBe('Jo Bloggs & co é A');
    expect(plainText(undefined)).toBe('');
  });

  test('obviously irrelevant files', () => {
    expect(isIrrelevant('File:Silverstone Circuit map.png', 'image/png', 2000)).toBe(true);
    expect(isIrrelevant('File:Club logo.jpg', 'image/jpeg', 2000)).toBe(true);
    expect(isIrrelevant('File:Track.svg', 'image/svg+xml', 2000)).toBe(true);
    expect(isIrrelevant('File:Report.pdf', 'application/pdf', 2000)).toBe(true);
    expect(isIrrelevant('File:Old photo.jpg', 'image/jpeg', 300)).toBe(true);
    expect(isIrrelevant('File:Cars at Brands Hatch.jpg', 'image/jpeg', 4000)).toBe(false);
  });

  test('search radius by kind of place', () => {
    expect(radiusFor('photo')).toBe(800);
    expect(radiusFor('track')).toBe(1500);
    expect(radiusFor('drive', 2)).toBe(2000);
    expect(radiusFor('drive', 10)).toBeCloseTo(8046.7, 0);
    expect(radiusFor('drive', 40)).toBe(MAX_RADIUS_M);
  });

  test('cache: same place within ~100 m reuses the answer for a week', () => {
    expect(cacheKey(SNAKE, 800)).toBe(cacheKey({ lat: 53.39741, lng: -1.76462 }, 800));
    expect(cacheKey(SNAKE, 800)).not.toBe(cacheKey(SNAKE, 1500));
    const now = 1_800_000_000_000;
    expect(isFresh(now - 1000, now)).toBe(true);
    expect(isFresh(now - CACHE_TTL_MS - 1, now)).toBe(false);
    // A clock that went backwards doesn't keep an answer for ever.
    expect(isFresh(now + 60_000, now)).toBe(false);
  });
});
