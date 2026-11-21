/** Slipstream's theme: the palettes, the live token objects and the helpers are below `tint`. */
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

// ===========================================================================
// Theme layer. Every colour in the app comes from here and nothing else.
//
// Two palettes (dark: the original late-night look; light: off-white with a faint green-grey
// tint). `applyTheme(mode)` rebuilds the token objects below IN PLACE, so `COLOR.surface.bg` is
// always the live value and a screen never asks "which mode am I in". The root (ThemeProvider in
// src/lib/theme.tsx) calls it before rendering and remounts the tree when the mode flips, so
// screens never keep a stale colour. Module-level StyleSheets use `themedStyles` (below) for the
// same reason.
//
// The brand green has two jobs, and they are never mixed:
//   FILL  `C.sodium` / `BRAND` (#95d600, both modes): the primary button, selected chips and
//         segments, switches, the route line's dark-mode colour, pins. Always with ink (#0a0a0a)
//         on top (11:1).
//   INK   `COLOR.action.selected`: green used as text, an icon, a border or an underline. Dark mode
//         keeps #95d600; light mode uses a darker green that passes AA on every light surface.
// ===========================================================================

export type ThemeMode = 'dark' | 'light';

/** The brand fill. Same in both modes. */
const SODIUM = '#95d600';
/** Text on the brand green. */
const INK = '#0a0a0a';

type Palette = {
  bg: string; card: string; raised: string; raisedHi: string; media: string;
  border: string; borderStrong: string;
  glass: string; glassRaised: string; scrim: string;
  text: string; muted: string;
  /** The brand green as text, icons, borders. */
  brandInk: string;
  success: string; warning: string; danger: string; info: string; live: string; liveDot: string;
  class: { S: string; A: string; B: string; C: string; D: string };
  chatOwn: string; chatOwnBorder: string;
  shadow: string; shadowDeep: string; shadowSheet: string; shadowBar: string;
  /** Route lines on the map. */
  routeLine: string;
};

const PALETTES: Record<ThemeMode, Palette> = {
  dark: {
    bg: '#0b0f17', card: '#131a26', raised: '#1d2636', raisedHi: '#2a3446', media: '#111827',
    border: '#1d2636', borderStrong: '#64748f',
    glass: 'rgba(11,15,23,0.92)', glassRaised: 'rgba(19,26,38,0.97)', scrim: 'rgba(5,7,12,0.6)',
    text: '#e9edf4', muted: '#8a97ad',
    brandInk: SODIUM,
    success: '#5fe08f', warning: '#ffb547', danger: '#ff4d4d', info: '#9db4d6', live: '#ffffff', liveDot: '#ff3b5c',
    class: { S: '#e7c6ff', A: '#f2c14e', B: '#d5dbe5', C: '#d39a6a', D: '#8c9bb0' },
    chatOwn: '#24426e', chatOwnBorder: '#9db4d699',
    shadow: 'rgba(0,0,0,0.4)', shadowDeep: 'rgba(0,0,0,0.6)', shadowSheet: 'rgba(0,0,0,0.5)', shadowBar: 'rgba(0,0,0,0.45)',
    routeLine: SODIUM,
  },
  light: {
    bg: '#eef2e9', card: '#f8faf5', raised: '#e4eadc', raisedHi: '#d8dfce', media: '#dfe5d6',
    border: '#cdd5c3', borderStrong: '#7b8770',
    glass: 'rgba(248,250,245,0.94)', glassRaised: 'rgba(248,250,245,0.98)', scrim: 'rgba(16,21,12,0.45)',
    text: '#10150c', muted: '#4a5543',
    brandInk: '#3f6400',
    success: '#17703a', warning: '#8a5300', danger: '#c42626', info: '#3d5a85', live: '#10150c', liveDot: '#d92548',
    class: { S: '#7a3fb0', A: '#8a6200', B: '#4d5a6e', C: '#8a5628', D: '#5c6a7e' },
    chatOwn: '#d3e2f5', chatOwnBorder: '#3d5a8599',
    shadow: 'rgba(16,21,12,0.16)', shadowDeep: 'rgba(16,21,12,0.24)', shadowSheet: 'rgba(16,21,12,0.2)', shadowBar: 'rgba(16,21,12,0.16)',
    routeLine: '#3f6400',
  },
};

/** The route line for a map of this look: the brand fill on a dark map, a darker green on a light one (a fill green vanishes on pale streets). */
export const routeFor = (look: ThemeMode) => PALETTES[look].routeLine;

/** Exported for the contrast test and the component gallery. */
export const PALETTE = PALETTES;

