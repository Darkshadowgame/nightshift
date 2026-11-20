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
/**
 * The day map: Stadia "Alidade Smooth" (the light twin of the night map, same key rules), then
 * Esri "Light Gray Canvas". No tint: they're already soft and grey, so pins and routes stand out.
 */
export const LIGHT_TILE_SOURCES: TileSource[] = [
  {
    name: 'stadia-light',
    urls: ['https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png'],
    credit: '© Stadia Maps © OpenMapTiles © OpenStreetMap',
    maxNativeZoom: 20,
    filter: 'saturate(0.85) contrast(1.02)',
  },
  {
    name: 'esri-light',
    urls: [
      'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
      'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
    ],
    credit: '© Esri, HERE, Garmin © OpenStreetMap',
    maxNativeZoom: 16,
    filter: 'none',
  },
];

/**
 * Small map cards (Review 21 problem 1): Esri's Canvas base layers carry no place labels and no road
 * shields (those live in the separate Reference layer, left out here), so nothing can be cut by a
 * small card's edge. Stadia has no label-free Alidade style, so Esri is the only source; the grid is
 * the fallback as usual. The credit stays.
 */
export const BARE_TILE_SOURCES: TileSource[] = [
  // Without its label layer Esri's base is much paler than the big map: darker, to match its tone.
  { ...TILE_SOURCES[1], name: 'esri-bare', urls: [TILE_SOURCES[1].urls[0]], filter: 'sepia(1) hue-rotate(180deg) saturate(0.8) brightness(0.6) contrast(1.15)' },
];
export const BARE_LIGHT_TILE_SOURCES: TileSource[] = [{ ...LIGHT_TILE_SOURCES[1], name: 'esri-light-bare', urls: [LIGHT_TILE_SOURCES[1].urls[0]] }];

/** The sources for a look: night (dark) or day (light), with or without place labels. */
export function tileSources(appearance: 'light' | 'dark' = 'dark', labels = true): TileSource[] {
  if (!labels) return appearance === 'light' ? BARE_LIGHT_TILE_SOURCES : BARE_TILE_SOURCES;
  return appearance === 'light' ? LIGHT_TILE_SOURCES : TILE_SOURCES;
}

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

/**
 * The credit's short form for the map corner ("© Stadia · OSM"): any screen credit before the
 * tiles' (e.g. "Data: DVSA"), the first holder's first word, and OSM when OpenStreetMap is
 * credited. The full line shows on tap.
 */
export function shortCredit(line: string): string {
  const at = line.indexOf('©');
  if (at < 0) return line;
  const prefix = line.slice(0, at).replace(/[\s·]+$/, '');
  const first = line.slice(at + 1).trim().split(/[\s,©·]+/)[0];
  const osm = /openstreetmap/i.test(line) && !/openstreetmap/i.test(first);
  const short = osm ? `© ${first} · OSM` : `© ${first}`;
  return prefix ? `${prefix} · ${short}` : short;
}
