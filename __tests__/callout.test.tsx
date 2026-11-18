import { act } from 'react';
import { Text } from 'react-native';
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
    FadeOut: entering,
    SlideInDown: entering,
  };
});

import { Callout, textSafe } from '../src/components/Detail';

/**
 * Review 8 bug 1: EventForm passed `{leftOutWhy} Change it…` (an array) to Callout, which wrapped
 * only a plain string in DsText. Raw text in a View throws on iOS ("Text strings must be rendered
 * within a <Text>"). The renderer here throws the same way for text outside a Text.
 */
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function render(el: React.ReactElement) {
  const root = createRoot({ textComponentTypes: ['Text'], publicTextComponentTypes: ['Text'] } as never);
  act(() => root.render(el));
  return root;
}

function texts(node: unknown): string[] {
  const n = node as { type?: string; children?: unknown[] } | string;
  if (typeof n === 'string') return [n];
  return (n.children ?? []).flatMap(texts);
}

describe('Callout', () => {
  it('renders mixed children (a variable, then words) without raw text in a View', () => {
    const why = 'Your FK8 is over the bhp cap.';
    const root = render(
      <Callout tone="warning" title="None of your own builds fits this invite">
        {why} Change it, or you'll be hosting something you can't bring a car or bike to.
      </Callout>,
    );
    const all = texts(root.container).join('');
    expect(all).toContain("Your FK8 is over the bhp cap. Change it, or you'll be hosting");
  });

  it('renders a plain string, a number, elements and fragments', () => {
    const root = render(
      <Callout title="Mixed">
        {'Starts in '}
        {5}
        {' min.'}
        <Text>An element stays.</Text>
        <>
          {'In a fragment '}
          {false}
          {null}
          {'too.'}
        </>
      </Callout>,
    );
    expect(texts(root.container).join('|')).toBe('Mixed|Starts in 5 min.|An element stays.|In a fragment too.');
  });

  it('a raw string in a View throws in this renderer (the check is real)', () => {
    const { View } = jest.requireActual('react-native') as typeof import('react-native');
    expect(() => render(<View>{'loose'}</View>)).toThrow();
  });
});

describe('textSafe', () => {
  it('drops empty and whitespace-only runs', () => {
    expect(textSafe([null, false, '  '])).toEqual([]);
  });
});
