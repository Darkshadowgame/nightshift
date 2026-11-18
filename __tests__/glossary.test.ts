import { readdirSync, readFileSync, statSync } from 'fs';
import { join, relative, sep } from 'path';
import {
  aroundArea,
  BANNED_WORDS,
  confirmLabels,
  DEMO_NIGHT,
  leadText,
  LOCATION,
  locationSentence,
  menuPath,
  NOT_OPEN,
  openPlaceLabel,
  PLACE_NAMES,
  roleLabel,
  roleTone,
  title,
} from '../src/lib/glossary';
import type { Role } from '../src/lib/eventView';

describe('glossary', () => {
  it('has one label per role', () => {
    const roles: Role[] = ['host', 'going', 'requested', 'invited', 'public', 'declined', 'none'];
    expect(roles.map((r) => roleLabel(r))).toEqual(['Hosting', 'Going', 'Requested', '', 'Public', 'Declined', '']);
  });
  it('never says "You can go" or "Invited": only the opposite shows (Redesign 2)', () => {
    expect(roleLabel('invited', { everyone: false })).toBe('');
    expect(roleLabel('invited', { everyone: true })).toBe('');
    expect(NOT_OPEN).toBe('Not open to your car');
  });
  it('never gives hosting a layer colour tone', () => {
    expect(roleTone('host')).toBe('brand');
    expect(roleTone('going')).toBe('success');
    expect(roleTone('requested')).toBe('warning');
    expect(roleTone('declined')).toBe('danger');
  });
  it('calls venues meet spots', () => {
    expect(PLACE_NAMES.venue.one).toBe('Meet spot');
    expect(openPlaceLabel('venue')).toBe('Open meet spot ›');
    expect(openPlaceLabel('drive')).toBe('Open drive ›');
  });
  it('writes menu paths with ›', () => {
    expect(menuPath('Me', 'Settings', 'Demo')).toBe('Me › Settings › Demo');
  });
  it('makes header titles capitals and confirm labels "{Verb} it / Keep it"', () => {
    expect(title('Add a car or bike')).toBe('ADD A CAR OR BIKE');
    expect(confirmLabels('Delete')).toEqual({ confirm: 'Delete it', cancel: 'Keep it' });
  });
  it('says when the location shows in plain words, never "unlocks" or "stop"', () => {
    expect(leadText(60)).toBe('1 h');
    expect(leadText(90)).toBe('1 h 30 min');
    expect(leadText(30)).toBe('30 min');
    expect(LOCATION.lead(60)).toBe('Location shows 1 h before');
    expect(LOCATION.lead(0)).toBe('Location shows at the start');
    expect(LOCATION.showsAt('21:30')).toBe('Location shows at 21:30');
    const words = [LOCATION.hidden, LOCATION.toGoing, LOCATION.setting, LOCATION.showsIn('1h')].join(' ');
    expect(words).not.toMatch(/unlock|\bstop\b/i);
  });
  it('writes the location line in the 4.11 words only', () => {
    expect(locationSentence({ state: 'notGoing', time: '21:30' })).toBe('Location shows at 21:30 to people going.');
    expect(locationSentence({ state: 'hidden', time: '21:30', minutesTo: 20 })).toBe('Location shows at 21:30 (in 20 min).');
    expect(locationSentence({ state: 'hidden', time: '21:30', minutesTo: 95 })).toBe('Location shows at 21:30.');
    expect(locationSentence({ state: 'shown', point: 'Leisure park car park', town: 'Tamworth' })).toBe('Leisure park car park, Tamworth.');
    expect(locationSentence({ state: 'rolling', point: 'Ventura retail park' })).toBe('Now at Ventura retail park. Next location when the host moves on.');
    expect(locationSentence({ state: 'host', time: '21:30', leadMinutes: 60 })).toBe('People going see it at 21:30 (1 h before).');
    expect(aroundArea('Tamworth')).toBe('Around Tamworth');
    const all = (['notGoing', 'hidden', 'shown', 'rolling', 'host'] as const).map((state) => locationSentence({ state, time: '21:30', minutesTo: 10, point: 'X', leadMinutes: 60 })).join(' ');
    for (const b of BANNED_WORDS) expect(all).not.toMatch(b.re);
    expect(DEMO_NIGHT.body).toMatch(/Friday night/);
  });
});

/**
 * Words that never appear on a first-level screen (Redesign 2, 4.12; owner decisions in section 9).
 * Scans the user-facing strings in src/app and src/components: quoted strings with a space or a
 * capital, and JSX text. Imports, comments and identifiers are skipped.
 *
 * `KNOWN` is the ratchet: the words still on screens other packages are moving over (WP-B, C, D).
 * A file can only lose entries; any new banned word anywhere fails. A stale entry doesn't fail
 * (the screen's owner fixed it; the list is trimmed when WP-A's files next change).
 */
