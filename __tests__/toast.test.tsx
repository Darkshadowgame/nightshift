import { act, useEffect } from 'react';
import { createRoot } from 'test-renderer';
// Reanimated's own mock needs its native side; the toast only needs still components.
jest.mock('react-native-reanimated', () => {
  const RN = jest.requireActual('react-native');
  const entering = { duration: () => entering, delay: () => entering };
  return {
    __esModule: true,
    default: { View: RN.View, Text: RN.Text },
    View: RN.View,
    useReducedMotion: () => true,
    FadeIn: entering,
    FadeInDown: entering,
    FadeInUp: entering,
    FadeOut: entering,
    SlideInDown: entering,
  };
});
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) }));
jest.mock('../src/lib/feel', () => ({ feel: new Proxy({}, { get: () => () => {} }) }));

import { TOAST_HANDOFF_MS, ToastProvider, useToast, type ToastInput } from '../src/components/ds/Toast';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

type Node = { type?: unknown; props?: Record<string, unknown>; children?: unknown[] };
function find(node: unknown, pred: (n: Node) => boolean): Node[] {
  const n = node as Node;
  if (!n || typeof n !== 'object') return [];
  return [...(pred(n) ? [n] : []), ...(n.children ?? []).flatMap((c) => find(c, pred))];
}
function text(node: unknown): string {
  if (typeof node === 'string') return node;
  const n = node as Node;
  return (n?.children ?? []).map(text).join('');
}
const alertOf = (root: { container: unknown }) => find(root.container, (n) => n.props?.accessibilityRole === 'alert')[0];

/** Raises a toast once mounted, and hands the raiser out for later ones. */
let raise: (t: ToastInput) => void = () => {};
function Raiser({ first }: { first?: ToastInput }) {
  const toast = useToast();
  raise = toast;
  useEffect(() => {
    if (first) toast(first);
  }, [first, toast]);
  return null;
}

function render(screenKey: string, first?: ToastInput) {
  const root = createRoot({ textComponentTypes: ['Text'], publicTextComponentTypes: ['Text'] } as never);
  act(() =>
    root.render(
      <ToastProvider screenKey={screenKey}>
        <Raiser first={first} />
      </ToastProvider>,
    ),
  );
  return {
    root,
    goTo(key: string) {
      act(() =>
        root.render(
          <ToastProvider screenKey={key}>
            <Raiser first={first} />
          </ToastProvider>,
        ),
      );
    },
  };
}

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date(2026, 10, 18, 20, 30));
});
afterEach(() => jest.useRealTimers());

describe('toasts last about 3.2 s (Redesign 2, 4.7; Review 13 measured 5.5 s)', () => {
  it('goes after 3.2 s, with or without Undo', () => {
    for (const action of [undefined, { label: 'Undo', onPress: () => {} }]) {
      const { root } = render('/event/1', { message: "You're going with your Fiesta ST", action });
      expect(text(alertOf(root))).toContain("You're going");
      act(() => jest.advanceTimersByTime(3100));
      expect(alertOf(root)).toBeTruthy();
      act(() => jest.advanceTimersByTime(200));
      expect(alertOf(root)).toBeUndefined();
    }
  });

  it('shows one at a time: a new toast replaces the one on show, with its own 3.2 s', () => {
    const { root } = render('/event/1', { message: 'Checked in' });
    act(() => jest.advanceTimersByTime(2000));
    act(() => raise({ message: 'Voted' }));
    expect(find(root.container, (n) => n.props?.accessibilityRole === 'alert').length).toBe(1);
    expect(text(alertOf(root))).toBe('Voted');
    act(() => jest.advanceTimersByTime(3000));
    expect(text(alertOf(root))).toBe('Voted');
    act(() => jest.advanceTimersByTime(300));
    expect(alertOf(root)).toBeUndefined();
  });
});

describe('a toast stays on its screen (4.7: never carried to the next one)', () => {
  it('goes when the screen changes', () => {
    const r = render('/event/1', { message: "You're going with your Fiesta ST", action: { label: 'Change', onPress: () => {} } });
    act(() => jest.advanceTimersByTime(1500));
    r.goTo('/drive');
    expect(alertOf(r.root)).toBeUndefined();
  });

  it('keeps a toast raised as part of the change ("Saved" as a form closes)', () => {
    const r = render('/event/new', { message: 'Saved' });
    act(() => jest.advanceTimersByTime(TOAST_HANDOFF_MS - 100));
    r.goTo('/event/1');
    expect(text(alertOf(r.root))).toBe('Saved');
  });

  it('a re-render on the same screen keeps it', () => {
    const r = render('/event/1', { message: 'Checked in' });
    act(() => jest.advanceTimersByTime(1500));
    r.goTo('/event/1');
    expect(alertOf(r.root)).toBeTruthy();
  });
});

describe('a toast never takes a tap meant for what is under it (4.7: End, the primary)', () => {
  /** Which host nodes would get a touch: none under a `none` / `box-none`-for-self parent chain. */
  function hittable(node: unknown, blocked = false): Node[] {
    const n = node as Node;
    if (!n || typeof n !== 'object') return [];
    const pe = n.props?.pointerEvents as string | undefined;
    const selfBlocked = blocked || pe === 'none' || pe === 'box-none';
    const childBlocked = blocked || pe === 'none' || pe === 'box-only';
    return [...(selfBlocked ? [] : [n]), ...(n.children ?? []).flatMap((c) => hittable(c, childBlocked))];
  }

  it('without an action, nothing in the toast can be hit', () => {
    const { root } = render('/event/1', { message: 'Sent' });
    const toast = alertOf(root);
    expect(toast.props?.pointerEvents).toBe('box-none');
    // The positioned wrapper above it lets touches through too.
    const wrapper = find(root.container, (n) => find(n, (c) => c === toast).length > 0 && n !== toast && n.props?.style !== undefined).pop();
    expect(wrapper?.props?.pointerEvents).toBe('box-none');
    expect(hittable(wrapper)).toEqual([]);
  });

  it('with Undo, only Undo can be hit', () => {
    const undo = jest.fn();
    const { root } = render('/event/1', { message: "You're not going to Sunday coffee and cars", action: { label: 'Undo', onPress: undo } });
    const toast = alertOf(root);
    const hits = hittable(toast);
    expect(hits.length).toBeGreaterThan(0);
    const pressables = hits.filter((n) => typeof n.props?.onClick === 'function' || typeof n.props?.onResponderRelease === 'function');
    expect(pressables.length).toBe(1);
    expect(text(pressables[0]).toLowerCase()).toContain('undo');
    // Every hittable node is the Undo button or inside it.
    for (const h of hits) {
      const inUndo = find(pressables[0], (c) => c === h).length > 0;
      const holdsUndo = find(h, (c) => c === pressables[0]).length > 0;
      if (!inUndo && !holdsUndo) throw new Error(`hittable outside Undo: ${String(h.type)} ${JSON.stringify(Object.keys(h.props ?? {}))}`);
    }
  });
});
