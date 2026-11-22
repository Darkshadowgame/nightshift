import { clearRecents, isEmptyRecents, MAX_RECENTS, NO_RECENTS, recentsOf, rememberPlace, rememberSearch, removePlace, removeSearch, visibleRecentPlaces } from '../src/lib/recents';

const at = (n: number) => ({ lat: 52 + n * 0.01, lng: -1.5 });
const place = (n: number) => ({ name: `Place ${n}`, address: 'Somewhere', at: at(n) });

describe('recent places', () => {
  test('newest first, once, at most five', () => {
    let r = NO_RECENTS;
    for (let i = 0; i < 8; i++) r = rememberPlace(r, place(i));
    expect(r.places).toHaveLength(MAX_RECENTS);
    expect(r.places[0].name).toBe('Place 7');
    r = rememberPlace(r, place(5));
    expect(r.places[0].name).toBe('Place 5');
    expect(r.places.filter((p) => p.name === 'Place 5')).toHaveLength(1);
  });
  test('the same spot twice is one entry; a Slipstream place is told apart by its id', () => {
    let r = rememberPlace(NO_RECENTS, { ...place(1), spotId: 'a' });
    r = rememberPlace(r, { ...place(1), spotId: 'b' });
    expect(r.places.map((p) => p.id)).toEqual(['spot:b', 'spot:a']);
    r = rememberPlace(r, { ...place(1), spotId: 'a' });
    expect(r.places.map((p) => p.id)).toEqual(['spot:a', 'spot:b']);
  });
  test('does not change what it was given', () => {
    const r = rememberPlace(NO_RECENTS, place(1));
    expect(NO_RECENTS.places).toHaveLength(0);
    expect(r).not.toBe(NO_RECENTS);
  });
  test('remove one', () => {
    const r = rememberPlace(rememberPlace(NO_RECENTS, place(1)), place(2));
    expect(removePlace(r, r.places[0].id).places.map((p) => p.name)).toEqual(['Place 1']);
  });
  test('a favourite shows once, under Favourites; a vanished Slipstream place is dropped', () => {
    let r = rememberPlace(NO_RECENTS, place(1));
    r = rememberPlace(r, place(2));
    r = rememberPlace(r, { ...place(3), spotId: 'gone' });
    r = rememberPlace(r, { ...place(4), spotId: 'here' });
    const shown = visibleRecentPlaces(r, [place(2)], new Set(['here']));
    expect(shown.map((p) => p.name)).toEqual(['Place 4', 'Place 1']);
  });
});

describe('recent searches', () => {
  test('newest first, no duplicates whatever the case or spacing, at most five', () => {
    let r = NO_RECENTS;
    for (const q of ['golf', 'civic', 'Tamworth', 'mx5', 'ace cafe', 'b79']) r = rememberSearch(r, q);
    expect(r.searches).toHaveLength(MAX_RECENTS);
    expect(r.searches[0]).toBe('b79');
    r = rememberSearch(r, '  CIVIC ');
    expect(r.searches[0]).toBe('CIVIC');
    expect(r.searches.filter((s) => s.toLowerCase() === 'civic')).toHaveLength(1);
  });
  test('too short or blank is not remembered', () => {
    expect(rememberSearch(NO_RECENTS, 'a')).toBe(NO_RECENTS);
    expect(rememberSearch(NO_RECENTS, '   ')).toBe(NO_RECENTS);
  });
  test('very long text is cut', () => {
    expect(rememberSearch(NO_RECENTS, 'x'.repeat(200)).searches[0]).toHaveLength(60);
  });
  test('remove one', () => {
    const r = rememberSearch(rememberSearch(NO_RECENTS, 'golf'), 'civic');
    expect(removeSearch(r, 'GOLF').searches).toEqual(['civic']);
  });
});

describe('saved recents', () => {
  test('nothing saved: empty', () => {
    expect(recentsOf(undefined)).toEqual(NO_RECENTS);
    expect(isEmptyRecents(recentsOf(null))).toBe(true);
  });
  test('malformed entries are dropped, long lists cut', () => {
    const r = recentsOf({ places: [{ id: 'x' } as never, ...Array.from({ length: 9 }, (_, i) => rememberPlace(NO_RECENTS, place(i)).places[0])], searches: ['golf', '', 7 as never, ...Array(9).fill('mx5')] });
    expect(r.places).toHaveLength(MAX_RECENTS);
    expect(r.searches[0]).toBe('golf');
    expect(r.searches).not.toContain('');
  });
  test('clear empties both', () => {
    expect(isEmptyRecents(clearRecents())).toBe(true);
  });
});
