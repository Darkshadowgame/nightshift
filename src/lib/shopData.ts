import { ShopIndex } from './shops';

/**
 * The bundled shop dataset, loaded on first use: the data module is only
 * evaluated once the Shops layer is first drawn (or a shop is opened), and
 * its tiles are decoded one at a time as they come into view.
 */
let index: ShopIndex | null = null;

export function shopIndex(): ShopIndex {
  if (!index) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { SHOP_DATA } = require('../data/shops') as typeof import('../data/shops');
    index = new ShopIndex(SHOP_DATA);
  }
  return index;
}
