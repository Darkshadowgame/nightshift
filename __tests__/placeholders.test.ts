import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';
import { busyScene } from '../src/data/busyNight';
import { DEMO_HOME, seed } from '../src/data/seed';

/** Every "e.g. …" placeholder in the app's screens and components. */
function examples(dir: string): { file: string; text: string }[] {
  const out: { file: string; text: string }[] = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) out.push(...examples(path));
    else if (/\.tsx?$/.test(name)) {
      const src = readFileSync(path, 'utf8');
      for (const m of src.matchAll(/placeholder=(?:"|\{['`])e\.g\. ([^"'`]+)/g)) out.push({ file: path, text: m[1].trim() });
    }
  }
  return out;
}

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim();

describe('placeholders never name a seeded meet (Review 19 problem 1)', () => {
  // The demo night at two clock times, and the Busy night on top, so every seeded title is covered.
  const titles = new Set<string>();
  for (const now of [new Date('2026-11-20T21:10:00'), new Date('2026-11-19T12:30:00')]) {
    const base = seed(now);
    for (const e of base.events) titles.add(norm(e.title));
    for (const e of busyScene(now, DEMO_HOME, base.users, base.builds).events) titles.add(norm(e.title));
  }
  const found = examples(join(__dirname, '..', 'src'));

  test('the scan finds the host form', () => {
    expect(titles.has('sunday coffee and cars')).toBe(true);
    expect(found.some((f) => f.file.endsWith('EventForm.tsx'))).toBe(true);
  });

  test('no "e.g." example equals a seeded event title', () => {
    const clashes = found.filter((f) => titles.has(norm(f.text)));
    expect(clashes).toEqual([]);
  });
});
