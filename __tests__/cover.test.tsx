/**
 * The trophy cover's masthead at 1.0x and 1.3x text (Review 16: the top of "SHIFT" was cut, so it
 * read "NIGHTSHIH"). The masthead is two SVG text runs side by side, never one nested in the other
 * (a nested run scales twice where a browser scales text), in a box with room for the letters at
 * up to 1.5x their size.
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
jest.mock('../src/components/BuildBits', () => ({ useBuildPicture: () => null }));
jest.mock('../src/lib/store', () => ({ useStore: () => ({}) }));
jest.mock('react-native-svg', () => {
  const React = jest.requireActual('react');
  const make = (name: string) => (props: Record<string, unknown>) => React.createElement(name, props, props.children);
  return { __esModule: true, default: make('Svg'), Svg: make('Svg'), Text: make('SvgText'), TSpan: make('TSpan'), Path: make('Path'), Rect: make('Rect'), Circle: make('Circle'), G: make('G') };
});

import { Masthead, MASTHEAD_CAP, MASTHEAD_MAX_SCALE, mastheadLayout } from '../src/components/Cover';

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

describe('the trophy cover masthead never clips (Review 16)', () => {
  const COVER = 240; // the event page's cover
  const root = createRoot({ textComponentTypes: ['SvgText'], publicTextComponentTypes: ['SvgText'] } as never);
  act(() => root.render(<Masthead width={COVER - 32} cover={COVER} />));
  const svg = find(root.container, (n) => n.type === 'Svg')[0];
  const runs = find(root.container, (n) => n.type === 'SvgText');

  it('draws NIGHT and SHIFT as two runs side by side, neither inside the other', () => {
    expect(runs.map(text)).toEqual(['NIGHT', 'SHIFT']);
    expect(find(root.container, (n) => n.type === 'TSpan')).toHaveLength(0);
    for (const r of runs) expect(find(r, (n) => n.type === 'SvgText' && n !== r)).toHaveLength(0);
    // SHIFT starts where NIGHT's pinned width ends, and together they fit the box.
    expect(runs[1].props?.x).toBeCloseTo(Number(runs[0].props?.textLength));
    expect(Number(runs[0].props?.textLength) + Number(runs[1].props?.textLength)).toBeLessThanOrEqual(COVER - 32);
  });

  it.each([1, 1.3])('has room above the baseline for the capitals at %sx text', (scale) => {
    const m = mastheadLayout(COVER);
    const y = Number(runs[1].props?.y);
    const top = y - MASTHEAD_CAP * m.fontSize * scale;
    expect(top).toBeGreaterThanOrEqual(0);
    expect(y).toBeLessThanOrEqual(Number(svg.props?.height));
  });

  it('allows for at least 1.3x, at every cover size', () => {
    expect(MASTHEAD_MAX_SCALE).toBeGreaterThanOrEqual(1.3);
    for (const w of [160, 240, 260, 343]) {
      const m = mastheadLayout(w);
      expect(m.baseline - MASTHEAD_CAP * m.fontSize * MASTHEAD_MAX_SCALE).toBeGreaterThanOrEqual(0);
    }
  });
});
