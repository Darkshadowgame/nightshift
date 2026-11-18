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

import { Callout, DetailHero, textSafe } from '../src/components/Detail';
import { ActionBar, Button, DateTimeSheet, DsText, GoingStrip, HeaderActions, Hero, LocationLine, PhotoCard, plusShim, SheetPanel } from '../src/components/ds';
import { splitFooter } from '../src/components/ds/Sheet';

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

/**
 * The Redesign 2 foundation components render their words in Text (no raw text in a View, which
 * throws on iOS) and say what the plan says.
 */
type Node = { type?: unknown; props?: Record<string, unknown>; children?: unknown[] };
function find(node: unknown, pred: (n: Node) => boolean): Node[] {
  const n = node as Node;
  if (!n || typeof n !== 'object') return [];
  return [...(pred(n) ? [n] : []), ...(n.children ?? []).flatMap((c) => find(c, pred))];
}
const labelled = (root: { container: unknown }, label: string) => find(root.container, (n) => n.props?.accessibilityLabel === label);
const noop = () => {};
/** Press a Pressable's host view (onClick runs its onPress). */
const tap = (root: { container: unknown }, label: string) => act(() => (labelled(root, label)[0].props!.onClick as (e: unknown) => void)({ nativeEvent: {} }));

describe('ActionBar', () => {
  it('stacks the primary over the secondary', () => {
    const root = render(<ActionBar primary={{ label: 'Check in', onPress: noop }} secondary={{ label: 'Navigate', onPress: noop }} />);
    expect(texts(root.container)).toEqual(['Check in', 'Navigate']);
  });
  it('shows a status pill instead of a disabled primary', () => {
    const root = render(<ActionBar status="Location at 21:30" secondary={{ label: 'Remind me', onPress: noop }} />);
    expect(texts(root.container)).toEqual(['Location at 21:30', 'Remind me']);
  });
  it('renders nothing with nothing to do', () => {
    const root = render(<ActionBar />);
    expect(texts(root.container)).toEqual([]);
  });
});

describe('Sheet footer (REVIEW-11: a sheet primary is never scrolled away)', () => {
  it('lifts a trailing ActionBar or block primary out of the scroll', () => {
    expect(splitFooter([<DsText key="a">Body</DsText>, <ActionBar key="b" primary={{ label: 'Add', onPress: noop }} />]).footer).not.toBeNull();
    expect(splitFooter([<DsText key="a">Body</DsText>, <Button key="b" label="Add" block onPress={noop} />]).footer).not.toBeNull();
    expect(splitFooter([<DsText key="a">Body</DsText>, <Button key="b" label="Keep it" tier="secondary" block onPress={noop} />]).footer).toBeNull();
    expect(splitFooter([<Button key="b" label="More" tier="tertiary" onPress={noop} />, <DsText key="a">Body</DsText>]).footer).toBeNull();
  });
  it('still draws the primary, after the body', () => {
    const root = render(
      <SheetPanel title="Add a mod" onClose={noop}>
        <DsText>Pick a part</DsText>
        <Button label="Add cold air intake" block onPress={noop} />
      </SheetPanel>,
    );
    const t = texts(root.container);
    expect(t.indexOf('Add cold air intake')).toBeGreaterThan(t.indexOf('Pick a part'));
  });
});

describe('LocationLine', () => {
  it('says the 4.11 sentence and one note', () => {
    const root = render(<LocationLine state="shown" point="Leisure park car park" town="Tamworth" note="Check-in opens at 21:30." />);
    expect(texts(root.container).join('')).toBe('Leisure park car park, Tamworth. Check-in opens at 21:30.');
    const hidden = render(<LocationLine state="hidden" time="21:30" minutesTo={20} />);
    expect(texts(hidden.container).join('')).toBe('Location shows at 21:30 (in 20 min).');
  });
});

describe('GoingStrip', () => {
  it('shows six faces, +N for the rest, and the summary', () => {
    const people = Array.from({ length: 9 }, (_, i) => ({ id: String(i), handle: `p${i}` }));
    const root = render(<GoingStrip people={people} summary="9 going · 7 cars, 2 bikes" onPress={noop} />);
    const all = texts(root.container);
    expect(all).toContain('+3');
    expect(all).toContain('9 going · 7 cars, 2 bikes');
  });
});

