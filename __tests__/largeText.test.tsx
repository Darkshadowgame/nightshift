/**
 * Larger text (Redesign 2, 7.5 look checklist; Review 13 L2): at 1.3x and 375x667 nothing in the
 * design system clips or overlaps. Names wrap by words to more lines instead of being cut, and a
 * title never sits over drawn art. The web check (scaled fonts in Chromium) is the Playwright
 * script in the review; this pins the props that make it hold on every screen.
 */
import { act } from 'react';
import { createRoot } from 'test-renderer';
jest.mock('react-native-reanimated', () => {
  const RN = jest.requireActual('react-native');
  const entering = { duration: () => entering, delay: () => entering };
  return { __esModule: true, default: { View: RN.View }, View: RN.View, useReducedMotion: () => true, FadeIn: entering, FadeInUp: entering, FadeOut: entering, SlideInDown: entering };
});
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) }));
jest.mock('../src/lib/feel', () => ({ feel: new Proxy({}, { get: () => () => {} }) }));
// 1.3x text, as the iPhone's larger text sizes report it.
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
  __esModule: true,
  default: () => ({ width: 375, height: 667, scale: 2, fontScale: 1.3 }),
}));

import { BuildLine } from '../src/components/ds/Marks';
import { narrowCard, PhotoCard } from '../src/components/ds/PhotoCard';
import { ListRow } from '../src/components/ds/ListRow';
import { SheetPanel } from '../src/components/ds/Sheet';
import { TYPE_SCALE } from '../src/theme';

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
function flat(style: unknown): Record<string, unknown> {
  if (!style) return {};
  if (Array.isArray(style)) return Object.assign({}, ...style.map(flat));
  return typeof style === 'object' ? (style as Record<string, unknown>) : {};
}
const isText = (n: Node) => n.type === 'Text';
/** The Text node whose own words are exactly `words`. */
const textNode = (root: unknown, words: string) => find(root, (n) => isText(n) && text(n) === words)[0];
/** The parent of `child` in the tree. */
function parentOf(root: unknown, child: Node): Node | undefined {
  return find(root, (n) => (n.children ?? []).includes(child))[0];
}
const hasBadge = (n: Node | undefined) => !!n && find(n, (c) => c.props?.accessibilityLabel === undefined && isText(c) && /^[SABCD]$/.test(text(c))).length > 0;

function render(el: React.ReactElement) {
  const root = createRoot({ textComponentTypes: ['Text'], publicTextComponentTypes: ['Text'] } as never);
  act(() => root.render(el));
  return root;
}
/** Lay the card's frame out `width` points wide (what the vote grid's half column gives it). */
function layOut(root: ReturnType<typeof render>, width: number) {
  const frame = find(root.container, (n) => typeof n.props?.onLayout === 'function')[0];
  act(() => (frame.props!.onLayout as (e: unknown) => void)({ nativeEvent: { layout: { x: 0, y: 0, width, height: 300 } } }));
}

const vote = (title: string) => <PhotoCard kind="build" paint="#2255aa" classLetter="S" title={title} meta="@dan_r · 583 bhp" onPress={() => {}} />;

describe('a narrow card at 1.3x text (the vote grid): names wrap by words, never cut', () => {
  it('counts a half-width column as narrow at 1.3x and a full-width card as roomy', () => {
    expect(narrowCard(165, 1.3)).toBe(true);
    expect(narrowCard(343, 1.3)).toBe(false);
    expect(narrowCard(0, 1.3)).toBe(false);
  });

  it('gives the title the full width, a smaller title size and three lines', () => {
    const root = render(vote('BMW M4 Competition'));
    layOut(root, 165);
    const title = textNode(root.container, 'BMW M4 Competition');
    expect(title.props?.numberOfLines).toBe(3);
    expect(flat(title.props?.style).fontSize).toBe(TYPE_SCALE.titleSm.fontSize);
    // The class badge is on the line above, not beside the title.
    expect(hasBadge(parentOf(root.container, title))).toBe(false);
    expect(find(root.container, (n) => isText(n) && text(n) === 'S').length).toBe(1);
  });

  it('the longest word in the demo fits its column at 1.3x without breaking', () => {
    // Half of 343 (the sheet's width) less the grid gap and the card's padding.
    const room = (343 - 8) / 2 - 2 * 12;
    // A generous average advance for the display face: 0.62 em per character.
    for (const word of ['Competition', 'Volkswagen', 'Kawasaki']) {
      expect(word.length * 0.62 * TYPE_SCALE.titleSm.fontSize * 1.3).toBeLessThanOrEqual(room);
    }
  });

  it('a roomy card keeps the badge beside a two-line title', () => {
    const root = render(vote('Ford Fiesta ST Mk8 facelift'));
    layOut(root, 343);
    const title = textNode(root.container, 'Ford Fiesta ST Mk8 facelift');
    expect(title.props?.numberOfLines).toBe(2);
    expect(flat(title.props?.style).fontSize).toBe(TYPE_SCALE.title.fontSize);
  });
});

