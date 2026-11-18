import { ART } from '../../theme';

/** A keyless raster base map the web preview can draw. */
export interface TileSource {
  name: string;
  /** Leaflet URL template(s): the base, then any label layer drawn over it. */
  urls: string[];
  credit: string;
  /** The highest zoom the server has tiles for (Leaflet stretches past it). */
  maxNativeZoom: number;
  /**
   * A CSS filter that brings it closer to Apple's dark map: sepia then a half turn gives one cool
   * navy-grey cast (a plain hue turn would make green parks purple). Tuned side by side in a browser.
   */
  filter: string;
}

/**
 * Tried in order: if one fails before any tile loads, the next is used, and then the grid.
 * CARTO's Dark Matter (the plan's first choice) now answers every request with an
 * "API key required" picture, so it isn't used.
 * - Stadia "Alidade Smooth Dark" (OpenStreetMap data): the closest to Apple's dark map. No key
 *   on localhost; any other web address must be registered (free) at stadiamaps.com, or it
 *   fails and the next source is used.
 * - Esri "Dark Gray Canvas": keyless anywhere, plainer, labels as a second layer.
 * Both are for development and light use; see README before a public web launch.
 */
export const TILE_SOURCES: TileSource[] = [
  {
    name: 'stadia',
    urls: ['https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png'],
    credit: '© Stadia Maps © OpenMapTiles © OpenStreetMap',
    maxNativeZoom: 20,
    filter: 'sepia(1) hue-rotate(180deg) saturate(0.9) brightness(1.15) contrast(1.05)',
  },
  {
    name: 'esri',
    urls: [
      'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
      'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
    ],
    credit: '© Esri, HERE, Garmin © OpenStreetMap',
    maxNativeZoom: 16,
    filter: 'sepia(1) hue-rotate(180deg) saturate(0.9) brightness(1.2) contrast(1.05)',
  },
];
/** What the credit says before any tiles have loaded. */
export const TILE_CREDIT = TILE_SOURCES[0].credit;
/** Highest zoom the map goes to. */
export const TILE_MAX_ZOOM = 20;

/** After this many failed tiles with none loaded, the map draws the grid instead (offline). */
export const TILE_FAILS_BEFORE_GRID = 4;

/** The grid drawn behind (and instead of) the tiles: the old web stand-in's look. */
export const GRID_BACKGROUND = [
  `linear-gradient(${ART.mapGrid} 1px, transparent 1px)`,
  `linear-gradient(90deg, ${ART.mapGrid} 1px, transparent 1px)`,
].join(', ');
export const GRID_SIZE = '48px 48px';

/** The credit line: the tiles' credit, plus the screen's own unless the tiles' already says it. */
export function creditLine(credit?: string, tiles: string = TILE_CREDIT): string {
  const osm = /openstreetmap/i;
  if (!credit || tiles.toLowerCase().includes(credit.replace(/^©\s*/, '').toLowerCase()) || (osm.test(credit) && osm.test(tiles))) return tiles;
  return `${credit} · ${tiles}`;
}
