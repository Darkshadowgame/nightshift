import type * as Leaflet from 'leaflet';
import { realNowMs } from '../../lib/appClock';
import { ART } from '../../theme';
import { GRID_BACKGROUND, GRID_SIZE, TILE_FAILS_BEFORE_GRID, TILE_MAX_ZOOM, TILE_SOURCES } from './tiles.web';

export type L = typeof Leaflet;

/**
 * Leaflet, loaded on first use with import(), so it sits in its own web chunk and only
 * *.web.tsx files ever import it (the iPhone bundle never sees it).
 */
let loading: Promise<L> | null = null;
export function loadLeaflet(): Promise<L> {
  if (!loading) {
    loading = import('leaflet').then((m) => {
      injectCss();
      return ((m as unknown as { default?: L }).default ?? m) as L;
    });
    // A failed load (offline) can be tried again next time a map mounts.
    loading.catch(() => {
      loading = null;
    });
  }
  return loading;
}

/** The bits of leaflet.css the app needs (no controls or popups), plus the tint and grid. */
const CSS = `
.leaflet-pane,.leaflet-tile,.leaflet-marker-icon,.leaflet-tile-container,.leaflet-pane>svg,.leaflet-pane>canvas,.leaflet-layer{position:absolute;left:0;top:0}
.leaflet-container{overflow:hidden;-webkit-tap-highlight-color:transparent;outline:none;background:${ART.mapBg};font:inherit}
.leaflet-tile,.leaflet-marker-icon{user-select:none;-webkit-user-select:none;-webkit-user-drag:none}
.leaflet-marker-icon{display:block}
.leaflet-container .leaflet-overlay-pane svg{max-width:none!important;max-height:none!important}
.leaflet-container .leaflet-tile-pane img,.leaflet-container .leaflet-tile{max-width:none!important;max-height:none!important;width:auto;padding:0}
.leaflet-container img.leaflet-tile{mix-blend-mode:plus-lighter}
.leaflet-container.leaflet-touch-drag.leaflet-touch-zoom{touch-action:none}
.leaflet-tile{filter:inherit;visibility:hidden}
.leaflet-tile-loaded{visibility:inherit}
.leaflet-pane{z-index:400}.leaflet-tile-pane{z-index:200}.leaflet-overlay-pane{z-index:400}.leaflet-marker-pane{z-index:600}
.leaflet-map-pane svg{z-index:200}
.leaflet-zoom-animated{transform-origin:0 0}
svg.leaflet-zoom-animated{will-change:transform}
.leaflet-zoom-anim .leaflet-zoom-animated{transition:transform .25s cubic-bezier(0,0,.25,1)}
.leaflet-zoom-anim .leaflet-tile,.leaflet-pan-anim .leaflet-tile{transition:none}
.leaflet-zoom-anim .leaflet-zoom-hide{visibility:hidden}
.leaflet-interactive{cursor:pointer}
.leaflet-grab{cursor:grab}
.leaflet-dragging .leaflet-grab,.leaflet-dragging .leaflet-grab .leaflet-interactive{cursor:grabbing}
.leaflet-marker-icon,.leaflet-pane>svg path,.leaflet-tile-container{pointer-events:none}
.leaflet-marker-icon.leaflet-interactive,.leaflet-pane>svg path.leaflet-interactive{pointer-events:auto}
.leaflet-marker-icon:focus-visible{outline:2px solid ${ART.mapGrid};outline-offset:2px;border-radius:999px}
${TILE_SOURCES.map((t) => `.ns-tiles-${t.name}{filter:${t.filter}}`).join('\n')}
.ns-grid{background-image:${GRID_BACKGROUND};background-size:${GRID_SIZE}}
.ns-grid .leaflet-tile-pane{display:none}
.ns-pin{display:flex;align-items:center;justify-content:center;background:none;border:0}
`;

function injectCss() {
  if (typeof document === 'undefined' || document.getElementById('ns-leaflet-css')) return;
  const el = document.createElement('style');
  el.id = 'ns-leaflet-css';
  el.textContent = CSS;
  document.head.appendChild(el);
}

/**
 * A Leaflet map in `el` the way the app wants it: no controls (the native map has none),
 * touch pan and pinch, dark tiles tinted like Apple's dark map, the next tile source when one
 * won't load, and the grid when none will (offline). `onTiles` gets the credit for the tiles
 * on show, or null for the grid.
 */