const ROOT = join(__dirname, '..');
const KNOWN: Record<string, string[]> = {
  'src/app/(tabs)/garage.tsx': ['Sample (tag)', 'bhp/tonne'],
  'src/app/(tabs)/index.tsx': ['rep', 'invited'],
  'src/app/(tabs)/me.tsx': ['Find'],
  'src/app/build/[id].tsx': ['bhp/tonne', 'car scale', 'claimed'],
  'src/app/build/edit.tsx': ['rep'],
  'src/app/connections.tsx': ['stop'],
  'src/app/crew/[id].tsx': ['stop', 'rep', 'level'],
  'src/app/crew/new.tsx': ['stop'],
  'src/app/crews.tsx': ['rep'],
  'src/app/drive.tsx': ['stop'],
  'src/app/event/[id].tsx': ['stop', 'invited', 'you can go'],
  'src/app/event/plan.tsx': ['stop', 'locked'],
  'src/app/forum/[id].tsx': ['Sample (tag)'],
  'src/app/help.tsx': ['rep', 'level', 'Legend'],
  'src/app/post/[id].tsx': ['Sample (tag)'],
  'src/app/rate.tsx': ['Sample (tag)'],
  'src/app/report.tsx': ['stop'],
  'src/app/settings.tsx': ['rep', 'level'],
  'src/app/shop/[id].tsx': ['Find'],
  'src/app/spot/[id].tsx': ['stop', 'rep'],
  'src/app/user/[id].tsx': ['Sample (tag)', 'rep'],
  'src/app/welcome.tsx': ['Sample area'],
  'src/components/AddModSheet.tsx': ['rep'],
  'src/components/AwardsSection.tsx': ['rep'],
  'src/components/Community.tsx': ['Sample (tag)', 'level'],
  'src/components/CommunityFeed.tsx': ['Find'],
  'src/components/EventForm.tsx': ['stop', 'invited'],
  'src/components/ModPicker.tsx': ['rep'],
  'src/components/TonightCards.tsx': ['unlock', 'locked'],
  'src/components/TravelPrefs.tsx': ['you can go'],
};

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) return sources(p);
    return /\.tsx?$/.test(n) ? [p] : [];
  });
}

const STRING = /'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)"|`((?:[^`\\]|\\.)*)`/g;

/** The user-facing text in a source file. */
function screenText(src: string): string[] {
  const out: string[] = [];
  for (const raw of src.split('\n')) {
    const line = raw
      .replace(/^\s*\/\/.*$/, '')
      .replace(/^\s*\*.*$/, '')
      .replace(/^\s*\/\*.*$/, '')
      .replace(/\s\/\/ .*$/, '');
    if (/^\s*(import|export \{)\b/.test(line)) continue;
    for (const m of line.matchAll(STRING)) {
      const t = m[1] ?? m[2] ?? m[3] ?? '';
      if (/\s/.test(t) || /^[A-Z]/.test(t)) out.push(t);
    }
    for (const m of line.matchAll(/>([^<>{}]*[A-Za-z][^<>{}]*)</g)) out.push(m[1]);
    const t = line.trim();
    if (/^[A-Z][^{}<>=;()'"`]*$/.test(t) && /\s/.test(t)) out.push(t);
  }
  return out;
}

describe('banned words (Redesign 2, 4.12)', () => {
  const files = [...sources(join(ROOT, 'src', 'app')), ...sources(join(ROOT, 'src', 'components'))].filter((f) => !f.includes(join('dev', 'components')));

  test('no new banned word on any screen', () => {
    const fresh: string[] = [];
    for (const f of files) {
      const rel = relative(ROOT, f).split(sep).join('/');
      const text = screenText(readFileSync(f, 'utf8'));
      for (const b of BANNED_WORDS) {
        if (b.allowIn?.test(rel) || KNOWN[rel]?.includes(b.word)) continue;
        const hit = text.find((t) => b.re.test(t));
        if (hit) fresh.push(`${rel}: "${b.word}" in "${hit}"`);
      }
    }
    expect(fresh).toEqual([]);
  });

  test('catches what it should', () => {
    const text = screenText(`const a = 'Find a crew';\n<DsText>Location unlocks at 21:30</DsText>\nimport { stop } from 'x';\nconst k = kind === 'stop';\n  Sample area\n`);
    const words = BANNED_WORDS.filter((b) => text.some((t) => b.re.test(t))).map((b) => b.word);
    expect(words).toEqual(expect.arrayContaining(['Find', 'unlock', 'Sample area']));
    expect(words).not.toContain('stop');
  });

  test('the owner keeps rep and levels on Me only (section 9)', () => {
    const rep = BANNED_WORDS.find((b) => b.word === 'rep')!;
    expect(rep.allowIn!.test('src/app/(tabs)/me.tsx')).toBe(true);
    expect(rep.allowIn!.test('src/app/user/[id].tsx')).toBe(false);
  });
});
