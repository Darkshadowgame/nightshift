import { useEffect, useState } from 'react';
import { Image, Platform } from 'react-native';
import { File } from 'expo-file-system';
import { ShopIndex } from './shops';
import type { ShopDataset } from './shopCodec';

/**
 * The shop dataset (OpenStreetMap, assets/data/shops.nsdata) is an asset, not
 * code: it isn't in the JavaScript bundle, so an over-the-air update only
 * downloads it again when the data changes. It's read once, the first time
 * the Shops layer is drawn or a shop is opened, and its tiles are decoded one
 * at a time as they come into view.
 */

let index: ShopIndex | null = null;
let loading: Promise<ShopIndex> | null = null;

async function readAsset(): Promise<ShopDataset> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const uri = Image.resolveAssetSource(require('../../assets/data/shops.nsdata'))?.uri;
  if (!uri) throw new Error('Shop data asset not found');
  // Installed or updated app: a file on the phone. Web and development: served over http.
  const text = uri.startsWith('file:') && Platform.OS !== 'web' ? await new File(uri).text() : await (await fetch(uri)).text();
  return JSON.parse(text) as ShopDataset;
}

/** The index, if it has been read already. */
export function loadedShopIndex(): ShopIndex | null {
  return index;
}

/** Read the dataset (once) and build the index. */
export function loadShopIndex(): Promise<ShopIndex> {
  loading ??= readAsset()
    .then((data) => (index = new ShopIndex(data)))
    .catch((e) => {
      loading = null; // try again next time
      throw e;
    });
  return loading;
}

/** For tests and tools: use this dataset instead of reading the asset. */
export function setShopData(data: ShopDataset): ShopIndex {
  index = new ShopIndex(data);
  loading = Promise.resolve(index);
  return index;
}

/** The index once it's loaded (null until then, or while `enabled` is false). Starts loading when enabled. */
export function useShopIndex(enabled: boolean): { index: ShopIndex | null; failed: boolean } {
  const [state, setState] = useState<{ index: ShopIndex | null; failed: boolean }>({ index, failed: false });
  useEffect(() => {
    if (!enabled || state.index) return;
    let live = true;
    loadShopIndex()
      .then((i) => live && setState({ index: i, failed: false }))
      .catch(() => live && setState({ index: null, failed: true }));
    return () => {
      live = false;
    };
  }, [enabled, state.index]);
  return { index: enabled ? state.index : null, failed: state.failed };
}
