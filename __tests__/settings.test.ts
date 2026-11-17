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
