import { ALL_LAYERS, CORE_LAYERS, LAYER_INFO, TONIGHT_LAYERS, layerOn, savedLayers, setLayer, toggleLayer } from '../src/lib/mapLayers';

describe('map layers in settings', () => {
  test('only Events defaults on; the background layers read their own settings', () => {
    expect(layerOn({}, 'events')).toBe(true);
    expect(layerOn({}, 'drive')).toBe(false);
    expect(layerOn({}, 'venue')).toBe(false);
    expect(layerOn({}, 'shops')).toBe(false);
    expect(layerOn({ cameras: true }, 'cameras')).toBe(true);
    expect(layerOn({ roadReports: true }, 'roads')).toBe(true);
  });

  test('toggling saves the whole set for core layers and one flag for the rest', () => {
    expect(toggleLayer({}, 'photo')).toEqual({ mapLayers: { events: true, photo: true, drive: false, track: false, venue: false } });
    expect(toggleLayer({ shops: true }, 'shops')).toEqual({ shops: false });
    expect(setLayer({}, 'roads', true)).toEqual({ roadReports: true });
  });

  test('partial or odd saves are filled from the defaults', () => {
    expect(savedLayers({ track: true, events: 'x' as never })).toEqual({ events: true, photo: false, drive: false, track: true, venue: false });
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

describe('Tonight focus (REVIEW-9 decision 13; owner decision 18 Nov 2026)', () => {
  test('road reports are drive view only; shops and speed cameras are optional Tonight layers', () => {
    expect(TONIGHT_LAYERS).not.toContain('roads');
    expect(TONIGHT_LAYERS).toContain('posts');
    expect(TONIGHT_LAYERS).toContain('shops');
    expect(TONIGHT_LAYERS).toContain('cameras');
  });

  test('shops and speed cameras start off', () => {
    expect(layerOn({}, 'shops')).toBe(false);
    expect(layerOn({}, 'cameras')).toBe(false);
    expect(setLayer({}, 'shops', true)).toEqual({ shops: true });
    expect(setLayer({}, 'cameras', true)).toEqual({ cameras: true });
  });
});

import { upgradeSettings } from '../src/lib/settings';

describe('shops and cameras start off (owner, 18 Nov 2026)', () => {
  it('turns both off once for a save that had them on, then respects the choice', () => {
    const once = upgradeSettings({ shops: true, cameras: true, moreLayersOff: true, eventsOnlyMap: true }, true);
    expect(once.shops).toBe(false);
    expect(once.cameras).toBe(false);
    const later = upgradeSettings({ ...once, shops: true }, true);
    expect(later.shops).toBe(true);
  });
});
