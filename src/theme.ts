/**
 * Late-night city palette. The app is dark only, by design.
 *
 * Colour has fixed roles (REVIEW-5 B2). Pick by role, not by hue:
 *   BRAND / ACTION  sodium: the one primary button and "selected" (segment, chip, tab). Nothing else
 *                   (Redesign 2, 5.4): links are chalk, eyebrows fog, badges red.
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

/** The one brand and action colour: the primary button and selected states (and the wordmark). */
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
  /** Community posts with a place: a soft violet-blue, not the shops' purple. */
  post: '#8fb4ff',
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
  /** The map's bottom sheet: the glassRaised colour, solid, so pins never show through its text (REVIEW-8). */
  sheet: '#131a26',
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
 * @deprecated v1 type sizes (the old `Txt` kit is gone). Use `TYPE_SCALE` through `DsText` or
 * `typeStyle()`; a few drawings (map labels, pins) still read these sizes.
 */
export const TYPE = { display: 28, title: 20, heading: 16, body: 15, muted: 14, caption: 13, label: 12, micro: 11, mono: 13 } as const;

/** The driving view keeps its own big scale. */
export const DRIVE_TYPE = { banner: 38, speed: 44, readout: 22, body: 17 } as const;

/**
 * Larger iOS text: body text scales fully; dense chrome caps out so it can't
 * clip (map pills, HUD, tags, stat tiles). The driving view caps lower: its text is already big.
 */
export const FONT_SCALE = { chrome: 1.3, drive: 1.2 } as const;

// ===========================================================================
// Design system v2 tokens (docs/DESIGN-SYSTEM.md). New code uses only these.
// ===========================================================================

/** 4-pt spacing scale. `screen` is the page gutter, `section` the gap between Sections. */
export const SPACING = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
  screen: 16,
  section: 24,
} as const;
export type SpaceToken = keyof typeof SPACING;

/** Corner radii, one per job. Nothing else: no 6, 10, 20. */
export const RADII = {
  /** Tags, class badges. */
  tag: 4,
  /** Buttons, inputs, chips, segmented controls, list-row press areas. */
  control: 8,
  /** Cards, map embeds, stat tiles, toasts. */
  card: 12,
  /** The top corners of a bottom sheet. */
  sheet: 16,
  /** Search fields, unread counts, round buttons. */
  pill: 999,
} as const;

/** Alpha helpers (hex colours only). The only three alphas: no other suffixes. */
export const tint = (hex: string) => `${hex}1f`;
export const line = (hex: string) => `${hex}40`;
export const outline = (hex: string) => `${hex}99`;

/**
 * Semantic colour roles. Pick by role, never by hue.
 * - action: things you can tap or that are selected. Sodium means "tap this" or "on", nothing else.
 * - text: chalk for text, fog for secondary, `info` for neutral notes, `emphasis` for "you can go" style
 *   notes that used to be sodium.
 * - surface: page, card, raised, media, glass, scrim, borders.
 * - state: live, success, warning, danger, info. Never a layer colour.
 * - classMetal: the S–D class ladder. Only on ClassBadge.
 * - layer: map and place identity. Only on pins, the layers panel, an entity's kind eyebrow and accent.
 * - avatar: chalk on kerb. A person is not an action, so never sodium.
 * - paint: build card colours (not layer hexes).
 */
export const COLOR = {
  action: {
    primary: C.sodium,
    onPrimary: C.ink,
    /** Text links and tertiary buttons: chalk (Redesign 2, 5.4). Sodium is only the primary and "selected". */
    link: C.chalk,
    selected: C.sodium,
    selectedTint: tint(C.sodium),
    disabledBorder: line(C.sodium),
    destructive: C.alert,
  },
  text: {
    primary: C.chalk,
    secondary: C.fog,
    emphasis: C.chalk,
    info: STATE.info,
    onAction: C.ink,
    disabled: C.fog,
  },
  surface: {
    bg: SURFACE.bg,
    card: SURFACE.surface,
    raised: SURFACE.raised,
    raisedHi: C.kerbHi,
    /** Behind photos and build art while they load. */
    media: '#111827',
    glass: SURFACE.glass,
    glassRaised: SURFACE.glassRaised,
    sheet: SURFACE.sheet,
    scrim: SURFACE.scrim,
    border: SURFACE.border,
    /** Inputs and anything that must read as a control: 3:1 or better. */
    borderStrong: SURFACE.borderStrong,
    skeleton: C.kerb,
    /** The one gradient over photos (transparent → asphalt at 90%), bottom to top under titles. */
    photoFade: ['rgba(11,15,23,0)', 'rgba(11,15,23,0.9)'],
  },
  state: {
    live: STATE.live,
    liveDot: STATE.liveDot,
    success: STATE.success,
    warning: STATE.warning,
    danger: STATE.danger,
    info: STATE.info,
  },
  classMetal: CLASS,
  /** Number badges (unread messages, requests, notices): red, never sodium (Redesign 2, 4.8). */
  badge: { bg: STATE.liveDot, fg: '#ffffff' },
  layer: LAYER,
  avatar: { bg: C.kerb, fg: C.chalk, border: C.kerbHi },
  /** Chat bubbles: yours a solid blue, theirs the raised grey (REVIEW-10: yours read as grey too). */
  chat: { own: '#24426e', ownBorder: outline(STATE.info), theirs: SURFACE.raised, theirsBorder: SURFACE.borderStrong },
  paint: ['#e9edf4', '#1b1f27', '#c8102e', '#1f4fa8', '#f2c14e', '#2f7d4f', '#7a7f8a', '#e86a1c'],
} as const;

