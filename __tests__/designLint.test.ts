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
