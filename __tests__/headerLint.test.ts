/**
 * One back button and one header style everywhere (REVIEW-9 decision 12; DESIGN-SYSTEM rule 15).
 * The root layout draws the back arrow for every pushed screen, however it was reached (a link,
 * a tab, a notification): the DS `IconButton icon="back"`. No screen draws its own, and no
 * screen types a back glyph ("‹", "←") as text. Tab headers come from `screenHeader()` (Tonight
 * draws the same `ScreenHeader` in the page, under its search).
 */
import { readdirSync, readFileSync, statSync } from 'fs';
import { join, relative } from 'path';

const ROOT = join(__dirname, '..');
const APP = join(ROOT, 'src', 'app');

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return files(path);
    return /\.tsx?$/.test(name) ? [path] : [];
  });
}

const code = (file: string) =>
  readFileSync(file, 'utf8')
    .split('\n')
    .map((l) => l.replace(/\/\/.*$/, '').replace(/^\s*\*.*$/, ''));

describe('one back button, one header', () => {
  const all = [...files(APP), ...files(join(ROOT, 'src', 'components'))];

  test('only the root layout sets headerLeft or the native back button', () => {
    const found = all
      .filter((f) => !f.endsWith(join('src', 'app', '_layout.tsx')))
      .flatMap((f) => code(f).flatMap((l, i) => (/\bheaderLeft\b|\bheaderBackVisible\b|\bheaderBackImage/.test(l) ? [`${relative(ROOT, f)}:${i + 1}`] : [])));
    expect(found).toEqual([]);
  });

  test('no back glyph typed as text', () => {
    const found = all.flatMap((f) => code(f).flatMap((l, i) => (/[‹←]/.test(l) ? [`${relative(ROOT, f)}:${i + 1}: ${l.trim()}`] : [])));
    expect(found).toEqual([]);
  });

  test('the root layout gives every pushed screen the DS back arrow, with or without history', () => {
    const root = readFileSync(join(APP, '_layout.tsx'), 'utf8');
    expect(root).toMatch(/headerLeft: \(\) => \(\s*<IconButton\s+icon="back"/);
    expect(root).toMatch(/navigation\.canGoBack\(\) \? navigation\.goBack\(\) : router\.replace\(fallbackTab/);
  });

  test('every tab header but Tonight comes from screenHeader()', () => {
    const tabs = readFileSync(join(APP, '(tabs)', '_layout.tsx'), 'utf8');
    for (const name of ['community', 'garage', 'me']) expect(tabs).toMatch(new RegExp(`name="${name}"[\\s\\S]{0,80}screenHeader\\(`));
    expect(readFileSync(join(APP, '(tabs)', 'index.tsx'), 'utf8')).toMatch(/<ScreenHeader title="Tonight"/);
  });
});
