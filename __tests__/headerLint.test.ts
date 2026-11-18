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

/**
 * Every screen is one of the five templates (Redesign 2, section 3; K4). A new route must be added
 * here with its template, and the root layout's header must match it:
 * - T1 tab / T2 map: in (tabs), header from screenHeader() (Tonight draws ScreenHeader).
 * - T1 pushed list (search, notifications) and T5 settings/list: a caps title from title().
 * - T3 detail: no header title (the Hero carries it).
 * - T4 form or wizard: a caps title and a modal, or no header (sign-in and onboarding draw their own).
 * - `other`: the full-screen driving view, redirects, the dev gallery, not-found and the sitemap.
 */
type Template = 'T1' | 'T2' | 'T3' | 'T4' | 'T5' | 'other';
const TEMPLATES: Record<string, Template> = {
  '(tabs)/index': 'T2',
  '(tabs)/community': 'T1',
  '(tabs)/garage': 'T1',
  '(tabs)/me': 'T1',
  search: 'T1',
  notifications: 'T1',
  'event/[id]': 'T3',
  'build/[id]': 'T3',
  'build/power': 'T5',
  'user/[id]': 'T3',
  'spot/[id]': 'T3',
  'shop/[id]': 'T3',
  'zone/[id]': 'T3',
  'crew/[id]': 'T3',
  'post/[id]': 'T3',
  'forum/[id]': 'T3',
  'event/new': 'T4',
  'event/edit': 'T4',
  'event/plan': 'T4',
  'build/edit': 'T4',
  profile: 'T4',
  'spot/new': 'T4',
  'crew/new': 'T4',
  'post/new': 'T4',
  'forum/new': 'T4',
  'chat/new': 'T4',
  report: 'T4',
  feedback: 'T4',
  signin: 'T4',
  welcome: 'T4',
  settings: 'T5',
  help: 'T5',
  credits: 'T5',
  connections: 'T5',
  crews: 'T5',
  rate: 'T5',
  'chat/[id]': 'T5',
  'chat/info': 'T5',
  moderation: 'T5',
  'moderation-log': 'T5',
  'moderation-team': 'T5',
  'member/[id]': 'T5',
  drive: 'other',
  events: 'other',
  find: 'other',
  where: 'other',
  'dev/components': 'other',
  '+not-found': 'other',
  _sitemap: 'other',
};
/** Pushed T4 screens that aren't modals yet (the plan-change flow edits an event in place). */
const T4_PUSHED = new Set(['event/plan']);
/** Screens whose title is set in the screen itself (a chat's name, in sentence case). */
const TITLE_IN_SCREEN = new Set(['chat/[id]']);

describe('every screen is a template (K4)', () => {
  const routes = files(APP)
    .filter((f) => !f.endsWith('_layout.tsx'))
    .map((f) => relative(APP, f).replace(/\.tsx$/, '').split('\\').join('/'));
  const root = readFileSync(join(APP, '_layout.tsx'), 'utf8');
  const options = (name: string) => {
    const esc = name.replace(/[[\]()+]/g, (c) => `\\${c}`);
    const m = root.match(new RegExp(`<Stack\\.Screen name="${esc}" options=\\{\\{([^}]*)\\}\\}`));
    return m ? m[1] : null;
  };

  test('every route has a template', () => {
    expect(routes.filter((r) => !TEMPLATES[r])).toEqual([]);
  });

  test('detail screens (T3) have no header title', () => {
    const bad = routes.filter((r) => TEMPLATES[r] === 'T3' && !/title: ''/.test(options(r) ?? ''));
    expect(bad).toEqual([]);
  });

  test('lists, settings and forms (T1 pushed, T4, T5) have a caps title, or draw their own header', () => {
    const bad = routes.filter((r) => {
      const t = TEMPLATES[r];
      if (r.startsWith('(tabs)/') || TITLE_IN_SCREEN.has(r) || !['T1', 'T4', 'T5'].includes(t)) return false;
      const o = options(r) ?? '';
      return !/title: (title\(|'[A-Z ]+')/.test(o) && !/headerShown: false/.test(o);
    });
    expect(bad).toEqual([]);
  });

  test('create and edit forms (T4) are modal routes', () => {
    const bad = routes.filter((r) => TEMPLATES[r] === 'T4' && !T4_PUSHED.has(r) && !/presentation: 'modal'|headerShown: false/.test(options(r) ?? ''));
    expect(bad).toEqual([]);
  });

  test('"+" only on Tonight, Community and Garage; Me has the bell only', () => {
    const tabs = readFileSync(join(APP, '(tabs)', '_layout.tsx'), 'utf8');
    expect(tabs).toMatch(/name="me"[\s\S]{0,60}screenHeader\(\{ title: 'Me', bell: true \}\)/);
    const me = readFileSync(join(APP, '(tabs)', 'me.tsx'), 'utf8');
    expect(me).not.toMatch(/\badd=\{|add: \{|label: '\+/);
  });
});
