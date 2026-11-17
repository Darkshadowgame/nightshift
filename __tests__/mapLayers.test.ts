import { ALL_LAYERS, CORE_LAYERS, LAYER_INFO, layerOn, savedLayers, setLayer, toggleLayer } from '../src/lib/mapLayers';

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

describe('the layers panel', () => {
  test('every layer has a label, icon and colour, core layers first', () => {
    expect(ALL_LAYERS.slice(0, CORE_LAYERS.length)).toEqual([...CORE_LAYERS]);
    for (const k of ALL_LAYERS) {
      expect(LAYER_INFO[k].label.length).toBeGreaterThan(0);
      expect(LAYER_INFO[k].colour).toMatch(/^#/);
    }
  });
});
