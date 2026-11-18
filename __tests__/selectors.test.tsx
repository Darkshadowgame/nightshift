import { act } from 'react';
import { createRoot } from 'test-renderer';
// The header bell reads the app store; Callout doesn't need it.
jest.mock('../src/components/NoticeBell', () => ({ NoticeBell: () => null }));
// Reanimated's own mock needs its native side; Callout only needs still components.
jest.mock('react-native-reanimated', () => {
  const RN = jest.requireActual('react-native');
  const id = (v: unknown) => v;
  const anim = { View: RN.View, Text: RN.Text, ScrollView: RN.ScrollView, createAnimatedComponent: id };
  const entering = { duration: () => entering, delay: () => entering, springify: () => entering };
  return {
    __esModule: true,
    default: anim,
    ...anim,
    useReducedMotion: () => true,
    useSharedValue: (value: unknown) => ({ value }),
    useAnimatedStyle: () => ({}),
    withTiming: id,
    withSpring: id,
    withRepeat: id,
    withDelay: (_d: number, v: unknown) => v,
    withSequence: (...v: unknown[]) => v[v.length - 1],
    cancelAnimation: () => {},
    Easing: new Proxy({}, { get: () => () => id }),
    FadeIn: entering,
    FadeInDown: entering,
    FadeInUp: entering,
    FadeOut: entering,
    SlideInDown: entering,
  };
});
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) }));


import { ChoiceGroup, DateTimeSheet } from '../src/components/ds';
import { COLOR } from '../src/theme';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function render(el: React.ReactElement) {
  const root = createRoot({ textComponentTypes: ['Text'], publicTextComponentTypes: ['Text'] } as never);
  act(() => root.render(el));
  return root;
}
type Node = { type?: unknown; props?: Record<string, unknown>; children?: unknown[] };
function find(node: unknown, pred: (n: Node) => boolean): Node[] {
  const n = node as Node;
  if (!n || typeof n !== 'object') return [];
  return [...(pred(n) ? [n] : []), ...(n.children ?? []).flatMap((c) => find(c, pred))];
}
function flat(style: unknown): Record<string, unknown> {
  if (!style) return {};
  if (Array.isArray(style)) return Object.assign({}, ...style.map(flat));
  return typeof style === 'object' ? (style as Record<string, unknown>) : {};
}
const role = (n: Node) => (n.props?.role ?? n.props?.accessibilityRole) as string | undefined;
const checked = (n: Node) => !!((n.props?.accessibilityState as { checked?: boolean } | undefined)?.checked ?? (n.props?.['aria-checked'] as boolean | undefined));
const noop = () => {};

describe('ChoiceGroup is always chips (4.4: a form choice never looks like a SegmentedControl)', () => {
  it('draws three short options as radio chips, not tabs', () => {
    const root = render(
      <ChoiceGroup
        label="Type"
        value="meet"
        onChange={noop}
        options={[
          { key: 'meet', label: 'Meet' },
          { key: 'cruise', label: 'Cruise' },
          { key: 'rolling', label: 'Rolling meet' },
        ]}
      />,
    );
    expect(find(root.container, (n) => role(n) === 'tab' || role(n) === 'tablist')).toEqual([]);
    expect(find(root.container, (n) => role(n) === 'radio' && typeof n.props?.onClick === 'function').length).toBe(3);
  });
});

describe('DateTimeSheet has one selected look (Review 12 decision 4)', () => {
  it('the picked day, hour and minute share the chip face', () => {
    const now = new Date(2026, 10, 20, 12, 30);
    const value = new Date(2026, 10, 22, 10, 0);
    const root = render(<DateTimeSheet visible title="Starts" value={value} onChange={noop} onClose={noop} now={now} />);
    const on = find(root.container, (n) => role(n) === 'radio' && checked(n) && typeof n.props?.onClick === 'function');
    expect(on.length).toBe(3);
    const faces = on.map((n) => {
      const s = flat(n.props?.style);
      return { border: s.borderColor, bg: s.backgroundColor };
    });
    for (const f of faces) expect(f).toEqual({ border: COLOR.action.selected, bg: COLOR.action.selectedTint });
  });
});