describe('a title never runs over drawn art (Me at 1.3x)', () => {
  it('titleOnPhoto with no photo puts the title under the silhouette', () => {
    const root = render(<PhotoCard kind="build" paint="#2255aa" titleOnPhoto classLetter="B" title="Ford Fiesta ST Mk8 facelift" meta="197 bhp · Stock" onPress={() => {}} />);
    const title = textNode(root.container, 'Ford Fiesta ST Mk8 facelift');
    // Nothing between the title and the card is absolutely positioned (the overlay on the picture is).
    let n: Node | undefined = title;
    while (n) {
      expect(flat(n.props?.style).position).not.toBe('absolute');
      n = parentOf(root.container, n);
    }
  });

  it('with a photo the title sits on it, in at most two lines', () => {
    const root = render(<PhotoCard kind="build" photo="https://example.invalid/car.jpg" titleOnPhoto classLetter="B" title="Ford Fiesta ST Mk8 facelift" onPress={() => {}} />);
    const title = textNode(root.container, 'Ford Fiesta ST Mk8 facelift');
    expect(title.props?.numberOfLines).toBe(2);
  });
});

describe('rows and sheets wrap names to two lines', () => {
  it('BuildLine, ListRow and a Sheet title allow two lines', () => {
    const line = render(<BuildLine letter="B" name="Volkswagen Golf GTI Clubsport S" power="306 bhp" />);
    // The power never splits from its unit (Review 15): non-breaking spaces in "· 306 bhp".
    expect(textNode(line.container, 'Volkswagen Golf GTI Clubsport S ·\u00A0306\u00A0bhp').props?.numberOfLines).toBe(2);
    const row = render(<ListRow title="Mercedes-AMG A45 S 4MATIC+" subtitle="2.0 turbo · 2019–" onPress={() => {}} />);
    expect(textNode(row.container, 'Mercedes-AMG A45 S 4MATIC+').props?.numberOfLines).toBe(2);
    const sheet = render(
      <SheetPanel title="Vote: Best in show" onClose={() => {}}>
        <></>
      </SheetPanel>,
    );
    expect(textNode(sheet.container, 'Vote: Best in show').props?.numberOfLines).toBe(2);
  });
});

import { readFileSync } from 'fs';
import { join } from 'path';
import { SEGMENT_MIN_SCALE, segmentFit } from '../src/components/ds/Choice';

describe('SegmentedControl stays one row at 1.3x (Review 15: never a 2x2 block)', () => {
  it('fits labels as they are when there is room, else shrinks them all, never below the minimum', () => {
    expect(segmentFit(343, [60, 90, 70, 50])).toBe(1);
    expect(segmentFit(0, [60, 100, 70, 60])).toBe(1);
    const k = segmentFit(320, [80, 120, 90, 80]);
    expect(k).toBeLessThan(1);
    expect(k).toBeGreaterThanOrEqual(SEGMENT_MIN_SCALE);
    expect(segmentFit(150, [100, 100, 100, 100])).toBe(SEGMENT_MIN_SCALE);
  });
  it('has no wrapping row and one-line labels', () => {
    const src = readFileSync(join(__dirname, '..', 'src', 'components', 'ds', 'Choice.tsx'), 'utf8');
    const seg = src.slice(src.indexOf('export function SegmentedControl'), src.indexOf('export function segmentFit'));
    expect(seg).not.toMatch(/flexWrap: 'wrap'|twoRows/);
    expect(seg).toMatch(/numberOfLines=\{1\}/);
  });
});