/**
 * Fixed colours that aren't roles, for drawings rather than UI: a real UK speed-limit sign (it
 * looks the same whatever the theme), the ink inside pins, icons and build art, and the web
 * preview's plain map. Never use these for text, surfaces or controls.
 */
export const ART = {
  signWhite: '#ffffff',
  signRed: '#d61f1f',
  signBlack: '#111111',
  /** Glyphs and labels drawn on a filled pin or icon. */
  ink: C.asphalt,
  /** Wheels and shadows in build art. */
  shadow: '#070a10',
  /** Bodywork in build art. */
  body: C.kerb,
  /** The web preview's map: background and grid. */
  mapBg: '#080c13',
  mapGrid: '#141c2a',
  /** A speed camera with no known limit: the camera layer, dimmed. */
  cameraDim: '#c45a5a',
  /** Native shadows (iOS shadowColor). */
  black: '#000000',
} as const;

type TypeStyle = {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  letterSpacing?: number;
  /** Chrome is uppercase; content never is. */
  caps?: boolean;
  /** How far the iOS text size can grow it: body text fully, chrome capped at FONT_SCALE.chrome, the driving view at FONT_SCALE.drive. */
  scale: 'body' | 'chrome' | 'drive';
  tabular?: boolean;
};

/**
 * The v2 type scale. Content (titles, names, places, messages) is never uppercased;
 * capitals are for chrome only (headers, eyebrows, labels, buttons, tags).
 */
