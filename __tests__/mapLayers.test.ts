import { layerOn, mapChrome, savedLayers, setLayer, toggleLayer } from '../src/lib/mapLayers';

const LABELS = ['Events', 'Photos', 'Drives', 'Tracks'];

describe('map layers in settings', () => {
  test('core layers default on; the background layers read their own settings', () => {
    expect(layerOn({}, 'drive')).toBe(true);
    expect(layerOn({}, 'venue')).toBe(true);
    expect(layerOn({}, 'shops')).toBe(false);
    expect(layerOn({ cameras: true }, 'cameras')).toBe(true);
    expect(layerOn({ roadReports: true }, 'roads')).toBe(true);
  });

  test('toggling saves the whole set for core layers and one flag for the rest', () => {
    expect(toggleLayer({}, 'photo')).toEqual({ mapLayers: { events: true, photo: false, drive: true, track: true, venue: true } });
    expect(toggleLayer({ shops: true }, 'shops')).toEqual({ shops: false });
    expect(setLayer({}, 'roads', true)).toEqual({ roadReports: true });
  });

  test('partial or odd saves are filled from the defaults', () => {
    expect(savedLayers({ track: false, events: 'x' as never })).toEqual({ events: true, photo: true, drive: true, track: false, venue: true });
  });
});

describe('the map top bar never scrolls sideways', () => {
  test('labels fit on iPhone widths at the default text size', () => {
    for (const w of [375, 390, 393, 402, 430, 440]) expect(mapChrome(w, 1, { labels: LABELS, withMenu: 1 }).pills).toBe('labels');
  });

  test('narrow screens and larger text go icon-only', () => {
    expect(mapChrome(320, 1, { labels: LABELS, withMenu: 1 }).pills).toBe('icons');
    expect(mapChrome(375, 1.35, { labels: LABELS, withMenu: 1 }).pills).toBe('icons');
    expect(mapChrome(393, 2, { labels: LABELS, withMenu: 1 }).pills).toBe('icons');
  });

  test('the text cap stops huge sizes changing the answer beyond the cap', () => {
    expect(mapChrome(430, 3, { labels: LABELS, withMenu: 1 })).toEqual(mapChrome(430, 1.3, { labels: LABELS, withMenu: 1 }));
  });

  test('Find keeps its label unless the top row is full', () => {
    expect(mapChrome(393, 1, { labels: LABELS, live: true }).find).toBe('label');
    expect(mapChrome(320, 1.3, { labels: LABELS, live: true }).find).toBe('icon');
  });
});
