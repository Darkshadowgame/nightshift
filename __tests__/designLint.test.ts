/**
 * Design-system lint (docs/DESIGN-SYSTEM.md, "No literals"): screens and shared components take
 * colours from `COLOR`/`ART` and text sizes from `TYPE_SCALE` (through `DsText` or `typeStyle()`).
 * Only the design system itself (src/components/ds) and src/theme.ts may hold raw values.
 *
 * A failure names the file and line. Fix it with a token; if no token fits, add one to theme.ts.
 */
import { readdirSync, readFileSync, statSync } from 'fs';
import { join, relative } from 'path';

const ROOT = join(__dirname, '..');
const SCANNED = ['src/app', 'src/components'];
const EXCLUDED = [join('src', 'components', 'ds')];

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (EXCLUDED.some((x) => relative(ROOT, path).startsWith(x))) return [];
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(tsx?|jsx?)$/.test(name) ? [path] : [];
  });
}

/** A quoted hex colour: '#fff', "#0b0f17", '#ff9a2e99'. */
const HEX = /(['"`])#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\1/;
/** A number written straight into fontSize (a computed size like `size * 0.4` is allowed). */
const FONT_SIZE = /\bfontSize\s*:\s*-?\d/;

/** Lines that break a rule, ignoring comments. */
function offences(rule: RegExp): string[] {
  const found: string[] = [];
  for (const dir of SCANNED) {
    for (const file of sourceFiles(join(ROOT, dir))) {
      readFileSync(file, 'utf8')
        .split('\n')
        .forEach((line, i) => {
          const code = line.replace(/\/\/.*$/, '').replace(/^\s*\*.*$/, '');
          if (rule.test(code)) found.push(`${relative(ROOT, file)}:${i + 1}: ${line.trim()}`);
        });
    }
  }
  return found;
}

describe('design-system lint', () => {
  it('scans the screens and components', () => {
    expect(sourceFiles(join(ROOT, 'src/app')).length).toBeGreaterThan(20);
    expect(sourceFiles(join(ROOT, 'src/components')).length).toBeGreaterThan(20);
  });

  it('has no raw hex colours outside theme.ts and the design system', () => {
    expect(offences(HEX)).toEqual([]);
  });

  it('has no literal fontSize outside theme.ts and the design system', () => {
    expect(offences(FONT_SIZE)).toEqual([]);
  });

  it('catches what it should', () => {
    expect(HEX.test(`colour: '#0b0f17'`)).toBe(true);
    expect(HEX.test(`fill="#fff"`)).toBe(true);
    expect(HEX.test(`href: '#top'`)).toBe(false);
    expect(FONT_SIZE.test('fontSize: 11,')).toBe(true);
    expect(FONT_SIZE.test('fontSize: TYPE_SCALE.tag.fontSize')).toBe(false);
    expect(FONT_SIZE.test('fontSize: size * 0.4')).toBe(false);
  });
});

/**
 * Redesign 2 lints (4.4 selectors, 5.4 one accent). Ratchets: `KNOWN_*` are the files other
 * packages are still moving over; any other file breaking the rule fails.
 */
function filesMatching(rule: RegExp): string[] {
  const out = new Set<string>();
  for (const dir of SCANNED) {
    for (const file of sourceFiles(join(ROOT, dir))) {
      const hit = readFileSync(file, 'utf8')
        .split('\n')
        .some((line) => rule.test(line.replace(/\/\/.*$/, '').replace(/^\s*\*.*$/, '')));
      if (hit) out.add(relative(ROOT, file).split('\\').join('/'));
    }
  }
  return [...out].sort();
}

/** Sodium straight from the palette: the primary button and "selected" states live in the design system. */
const SODIUM = /\bBRAND\b|\bC\.sodium\b|COLOR\.action\.(primary|selected)\b|STATE\.selected\b/;
const KNOWN_SODIUM = new Set([
  // Map pins and drawings (the Events layer is sodium by design).
  'src/components/BuildArt.tsx',
  'src/components/DriveMap.tsx',
  'src/components/NightMap.tsx',
  'src/components/NightMap.web.tsx',
  'src/components/DriveMap.web.tsx',
  'src/components/webmap/GridMap.web.tsx',
  'src/components/MapPicker.tsx',
  // WP-A's own: the trophy cover ribbon, the class-up and wordmark moments, the gallery.
  'src/components/Cover.tsx',
  'src/components/motion.tsx',
  'src/app/dev/components.tsx',
  // Still to move over (WP-B, C, D).
  'src/app/chat/new.tsx',
  'src/app/drive.tsx',
  'src/app/forum/[id].tsx',
  'src/components/AwardsSection.tsx',
  'src/components/BringPicker.tsx',
  'src/components/Community.tsx',
  'src/components/DriveHud.tsx',
  'src/components/NoticeBell.tsx',
]);

/** A typed date: the one picker is DateTimeSheet (4.4). */
const TYPED_DATE = /YYYY-MM-DD|placeholder="(DD|MM|YYYY)/;
const KNOWN_TYPED_DATE = new Set(['src/components/TrackPanel.tsx']);

/** A hand-made radio (the radio face is ChoiceGroup / SegmentedControl in the design system). */
const RADIO = /role="radio"/;
const KNOWN_RADIO = new Set([
  'src/app/dev/components.tsx',
  'src/components/AwardsSection.tsx',
  'src/components/BringPicker.tsx',
  'src/components/DriveHud.tsx',
]);

describe('Redesign 2 lint', () => {
  it('uses sodium only through the design system (one accent, 5.4)', () => {
    expect(filesMatching(SODIUM).filter((f) => !KNOWN_SODIUM.has(f) && f !== 'src/app/(tabs)/_layout.tsx')).toEqual([]);
  });
  it('never types a date (4.4)', () => {
    expect(filesMatching(TYPED_DATE).filter((f) => !KNOWN_TYPED_DATE.has(f))).toEqual([]);
  });
  it('never hand-makes a radio (4.4)', () => {
    expect(filesMatching(RADIO).filter((f) => !KNOWN_RADIO.has(f))).toEqual([]);
  });
  it('badges are red, never sodium (4.8)', () => {
    const tabs = readFileSync(join(ROOT, 'src/app/(tabs)/_layout.tsx'), 'utf8');
    expect(tabs).toMatch(/tabBarBadgeStyle: \{ backgroundColor: COLOR\.badge\.bg/);
  });
  it('catches what it should', () => {
    expect(SODIUM.test('colour={BRAND}')).toBe(true);
    expect(SODIUM.test('COLOR.action.primary')).toBe(true);
    expect(SODIUM.test('COLOR.action.primaryText')).toBe(false);
    expect(TYPED_DATE.test('placeholder="YYYY-MM-DD"')).toBe(true);
  });
});
