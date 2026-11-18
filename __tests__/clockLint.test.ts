import { readdirSync, readFileSync, statSync } from 'fs';
import { join, relative, sep } from 'path';

/**
 * One clock everywhere (Review 11). Every "now" the app shows or decides on comes from
 * `appNow()` (src/lib/appClock.ts), so the demo night reads Friday 21:10 at any real time. Elapsed
 * time, ids, cache ages and network stamps use `realNowMs()` from the same file.
 *
 * This test bans `new Date()` and `Date.now()` in src outside appClock.ts. It's a ratchet:
 * - ALLOWED: files where the phone's own clock is right and the reason is written down.
 * - KNOWN: offenders left to clear, with how many uses each still has. A count may only go down;
 *   when a file is clean, take it off the list (the test fails on a stale entry, so the list shrinks).
 */
const ROOT = join(__dirname, '..');

const ALLOWED: Record<string, string> = {
  'src/lib/appClock.ts': 'the clock itself',
  'src/lib/backend/remote.ts': 'timestamps sent to and filtered by the server (signed in: no offset)',
  'src/lib/backend/community.ts': 'a timestamp sent to the server',
  'src/lib/backend/roads.ts': 'road reports are real-world: they expire on the real clock',
  'src/lib/roadService.ts': 'road reports are real-world: they expire on the real clock',
  'src/lib/roadStore.tsx': 'road reports are real-world: they expire on the real clock',
  'src/lib/commonsClient.ts': 'the age of a photo cache',
  'src/lib/photoRefs.ts': 'a unique file name',
};

/** Left to clear: none. */
const KNOWN: Record<string, number> = {};

const BANNED = /new Date\(\s*\)|Date\.now\(\s*\)/g;

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) return sources(p);
    return /\.tsx?$/.test(n) ? [p] : [];
  });
}

/** Uses of the real clock in code (comments don't count). */
function count(file: string): number {
  const code = readFileSync(file, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:'"`])\/\/.*$/gm, '$1');
  return (code.match(BANNED) ?? []).length;
}

const found = new Map<string, number>();
for (const f of sources(join(ROOT, 'src'))) {
  const n = count(f);
  if (n > 0) found.set(relative(ROOT, f).split(sep).join('/'), n);
}

describe('one clock', () => {
  it('has no new Date() or Date.now() outside appClock.ts, the allow-list and the known list', () => {
    const fresh = [...found.entries()].filter(([f]) => !(f in ALLOWED) && !(f in KNOWN)).map(([f, n]) => `${f} (${n})`);
    expect(fresh).toEqual([]);
  });
  it('only goes down in the known files', () => {
    const grew = Object.entries(KNOWN)
      .filter(([f, max]) => (found.get(f) ?? 0) > max)
      .map(([f, max]) => `${f}: ${found.get(f)} > ${max}`);
    expect(grew).toEqual([]);
  });
  it('takes clean files off the known list', () => {
    const stale = Object.keys(KNOWN).filter((f) => !found.has(f));
    expect(stale).toEqual([]);
  });
});
