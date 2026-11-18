/**
 * One confirm pattern (Redesign 2, 4.5; Review 13): ConfirmSheet is the only confirm, with no
 * header Cancel or Done. Leaving a form with changes: "Discard it" / "Keep editing". Every other
 * destructive confirm: "{Verb} it" / "Keep it".
 */
import { readdirSync, readFileSync, statSync } from 'fs';
import { join, relative } from 'path';
import { act } from 'react';
import { createRoot } from 'test-renderer';
jest.mock('react-native-reanimated', () => {
  const RN = jest.requireActual('react-native');
  const entering = { duration: () => entering, delay: () => entering };
  return { __esModule: true, default: { View: RN.View }, View: RN.View, useReducedMotion: () => true, FadeIn: entering, FadeInUp: entering, FadeOut: entering, SlideInDown: entering };
});
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) }));
jest.mock('../src/lib/feel', () => ({ feel: new Proxy({}, { get: () => () => {} }) }));

import { ConfirmSheet } from '../src/components/ds/Sheet';
import { LEAVE_MEET } from '../src/lib/glossary';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

type Node = { type?: unknown; props?: Record<string, unknown>; children?: unknown[] };
function find(node: unknown, pred: (n: Node) => boolean): Node[] {
  const n = node as Node;
  if (!n || typeof n !== 'object') return [];
  return [...(pred(n) ? [n] : []), ...(n.children ?? []).flatMap((c) => find(c, pred))];
}
function text(node: unknown): string {
  if (typeof node === 'string') return node;
  return ((node as Node)?.children ?? []).map(text).join('');
}
/** Every bit of words on screen, one per Text. */
function words(root: unknown): string[] {
  return find(root, (n) => n.type === 'Text').map(text);
}
function render(el: React.ReactElement) {
  const root = createRoot({ textComponentTypes: ['Text'], publicTextComponentTypes: ['Text'] } as never);
  act(() => root.render(el));
  return root;
}
const noop = () => {};

describe('ConfirmSheet is the one confirm', () => {
  it('a destructive confirm says "{Verb} it" / "Keep it", with no header Done or Cancel', () => {
    const root = render(<ConfirmSheet visible title="Leave Midlands Night Crew" message="You can ask to join again later." verb="Leave" onConfirm={noop} onCancel={noop} />);
    const w = words(root.container).map((x) => x.toLowerCase());
    expect(w).toEqual(expect.arrayContaining(['leave it', 'keep it']));
    expect(w).not.toContain('done');
    expect(w).not.toContain('cancel');
  });

  it('an ambiguous verb says both outcomes in plain words (leaving a meet, Review 16)', () => {
    const root = render(
      <ConfirmSheet visible title="Can't make it" message="Take yourself off Sunday coffee and cars?" verb="Leave" confirmLabel={LEAVE_MEET.confirm} cancelLabel={LEAVE_MEET.cancel} onConfirm={noop} onCancel={noop} />,
    );
    const w = words(root.container);
    expect(w).toEqual(expect.arrayContaining(["Yes, I can't go", "I'm still going"]));
    expect(w).not.toContain('Leave it');
    expect(w).not.toContain('Keep it');
  });

  it('leaving a form with changes says "Discard it" / "Keep editing"', () => {
    const root = render(<ConfirmSheet visible title="Discard this meet?" message="It isn't posted yet." verb="Discard" cancelLabel="Keep editing" onConfirm={noop} onCancel={noop} />);
    const w = words(root.container).map((x) => x.toLowerCase());
    expect(w).toEqual(expect.arrayContaining(['discard it', 'keep editing']));
    expect(w).not.toContain('done');
  });

  it('the meet-ban warning (owner 9.3) puts Change location first, as the primary', () => {
    const root = render(
      <ConfirmSheet visible title="Meet ban" message="This spot is inside a PSPO. Post anyway?" verb="Post" confirmLabel="Post anyway" cancelLabel="Change location" safeFirst onConfirm={noop} onCancel={noop} />,
    );
    const w = words(root.container).map((x) => x.toLowerCase());
    expect(w.indexOf('change location')).toBeGreaterThan(-1);
    expect(w.indexOf('change location')).toBeLessThan(w.indexOf('post anyway'));
    expect(w).not.toContain('done');
  });
});

/**
 * No hand-made confirm anywhere: a `Sheet` holding a destructive button, or a sheet that closes
 * with "Cancel", is a second confirm pattern. Use ConfirmSheet.
 *
 * PENDING lists confirms in files another work package owns, until they move to ConfirmSheet.
 * Delete an entry once it's fixed.
 */
const PENDING: Record<string, string> = {};

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? files(p) : /\.tsx$/.test(f) ? [p] : [];
  });
}

describe('every confirm is a ConfirmSheet (4.5)', () => {
  const root = join(__dirname, '..');
  const found: Record<string, string[]> = {};
  for (const file of [...files(join(root, 'src/app')), ...files(join(root, 'src/components'))]) {
    const rel = relative(root, file);
    if (rel === 'src/components/ds/Sheet.tsx' || rel.startsWith('src/app/dev/')) continue;
    const src = readFileSync(file, 'utf8');
    const hits: string[] = [];
    if (/doneLabel=["{']*Cancel/.test(src)) hits.push('a sheet that closes with Cancel');
    for (const m of src.matchAll(/<Sheet\b[\s\S]*?<\/Sheet>/g)) {
      if (/tier="destructive"|destructive\b(?!:)/.test(m[0].replace(/SheetOption[^>]*destructive[^>]*>/g, ''))) hits.push('a Sheet with a destructive button');
    }
    if (hits.length) found[rel] = hits;
  }

  it('finds no hand-made confirm outside the pending list', () => {
    const unexpected = Object.keys(found).filter((f) => !(f in PENDING));
    expect(unexpected.map((f) => `${f}: ${found[f].join(', ')}`)).toEqual([]);
  });

});
