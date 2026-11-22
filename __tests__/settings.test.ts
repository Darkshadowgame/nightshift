import { DEFAULT_SETTINGS, upgradeSettings } from '../src/lib/settings';

describe('settings from older saves', () => {
  test('Karts goes from the Tracks choice, which is never left empty', () => {
    expect(upgradeSettings({ trackVehicles: ['car', 'kart'] } as never, true).trackVehicles).toEqual(['car']);
    expect(upgradeSettings({ trackVehicles: ['kart'] } as never, true).trackVehicles).toEqual(['car', 'bike']);
  });

  test('Shops and Speed cameras are turned off once (they moved to the layers button), then left alone', () => {
    const old = upgradeSettings({ cameras: true, shops: true } as never, true);
    expect(old).toMatchObject({ cameras: false, shops: false, moreLayersOff: true });
    const later = upgradeSettings({ ...old, cameras: true, shops: true }, true);
    expect(later).toMatchObject({ cameras: true, shops: true });
  });

  test('new installs start with both off', () => {
    expect(DEFAULT_SETTINGS.cameras).toBe(false);
    expect(DEFAULT_SETTINGS.shops).toBe(false);
  });
});

describe('saved map layers (REVIEW-9 decision 13: Events only by default)', () => {
  const ONLY_EVENTS = { events: true, photo: false, drive: false, track: false, venue: false };
  test('older saves go to Events only once, keeping Events and Posts as they were', () => {
    expect(upgradeSettings({ moreLayersOff: true } as never, true).mapLayers).toEqual(ONLY_EVENTS);
    const old = upgradeSettings({ moreLayersOff: true, mapLayers: { events: false, drive: true }, postsLayer: true, shops: true, roadReports: true } as never, true);
    expect(old.mapLayers).toEqual({ ...ONLY_EVENTS, events: false });
    expect([old.postsLayer, old.shops, old.eventsOnlyMap]).toEqual([true, false, true]);
  });

  test('after that, a choice is kept', () => {
    expect(upgradeSettings({ moreLayersOff: true, eventsOnlyMap: true, mapLayers: { drive: true } } as never, true).mapLayers).toMatchObject({ drive: true, events: true });
  });

  test('new installs have Events only and the map hint not yet seen', () => {
    expect(DEFAULT_SETTINGS.mapLayers).toEqual(ONLY_EVENTS);
    expect(DEFAULT_SETTINGS.mapHintSeen).toBeFalsy();
  });
});

describe('event filters (owner, 18 Nov 2026)', () => {
  test('new installs: Tonight, only ones I can go to', () => {
    expect(DEFAULT_SETTINGS.eventFilter).toEqual({ when: 'tonight', types: [], canGoOnly: true, show: 'all' });
  });
  test('older saves get the default once, then a choice is kept', () => {
    const old = upgradeSettings({ eventFilter: { when: 'all', types: [], canGoOnly: false } } as never, true);
    expect(old.eventFilter).toEqual({ when: 'tonight', types: [], canGoOnly: true, show: 'all' });
    expect(old.eventFilterOnce).toBe(true);
    const later = upgradeSettings({ ...old, eventFilter: { when: 'week', types: ['cruise'], canGoOnly: false, show: 'organised' } }, true);
    expect(later.eventFilter).toEqual({ when: 'week', types: ['cruise'], canGoOnly: false, show: 'organised' });
  });
});