/** Fixed hues: the same in both modes (map layers, the layer pins' fills). */
const FIXED = {
  neon: '#3fd6ff',
  magenta: '#ff4fa3',
  lime: '#ff9a2e',
  /** The Speed cameras layer. */
  redFill: '#ff4d4d',
  chalk: '#e9edf4',
};

function build(mode: ThemeMode) {
  const p = PALETTES[mode];

  const C = {
    asphalt: p.bg,
    tarmac: p.card,
    kerb: p.raised,
    kerbHi: p.raisedHi,
    fog: p.muted,
    chalk: p.text,
    sodium: SODIUM,
    /** The Drives layer colour. Not a button or state colour. */
    neon: FIXED.neon,
    /** The Photos layer colour. */
    magenta: FIXED.magenta,
    /** The Tracks layer colour (orange, the old brand accent, now free). */
    lime: FIXED.lime,
    /** Danger and errors as text and icons (themed). */
    alert: p.danger,
    /** Text on the brand green. */
    ink: INK,
  };

  const LAYER = {
    /** Meets, cruises and rolling meets. */
    event: SODIUM,
    /** Shows: blue, not the photo spots' magenta. */
    show: '#5c9dff',
    /** Track days: chequered-flag white, not the tracks' lime. */
    trackday: FIXED.chalk,
    photo: FIXED.magenta,
    drive: FIXED.neon,
    track: FIXED.lime,
    /** Meet spots (cafés and museums that welcome meets): mint, not the events' green. */
    venue: '#2fe0b0',
    shop: '#b48cff',
    partner: '#ffd23f',
    camera: FIXED.redFill,
    /** Road reports: coral, not the cameras' red or the events' orange. */
    road: '#ff7a59',
    /** Community posts with a place: a soft violet-blue, not the shops' purple. */
    post: '#8fb4ff',
  };

  const STATE = {
    /** Live now: bright white with a red dot and the pulse (motion.tsx); near-black on the light theme. */
    live: p.live,
    liveDot: p.liveDot,
    /** Checked in, saved, going, passed checkpoints, still there. */
    success: p.success,
    /** "Before you go", ban zones, waiting for an answer. */
    warning: p.warning,
    /** Errors and destructive actions. */
    danger: p.danger,
    /** Neutral notices and invitations. */
    info: p.info,
    /** A chip or segment that's on: the brand fill, one for every chip. */
    selected: SODIUM,
  };

  const CLASS = { ...p.class };

  const SURFACE = {
    bg: p.bg,
    surface: p.card,
    raised: p.raised,
    /** Map chrome over the map (pills, round buttons, the credit). */
    glass: p.glass,
    /** Cards and menus floating over the map. */
    glassRaised: p.glassRaised,
    /** The map's bottom sheet: solid, so pins never show through its text (REVIEW-8). */
    sheet: p.card,
    /** Dimming behind a sheet or modal. */
    scrim: p.scrim,
    border: p.border,
    /** Inputs and anything that must be seen as a control: 3:1 or better on the page and card colours. */
    borderStrong: p.borderStrong,
  };

  const TEXT = { text: p.text, muted: p.muted, onAction: INK };

  const COLOR = {
    action: {
      /** The brand FILL: the primary button, selected chips, switches. Text on it is `onPrimary`. */
      primary: SODIUM,
      onPrimary: INK,
      /** Text links and tertiary buttons: the text colour (Redesign 2, 5.4). */
      link: p.text,
      /** The brand as text, icon, border or underline (a selected tab, a selected segment's label, a focus ring). */
      selected: p.brandInk,
      selectedTint: tint(SODIUM),
      disabledBorder: line(SODIUM),
      destructive: p.danger,
    },
    text: {
      primary: p.text,
      secondary: p.muted,
      emphasis: p.text,
      info: p.info,
      onAction: INK,
      disabled: p.muted,
      /** The brand green as text (the wordmark's STREAM, "brand" tone). */
      brand: p.brandInk,
    },
    surface: {
      bg: p.bg,
      card: p.card,
      raised: p.raised,
      raisedHi: p.raisedHi,
      /** Behind photos and build art while they load. */
      media: p.media,
      glass: p.glass,
      glassRaised: p.glassRaised,
      sheet: p.card,
      scrim: p.scrim,
      border: p.border,
      borderStrong: p.borderStrong,
      skeleton: p.raised,
      /** The one gradient over photos (transparent → near-black at 90%), bottom to top under titles. Photos are dark-ish in both modes. */
      photoFade: ['rgba(11,15,23,0)', 'rgba(11,15,23,0.9)'] as [string, string],
    },
    /**
     * Anything drawn on a photo is fixed (light text on a dark glass), whatever the theme: a photo is
     * the same photo in both modes. DsText switches to these inside `<OnMedia>`.
     */
    media: {
      text: '#e9edf4',
      muted: '#aab4c6',
      pill: 'rgba(11,15,23,0.92)',
      pillBorder: 'rgba(233,237,244,0.28)',
      /** Status colours and class metals on that dark glass: the dark palette's, in both modes. */
      state: { success: PALETTES.dark.success, warning: PALETTES.dark.warning, danger: PALETTES.dark.danger, info: PALETTES.dark.info, live: PALETTES.dark.live, liveDot: PALETTES.dark.liveDot },
      class: { ...PALETTES.dark.class },
      /** Scrim on the sign-in photo: light at the top, darker under the words. */
      heroScrim: ['rgba(5,7,12,0.2)', 'rgba(5,7,12,0.6)'] as [string, string],
    },
    state: {
      live: p.live,
      liveDot: p.liveDot,
      success: p.success,
      warning: p.warning,
      danger: p.danger,
      info: p.info,
    },
    /** Solid fills carrying ink text (an End button, a Yes button): the bright hues in both modes, 5.9:1 with ink. */
    fill: { danger: FIXED.redFill, success: '#5fe08f' },
    classMetal: CLASS,
    /** Number badges (unread messages, requests, notices): red, never sodium (Redesign 2, 4.8). */
    badge: { bg: '#d92548', fg: '#ffffff' },
    layer: LAYER,
    /** Avatars: a person is not an action, so never sodium. */
    avatar: { bg: p.raised, fg: p.text, border: p.raisedHi },
    /** Chat bubbles: yours a tinted blue, theirs the raised grey (REVIEW-10: yours read as grey too). */
    chat: { own: p.chatOwn, ownBorder: p.chatOwnBorder, theirs: p.raised, theirsBorder: p.borderStrong },
    /** Build card colours (not layer hexes): real paint, the same in both modes. */
    paint: ['#e9edf4', '#1b1f27', '#c8102e', '#1f4fa8', '#f2c14e', '#2f7d4f', '#7a7f8a', '#e86a1c'],
    /** Lines drawn on the maps. */
    map: { route: p.routeLine, /** Meet-ban outlines: amber on either map (fixed). */ ban: '#ffb547' },
  };

  const ELEVATION = {
    flat: {},
    /** Map chrome, toasts, a card floating over the map. */
    float: { boxShadow: `0px 3px 10px ${p.shadow}` },
    /** Toasts: a deeper shadow than map chrome, so a toast floats clear of the cards under it. */
    toast: { boxShadow: `0px 6px 20px ${p.shadowDeep}` },
    /** Bottom sheets. */
    sheet: { boxShadow: `0px -4px 16px ${p.shadowSheet}` },
    /** The ActionBar pinned to the bottom of a detail screen or form. */
    bar: { boxShadow: `0px -2px 12px ${p.shadowBar}` },
  };

  return { C, LAYER, STATE, CLASS, SURFACE, TEXT, COLOR, ELEVATION };
}

