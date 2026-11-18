import { readdirSync, readFileSync, statSync } from 'fs';
import { join, relative } from 'path';

/**
 * Every screen is declared inside a guard in its layout (DESIGN-SYSTEM rule 19). An undeclared route is
 * always allowed, so the router can fall back to it when a guard changes: that's how "Try the demo"
 * once landed on Credits (Review 6, B1).
 */
const APP = join(__dirname, '..', 'src', 'app');

function routes(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) return routes(p);
    if (!f.endsWith('.tsx') || f === '_layout.tsx') return [];
    return [relative(APP, p).replace(/\.tsx$/, '').split('\\').join('/')];
  });
}

const declared = (layout: string) => new Set(Array.from(readFileSync(layout, 'utf8').matchAll(/<(?:Stack|Tabs)\.Screen\s+name="([^"]+)"/g), (m) => m[1]));

describe('routes', () => {
  const all = routes(APP);
  test('every stack screen is declared in the root layout', () => {
    const root = declared(join(APP, '_layout.tsx'));
    const missing = all.filter((r) => !r.startsWith('(tabs)/') && !root.has(r));
    expect(missing).toEqual([]);
  });
  test('every tab is declared in the tabs layout, and there are four', () => {
    const tabs = declared(join(APP, '(tabs)', '_layout.tsx'));
    const files = all.filter((r) => r.startsWith('(tabs)/')).map((r) => r.slice('(tabs)/'.length));
    expect(files.filter((r) => !tabs.has(r))).toEqual([]);
    expect([...tabs]).toEqual(['index', 'community', 'garage', 'me']);
  });
  test('the old Events, Find and Where to? routes redirect', () => {
    for (const r of ['events', 'find', 'where']) expect(readFileSync(join(APP, `${r}.tsx`), 'utf8')).toMatch(/<Redirect/);
  });
  test('the component gallery is only allowed in development builds', () => {
    expect(readFileSync(join(APP, '_layout.tsx'), 'utf8')).toMatch(/guard=\{onboarded && __DEV__\}>\s*<Stack\.Screen name="dev\/components"/);
  });
});