export function makeMap(L: L, el: HTMLElement, opts: { zoomSnap?: number; onTiles?: (credit: string | null) => void } = {}) {
  const map = L.map(el, {
    zoomControl: false,
    attributionControl: false,
    zoomSnap: opts.zoomSnap ?? 0.25,
    zoomDelta: 0.5,
    wheelPxPerZoomLevel: 90,
    minZoom: 2,
    maxZoom: TILE_MAX_ZOOM,
    keyboard: true,
    // The page's own long press handles touch; Leaflet's Safari tap-hold would fire it twice.
    tapHold: false,
  } as Leaflet.MapOptions);
  let source = 0;
  let layers: Leaflet.TileLayer[] = [];
  let loaded = 0;
  let failed = 0;
  let grid = false;
  const setGrid = (on: boolean) => {
    grid = on;
    el.classList.toggle('ns-grid', on);
    opts.onTiles?.(on ? null : TILE_SOURCES[source].credit);
  };
  const use = (i: number) => {
    for (const l of layers) l.remove();
    source = i;
    loaded = 0;
    failed = 0;
    const t = TILE_SOURCES[i];
    layers = t.urls.map((url, n) => {
      const layer = L.tileLayer(url, {
        maxZoom: TILE_MAX_ZOOM,
        maxNativeZoom: t.maxNativeZoom,
        className: `ns-tiles-${t.name}`,
        crossOrigin: true,
        keepBuffer: 3,
        zIndex: n + 1,
      });
      // Only the base layer decides whether the source works.
      if (n === 0) {
        layer.on('tileload', () => {
          loaded++;
          if (loaded === 1 || grid) setGrid(false);
        });
        layer.on('tileerror', () => {
          failed++;
          if (loaded > 0 || failed < TILE_FAILS_BEFORE_GRID) return;
          if (source + 1 < TILE_SOURCES.length) use(source + 1);
          else if (!grid) setGrid(true);
        });
      }
      return layer.addTo(map);
    });
  };
  use(0);
  if (typeof navigator !== 'undefined' && navigator.onLine === false) setGrid(true);
  // Coming back online: start again from the best source.
  const online = () => use(0);
  window.addEventListener('online', online);
  return {
    map,
    remove: () => {
      window.removeEventListener('online', online);
      map.remove();
    },
  };
}

/**
 * Press and hold on the map (mouse or touch): `onHold` with where. Right-click counts too.
 * Returns whether a click straight after should be ignored, and a cleanup.
 */
export function longPress(map: Leaflet.Map, onHold: (at: Leaflet.LatLng) => void) {
  const el = map.getContainer();
  let timer: ReturnType<typeof setTimeout> | null = null;
  let start: { x: number; y: number } | null = null;
  let firedAt = 0;
  const cancel = () => {
    if (timer) clearTimeout(timer);
    timer = null;
    start = null;
  };
  const down = (e: PointerEvent) => {
    if (e.button !== 0 || !e.isPrimary) return;
    // Not on a pin.
    if ((e.target as HTMLElement | null)?.closest?.('.leaflet-marker-icon')) return;
    cancel();
    start = { x: e.clientX, y: e.clientY };
    const point = map.mouseEventToLatLng(e as unknown as MouseEvent);
    timer = setTimeout(() => {
      timer = null;
      firedAt = realNowMs();
      onHold(point);
    }, 550);
  };
  const move = (e: PointerEvent) => {
    if (start && Math.hypot(e.clientX - start.x, e.clientY - start.y) > 8) cancel();
  };
  const menu = (e: MouseEvent) => {
    e.preventDefault();
    if (realNowMs() - firedAt < 1000) return;
    firedAt = realNowMs();
    onHold(map.mouseEventToLatLng(e));
  };
  // A second finger is a pinch, not a hold.
  const touch = (e: TouchEvent) => {
    if (e.touches.length > 1) cancel();
  };
  el.addEventListener('pointerdown', down);
  el.addEventListener('pointermove', move);
  el.addEventListener('pointerup', cancel);
  el.addEventListener('pointercancel', cancel);
  el.addEventListener('contextmenu', menu);
  el.addEventListener('touchstart', touch, { passive: true });
  map.on('movestart zoomstart', cancel);
  return {
    justHeld: () => realNowMs() - firedAt < 700,
    remove: () => {
      cancel();
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', cancel);
      el.removeEventListener('pointercancel', cancel);
      el.removeEventListener('contextmenu', menu);
      el.removeEventListener('touchstart', touch);
      map.off('movestart zoomstart', cancel);
    },
  };
}