const initial = build('dark');

/**
 * Colour roles. `C` keeps the role names (asphalt = page, tarmac = card, kerb = raised, chalk =
 * text, fog = secondary text) whatever the mode; prefer `COLOR`.
 * Pick by role, not by hue:
 *   BRAND / ACTION  sodium fill: the one primary button and "selected" (segment, chip, tab).
 *   LAYER           map layers and place identity only (pins, place headers, the layer bar).
 *   STATE           live, success, warning, danger, info: never a layer colour.
 *   CLASS           the S–D ramp for class badges.
 *   SURFACE         backgrounds, glass overlays, scrims and borders.
 */
export const C = initial.C;
/** The one brand fill: the primary button and selected states (and the wordmark's STREAM on dark). Never text on a light surface: use `COLOR.action.selected`. */
export const BRAND = SODIUM;
export const LAYER = initial.LAYER;
export const STATE = initial.STATE;
export const CLASS = initial.CLASS;
export const SURFACE = initial.SURFACE;
export const TEXT = initial.TEXT;
/**
 * Semantic colour roles. Pick by role, never by hue.
 * - action: `primary` is the fill (with `onPrimary` on it); `selected` is the brand as ink.
 * - text: primary, secondary (fog), `info` for neutral notes.
 * - surface: page, card, raised, media, glass, scrim, borders.
 * - media: text and glass drawn on photos (fixed).
 * - state: live, success, warning, danger, info. Never a layer colour.
 * - classMetal: the S–D class ladder. Only on ClassBadge.
 * - layer: map and place identity. Only on pins, the layers panel and an entity's kind eyebrow
 *   (through `inkFor` when used as text).
 */
