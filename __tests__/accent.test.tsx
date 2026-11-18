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
    FadeInUp: entering,
    FadeOut: entering,
    SlideInDown: entering,
  };
});
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) }));


import { contentColour, EntityCard, Hero, ListRow, PhotoCard, Tag, ToastView as Toast } from '../src/components/ds';
import { C, COLOR, LAYER } from '../src/theme';

/**
 * Review 12 decision 5 (one accent, Redesign 2 5.4): sodium is for the one primary button and for
 * "selected", nothing else. The Events layer is sodium on the map, so a meet's kind line, its pin
 * in a list, a card's accent, a "You" tag and an unread dot must not pick it up as content.
 * Renders the content components with the Events layer colour and fails on any sodium in them.
 */
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function render(el: React.ReactElement) {
  const root = createRoot({ textComponentTypes: ['Text'], publicTextComponentTypes: ['Text'] } as never);
  act(() => root.render(el));
  return root;
}

const SODIUM = C.sodium.toLowerCase();
/** Every colour-looking value in the tree's props and styles, with where it was found. */
function sodiumIn(node: unknown, path = 'root'): string[] {
  const out: string[] = [];
  const seen = new Set<unknown>();
  const walk = (v: unknown, at: string) => {
    if (v == null || seen.has(v)) return;
    if (typeof v === 'string') {
      if (v.toLowerCase().includes(SODIUM)) out.push(at);
      return;
    }
    if (typeof v !== 'object') return;
    seen.add(v);
    if (Array.isArray(v)) return v.forEach((x, i) => walk(x, `${at}[${i}]`));
    for (const [k, x] of Object.entries(v as Record<string, unknown>)) {
      if (k === 'children' && at !== path && typeof x !== 'object') continue;
      walk(x, `${at}.${k}`);
    }
  };
  const n = node as { props?: Record<string, unknown>; children?: unknown[]; type?: unknown };
  const visit = (x: unknown, at: string) => {
    const m = x as { props?: Record<string, unknown>; children?: unknown[]; type?: unknown };
    if (!m || typeof m !== 'object') return;
    const { children: _c, ...props } = m.props ?? {};
    walk(props, `${at}<${String(m.type)}>`);
    (m.children ?? []).forEach((c, i) => visit(c, `${at}/${i}`));
  };
  visit(n, path);
  return out;
}

const noop = () => {};

describe('one accent: no sodium on content (Review 12 decision 5)', () => {
  it('contentColour turns sodium into the fallback and keeps other layer colours', () => {
    expect(contentColour(LAYER.event, COLOR.text.secondary)).toBe(COLOR.text.secondary);
    expect(contentColour(C.sodium.toUpperCase(), COLOR.text.secondary)).toBe(COLOR.text.secondary);
    expect(contentColour(LAYER.show, COLOR.text.secondary)).toBe(LAYER.show);
    expect(contentColour(undefined, COLOR.text.primary)).toBe(COLOR.text.primary);
  });
  it('a meet Hero (photo and words-only) has no sodium kind line or pin', () => {
    expect(sodiumIn(render(<Hero photo="https://example.org/a.jpg" eyebrow="Meet" layerColour={LAYER.event} glyph="meet" title="Sunday coffee and cars" meta="Sun 10:00" />).container)).toEqual([]);
    expect(sodiumIn(render(<Hero eyebrow="Meet" layerColour={LAYER.event} glyph="meet" title="Sunday coffee and cars" />).container)).toEqual([]);
  });
  it('a meet in a list, a card and a photo card has no sodium', () => {
    expect(sodiumIn(render(<ListRow leading={{ pin: 'meet', colour: LAYER.event }} title="Hot hatch meet" subtitle="Meet · Wed 20:00" unread onPress={noop} />).container)).toEqual([]);
    expect(sodiumIn(render(<EntityCard kind="event" layerColour={LAYER.event} mark={{ pin: 'meet', colour: LAYER.event }} title="Hot hatch meet" />).container)).toEqual([]);
    expect(sodiumIn(render(<PhotoCard kind="event" photo="https://example.org/a.jpg" layerColour={LAYER.event} eyebrow="Meet" title="Hot hatch meet" meta="Wed 20:00" />).container)).toEqual([]);
  });
  it('tags and toasts are never sodium', () => {
    expect(sodiumIn(render(<Tag label="You" tone="selected" />).container)).toEqual([]);
    expect(sodiumIn(render(<Toast message="Link copied" action={{ label: 'Undo', onPress: noop }} />).container)).toEqual([]);
  });
  it('the check is real: a primary Button is sodium', () => {
    const { Button } = jest.requireActual('../src/components/ds') as typeof import('../src/components/ds');
    expect(sodiumIn(render(<Button label="Post meet" onPress={noop} />).container).length).toBeGreaterThan(0);
  });
});