export const TYPE_SCALE = {
  /** Hero titles of app-made things only (screen names, trophies). */
  display: { fontFamily: F.displayItalic, fontSize: 28, lineHeight: 32, caps: true, scale: 'chrome' },
  /** Screen header titles. */
  heading: { fontFamily: F.display, fontSize: 17, lineHeight: 22, caps: true, scale: 'chrome' },
  /** Titles on photos (Hero, the sign-in tagline): upright, as typed, never caps. */
  hero: { fontFamily: F.display, fontSize: 30, lineHeight: 34, scale: 'chrome' },
  /** Hero titles of user content (an event, a build, a place), as typed. */
  titleLg: { fontFamily: F.displayMed, fontSize: 24, lineHeight: 29, scale: 'body' },
  /** Content titles in rows and cards, as typed. */
  title: { fontFamily: F.displayMed, fontSize: 18, lineHeight: 23, scale: 'body' },
  body: { fontFamily: F.body, fontSize: 15, lineHeight: 21, scale: 'body' },
  bodyStrong: { fontFamily: F.bodyBold, fontSize: 15, lineHeight: 21, scale: 'body' },
  secondary: { fontFamily: F.body, fontSize: 14, lineHeight: 19, scale: 'body' },
  caption: { fontFamily: F.body, fontSize: 13, lineHeight: 17, scale: 'body' },
  /** One-line facts: "Tonight 22:30 · 7 going · 3.2 mi". Keeps its case, tabular figures. Barlow, not the
   * condensed label face: at 13 px the condensed "mi" read as "ml" (REVIEW-11). */
  meta: { fontFamily: F.bodyMed, fontSize: 13, lineHeight: 17, letterSpacing: 0.2, scale: 'chrome', tabular: true },
  /** Field labels, stat labels. */
  label: { fontFamily: F.label, fontSize: 12, lineHeight: 16, letterSpacing: 1.0, caps: true, scale: 'chrome' },
  /** Section titles and an entity's kind. Fog (`text.secondary`) by default; a layer colour only for an event's or place's kind. */
  eyebrow: { fontFamily: F.labelBold, fontSize: 12, lineHeight: 16, letterSpacing: 1.5, caps: true, scale: 'chrome' },
  button: { fontFamily: F.labelBold, fontSize: 15, lineHeight: 19, letterSpacing: 2, caps: true, scale: 'chrome' },
  buttonSm: { fontFamily: F.labelBold, fontSize: 13, lineHeight: 17, letterSpacing: 1.4, caps: true, scale: 'chrome' },
  buttonLg: { fontFamily: F.labelBold, fontSize: 18, lineHeight: 22, letterSpacing: 2, caps: true, scale: 'chrome' },
  tag: { fontFamily: F.labelBold, fontSize: 11, lineHeight: 14, letterSpacing: 1, caps: true, scale: 'chrome' },
  input: { fontFamily: F.body, fontSize: 16, lineHeight: 21, scale: 'body' },
  stat: { fontFamily: F.display, fontSize: 20, lineHeight: 24, scale: 'chrome', tabular: true },

  // The driving view (drive.tsx, DriveHud, RoadReportControls): big, glanceable, capped at FONT_SCALE.drive.
  /** The turn arrow glyph. */
  driveArrow: { fontFamily: F.display, fontSize: 66, lineHeight: 72, scale: 'drive' },
  /** Your speed. */
  driveSpeed: { fontFamily: F.display, fontSize: DRIVE_TYPE.speed, lineHeight: 48, scale: 'drive', tabular: true },
  /** The distance to the next turn. */
  driveDistance: { fontFamily: F.display, fontSize: DRIVE_TYPE.banner, lineHeight: 42, scale: 'drive', tabular: true },
  /** The next turn's road, the then-arrow. */
  driveTitle: { fontFamily: F.bodyBold, fontSize: 24, lineHeight: 29, scale: 'drive' },
  /** The road you're on; report tiles and prompts. */
  driveRoad: { fontFamily: F.bodyBold, fontSize: DRIVE_TYPE.readout, lineHeight: 27, scale: 'drive' },
  /** Arrive, to go, time. */
  driveReadout: { fontFamily: F.display, fontSize: DRIVE_TYPE.readout, lineHeight: 27, scale: 'drive', tabular: true },
  /** Lines and notices in the driving view. */
  driveBody: { fontFamily: F.bodyBold, fontSize: DRIVE_TYPE.body, lineHeight: 22, scale: 'drive' },
  /** Big buttons and titles in the driving view: END, REPORT, UNDO, DONE. */
  driveButton: { fontFamily: F.display, fontSize: 20, lineHeight: 24, letterSpacing: 1.5, caps: true, scale: 'drive' },
  /** Small caps labels in the driving view: THEN, MPH, ARRIVE. */
  driveLabel: { fontFamily: F.labelBold, fontSize: 13, lineHeight: 16, letterSpacing: 1.2, caps: true, scale: 'drive' },
} as const satisfies Record<string, TypeStyle>;
export type TypeToken = keyof typeof TYPE_SCALE;

/**
 * Elevation: only floating chrome and sheets cast a shadow. Cards on the page are flat
 * (a border, not a shadow). `boxShadow` works on iOS, Android (new architecture) and web.
 */
export const ELEVATION = {
  flat: {},
  /** Map chrome, toasts, a card floating over the map. */
  float: { boxShadow: '0px 3px 10px rgba(0,0,0,0.4)' },
  /** Toasts: a deeper shadow than map chrome, so a toast floats clear of the cards under it. */
  toast: { boxShadow: '0px 6px 20px rgba(0,0,0,0.6)' },
  /** Bottom sheets. */
  sheet: { boxShadow: '0px -4px 16px rgba(0,0,0,0.5)' },
  /** The ActionBar pinned to the bottom of a detail screen or form. */
  bar: { boxShadow: '0px -2px 12px rgba(0,0,0,0.45)' },
} as const;

/** Press feedback: one for controls, one for cards. */
export const PRESS = {
  control: { opacity: 0.8 },
  card: { opacity: 0.9, scale: 0.98 },
} as const;

/** Motion timings (ms). Reduced motion turns movement into a short fade of `fast`. */
export const MOTION = {
  fast: 150,
  base: 220,
  sheet: 280,
  toast: 3200,
  /** A button turning into a tag ("I'm going" → Going). */
  morph: 260,
  /** The gap between list items fading up on first render. */
  stagger: 30,
} as const;

/** Photo shapes (width / height) for PhotoCard and Hero: events 16:9, builds 4:3, posts 4:5. */
export const ASPECT = { event: 16 / 9, build: 4 / 3, post: 4 / 5 } as const;
export type AspectKind = keyof typeof ASPECT;

/** Minimum tap target. */
export const HIT = 44;

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

/** Community posts on the map's Posts layer. */
export const POST_COLOUR = LAYER.post;