export const COLOR = initial.COLOR;
export const ELEVATION = initial.ELEVATION;

let mode: ThemeMode = 'dark';
let version = 0;
const listeners = new Set<() => void>();

function assignDeep(target: unknown, source: unknown) {
  const t = target as Record<string, unknown>;
  const s = source as Record<string, unknown>;
  for (const key of Object.keys(s)) {
    const v = s[key];
    if (v && typeof v === 'object') assignDeep(t[key], v);
    else t[key] = v;
  }
}

/** Switch the live tokens. Cheap and idempotent: call it as often as you like. */
export function applyTheme(next: ThemeMode) {
  if (next === mode) return;
  const built = build(next);
  assignDeep(C, built.C);
  assignDeep(LAYER, built.LAYER);
  assignDeep(STATE, built.STATE);
  assignDeep(CLASS, built.CLASS);
  assignDeep(SURFACE, built.SURFACE);
  assignDeep(TEXT, built.TEXT);
  assignDeep(COLOR, built.COLOR);
  assignDeep(ELEVATION, built.ELEVATION);
  mode = next;
  version += 1;
  listeners.forEach((l) => l());
}

export const getThemeMode = (): ThemeMode => mode;
/** Bumps on every switch (themedStyles uses it to rebuild). */
export const themeVersion = () => version;
export function subscribeTheme(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

/**
 * A module-level StyleSheet that follows the theme:
 *   const st = themedStyles(() => StyleSheet.create({ box: { backgroundColor: COLOR.surface.card } }));
 * `st.box` is rebuilt the first time it is read after a theme switch.
 */
export function themedStyles<T extends object>(make: () => T): T {
  let seen = -1;
  let cache: T;
  const get = () => {
    if (seen !== version) {
      cache = make();
      seen = version;
    }
    return cache;
  };
  return new Proxy({} as T, {
    get: (_t, key) => (get() as Record<string | symbol, unknown>)[key],
    has: (_t, key) => key in (get() as object),
    ownKeys: () => Reflect.ownKeys(get()),
    getOwnPropertyDescriptor: (_t, key) => (key in (get() as object) ? { enumerable: true, configurable: true, value: (get() as Record<string | symbol, unknown>)[key] } : undefined),
  });
}

// ---- contrast helpers (also used by the tests) ----
const lin = (v: number) => {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};
export function luminance(hex: string): number {
  const n = parseInt(hex.slice(1, 7), 16);
  return 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
}
export function contrast(a: string, b: string): number {
  const x = luminance(a);
  const y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
const toHex = (r: number, g: number, b: number) => `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;
const memo = new Map<string, string>();
/**
 * A layer or brand hue used as TEXT or a thin icon: itself on dark, and on the light theme darkened
 * (same hue) until it reads 4.5:1 on the card and the page. Fills (pins, chips) use the hue as is.
 */
export function inkFor(hex: string): string {
  if (mode === 'dark' || !/^#[0-9a-f]{6}$/i.test(hex)) return hex;
  const key = `${mode}${hex}`;
  const hit = memo.get(key);
  if (hit) return hit;
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255;
  let g = (n >> 8) & 255;
  let b = n & 255;
  const need = (c: string) => contrast(c, PALETTES.light.raised) >= 4.5;
  let out = hex;
  for (let i = 0; i < 40 && !need(out); i += 1) {
    r *= 0.93;
    g *= 0.93;
    b *= 0.93;
    out = toHex(r, g, b);
  }
  memo.set(key, out);
  return out;
}

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
  ink: '#0b0f17',
  /** Wheels and shadows in build art. */
  shadow: '#070a10',
  /** Bodywork in build art. */
  body: '#1d2636',
  /** The web preview's map: background and grid. */
  mapBg: '#080c13',
  /** The same for the day (light) map. */
  mapBgLight: '#e9ebee',
  /** The route preview's other options, under the chosen one (grey on either map). */
  routeOther: '#8a93a3',
  mapGrid: '#141c2a',
  mapGridLight: '#d3d8d0',
  /** The web map's "you" dot: Apple's location blue, as on every phone map (Review 21 problem 5). */
  you: '#0a84ff',
  /** The accuracy ring round it. */
  youHalo: 'rgba(10,132,255,0.18)',
  youRing: 'rgba(10,132,255,0.35)',
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
  /**
   * The title of a narrow card (a two-column grid: the vote sheet), as typed. Smaller so a long
   * word ("Competition", "Volkswagen") fits its column at 1.3x text and wraps by words, never cut
   * mid-word (Review 13).
   */
  titleSm: { fontFamily: F.displayMed, fontSize: 15, lineHeight: 19, scale: 'body' },
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
