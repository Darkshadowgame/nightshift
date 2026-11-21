/**
 * Theme contrast (docs/DESIGN-SYSTEM.md): every text, icon and control pair in both palettes meets
 * WCAG AA (4.5:1 for text, 3:1 for control borders), the brand green stays a fill with ink on it in
 * both modes, and red/amber stay apart from the brand green. Also covers the live-token switch.
 */
import { tabLabelStyle } from '../src/lib/tabLabel';
import { applyTheme, COLOR, contrast, EVENT_COLOURS, getThemeMode, inkFor, LAYER, PALETTE, themedStyles, type ThemeMode } from '../src/theme';

const MODES: ThemeMode[] = ['dark', 'light'];
const SODIUM = '#95d600';
const INK = '#0a0a0a';
const COLOR_BADGE = COLOR.badge;

function hue(hex: string): number {
  const n = parseInt(hex.slice(1, 7), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => v / 255);
  const max = Math.max(r, g, b);
  const d = max - Math.min(r, g, b);
  if (d === 0) return 0;
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return (h * 60 + 360) % 360;
}
const hueGap = (a: string, b: string) => {
  const d = Math.abs(hue(a) - hue(b));
  return Math.min(d, 360 - d);
};

describe.each(MODES)('%s palette', (mode) => {
  const p = PALETTE[mode];
  const surfaces = { bg: p.bg, card: p.card, raised: p.raised };

  it.each(Object.entries(surfaces))('text and secondary text read on %s', (_n, bg) => {
    expect(contrast(p.text, bg)).toBeGreaterThanOrEqual(7);
    expect(contrast(p.muted, bg)).toBeGreaterThanOrEqual(4.5);
  });

  it.each(Object.entries(surfaces))('brand green as ink reads on %s', (_n, bg) => {
    expect(contrast(p.brandInk, bg)).toBeGreaterThanOrEqual(4.5);
  });

  it.each(Object.entries(surfaces))('state colours read as text on %s', (_n, bg) => {
    for (const c of [p.success, p.warning, p.danger, p.info]) expect(contrast(c, bg)).toBeGreaterThanOrEqual(4.5);
  });

  it('control borders are 3:1 on the page and the card', () => {
    expect(contrast(p.borderStrong, p.bg)).toBeGreaterThanOrEqual(3);
    expect(contrast(p.borderStrong, p.card)).toBeGreaterThanOrEqual(3);
  });

  it('class metals read on the page and the card', () => {
    for (const c of Object.values(p.class)) {
      expect(contrast(c, p.bg)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(c, p.card)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('ink on the brand fill and on the solid state fills is AA', () => {
    expect(contrast(INK, SODIUM)).toBeGreaterThanOrEqual(7);
    expect(contrast(INK, '#ff4d4d')).toBeGreaterThanOrEqual(4.5);
    expect(contrast(INK, '#5fe08f')).toBeGreaterThanOrEqual(4.5);
  });

  it('badge text reads on the badge', () => {
    expect(contrast(COLOR_BADGE.fg, COLOR_BADGE.bg)).toBeGreaterThanOrEqual(4.5);
  });

  it('red and amber stay apart from the brand green', () => {
    for (const c of [p.danger, p.warning, p.liveDot, COLOR_BADGE.bg]) expect(hueGap(c, p.brandInk)).toBeGreaterThanOrEqual(30);
    expect(hueGap(p.danger, p.warning)).toBeGreaterThanOrEqual(15);
  });

  it('the chat bubble you sent holds its text', () => {
    const own = p.chatOwn;
    expect(contrast(p.text, own)).toBeGreaterThanOrEqual(7);
  });
});

describe('light palette specifics', () => {
  it('uses a darker green than the fill for green text (AA on the page)', () => {
    expect(PALETTE.light.brandInk.toLowerCase()).not.toBe(SODIUM);
    expect(contrast(SODIUM, PALETTE.light.bg)).toBeLessThan(4.5); // why the dark green exists
    expect(contrast(PALETTE.light.brandInk, PALETTE.light.bg)).toBeGreaterThanOrEqual(4.5);
  });
  it('dark mode keeps #95d600 for green text', () => {
    expect(PALETTE.dark.brandInk.toLowerCase()).toBe(SODIUM);
  });
});

describe('live tokens', () => {
  afterEach(() => applyTheme('dark'));

  it('applyTheme rewrites COLOR in place and themedStyles follows', () => {
    const ref = COLOR.surface;
    const st = themedStyles(() => ({ box: { backgroundColor: COLOR.surface.bg } }));
    expect(st.box.backgroundColor).toBe(PALETTE.dark.bg);
    applyTheme('light');
    expect(getThemeMode()).toBe('light');
    expect(COLOR.surface).toBe(ref);
    expect(COLOR.surface.bg).toBe(PALETTE.light.bg);
    expect(st.box.backgroundColor).toBe(PALETTE.light.bg);
    expect(COLOR.action.selected).toBe(PALETTE.light.brandInk);
    expect(COLOR.action.primary).toBe(SODIUM);
    applyTheme('dark');
    expect(st.box.backgroundColor).toBe(PALETTE.dark.bg);
  });

  it('never writes into the palettes it builds from', () => {
    const before = JSON.stringify(PALETTE);
    applyTheme('light');
    applyTheme('dark');
    applyTheme('light');
    expect(JSON.stringify(PALETTE)).toBe(before);
    expect(COLOR.media.class.B).toBe(PALETTE.dark.class.B);
  });

  it('keeps the brand fill and layer pins the same in both modes', () => {
    const dark = JSON.stringify(LAYER);
    applyTheme('light');
    expect(JSON.stringify(LAYER)).toBe(dark);
    expect(COLOR.action.primary).toBe(SODIUM);
    expect(COLOR.action.onPrimary).toBe(INK);
  });

  it('inkFor darkens a layer hue to read as text in light mode and leaves dark mode alone', () => {
    expect(inkFor(LAYER.drive)).toBe(LAYER.drive);
    applyTheme('light');
    for (const hex of Object.values(LAYER)) {
      expect(contrast(inkFor(hex), PALETTE.light.card)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(inkFor(hex), PALETTE.light.raised)).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe('bottom tab labels (both themes)', () => {
  afterEach(() => applyTheme('dark'));

  it('the label style carries no colour key, so the bar paints the tint (an undefined colour fell back to black on iOS)', () => {
    expect('color' in tabLabelStyle()).toBe(false);
  });

  it.each(MODES)('active and inactive tab tints are AA on the %s tab bar', (mode) => {
    applyTheme(mode);
    expect(contrast(COLOR.text.secondary, COLOR.surface.bg)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(COLOR.action.selected, COLOR.surface.bg)).toBeGreaterThanOrEqual(4.5);
  });
});

describe('meet type colours', () => {
  const types = ['meet', 'cruise', 'rolling', 'show', 'trackday'] as const;
  const colours = types.map((t) => EVENT_COLOURS[t]);

  it('each type has its own colour, and meet stays the brand green', () => {
    expect(new Set(colours).size).toBe(types.length);
    expect(EVENT_COLOURS.meet.toLowerCase()).toBe(SODIUM);
  });

  it.each(types)('dark ink reads on the %s pin fill', (t) => {
    expect(contrast(INK, EVENT_COLOURS[t])).toBeGreaterThanOrEqual(4.5);
  });

  it('cruise and rolling stay clear of red, the live dot and the Tracks orange, and from each other', () => {
    for (const mode of MODES) {
      for (const c of [EVENT_COLOURS.cruise, EVENT_COLOURS.rolling]) {
        for (const other of [PALETTE[mode].danger, PALETTE[mode].liveDot, LAYER.camera, LAYER.track]) expect(hueGap(c, other)).toBeGreaterThanOrEqual(15);
      }
    }
    expect(hueGap(EVENT_COLOURS.cruise, EVENT_COLOURS.rolling)).toBeGreaterThanOrEqual(30);
  });
});