describe('PhotoCard', () => {
  it('draws an event with the live kind line, title, meta and one action', () => {
    const root = render(
      <PhotoCard kind="event" live eyebrow="Meet" title="Car park meet-up" meta="Live · until 23:00 · 2 mi · 9 going" tag={{ label: 'Going', tone: 'success' }} action={{ label: 'Open', onPress: noop }} onPress={noop} />,
    );
    expect(texts(root.container)).toEqual(['Going', 'Live · Meet', 'Car park meet-up', 'Live · until 23:00 · 2 mi · 9 going', 'Open']);
    expect(labelled(root, 'Live, Meet, Car park meet-up, Live · until 23:00 · 2 mi · 9 going, Going')).not.toHaveLength(0);
  });
  it('puts a build title on the photo, with its class', () => {
    const root = render(<PhotoCard kind="build" titleOnPhoto classLetter="A" paint="#c8102e" title="Ford Fiesta ST Mk8" meta="197 bhp · 3 mods" />);
    expect(texts(root.container)).toEqual(expect.arrayContaining(['A', 'Ford Fiesta ST Mk8', '197 bhp · 3 mods']));
  });
});

describe('Hero', () => {
  it('words only: kind, title, meta', () => {
    const root = render(<Hero eyebrow="Crew" title="Midlands Night Crew" meta={['12 members', null, 'Around Birmingham']} />);
    expect(texts(root.container)).toEqual(['Crew', 'Midlands Night Crew', '12 members', 'Around Birmingham']);
  });
  it('DetailHero is a Hero and no longer draws a Sample tag', () => {
    const root = render(<DetailHero kind="Meet" sample title="Car park meet-up" lines={['Tonight 22:00']} status={{ label: 'Going', tone: 'success' }} />);
    expect(texts(root.container)).toEqual(['Meet', 'Going', 'Car park meet-up', 'Tonight 22:00']);
  });
});

describe('DateTimeSheet', () => {
  it('changes the day, the hour and the minutes', () => {
    const now = new Date(2026, 10, 20, 21, 10); // Friday
    const picks: Date[] = [];
    const value = new Date(2026, 10, 22, 10, 0);
    const root = render(<DateTimeSheet visible title="Starts" now={now} value={value} onChange={(d) => picks.push(d)} onClose={noop} />);
    tap(root, 'Tomorrow, Sat 21 Nov');
    expect(picks[0]).toEqual(new Date(2026, 10, 21, 10, 0));
    tap(root, '20:00');
    expect(picks[1]).toEqual(new Date(2026, 10, 22, 20, 0));
    tap(root, ':30, 3 of 4');
    expect(picks[2]).toEqual(new Date(2026, 10, 22, 10, 30));
    expect(texts(root.container)).toContain('Sun 10:00');
  });
  it('greys out days before minDate', () => {
    const now = new Date(2026, 10, 20, 21, 10);
    const root = render(<DateTimeSheet visible now={now} minDate={new Date(2026, 10, 21, 0, 0)} value={null} onChange={noop} onClose={noop} />);
    expect(labelled(root, 'Today, Fri 20 Nov')[0].props!.accessibilityState).toMatchObject({ disabled: true });
  });
  it('puts the weekday on Today and Tomorrow, so a demo Friday reads as Friday', () => {
    const now = new Date(2026, 10, 20, 21, 10);
    const root = render(<DateTimeSheet visible now={now} value={null} onChange={noop} onClose={noop} />);
    const t = texts(root.container);
    expect(t).toEqual(expect.arrayContaining(['Today', 'Fri 20', 'Tomorrow', 'Sat 21', 'Sun', '22']));
  });
  it('says an end in the small hours after the start as "after midnight" (4.10)', () => {
    const now = new Date(2026, 10, 20, 21, 10);
    const start = new Date(2026, 10, 20, 22, 0);
    const end = new Date(2026, 10, 21, 1, 0);
    const root = render(<DateTimeSheet visible now={now} after={start} value={end} onChange={noop} onClose={noop} />);
    expect(texts(root.container)).toContain('01:00 (after midnight)');
    expect(texts(root.container)).not.toContain('Tonight 01:00');
  });
});

describe('header "+" (4.1)', () => {
  it('turns an old "+ New" text action into the + icon', () => {
    const onPress = noop;
    expect(plusShim({ label: '+ New', accessibilityLabel: 'Add a car or bike', onPress })).toEqual({ add: { label: 'Add a car or bike', onPress } });
    expect(plusShim({ label: 'Share', onPress })).toEqual({ action: { label: 'Share', onPress } });
    const root = render(<HeaderActions action={{ label: '+ New', accessibilityLabel: 'Host a meet', onPress }} bell />);
    expect(texts(root.container)).toEqual([]);
    expect(labelled(root, 'Host a meet')).not.toHaveLength(0);
  });
});

