/**
 * Late-night city palette. The app is dark only, by design.
 *
 * Colour has fixed roles (REVIEW-5 B2). Pick by role, not by hue:
 *   BRAND / ACTION  sodium: primary buttons, links, section eyebrows, unread, selected chips.
 *   LAYER           map layers and place identity only (pins, place headers, the layer bar).
 *   STATE           live, success, warning, danger, info: never a layer colour.
 *   CLASS           the S–D ramp for class badges: its own metals, not layer or state hexes.
 *   SURFACE         backgrounds, glass overlays, scrims and borders.
 * `C` keeps the raw hues for surfaces and text; don't use `C.neon`, `C.lime` or
 * `C.magenta` directly: they are the Drives, Tracks and Photos layer colours.
 */
export const C = {
  asphalt: '#0b0f17',
  tarmac: '#131a26',
  kerb: '#1d2636',
  kerbHi: '#2a3446',
  fog: '#8a97ad',
  chalk: '#e9edf4',
  sodium: '#ff9a2e',
  /** The Drives layer colour. Not a button or state colour. */
  neon: '#3fd6ff',
  /** The Photos layer colour. */
  magenta: '#ff4fa3',
  /** The Tracks layer colour. */
  lime: '#9dfa5a',
  /** Danger and errors (also the Speed cameras layer). */
  alert: '#ff4d4d',
  /** Text on sodium. */
  ink: '#2a1300',
};

/** The one brand and action colour: primary buttons, links, eyebrows, unread, selected chips. */
export const BRAND = C.sodium;

/** Map layers and place identity. Only on the map, the layer bar, the key and a place's own header. */
export const LAYER = {
  /** Meets, cruises and rolling meets. */
  event: C.sodium,
  /** Shows: blue, not the photo spots' magenta. */
  show: '#5c9dff',
  /** Track days: chequered-flag white, not the tracks' lime. */
  trackday: C.chalk,
  photo: C.magenta,
  drive: C.neon,
  track: C.lime,
  /** Meet spots (cafés and museums that welcome meets): mint, not the events' orange. */
  venue: '#2fe0b0',
  shop: '#b48cff',
  partner: '#ffd23f',
  camera: C.alert,
  /** Road reports: coral, not the cameras' red or the events' orange. */
  road: '#ff7a59',
} as const;

/** States. None of these is a layer colour, so "live" never reads as "drive". */
export const STATE = {
  /** Live now: bright white with a red dot and the pulse (motion.tsx). */
  live: '#ffffff',
  liveDot: '#ff3b5c',
  /** Checked in, saved, going, passed checkpoints, still there. */
  success: '#5fe08f',
  /** "Before you go", ban zones, waiting for an answer. */
  warning: '#ffb547',
  /** Errors and destructive actions. */
  danger: C.alert,
  /** Neutral notices and invitations. */
  info: '#9db4d6',
  /** A chip or segment that's on: the brand colour, one for every chip. */
  selected: C.sodium,
} as const;

/** Class letters S (top) to D: a metal ladder of their own (steel, bronze, silver, gold, platinum). */
export const CLASS = {
  S: '#e7c6ff',
  A: '#f2c14e',
  B: '#d5dbe5',
  C: '#d39a6a',
  D: '#8c9bb0',
} as const;

/** Surfaces, overlays and borders. One alpha per job. */
export const SURFACE = {
  bg: C.asphalt,
  surface: C.tarmac,
  raised: C.kerb,
  /** Map chrome over the map (pills, round buttons, the credit). */
  glass: 'rgba(11,15,23,0.92)',
  /** Cards and menus floating over the map. */
  glassRaised: 'rgba(19,26,38,0.97)',
  /** Dimming behind a sheet or modal. */
  scrim: 'rgba(5,7,12,0.6)',
  border: C.kerb,
  /** Inputs and anything that must be seen as a control: 3:1 or better on asphalt and tarmac. */
  borderStrong: '#64748f',
} as const;

/** Text colours: chalk for text, fog for secondary (never on kerbHi), ink on sodium. */
export const TEXT = { text: C.chalk, muted: C.fog, onAction: C.ink } as const;

export const F = {
  display: 'ChakraPetch_700Bold',
  /** Real italic faces: iOS won't fake italics for custom fonts. Use these, not fontStyle. */
  displayItalic: 'ChakraPetch_700Bold_Italic',
  displayMedItalic: 'ChakraPetch_600SemiBold_Italic',
  displayMed: 'ChakraPetch_600SemiBold',
  body: 'Barlow_400Regular',
  bodyMed: 'Barlow_500Medium',
  bodyBold: 'Barlow_600SemiBold',
  label: 'BarlowCondensed_600SemiBold',
  labelBold: 'BarlowCondensed_700Bold',
};

/**
 * The type scale (see `Txt` in components/ui.tsx). Nothing outside the driving
 * view uses other sizes; 11 is the smallest anywhere.
 */
export const TYPE = { display: 28, title: 20, heading: 16, body: 15, muted: 14, caption: 13, label: 12, micro: 11, mono: 13 } as const;

/** The driving view keeps its own big scale. */
export const DRIVE_TYPE = { banner: 38, speed: 44, readout: 22, body: 17 } as const;

/**
 * Larger iOS text: body text scales fully; dense chrome caps out so it can't
 * clip (map pills, HUD, tags, stat tiles). The driving view caps lower: its text is already big.
 */
export const FONT_SCALE = { chrome: 1.3, drive: 1.2 } as const;

export const RADIUS = { tag: 4, card: 8, sheet: 12, pill: 999 } as const;

/** Spacing: screen padding 16, section gap 20, inside a card 8, between cards 12. */
export const SPACE = { screen: 16, section: 20, inCard: 8, between: 12, bottom: 40 } as const;

/** Map colours for events, by type. Events are drawn filled (Pin.tsx), places outlined. */
export const EVENT_COLOURS = {
  cruise: LAYER.event,
  rolling: LAYER.event,
  meet: LAYER.event,
  show: LAYER.show,
  trackday: LAYER.trackday,
} as const;

export const SPOT_COLOURS = {
  photo: LAYER.photo,
  drive: LAYER.drive,
  track: LAYER.track,
  venue: LAYER.venue,
} as const;

/** The Shops layer (OpenStreetMap listings) and partners (always labelled, see src/lib/partners.ts). */
export const SHOP_COLOUR = LAYER.shop;
export const PARTNER_COLOUR = LAYER.partner;

/** Road reports on the map and in the driving view (roadReports.ts). */
export const ROAD_COLOUR = LAYER.road;
